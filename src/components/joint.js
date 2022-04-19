import { generateUUID } from '../utils/generators.js';
export class Joint{
  constructor(x, y){
    this.uuid = generateUUID();
    this.setPosition(x, y);
    this.radius = 4;
    this.selected = false;
    this.mouseOver = false;
  }

  draw(context){
    if(this.mouseOver){
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = '#88bbff';
      context.beginPath();
      context.arc(this.centerX, this.centerY, 10, 0, 2 * Math.PI, true);
      context.closePath();
      context.fill();
      context.globalCompositeOperation = "source-over";
    }
    context.fillStyle = '#000000';
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
    context.closePath();
    if(this.selected){
      context.fillStyle = '#0000ff';
    }
    context.fill();
  }

  realWidth(){
    return this.radius*2;
  }

  realHeight(){
    return this.radius*2;
  }

  isMouseOver(mouseX, mouseY){
    const mouseGap = 10;
    if(this.hasCoords(mouseX, mouseY, 0, mouseGap)){
      this.mouseOver = true;
    }else{
      this.mouseOver = false;
    }
    return this.mouseOver;
  }

  isSelected(mouseX, mouseY){
    const mouseGap = 10;
    let result = this.hasCoords(mouseX, mouseY, 0, mouseGap);
    if(result){
      this.selected = true;
      return this;
    }
    return null;
  }

  hasCoords(x, y, initialGap, endGap){
    let xJoint = this.x - this.radius/2;
    let yJoint = this.y - this.radius/2;
    if (x >= xJoint - initialGap && x <= xJoint + this.radius + endGap && y >= yJoint - initialGap && y <= yJoint + this.radius + endGap) {
      return true;
    }
    return false;
  }
  hasCoordX(x, initialGap, endGap){
    let xJoint = this.x - this.radius/2;
    if (x >= xJoint - initialGap && x <= xJoint + this.radius + endGap) {
      return true;
    }
    return false;
  }
  hasCoordY(y, initialGap, endGap){
    let yJoint = this.y - this.radius/2;
    if (y >= yJoint - initialGap && y <= yJoint + this.radius + endGap) {
      return true;
    }
    return false;
  }

  setPosition(x, y){
    this.x = this.centerX = this.xGap = x;
    this.y = this.centerY = this.yGap = y;
  }

  unselect(){
    this.selected = false;
  }

  toJsonObject(){
    return {
      uuid: this.uuid,
      type: this.constructor.name,
      x: this.x, 
      y: this.y
    }
  }
}