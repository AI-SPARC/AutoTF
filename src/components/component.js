import { generateComponentId, generateUUID } from '../utils/generators.js';
import { unitPrefixes } from '../utils/unit_prefix.js';
import { Connector } from './connector.js';
export class Component {

    static list = [];
    constructor(idSymbol, componentName, initialX, initialY, width, height, imgName, initialRotation, initialValue, unit, transferFunction) {
      this.uuid = generateUUID();
      this.id = generateComponentId(idSymbol);
      this.name = componentName;
      this.x = initialX;
      this.y = initialY;
      this.width = width;
      this.height = height;
      this.imgName = imgName;
      this.selected = false;
      this.rotation = initialRotation;
      this.value = initialValue;
      this.unit = unit;
      this.unitPrefix = unitPrefixes[3]; // NO PREFIX
      this.transferFunction = transferFunction;
      this.setRotated();
      let connPositionA = this.getConnectorPosition('A');
      let connPositionB = this.getConnectorPosition('B');
      this.connectorA = new Connector('A', connPositionA[0], connPositionA[1], this);
      this.connectorB = new Connector('B', connPositionB[0], connPositionB[1], this);
    }

    draw(context){
      let width = (this.rotated) ? this.height : this.width;
      let height = (this.rotated) ? this.width : this.height;
      let image = document.getElementById(this.imgName + this.rotation);
      this.drawText(context);
      context.drawImage(image, this.x, this.y, width, height);  
      if (this.selected) {
        context.strokeStyle = '#0000ff';
        context.lineWidth = 3;
        let selectionGap = 5;
        context.strokeRect(this.x-selectionGap/2, this.y-selectionGap/2, width+selectionGap, height+selectionGap);
      }
      this.drawConnectors(context);
    }

    drawText(context){
      context.fillStyle = '#000000';
      context.font = "12px Arial";
      if(this.rotated){
        context.textAlign = 'right';
        context.fillText(this.id, this.x-10, this.y + this.width/2 );
        context.fillText(this.value+" "+this.unitPrefix.symbol+this.unit, this.x-10, this.y + this.width/2 + 15);
      }else{
        context.textAlign = 'center';
        context.fillText(this.id, this.x + this.width/2, this.y - 25);
        context.fillText(this.value+" "+this.unitPrefix.symbol+this.unit, this.x + this.width/2, this.y - 10);
      }
    }

    drawConnectors(context){
      if(this.connectorA != null)
        this.connectorA.draw(context);
      if(this.connectorB != null)
        this.connectorB.draw(context);
    }

    getConnectorPosition(_){}

    isMouseOverConnector(mouseX, mouseY){
      return this.connectorA.isMouseOver(mouseX, mouseY) || this.connectorB.isMouseOver(mouseX, mouseY);
    }
    isConnectorSelected(mouseX, mouseY){
      if(this.connectorA.isSelected(mouseX, mouseY)){
        return this.connectorA;
      }else if(this.connectorB.isSelected(mouseX, mouseY)){
        return this.connectorB;
      }else{
        return null;
      }
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
      let width = (this.rotated) ? this.height : this.width;
      let height = (this.rotated) ? this.width : this.height;
      if (x >= this.x - initialGap && x <= this.x + width + endGap && y >= this.y - initialGap && y <= this.y + height + endGap) {
        return true;
      }
      return false;
    }

    hasCoordX(x, initialGap, endGap){
      let width = (this.rotated) ? this.height : this.width;
      if (x >= this.x - initialGap && x <= this.x + width + endGap) {
        return true;
      }
      return false;
    }

    hasCoordY(y, initialGap, endGap){
      let height = (this.rotated) ? this.width : this.height;
      if (y >= this.y - initialGap && y <= this.y + height + endGap) {
        return true;
      }
      return false;
    }

    unselect(){
      this.selected = false;
      this.unselectConnectors();
    }
    realWidth(){
      return (this.rotated) ? this.height : this.width;
    }

    realHeight(){
      return (this.rotated) ? this.width : this.height;
    }

    rotateRight(){
      this.rotation = this.rotation + 1;
      if(this.rotation == 5)
        this.rotation = 1;
      if(this.rotation == 2 || this.rotation == 4){
        this.rotated = true;
      }else{
        this.rotated = false;
      }
      this.connectorA.setSide();
      this.connectorB.setSide();
      this.setPosition(this.x, this.y);
    }

    rotateLeft(){
      this.rotation = this.rotation - 1;
      if(this.rotation == 0)
        this.rotation = 4;
      if(this.rotation == 2 || this.rotation == 4){
        this.rotated = true;
      }else{
        this.rotated = false;
      }
      this.connectorA.setSide();
      this.connectorB.setSide();
      this.setPosition(this.x, this.y);
    }

    setPosition(x, y){
      this.x = x;
      this.y = y;
      let connPositionA = this.getConnectorPosition('A');
      let connPositionB = this.getConnectorPosition('B');
      this.connectorA.setPosition(connPositionA[0], connPositionA[1]);
      this.connectorB.setPosition(connPositionB[0], connPositionB[1]);
    }

    setRotated(){
      if(this.rotation == 2 || this.rotation == 4){
        this.rotated = true;
      }else{
        this.rotated = false;
      }
    }

    unselectConnectors(){
      this.connectorA.selected = false;
      this.connectorB.selected = false;
    }

    toJsonObject(){
      return {
        uuid: this.uuid,
        type: this.constructor.name,
        id: this.id,
        value: this.value,
        x: this.x,
        y: this.y, 
        rotation: this.rotation
      }
    }
    
  }