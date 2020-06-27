/*
 *  Now to run socket server on here so that it doenst need th other pi... durrr
 *   click for different colour modes, they work so-so
 */

const SerialPort = require('serialport');

//  **    Serial

var arduinoport = '/dev/ttyACM0';
const port = new SerialPort(arduinoport, function (err) 
{
  if (err) {
    return console.log('Error: ', err.message)
  }
  else{
  	console.log(" PORT OPEN");
  }
  // 2s delay for UART setup
  setTimeout(function(){   console.log(' retry setup' ); setup();  },2000);
});


port.on('error', function(err) {
  console.log('Error: ', err.message)
});

port.on('data',function(data){
  // console.log('USB rec:\t');
  for(let x=0; x<data.length-2; x++){
    console.log( String.fromCharCode(data[x]) );
  }
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


//    ****    Server & Socket


const express = require('express'); // running immediately
const app = require('express')(); // running immediately
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(8000, () =>  {
  console.log(`Server is runnign port :8000 `);
});
app.get('/', (req,res) => {
  res.sendFile(__dirname +'/lamp_rgb.html');
});
app.use(express.static('public'));

io.on('connection', (socket)=>{
    // socket refers to client side obj / event
  console.log(` New Socket connected w id \t ${socket.id} ` );
  
  socket.on('msg', (data)=>{
    console.log(' [ socket-msg ] :\t',data );
    io.emit('msg', data);
  });



  socket.on('disconnect',()=>{
    console.log(' # # Socket disconnected.');
  });

  socket.on('lamp',(data)=>
  {
    // console.log(' #socket>Lamp : ', data );
    if(data.hasOwnProperty('set-col'))
    {
      // Set colour
      let col = data['set-col'];
      if( col.length == 3){
        // clean
        Hue = col[0];
        Sat = col[1];
        Bright = col[2];

        // update point hues
        points.forEach( function(p){
          p.hue = rand_hue(Hue, 0.01 );
        });

        // * RGB
        // for(var x=0;x<3;x++){
        //   if(col[x]<0)        col[x] = 0;
        //   if(col[x]>=255)     col[x] = 254;
        // }
        // colour = col;
      }
    }
    else if(data.hasOwnProperty('get-col'))
    {
      socket.emit('lamp',{'get-col': [Hue,1,Bright] });
    }
    else if(data.hasOwnProperty('get-mode'))
    {
      socket.emit('lamp',{'get-mode': {n: mode, mode: modes[mode], max: modes.length  }} );
    }
    else if(data.hasOwnProperty('set-mode'))
    {

      if( data['set-mode'].hasOwnProperty('n') ){
        mode = data['set-mode']['n'];
        let packet = {n: mode, mode: modes[mode], max: modes.length  };
        socket.emit('lamp',{'get-mode': packet } );
        // console.log(' set mode :: ', packet);
      }
    }
    // Eo socket
  });

  // ** Eo socket
});



// -----------------------------------------------------------------


function setup()
{
  console.log("Setting up. ");

  create_pixel();
  send_pixels();    // turn off pixels initially
  
  // * start draw loop
  draw();
}


//    ----------------------------------------------------------


let rotAngle = 0;   // in degree
var t = 0;

// var colour = [255,10,0];
var Hue = 0;
var Sat = 1;
var Bright = 0.5;

var modes = [ 'RADIAL', 'LINEAR', 'ANGULAR', 'LINE', 'TWOPOINT', 'RAINING', 'SYMMETRIC', 'GRID' ];
var mode = 6;

function animation(l)
{
  if(modes[mode]=='RADIAL'){
    radial(l);
  }
  else if(modes[mode]=='ANGULAR'){
    angular(l);
  }
  else if(modes[mode]=='LINEAR'){
    linear(l);
  }
  else if(modes[mode]=='LINE'){
    line(l);
  }
  else if(modes[mode]=='TWOPOINT'){
    min_max(l,pmin,pmax);
  }
  else if(modes[mode]=='RAINING'){
    raining(l);
  }
  else if(modes[mode]=='SYMMETRIC'){
    symmetric(l);
  }
  else if(modes[mode]=='GRID'){
    grid(l);
  }
  // Eo func
}


function draw()
{
  //  Animation Prep & Variation

  if(modes[mode]=='TWOPOINT'){
    if(t%4==0){
      step_angle(angleMin);   
      step_angle(angleMax);
    }     t++;
    pmin = from_angle(angleMin.angle,angleMin.mag);
    pmax = from_angle(angleMax.angle,angleMax.mag);
  }
  else if(modes[mode]=='RAINING'){
    // update rain
    step_rain();
  }
  else if(modes[mode]=='SYMMETRIC'){
    step_symmetric();
  }
  else if(modes[mode]=='GRID'){
    step_grid();
  }

  // ** Animation calculation & Display
  for(var l=0; l<pixels.length; l++){
    animation(l);    
  }
  send_pixels();

  setTimeout(function(){ draw(); },10);

  //    ***    Eo main
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
    let MIN = 0.45, MAX = 8;
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

var TWO_PI = 2*Math.PI;

//    **************      Grid
var gridSize = rand(3.6, 6);
var gridPoints = [];
var gridRad = 2.0;
var gridOffset = {x:0, y:0 };

var gridDir = rand(0,2*Math.PI);
var gridSpd = rand(0.1,0.2);
var gridMov = from_angle(gridDir,gridSpd );
var gridBlob = rand(2.5, 3.5);

var gridLean = 0.6;

function step_grid(){
  let b = 1;  // border to start grid a bit outside field

  // Move grid 
  gridOffset.x += gridMov.x;
  gridOffset.y += gridMov.y;

  // wrap around
  if(gridOffset.y >gridSize )  {
    gridOffset.y -= gridSize;
    gridOffset.x -= gridLean;
  }
  else if(gridOffset.y < -gridSize )  {
    gridOffset.y += gridSize;
    gridOffset.x += gridLean;
  }

  if(gridOffset.x >gridSize )   
    gridOffset.x -= gridSize;
  else if(gridOffset.x<-gridSize)         
    gridOffset.x += gridSize;


  // * create gridpoints once here
  // let pos = { x: -9-b+gridOffset.x , y: -9-b+gridOffset.y };
  // gridPoints = [];
  // while(pos.y<9+b)
  // {
  //   while(pos.x<9+b)
  //   {
  //     gridPoints.push({x:pos.x,y:pos.y});
  //     pos.x += gridSize;
  //     // while x
  //   }
  //   pos.y += gridSize;
  //   pos.x = -9-b+gridOffset.x;
  //   // while y
  // }

  // * now drawing grid from origin outwards
  let pos = { x: gridOffset.x , y: gridOffset.y };
  gridPoints = [ {x:pos.x,y:pos.y} ]; 
  let rowRef = { x: gridOffset.x , y: gridOffset.y };

  // Q1  +X +Y 

  while(pos.y>-9-b && pos.y<9+b)  {
    while(pos.x>-9-b && pos.x<9+b)   {
      if(pos.x!=gridOffset.x || pos.y !=gridOffset.y )
        gridPoints.push({x:pos.x,y:pos.y});
      pos.x += gridSize;
    }
    rowRef.x += gridLean;
    pos.y += gridSize;
    pos.x = rowRef.x;
  }

  // Q2 +X -Y
  rowRef = { x: gridOffset.x , y: gridOffset.y };
  pos.y = gridOffset.y -gridSize;
  rowRef.x -= gridLean; pos.x = rowRef.x;
  while(pos.y>-9-b && pos.y<9+b)  {
    while(pos.x>-9-b && pos.x<9+b)   {
      if(pos.x!=gridOffset.x || pos.y !=gridOffset.y )
        gridPoints.push({x:pos.x,y:pos.y});
      pos.x += gridSize;
    }
    rowRef.x -= gridLean;
    pos.y -= gridSize;
    pos.x = rowRef.x;
  }

  // Q3 -X +Y
  rowRef = { x: gridOffset.x , y: gridOffset.y };
  pos.y = gridOffset.y;  pos.x = rowRef.x;
  while(pos.y>-9-b && pos.y<9+b)  {
    while(pos.x>-9-b && pos.x<9+b)   {
      if(pos.x!=gridOffset.x || pos.y !=gridOffset.y )
        gridPoints.push({x:pos.x,y:pos.y});
      pos.x -= gridSize;
    }
    rowRef.x += gridLean;
    pos.y += gridSize;
    pos.x = rowRef.x;
  }
  
  // Q4 -X -Y
  rowRef = { x: gridOffset.x , y: gridOffset.y };
  pos.y = gridOffset.y -gridSize;
  rowRef.x -= gridLean;    pos.x = rowRef.x;
  while(pos.y>-9-b && pos.y<9+b)  {
    while(pos.x>-9-b && pos.x<9+b)   {
      if(pos.x!=gridOffset.x || pos.y !=gridOffset.y )
        gridPoints.push({x:pos.x,y:pos.y});
      pos.x -= gridSize;
    }
    rowRef.x -= gridLean;
    pos.y -= gridSize;
    pos.x = rowRef.x;
  }

  // console.log(' offset ', gridOffset );

  if(r()<0.05){
    gridDir += rand(-0.1,0.1);
    if(gridDir<0)              gridDir += TWO_PI;
    else if(gridDir>TWO_PI)    gridDir -= TWO_PI;
    gridSpd  = rand_constrain(gridSpd, rand(-0.05,0.05), 0.1,0.24);
    gridMov = from_angle(gridDir,gridSpd );
  }

  if(r()<0.05)        gridSize = rand_constrain(gridSize, rand(-0.1,0.1), 4.0, 6 );
  if(r()<0.05)        gridBlob = rand_constrain(gridBlob, rand(-0.1,0.1), 2.2, 3.6 );
  if(r()<0.05)        gridLean = rand_constrain(gridLean, rand(-0.1,0.1), 0, 2 );
  if(r()<0.05)        Hue = rand_hue(Hue, 0.005);

  //
}

function r(){
  return Math.random();
}
function rand_constrain(x, rand, min, max){
  let val = x+rand;
  if(val<min)     return min;
  else if(val>max)  return max;
  else            return val;
}

var topHue = 0.08;
var botHue = 0.08;

function grid(l){
  //
  let rad = Math.pow(gridSize/gridBlob, 2);
  // create col
  
  let col = HSVtoRGB(Hue, 1, Bright );
  // find dist to nearest
  let nearest = 10;
  let ratio = 0;

  for(let p=0; p<gridPoints.length; p++){
    let dist = Math.pow(pixels[l].x -gridPoints[p].x,2) + Math.pow(pixels[l].y -gridPoints[p].y, 2);
    if(dist<rad){
      ratio = ( rad - dist ) / rad;
      p = gridPoints.length;  // to exit
    }
    // Eo for
  }
  // draw pixel

  pixels[l].col = fade_col(ratio*100, col);
  // Eo func
}


//  *********8    Symmetrics
var symmetries = [ 'mirr-x', 'mirr-y', 'mirr-xy', 'mirr-inv', 'rot-3', 'rot-4', 'rot-5' ];
var symm = 6;
var return_to_ctr = false;
var points = [ rand_point(), rand_point() ];

function rand_hue(hue,f){
  let h = hue; // + (Math.random()-0.5) /30;
  h += rand(-f,f);
  // let r = Math.random();
  // if( r<0.3)         h += 0.01;
  // else if( r<0.6)    h -= 0.01;

  if(h<0)  h += 1.0;
  if(h>1.0) h -= 1.0;
  return h;
}

function rand_point(){
  let dir = rand(0,Math.PI); 
  
  return {
    x: rand(-4,4), 
    y: rand(-4,4),
    dir: dir,
    vel: from_angle(dir, 0.2 ),
    rad: rand(2,4),
    hue: rand_hue(Hue,0.01)
  }
}

function symmetric(l){
  // * Get mirrorpoints
  let mirrorpoints = [ ];
  points.forEach(function(point, i){
    point.p = i;
    mirrorpoints.push(point);
    if(symmetries[symm]=='mirr-x')
    {
      mirrorpoints.push( {x: -point.x, y: point.y, p: i } );
    }
    else if(symmetries[symm]=='mirr-y')
    {
      mirrorpoints.push( {x: point.x, y: -point.y, p: i } );
    }
    else if(symmetries[symm]=='mirr-xy')
    {
      mirrorpoints.push( {x: point.x, y: -point.y, p: i } );
      mirrorpoints.push( {x: -point.x, y: point.y, p: i } );
      mirrorpoints.push( {x: -point.x, y: -point.y, p: i } );
    }
    else if(symmetries[symm]=='mirr-inv')
    {
      mirrorpoints.push( {x: -point.x, y: -point.y, p: i } );
    }
    else if(symmetries[symm]=='rot-3')
    {
      let angl = Math.atan2(point.y,point.x);
      let mag = Math.sqrt(point.x*point.x+point.y*point.y);
      let P = from_angle(angl + 2*Math.PI/3, mag);  P.p = i;
      mirrorpoints.push( P );
      P = from_angle(angl + 4*Math.PI/3, mag);  P.p = i;
      mirrorpoints.push( P );
    }
    else if(symmetries[symm]=='rot-4')
    {
      let angl = Math.atan2(point.y,point.x);
      let mag = Math.sqrt(point.x*point.x+point.y*point.y);
      let P = from_angle(angl + 1*Math.PI/2, mag);   P.p = i;
      mirrorpoints.push( P );
      P = from_angle(angl + 2*Math.PI/2, mag);    P.p = i;
      mirrorpoints.push( P );
      P = from_angle(angl + 3*Math.PI/2, mag);    P.p = i;
      mirrorpoints.push( P );
    }
    else if(symmetries[symm]=='rot-5')
    {
      let angl = Math.atan2(point.y,point.x);
      let mag = Math.sqrt(point.x*point.x+point.y*point.y);
      let P = from_angle(angl + 2*Math.PI/5, mag);   P.p = i;
      mirrorpoints.push( P );
      P = from_angle(angl + 4*Math.PI/5, mag);    P.p = i;
      mirrorpoints.push( P );
      P = from_angle(angl + 6*Math.PI/5, mag);    P.p = i;
      mirrorpoints.push( P );
      P = from_angle(angl + 8*Math.PI/5, mag);    P.p = i;
      mirrorpoints.push( P );
    }
    // Eo forEach
  });
  
  
  // get dist to closest point
  var minDist = 20;
  var Rad = 3;
  mirrorpoints.forEach( function(p,i){
    let dx = pixels[l].x - p.x;
    let dy = pixels[l].y - p.y;
    let dist = Math.sqrt(dx*dx+dy*dy);
    if(dist<minDist)  {
      minDist = dist;
      minId = p.p;
    }
    //
  });

  let ratio = 0;
  if(minDist< points[minId].rad) 
    ratio = (points[minId].rad-minDist)/points[minId].rad;
  //let col = points[p].hue
  
  let col = HSVtoRGB(points[minId].hue, 1, Bright );

  // console.log(' sym col ', col );
  pixels[l].col = fade_col(ratio*100, col);


  // Eo symmetry(l) col
}



function step_symmetric(){

  points.forEach(function(point,i){

    // * add movement / speed
    if(!return_to_ctr){
      point.x += point.vel.x;
      point.y += point.vel.y;
    }
    else {
      // only move if its still away
      if( Math.sqrt(point.x*point.x + point.y*point.y) > 1.0 ){
        let ret_ang = Math.atan2( point.y, point.x );
        let ret_vec = from_angle(ret_ang, 0.3 );
        point.x -= ret_vec.x;
        point.y -= ret_vec.y;
      }
    }

    // * boundary
    if(!return_to_ctr)
    if( Math.sqrt(point.x*point.x + point.y*point.y) > 9 -0.5 ){
      // * New random movement

      // 1. GO BACK one step
      point.x -= point.vel.x;
      point.y -= point.vel.y;

      // 2. new dir and speed
      let pointAngle = Math.atan2(point.y,point.x) -Math.PI;
      let angleVar = 1.1;
      point.dir = rand( pointAngle -angleVar, pointAngle +angleVar );
      point.vel = from_angle(point.dir, rand(0.12,0.31) );
      // console.log(' point change :  ', point );
      
      // * random changes
      if(Math.random()<0.3){
        return_to_ctr = true;
        // console.log(' RETURN TO ORIGIN ');
      }

      // * change colors & size
      point.rad += rand(-0.5,0.5);
      point.hue = rand_hue(point.hue,0.008);
      
      // points.forEach(function(p){
      //   p.rad += rand(-0.5,0.5);
      //   p.hue = rand_hue(p.hue,0.005);
      // });
      // * Eo boundary
    }
    // Eo for Each
  });

  // * check if BOTh are at center
  if(return_to_ctr)
  {
    let dist = 0;
    points.forEach(function(p){
      dist += Math.sqrt(p.x*p.x + p.y*p.y);
    });

    if( dist < 2.2 )
    {
      // * all in center, restart!
      Hue = rand_hue(Hue, 0.015);  // change main hue
      points.forEach(function(p){ // change all
        p.rad = rand(1.8,4.1);
        p.hue = rand_hue(Hue,0.01);
      });

      // point.vel = from_angle( rand(0,2*Math.PI), 0.2 );
      symm = Math.floor( Math.random()*symmetries.length );
      // console.log(' new symmetry ', symm, ' : ', symmetries[symm] );
      return_to_ctr = false;
    }
  }

  if(r()<0.01)  {
    Hue = rand_hue(Hue, 0.015); 
    points.forEach(function(p){
      p.hue = rand_hue(Hue,0.01);
    });
  }
  // * gravitate
  // let G = 50;
  // let grav = {
  //   x: -point.x/G,
  //   y: -point.y/G
  // }
  // vel.x += grav.x;
  // vel.y += grav.y;

}
//    **    Raining


var raindrops = [];
var N_rain = 5;
var dropsize = { min: 1, max: 3.5 };
var windAngle = rand(0,2*Math.PI);
var windMag = 0.2;

// from_angle(rand(0,MATH.PI), rand(0.5,1.5) );

function step_rain(){
  if(raindrops.length<N_rain){
    // create droplet 
    let drop = {};
    drop.rad = rand(dropsize.min, dropsize.max); // radius of droplet
    // init pos opposite wind
    drop.pos = from_angle(windAngle-Math.PI+rand(-0.3,0.3), 9+drop.rad );
    // init wind + variation
    drop.wind = from_angle(windAngle+rand(-0.1,0.1), windMag+rand(-0.1,0.1) );
    raindrops.push(drop);
  }
  raindrops.forEach(function(dr,i){
    dr.pos.x += dr.wind.x;
    dr.pos.y += dr.wind.y;
    if( Math.sqrt((dr.pos.x*dr.pos.x)+(dr.pos.y*dr.pos.y)) > 9+dr.rad ){
      raindrops[i].rad = rand(dropsize.min, dropsize.max);
      raindrops[i].pos = from_angle(windAngle-Math.PI+rand(-0.3,0.3), 9+dr.rad );
      raindrops[i].wind = from_angle(windAngle+rand(-0.1,0.1), windMag+rand(-0.1,0.1) );
      console.log(' #DROPLET \t', raindrops[i] );
    }
    else{
      // console.log(i,' MOVE drop , ', dr);
    }
  });
}

function rand(min,max){
  return Math.random()*(max-min) + min;
}

function raining(l){
  // calc distances 
  var minDist = 20;
  var dropRad = 1;

  // calc dist to closest raindrop
  raindrops.forEach(function(dr,i){
    let dx = pixels[l].x -dr.pos.x;
    let dy = pixels[l].y -dr.pos.y;
    let dist = Math.sqrt(dx*dx+dy*dy);
    if(dist<minDist){
      minDist = dist;
      dropRad = dr.rad;
    }
  });
  // create bright ratio
  var ratio = 0;
  if(minDist<dropRad)
    ratio = (dropRad -minDist) / dropRad;
  let colour = HSVtoRGB(Hue, 1, Bright );
  pixels[l].col = fade_col(ratio*100, colour ); // fade col uses expon
}

function min_max(l,min,max)
{
  // calc distances 
  let xDist,yDist;

  xDist = -max.x -pixels[l].x;
  yDist = -max.y -pixels[l].y;
  var maxDist = Math.sqrt( xDist*xDist + yDist*yDist );
  
  xDist = -min.x -pixels[l].x;
  yDist = -min.y -pixels[l].y;
  var minDist = Math.sqrt( xDist*xDist + yDist*yDist );
  
  var ratio = minDist/(minDist+maxDist);

  let colour = HSVtoRGB(Hue, 1, Bright );
  pixels[l].col = fade_col(ratio*100, colour );
  
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
      val = expon(rest,0,lineGlow,100,0);
    }
    else
      val = 0;
  }
  
  let colour = HSVtoRGB(Hue, 1, Bright );
  pixels[l].col = fade_col(val, colour );

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

// inputs all 0 <= x <= 1
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    // return {
    //     r: Math.round(r * 255),
    //     g: Math.round(g * 255),
    //     b: Math.round(b * 255)
    // };
    return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
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
  angl = 100*angl/180;      // goes form 0 to INCLUDING 1
  
  
  // pixels[l].col = [Math.floor(angl),0,0];      
  let colour = HSVtoRGB(Hue, 1, Bright );
  pixels[l].col = fade_col(angl, colour );
  

  // console.log(pixels[l].col);
  
}



function radial(l){
  let r=0, g=0, b=0;
  var dist = Math.abs(pixels[l].x)+Math.abs(pixels[l].y);
  r = dist * dist /2;
  let colour = HSVtoRGB(Hue, 1, Bright );
  pixels[l].col = fade_col(r, colour );
}

function linear(l){
  let r=0, g=0, b=0;
  let val = (pixels[l].x + 9) * 3;
  let colour = HSVtoRGB(Hue, 1, Bright );
  pixels[l].col = fade_col(val, colour );
}



function send_pixels(){
  
  for(var l=0; l<pixels.length; l++){
    port.write(pixels[l].col);
  }
  port.write([255]);
}
