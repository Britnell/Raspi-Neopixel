const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
 

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
//await sleep(2000);


raspi.init(() => {
  var arduinoport = '/dev/ttyACM0';
  // Arduino serial     The default is 8 data bits, no parity, one stop bit. 
  var serial = new Serial({
	  	port: arduinoport,
	  	baudRate: 115200,
	  	// dataBits: 8, //default
	  	// stopBits: 1, //default
	  	//parity: PARITY_NONE //default
  });
  serial.open(() => {
  	
    serial.on('data', (data) => {
      process.stdout.write(data);
    });
    serial.write('Hello from raspi-serial');
  });
});


