import { SystemContext } from "./system_context";
import { Component } from "../components/component";
import { checkSelectedItems, checkSelectedConnectors, generateComponent } from "../utils/components_handler";
import { Connector } from "../components/connector";
import { Joint } from "../components/joint";
import { Connection } from "../components/connection";
import { State } from "./state";
import { unitPrefixes } from "../utils/unit_prefix";
export function initializeCanvas(){

  // Change canvas width and height attributes to fill entire window
  $('#systemCanvas').css('top', $('#topbar').css('height'));
  SystemContext.context.canvas.width  = window.screen.availWidth + $('#componentsPanel').width();
  SystemContext.context.canvas.height = window.screen.availHeight - $('#topbar').height();

  // Define user mouse events on canvas
  $("#systemCanvas").on('click', onCanvasClick)
      .on('dblclick', onCanvasDoubleClick)
      .on('mousemove', onCanvasMouseMove)
      .on('mousedown', onCanvasMouseDown);
}

function onCanvasClick(event){
  const rect = SystemContext.canvas.getBoundingClientRect();
  // Remove relative difference of canvas position from mouse position
  event.clientX = event.clientX - rect.left;
  event.clientY = event.clientY - rect.top;
  if(SystemContext.toolSelected == 0){ // SELECT tool is enabled
    if(SystemContext.newComponent === null){ 
      // If new component is null, component creation is not enabled. Then select a component if mouse is over it
      isSelected = checkSelectedItems(event.clientX, event.clientY);
      if (isSelected) {
        // Redraw canvas to show selected component
        SystemContext.draw();
      }
    }else{
      // If new component is not null, there is a non-placed component in same mouse position
      // Click will fix its position adding the new element to array
      Component.list.push(SystemContext.newComponent);
      // Save component classname to trigger another non-placed component of same category after fixed
      let componentClass = SystemContext.newComponent.constructor.name;
      // Set new component to null will avoid shadows components on canvas redraw
      SystemContext.newComponent = null;
      // A new state needs to be defined, so user can undo this action
      State.set();
      // Redraw canvas with the new fixed component
      SystemContext.draw();
      // Create next non-placed component of same category
      SystemContext.newComponent = generateComponent(componentClass);
    }
  }else if(SystemContext.toolSelected == 2){ // CONNECTION CREATION tool is enabled
    // Connection Creation tool only will select connectors and joints
    isSelected = checkSelectedConnectors(event.clientX, event.clientY);
    if(isSelected){
      if(SystemContext.firstSelectedConnector == null){
        // If no other connector was selected previously, mark first connector as origin path
        SystemContext.firstSelectedConnector = SystemContext.itemSelected;
      }else{
        // If another connector is already selected, the second selection will close connection
        if(SystemContext.itemSelected !== SystemContext.firstSelectedConnector){ 

          // Component connectors can have only one connection associated with it. 
          // If another connection already exists, it must be removed.
          if(SystemContext.firstSelectedConnector instanceof Connector){
            for(let i = 0; i < Connection.list.length; i++){
              let conn = Connection.list[i];
              if(conn.connectorA === SystemContext.firstSelectedConnector || conn.connectorB === SystemContext.firstSelectedConnector){
                Connection.list = Connection.list.filter(item => item !== conn);
                break;
              }
            }
          }
          if(SystemContext.itemSelected instanceof Connector){
            for(let i = 0; i < Connection.list.length; i++){
              let conn = Connection.list[i];
              if(conn.connectorA === SystemContext.itemSelected || conn.connectorB === SystemContext.itemSelected){
                Connection.list = Connection.list.filter(item => item !== conn);
                break;
              }
            }
          }

          // Add new connection to context array
          Connection.list.push(new Connection(SystemContext.firstSelectedConnector, SystemContext.itemSelected));
          // A new state needs to be defined, so user can undo this action
          State.set();
          // Redraw canvas to apply changes 
          SystemContext.draw();
        }
        SystemContext.firstSelectedConnector = null;
      }
    }
  }
}

function onCanvasDoubleClick(event){
  // Remove relative difference of canvas position from mouse position
  const rect = SystemContext.canvas.getBoundingClientRect();
  event.clientX = event.clientX - rect.left;
  event.clientY = event.clientY - rect.top;
  if(SystemContext.toolSelected == 0){
    // SELECT tool is enabled
    isSelected = checkSelectedItems(event.clientX, event.clientY);
    if (isSelected) { // SELECT tool is enabled
      if(SystemContext.itemSelected instanceof Component){ // If component is selected, open configurations modal
        let modal = new bootstrap.Modal(document.getElementById('modalComponentAttr'), {});
        // Set modal components according selected item
        $('#modal-title').html('Editar '+SystemContext.itemSelected.name);
        $('#id-input').val(SystemContext.itemSelected.id);
        $('#value-input').val(SystemContext.itemSelected.value);

        // Fill unit select according selected item type
        let htmlSelect = '';
        for(let i=0; i<unitPrefixes.length; i++){
          let prefix = unitPrefixes[i];
          if(SystemContext.itemSelected.unitPrefix.exp == prefix.exp){
            htmlSelect += '<option selected value="'+i+'">'+prefix.symbol+SystemContext.itemSelected.unit+'</option>'
          }else{
            htmlSelect += '<option value="'+i+'">'+prefix.symbol+SystemContext.itemSelected.unit+'</option>'
          }
        }
        $('#select-unit').html(htmlSelect);

        // Define listener to update component properties when save button is clicked
        $('#btnSave').on('click', function(){
          // All inputs must be filled to allow saving 
          if($('#value-input').val() != '' || ('#id-input').val() != ''){
            SystemContext.itemSelected.id = $('#id-input').val();
            SystemContext.itemSelected.value = parseFloat($('#value-input').val());
            SystemContext.itemSelected.unitPrefix = unitPrefixes[parseInt($('#select-unit').val())];
            // A new state needs to be defined, so user can undo this action
            State.set();
            $('#btnSave').off('click');
            // After saving, close modal
            modal.toggle();
            SystemContext.componentModalOpen = false;
            SystemContext.draw();
          }else{
            alert('Preencha todos os campos');
          }
        });
        // Set context variable to indicate modal is open. Necessary to avoid keyboard event conflicts
        SystemContext.componentModalOpen = true;
        // Open modal
        modal.toggle();
      }
      // Redraw canvas to rewrite components properties
      SystemContext.draw();
    }
  }
}

function onCanvasMouseMove(event){
  // Remove relative difference of canvas position from mouse position
  const rect = SystemContext.canvas.getBoundingClientRect();
  event.clientX = event.clientX - rect.left;
  event.clientY = event.clientY - rect.top;


  if(SystemContext.draggingWorkspace){
    // If MOVE tool is enabled and flag dragging workspace is true, all canvas elements must change position on mouse move event.
    Component.list.forEach(function(c, i){
      c.setPosition(SystemContext.componentXs[i] + (event.clientX - SystemContext.clickPositionX), SystemContext.componentYs[i] + (event.clientY - SystemContext.clientPositionY));
    });
    // To each new mouse position, redraw elements to update their position on canvas.
    SystemContext.draw();
  }else if(SystemContext.draggingComponent){
    // If SELECT tool is enabled and dragging component flag is enabled, change selected item position according mouse position.
    SystemContext.itemSelected.setPosition(event.clientX - (SystemContext.clickPositionX - SystemContext.componentPositionX), event.clientY - (SystemContext.clientPositionY - SystemContext.componentPositionY));
    SystemContext.draw();
  }else if(SystemContext.toolSelected == 2){
    // If CONNECTION CREATION tool is enabled, mouse position must be checked to verify if it is over some connector
    let finalRes = false;
    Component.list.forEach(function(c){
      let res;
      // For each connector/joint is verified if mouse is over. 
      if(c instanceof Joint){
        res = c.isMouseOver(event.clientX, event.clientY);
      }else{
        res = c.isMouseOverConnector(event.clientX, event.clientY);
      }
      finalRes = finalRes || res;
    });
  
    // Change mouse cursor style if it is over some connector
    if(finalRes){
      SystemContext.canvas.style.cursor = "pointer";
    }else{
      SystemContext.canvas.style.cursor = "default";
    }
    // Redraw elements to show marker on connector or joint indicating mouse is over, and that element is clickable
    SystemContext.draw();
    // If first connector has already been selected, a temporary path must be drawn between this connector and mouse
    if(SystemContext.firstSelectedConnector != null){
      SystemContext.context.beginPath();
      SystemContext.context.moveTo(SystemContext.firstSelectedConnector.centerX, SystemContext.firstSelectedConnector.centerY);
      SystemContext.context.lineTo(event.clientX, event.clientY);
      SystemContext.context.lineWidth = 3;
      SystemContext.context.strokeStyle = '#444444';
      SystemContext.context.stroke(); 
    }
  }else{
    if(SystemContext.newComponent !== null){
      // If there is a non placed component in creation mode, update its position according mouse movement
      SystemContext.newComponent.setPosition(event.clientX , event.clientY);
      SystemContext.draw();
      SystemContext.newComponent.draw(SystemContext.context);
    }
  }
}

function onCanvasMouseDown(event){
  // Remove relative difference of canvas position from mouse position
  const rect = SystemContext.canvas.getBoundingClientRect();
  event.clientX = event.clientX - rect.left;
  event.clientY = event.clientY - rect.top;

  if(SystemContext.toolSelected == 0){
    // If SELECT tool is enabled
    if(SystemContext.newComponent === null){
      // Verify if there is any selected item
      isComponentSelected = checkSelectedItems(event.clientX, event.clientY);
      if (isComponentSelected) {
        if(SystemContext.itemSelected instanceof Component || SystemContext.itemSelected instanceof Joint){
          // If component or joint is selected, its current position needs to be stored 
          // to define new positions on mouse move event listener
          let c = SystemContext.itemSelected;
          SystemContext.componentPositionX = c.x;
          SystemContext.componentPositionY = c.y;
          SystemContext.clickPositionX = event.clientX;
          SystemContext.clientPositionY = event.clientY;
          //
          // Set dragging component flag to true (used on mouse move event listener)
          SystemContext.draggingComponent = true;

          // Define listener to execute when mouse button is released
          $("#systemCanvas").on('mouseup', function () {
            // The item isn't being dragged anymore, so set flag to false
            SystemContext.draggingComponent = false;
            
            // Condition to verify if a new state will be generated. Is not needed in case of component position is the same
            if(SystemContext.itemSelected.x != SystemContext.componentPositionX || SystemContext.itemSelected.y != SystemContext.componentPositionY)
              State.set();
            // This listener must be disabled to avoid conflict with other mouseup events
            $(this).off('mouseup');
          });
        } 
      } else {
        // In case of no object selected, redraw canvas will remove any selection previously created
        SystemContext.draw();
      }
    }
  }else if(SystemContext.toolSelected == 1){
    // If MOVE tool is selected

    // Change cursor to closed hand
    SystemContext.canvas.style.cursor = "grabbing";

    // Mouse initial grabbing position needs to be stored to calculate objects new relative positions
    SystemContext.clickPositionX = event.clientX;
    SystemContext.clientPositionY = event.clientY;

    // All components current position must be stored to define new components position on mouse move event listener
    SystemContext.componentXs = [];
    SystemContext.componentYs = [];
    Component.list.forEach(function(c){
      SystemContext.componentXs.push(c.x);
      SystemContext.componentYs.push(c.y);
    });

    // Set dragging workspace flag to true (used on mouse move event listener)
    SystemContext.draggingWorkspace = true;
    
    // Define listener to execute when mouse button is released
    $("#systemCanvas").on('mouseup', function () {
      // Canvas isn't being dragged anymore, so set flag to false
      SystemContext.draggingWorkspace = false;
      // A new state needs to be defined, so user can undo this action
      State.set();
      // This listener must be disabled to avoid conflict with other mouseup events
      $(this).off('mouseup');
      // Change back cursor to open hand
      SystemContext.canvas.style.cursor = "grab";
    });
  }
}