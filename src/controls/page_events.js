import { Component } from "../components/component";
import { Connection } from "../components/connection";
import { Joint } from "../components/joint";
import { deleteSelectedComponent, generateComponent, unselectItems } from "../utils/components_handler";
import { saveFile } from "../utils/file_utils";
import { checkFullyConnectedGraph, generateGraphFromSystem } from "../utils/graph_utils";
import { DFSContext } from "./dfs_context";
import { LinkGraphContext } from "./link_graph_context";
import { MasonContext } from "./mason_context";
import { State } from "./state";
import { SystemContext } from "./system_context";

export function initializePageEvents(){
  // BEGIN -> KEYBOARD EVENTS ---------------------------------------------------------------------------------------------------
  $(document).on('keydown', function(e) {
    if (e.key === "Escape") { // escape key maps to keycode `27`
      $(".component-button").removeClass("active"); // ESC cancels new component insertion
      SystemContext.newComponent = null;
      SystemContext.draw();
    } else if(e.key === 'Backspace' || e.key === 'Delete'){ // On mac, backspace is delete key. Used as shortcut to remove an element 
      // Verify if component attributes modal is open. Delete and backspace typed on input can't erase components in canvas
      if(!SystemContext.componentModalOpen){
        deleteSelectedComponent();
        // A new state needs to be defined, so user can undo this action
        State.set();
      }
    }
  });
  // END -> KEYBOARD EVENTS -----------------------------------------------------------------------------------------------------

  // BEGIN -> TOPBAR EVENTS -----------------------------------------------------------------------------------------------------
  // 'NEW' button: All workspace will be cleaned and a new project is started. Confirmation is needed if there is any 
  // component on screen.
  $('#btnNewSystem').on('click', function(){
    // If there is no component on screen, there is no reason to start a new project
    if(Component.list.length > 0){
      if(confirm('Tem certeza que deseja começar o novo projeto? Seu progresso não salvo será perdido!')){
        Component.list = [];
        Connection.list = [];
        SystemContext.draw();
      }
    }
  });

  // 'SAVE png' button: Save a workspace screenshot as PNG file
    $('#btnSavePng').on('click', function(){
    // Create a 'fake' anchor to simulate image download event
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'system.png'); // default filename: system.png
    let compositeOperation = SystemContext.context.globalCompositeOperation; // loads composite operation to rollback this attribute after image generation
    
    // Before drawing background rectangle, set canvas fill color and layer position
    SystemContext.context.globalCompositeOperation = "destination-over";
    SystemContext.context.fillStyle = "#fff";
    
    // Canvas width and height are necessary to define image size
    let w = $('#systemCanvas').width();
    let h = $('#systemCanvas').height();
    
    // Store current image data on a variable, to be recovered after image download
    let data = SystemContext.context.getImageData(0, 0, w, h);

    // Fill white color below existing components to generate image with opaque background
    SystemContext.context.fillRect(0,0,w,h);
    let dataURL = SystemContext.canvas.toDataURL('image/png'); // Downloadable image base64 value
    
    // Recover workspace the way it was before image generation
    SystemContext.context.clearRect (0,0,w,h); 
    SystemContext.context.putImageData(data, 0,0);        
    SystemContext.context.globalCompositeOperation = compositeOperation;
    
    // Changing base64 header to make it as MIME attachment
    let url = dataURL.replace(/^data:image\/png/,'data:application/octet-stream');
    downloadLink.setAttribute('href', url);
    // Simulate fake anchor click to download image
    downloadLink.click();
  });

  // 'SAVE json' button: A Json file is generated according workspace data
  $('#btnSaveJson').on('click', function(){
    saveFile(JSON.stringify(SystemContext.toObject()), 'system.json', 'text/plain');
  });

  // 'LOAD' button: Load a json file to rebuild objects on workspace
  $('#btnLoadFile').on('click', function(){
    // Trigger click event on hidden file input to show file selector window
    $('#openFileInput').trigger('click');
    
    // Add listener to file input. When a new file is selected, it must be read to get saved objects
    $('#openFileInput').on('change', function(e){
      let file = e.target.files[0];
      if(!file){
        return;
      }
      let reader = new FileReader();

      // Execute function below only after selected file is loaded
      reader.onload = function(e){
        try{
          let contents = e.target.result;
          let result = JSON.parse(contents);
          SystemContext.fromObject(result); // Recreate objects and fill context array to be drawn on canvas
        }catch(e){ 
          // If there is an error on JSON parse, show invalid file message
          alert('O arquivo selecionado é inválido');
        }
      }

      // Dispatch reader event to read selected file once file input has changed
      reader.readAsText(file);
      // Remove change event from input file to avoid conflict with another system events
      $('#openFileInput').off('change');
    });
  });

  // 'UNDO' button: Undo last user action
  $('#btnUndo').on('click', function(){
    // Tells context to go back to the state before user's last action
    State.backward();
    // Verify if undo button should be enabled after its click event
    checkUndoRedoEnabled();
    // Redraw canvas to apply undo modifications
    SystemContext.draw();
  });

  // 'REDO' button: Redo last undone user action
  $('#btnRedo').on('click', function(){
    // Tells context to go forward to the last undone state
    State.forward();
    // Verify if redo button should be enabled after its click event
    checkUndoRedoEnabled();
    // Redraw canvas to apply undo modifications
    SystemContext.draw();
  });

  // 'CALCULATE' button: Open modal with system link graph and steps to get transfer function
  $('#btnCalculate').on('click', function(){
    // Calculate modal can't be open if there is no component on graph
    if(Component.list.length == 0){
      alert('Você deve montar o sistema primeiro!');
    }else{
      // Group components and connections array and create graph to perform the calculations
      let graph = generateGraphFromSystem(Component.list, Connection.list);
      // Modal can be opened only if system is valid
      let valid = checkSystemValid(graph);
      if(valid){
        // Link graph also needs a canvas to be drawn. So before open calculate modal, canvas initialization is needed
        LinkGraphContext.initializeCanvas(graph);

        // Open modal
        let modal = new bootstrap.Modal(document.getElementById('modalLinkGraph'), {});
        modal.toggle();
      }else{
        alert('O sistema não é válido');
      }
    }
  });
  // END -> TOPBAR EVENTS -------------------------------------------------------------------------------------------------------

  // BEGIN -> SIDEBAR EVENTS - TOOLS --------------------------------------------------------------------------------------------
  // Tools buttons: Used to change canvas operation mode. (SELECT, MOVE OR CONNECTION CREATION MODE)
  $('.btn-tools').on('click', function(){
    // Clean any existing active new non-placed component
    SystemContext.newComponent = null;
    // Remove active class from all tools buttons to avoid two buttons actived at same time
    $('.btn-tools').removeClass("active");
    // Get button id to define which tool will be active
    setToolActive($(this).attr('id'));
    // Set clicked button as active
    $(this).addClass('active');
  });

  // 'ROTATE LEFT' button: Rotate selected component 90 degrees left
  $('#btnRotateLeft').on('click', function(){
    // Calls rotate left function from selected item
    SystemContext.itemSelected.rotateLeft();
    // A new state needs to be defined, so user can undo this action
    State.set();
    // Redraw canvas to apply changes
    SystemContext.draw();
  });

  // 'ROTATE RIGHT' button: Rotate selected component 90 degrees right
  $('#btnRotateRight').on('click', function(){
    // Calls rotate right function from selected item
    SystemContext.itemSelected.rotateRight();
    // A new state needs to be defined, so user can undo this action
    State.set();
    // Redraw canvas to apply changes
    SystemContext.draw();
  });

  // 'DELETE' button: Removes selected connection or component and its connections from canvas
  $('#btnDeleteComponent').on('click', function(){
    deleteSelectedComponent();
    // A new state needs to be defined, so user can undo this action
    State.set();
  });
  // END -> SIDEBAR EVENTS - TOOLS ----------------------------------------------------------------------------------------------

  // BEGIN -> SIDEBAR EVENTS - COMPONENT CREATION -------------------------------------------------------------------------------
  // 'COMPONENTS CATEGORIES' selectors: Switch elements tab according with their nature (electric, mechanic, hydric or thermal)
  $('.element-type-seletor').on('click', function(){
    // All tabs must be disabled to avoid two active selectors at the same time
    $(".element-type-seletor").removeClass("active");
    $(this).addClass('active');

    // Same active behavior goes for components tabs
    $(".component-tab").removeClass("active");
    switch($(this).attr('id')){
      case 'electricComponents':
        $('#electricTab').addClass('active');
        break;
      case 'mechanicComponents':
        $('#mechanicTab').addClass('active');
        break;
      case 'hydricComponents':
        $('#hydricTab').addClass('active');
        break;
      case 'thermalComponents':
        $('#thermalTab').addClass('active');
        break;
    }
  });

  // New component buttons: Used to add new components on canvas  
  $('.component-button').on('click', function(){
    // Clean any existing active new non-placed component
    $(".component-button").removeClass("active");

    // When creation mode is enabled, SELECT tool must be also enabled
    $('.btn-tools').removeClass("active");
    setToolActive('btnMousePointer');

    // Ative component button while creation mode is enabled
    $(this).addClass('active');

    // Generate a non-placed component to move around canvas according mouse pointer
    SystemContext.newComponent = generateComponent($(this).attr('id').replace('btn',''));
  });

  // END -> SIDEBAR EVENTS - COMPONENT CREATION ---------------------------------------------------------------------------------

  // BEGIN -> CALCULATE MODAL EVENTS --------------------------------------------------------------------------------------------
  // 'EQUATIONS' button: Open modal to show calculated transfer function 
  $('#btnEquations').on('click', function(){
    if(DFSContext.hasSolution){
      $('#inputVariableSelect').val(0);
      $('#outputVariableSelect').val(0);
      $('#id-txtnum').val('');
      $('#id-txtden').val('');
      $('#id-txtval').val('');
      let modal = new bootstrap.Modal(document.getElementById('modalEquations'), {});
      modal.toggle();
    }else{
      alert('O sistema não possui solução')
    }
  });

  $('#btnCalculateTF').on('click', function(){
    let selectedInput = $('#inputVariableSelect').val();
    let selectedOutput = $('#outputVariableSelect').val();
    let selectedXeObject = DFSContext.xe[selectedInput];
    let selectedXsObject = DFSContext.xs[selectedOutput];
    let xeIndex = DFSContext.x.indexOf(selectedXeObject) + 1;
    let xsIndex = DFSContext.x.indexOf(selectedXsObject) + 1;

    MasonContext.findDfsPaths(DFSContext.dfs, xeIndex, xsIndex);
  });
  // END -> CALCULATE MODAL EVENTS ----------------------------------------------------------------------------------------------

}



// Verify if drawn system is valid to generate link graph and DFS matrices
function checkSystemValid(graph){
  let connectorsConnected = true;
  Component.list.forEach(function(c){
    if(c instanceof Joint){
      // Get connections connected to the joint
      let connections = Connection.list.filter(item => (item.connectorA === c) || (item.connectorB === c));
      // To validade system, all joints must have at least 2 connections
      if(connections.length < 2){
        connectorsConnected = false;
        return;
      }
    }else{
      // Get connection associated with component connector A
      let connectionA = Connection.list.filter(item => (c.connectorA === item.connectorA) || (c.connectorA === item.connectorB));
      // Get connection associated with component connector B
      let connectionB = Connection.list.filter(item => (c.connectorB === item.connectorA) || (c.connectorB === item.connectorB));
      // All component connector must be only one connection associated 
      if(connectionA.length != 1 || connectionB.length != 1){
        connectorsConnected = false;
        return;
      }
    }
  });

  // If previous conditions are satisfied, system will be valid if system is fully connected (verify if there is no islands).
  return checkFullyConnectedGraph(graph) && connectorsConnected;
}

// Verify if undo or redo button should be enabled or disabled
function checkUndoRedoEnabled(){
  // If there is no previous state, undo should be disabled
  if(State.current.previousState == null){
    $('#btnUndo').addClass('disabled');
  }else{
    $('#btnUndo').removeClass('disabled');
  }

  // If there is no next state, redo should be disabled
  if(State.current.nextState == null){
    $('#btnRedo').addClass('disabled');
  }else{
    $('#btnRedo').removeClass('disabled');
  }
}

// Define which tool is actived by their ids since tools buttons have same class
function setToolActive(btnId){
  switch(btnId){
    // Mouse cursor will be defined for each case
    // Context variable 'toolSelected' will keep value to validate mode on canvas behaviours 
    case 'btnMousePointer':
      SystemContext.canvas.style.cursor = "default";
      SystemContext.toolSelected = 0;
      break;
    case 'btnMove':
      SystemContext.canvas.style.cursor = "grab";
      SystemContext.toolSelected = 1;
      unselectItems();
      break;
    case 'btnConnectionCreator':
      SystemContext.canvas.style.cursor = "default";
      SystemContext.toolSelected = 2;
      unselectItems();
      break;
    default:
      // Default case: SELECT mode
      SystemContext.canvas.style.cursor = "default";
      btnId = 'btnMousePointer';
      SystemContext.toolSelected = 0;
      break;
  }
  // Any component creation button should be disabled to avoid generating components on a incorrect mode
  $(".component-button").removeClass("active");
  // Define tools button styles to indicate which one is selected
  $('.btn-tools').removeClass("btn-dark");
  $('.btn-tools').addClass("btn-outline-dark");
  $('#'+btnId).removeClass("btn-outline-dark");
  $('#'+btnId).addClass("btn-dark");
}