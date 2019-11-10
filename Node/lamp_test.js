/*
*   First test sending a r,g,b pattern
*/

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

  setTimeout(function(){
    test_led();
  },3000);
})


// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message)
});

port.on('data',function(data){
  console.log('rec:\t',data);
});

function send(d){
  //console.log(d);
  // port.write(d.toString());
  port.write(d.toString(), function(err) {
    if (err) {
      return console.log('WrErr:', err.message);
    }
  });
}

function send_array(ray){
  console.log(ray);
  port.write(ray, function(err) {
    if (err) {
      return console.log('WrErr:', err.message);
    }
  }); 
}

function test_led()
{
  var ray = new Uint8Array(301*3+1); 

  console.log("RUN test anumation ");

  for( var x=0; x<301; x++){
    if(x%3==0){
      ray[(x*3)+0]=100;
      ray[(x*3)+1]=0;
      ray[(x*3)+2]=0;
    }
    else if(x%3==1){
      ray[(x*3)+0]=0;
      ray[(x*3)+1]=100;
      ray[(x*3)+2]=0;
    }
    else if(x%3==2){
      ray[(x*3)+0]=0;
      ray[(x*3)+1]=0;
      ray[(x*3)+2]=100;
    }
  }
  ray[ray.length-1]=255;
  send_array(ray);
}
