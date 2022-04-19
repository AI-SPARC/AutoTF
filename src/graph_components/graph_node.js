import { LinkGraphContext } from "../controls/link_graph_context";

export class GraphNode {
  constructor(id, uuid, x, y){
    this.id = id;
    this.uuid = uuid;
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.middleX = x;
    this.middleY = y;
    this.selected = false;
  }

  static findOrCreate(joint){
    let graphNode = LinkGraphContext.graphComponents.find(function(c){
      return c.uuid == joint.uuid;
    });
    if(graphNode == undefined){
      graphNode = new GraphNode(++LinkGraphContext.nodeIndex, joint.uuid, joint.x, joint.y);
      LinkGraphContext.graphComponents.push(graphNode);
    }
    return graphNode;
  }

  draw(context){
    context.beginPath();
    context.setLineDash([]);
    context.fillStyle = '#ffffff';
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    context.lineWidth = 3;
    context.strokeStyle = (this.selected) ? '#0000ff'  : '#000000';
    context.fill();
    context.stroke();

    context.fillStyle = (this.selected) ? '#0000ff'  : '#000000';
    context.font = "16px Arial";
    context.textAlign = 'center';
    context.fillText(this.id, this.x, this.y + 5);
  }

  isSelected(mouseX, mouseY){
    const mouseGap = 10;
    let result = this.hasCoords(mouseX, mouseY, 0, mouseGap);
    if(result) {
      this.selected = true;
    }
    return result;
  }

  hasCoords(x, y, initialGap, endGap){
    let xNode = this.x - this.radius/2;
    let yNode = this.y - this.radius/2;
    if (x >= xNode - initialGap && x <= xNode + this.radius + endGap && y >= yNode - initialGap && y <= yNode + this.radius + endGap) {
      return true;
    }
    return false;
  }

  setPosition(x, y){
    this.x = x;
    this.y = y;
    this.middleX = x;
    this.middleY = y;
  }
}