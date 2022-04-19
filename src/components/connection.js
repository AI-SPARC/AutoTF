import { middlePointX, middlePointY } from '../utils/positioning.js';
import { generateUUID } from '../utils/generators.js';
import { ConnectionLine } from './connection_line.js';
import { Connector } from './connector.js';
import { Component } from './component.js';
import { Joint } from './joint.js';

export class Connection {

    static list = [];
    static pointCollisions = [];

    constructor(connectorA, connectorB) {
      this.uuid = generateUUID();
      this.connectorA = connectorA;
      this.connectorB = connectorB;
      this.connectionGap = 30;
      this.points = [];
      this.lines = [];
      this.selected = false;
    }

    draw(context){
      if(this.points.length != 0){
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for(var i in this.points){
          let point = this.points[i];
          context.lineTo(point.x, point.y);
          context.lineWidth = 3;
          if(this.selected)
            context.strokeStyle = '#0000ff';
          else
            context.strokeStyle = '#000000';
          context.stroke(); 
        }
      }
      for(let i in Connection.list){
        let connection = Connection.list[i];
        for(let j in this.lines){
          let line = this.lines[j];
          for(let k in connection.lines){
            let sol = connection.lines[k].intersect(line);
            if(sol != null){
              // Point index should be -1 -> points are not on line edges
              let pointIndex = this.points.findIndex(function(val) {
                return val.x == sol.x && val.y == sol.y;
              });

              // Collision index should be -1 -> collision not drawn yet
              let collisionIndex = Connection.pointCollisions.findIndex(function(val) {
                return val.x == sol.x && val.y == sol.y;
              });

              // Collision point must belong to connection
              if(this.hasCoords(sol.x, sol.y, 5, 5) && pointIndex == -1 && collisionIndex == -1){
                Connection.pointCollisions.push({x: sol.x, y: sol.y});
                context.fillStyle = '#ffffff';
                context.fillRect(sol.x-10, sol.y-10, 15, 15);
                let image
                if(connection.lines[k].a == 0){
                  image = document.getElementById('bypass_v');
                  context.drawImage(image, sol.x-16, sol.y-12.5, 25, 25);  
                }
                else{
                  image = document.getElementById('bypass_h');
                  context.drawImage(image, sol.x-12.5, sol.y-16, 25, 25);  
                }
              }
            }
          }
        }
      }
    }

    addPoint(x, y){
      let lastPoint = this.points[this.points.length-1];
      if(lastPoint.x != x || lastPoint.x != y){
        this.lines.push(new ConnectionLine(y - lastPoint.y, lastPoint.x - x, -lastPoint.x*(y-lastPoint.y)+lastPoint.y*(x-lastPoint.x), lastPoint.x, x, lastPoint.y, y));
        this.points.push({x: x, y: y});
      }   
    }

    equals(connection){
      if(connection.points.length == 0 || this.points.length == 0)
        return false;
      return (this.points[0].x == connection.points[0].x && this.points[this.points.length-1].x == connection.points[connection.points.length-1].x) &&
        (this.points[0].y == connection.points[0].y && this.points[this.points.length-1].y == connection.points[connection.points.length-1].y);
    }

    isSelected(mouseX, mouseY){
      let result = this.hasCoords(mouseX, mouseY, 10, 10);
      if(result){
        this.selected = true;
        return true;
      }
      return false;
    }

    hasCoords(x, y, initialGap, endGap){
      for(let i in this.points){
        if(i < this.points.length-1){
          let nextI = parseInt(i)+1;
          let dx = this.points[i].x - this.points[nextI].x;
          let dy = this.points[i].y - this.points[nextI].y;
          let minorY = (this.points[i].y < this.points[nextI].y) ? this.points[i].y : this.points[nextI].y;
          let majorY = (this.points[i].y > this.points[nextI].y) ? this.points[i].y : this.points[nextI].y;
          let minorX = (this.points[i].x < this.points[nextI].x) ? this.points[i].x : this.points[nextI].x;
          let majorX = (this.points[i].x > this.points[nextI].x) ? this.points[i].x : this.points[nextI].x;
          if(dx == 0){
            if (x >= minorX - initialGap && x <= majorX + endGap  && y >= minorY && y <= majorY) {
              return true;
            }   
          }else if(dy == 0){
            if (x >= minorX && x <= majorX && y >= minorY - initialGap && y <= majorY + endGap ) {
              return true;
            }
          }
        }
      }
      return false;
    }

    setConnectionPath(){
      let compA, compB, connA, connB;
      
      if(this.connectorA instanceof Connector && this.connectorB instanceof Connector){
        this.toJoint = false;
        if(this.connectorA.id == 'B'){
          compA = this.connectorA.parent;
          compB = this.connectorB.parent;
          connA = this.connectorA;
          connB = this.connectorB;
        }else{
          compA = this.connectorB.parent;
          compB = this.connectorA.parent;
          connA = this.connectorB;
          connB = this.connectorA;
        }
      }else{
        this.toJoint = true;
        if(this.connectorA instanceof Connector){
           connA = this.connectorA;
           compA = this.connectorA.parent;
           compB = connB = this.connectorB;
        }else{
          connA = this.connectorB;
          compA = this.connectorB.parent;
          compB = connB = this.connectorA;
        }
      }
            
      this.points = [{x: connA.centerX, y: connA.centerY}];
      this.lines = [];

      if(connA.centerX == connB.centerX && connA.centerY > connB.centerY){
        this.setNorthConnectionPath(compA, compB, connA, connB);
      }else if(connA.centerX == connB.centerX && connA.centerY < connB.centerY){
        this.setSouthConnectionPath(compA, compB, connA, connB);
      }else if(connA.centerX < connB.centerX && connA.centerY == connB.centerY){
        this.setEastConnectionPath(compA, compB, connA, connB);
      }else if(connA.centerX > connB.centerX && connA.centerY == connB.centerY){
        this.setWestConnectionPath(compA, compB, connA, connB);
      }else if(connA.centerX > connB.centerX && connA.centerY > connB.centerY){
        this.setNorthWestConnectionPath(compA, compB, connA, connB);
       }else if(connA.centerX > connB.centerX && connA.centerY < connB.centerY){
        this.setSouthWestConnectionPath(compA, compB, connA, connB);
      } else if(connA.centerX < connB.centerX && connA.centerY > connB.centerY){
        this.setNorthEastConnectionPath(compA, compB, connA, connB);
      } else if(connA.centerX < connB.centerX && connA.centerY < connB.centerY){
        this.setSouthEastConnectionPath(compA, compB, connA, connB);
      }
    }

    setNorthConnectionPath(compA, compB, connA, connB){
      if(this.toJoint){
        if(connA.side == 1 || connA.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, middlePointY(compA, compB), 0);
        }else if(connA.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else{
          this.setStraightConnection(connA, connB);
        }
      }else{
        if(connA.side == 1 && connB.side == 1){
          this.setCustomPointSingleConnection(connA, connB, connB.xGap, 0);
        }else if(connA.side == 1 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, compA.x + compA.realWidth() + this.connectionGap, connB.yGap, 0)
        }else if(connA.side == 1 && connB.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compB.y + compB.realHeight() + this.connectionGap, 0);
        }else if(connA.side == 1 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else if(connA.side == 2 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 2){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 4){
          this.setCustomPointTripleConnection(connA, connB, compA.x - this.connectionGap, connA.yGap, 1);
        }else if(connA.side == 3 && connB.side == 1){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, middlePointY(compA, compB), 0);
        }else if(connA.side == 3 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 3 && connB.side == 3){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else if(connA.side == 3 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 4 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 2){
          this.setStraightConnection(connA, connB);
        }else if(connA.side == 4 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 4){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }
      }
    }

    setSouthConnectionPath(compA, compB, connA, connB){
      if(this.toJoint){
        if(connA.side == 1 || connA.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, middlePointY(compA, compB), 0);
        }else if(connA.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else{
          this.setStraightConnection(connA, connB);
        }
      }else{
        if(connA.side == 1 && connB.side == 1){
          this.setCustomPointSingleConnection(connA, connB, connB.xGap, 0);
        }else if(connA.side == 1 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, compA.x + compA.realWidth() + this.connectionGap, connB.yGap, 0)
        }else if(connA.side == 1 && connB.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, middlePointY(compA, compB), 0);
        }else if(connA.side == 1 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else if(connA.side == 2 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 2){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 4){
          this.setStraightConnection(connA, connB);
        }else if(connA.side == 3 && connB.side == 1){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, middlePointY(compA, compB), 0);
        }else if(connA.side == 3 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 3 && connB.side == 3){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else if(connA.side == 3 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 4 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 2){
          this.setCustomPointTripleConnection(connA, connB, compA.x - this.connectionGap, connA.yGap, 1);
        }else if(connA.side == 4 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 4){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }
      }
    }

    setEastConnectionPath(compA, compB, connA, connB){
      if(this.toJoint){
        if(connA.side == 2 || connA.side == 4){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else{
          this.setStraightConnection(connA, connB);
        }
      }else{
        if(connA.side == 1 && connB.side == 1){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compB.y + compB.realHeight() + this.connectionGap, 0);
        }else if(connA.side == 1 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, compA.x + compA.realWidth() + this.connectionGap, connB.yGap, 0)
        }else if(connA.side == 1 && connB.side == 3){
          this.setStraightConnection(connA, connB);
        }else if(connA.side == 1 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else if(connA.side == 2 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 4){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 3 && connB.side == 1){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, middlePointY(compA, compB), 0);
        }else if(connA.side == 3 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 3 && connB.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compA.y - this.connectionGap, 0);
        }else if(connA.side == 3 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 4 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 2){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 4 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 4){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }
      }
    }

    setWestConnectionPath(compA, compB, connA, connB){
      if(this.toJoint){
        if(connA.side == 2 || connA.side == 4){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else{
          this.setStraightConnection(connA, connB);
        }
      }else{
        if(connA.side == 1 && connB.side == 1){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compA.y - this.connectionGap, 0);
        }else if(connA.side == 1 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, compA.x + compA.realWidth() + this.connectionGap, connB.yGap, 0)
        }else if(connA.side == 1 && connB.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compA.y - this.connectionGap, 0);
        }else if(connA.side == 1 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else if(connA.side == 2 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 4){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 3 && connB.side == 1){
          this.setStraightConnection(connA, connB);
        }else if(connA.side == 3 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 3 && connB.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compA.y - this.connectionGap, 0);
        }else if(connA.side == 3 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 4 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 2){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 4 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 4){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }
      }
    }

    setNorthEastConnectionPath(compA, compB, connA, connB){
      if(this.toJoint){
        if(connA.side == 1){
          this.setLConnection(connA, connB, 0);
        }else if(connA.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }else if(connA.side == 3){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else{
          this.setLConnection(connA, connB, 1);
        }
      }else{
        if(connA.side == 1 && connB.side == 1){
          this.setCustomPointSingleConnection(connA, connB, connB.xGap, 0);
        }else if(connA.side == 1 && connB.side == 2){
          this.setLConnection(connA, connB, 0);
        }else if(connA.side == 1 && connB.side == 3){
          this.setCustomPointSingleConnection(connA, connB, middlePointX(compA, compB), 0);
        }else if(connA.side == 1 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, compB.x + compB.realWidth() + this.connectionGap, connB.yGap, 0)
        }else if(connA.side == 2 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 2 && connB.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 2 && connB.side == 4){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 3 && connB.side == 1){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compB.y - this.connectionGap, 0);
        }else if(connA.side == 3 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 3 && connB.side == 3){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else if(connA.side == 3 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 4 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }else if(connA.side == 4 && connB.side == 3){
          this.setLConnection(connA, connB, 1);
        }else if(connA.side == 4 && connB.side == 4){
          this.setCustomPointSingleConnection(connA, connB, connB.yGap, 1);
        }
      }
    }

    setNorthWestConnectionPath(compA, compB, connA, connB){
      if(this.toJoint){
        if(connA.side == 1){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else if(connA.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }else if(connA.side == 3){
          this.setLConnection(connA, connB, 0);
        }else{
          this.setLConnection(connA, connB, 1);
        }
      }else{
        if(connA.side == 1 && connB.side == 1){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else if(connA.side == 1 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, compA.x + compA.realWidth() + this.connectionGap, connB.yGap, 0)
        }else if(connA.side == 1 && connB.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compB.y + compB.realHeight() + this.connectionGap, 0);
        }else if(connA.side == 1 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else if(connA.side == 2 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }else if(connA.side == 2 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 2 && connB.side == 4){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 3 && connB.side == 1){
          this.setCustomPointSingleConnection(connA, connB, middlePointX(compA, compB), 0);
        }else if(connA.side == 3 && connB.side == 2){
          this.setLConnection(connA, connB, 0);
        }else if(connA.side == 3 && connB.side == 3){
          this.setCustomPointSingleConnection(connA, connB, connB.xGap, 0);
        }else if(connA.side == 3 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else if(connA.side == 4 && connB.side == 1){
          this.setLConnection(connA, connB, 1);
        }else if(connA.side == 4 && connB.side == 2){
          this.setCustomPointTripleConnection(connA, connB, middlePointX(compA, compB), connA.yGap, 1);
        }else if(connA.side == 4 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 4){
          this.setCustomPointSingleConnection(connA, connB, connB.yGap, 1);
        }
      }
    }

    setSouthEastConnectionPath(compA, compB, connA, connB){
      if(this.toJoint){
        if(connA.side == 1){
          this.setLConnection(connA, connB, 0);
        }else if(connA.side == 2){
          this.setLConnection(connA, connB, 1);
        }else if(connA.side == 3){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else{
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }
      }else{
        if(connA.side == 1 && connB.side == 1){
          this.setCustomPointSingleConnection(connA, connB, connB.xGap, 0);
        }else if(connA.side == 1 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, compB.x + compB.realWidth() + this.connectionGap, connB.yGap, 0)
        }else if(connA.side == 1 && connB.side == 3){
          this.setCustomPointSingleConnection(connA, connB, middlePointX(compA, compB), 0);
        }else if(connA.side == 1 && connB.side == 4){
          this.setLConnection(connA, connB, 0);
        }else if(connA.side == 2 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, compB.y + compB.realHeight() +  this.connectionGap, 1)
        }else if(connA.side == 2 && connB.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connB.yGap, 1);
        }else if(connA.side == 2 && connB.side == 3){
          this.setLConnection(connA, connB, 1);
        }else if(connA.side == 2 && connB.side == 4){
          this.setCustomPointSingleConnection(connA, connB, middlePointY(compA, compB), 1);
        }else if(connA.side == 3 && connB.side == 1){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compB.y - this.connectionGap, 0);
        }else if(connA.side == 3 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 3 && connB.side == 3){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else if(connA.side == 3 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 4 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 2){
          this.setCustomPointTripleConnection(connA, connB, compA.x + compA.realWidth() + this.connectionGap, compA.y - this.connectionGap, 1);
        }else if(connA.side == 4 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 4){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }
      }
    }

    setSouthWestConnectionPath(compA, compB, connA, connB){
      if(this.toJoint){
        if(connA.side == 1){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else if(connA.side == 2){
          this.setLConnection(connA, connB, 1);
        }else if(connA.side == 3){
          this.setLConnection(connA, connB, 0);
        }else{
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }
      }else{
        if(connA.side == 1 && connB.side == 1){
          this.setCustomPointSingleConnection(connA, connB, connA.xGap, 0);
        }else if(connA.side == 1 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, compA.x + compA.realWidth() + this.connectionGap, connB.yGap, 0)
        }else if(connA.side == 1 && connB.side == 3){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, compB.y + compB.realHeight() + this.connectionGap, 0);
        }else if(connA.side == 1 && connB.side == 4){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0);
        }else if(connA.side == 2 && connB.side == 1){
          this.setLConnection(connA, connB, 1);
        }else if(connA.side == 2 && connB.side == 2){
          this.setCustomPointSingleConnection(connA, connB, connB.yGap, 1);
        }else if(connA.side == 2 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 2 && connB.side == 4){
          this.setCustomPointSingleConnection(connA, connB, middlePointY(compA, compB), 1);
        }else if(connA.side == 3 && connB.side == 1){
          this.setCustomPointSingleConnection(connA, connB, middlePointX(compA, compB), 0);
        }else if(connA.side == 3 && connB.side == 2){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connB.yGap, 0)
        }else if(connA.side == 3 && connB.side == 3){
          this.setCustomPointSingleConnection(connA, connB, connB.xGap, 0);
        }else if(connA.side == 3 && connB.side == 4){
          this.setLConnection(connA, connB, 0);
        }else if(connA.side == 4 && connB.side == 1){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 2){
          this.setCustomPointTripleConnection(connA, connB, compB.x - this.connectionGap, compA.y - this.connectionGap, 1);
        }else if(connA.side == 4 && connB.side == 3){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connA.yGap, 1)
        }else if(connA.side == 4 && connB.side == 4){
          this.setCustomPointSingleConnection(connA, connB, connA.yGap, 1);
        }
      }
    }

    setStraightConnection(connA, connB){
      if(connA.xGap == connB.xGap){
        let collision = this.checkComponentsCollision(connA.xGap, connA.yGap, connB.yGap, 1);
        if(collision){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap-10, connA.yGap, 1);
          return;
        }
      }else{
        let collision = this.checkComponentsCollision(connA.xGap, connA.yGap, connB.xGap, 0);
        if(collision){
          this.setCustomPointTripleConnection(connA, connB, connA.xGap, connA.yGap-10, 0);
          return;
        }
      }
      this.addPoint(connB.centerX, connB.centerY);
    }

    setLConnection(connA, connB, direction){
      if(direction == 0){
        let collision1 = this.checkComponentsCollision(connA.xGap, connA.yGap, connB.xGap, 0);
        let collision2 = this.checkComponentsCollision(connB.xGap, connA.yGap, connB.yGap, 1);
        if(collision1){
          this.setCustomPointDoubleConnection(connA, connB, connA.xGap, connA.y - 10, 0);
          return;
        }
        if(collision2){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connB.yGap, 0);
          return;
        }
        this.addPoint(connB.centerX, connA.centerY);
      }else{
        let collision1 = this.checkComponentsCollision(connA.xGap, connA.yGap, connB.yGap, 1);
        let collision2 = this.checkComponentsCollision(connA.xGap, connB.yGap, connB.xGap, 0);
        if(collision1){
          this.setCustomPointDoubleConnection(connA, connB, connA.x - 10, connA.yGap, 1);
          return;
        }
        if(collision2){
          this.setCustomPointDoubleConnection(connA, connB, connB.xGap, connB.yGap, 1);
          return;
        }
        this.addPoint(connA.centerX, connB.centerY);
      }
      this.addPoint(connB.centerX, connB.centerY);
    }
    setCustomPointSingleConnection(connA, connB, custom, direction){
      if(direction == 0){
        let dxFactor = this.getDistanceFactor(custom, connA.centerY, custom, connB.centerY);
        this.addPoint(custom + dxFactor, connA.centerY);
        this.addPoint(custom + dxFactor, connB.centerY);
      }else{
        let dyFactor = this.getDistanceFactor(connA.centerX, custom, connB.centerX, custom);
        this.addPoint(connA.centerX, custom + dyFactor);
        this.addPoint(connB.centerX, custom + dyFactor);
      }
      this.addPoint(connB.centerX, connB.centerY);
    }

    setCustomPointDoubleConnection(connA, connB, customX, customY, direction){
      if(direction == 0){
        let dyFactor = this.getDistanceFactor(customX, customY, connB.centerX, customY);
        let dxFactor = this.getDistanceFactor(customX, connA.centerY, customX, customY + dyFactor);
        this.addPoint(customX + dxFactor, connA.centerY);
        this.addPoint(customX + dxFactor, customY + dyFactor);
        this.addPoint(connB.centerX, customY + dyFactor);
      }else{
        let dxFactor = this.getDistanceFactor(customX, customY, customX, connB.centerY);
        let dyFactor = this.getDistanceFactor(connA.centerX, customY, customX + dxFactor, customY);
        this.addPoint(connA.centerX, customY + dyFactor);
        this.addPoint(customX + dxFactor, customY + dyFactor);
        this.addPoint(customX + dxFactor, connB.centerY);
      }
      this.addPoint(connB.centerX, connB.centerY);
    }

    setCustomPointTripleConnection(connA, connB, customX, customY, direction){
      if(direction == 0){
        let dyFactor = this.getDistanceFactor(customX, customY, connB.xGap, customY);
        let dxFactor = this.getDistanceFactor(customX, connA.centerY, customX, customY + dyFactor)
        this.addPoint(customX + dxFactor, connA.centerY);
        this.addPoint(customX + dxFactor, customY + dyFactor);
        this.addPoint(connB.xGap, customY + dyFactor);
        this.addPoint(connB.xGap, connB.centerY);
      }else{
        let dxFactor = this.getDistanceFactor(customX, customY, customX, connB.yGap);
        let dyFactor = this.getDistanceFactor(connA.centerX, customY, customX + dxFactor, customY);
        this.addPoint(connA.centerX, customY + dyFactor);
        this.addPoint(customX + dxFactor, customY + dyFactor);
        this.addPoint(customX + dxFactor, connB.yGap);   
        this.addPoint(connB.centerX, connB.yGap);
      }
      this.addPoint(connB.centerX, connB.centerY);
    }


    getDistanceFactor(xi, yi, xf, yf){
      let dynamicCoord;
      if(xi == xf){
        dynamicCoord = 1;  // Y
      }else{
        dynamicCoord = 0;  // X
      }
      let factor = 0;
      let collisionDetected;
      let positive = true;
      let verified = false;
      while(!verified){
        if(dynamicCoord == 1){
          let x = xi + factor;
          collisionDetected = this.checkComponentsCollision(x, yi, yf, dynamicCoord);
          if(collisionDetected){
            if(factor == 0)
              factor = -1;
            else if(!positive)
              factor = (-1)*factor;  
            else
              factor = (-1)*(factor + 1);
            positive = !positive;
          }
        }else{
          let y = yi + factor;
          collisionDetected = this.checkComponentsCollision(xi, y, xf, dynamicCoord);
          if(collisionDetected)
            if(factor == 0)
              factor = -1;
            else if(!positive)
              factor = (-1)*factor;  
            else
              factor = (-1)*(factor + 1);
            positive = !positive;
        }
        if(!collisionDetected)
            verified = true;
      }
      return factor;
    }
    checkComponentsCollision(x, y, finalCoord, orientation){  // orientation: 0 - Horizontal; 1 - Vertical
      for (var i in Component.list) {
        let c = Component.list[i];
        let gap = 20;
        if(c === this.connectorA.parent || c === this.connectorB.parent) gap = 0;
        if(!(c instanceof Joint)){
          if(orientation == 0){
            let hasY = c.hasCoordY(y, gap, gap);
            let minorX, majorX;
            if(x > finalCoord){
              majorX = x;
              minorX = finalCoord;
            }else{
              majorX = finalCoord;
              minorX = x;
            }
            if(hasY)
              if((minorX <= c.x && c.x <= majorX) || (minorX <= c.x+c.realWidth() && c.x+c.realWidth() <= majorX))
                return true;  
          }else{
            let hasX = c.hasCoordX(x, gap, gap);
            let minorY, majorY;
            if(y > finalCoord){
              majorY = y;
              minorY = finalCoord;
            }else{
              majorY = finalCoord;
              minorY = y;
            }
            if(hasX)
              if((minorY <= c.y && c.y <= majorY) || (minorY <= c.y+c.realHeight() && c.y+c.realHeight() <= majorY))
                return true;
          }
        }
      }
      return false;
    }

    toJsonObject(){
      let aId, bId, aUUID, bUUID;
      if(this.connectorA instanceof Joint){
        aId = '';
        aUUID = this.connectorA.uuid;
      }else{
        aId = this.connectorA.id;
        aUUID = this.connectorA.parent.uuid;
      }
      if(this.connectorB instanceof Joint){
        bId = '';
        bUUID = this.connectorB.uuid;
      }else{
        bId = this.connectorB.id;
        bUUID = this.connectorB.parent.uuid;
      }
      return {
        componentA_UUID: aUUID,
        componentB_UUID: bUUID,
        connectorA_id: aId,
        connectorB_id: bId
      }
    }
    
  }