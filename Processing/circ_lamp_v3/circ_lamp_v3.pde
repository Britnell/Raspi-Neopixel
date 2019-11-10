// Already adjusting for raspberry pi :
//     instead of running through all points in a way, 
//     it samples the correct points, in correct order
//      ref is center point

// Code

int P = 4;
int T = 4;

Particle [] peak = new Particle[P];
Particle [] trough = new Particle[T];

PVector center;
float circ, ledcirc;
/* frict 2 too low, parts get stranded
* 
*/
int FRAMERATE = 10;
float UPDATERATE = 2.0;
float frict = 2.8;  // 2.8
float initSpeed = 2.2;  // init speed
float slowest    = 1.0;   
float ringfield = 6;  
boolean dots = true;
boolean drawing = true;
boolean leding = true;
float slowestadd = initSpeed-slowest;
float SIZE;


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
  frameRate(FRAMERATE);
  SIZE = height*2/3;
  circ = SIZE*1.5;
  ledcirc = 650;
  
  ardPort = new Serial(this, Serial.list()[0], 115200);

  center = new PVector(width/2,height/2);
  hsv();
  
  for(int p=0;p<P;p++){
    peak[p] = new Particle(); 
    peak[p].pos = new PVector(center.x,center.y).add(randomvector(-circ/3,circ/3));
    peak[p].vel = randomvector(initSpeed);
    peak[p].col = color(5, 100, 250);
  }
  for(int t=0;t<T;t++){
    trough[t] = new Particle(); 
    trough[t].pos = new PVector(center.x,center.y).add(randomvector(-circ/3,circ/3));
    trough[t].vel = randomvector(initSpeed);
    trough[t].col = color(140, 100, 250);
  }
  
  // TEST
  //for(int x=0; x<100; x++){
  //  println(x,expon(x,0,100,0,100)); 
  //}
  
  // Eo setup
}


void draw()
{
  float totmag = 0;
  if(drawing) background(0);
  PVector mouse = new PVector(mouseX,mouseY);
  
  if(drawing) {
  noFill();  stroke(255); strokeWeight(5);
  //ellipse(center.x, center.y, ledcirc,ledcirc);  // LED circle
  stroke(60);
  ellipse(center.x, center.y, circ,circ);  // field circ
  }
  
  for(int p=0;p<P;p++){
    peak[p].clear();
    peak[p].field(center, circ*1, ringfield, 'r');
    peak[p].friction(frict);
    peak[p].update(UPDATERATE);
    if(drawing && dots)  peak[p].drew();
    // VECTOR to circ center mag = HALF circ radius
    if(peak[p].vel.mag()<slowest)
    if( PVector.sub(peak[p].pos,center).mag() <ledcirc/2) {  // if center ish
      peak[p].vel.add( randomvector(slowestadd) );
    }
    if(p<T)
    {
      int t=p;
      trough[t].clear();
      trough[t].field(center, circ*1, ringfield, 'r');
      trough[t].friction(frict);
      trough[t].update(UPDATERATE);
      if(drawing && dots)  trough[t].drew();
      if(trough[t].vel.mag() < slowest)
      if( PVector.sub(trough[t].pos,center).mag() <ledcirc/2) { // if center ish
        trough[t].vel.add( randomvector(slowestadd) );
      }
    }
  }
  
  // * * * *    ****    * * *     draw grid
  int led = 0;
  
  for(int R=0;R<rows;R++)
  {
    // r = row
    for(int l=0;l<rowL[R];l++)
    {
      // for led in row
      PVector p;
      if(R%2==0)  // top * even rows
        p = new PVector( rowX[R] +l*xSt, -rowY[R] );
      else
        p = new PVector( -rowX[R] -l*xSt, -rowY[R] );
      
      p.add(center);
      
        // get closest peak and trough
      PVector cl_peak = get_closest(peak,p);
      PVector cl_trough = get_closest(trough,p);
      float down = p.copy().sub(cl_trough).mag();
         // calc
      float up = cl_peak.copy().sub(p).mag();
      float ratio = 100*down/(up+down);
      float rad = map(ratio,0,100,0,xSt);
      
      color c=map_rb(ratio);  // map1, map3
      
        // draw
        if(drawing) {
          fill(c);  noStroke();
          ellipse(p.x,p.y, rad,rad);
        }
        
       if(leding){
         //rgb();
         //int r = int(128+red(c)/2);
         //int g = int(128+green(c)/2);
         //int b = int(128+blue(c)/2);
         //r = constrain(r,128,255);
         //g = constrain(g,128,255);
         //b = constrain(b,128,255);
         int r = int(red(c));
         int g = int(green(c));
         int b = int(blue(c));
         if(r==255) r=254;
         if(g==255) g=254;
         if(b==255) b=254;
         //println(R,":",l,"    ",r,"\t",g,"\t",b);
         //if(ratio<10)   println(R,":",l,"    ",r,"\t",g,"\t",b);
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

color map_rgb(float perc)
{
  float r,g,b;
  float c1 = 80;
  
  r = expon(perc,0,100,0,255);
  
  if(perc>c1)
    g = map(perc,c1,100,0,80);
  else
    g = 0;
  
  b=0;
  
  rgb();
  return color( r, g, b );
}

color map_rb(float perc)
{
  float r,g,b;
  float c1 = 80;
  
  r = expon(perc,0,100,0,255);
  
  b = expon(perc,100,0,0,255);
  
  g=0;
  
  rgb();
  return color( r, g, b );
}

float linear(float x, float imin, float imax, float omin, float omax)
{
  return omin + (x-imin) * (omax-omin) / (imax-imin); 
}
float expon(float x, float imin, float imax, float omin, float omax)
{
  float prop = (x-imin)/ (imax-imin);
  return omin +  prop *prop*prop *(omax-omin) ; 
}

// top percent goes yellow
color map1( float perc ){
  hsv();
  float c1 = 70;
  if(perc<c1)
    return color( 0, 255, perc*2.55 );
  else 
    return color( map(perc,c1,100,0,30), 255, perc*2.55); 
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
  hsv();
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