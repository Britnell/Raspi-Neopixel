/*
 *     This connects to another Socket server to receive RGB values from it... 
 *  	unnecessary really, easier if server is on here...
 */


const SerialPort = require('serialport');
var sleep = require('sleep');

var arduinoport = '/dev/ttyACM0';

// const port = new SerialPort(arduinoport, {
//   baudRate: 115200
// });

const port = new SerialPort(arduinoport, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
  else{
  	console.log(" PORT OPEN");
  }

  // 2s delay for UART setup
  setTimeout(function(){   setup();  },2000);
})


// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message)
});

port.on('data',function(data){
  console.log('rec:\t',data);
});


//  ** *     Lamp Pixels

class pixel {
  constructor(l){
    this.x=0;
    this.y=0;

    this.col = new Uint8Array(3); 

    this.rw = 0;
    this.cl = 0;

    this.r=0;
    this.g=0;
    this.b=0;

    this.n=l;
  }
} 


var pixels = [];
var rows  = 21;
var LED_per_row = [ 5,10,11,14,15,16,17,18,17,18,19,18,17,18,17,16,15,14,11,10,5 ];

function create_pixel()
{
  
  var n = 0;
  var xStep = 33.333;   // PROCESSING
  var yStep = 28.838;

  xStep = 1;
  yStep = 0.866025;

  for(var row = 0; row<rows; row++ )
  {    // * Rows
    let rowLEDS = LED_per_row[row];
    let rowY;
    let rowX = -xStep * ((rowLEDS-1)/2);
    
    if(row<10){       rowY = (10-row)*yStep;    }
    else if(row>10){       rowY = -(row-10)*yStep;    }
    else{      rowY = 0;    }


    for( var c=0; c<rowLEDS; c++ )
    {      // * Leds
      let cRev;
      if(row%2==0)  cRev = c;
      else          cRev= (rowLEDS-1-c);

      pixels[n] = new pixel(n);
      pixels[n].rw = row;  // row
      pixels[n].cl = cRev;    // collumn
      pixels[n].col = [0,0,0];
      pixels[n].x = rowX + cRev*xStep;
      pixels[n].y = rowY;
      n++;
    }
  }
  // console.log(pixels);
  // Eo func
}


var col = 0;
var dir = 'u';

var modes = [ 'RADIAL', 'LINEAR' ];
var mode = modes[1];



// ##################################


var socketServer = 'http://smartpi:8000';
var socket = require('socket.io-client')(socketServer);

socket.on('connect',()=>{
  console.log('connected to socket server ', socketServer);
});
socket.on('disconnect',()=>{
  console.log(" Disconnected from socket server... ");
});

socket.on('msg',(data)=>{
  console.log(' [ socket-msg ] :\t',data );
});

socket.on('lamp',(data)=>{
  console.log(' #socket>Lamp : ', data  );
  if(data.hasOwnProperty('col')){
    let col = data['col'];
    if( col.length == 3){
      // clean
      for(var x=0;x<3;x++){
        if(col[x]<0)        col[x] = 0;
        if(col[x]>=255)     col[x] = 254;
      }
      console.log(' Change to colour : ', col );
      colour = col;
    }
  }
});

// -----------------------------------------------------------------


function setup()
{
  console.log("setup");

  create_pixel();
  send_pixels();    // turn off pixels initially

  
  
  // test LED obj
  for(var l=0; l<pixels.length; l++){
    // linear(l);
    // radial(l);
    // angular(l);
    // line(l);
    // from_max(l,pmax);
    min_max(l,pmin,pmax);
  }
  send_pixels();

  draw();
}


//    ----------------------------------------------------------


let rotAngle = 0;   // in degree
var t = 0;

var colour = [255,10,0];

function draw()
{
  //
  if(t%4==0){
    step_angle(angleMin);   
    step_angle(angleMax);
  }t++;

  pmin = from_angle(angleMin.angle,angleMin.mag);
  pmax = from_angle(angleMax.angle,angleMax.mag);

  
  for(var l=0; l<pixels.length; l++){
    // linear(l);
    // radial(l);
    // angular(l);
    // line(l);
    min_max(l,pmin,pmax);
  }
  

  send_pixels();
  
  setTimeout(function(){ draw(); },100);
  // Eomain
}

// =---------------------------------------------------------


function step_angle(angle){
  var probab = 0.05;
  var maxSpeed = 0.05;

  angle.angle += angle.speed;

  // Random Speed
  if(Math.random()<probab){
    angle.speed = scale(Math.random(),0,1,-maxSpeed,maxSpeed);
    // console.log('  #R  ',angle);
  }

  // Random Mag
  if(Math.random()<probab){
    angle.mag += (Math.random()-0.5);
    let MIN = 0.6, MAX = 9;
    if(angle.mag<MIN) angle.mag = MIN;
    if(angle.mag>MAX) angle.mag = MAX;
    // console.log('  -M  ',angle);
  }
}
var angleMin = {
  angle : 0,
  mag : 8.0,
  speed : 0,
  // count : 0,
  id: 'min'
}
var angleMax = {
  angle : 1.4*Math.PI,
  mag : 6.5,
  speed : 0.1,
  // count : 20,
  id: 'max'
}

var pmin = {
  x: -5,    y: 5
}
var pmax = {
  x: 5,     y: 5
}

// brightness as 0-1
var fadeColA = [];
var fadeColB = [];

function fade_col(bright,col){
  var r = Math.round( expon(bright,0,100,0,col[0]) );
  var g = Math.round( expon(bright,0,100,0,col[1]) );
  var b = Math.round( expon(bright,0,100,0,col[2]) );
  if(r==255)  r=254;
  if(g==255)  g=254;
  if(b==255)  b=254;
  return [r,g,b];
}

function fade_2_col(bright,colA,colB){
  var r,g,b;
  var mix=[];
  for(var x=0;x<3;x++)
    mix[x] = Math.abs(colA[x]-colB[x]) /2;

  if(true){
    // linear
    r = Math.round( scale(bright,0,0.97,colA[0],colB[0]) );
    g = Math.round( scale(bright,0,0.97,colA[1],colB[1]) );
    b = Math.round( scale(bright,0,0.97,colA[2],colB[2]) );
  }
  // if(bright<0.5){
  //   r = Math.round( scale(0.5-bright,0,0.5,mix[0],colA[0]) );
  //   g = Math.round( scale(0.5-bright,0,0.5,mix[0],colA[0]) );
  //   b = Math.round( scale(0.5-bright,0,0.5,mix[0],colA[0]) );
  // }
  // else{
  //   r = Math.round( scale(bright,0.5,1,mix[0],colB[0]) );
  //   g = Math.round( scale(bright,0.5,1,mix[1],colB[1]) );
  //   b = Math.round( scale(bright,0.5,1,mix[2],colB[2]) ); 
  // }
  return [expon(r,0,254,0,254),expon(g,0,254,0,254),expon(b,0,254,0,254)];
}



function min_max(l,min,max)
{
  let xDist,yDist;

  xDist = -max.x -pixels[l].x;
  yDist = -max.y -pixels[l].y;
  var maxDist = Math.sqrt( xDist*xDist + yDist*yDist );
  
  xDist = -min.x -pixels[l].x;
  yDist = -min.y -pixels[l].y;
  var minDist = Math.sqrt( xDist*xDist + yDist*yDist );
  
  var ratio = minDist/(minDist+maxDist);

  // ratio = expon(ratio,0,1, 0,1);
  // if(ratio>254)    ratio = 254;

  // console.log(minDist, maxDist, ratio );

  // pixels[l].col = [Math.round(ratio),0,0];
  // pixels[l].col = fade_col(ratio, [254,0,0]);
  // pixels[l].col = fade_2_col(ratio, [254,0,0], [5,0,80] );
  
  pixels[l].col = fade_col(ratio*100, colour );

  // console.log( pixels[l].x, pixels[l].y,'\t',ratio, pixels[l].col );
  //
}

function from_max(l,max)
{
  var xDist = max.x -pixels[l].x;
  var yDist = max.y -pixels[l].y;

  var dist = Math.sqrt( xDist*xDist + yDist*yDist );

  dist = expon(dist, 0,15, 0, 254 );
  if(dist>254)    dist = 254;

  // console.log(pixels[l].x, pixels[l].y,'\t',dist);

  pixels[l].col = [Math.round(dist),0,0];
  //
}

var lineX = 1.4;    // Row 10 has x=[-9,...9]
var lineSlope = 2.5;
var lineWidth = 1.8;
var lineSpeed = 0.1;
var lineGlow = 2.8;
var lineReset = 20;

function line(l)
{
  let X = -pixels[l].x;
  let Y = -pixels[l].y;
  let CL = pixels[l].cl;
  let RW = pixels[l].rw;

  let lineCtr = lineX + Y*lineSlope;
  let dist = Math.abs(X-lineCtr);
  let val;

  if(dist<lineWidth){
    // inside bar
    val = 200;
  }
  else {
    let rest = dist -lineWidth;
    let lineGlow = 2.0;
    if(rest<lineGlow){
      val = expon(rest,0,lineGlow,200,0);
    }
    else
      val = 0;
  }
  
  pixels[l].col = [val,0,0];

  // console.log(X,'\t',Y,'\t', val );

  // Eo func
}


function scale(x,xMin,xMax,yMin,yMax){
  let prop = (x-xMin)/(xMax-xMin);
  let sc = yMin + prop * (yMax-yMin);
  return sc;
}
function expon(x,xMin,xMax,yMin,yMax){
  let prop = (x-xMin)/(xMax-xMin);
  let sc = yMin + prop *prop *(yMax-yMin);
  return sc;
}
var pi = Math.PI;
function angle_diff(a,b){
  let A = Math.floor(a * 180 / pi);
  // let B = Math.floor(b * 180 / pi);
  let B = b;
  var diff = (B - A + 180) % 360 - 180;
  if(diff<-180)
    return diff+360;
  else
    return diff;
}
function from_angle(ang,mag){
  return {  x: Math.cos(ang)*mag,
            y: Math.sin(ang)*mag    }
}

function angular(l)
{
  let r=0, g=0, b=0;
  let X = -pixels[l].x+0.1;
  let Y = -pixels[l].y+0.1;
  if(X<0)   Y=-Y;
  // let D = Math.abs(X)+Math.abs(Y);
  let D = Math.sqrt(X*X +Y*Y);
  
  let CL = pixels[l].cl;
  let RW = pixels[l].rw;

  let angl = angle_diff( Math.asin(Y/D), rotAngle ) ;  // A in radians from asin(), B in degree
  angl = Math.abs(angl);                    // so that goes up in both directions away from target
  if(X<0)     angl = 180 - angl;         // account for -X half
  angl = (angl)/180;      // goes form 0 to INCLUDING 1
  angl = 0.3 +angl *angl *angl *252;
  
  pixels[l].col = [Math.floor(angl),0,0];      

  // console.log(pixels[l].col);
  
}



function radial(l){
  let r=0, g=0, b=0;
  var dist = Math.abs(pixels[l].x)+Math.abs(pixels[l].y);
  r = dist * dist /2;
  pixels[l].col=[r,r/4,0];
}

function linear(l){
  let r=0, g=0, b=0;
  let val = (pixels[l].x + 9) * 3;
  pixels[l].col = [Math.floor(val),0,0];
}



function send_pixels(){
  
  for(var l=0; l<pixels.length; l++){
    port.write(pixels[l].col);
  }
  port.write([255]);
}
