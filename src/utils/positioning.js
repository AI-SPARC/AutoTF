

export function distanceX(compA, compB){
  return compA.x - (compB.x + compB.realWidth());
}

export function distanceY(compA, compB){
  return compA.y - (compB.y + compB.realHeight());
}

export function middlePointX(compA, compB){
  if(compA.x < compB.x){
    return ((compA.x + compA.realWidth()) + compB.x) / 2;
  }else if(compA.x > compB.x){
    return ((compB.x + compB.realWidth()) + compA.x) / 2;
  }else{
    return compA.x;
  }
}
export function middlePointY(compA, compB){
  if(compA.y < compB.y){
    return ((compA.y + compA.realHeight()) + compB.y) / 2;
  }else if(compA.y > compB.y){
    return ((compB.y + compB.realHeight()) + compA.y) / 2;
  }else{
    return compA.y;
  }
}