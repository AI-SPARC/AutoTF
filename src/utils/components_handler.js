import { Component } from "../components/component.js";
import { Connection } from "../components/connection.js";
import { Capacitor } from "../components/electrical/capacitor.js";
import { CurrentSource } from "../components/electrical/current_source.js";
import { Inductor } from "../components/electrical/inductor.js";
import { Resistor } from "../components/electrical/resistor.js";
import { VoltageSource } from "../components/electrical/voltage_source.js";
import { Joint } from "../components/joint.js";
import { DFSContext } from "../controls/dfs_context.js";
import { LinkGraphContext } from "../controls/link_graph_context.js";
import { SystemContext } from "../controls/system_context.js";
import { DfsNode } from "../dfs_components/dfs_node.js";
import { DfsProcedure } from "../dfs_components/dfs_procedure.js";
import { GraphComponent } from "../graph_components/graph_component.js";
import { GraphNode } from "../graph_components/graph_node.js";

export function checkSelectedGraphItems(mouseX, mouseY){
  LinkGraphContext.itemSelected = null;

  LinkGraphContext.graphComponents.forEach(function(c){
    if(c instanceof GraphComponent || c instanceof GraphNode)
      c.selected = false;
  });
  LinkGraphContext.graphComponents.forEach(function(c){
    if(c instanceof GraphComponent || c instanceof GraphNode){
      if(c.isSelected(mouseX, mouseY)){
        LinkGraphContext.itemSelected = c;
      }
    }
  });
  return LinkGraphContext.itemSelected != null;
}

export function checkSelectedDfsItems(mouseX, mouseY){
  DFSContext.itemSelected = null;

  DFSContext.graphComponents.forEach(function(c){
    if(c instanceof DfsNode || c instanceof DfsProcedure)
      c.selected = false;
  });
  DFSContext.graphComponents.forEach(function(c){
    if(c instanceof DfsNode || c instanceof DfsProcedure){
      if(c.isSelected(mouseX, mouseY)){
        DFSContext.itemSelected = c;
      }
    }
  });
  return DFSContext.itemSelected != null;
}
export function checkSelectedItems(mouseX, mouseY){
  unselectItems();
  let isSelected = checkSelectedComponent(mouseX, mouseY);
  if(!isSelected){
    isSelected = checkSelectedConnection(mouseX, mouseY);
  }
  if(SystemContext.itemSelected instanceof Component){
    $('.btn-component-tools').removeClass('disabled');
  }else if(SystemContext.itemSelected instanceof Joint || SystemContext.itemSelected instanceof Connection){
    $('.btn-component-tools').addClass('disabled');
    $('#btnDeleteComponent').removeClass('disabled');
  }else{
    $('.btn-component-tools').addClass('disabled');
  }
  return isSelected;
}

export function checkSelectedConnectors(mouseX, mouseY){
  unselectItems();
  let isSelected = false;
  Component.list.forEach(function(c, i){
    let connSelected = null;
    if(c instanceof Component){
      connSelected = c.isConnectorSelected(mouseX, mouseY);
    }else{
      connSelected = c.isSelected(mouseX, mouseY);
    }
    if(connSelected != null){
      SystemContext.itemSelected = connSelected;
      // connectorSelected = [parseInt(i), connSelected.id];
      isSelected = true;
    }
  });
  return isSelected;
};

export function deleteSelectedComponent(){
  if(SystemContext.itemSelected != null){
    if(SystemContext.itemSelected instanceof Component){
      for(let i = 0; i < Connection.list.length; i++){
        let conn = Connection.list[i];
        if(conn.connectorA.parent === SystemContext.itemSelected || conn.connectorB.parent === SystemContext.itemSelected){
          Connection.list = Connection.list.filter(item => item !== conn);
          i = -1;
        }
      }
      Component.list = Component.list.filter(item => item !== SystemContext.itemSelected);
    }else if(SystemContext.itemSelected instanceof Connection){
      Connection.list = Connection.list.filter(item => item !== SystemContext.itemSelected);
    }else if (SystemContext.itemSelected instanceof Joint){
      for(let i = 0; i < Connection.list.length; i++){
        let conn = Connection.list[i];
        if(conn.connectorA === SystemContext.itemSelected || conn.connectorB === SystemContext.itemSelected){
          Connection.list = Connection.list.filter(item => item !== conn);
          i = -1;
        }
      }
      Component.list = Component.list.filter(item => item !== SystemContext.itemSelected);
    }
    SystemContext.draw();
  }
}

// Generate new component object according with name parameter, having x and y as initial position
export function generateComponent(name, x, y){
  switch(name){
    case 'Joint':
      return new Joint(x, y);
    case 'Resistor':
      return new Resistor(x, y);
    case 'Capacitor':
      return new Capacitor(x, y)
    case 'Inductor':
      return new Inductor(x, y)
    case 'VoltageSource':
      return new VoltageSource(x, y)
    case 'CurrentSource':
      return new CurrentSource(x, y)
  }
  return null;
}
export function unselectItems() {
  SystemContext.itemSelected = null;
  // connectorSelected = null;
  Component.list.forEach(function(c){
    c.unselect();
  })
  Connection.list.forEach(function(c){
    c.selected = false;
  })
}

function checkSelectedComponent(mouseX, mouseY) {
  let isSelected = false;
  Component.list.forEach(function(c){
    if (c.isSelected(mouseX, mouseY)) {
      SystemContext.itemSelected = c;
      isSelected = true;
    }
  });
  return isSelected;
}

function checkSelectedConnection(mouseX, mouseY) {
  let isSelected = false;
  Connection.list.forEach(function(c){
    if(c.isSelected(mouseX, mouseY)){
      SystemContext.itemSelected = c;
      isSelected = true;
    }
  });
  return isSelected;
}