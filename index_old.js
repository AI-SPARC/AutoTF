// $(document).ready(function () {
//   var goObject = go.GraphObject.make;

//   var myDiagram =
//     goObject(go.Diagram, "myDiagramDiv",
//       { // enable Ctrl-Z to undo and Ctrl-Y to redo
//         "undoManager.isEnabled": true
//       });

//   // define a simple Node template
//   myDiagram.nodeTemplate =
//     goObject(go.Node, "Horizontal",
//       // the entire node will have a light-blue background
//       { background: "#44CCFF" },
//       goObject(go.Picture,
//         // Pictures should normally have an explicit width and height.
//         // This picture has a red background, only visible when there is no source set
//         // or when the image is partially transparent.
//         { margin: 10, width: 50, height: 50, background: "red" },
//         // Picture.source is data bound to the "source" attribute of the model data
//         new go.Binding("source")),
//       goObject(go.TextBlock,
//         "Default Text",  // the initial value for TextBlock.text
//         // some room around the text, a larger font, and a white stroke:
//         { margin: 12, stroke: "white", font: "bold 16px sans-serif" },
//         // TextBlock.text is data bound to the "name" property of the model data
//         new go.Binding("text", "name"))
//     );

//   myDiagram.model = new go.Model(
//     [ // note that each node data object holds whatever properties it needs;
//       // for this app we add the "name" and "source" properties
//       { name: "Don Meow", source: "cat1.png" },
//       { name: "Copricat", source: "cat2.png" },
//       { name: "Demeter", source: "cat3.png" },
//       { /* Empty node data */ }
//     ]);
// });





function drawConnections() {
    for (var i in connections) {
      conn = connections[i];
      var cA = components[conn.nodeA];
      var cB = components[conn.nodeB];
      if (cA.rotated) {
        cAX = cA.connectorBX;
        cAY = cA.connectorBY + connectionGap;
      } else {
        cAX = cA.connectorBX + connectionGap;
        cAY = cA.connectorBY;
      }

      if (cB.rotated) {
        cBX = cB.connectorAX;
        cBY = cB.connectorAY - connectionGap;
      } else {
        cBX = cB.connectorAX - connectionGap;
        cBY = cB.connectorAY;
      }

      context.beginPath();
      context.moveTo(cA.connectorBX, cA.connectorBY);
      if (cAX != cBX && cAY != cBY) { // nao sera uma linha reta
        middlePointX = (cAX + cBX) / 2; // calcular ponto medio
        middlePointY = (cAY + cBY) / 2;

        conditionA = (cA.rotated) ? middlePointY < cA.y + componentHeight : middlePointX < cA.x + componentWidth;  // TODO PREPARAR CONDICOES ROTATION
        conditionB = (cB.rotated) ? middlePointY > cB.y : middlePointX > cB.x;

        if (conditionA || conditionB) { // ponto médio ultrapassa componentes
          context.lineTo(cAX, cAY);
          if (cAX < cB.x + componentWidth + connectorOffset) { // connection gap nao foi suficiente para ultrapassar componente B
            context.lineTo(cB.x + componentWidth + connectorOffset, cAY); // movimentando x
            context.lineTo(cB.x + componentWidth + connectorOffset, cAY + componentHeight / 2 + connectorOffset); // movimentando y
            X = cB.x + componentWidth + connectorOffset

          } else {
            context.lineTo(cAX, cAY + componentHeight / 2 + connectorOffset); // movimentando y
            X = cAX
          }

          if (cAY + componentHeight / 2 + connectorOffset < cB.y + componentHeight) { // primeira descida nao foi suficiente para ultrapassar altura de componente B
            context.lineTo(X, cB.y + componentHeight + connectorOffset); // movimentando y para compensar altura de B
            context.lineTo(cA.x - connectorOffset, cB.y + componentHeight + connectorOffset); // movimentando x
            Y = cB.y + componentHeight + 20;
          } else {
            context.lineTo(cA.x - connectorOffset, cAY + componentHeight / 2 + connectorOffset); // movimentando x
            Y = cAY + componentHeight / 2 + connectorOffset;
          } //(cA.x - connectorOffset, Y)


          if (cA.x - connectorOffset >= cBX) { // movimento de retorno nao suficiente para cobrir componente B
            context.lineTo(cBX, Y);  // movimentando x para compensar componente B
            context.lineTo(cBX, cBY); // movimentando y

          } else {
            context.lineTo(cA.x - connectorOffset, cBY); // movimentando y
          }
        } else { // regra do ponto medio
          if(!cA.rotated){
            if(middlePointX < cAX){
              cAX = middlePointX;
            }
          }
          context.lineTo(cAX, cAY);
          context.lineTo(middlePointX, cAY);
          context.lineTo(middlePointX, middlePointY);
          
          if(!cB.rotated){
            if(middlePointX > cBX){
              cBX = middlePointX;
            }
          }
          context.lineTo(middlePointX, cBY);
        }

      } else {
        context.lineTo(cAX, cAY);
        
        if(!cA.rotated && !cB.rotated){
          if (cB.connectorAX < cA.connectorBX) { // linhas reta, porém invertida
            context.lineTo(cAX, cA.y + componentHeight + connectorOffset);
            context.lineTo(cB.x - connectorOffset, cA.y + componentHeight + connectorOffset);
            context.lineTo(cB.x - connectorOffset, cBY);
          }
        }else if(cA.rotated && !cB.rotated){
          if(cA.connectorBX > cB.connectorAX){
            context.lineTo(cAX, cB.y + componentHeight + connectorOffset);
            context.lineTo(cB.x - connectorOffset, cB.y + componentHeight + connectorOffset);
            context.lineTo(cB.x - connectorOffset, cBY);
          }
          if(cA.connectorBY > cB.connectorAY){
            context.lineTo(cA.x - connectorOffset, cAY);
            context.lineTo(cA.x - connectorOffset, cBY);
          }
        }else if(!cA.rotated && cB.rotated){
          if(cA.connectorBX > cB.connectorAX){
            context.lineTo(cAX, cA.y - connectorOffset);
            context.lineTo(cBX, cA.y - connectorOffset);
          }
          if(cA.connectorBY > cB.connectorAY){
            context.lineTo(cB.x + componentWidth + connectorOffset, cAY);
            context.lineTo(cB.x + componentWidth + connectorOffset, cBY);
          }
        }else{
          if(cA.connectorBY > cB.connectorAY){
            context.lineTo(cA.x - connectorOffset, cAY);
            context.lineTo(cA.x - connectorOffset, cBY);
          }
        }
      }
      context.lineTo(cBX, cBY);
      context.lineTo(cB.connectorAX, cB.connectorAY);
      context.lineWidth = 3;
      context.strokeStyle = '#000000';
      context.stroke();
    }
  }