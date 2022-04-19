import { Component } from '../component.js';
export class Inductor extends Component{
    constructor(initialX, initialY) {
      super('L', 'Indutor', initialX, initialY, 85, 15, 'inductor', 1, 1, 'H', 'X*S');
    }

    getConnectorPosition(connectorId){
      let xGap, yGap;
      let gap = 2;
      if(connectorId == 'A'){
        if(this.rotation == 1){
          xGap = 0;
          yGap = this.height - gap;
        }else if(this.rotation == 2){
          xGap = gap;
          yGap = 0;
        }else if(this.rotation == 3){
          xGap = this.width;
          yGap = gap;
        }else{
          xGap = this.height - gap;
          yGap = this.width;
        }
        
      }else{
        if(this.rotation == 1){
          xGap = this.width;
          yGap = this.height - gap;
        }else if(this.rotation == 2){
          xGap = gap;
          yGap = this.width;
        }else if(this.rotation == 3){
          xGap = 0;
          yGap = gap;
        }else{
          xGap = this.height - gap;
          yGap = 0;
        }
      }  
      let connX = this.x + xGap; 
      let connY = this.y + yGap; 
      return [connX, connY];
    }

    
  }