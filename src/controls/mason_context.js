// import { format, rationalize } from '../lib/math.js';
import { DFSContext } from './dfs_context.js';

export class MasonContext {
    static directPaths = [];
    static cyclePaths = {};
    static cyclePathsOrders = {};

    static findDfsPaths(dfs, originNode, destinationNode){
        // const nerdamer = require('../lib/nerdamer/nerdamer.core');
        this.directPaths = [];
        this.cyclePaths = {};
        let visited = {};
        let dfsKeys = Object.keys(dfs);
        for(let i=0; i<dfsKeys.length; i++){
            visited[dfsKeys[i]] = false;
        } 
        this.runDfs(dfs, originNode, visited, destinationNode,[], '');
        this.setCyclesOrder();

        let cyclePaths = this.cyclePaths;
        this.cyclePathsOrders = Object.keys(cyclePaths).reduce(function(newHash, cycleKey){
            let order = cyclePaths[cycleKey].order;
            newHash[order] = newHash[order] || [];
            newHash[order].push(cyclePaths[cycleKey]);
            return newHash;
          }, Object.create(null));


        let delta = this.delta();
        let sumPaths = this.directPathsSum();

        let result;
        if(delta == '1'){
            let partialResult = math.format(math.rationalize(('('+sumPaths+')/('+delta+')')), { fraction: 'ratio'} ).replaceAll(' ','');
            result = nerdamer(partialResult);
        }else{
            let num = nerdamer.simplify(sumPaths);
            let den = nerdamer.simplify(delta);
            result = nerdamer.simplify(num.divide(den));
        }

        let valueResult = result.evaluate(DFSContext.xValues);

        $('#id-txtnum').val(result.numerator().text());
        $('#id-txtden').val(result.denominator().text());
        $('#id-txtval').val(valueResult.text());

    }

    static runDfs(dfs, node, visited, destination, currentPath, currentGain){
        let completed = false;
        let newVisited = JSON.parse(JSON.stringify(visited));
        let newCurrentPath = JSON.parse(JSON.stringify(currentPath));
        if(node !== undefined){
            newCurrentPath.push(node);
            if(newVisited[node]){
                this.setCyclePath(newCurrentPath, dfs);
                completed = true;
            }else{
                newVisited[node] = true;
                if(node == destination){
                    this.setDirectPath(newCurrentPath, currentGain);
                    // completed = true;
                }
            }
            if(!completed){
                let adjacencyList = dfs[node].adjacencyList;
                for(let i=0; i<adjacencyList.length; i++){
                    let newNode = adjacencyList[i].connectedTo;
                    let newGain;
                    if(currentGain == ''){
                        newGain = '('+adjacencyList[i].gain+')';
                    }else{
                        newGain = currentGain+'*('+adjacencyList[i].gain+')';
                    }
                    this.runDfs(dfs, newNode, newVisited, destination, newCurrentPath, newGain);
                }
            }
        }
    }

    static setDirectPath(path, gain){
        // const nerdamer = require('../lib/nerdamer/nerdamer.core');
        this.directPaths.push({
            path: path,
            gain: gain,
            nerdamer: nerdamer("expand("+gain+")").toString()
        });
    }

    static setCyclePath(path, dfs){
        // const nerdamer = require('../lib/nerdamer/nerdamer.core');
        let cycleKey = Object.keys(this.cyclePaths).length+1;
        let lastNode = path[path.length-1];

        let newCyclePath;
        for(let i=0; i<path.length; i++){
            if(path[i] == lastNode){
                newCyclePath = path.slice(i, path.length);
                break;
            }
        }
        let gain = '';
        for(let i=0; i<newCyclePath.length-1; i++){
            let node = dfs[newCyclePath[i]];
            let connection = node.adjacencyList.find(conn => conn.connectedTo == newCyclePath[i+1]);
            if(gain == ''){
                gain = '('+connection.gain+')';
            }else{
                gain += '*('+connection.gain+')';
            }
        }

        this.cyclePaths[cycleKey] = {
            id: cycleKey.toString(),
            path: newCyclePath,
            order: 1,
            gain: gain,
            nerdamer: nerdamer("expand("+gain+")").toString()
        }
    }

    static setCyclesOrder(){
        // const nerdamer = require('../lib/nerdamer/nerdamer.core');
        // Retrieve only first order cycles keys
        let firstOrderCycleKeys = Object.keys(this.cyclePaths).filter(key => this.cyclePaths[key].order == 1);

        // Current verified order. Starts with 2
        let order = 2;

        let cyclesToVerifyKeys = firstOrderCycleKeys;
        while(cyclesToVerifyKeys.length > 0){
            let newCyclesKeys = [];
            // Run loop on current order cycles to check if any first order cycle has same vertices
            for(let i=0; i<cyclesToVerifyKeys.length; i++){
                let verifiedCycleKey = cyclesToVerifyKeys[i];
                let verifiedCycle = this.cyclePaths[verifiedCycleKey];
                let verifiedCyclePath = verifiedCycle.path;
                // Verify vertices with each first order cycle
                for(let j=0; j<firstOrderCycleKeys.length; j++){
                    let firstOrderCycleKey = firstOrderCycleKeys[j];
                    let firstOrderCycle = this.cyclePaths[firstOrderCycleKey];
                    let firstOrderCyclePath = firstOrderCycle.path;
                    // Avoid comparing cycles with themselves
                    if(firstOrderCycleKey != verifiedCycleKey){
                        // Set new cycle id to avoid creating A-B/B-A new cycles
                        let verifiedCicleIdArr = verifiedCycle.id.split('-');
                        verifiedCicleIdArr.push(firstOrderCycle.id);
                        verifiedCicleIdArr = verifiedCicleIdArr.sort();
                        let newCycleId = verifiedCicleIdArr.join('-');
                        // Check if first order cycle has any common vertice with verified cycle
                        let hasElements = verifiedCyclePath.some(p => firstOrderCyclePath.includes(p));
                        if(!hasElements){
                            // If not, generate another cycle with current evaluated order unless it already exists
                            let cyclesKeysWithSameId = Object.keys(this.cyclePaths).filter(key => this.cyclePaths[key].id === newCycleId);
                            if(cyclesKeysWithSameId.length == 0){
                                let newCycleKey = Object.keys(this.cyclePaths).length+1;
                                this.cyclePaths[newCycleKey] = {
                                    id: newCycleId,
                                    path: verifiedCyclePath.concat(firstOrderCyclePath),
                                    order: order,
                                    gain: verifiedCycle.gain+'*'+firstOrderCycle.gain,
                                    nerdamer: nerdamer("expand("+verifiedCycle.gain+'*'+firstOrderCycle.gain+")").toString()
                                }
                                newCyclesKeys.push(newCycleKey);
                            }
                        }
                    }
                }
            }
            cyclesToVerifyKeys = newCyclesKeys;
            order++;
        }
    }

    static delta(){
        let orders = Object.keys(this.cyclePathsOrders);
        let ordersAmount = orders.length;
        let ordersProcessed = 0;
        let currentOrder = 1;
        let signal = -1;
        let deltaResult = '1';
        while(ordersProcessed < ordersAmount){
            let currentOrderStr = currentOrder.toString();
            if(orders.includes(currentOrderStr)){
                ordersProcessed++;
                let totalGain = '';
                if(signal == -1){
                    totalGain += '-(';
                }else{
                    totalGain += '+(';
                }
                for(let i=0; i<this.cyclePathsOrders[currentOrderStr].length; i++){
                    if(i != 0){
                        totalGain += '+';
                    }
                    totalGain += "("+this.cyclePathsOrders[currentOrderStr][i].nerdamer+")";
                }
                totalGain += ')';
                deltaResult += totalGain;
            }
            signal *= -1;
            currentOrder++;
        }
        return deltaResult;
    }

    static directPathsSum(){
        let directPathsKeys = Object.keys(this.directPaths);
        let result = '';
        for(let i=0; i<directPathsKeys.length; i++){
            let directPath = this.directPaths[directPathsKeys[i]];
            if(i != 0){
                result += '+';
            }
            result += '(('+directPath.nerdamer+')*('+this.deltaK(directPath)+'))';
        }
        return result;
    }

    static deltaK(directPath){
        let mainPath = directPath.path;
        let firstOrderCycles = [];
        if(Object.keys(this.cyclePathsOrders).includes('1')){
            firstOrderCycles = this.cyclePathsOrders['1'];
        }
        let deltaKResult = '1';
        for(let i=0; i<firstOrderCycles.length; i++){
            let cycle = firstOrderCycles[i];
            let cyclePaths = cycle.path;
            let hasCycle = mainPath.some(p => cyclePaths.includes(p));
            if(!hasCycle){
                deltaKResult += '-('+cycle.nerdamer+')';
            }
        }
        return deltaKResult;
    }

}