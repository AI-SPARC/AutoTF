import { GraphArrow } from "../graph_components/graph_arrow";
import { generateGraphElements, initializeLinkGraphCanvas } from "./link_graph_canvas_events";

export class LinkGraphContext {
  
  static graphCanvas = null;
  static graphContext = null;
  static graphComponents = [];
  static nodeIndex = 0;

  // DRAGGING VARIABLES
  static dragging = false;
  static itemSelected = null;
  // DRAGGING COMPONENTS VARIABLES
  static componentPositionX;
  static componentPositionY;
  static clickPositionX;
  static clientPositionY;
  // DRAGGING WORKSPACE VARIABLES
  static componentXs = [];
  static componentYs = [];

  static initializeCanvas(graph){
  this.graphComponents = [];
  this.nodeIndex = 0;
  this.dragging = false;
  this.itemSelected = null;
    if(this.graphCanvas == null)
      initializeLinkGraphCanvas();
    this.graphComponents = [];
    generateGraphElements(graph);
    this.graphComponents.sort(function(a, b) {
      if(a instanceof GraphArrow && !(b instanceof GraphArrow))
        return -1;
      if(!(a instanceof GraphArrow) && b instanceof GraphArrow)
        return 1
      return 0;
    });
    this.drawGraph();
  }

  static drawGraph(){
    let context = this.graphContext;
    context.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
    this.graphComponents.forEach(function(c){
      c.draw(LinkGraphContext.graphContext);
    });
  }

}