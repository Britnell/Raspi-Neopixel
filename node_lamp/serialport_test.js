const SerialPort = require('serialport');

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
})


// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message)
});


var x=0;
function bleep(){
	port.write('x');
	x+=1;
	setTimeout(function(){ bleep(); },1000);
}

bleep();