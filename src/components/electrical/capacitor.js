import { Component } from '../component.js';
export class Capacitor extends Component{
    constructor(initialX, initialY) {
      super('C', 'Capacitor', initialX, initialY, 28, 24, 'capacitor', 1, 1, 'F', '(X^-1)*(S^-1)');
    }

    getConnectorPosition(connectorId){
      let xGap, yGap;
      if(connectorId == 'A'){
        if(this.rotation == 1){
          xGap = 0;
          yGap = (this.height / 2) + 1;
        }else if(this.rotation == 2){
          xGap = (this.height / 2) - 1;
          yGap = 0;
        }else if(this.rotation == 3){
          xGap = this.width;
          yGap = (this.height / 2) - 1;
        }else{
          xGap = (this.height / 2) + 1;
          yGap = this.width;
        }  
      }else{
        if(this.rotation == 1){
          xGap = this.width;
          yGap = (this.height / 2) + 1;
        }else if(this.rotation == 2){
          xGap = (this.height / 2) - 1;
          yGap = this.width;
        }else if(this.rotation == 3){
          xGap = 0;
          yGap = (this.height / 2) - 1;
        }else{
          xGap = (this.height / 2) + 1;
          yGap = 0;
        }
      }  
      let connX = this.x + xGap; 
      let connY = this.y + yGap; 
      return [connX, connY];
    }    

    
  }