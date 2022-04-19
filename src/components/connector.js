export class Connector{
  constructor(id, x, y, parent) {
    this.id = id;
    this.parent = parent;
    this.xGap = 0;
    this.yGap = 0;
    this.gap = (this.id == 'A') ? -20 : 20;
    this.setPosition(x, y);
    this.mouseOver = false;
    this.setSide();
  }

  setGapCoordinates(){
    if(this.parent.rotation == 1){
      this.xGap = this.centerX + this.gap;
      this.yGap = this.centerY;
    }else if(this.parent.rotation == 2){
      this.xGap = this.centerX;
      this.yGap = this.centerY + this.gap;
    }else if(this.parent.rotation == 3){ 
      this.xGap = this.centerX - this.gap;
      this.yGap = this.centerY;
    }else{
      this.xGap = this.centerX;
      this.yGap = this.centerY - this.gap;
    }
  }


  isMouseOver(mouseX, mouseY){
    let width = (this.parent.rotated) ? this.height : this.width;
    let height = (this.parent.rotated) ? this.width : this.height;
    const mouseGap = 10;
    if(mouseX >= this.x && mouseX <= this.x + width + mouseGap && mouseY >= this.y && mouseY <= this.y + height + mouseGap){
      this.mouseOver = true;
    }else{
      this.mouseOver = false;
    }
    return this.mouseOver;
  }

  isSelected(mouseX, mouseY){
    let width = (this.parent.rotated) ? this.height : this.width;
    let height = (this.parent.rotated) ? this.width : this.height;
    const mouseGap = 5;
    if(mouseX >= this.x && mouseX <= this.x + width + mouseGap && mouseY >= this.y && mouseY <= this.y + height + mouseGap){
      return true;
    }else{
      return false;
    }
  }
  setPosition(x, y){
    if(parent.rotated){
      this.width = 6;
      this.height = 10;
    }else{
      this.width = 10;
      this.height = 6;
    }  
    let width = (this.parent.rotated) ? this.height : this.width;
    let height = (this.parent.rotated) ? this.width : this.height;
    this.x = x - width / 2;
    this.y = y - height / 2;
    this.centerX = this.x + width / 2;
    this.centerY = this.y + height / 2;
    this.setGapCoordinates();
  }

  setSide(){
    // SIDE: 1 - RIGHT, 2 - DOWN, 3 - LEFT, 4 - TOP
    if(this.id == 'A'){
      if(this.parent.rotation == 1){
        this.side = 3;
      }else if(this.parent.rotation == 2){
        this.side = 4;
      }else if(this.parent.rotation == 3){
        this.side = 1;
      }else{
        this.side = 2;
      }
    }else{
      this.side = this.parent.rotation;
    }
  }

  draw(context){
    let width = (this.parent.rotated) ? this.height : this.width;
    let height = (this.parent.rotated) ? this.width : this.height;
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
    context.fillRect(this.x, this.y, width, height);
  }

}