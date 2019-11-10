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

// * LEDs

var pixelArray = new Uint8Array(301*3+1); 
  pixelArray[pixelArray.length-1]=255;


var col = 0;
var dir = 'u';

function draw()
{
  fill_all([col,0,0]);
  send_pixels();

  if(dir=='u'){
    col += 1;
    if(col==255){
      col = 0;
      // dir = 'd';
    }
  }
  
  setTimeout(function(){ draw(); },100);
  // Eomain
}


function send_pixels(){
  console.log(pixelArray);
  port.write(pixelArray, function(err) {
    if (err) {
      return console.log('WrErr:', err.message);
    }
  }); 
}

function fill_all(col)
{
  for( var x=0; x<301; x++){
      pixelArray[(x*3)+0]=col[0];
      pixelArray[(x*3)+1]=col[1];
      pixelArray[(x*3)+2]=col[2];
  }
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
