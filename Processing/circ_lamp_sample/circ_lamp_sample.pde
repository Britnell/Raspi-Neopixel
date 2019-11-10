// Already adjusting for raspberry pi :
//     instead of running through all points in a way, 
//     it samples the correct points, in correct order
//      ref is center point

// Code

int P = 1;
int T = 1;


PVector center;
int FRAMERATE = 5;

//     *      Serial

import processing.serial.*;
Serial ardPort;
String serport= "COM5";

//     * * * *    points & rows

int PIXEL = 301;
int rows = 21;

float xSt = 33.333;
float ySt = 28.838;
  
float [] rowX = new float[rows];
float [] rowY = new float[rows];
int [] rowL = {5,10,11,14,15,16,17,18,17,18,19,18,17,18,17,16,15,14,11,10,5};
//     *      Setup

void setup()
{
  
  // **  Rows   
  
  // 10 up, 5
  rowY[0] = 10*ySt;
  rowX[0] = -2*xSt;
      rowY[20] = -rowY[0];
      rowX[20] = rowX[0];
  // 9 up, 10
  rowY[1] = 9*ySt;
  rowX[1] = -4.5*xSt;
      rowY[19] = -rowY[1];
      rowX[19] = rowX[1];
  // 8 up, 11
  rowY[2] = 8*ySt;
  rowX[2] = -5*xSt;
      rowY[18] = -rowY[2];
      rowX[18] = rowX[2];
  // 7 up, 14
  rowY[3] = 7*ySt;
  rowX[3] = -6.5*xSt;
      rowY[17] = -rowY[3];
      rowX[17] = rowX[3];
  // 6 up, 15
  rowY[4] = 6*ySt;
  rowX[4] = -7*xSt;
      rowY[16] = -rowY[4];
      rowX[16] = rowX[4];
   // 5 up, 16
  rowY[5] = 5*ySt;
  rowX[5] = -7.5*xSt;
      rowY[15] = -rowY[5];
      rowX[15] = rowX[5];
   // 4 up, 17
  rowY[6] = 4*ySt;
  rowX[6] = -8*xSt;
      rowY[14] = -rowY[6];
      rowX[14] = rowX[6];
   // 3 up, 18
  rowY[7] = 3*ySt;
  rowX[7] = -8.5*xSt;
      rowY[13] = -rowY[7];
      rowX[13] = rowX[7];
  // 2 up, 17
  rowY[8] = 2*ySt;
  rowX[8] = -8*xSt;
      rowY[12] = -rowY[8];
      rowX[12] = rowX[8];
  // 1 up, 18
  rowY[9] = 1*ySt;
  rowX[9] = -8.5*xSt;
      rowY[11] = -rowY[9];
      rowX[11] = rowX[9];
  // 1 up, 19
  rowY[10] = 0;
  rowX[10] = -9*xSt;
  
  size(800,800);
  
  ardPort = new Serial(this, serport, 115200);

  center = new PVector(width/2,height/2);
  hsv();
  
  // Eo setup
}


void draw()
{
  
  background(0);
  PVector mouse = new PVector(mouseX,mouseY);
  hsv();
  fill( map(mouseX,0,width,0,255),255,110);
  ellipse(mouseX,mouseY,200,200);
  
  
  // * * * *    ****    * * *     draw grid
  
  for(int R=0;R<rows;R++)
  {
    // r = row
    for(int l=0;l<rowL[R];l++)
    {
      // for led in row
      PVector p;
      if(R%2==0)
        p = new PVector( rowX[R] +l*xSt, -rowY[R] );
      else         
        p = new PVector( -rowX[R] -l*xSt, -rowY[R] );
        
      p.add(center);
      rgb();
      color c = get(int(p.x),int(p.y));
      fill(c);
      ellipse(p.x,p.y,5,5);
       if(true){
         int r = int(128+red(c)/2);
         int g = int(128+green(c)/2);
         int b = int(128+blue(c)/2);
         r = constrain(r,128,255);
         g = constrain(g,128,255);
         b = constrain(b,128,255);
         //println(R,":",l,"\t",r,"\t",g,"\t",b);
          ardPort.write(r);
          ardPort.write(g);
          ardPort.write(b);
        }
        //led++;
        
        // Eo for led
    }
    
    // Eo for row
  }
  ardPort.write(255);
  
  if(ardPort.available() >0){
     print(ardPort.readStringUntil('\n'));
  }
  
  // Eo draw
}

// top percent goes yellow
color map1( float perc ){
  float c1 = 80;
  if(perc<c1)
    return color( 0, 240, perc*2.55 );
  else 
    return color( map(perc,c1,100,0,20), 255, perc*2.55); 
}
// less dark
color map2( float perc ){
  float c1 = 60;
  float darkhalf = 20;
  if(perc<darkhalf)
    return color( 0, 255, map(perc,0,darkhalf,0,128) );
  else if(perc<c1)
    return color( 0, 255, map(perc,darkhalf,100,128,255) );
  else 
    return color( map(perc,c1,100,0,10), 240, map(perc,darkhalf,100,128,255) ); 
}
color map3( float perc ){
  color col0 = color(0,255,0);
  color cold = color(0,255,128);
  color colb = color(5,255,255);
  color col1 = color(15,255,255);
  
  float darkhalf = 20;
  float c1 = 70;
  float h,s,b;
  if(perc<darkhalf){
    h = map(perc,0,darkhalf,hue(col0),hue(cold) );
    s = map(perc,0,darkhalf,saturation(col0),saturation(cold) ); 
    b = map(perc,0,darkhalf,brightness(col0),brightness(cold) );
  }
  else if(perc<c1){
    h = map(perc,darkhalf,c1,hue(cold),hue(colb) );
    s = map(perc,darkhalf,c1,saturation(cold),saturation(colb) ); 
    b = map(perc,darkhalf,c1,brightness(cold),brightness(colb) );
  }
  else {
    h = map(perc,c1,100,hue(colb),hue(col1) );
    s = map(perc,c1,100,saturation(colb),saturation(col1) ); 
    b = map(perc,c1,100,brightness(colb),brightness(col1) );
  }
  
  return color( h, s, b ); 
}

PVector get_closest( Particle[] list, PVector pos){
  float clDist = 99999;
  int clId = -1;
  for(int x=0;x<list.length;x++){
    float dist = list[x].pos.copy().sub(pos).mag();
    if(  dist < clDist ){
      clDist = dist;
      clId = x; 
    }
  }
  return list[clId].pos;
}

PVector randomvector(float m){
   PVector ran = PVector.fromAngle(random(0,TWO_PI));
   return ran.mult(random(m/2,m));
}
PVector randomvector(float min, float max){
   PVector ran = new PVector(random(min,max),random(min,max) );
   return ran;
}
PVector zerovector(){
   return new PVector(0,0); 
}

void black_circle(float r, int N ){
  float thick = 50;
  float start = r +1*thick;
  strokeWeight(thick+1); stroke(0); noFill();
  for(int x=0;x<N;x++){
    ellipse(center.x,center.y,start,start);
    start += 2*thick;
  }
}

public class Particle
{
  public PVector pos, vel, acc, wrap;
  public float rad;
  public color col;
  
  public Particle()
  {
    pos = zerovector();
    vel = zerovector();
    acc = zerovector();
    wrap= new PVector(width,height);
    rad = 10;
    col = color( random(255),random(255),random(255) );
  }
  
  public void move(PVector p){
    pos = p.copy(); 
  }
  
  public void wrap(float edge){
    //if( wrap.x!=0 && wrap.y!=00 )
    if(true)
    {
      if( pos.x >wrap.x+edge)    pos.x = -edge;
      if(pos.x<-edge)            pos.x = wrap.x+edge;
      if(pos.y > wrap.y+edge)    pos.y = -edge;
      if(pos.y < -edge)          pos.y = wrap.y + edge;
    }
    // -
  }
  public void clear(){
    acc = zerovector(); 
  }
  
  // a point field , ctr of field , limit of field's reach , strength (and direction +- )
  public void field( PVector ctr, float radius, float strength, char type )
  {
    float fieldMag = radius;//sqrt(radius*radius+radius*radius);
    PVector vec = PVector.sub(ctr,pos);        // vec from field to point (self)
    // check for 0 magnitude?
    PVector result = vec.copy().normalize();
    float mag = vec.mag();
    if(type=='r')
    {
      mag = fieldMag - mag;
      if(mag!=0 && mag < fieldMag/2 )
      {
        // only field for outer third        
        mag *= mag;
        strength = pow(10,strength);
        acc.add( result.mult( mag / strength ) );
        //
      }
    }
    else
    {
      // normal point fields
      if(mag!=0 && mag < fieldMag )
      {
        mag = fieldMag - mag;
        mag *= mag;
        strength = pow(10,strength);
        
        //vel.add( result.mult( mag / strength ) );
        if(type=='n')
          acc.add( result.mult( -1 / strength ) );
        else
          acc.add( result.mult( mag / strength ) );
        //
      }
    }
    
    
    // Eo field
  }  
  
  public void friction(float fac){
    fac = pow(10,fac);
    vel.sub( vel.copy().div(fac) );
  }
  public void update(float fact){
    pos.add(PVector.mult(vel,fact));
    vel.add( PVector.mult(acc,fact));
  }
  
  public void drew(){
    noStroke(); fill(col);
    ellipse(pos.x,pos.y, rad,rad);
  }
  
  // Eo
}


void rgb(){
  colorMode(RGB, 255, 255, 255);
}
void hsv(){
  //colorMode(HSB, 360, 100, 100);
  colorMode(HSB, 255);
}