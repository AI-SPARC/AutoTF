import { DFSContext } from "../controls/dfs_context";

export class DfsProcedure {
    constructor(id, gain, x, y){
        this.id = id;
        this.gain = gain;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.middleX = x + this.width/2;
        this.middleY = y + this.height/2;
        this.selected = false;
    }

    static findOrCreate(connection, originNodeId){
        let id = "T"+connection.id;
        let dfsProcedure = DFSContext.graphComponents.find(function(c){
            return c.id === id;
        });
        if(dfsProcedure === undefined){
            let originNode = DFSContext.graphComponents.find(function(c){
                return c.id == originNodeId;
            });
            let destinationNode = DFSContext.graphComponents.find(function(c){
                return c.id == connection.connectedTo;
            })
            dfsProcedure = new DfsProcedure(id, connection.gain, (originNode.x+destinationNode.x)/2, (originNode.y+destinationNode.y)/2);
            DFSContext.graphComponents.push(dfsProcedure);
        }
        return dfsProcedure;
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
        context.fillText('T', this.middleX, this.middleY + 5);
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