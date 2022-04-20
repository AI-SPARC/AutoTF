import { Connector } from "../components/connector.js";
import { Joint } from "../components/joint.js";
import { GraphArrow } from "../graph_components/graph_arrow.js";
import { GraphComponent } from "../graph_components/graph_component.js";
import { GraphNode } from "../graph_components/graph_node.js";


// BEGIN -> SYSTEM GRAPH------------------------------------------------------------------------------------------------------------

// Get components and connections list and generate a graph data structure to realize calculations on system
export function generateGraphFromSystem(components, connections){
  // Initialize graph structure: adjacency list
  let graph = {}

  // Generate nodes for each component in graph
  components.forEach(function(comp){
    graph[comp.uuid] = [];
  });


  // Variable to store joint to joint connections to be removed
  let jointToJointConnections = [];
  connections.forEach(function(conn){
    let a = conn.connectorA;
    if(a instanceof Connector)
      a = a.parent; // Required object must be the component
    let b = conn.connectorB;
    if(b instanceof Connector)
      b = b.parent; // Required object must be the component
    if(a instanceof Joint && b instanceof Joint){
      // if joint to joint, add it to previously defined array
      jointToJointConnections.push([a, b])
    }
    
    // Prepare graphs objects
    let aObj = {
      uuid: a.uuid,
      object: a,
      parentObject: b,
      connectorId: a instanceof Joint ? 'Joint' : conn.connectorA.id,
      parentConnectorId: b instanceof Joint ? 'Joint' : conn.connectorB.id
    }
    let bObj = {
      uuid: b.uuid,
      object: b,
      parentObject: a,
      connectorId: b instanceof Joint ? 'Joint' : conn.connectorB.id,
      parentConnectorId: a instanceof Joint ? 'Joint' : conn.connectorA.id
    }

    // Add b to a's list and a to b's list
    graph[a.uuid].push(bObj);
    graph[b.uuid].push(aObj);
  });
  // After graph is generated, remove joint to joint connections
  graph = removeDoubleJoints(graph, jointToJointConnections);
  return graph;
}

export function checkFullyConnectedGraph(graph){
  let nodes = Object.keys(graph);
  let fullyConnected = true;

  // Graph will be fully connected if all nodes can be visited from all nodes
  nodes.forEach(function(n){
    // initialize visited object
    let visited = {}
    nodes.forEach(function(n1){
      visited[n1] = false;
    });

    // Run dfs algoritm to verify which nodes are visited
    dfs(graph, graph[n], n, visited);
    
    let allVisited = true;
    // If any node isn't visited, graph is not fully connected
    Object.keys(visited).forEach(function(v){
      if(!visited[v]){
        allVisited = false;
        return;
      }
    });
    if(!allVisited){
      fullyConnected = false;
      return;
    }
  });
  return fullyConnected;
}

function removeDoubleJoints(graph, jointPairs){
  // jointPairs = array of joint tuples
  for(let i = 0; i<jointPairs.length; i++){
    let jointPair = jointPairs[i];
    let jointRemaining = jointPair[0];
    let jointRemoved = jointPair[1];
    // Remove only if they are different from each other (tuple items becomes equals joints after joint is removed)
    if(jointRemaining.uuid != jointRemoved.uuid){
      graph[jointRemoved.uuid].forEach(function(n){ // n = item connected to removed joint

        // Get joint register on item list to copy properties to new object
        let oldRegister = graph[n.uuid].filter(item => item.uuid === jointRemoved.uuid);
        oldRegister = oldRegister[0];

        // Remove excluded joint from nodes which it was connected
        graph[n.uuid] = graph[n.uuid].filter(item => item.uuid !== jointRemoved.uuid); 

        // if n.uuid equals to jointRemaining.uuid, it will be joint to joint connection. 
        // Then, there's no reason to add any new connections
        if(n.uuid != jointRemaining.uuid){
          // connected item new parent will be remaining joint
          n.parentObject = jointRemaining;
          // Add excluded joint nodes to the remaining joint
          graph[jointRemaining.uuid].push(n); 
          // Remove previously existing connections between the element and remaining joint to avoid duplications
          graph[n.uuid] = graph[n.uuid].filter(item => item.uuid !== jointRemaining.uuid);
          
          // create and add to graph (item adjacency list) the remaining joint that will be in place of excluded joint
          let obj = {
            uuid: jointRemaining.uuid,
            object: jointRemaining,
            parentObject: n.object,
            connectorId: 'Joint',
            parentConnectorId: oldRegister.parentConnectorId // Exactly the same connector of excluded joint
          }
          graph[n.uuid].push(obj);
        }
      });
      // Remove excluded joint from graph
      delete graph[jointRemoved.uuid];
      
      // Remove any excluded joint occurence from the array of tuples
      jointPairs.forEach(function(j){
        if(j[0].uuid == jointRemoved.uuid)
          j[0] = jointRemaining;
        if(j[1].uuid == jointRemoved.uuid)
          j[1] = jointRemaining;
      });
      // Restart array of tuples processing to ensure that modified items will be verified
      i = -1;
    }
  }
  return graph;
}

// Depth-first search algoritm
function dfs(graph, node, v, visited){
  visited[v] = true;
  node.forEach(function(neighbor){
    if(!visited[neighbor.uuid])
      dfs(graph, graph[neighbor.uuid], neighbor.uuid, visited);
  });
}

// END -> SYSTEM GRAPH --------------------------------------------------------------------------------------------------------------

// START -> LINK GRAPH --------------------------------------------------------------------------------------------------------------

export function generateLinkGraphAux(linkGraphElements){
  // Initialize graph structure: adjacency list
  let graph = {}

  // Generate nodes for each link component and link node in graph
  linkGraphElements.forEach(function(el){
    if(el instanceof GraphNode){
      graph[el.uuid] = {};
      graph[el.uuid].object = el;
      graph[el.uuid].type = 'node';
      graph[el.uuid].adjacencyList = [];
    }
  });
  linkGraphElements.forEach(function(el){
    if(el instanceof GraphComponent){
      graph[el.uuid] = {};
      graph[el.uuid].object = el;
      graph[el.uuid].type = 'branch';
      graph[el.uuid].adjacencyList = [];
    }
  });

  // For each arrow, create double connections between arrow components (for undirectional graph)
  linkGraphElements.forEach(function(el){
    if(el instanceof GraphArrow){
      graph[el.component1.uuid].adjacencyList.push(el.component2.uuid);
      graph[el.component2.uuid].adjacencyList.push(el.component1.uuid);
    }
  });

  return graph;

}

export function getRelatedGroups(graph){
  let nodes = Object.keys(graph);
  
  // initialize groups object
  let groups = {}
  nodes.forEach(function(n){
    groups[n] = undefined;
  });

  // Run dfs until all nodes became visited (classified in some group)
  let groupId = 0;
  nodes.forEach(function(n){
    if(groups[n] == undefined){
      groupId++;
      dfsGroup(graph, graph[n], n, groups, groupId);
    }
  });

  // Classify groups hash by group id
  let result = Object.keys(groups).reduce(function(newHash, groupItemName){
    newHash[groups[groupItemName]] = newHash[groups[groupItemName]] || [];
    newHash[groups[groupItemName]].push(graph[groupItemName]);
    return newHash;
  }, Object.create(null));
  
  return result;
}
// Depth-first search algoritm with group marking
function dfsGroup(graph, node, v, groups, group_id){
  // In this function, instead set visited as true, groups hashmap must be filled with group id on corresponding node
  if(groups[v] == undefined)
    groups[v] = group_id;
  node.adjacencyList.forEach(function(neighbor){
    if(groups[neighbor] == undefined)
      dfsGroup(graph, graph[neighbor], neighbor, groups, group_id);
  });
}

// Get spanning tree for aux graph considering all branches have same value
export function kruskal(graph, branches){
  // nodeGroups will store different groups for classify nodes
  let nodeGroups = {}
  // all connections must be marked to set to connect nodes without lose tree configuration
  let connections = [];
  // removed branches will be a function return
  let removedBranches = [];

  // All graph nodes (including branches)
  let nodes = Object.keys(graph);

  // For all graph elements, only nodes must be filtered to run foreach
  let graphNodes = nodes.filter(item => graph[item].type === 'node');
  

  // Verify adjacent nodes to save on connections array
  for(let i=branches.length-1; i>=0; i--){
    let b = branches[i];
    for(let j=0; j<graphNodes.length; j++){
      // N1 = uuid of each node element
      let n1 = graphNodes[j];
      // Initialize group for node
      nodeGroups[n1] =  n1 || j;
      // N = Graph object containing node
      let n = graph[n1];
      if(b.originNode.uuid === n.object.uuid){
        connections.push([n1, b.destinationNode.uuid, b]);
      }
    }
  }

  // For each connection, test if nodes are on same group to remove connection or not
  let nodeGroupKeys = Object.keys(nodeGroups);
  for(let i=0; i<connections.length; i++){
    let connection = connections[i];
    let group1 = nodeGroups[connection[0]];
    let group2 = nodeGroups[connection[1]];
    if(group1 != group2){
      nodeGroups[connection[1]] = group1;
      // all nodes from node 2 group must be reallocated to node 1 group
      for(let j=0; j<nodeGroupKeys.length; j++){
        if(nodeGroups[nodeGroupKeys[j]] == group2)
          nodeGroups[nodeGroupKeys[j]] = group1;
      }
    }else{
      // if node 2 are already on node 1 group, branch must be removed
      removedBranches.push(connection)
    }
    
  }

  // Copy graph and remove marked branches to obtain real spanning tree
  let spanningTree = JSON.parse(JSON.stringify(graph));
  for(let i=0; i<removedBranches.length; i++){
    let removedElement = removedBranches[i];
    let removedBranch = removedElement[2];
    delete spanningTree[removedBranch.uuid];
  }
  // Removed branch must be also removed from other elements adjacency list
  for(let i=0; i<removedBranches.length; i++){
    let removedElement = removedBranches[i];
    let removedBranch = removedElement[2];
    let spanningTreeUuids = Object.keys(spanningTree);
    for(let j=0; j<spanningTreeUuids.length; j++){
      let itemUuid = spanningTreeUuids[j];
      let itemTree = spanningTree[itemUuid];
      itemTree.adjacencyList = itemTree.adjacencyList.filter(element => element !== removedBranch.uuid);
    }
  }
  return [spanningTree, removedBranches]

}

export function getGraphCicles(graph, visited, usedConnections, elementUuid, nodesList, branchesList){
  let element = graph[elementUuid];
  visited[elementUuid] = true;
  let newBranchesList = JSON.parse(JSON.stringify(branchesList));
  let newNodesList = JSON.parse(JSON.stringify(nodesList));
  if(element.type === "branch"){
    newBranchesList.push(element.object);
  }else{
    newNodesList.push(element.object);
  }

  let result = undefined;
  for(let i=0; i<element.adjacencyList.length; i++){
    let neighborUuid = element.adjacencyList[i];
    let neighbor = graph[neighborUuid];
    let connectionId;
    if(elementUuid < neighborUuid){
      connectionId = elementUuid+neighborUuid;
    }else{
      connectionId = neighborUuid+elementUuid;
    }
    if(!usedConnections.includes(connectionId)){
      usedConnections.push(connectionId);
      if(visited[neighborUuid]){
        if(neighbor.type === "branch"){
          newBranchesList.push(neighbor.object);
        }else{
          newNodesList.push(neighbor.object);
        }
        result = [newNodesList, newBranchesList];
      }else{
        if(result === undefined)
          result = getGraphCicles(graph, visited, usedConnections, neighborUuid, newNodesList, newBranchesList);
      }
    }
  }
  return result;
}