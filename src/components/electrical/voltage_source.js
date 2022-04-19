import { Component } from '../component.js';
export class VoltageSource extends Component{
    constructor(initialX, initialY) {
      super('V', 'Fonte de Tensão', initialX, initialY, 48, 33, 'voltage_source', 4, 5, 'V', 'X');
    }

    getConnectorPosition(connectorId){
      let xGap, yGap;
      if(connectorId == 'A'){
        if(this.rotation == 1){
          xGap = 0;
          yGap = this.height / 2;
        }else if(this.rotation == 2){
          xGap = this.height / 2;
          yGap = 0;
        }else if(this.rotation == 3){
          xGap = this.width;
          yGap = this.height / 2;
        }else{
          xGap = this.height / 2;
          yGap = this.width;
        }  
      }else{
        if(this.rotation == 1){
          xGap = this.width;
          yGap = this.height / 2;
        }else if(this.rotation == 2){
          xGap = this.height / 2;
          yGap = this.width;
        }else if(this.rotation == 3){
          xGap = 0;
          yGap = this.height / 2;
        }else{
          xGap = this.height / 2;
          yGap = 0;
        }
      }  
      let connX = this.x + xGap; 
      let connY = this.y + yGap; 
      return [connX, connY];
    }    
  }