import { GraphArrow } from "../graph_components/graph_arrow";
import { GraphComponent } from "../graph_components/graph_component";
import { GraphNode } from "../graph_components/graph_node";
import { getGraphCicles, kruskal } from "../utils/graph_utils";
import { generateGraphElements, initializeDFSCanvas } from "./dfs_canvas_events";

export class DFSContext {
    static graphCanvas = null;
    static graphContext = null;
    static graphComponents = [];

    static componentPositionX = null;
    static componentPositionY = null;
    static clickPositionX = null;
    static clientPositionY = null;
    static dragging = false;
    static itemSelected = null;
    static componentXs = [];
    static componentYs = [];

    static n = 0;
    static b = 0;
    static c = 0;
    static fe = 0;
    static fc = 0;
    static z = 0;
    static t = 0;
    static hasSolution = false;
    static dfs = {};

    static xValues = {};
    static x = [];
    static y = [];
    static xe = [];
    static xs = [];

    static A = [];
    static A1 = [];
    static A2 = [];
    static A3 = [];
    static A4 = [];
    static A5 = [];
    static A5N = [];

    static drawGraph(){
        let context = this.graphContext;
        context.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
        this.graphComponents.forEach(function(c){
            c.draw(DFSContext.graphContext);
        });
    }

    static printMatrix(matrix, elementId){
        let html = '<thead><tr>';
        for(let i=0; i<=2*this.b; i++){
            if(i === 0)
                html += '<th>X</th>';
            else{
                html += "<th>"+i+"</th>";
            }
        }
        html += '</tr></thead>';
        html += '<tbody>';
        if(matrix.length === 0){
            html += '<tr>';
            html += '<th>1</th>';
            for(let i=0; i<2*this.b; i++)
                html += '<td></td>';
            html += '</tr>';
        }else{
            let lineNumber = 1;
            for(let i=0; i<matrix.length; i++){
                html += '<tr>';
                html += "<th>"+lineNumber+"</th>";
                for(let j=0; j<matrix[i].length; j++){
                    html += "<td>"+matrix[i][j]+"</td>";
                }
                lineNumber++;
                html += '</tr>';
            }
        }
        html += '</tbody>';
        $(elementId).html(html);
    }

    static setVariablesFoundOnMatrix(variablesFound){
        let i = 0;
        $('#aMatrixTable tbody th').each(function(){
            let item = JSON.parse(variablesFound[i]);
            let optionName;
            if(item.variableType === 'flow'){
                optionName = "F("+item.id+")";
            }else{
                optionName = "E("+item.id+")";
            }
            $(this).html($(this).html()+": "+optionName);
            i++;
        });
    }

    static setVariableSelectOptions(){
        let html = '';
        for(let i=0; i<this.xe.length; i++){
            let item = JSON.parse(this.xe[i]);
            let optionName;
            if(item.variableType === 'flow'){
                optionName = "F("+item.id+")";
            }else{
                optionName = "E("+item.id+")";
            }
            html += '<option value="'+i+'">'+optionName+'</option>';
        }
        $('#inputVariableSelect').html(html);

        html = '';
        for(let i=0; i<this.xs.length; i++){
            let item = JSON.parse(this.xs[i]);
            let optionName;
            if(item.variableType === 'flow'){
                optionName = "F("+item.id+")";
            }else{
                optionName = "E("+item.id+")";
            }
            html += '<option value="'+i+'">'+optionName+'</option>';
        }
        $('#outputVariableSelect').html(html);
    }


    static initializeVariables() {
        this.graphComponents = [];
        this.componentPositionX = null;
        this.componentPositionY = null;
        this.clickPositionX = null;
        this.clientPositionY = null;
        this.dragging = false;
        this.itemSelected = null;
        this.componentXs = [];
        this.componentYs = [];

        this.n = 0;
        this.b = 0;
        this.c = 0;
        this.fe = 0;
        this.fc = 0;
        this.z = 0;
        this.t = 0;
        this.dfs = {};
        this.hasSolution = false;

        this.xValues = {};
        this.x = [];
        this.y = [];
        this.xe = [];
        this.xs = [];

        this.A = [];
        this.A1 = [];
        this.A2 = [];
        this.A3 = [];
        this.A4 = [];
        this.A5 = [];
        this.A5N = [];
    }

    static initializeDFS(linkGraph, auxLinkGraph, relatedGroups){
        this.initializeVariables();
        this.n = this.b = this.c = this.fe = this.fc = this.z = this.t = 0
        let nodes = linkGraph.filter(item => item instanceof GraphNode);
        let branches = linkGraph.filter(item => item instanceof GraphComponent);
        branches.sort(function(a, b){
            if(a.classId === 'EffortFont' && b.classId === 'FlowFont'){
                return -1;
            }
            if(a.classId === 'FlowFont' && b.classId === 'EffortFont'){
                return 1;
            }
            if((a.classId === 'EffortFont' || a.classId === 'FlowFont') && b.classId === 'Impedance'){
                return -1;
            }
            if(a.classId === 'Impedance' && (b.classId === 'EffortFont' || b.classId === 'FlowFont')){
                return 1;
            }
            return 0;
        });
        let arrows = linkGraph.filter(item => item instanceof GraphArrow);
        this.n = nodes.length;
        this.b = branches.length;
        this.c = auxLinkGraph.length;

        this.dfs = {};
        this.x = [];
        this.y = [];
        this.xe = [];
        this.xs = [];

        for(let i = 0; i < this.b; i++){
            let r = branches[i];
            let varId = i+1;
            let varX = this.effortVariable(r, null, null, null);
            let varY = this.effortVariable(r, arrows, null, null);
            this.x.push(varX);
            this.y.push(varY);
            this.dfs[varId] = {
                object: JSON.parse(varX),
                adjacencyList: []
            };
            if(r.classId == 'EffortFont'){
                this.xe.push(varX);
            }else{
                this.xs.push(varX);
            }
            if(r.classId == 'FlowFont' || r.classId == 'EffortFont'){
                this.fe++;
            }else if(r.classId == 'Impedance'){
                this.z++;
            }
        }

        for(let i = 0; i < this.b; i++){
            let r = branches[i];
            let varId = this.b+i+1;
            let varX = this.flowVariable(r, null, null, null);
            let varY = this.flowVariable(r, arrows, null, null);
            this.x.push(varX);
            this.y.push(varY);
            this.dfs[varId] = {
                object: JSON.parse(varX),
                adjacencyList: []
            };
            if(r.classId == 'FlowFont'){
                this.xe.push(varX);
            }else{
                this.xs.push(varX);
            }
        }

        this.setVariableSelectOptions();
        this.generateMatrices(branches, auxLinkGraph, relatedGroups);
        this.generateDFS(branches);
    }

    static generateMatrices = function(branches, auxGraph, relatedGroups){
        this.generateA1(branches);
        this.generateA2(branches);
        this.generateA3(branches);
        this.generateA4(auxGraph, branches);
        this.generateA5(relatedGroups, branches);
        this.generateA();
    }

    static generateA1 = function(branches){
        let k = 0;
        for(let i=0; i<this.b; i++){
            let r = branches[i];
            if(r.classId == 'Impedance'){
                this.A1[k] = this.A1[k] || Array(2*this.b).fill('0');
                let ve = this.effortVariable(r, null, null, null);
                let vf = this.flowVariable(r, null);
                let jVe = this.x.indexOf(ve);
                let jVf = this.x.indexOf(vf);
                this.A1[k][jVe] = '-1';
                this.A1[k][jVf] = r.gain;
                k++;
            }
        }
        this.printMatrix(this.A1, '#a1MatrixTable');
    }

    static generateA2 = function(branches){
        let k = 0;
        for(let i=0; i<this.b; i++){
            let r = branches[i];
            if(r.classId == 'ControlledFlowFont' || r.classId == 'ControlledEffortFont'){
                this.A2[k] = this.A2[k] || Array(2*this.b).fill('0');
                let vfc;
                if(r.classId == 'ControlledEffortFont'){
                    vfc = this.effortVariable(r, null, null, null);
                }else{
                    vfc = this.flowVariable(r, null);
                }
                let vctrl = r.controlVariable; // TODO - Control variable does not exist since controlled fonts are not being considered
                let jVfc = this.x.indexOf(vfc);
                let jVctrl = this.x.indexOf(vctrl);
                this.A2[k][jVfc] = '-1';
                this.A2[k][jVctrl] = r.gain;
                k++;
            }
        }
        this.printMatrix(this.A2, '#a2MatrixTable');
    }

    static generateA3 = function(branches){
        let k = 0;
        for(let i=0; i<this.b; i++){
            let r1 = branches[i];
            if(r1.classId == '1-TransformerPort' || r1.classId == '1-RotatorPort' || r1.classId == '1-GenericDoublePort'){
                this.A3[k] = this.A3[k] || Array(2*this.b).fill('0');
                this.A3[k+1] = this.A3[k+1] || Array(2*this.b).fill('0');
                let r2 = branches.filter(item => item.uuid == r1.coupledBranch) // TODO - Coupled branch does not exist since two ports elements are not being considered
                let jve1 = this.x.indexOf(this.effortVariable(r1, null, null, null));
                let jve2 = this.x.indexOf(this.effortVariable(r2, null, null, null));
                let jvf1 = this.x.indexOf(this.flowVariable(r1, null));
                let jvf2 = this.x.indexOf(this.flowVariable(r2, null));
                switch(r1.classId){
                    case '1-RotatorPort':
                        this.A3[2*k][jve2] = '-1';
                        this.A3[2*k][jvf1] = r1.gain;
                        this.A3[2*k+1][jve1] = '1';
                        this.A3[2*k+1][jvf2] = r1.gain;
                        break;
                    case '1-TransformerPort':
                        this.A3[2*k][jve1] = '-1';
                        this.A3[2*k][jve2] = r1.gain;
                        this.A3[2*k+1][jvf1] = r1.gain;
                        this.A3[2*k+1][jvf2] = '1';
                        break;
                    case '1-GenericDoublePort':
                        this.A3[2*k][jve1] = r1.gain[0]; // TODO - Generic double ports are not being considered. Gain is not an array yet
                        this.A3[2*k][jve2] = '-1';
                        this.A3[2*k][jvf1] = r1.gain[1];
                        this.A3[2*k+1][jve1] = r1.gain[2];
                        this.A3[2*k+1][jvf1] = r1.gain[3];
                        this.A3[2*k+1][jvf2] = '1';
                        break;
                }
            }
        }
        this.printMatrix(this.A3, '#a3MatrixTable');
    }

    static generateA4 = function(auxGraph, branches){
        let kruskalResult = kruskal(auxGraph, branches);
        let spanningTree = kruskalResult[0];
        let removedBranches = kruskalResult[1];
        for(let i=0; i<removedBranches.length; i++){
            this.A4[i] = this.A4[i] || Array(2*this.b).fill('0');
            let r = JSON.parse(JSON.stringify(removedBranches[i][2]));
            let aux2 = JSON.parse(JSON.stringify(spanningTree));
            let originNode = r.originNode;
            let destinationNode = r.destinationNode;
            aux2[r.uuid] = {
                object: r,
                type: 'branch',
                adjacencyList: [originNode.uuid, destinationNode.uuid]
            }
            aux2[originNode.uuid].adjacencyList.push(r.uuid);
            aux2[destinationNode.uuid].adjacencyList.push(r.uuid);

            let visited = {}
            let elementUuids = Object.keys(aux2);
            for(let j=0; j<elementUuids.length; j++){
                visited[elementUuids[j]] = false;
            }
            let cicles = getGraphCicles(aux2, visited, [], originNode.uuid, [], []);
            let ciclesBranches = cicles[1];
            let ciclesNodes = cicles[0];

            let yp = [];
            let yn = [];
            for(let j=0; j<ciclesNodes.length-1; j++){
                let r2 = ciclesBranches[j];
                yp.push(this.effortVariable(r2, null, ciclesNodes[j], ciclesNodes[j+1]));
                yn.push(this.effortVariable(r2, null, ciclesNodes[j+1], ciclesNodes[j]));
            }

            for(let k=0; k<yp.length; k++){
                let j = this.y.indexOf(yp[k]);
                if(j !== -1){
                    this.A4[i][j] = '1';
                }else{
                    j = this.y.indexOf(yn[k]);
                    this.A4[i][j] = '-1';
                }
            }
        }
        this.printMatrix(this.A4, '#a4MatrixTable');
    }

    static generateA5(relatedGroups, branches){
        let kA5 = 0;
        let groups = Object.keys(relatedGroups);
        for(let k=0; k<groups.length; k++){
            let kccAux = relatedGroups[groups[k]];
            let nodes = kccAux.filter(item => item.type === 'node');
            let kn = nodes.length;
            for(let i=0; i<kn; i++){
                this.A5[i+kA5] = this.A5[i+kA5] || Array(2*this.b).fill('0');
                let nodeId = nodes[i].object.uuid;
                for(let j=0; j<this.b; j++){
                    let branch = branches[j];
                    if(branch.originNode.uuid === nodeId){
                        this.A5[i+kA5][this.b+j] = '1';
                    }
                    if(branch.destinationNode.uuid === nodeId){
                        this.A5[i+kA5][this.b+j] = '-1';
                    }
                }
            }
            let imax = 0;
            let max = 0;
            for(let j=0; j<this.b; j++){
                if(this.A5[kA5][this.b+j] !== '0')
                    max++;
            }
            for(let i=1; i<kn; i++){
                let qtd = 0;
                for(let j=0; j<this.b; j++){
                    if(this.A5[i+kA5][this.b+j] !== '0'){
                        qtd++;
                    }
                }
                if(qtd > max){
                    max = qtd;
                    imax = i;
                }
            }

            let newI = 0;
            for(let i=0; i<this.A5.length; i++){
                if(i !== imax+kA5){
                    this.A5N[newI] = this.A5N[newI] || Array(2*this.b).fill('0');
                    for(let j=0; j<this.A5[i].length; j++){
                        this.A5N[newI][j] = this.A5[i][j];
                    }
                    newI++;
                }
            }
            kA5 = kA5 + kn;
        }
        this.printMatrix(this.A5, '#a5MatrixTable');
        this.printMatrix(this.A5N, '#a5NMatrixTable');
    }

    static generateA = function(){
        let newI = 0;
        for(let i=0; i<this.A4.length; i++){
            this.A[newI] = [];
            for(let j=0; j<this.A4[i].length; j++){
                this.A[newI].push(this.A4[i][j]);
            }
            newI++;
        }
        for(let i=0; i<this.A1.length; i++){
            this.A[newI] = [];
            for(let j=0; j<this.A1[i].length; j++){
                this.A[newI].push(this.A1[i][j]);
            }
            newI++;
        }
        for(let i=0; i<this.A2.length; i++){
            this.A[newI] = [];
            for(let j=0; j<this.A2[i].length; j++){
                this.A[newI].push(this.A2[i][j]);
            }
            newI++;
        }
        for(let i=0; i<this.A3.length; i++){
            this.A[newI] = [];
            for(let j=0; j<this.A3[i].length; j++){
                this.A[newI].push(this.A3[i][j]);
            }
            newI++;
        }
        for(let i=0; i<this.A5N.length; i++){
            this.A[newI] = [];
            for(let j=0; j<this.A5N[i].length; j++){
                this.A[newI].push(this.A5N[i][j]);
            }
            newI++;
        }
        this.printMatrix(this.A, '#aMatrixTable');
    }

    static generateDFS = function(branches){
        let searchCompleted = false;
        let currentNode;
        let treeRoot = undefined;
        let AUsedLines = Array(this.A.length).fill(false);
        for(let i=0; i<this.xe.length; i++){
            let xeElement = JSON.parse(this.xe[i]);
            if(i === 0){
                treeRoot = {
                    object: xeElement,
                    children: [],
                    parent: undefined
                };
                currentNode = treeRoot;
            }else{
                let newNode = {
                    object: xeElement,
                    children: [],
                    parent: currentNode
                };
                currentNode.children.push(newNode);
                currentNode = newNode;
            }
        }

        let variablesFound = this.searchVariables(currentNode, [], searchCompleted, AUsedLines);
        if(variablesFound !== undefined && variablesFound.length > 0){
            this.hasSolution = true;
            this.setVariablesFoundOnMatrix(variablesFound);
        }
        const nerdamer = require('../lib/nerdamer/nerdamer.core');

        if(variablesFound !== undefined){
            let tid = 0;
            for(let i=0; i<this.A.length; i++){
                // Foreach line of A matriz => i = "A" matrix line

                let jvs = this.x.indexOf(variablesFound[i]); // Index of variable found on x array
                let jvsid = jvs + 1; // Id starts from 1
                for(let j=0; j<this.A[i].length; j++){ // Foreach column of A matriz line
                    if(this.A[i][j] !== '0' && j !== jvs){ // Consider gain only if value different than zero and index not corresponding to variable found
                        let jvoid = j+1; // Id starts from 1
                        let gain = '-('+this.A[i][j]+')/('+this.A[i][jvs]+')';
                        this.dfs[jvoid].adjacencyList.push({
                            id: tid,
                            connectedTo: jvsid,
                            gain: nerdamer("expand("+gain+")").toString()
                        })
                        tid++;
                    }
                }
            }
        }
        // Store component values for evaluate final expression on mason context
        for(let i=0; i<this.b; i++){
            let r = branches[i];
            this.xValues[r.id] = r.value;
        }
        if(this.graphCanvas == null)
            initializeDFSCanvas();
        this.graphComponents = [];
        generateGraphElements(this.dfs);
        this.drawGraph();
    }

    static searchVariables = function(currentNode, variablesFound, searchCompleted, AUsedLines){
        let newVariablesFound = JSON.parse(JSON.stringify(variablesFound));
        let newAUsedLines = JSON.parse(JSON.stringify(AUsedLines));
        let i;
        for(let iA=0; iA<this.A.length; iA++){
            if(!newAUsedLines[iA]){
                i = iA;
                break;
            }
        }
        let notNullIndexArr = [];
        let availableVariables = [];
        for(let j=0; j<this.A[i].length; j++){
            if(this.A[i][j] !== '0'){
                notNullIndexArr.push(j);
            }
        }
        for(let j=0; j<notNullIndexArr.length; j++){
            let v = this.x[notNullIndexArr[j]];
            if(this.xe.indexOf(v) === -1 && newVariablesFound.indexOf(v) === -1){
                availableVariables.push(v)
            }
        }
        if(availableVariables.length === 0){
            // backtracking
            return undefined;
        }

        for(let j=0; j<availableVariables.length; j++){
            let v = availableVariables[j];
            newVariablesFound.push(v);
            newAUsedLines[i] = true;

            let newNode = {
                object: v,
                children: [],
                parent: currentNode
            };
            currentNode.children.push(newNode);
            currentNode = newNode;

            searchCompleted = newVariablesFound.length === this.A.length;
            let nextResult;
            if(searchCompleted){
                return newVariablesFound;
            }else{
                nextResult = this.searchVariables(currentNode, newVariablesFound, searchCompleted, newAUsedLines);
            }
            if(nextResult !== undefined){
                return nextResult;
            }else{
                newVariablesFound.pop();
                newAUsedLines[i] = false;
            }
        }
        return undefined;
    }

    static effortVariable = function(branch, arrows, node1, node2){
        if(arrows == null && node1 == null){
            return JSON.stringify({
                    id: branch.id,
                    variableType: 'effort'
                });
        }
        let originNode, destinationNode;
        if(node1 == null){
            let originArrow = arrows.filter(item => item.component2.uuid === branch.uuid);
            originNode = originArrow[0].component1;
            let destinationArrow = arrows.filter(item => item.component1.uuid === branch.uuid);
            destinationNode = destinationArrow[0].component2;
        }else{
            originNode = node1;
            destinationNode = node2;
        }
        return JSON.stringify({
            id: branch.id,
            variableType: 'effort',
            originNode: originNode.id,
            destinationNode: destinationNode.id
        });
    }

    static flowVariable = function(branch, arrows){
        if(arrows == null){
            return JSON.stringify({
                id: branch.id,
                variableType: 'flow'
            });
        }
        let originArrow = arrows.filter(item => item.component2.uuid === branch.uuid);
        let originNode = originArrow[0].component1;
        let destinationArrow = arrows.filter(item => item.component1.uuid === branch.uuid);
        let destinationNode = destinationArrow[0].component2;
        return JSON.stringify({
            id: branch.id,
            variableType: 'flow',
            originNode: originNode.id,
            destinationNode: destinationNode.id
        });


        
    }

} 