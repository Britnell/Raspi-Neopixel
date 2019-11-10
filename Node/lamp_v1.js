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

  setTimeout(function(){
    setup();
    draw();
  },2000);
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

function create_pixel()
{
  var rows  = 21;
  var LED_per_row = [ 5,10,11,14,15,16,17,18,17,18,19,18,17,18,17,16,15,14,11,10,5 ];

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
    let r=0, g=0, b=0;

    // ODD ROW
    // if(pixels[l].rw%2==0)   r=0;
    // else                  r=50;
    // FADE IN ROW
    // g = pixels[l].cl*pixels[l].cl /2;
    // ODD COL
    // if(pixels[l].cl%2==0)   r=0;
    // else                    r=50;
    // RADIAL
    var dist = Math.abs(pixels[l].x)+Math.abs(pixels[l].y);
    r = dist * dist /2;
    pixels[l].col=[r,r/4,0];
  }
  send_pixels();
  // console.log(pixels);
  //
}

function draw()
{
    
  // setTimeout(function(){ draw(); },100);
  // Eomain
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
