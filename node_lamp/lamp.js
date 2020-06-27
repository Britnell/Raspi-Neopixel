/*
 *  Now to run socket server on here so that it doenst need th other pi... durrr
 *   click for different colour modes, they work so-so
 */

//  **    Serial

const SerialPort = require('serialport');
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
  // console.log('USB rec:\t', data.length);
  if(data.length==3){
    let char = String.fromCharCode(data[0]);
    if(char != '0' )
      console.log(' ? port-data: ', char);
  }
  //
});


//  ** *     Lamp Pixels

class pixel {
  constructor(l){
    this.x=0;
    this.y=0;

    this.rw = 0;
    this.cl = 0;

    this.rev = false;
    this.rowOrigin = 0;

    this.col = new Uint8Array(3); 
    this.r=0;
    this.g=0;
    this.b=0;

    this.n=l;

    // this.state = 0;
  }
} 


var pixels = [];
var rows  = 21;
var pix_per_row = [ 5,10,11,14,15,16,17,18,17,18,19,18,17,18,17,16,15,14,11,10,5 ];
var row_Height = [];
var row_Xbegin = [];

var row_pixels = [];

var xStep = 1;
var yStep = 0.866025;


function create_pixel()
{
  var n = 0;
  
  for(var row = 0; row<rows; row++ )		// * Rows
  {    

    // * Y height of Row
    let rowY;
    if(row<10){       rowY = (10-row)*yStep;    }	// Y height of row
    else if(row>10){       rowY = -(row-10)*yStep;    }		// Y height is symmetrical
    else{      rowY = 0;    }
    rowY = Math.round(rowY*10)/10;
    
    // * X pixels of row
    let rowLEDS = pix_per_row[row];
    let rowX = -xStep * ((rowLEDS-1)/2);	// x coordinate begin of this row
    
    row_Height.push(rowY);
    row_Xbegin.push(rowX);
    row_pixels.push([]);

    for( var c=0; c<rowLEDS; c++ )		// * Leds in row
    { 
      pixels[n] = new pixel(n);

      let cRev;
      if(row%2==0){
        cRev = c;
      }
      else {
      	cRev= (rowLEDS-1-c);
      	pixels[n].rev = true;
      } 

      pixels[n].col = [0,0,0];
      pixels[n].rw = row;  // row
      pixels[n].cl = cRev;    // collumn
      pixels[n].rowOrigin = rowX;
      pixels[n].x = rowX + cRev*xStep;
      pixels[n].y = rowY;
      
      row_pixels[row].push( { x: pixels[n].x, n: n } );	     // add index of pixels in this row to array

      n++;
    }
  }


  // * Test  finding pixels

  for(let y=-9; y<=9; y+= 0.5){
	  // for(let x=-9; x<=9; x+= 1){
	  let x = y;

	  	// find closest pixel
	  	let cl_rw = { val: 10, i: -1 };

	  	// get closest row
	  	row_Height.forEach(function(rwy,i){
	  		let dist = Math.abs(rwy-y);
	  		if(dist <  cl_rw.val){
	  			cl_rw.val = dist;
	  			cl_rw.i = i;
	  		}
	  	});

	  	// closest pixel
	  	let cl_col = { val: 10, i: -1, n: -1 };
	  	row_pixels[cl_rw.i].forEach(function(pxl,i){
	  		let dist = Math.abs(x-pxl.x);
	  		if(dist <cl_col.val){
	  			cl_col.val = dist;
	  			cl_col.i = i;
	  			cl_col.n = pxl.n;
	  		}
	  	});

	  
   }


  
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

        if(FR==0){
          draw();
        }

        // Eo set col
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
        if(FR==0)
          draw();
        // console.log(' set mode :: ', packet);
      }
    }
    // else if(data.hasOwnProperty('reset-cellular')){

    // }

    // Eo socket
  });

  // ** Eo socket
});



// -----------------------------------------------------------------


//    ----------------------------------------------------------



let rotAngle = 0;   // in degree
var t = 0;

// var colour = [255,10,0];
var Hue = 0;
var Sat = 1;
var Bright = 0.5;

var modes = [ 'SYMMETRIC', 'GRID', 'RADIAL', 'ECLIPSE', 'CELLULAR' ];
var mode = 4;
var fading_state = 'i';   // x-no fade ; i-in ; o-out
var fader = 0;
var after_fade = 0;
let frame = 0;



function setup()
{
  console.log("Setting up. ");

  create_pixel();
  send_pixels();    // turn off pixels initially
  
  if(modes[mode]){
    random_grid();
  }
  // * start draw loop
  draw();
}

let FR = 20;

function draw()
{
  // * chose new state
  // if(++frame%100==0)
  // if( r()<0.1){
  //   fading_state = 'o';
  //   while(mode==after_fade)
  //     after_fade = Math.floor(rand(0,modes.length));
  // }


  // * Fading in and out between modes
  if(fading_state=='i'){
    fader += 0.05;
    if(fader >= 1.0){
      fader = 1.0;
      fading_state = 'x';
    }
  }
  else if(fading_state=='o'){
    fader -= 0.05;
    if(fader <= 0){
      // Finished fadeout!
      fader = 0;
      fading_state = 'i';
      mode = after_fade;
    } 
  }

  // *  Animate different modes

  if(modes[mode]=='SYMMETRIC'){
    step_symmetric();
    for(var l=0; l<pixels.length; l++)
      symmetric_calc(l);
    FR = 20;
  }
  else if(modes[mode]=='GRID'){
    step_grid();
    for(var l=0; l<pixels.length; l++)
      grid_calc(l);
    FR = 50;
  }
  else if(modes[mode]=='RADIAL'){
    for(var l=0; l<pixels.length; l++)
      radial(l);
    FR = 0; // STOP DRAWING
  }
  else if(modes[mode]=='ECLIPSE'){
    draw_eclipse();
    FR = 0; // STOP DRAWING
  }
  else if(modes[mode]=='CELLULAR'){
  	draw_cellular();
  	FR = 50;
  }


  // ** Display & repeat
  send_pixels();
  if(FR!=0)
    setTimeout(function(){ draw(); },FR);

  //    ***    Eo main
}


// =---------------------------------------------------------


function fade_col(bright,col){
  var r = Math.round( expon(bright,0,100,0,col[0]) );
  var g = Math.round( expon(bright,0,100,0,col[1]) );
  var b = Math.round( expon(bright,0,100,0,col[2]) );
  if(r==255)  r=254;
  if(g==255)  g=254;
  if(b==255)  b=254;
  return [r,g,b];
}


var TWO_PI = 2*Math.PI;
var PI = Math.PI;


// **** AUTOMATON

var cell_hold = 1400;
var cell_fade = 2;

var reset_automaton = true;
var cell_array = [];
var cell_rule = [];

var hold_pattern = false;

function init_automaton(){

	console.log( ' init automaton ');

	// * create array
	if(cell_array.length==0){
		pixels.forEach(function(x){
			cell_array.push({ n: x.n, state:0, next: 0, fade: 0 });
		});
	}

	// * turn off all
	cell_array.forEach(function(p){
		p.state =0;
		p.next = 0;
		p.fade = 0;
	});

	cell_rule = random_rule(3);		//( r()<0.5 ? random_rule(2) : random_rule(3)  );
	console.log(' rule : ', cell_rule);

	// * turn on for init
	// 21 rows, 	CENTER = 150

	// JUST CENTER
	let seeds = 2 + Math.floor( r()*(4+1) );

	for(let x=0; x<seeds; x++){
		// horiz sym 			141 to 159
		let ra = r();
		if(ra<0.4){
			// horizontal
			let j = Math.floor( r() * 5 );	// index from center
			cell_array[150+j].next = 1;
			cell_array[150-j].next = 1;
		}
		else if(ra<0.9){
			let row =  Math.floor( 1+ r()* (4+1) ) *2;
			let ctr = Math.floor(pix_per_row[10+row]/2);
			cell_array[ row_pixels[10+row][ctr].n ].next = 1;
			cell_array[ row_pixels[10-row][ctr].n ].next = 1;
		}
		else { //if(ra<0.9){
			// asymetric
			let j = Math.floor( r()*150 );
			cell_array[150+j].next = 1;
			cell_array[150-j].next = 1;
		}
	}
	
	
	//
}

var no_change_counter = 0;
var generations = 0;


function random_rule(len){
	let rule = [ ];

	  while( rule.length<len ){
	    let r = Math.floor( Math.random()*6 );
	    if( !rule.includes(r) && r!=0 ){
	      rule.push(r);
	    }
	  }
	  return rule;
}


function step_automation(){
	let alive_now = 0, alive_next = 0;

	// * transfer
	cell_array.forEach(function(cell){
		cell.state = cell.next;
		cell.fade = 0;
	});

	// * get next
	cell_array.forEach(function(cell){
		// advance

		let nbs = count_neighbours( cell.n );

		if(cell_rule.includes(nbs)){
			cell.next = 1;
			// cell.next = (cell.state+1)%3;
		}
		else{
			cell.next = 0;
			// cell.next = (cell.state-1);
			// if(cell.next<0)	cell.next = 0;
		}
		// * count
		if(cell.state==1)		alive_now++;
		if(cell.next==1)		alive_next++;
	});

	// * check for stagnation
	if(alive_next==0)		reset_automaton = true;
	if(alive_now==alive_next)			no_change_counter++;
	else			no_change_counter = 0;
	if(no_change_counter==4)	reset_automaton = true;

	// * count generations
	generations++;
	if(generations==20){
		cell_rule = random_rule(3);	  //	( r()<0.5 ? random_rule(2) : random_rule(3)  );
		generations = 0;
		console.log(' new rule : ', cell_rule );
	}


}


function draw_cellular(){

	if(reset_automaton){
		init_automaton();
		reset_automaton = false;
		generations = 0;
	}
	else{
		// step_automation();
	}


	let equals = 0;

	// * Draw
	cell_array.forEach(function(cell){

		if(!hold_pattern){
			if(cell.fade <100)
				// cell.fade += 0.02;
				cell.fade += cell_fade;
			else {
				cell.fade = 100;
				equals++;
			}
		}
		

		// * paint
		if(cell.state != cell.next)
		{
			if( cell.state==0 && cell.next==1 ) {
				// turning on 
				pixels[cell.n].col = HSVtoRGB(Hue, 1, expon3(cell.fade, 0,100, 0,Bright) );			
			}
			else //if( cell.state==1 && cell.next==0 ){
				/// turning off
				pixels[cell.n].col = HSVtoRGB(Hue, 1, expon3(100-cell.fade, 0,100, 0,Bright) );			
		}
		else if(cell.state==0){
			// OFF
			pixels[cell.n].col = [0,0,0];
		}
		else {
			// Statics
			pixels[cell.n].col = HSVtoRGB(Hue, 1, Bright );			
		}
	});

	
	if(equals==301){
		step_automation();
		hold_for(cell_hold);
	}

	send_pixels();
}

function hold_for(t){
	hold_pattern = true;
	setTimeout(function(){
		hold_pattern = false;
	}, t);
}
function get_neighbours(n){
	let neighbours = [];
	let p = pixels[n];

	if(p.cl>0) {	// left
		if(p.rev)	neighbours.push(n+1);
		else  		neighbours.push(n-1);
	}

	if(p.cl<pix_per_row[p.rw]-1 ) {	// right
		if(p.rev)		neighbours.push(n-1);
		else 			neighbours.push(n+1);
	}

	if(p.rw>0) {			// above
		row_pixels[p.rw-1].forEach( function(n,i){
			if( Math.abs(p.x-n.x) < 1.0 )
				neighbours.push(n.n);
		});
	}
	if(p.rw<21-1){
		row_pixels[p.rw+1].forEach( function(n,i){
			if( Math.abs(p.x-n.x) < 1.0 )
				neighbours.push(n.n);
		});
	}

	return neighbours;
}

function count_neighbours(n){
	let neighbours = 0;
	let p = pixels[n];

	if(p.cl>0) {	// left
		if(p.rev){
			if(cell_array[n+1].state!=0)	neighbours++;
		}
		else {
			if(cell_array[n-1].state!=0)	neighbours++;
		}
	}

	if(p.cl<pix_per_row[p.rw]-1 ) {	// right
		if(p.rev){
			if(cell_array[n-1].state!=0)	neighbours++;	
		}
		else{
			if(cell_array[n+1].state!=0)	neighbours++;
		}
	}

	if(p.rw>0) {			// above
		row_pixels[p.rw-1].forEach( function(n,i){
			if( Math.abs(p.x-n.x) < 1.0 )
				if(cell_array[n.n].state!=0)	neighbours++;
		});
	}
	if(p.rw<21-1){
		row_pixels[p.rw+1].forEach( function(n,i){
			if( Math.abs(p.x-n.x) < 1.0 )
				if(cell_array[n.n].state!=0)	neighbours++;
		});
	}

	return neighbours;
}

//    **************      Grid

var gridPoints = [];
var gridOffset, gridSize;
var gridDir, gridSpd, gridMov, gridBlob;
var topHue, botHue;

function random_grid(){
  gridSize = rand(3.0, 6.0);

  gridDir = (r()<0.5)? -PI/2 : PI/2; // up or down
  gridSpd = rand(0.03,0.09);
  gridMov = from_angle(gridDir,gridSpd );

  gridBlob = 2.1;//rand(2.0, 3.0);
  gridLean = gridSize/2;    //rand(-0.8,08);
  gridOffset = {x:0, y:0 };
  topHue = rand(0,0.08);
  botHue = rand(-0.08,0);

  // Eo func
}

function wrap(x,min,max){
  if(x<min){
    x += (max-min);
  }
  else if(x>max){
    x -= (max-min);
  }
  return x;
}

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


  // * now drawing grid from origin outwards
  let pos = { x: gridOffset.x , y: gridOffset.y };
  gridPoints = [];  //[ {x:pos.x,y:pos.y} ]; 
  let rowRef = { x: gridOffset.x , y: gridOffset.y };

  /// Q1  +X +Y 
  while(pos.y>-9-b && pos.y<9+b)  {
    while(pos.x>-9-b && pos.x<9+b)   {
      gridPoints.push({x:pos.x,y:pos.y});
      pos.x += gridSize;
    }
    rowRef.x += gridLean;
    pos.y += gridSize;
    pos.x = rowRef.x;
  }


  /// Q3 -X +Y
  rowRef = { x: gridOffset.x -gridSize , y: gridOffset.y };
  pos.y = rowRef.y;  pos.x = rowRef.x;
  while(pos.y>-9-b && pos.y<9+b)  {
    while(pos.x>-9-b && pos.x<9+b)   {
      gridPoints.push({x:pos.x,y:pos.y});
      pos.x -= gridSize;
    }
    rowRef.x += gridLean;
    pos.y += gridSize;
    pos.x = rowRef.x;
  }

  // Q2 +X -Y
  rowRef = { x: gridOffset.x -gridLean +gridSize, y: gridOffset.y -gridSize };
  pos.x = rowRef.x;   pos.y = rowRef.y;
  while(pos.y>-9-b && pos.y<9+b)  {
    while(pos.x>-9-b && pos.x<9+b)   {
      gridPoints.push({x:pos.x,y:pos.y});
      pos.x += gridSize;
    }
    rowRef.x -= gridLean;
    pos.y -= gridSize;
    pos.x = rowRef.x;
  }
  
  // Q4 -X -Y
  rowRef = { x: gridOffset.x -gridLean, y: gridOffset.y -gridSize};
  pos.x = rowRef.x;   pos.y = rowRef.y;

  while(pos.y>-9-b && pos.y<9+b)  {
    while(pos.x>-9-b && pos.x<9+b)   {
      gridPoints.push({x:pos.x,y:pos.y});
      pos.x -= gridSize;
    }
    rowRef.x -= gridLean;
    pos.y -= gridSize;
    pos.x = rowRef.x;
  }

  //
}


function grid_calc(l){
  //
  let rad = Math.pow(gridSize/gridBlob, 2);
  
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
  
  // create col
  let fadeHue = scale( pixels[l].y , -9,9, botHue, topHue  );
    fadeHue = wrap(Hue+fadeHue,0,1);
  let col = HSVtoRGB(fadeHue, 1, Bright );
  pixels[l].col = fade_col(fader *ratio*100, col);
  
  // Eo func
}


//  *********8    Symmetrics
var symmetries = [ 'mirr-x', 'mirr-y', 'mirr-xy', 'mirr-inv', 'rot-3', 'rot-4', 'rot-5' ];
var symm = 6;
var return_to_ctr = false;
var points = [ rand_point(), rand_point() ];

function symmetric_calc(l){
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
  pixels[l].col = fade_col(fader*ratio*100, col);


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
        let ret_vec = from_angle(ret_ang, 0.1 );
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
      point.vel = from_angle(point.dir, rand(0.03,0.1) ); 
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



//        ************         Statics



function radial(l){
  let r=0, g=0, b=0;
  var dist = Math.abs(pixels[l].x)+Math.abs(pixels[l].y);
  r = dist * dist /2;
  let colour = HSVtoRGB(Hue, 1, Bright );
  pixels[l].col = fade_col(r, colour );
}


function draw_eclipse(){

  let index = 0;

  let r=0, g=0, b=0;
  
  for(var l=0; l<pixels.length; l++)
  {
    let bright = pixels[l].cl / (pix_per_row[pixels[l].rw]-1);
    let colour = HSVtoRGB(Hue, 1, Bright );
    pixels[l].col = fade_col(bright * 100, colour );
  // Eo for
  }

  // Eo func
}


//        ************         Functions


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
    vel: from_angle(dir, 0.1 ),
    rad: rand(2,4),
    hue: rand_hue(Hue,0.01)
  }
}


function rand(min,max){
  return Math.random()*(max-min) + min;
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
function expon3(x,xMin,xMax,yMin,yMax){
  let prop = (x-xMin)/(xMax-xMin);
  let sc = yMin + prop*prop*prop *(yMax-yMin);
  return sc;
}

function angle_diff(a,b){
  let A = Math.floor(a * 180 / PI);
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







function send_pixels(){
  
  for(var l=0; l<pixels.length; l++){
    port.write(pixels[l].col);
  }
  port.write([255]);
}

