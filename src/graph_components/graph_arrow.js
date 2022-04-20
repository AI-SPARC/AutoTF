import { LinkGraphContext } from "../controls/link_graph_context.js";

export class GraphArrow {
  constructor(component1, component2){
    this.component1 = component1;
    this.component2 = component2;
  }

  static generate(element, node, polarity){ // polarity: 1 - negative, 2 - positive
    let direction; // 0 - to component; 1 - from component
    direction = (((element.type == 'Z' || element.type == 'I') && polarity == 1) || (element.type == 'E' && polarity == 2)) ? 0 : 1;
    let newArrow;
    if(direction == 0){
      newArrow = new GraphArrow(node, element);
    }else{
      newArrow = new GraphArrow(element, node);
    }
    LinkGraphContext.graphComponents.push(newArrow);
    return newArrow;
  }

  draw(context){
    let x0 = this.component1.middleX;
    let y0 = this.component1.middleY;
    let xf = this.component2.middleX;
    let yf = this.component2.middleY;
    let headlen = 10; // length of head in pixels
    let dx = xf - x0;
    let dy = yf - y0;
    let angle = Math.atan2(dy, dx);
    let middleX = (x0 + xf)/2;
    let middleY = (y0 + yf)/2;
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(xf, yf);
    context.stroke();
    context.moveTo(middleX, middleY);
    context.lineTo(middleX - headlen * Math.cos(angle - Math.PI / 6), middleY - headlen * Math.sin(angle - Math.PI / 6));
    context.stroke();
    context.moveTo(middleX, middleY);
    context.lineTo(middleX - headlen * Math.cos(angle + Math.PI / 6), middleY - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();
  }
}