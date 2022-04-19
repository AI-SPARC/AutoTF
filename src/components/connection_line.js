export class ConnectionLine{
  constructor(a, b, c, x0, xf, y0, yf){
    this.a = a;
    this.b = b;
    this.c = c;
    this.x0 = x0;
    this.xf = xf;
    this.y0  = y0;
    this.yf = yf;
  }

  intersect(line){
    // If determinant different from zero, there is an intersection between to lines
    let det = this.a * line.b - this.b * line.a;
    if(Math.abs(det) < 1e-6) return null;
    
    // Getting (x,y) intersection point
    let x = (line.b*(-this.c) + (-this.b)*(-line.c))/det;
    let y = ((-line.a)*(-this.c) + this.a*(-line.c))/det;
    if(Math.abs(this.test(x, y)) > 1e-6 || Math.abs(line.test(x, y)) > 1e-6) return null;
    return {x: x, y: y, line1: this, line2: line};
  }

  test(x, y){
    // check if x collision point is inside connection x range
    let xTest = (x >= this.x0 && x <= this.xf) || (x >= this.xf && x <= this.x0);
    // check if y collision point is inside connection y range
    let yTest = (y >= this.y0 && y <= this.yf) || (y >= this.yf && y <= this.y0);
    
    let gap = 15;
    if(Math.abs(this.x0 - this.xf) > 1e-6)
      xTest = xTest && ((x > this.x0 + gap && x < this.xf - gap) || (x > this.xf + gap && x < this.x0 - gap));
    if(Math.abs(this.y0 - this.yf) > 1e-6)
      yTest = yTest && ((y > this.y0 + gap && y < this.yf - gap) || (y > this.yf + gap && y < this.y0 - gap));
    if(!xTest || !yTest) return -1;
    // If (x,y) is a solution for intersection point, when replaced on line function it must be 0
    return this.a * x + this.b * y + this.c;
  }

  toString(){
    let s = this.a + " x ";
    s += (this.b >= 0 ? "+ "+this.b : "- "+ (-this.b) );
    s += " y ";
    s += (this.c >= 0 ? "+ "+this.c : "- "+ (-this.c) );
    return s + " = 0";
  }

}