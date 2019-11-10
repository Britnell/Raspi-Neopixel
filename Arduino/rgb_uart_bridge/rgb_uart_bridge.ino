/*
 *  This sketch programs arduino as a UART bridge to Control neopixel
 *    the pixel data is sent from PC or raspberry pi over USB UART to the Arduino
 *    Little verification is done for speed, only makes sure the right number LEDs is received. 
 *    the speed is pretty good and runs at around 10 Hz, I have not fully tested the limits.
 *    
 *    FOR DEBUG
 *      you could send the number of bits in Serial queue Serial.available() back to the host
 *      on every frame, to see if it is 0 or if frames are queueing up since the host is sending
 *      too face. 
 *      It ONLY shows ALL leds if the right number was received, if too many or too few 
 *      were received then NONE are displayed.
 *    
 *    IMPORTANT
 *      I am just sending the RGB vals straight as 8 bit values, however using 255 as checkbit 
 *      and End-of-Frame. So make sure to restrict your values to 0 to 254
 *      
 *    USAGE
 *      Just adjust to your number of LEDs and LED data-pin 
 *  
 */

#include <Adafruit_NeoPixel.h>

#define PIN            3
#define NUMPIXELS      301

#define STARTUP_PATTERN   true
#define DEBUG_SERIAL_QUEUE  false

Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUMPIXELS, PIN, NEO_RGB + NEO_KHZ800);

char buff[50];


void setup() {
  // ---
  Serial.begin(115200);
  pixels.begin(); 

  // blink at startup
  if(STARTUP_PATTERN)
  {
    int test = 301;
    for(int n=0;n<test;n++){
      for(int l=0;l<test; l++){
        if(n+1==l)
           pixels.setPixelColor(l, pixels.Color(150,0,0));
        else 
          pixels.setPixelColor(l, pixels.Color(0,0,0));
      }
      pixels.show();
    }
    
  }
}

int len = 0;
int col_i = 0;
int color = 0;
int red = 0;
int green = 0;
int blue = 0;
uint8_t reframe=0;

void loop() 
{
  if (Serial.available())
  {
    byte s = Serial.read();
    if (s == 255 )
    {
      if(DEBUG_SERIAL_QUEUE){
        Serial.print("S:\t"); Serial.println(Serial.available());        
      }
        if(len==NUMPIXELS) {
          // - Show strip
          pixels.show();
        }
        col_i = 0;      
        len = 0;
        // if EOL
    }
    else
    {
      // - its an RGB value
      if (col_i == 0) 
      {
        green = s;
        col_i++;
      }
      else if (col_i == 1) {
        red = s;
        col_i++;
      }
      else if (col_i == 2) {
        blue = s;
        if(len<NUMPIXELS){
          pixels.setPixelColor(len , red, green, blue );    
        }
        col_i=0;
        len++;
      }
      // - if not EOL
    }

    // - if serial available
  }

  // ** Eo loop
}


