import { DFSContext } from "../controls/dfs_context";

export class DfsNode {
    constructor(id, object, x, y){
        this.id = id;
        this.object = object;
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.middleX = x;
        this.middleY = y;
        this.selected = false;
        if(object.variableType === 'flow'){
            this.description = "F("+object.id+")";
        }else{
            this.description = "E("+object.id+")";
        }
    }

    static findOrCreate(id, object){
        let dfsNode = DFSContext.graphComponents.find(function(c){
            return c.id === id;
        });
        if(dfsNode === undefined){
            let integerId = parseInt(id);
            let y;
            let nodesAmount = Object.keys(DFSContext.dfs).length;
            if(integerId > nodesAmount/2){
                y = 500;
            }else{
                y = 100;
            }
            let x = 100 + (DFSContext.graphCanvas.width / ((nodesAmount+1)/2)) * ((integerId-1)%(nodesAmount/2));
            dfsNode = new DfsNode(id, object, x , y);
            DFSContext.graphComponents.push(dfsNode);
        }
        return dfsNode;
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
        context.fillText(this.description, this.middleX, this.y - 20);
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