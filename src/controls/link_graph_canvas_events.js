import { Joint } from "../components/joint";
import { GraphArrow } from "../graph_components/graph_arrow";
import { GraphComponent } from "../graph_components/graph_component";
import { GraphNode } from "../graph_components/graph_node";
import { checkSelectedGraphItems } from "../utils/components_handler";
import { generateUUID } from "../utils/generators";
import { LinkGraphContext } from "./link_graph_context";
import { generateLinkGraphAux, getRelatedGroups } from "../utils/graph_utils";
import { DFSContext } from "./dfs_context";

export function initializeLinkGraphCanvas(){
  LinkGraphContext.graphCanvas = document.getElementById('linkGraphCanvas');
  LinkGraphContext.graphContext = LinkGraphContext.graphCanvas.getContext('2d');

  LinkGraphContext.graphCanvas.width  = window.screen.availWidth + 200;
  LinkGraphContext.graphCanvas.height = window.screen.availHeight;

  LinkGraphContext.graphCanvas.style.cursor = "grab";


  $('#linkGraphCanvas').on('mousedown', function (event) {
    const rect = LinkGraphContext.graphCanvas.getBoundingClientRect();
    event.clientX = event.clientX - rect.left;
    event.clientY = event.clientY - rect.top;
    LinkGraphContext.graphCanvas.style.cursor = "grabbing";
    if(LinkGraphContext.itemSelected != null){
      let c = LinkGraphContext.itemSelected;
      LinkGraphContext.componentPositionX = c.x;
      LinkGraphContext.componentPositionY = c.y;
      LinkGraphContext.clickPositionX = event.clientX;
      LinkGraphContext.clientPositionY = event.clientY;
    }else{
      LinkGraphContext.clickPositionX = event.clientX;
      LinkGraphContext.clientPositionY = event.clientY;
      LinkGraphContext.componentXs = [];
      LinkGraphContext.componentYs = [];
      LinkGraphContext.graphComponents.forEach(function(c){
        if(c instanceof GraphArrow){
          LinkGraphContext.componentXs.push(-1); // arrow has no coordinate x
          LinkGraphContext.componentYs.push(-1); // arrow has no coordinate y
        }else{
          LinkGraphContext.componentXs.push(c.x);
          LinkGraphContext.componentYs.push(c.y);
        }
      });
    }
    LinkGraphContext.dragging = true;
  }).on('mouseup', function () {
    LinkGraphContext.dragging = false;
    LinkGraphContext.graphCanvas.style.cursor = "grab";
  }).on('mousemove', function(evt){
    const rect = LinkGraphContext.graphCanvas.getBoundingClientRect();
    evt.clientX = evt.clientX - rect.left;
    evt.clientY = evt.clientY - rect.top;
    if(LinkGraphContext.dragging){
      if(LinkGraphContext.itemSelected == null){
        LinkGraphContext.graphComponents.forEach(function(c, i){
          if(!(c instanceof GraphArrow))
            c.setPosition(LinkGraphContext.componentXs[i] + (evt.clientX - LinkGraphContext.clickPositionX), LinkGraphContext.componentYs[i] + (evt.clientY - LinkGraphContext.clientPositionY));
        });
        LinkGraphContext.drawGraph();
      }else{
        LinkGraphContext.itemSelected.setPosition(evt.clientX - (LinkGraphContext.clickPositionX - LinkGraphContext.componentPositionX), evt.clientY - (LinkGraphContext.clientPositionY - LinkGraphContext.componentPositionY));
        LinkGraphContext.drawGraph();
      }
    }else{
        checkSelectedGraphItems(evt.clientX, evt.clientY);
        LinkGraphContext.drawGraph();
    }
  });
}

export function generateGraphElements(graph){
  LinkGraphContext.graphComponents = [];
  // Next ID of graph nodes
  LinkGraphContext.nodeIndex = 0;

  // Pairs array will avoid creating twice the same connection
  let pairs = [];

  Object.keys(graph).forEach(function(key){
    graph[key].forEach(function(element){
      let componentA = element.parentObject;
      let componentB = element.object;
      // Validate if component A and B combination are already on pairs array. Avoid to generate duplicated elements
      if(!pairs.includes(componentA.uuid + componentB.uuid + element.parentConnectorId + element.connectorId)){
        // Adds A+B and B+A combinations to pairs array
        pairs.push(componentA.uuid + componentB.uuid + element.parentConnectorId + element.connectorId);
        pairs.push(componentB.uuid + componentA.uuid + element.connectorId + element.parentConnectorId);

        if(componentA instanceof Joint || componentB instanceof Joint){
          // If A or B is a Joint, identify component and joint element. Joint will be the node on link graph
          let jointComp, otherComp, connectorId;
          if(componentA instanceof Joint){
            jointComp = componentA;
            otherComp = componentB;
            connectorId = element.connectorId;
          }else{
            jointComp = componentB;
            otherComp = componentA;
            connectorId = element.parentConnectorId;
          }

          let graphComponent = GraphComponent.findOrCreate(otherComp);
          let graphNode = GraphNode.findOrCreate(jointComp);
          let polarity = (connectorId == 'A') ? 1 : 2;
          let newArrow = GraphArrow.generate(graphComponent, graphNode, polarity);
          if(newArrow.component2.uuid === graphComponent.uuid){
            graphComponent.originNode = graphNode;
          }else{
            graphComponent.destinationNode = graphNode;
          }
        }else{
          // If both elements are components, a new node will be generated to represent the connection between them
          let graphComponentA = GraphComponent.findOrCreate(componentA);
          let graphComponentB = GraphComponent.findOrCreate(componentB);

          // Node initial location will be in the middle of A and B components
          let node = new GraphNode(++LinkGraphContext.nodeIndex, generateUUID(), (graphComponentA.x + graphComponentB.x)/2, (graphComponentA.y + graphComponentB.y)/2);
          LinkGraphContext.graphComponents.push(node);
          
          // Define polarity according component connector and create arrows. 'A' connector: positive
          let polarity = (element.parentConnectorId == 'A') ? 1 : 2;
          let arrow1 = GraphArrow.generate(graphComponentA, node, polarity);   
          polarity = (element.connectorId == 'A') ? 1 : 2;
          let arrow2 = GraphArrow.generate(graphComponentB, node, polarity);
          if(arrow1.component2.uuid === graphComponentA.uuid){
            graphComponentA.originNode = node;
          }else{
            graphComponentA.destinationNode = node;
          }
          if(arrow2.component2.uuid === graphComponentB.uuid){
            graphComponentB.originNode = node;
          }else{
            graphComponentB.destinationNode = node;
          }
        }
      }
    });
  });
  let auxGraph = generateLinkGraphAux(LinkGraphContext.graphComponents);

  let relatedGroups = getRelatedGroups(auxGraph);
  DFSContext.initializeDFS(LinkGraphContext.graphComponents, auxGraph, relatedGroups);
}
