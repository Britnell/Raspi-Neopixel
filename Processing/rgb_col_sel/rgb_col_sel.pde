
/**
 * draw image strip for 8x32 neopixel matrix 
 *
 *   Arduino sketch for receiving = dotstar_serial_1.in
 *  -  
 */
// * My own colour selector
// *
// **  


import processing.serial.*;
import controlP5.*;


ControlP5 cp5;
ColorPicker cp;

Serial ardPort;  // Create object from Serial class
int val;      // Data received from the serial port

PVector canvasSize, canvasPos; 

String portName = "COM5";   
int PIXEL_X = 301;
int PIXEL_Y = 8;
float PIXEL_W, PIXEL_H;

int send_period = 500;

int wheelPosX, wheelPosY, wheelSize;

color paintCol;

int send_index=0;
long last_send = 0;

int bars = 4;
Slider[] sliders = new Slider[bars];
float dimmer;

PVector sliderPos = new PVector(20, 40 );
float bar_hei = 40;
  
void setup()
{
  // * Canvas
  colorMode(RGB, 255, 255, 255);
  
  paintCol = color( 180, 0, 0 );

  size(600, 600 );

  PIXEL_W = width / PIXEL_X;
  PIXEL_H = height / PIXEL_Y;
  
  // * Colour sliders
  
  
  sliders[0] = new Slider( sliderPos.x, sliderPos.y +0            , width-50, bar_hei );
  sliders[1] = new Slider( sliderPos.x, sliderPos.y +1*1.5*bar_hei, width-50, bar_hei );
  sliders[2] = new Slider( sliderPos.x, sliderPos.y +2*1.5*bar_hei, width-50, bar_hei );
  sliders[3] = new Slider( sliderPos.x, sliderPos.y +3*1.5*bar_hei, width-50, bar_hei );
  sliders[0].name="R";
  sliders[1].name="G";
  sliders[2].name="B";
  sliders[3].name="dimm";
  sliders[0].barcol = color(180,0,0);
  sliders[1].barcol = color(0,180,0);
  sliders[2].barcol = color(0,0,180);
  sliders[3].barcol = color(100,100,100);
  sliders[0].val = red(paintCol);
  sliders[1].val = green(paintCol);
  sliders[2].val = blue(paintCol);
  sliders[3].val = 50;
  sliders[3].max = 100;
  dimmer = 0.5;
  // dimmer
  
  
  // * Serial

  print("Serial ports available: ");
    println( Serial.list() );
  //String portName = Serial.list()[0];
  print("opening serial : ");
  println( portName );
  ardPort = new Serial(this, portName, 115200);

  // * INit

  draw_sliders();
  col_rect();
  // ** Eo setup
}


void draw()
{
  // -
  


  // ** Eo draw
}

void draw_sliders(){
   for( int s=0; s<bars; s++)
     sliders[s].draw_slider(); 
}

void mousePressed()
{
  mouse_func( mouseX, mouseY); 
  
  // * Eo mousePressed
}

void mouseDragged( )
{
  mouse_func( mouseX, mouseY); 
  
  // * Eo mousePressed
}

void mouseReleased()
{
  send_pixels();
}


long last_frame=0;
void col_rect(){
  int Rsize = 130;
  fill(paintCol);  noStroke();
  rect( 40, sliderPos.y+bar_hei*6 ,Rsize,Rsize );
}
void mouse_func( int x, int y)
{
  // Check bars for clicks and adjust colour
  for ( int b=0; b<bars; b++)
  {
    // check vals
    if (sliders[0].check_slider(x, y)) {
      paintCol = color(sliders[0].val,sliders[1].val,sliders[2].val);
      println( int(sliders[0].val),
                int(sliders[1].val),
                 int(sliders[2].val) );
      col_rect();
    } 
    else if (sliders[1].check_slider(x, y)) {
      paintCol = color(sliders[0].val,sliders[1].val,sliders[2].val);
      println( sliders[0].val,sliders[1].val,sliders[2].val );
      col_rect();
    }
    else if (sliders[2].check_slider(x, y)) {
      paintCol = color(sliders[0].val,sliders[1].val,sliders[2].val);
      println( sliders[0].val,sliders[1].val,sliders[2].val );
      col_rect();
    }
    else if (sliders[3].check_slider(x, y)) {
      dimmer = sliders[3].val/100;
      //col_rect();
      //send_pixels();
    }
    
    // Eo for
  }
  // Eo func
}



void send_pixels()
{
  
  for ( int x=0; x<PIXEL_X; x++)
  {
      //EVEN - DOWN
        color c = paintCol;
        ardPort.write( int(red(c)));
        ardPort.write( int(green(c)));
        ardPort.write( int(blue(c)));      
    // * for X
  }
  // Send EOL
  ardPort.write(255);    // EOL char 255

  // Eo function
}

void clear_pixels()
{
  //for ( float y=canvasPos.y+PIXEL_H/2; y<canvasPos.y+canvasSize.y; y+=PIXEL_H )
  for( int x=0; x<2; x++)
  {

    //for (float x=canvasPos.x+PIXEL_W/2; x<canvasPos.x+canvasSize.x; x+=PIXEL_W )
    for( int y=0; y<5; y++)
    {
      ardPort.write(0);
      ardPort.write(0);
      ardPort.write(0);
    }
  }
  ardPort.write(254);
  // Eo func
}

void keyPressed()
{
  // clear on any keyboard press
  if(key==' '){
      clear_pixels();
      // redraw screen
      draw_sliders();
      col_rect();
  }
  else if(key=='r'){
     send_pixels(); 
  }
  else if(key=='c'){
     paintCol = color(0,0,0);
     sliders[0].val = 0;
     sliders[1].val = 0;
     sliders[2].val = 0;
     draw_sliders();
      col_rect();
  }
  // EO keyPressed
}


class Slider {
  float xpos, ypos;
  float wid, hei;
  float val, min, max;
  color barcol;
  String name;

  Slider(float x, float y, float w, float h ) {
    xpos = x;
    ypos = y;
    wid = w;
    hei = h;

    val = 0;
    min = 0;
    max = 255;
    name="";

    barcol = color(random(255), random(255), random(255));

    //-
  }
  
  // * checks for clicks and redraws if necessary
  boolean check_slider(int mx, int my) {
    // check val
    boolean changed = false;

    if ( mx >xpos && mx <xpos+wid)
      if ( my >ypos && my < ypos+hei ) {
        // adjust
        val = (map(mx, xpos, xpos+wid, min, max));
        //println(val);
        // Redraw
        draw_slider();
        changed = true;
      }
    return changed;
  }

  void draw_slider() {
    noStroke();  
    fill(0);
    rect(xpos, ypos, wid, hei );
    noStroke();  
    fill(barcol);
    rect(xpos, ypos+2, map(val, min, max, 0, wid), hei-4 );
    textSize(hei-4);   
    fill(barcol);
    text( name, xpos+wid+5, ypos+hei );
  }

  // ** Eo class
}