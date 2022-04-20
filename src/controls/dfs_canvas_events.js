import { DFSContext } from "./dfs_context.js";
import { DfsNode } from "../dfs_components/dfs_node.js";
import { DfsArrow } from "../dfs_components/dfs_arrow.js";
import { checkSelectedDfsItems } from "../utils/components_handler.js";
import { DfsProcedure } from "../dfs_components/dfs_procedure.js";

export function initializeDFSCanvas(){
    DFSContext.graphCanvas = document.getElementById('dfsCanvas');
    DFSContext.graphContext = DFSContext.graphCanvas.getContext('2d');

    DFSContext.graphCanvas.width = window.screen.availWidth + 200;
    DFSContext.graphCanvas.height = window.screen.availHeight;

    DFSContext.graphCanvas.style.cursor = "grab";

    $('#dfsCanvas').on('mousedown', function (event) {
        const rect = DFSContext.graphCanvas.getBoundingClientRect();
        event.clientX = event.clientX - rect.left;
        event.clientY = event.clientY - rect.top;
        DFSContext.graphCanvas.style.cursor = "grabbing";
        if(DFSContext.itemSelected != null){
          let c = DFSContext.itemSelected;
          DFSContext.componentPositionX = c.x;
          DFSContext.componentPositionY = c.y;
          DFSContext.clickPositionX = event.clientX;
          DFSContext.clientPositionY = event.clientY;
          DFSContext.dragging = true;
        }else{
            DFSContext.clickPositionX = event.clientX;
            DFSContext.clientPositionY = event.clientY;
            DFSContext.componentXs = [];
            DFSContext.componentYs = [];
            DFSContext.graphComponents.forEach(function(c){
            if(c instanceof DfsArrow){
                DFSContext.componentXs.push(-1); // arrow has no coordinate x
                DFSContext.componentYs.push(-1); // arrow has no coordinate y
            }else{
                DFSContext.componentXs.push(c.x);
                DFSContext.componentYs.push(c.y);
            }
          });
          DFSContext.dragging = true;
        }
      }).on('mouseup', function () {
        DFSContext.dragging = false;
        DFSContext.graphCanvas.style.cursor = "grab";
      }).on('mousemove', function(evt){
        const rect = DFSContext.graphCanvas.getBoundingClientRect();
        evt.clientX = evt.clientX - rect.left;
        evt.clientY = evt.clientY - rect.top;
        if(DFSContext.dragging){
          if(DFSContext.itemSelected == null){
            DFSContext.graphComponents.forEach(function(c, i){
            if(!(c instanceof DfsArrow))
                c.setPosition(DFSContext.componentXs[i] + (evt.clientX - DFSContext.clickPositionX), DFSContext.componentYs[i] + (evt.clientY - DFSContext.clientPositionY));
            });
            DFSContext.drawGraph();
          }else{
            DFSContext.itemSelected.setPosition(evt.clientX - (DFSContext.clickPositionX - DFSContext.componentPositionX), evt.clientY - (DFSContext.clientPositionY - DFSContext.componentPositionY));
            DFSContext.drawGraph();
          }
        }else{
            checkSelectedDfsItems(evt.clientX, evt.clientY);
            DFSContext.drawGraph();
        }
      });

}

export function generateGraphElements(dfs){
    dfsKeys = Object.keys(dfs);
    for(let i=0; i<dfsKeys.length; i++){
        DfsNode.findOrCreate(dfsKeys[i], dfs[dfsKeys[i]].object);
    }
    for(let i=0; i<dfsKeys.length; i++){
        let node = dfs[dfsKeys[i]];
        let adjacencyList = node.adjacencyList;
        for(let j=0; j<adjacencyList.length; j++){
            let connection = adjacencyList[j];
            let connectedTo = connection.connectedTo;
            let originNode = DFSContext.graphComponents.find(function(c){
                return c.id == dfsKeys[i];
            });
            let destinationNode = DFSContext.graphComponents.find(function(c){
                return c.id == connectedTo;
            });
            let procedure = DfsProcedure.findOrCreate(connection, dfsKeys[i]);
            DfsArrow.generate(originNode, procedure);
            DfsArrow.generate(procedure, destinationNode);
        }
    }

    DFSContext.graphComponents.sort(function(a, b) {
        if(a instanceof DfsArrow && !(b instanceof DfsArrow))
            return -1;
        if(!(a instanceof DfsArrow) && b instanceof DfsArrow)
            return 1
        return 0;
    });
}