import { CurrentSource } from "../components/electrical/current_source";
import { VoltageSource } from "../components/electrical/voltage_source";
import { LinkGraphContext } from "../controls/link_graph_context";

export class GraphComponent {
  constructor(id, uuid, gain, value, classId, type, x, y){
    this.id = id;
    this.gain = gain;
    this.uuid = uuid;
    this.value = value;
    this.type = type; // E | I | Z -> Shown on link graph
    this.classId = classId; // Impedance | FlowFont | EffortFont | ControlledFlowFont | ControlledEffortFont | 1-TransformerPort | 2-TransformerPort | 1-RotatorPort | 2-RotatorPort | 1-GenericDoublePort | 2-GenericDoublePort
    this.selected = false;
    this.width = 30;
    this.height = 30;
    this.x = x;
    this.y = y;
    this.middleX = x + this.width/2;
    this.middleY = y + this.height/2;
    this.originNode = null;
    this.destinationNode = null;
  }

  static findOrCreate(component){
    let graphComponent = LinkGraphContext.graphComponents.find(function(c){
      return c.uuid == component.uuid;
    });
    if(graphComponent == undefined){
      let isCurrentSource = component instanceof CurrentSource;
      let isVoltageSource = component instanceof VoltageSource;
      let classId, type;
      if(isCurrentSource){
        classId = 'FlowFont';
        type = 'I';
      }else if(isVoltageSource){ 
        classId = 'EffortFont';
        type = 'E';
      }else{
        classId = 'Impedance';
        type = 'Z';
      }
      let value = "("+component.value+"*10^"+component.unitPrefix.exp+")";
      graphComponent = new GraphComponent(component.id, component.uuid, component.transferFunction.replace('X', component.id), value, classId, type, component.x, component.y);
      LinkGraphContext.graphComponents.push(graphComponent);
    }
    return graphComponent;
  }

  draw(context){
    context.strokeStyle = this.selected ? '#0000ff' : '#000000';
    context.fillStyle = '#ffffff';
    context.setLineDash([10, 10]);
    context.lineWidth = 3;
    context.fillRect(this.x, this.y, this.width, this.height);
    context.strokeRect(this.x, this.y, this.width, this.height);

    context.fillStyle = this.selected ? '#0000ff' : '#000000';
    context.font = "16px Arial";
    context.textAlign = 'center';
    context.fillText(this.gain, this.middleX, this.y - 10);
    context.fillText(this.type, this.middleX, this.middleY + 5);
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
    if (x >= this.x - initialGap && x <= this.x + this.width + endGap && y >= this.y - initialGap && y <= this.y + this.height + endGap) {
      return true;
    }
    return false;
  }

  setPosition(x, y){
    this.x = x;
    this.y = y;
    this.middleX = x + this.width/2;
    this.middleY = y + this.height/2;
  }

}