/*
 *  first version with pixel obj for lamp
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

var pixelArray = new Uint8Array(301*3+1); 
  pixelArray[pixelArray.length-1]=255;

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
    line(l);
  }
  send_pixels();

  draw();
}

let rotAngle = 0;   // in degree
function draw()
{
  // * rotate
  // rotAngle += 1;
  // if(rotAngle>=360)     rotAngle = 0;

  // * line movement
  lineX += lineSpeed;
  if(lineX<-lineReset)    lineX = lineReset;
    else if(lineX>lineReset)  lineX = -lineReset;

  let R = Math.random();
  let prob = 0.1;
  let add = 0.05;
  if(R<prob*1) lineSlope += add;
    else if(R<prob*2) lineSlope -= add;  
  if(lineSlope>5)   lineSlope = 5;
    else if(lineSlope<-5) lineSlope = -5;
  
  

  
  for(var l=0; l<pixels.length; l++){
    // linear(l);
    // radial(l);
    // angular(l);
    line(l);
  }
  send_pixels();
   
  setTimeout(function(){ draw(); },100);
  // Eomain
}

// =---------------------------------------------------------


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
  // console.log(pixelArray);
  for(var l=0; l<pixels.length; l++){
    port.write(pixels[l].col);
  }
  port.write([255]);
}


function test_led()
{
  for( var x=0; x<301; x++){
    if(x%3==0){
      pixelArray[(x*3)+0]=100;
      pixelArray[(x*3)+1]=0;
      pixelArray[(x*3)+2]=0;
    }
    else if(x%3==1){
      pixelArray[(x*3)+0]=0;
      pixelArray[(x*3)+1]=100;
      pixelArray[(x*3)+2]=0;
    }
    else if(x%3==2){
      pixelArray[(x*3)+0]=0;
      pixelArray[(x*3)+1]=0;
      pixelArray[(x*3)+2]=100;
    }
  }
  // pixels[pixels.length-1]=255;
}
