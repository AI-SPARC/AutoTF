import { Component } from '../component.js';
export class Resistor extends Component{
    constructor(initialX, initialY) {
      super('R', 'Resistor', initialX, initialY, 53, 21, 'resistor', 1, 1, 'Ω', 'X');
    }

    getConnectorPosition(connectorId){
      let xGap, yGap;
      if(connectorId == 'A'){
        if(this.rotation == 1){
          xGap = 0;
          yGap = (this.height / 2) + 4;
        }else if(this.rotation == 2){
          xGap = (this.height / 2) - 4;
          yGap = 0;
        }else if(this.rotation == 3){
          xGap = this.width;
          yGap = (this.height / 2) - 4;
        }else{
          xGap = (this.height / 2) + 4;
          yGap = this.width;
        }  
      }else{
        if(this.rotation == 1){
          xGap = this.width;
          yGap = (this.height / 2) + 4;
        }else if(this.rotation == 2){
          xGap = (this.height / 2) - 4;
          yGap = this.width;
        }else if(this.rotation == 3){
          xGap = 0;
          yGap = (this.height / 2) - 4;
        }else{
          xGap = (this.height / 2) + 4;
          yGap = 0;
        }
      }  
      let connX = this.x + xGap; 
      let connY = this.y + yGap; 
      return [connX, connY];
    }    
  }