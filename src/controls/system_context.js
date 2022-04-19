// This file contains code to deal with application context: Global variables and functions to draw, 
// save and load system context.

import { Component } from "../components/component";
import { Connection } from "../components/connection";
import { Joint } from "../components/joint";
import { generateComponent } from "../utils/components_handler";
export class SystemContext{

  // System workspace variables: manage where circuits will be drawn
  static canvas = null;
  static context = null;

  static itemSelected = null;  
  static toolSelected = 0; // 0 - Pointer, 1 - Move, 2 - Connection creator
  static draggingWorkspace = false; // True when drag function is enabled and mouse button is down
  static draggingComponent = false; // True when mouse is down on some component and select function is enabled
  static componentModalOpen = false; // True when component edit modal page is open
  static newComponent = null; // Before a new component is set, this variable keeps it

  static firstSelectedConnector = null; // First of two selected connectors to  complete a new connection

  // DRAGGING COMPONENTS VARIABLES
  static componentPositionX;
  static componentPositionY;
  static clickPositionX;
  static clientPositionY;
  // DRAGGING WORKSPACE VARIABLES
  static componentXs = [];
  static componentYs = [];

  // HTML components need to be initialized before start drawing anything on it
  static initializeContext(){
    this.canvas = document.getElementById('systemCanvas');
    this.context = this.canvas.getContext('2d');
  }


  // Draw system with current configurations
  static draw(){
    let context = this.context;
    // Clean workspace
    context.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas to redraw components and connections with its current states
    // Draw components
    Component.list.forEach(function(component){
      component.draw(context);
    });
    
    // Reset point collisions array since no collision in marked yet
    Connection.pointCollisions = [];

    // Define connections points
    Connection.list.forEach(function(conn){
      conn.setConnectionPath()
    });

    // Draw connections
    Connection.list.forEach(function(conn){
      conn.draw(context);
    });
  }

  // Retrieve json file and redraw objects on canvas. Used on load function
  static fromObject(object){
    Component.list = [];
    Connection.list = [];
    // Recreate components
    object.components.forEach(function(c){
      let newComponent = generateComponent(c.type, c.x, c.y);
      if(c.type != 'Joint'){ // Joints hasn't rotation and connection properties.
        newComponent.id = c.id;
        newComponent.rotation = c.rotation;
        newComponent.setRotated();
        newComponent.connectorA.setSide();
        newComponent.connectorB.setSide();
        newComponent.setPosition(newComponent.x, newComponent.y);
        newComponent.value = c.value;
      }
      newComponent.uuid = c.uuid;
      Component.list.push(newComponent);
    });

    // Recreate connections
    object.connections.forEach(function(c){
      // Search components to associate with connections
      let componentA = Component.list.find(function(c1){
        return c1.uuid == c.componentA_UUID;
      });
      let componentB = Component.list.find(function(c1){
        return c1.uuid == c.componentB_UUID;
      });
      let connectorA, connectorB;
      if(componentA instanceof Joint){ // If component is a joint, connector object is the Joint itself
        connectorA = componentA;
      }else{
        if(c.connectorA_id == 'A'){
          connectorA = componentA.connectorA;
        }else{
          connectorA = componentA.connectorB;
        }
      }  
      if(componentB instanceof Joint){  // If component is a joint, connector object is the Joint itself
        connectorB = componentB;
      }else{
        if(c.connectorB_id == 'A'){
          connectorB = componentB.connectorA;
        }else{
          connectorB = componentB.connectorB;
        }
      }
      Connection.list.push(new Connection(connectorA, connectorB)); // Add to context connections array
    });
    SystemContext.draw();
  }

  // Group all elements drawn on canvas and generate a json file with its properties. Used on save function.
  static toObject(){
    let componentsJson = [];
    let connectionsJson = [];
    Component.list.forEach(function(component){
      componentsJson.push(component.toJsonObject());
    });
    Connection.list.forEach(function(connection){
      connectionsJson.push(connection.toJsonObject());
    });

    let fileContent = {
      components: componentsJson,
      connections: connectionsJson
    }
    return fileContent;
  }

}