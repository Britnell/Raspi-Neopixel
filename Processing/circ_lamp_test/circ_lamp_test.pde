// Already adjusting for raspberry pi :
//     matches new serial type of arduino ser_3 , no ',', no scaling and 255 EOframe


// *  Serial
import processing.serial.*;
Serial ardPort;

int PIXEL = 301;
int x = 0;

void setup()
{
  size(800,800);
  frameRate(60);
  printArray(Serial.list());
  //ardPort = new Serial(this, "COM5", 115200);
  ardPort = new Serial(this, Serial.list()[0], 115200);
  delay(100);
  
  //
  int x=0;
  for( int p=0; p<PIXEL; p++){
     if((p+x)%3==0)       ardPort.write(254);
      else              ardPort.write(0);
     if((p+x)%3==1)       ardPort.write(254);
      else              ardPort.write(0);
     if((p+x)%3==2)       ardPort.write(254);
      else              ardPort.write(0);
     //
     delay(1);
  }
  x++;
  ardPort.write(255);
  delay(100);
  for( int p=0; p<PIXEL; p++){
     if((p+x)%3==0)       ardPort.write(254);
      else              ardPort.write(0);
     if((p+x)%3==1)       ardPort.write(254);
      else              ardPort.write(0);
     if((p+x)%3==2)       ardPort.write(254);
      else              ardPort.write(0);
     //
     delay(1);
  } 
  ardPort.write(255);
  x++;
  delay(100);
  for( int p=0; p<PIXEL; p++){
     if((p+x)%3==0)       ardPort.write(254);
      else              ardPort.write(0);
     if((p+x)%3==1)       ardPort.write(254);
      else              ardPort.write(0);
     if((p+x)%3==2)       ardPort.write(254);
      else              ardPort.write(0);
     //
     delay(1);
  } 
  ardPort.write(255);
  delay(100);
    
  // Eo setup
}

void draw()
{
  //
  if(ardPort.available() >0){
     print(ardPort.readChar());
  }
  
  for( int p=0; p<PIXEL; p++){
     if(x==p+1){
       ardPort.write(254);
       ardPort.write(0);
       ardPort.write(0);
     }
     else{
       ardPort.write(0);
       ardPort.write(0);
       ardPort.write(0);
     }
     //
     //delay(1);
  } 
  ardPort.write(255);
  //delay(10);
  
  x++;  if(x>PIXEL)  x=0;
  
  // Eo draw
}



void rgb(){
  colorMode(RGB, 255, 255, 255);
}
void hsv(){
  //colorMode(HSB, 360, 100, 100);
  colorMode(HSB, 255);
}