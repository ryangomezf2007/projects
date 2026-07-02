#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27,16,2);

// Sensor pins
int trigPins[4] = {2,4,6,8};
int echoPins[4] = {3,5,7,9};

String directions[4] = {
  "FRONT",
  "RIGHT",
  "BACK",
  "LEFT"
};

// Outputs
#define greenLED 10
#define redLED 11
#define buzzer 12

long duration;
int distance;

int readDistance(int trig, int echo) {

  digitalWrite(trig, LOW);
  delayMicroseconds(2);

  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  duration = pulseIn(echo, HIGH, 30000);
  return duration * 0.034 / 2;
}

void setup() {

  Serial.begin(9600);

  for(int i=0;i<4;i++){
    pinMode(trigPins[i], OUTPUT);
    pinMode(echoPins[i], INPUT);
  }

  pinMode(greenLED, OUTPUT);
  pinMode(redLED, OUTPUT);
  pinMode(buzzer, OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.print("Smart Fence");
  delay(2000);
  lcd.clear();
}

void loop() {

  int minDistance = 500;
  int detectedSide = -1;

  // Read sensors
  for(int i=0;i<4;i++){
    int d = readDistance(trigPins[i], echoPins[i]);

    if(d > 0 && d < minDistance){
      minDistance = d;
      detectedSide = i;
    }

    delay(50);
  }

  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Dist:");
  lcd.print(minDistance);
  lcd.print("cm");

  // -------- SAFE --------
  if(minDistance > 20){

    digitalWrite(greenLED, HIGH);
    digitalWrite(redLED, LOW);
    digitalWrite(buzzer, LOW);

    lcd.setCursor(0,1);
    lcd.print("STATUS: SAFE");
  }

  // -------- WARNING --------
  else if(minDistance > 10){

    digitalWrite(greenLED, LOW);
    digitalWrite(redLED, HIGH);
    digitalWrite(buzzer, LOW);

    lcd.setCursor(0,1);
    lcd.print("WARN ");
    lcd.print(directions[detectedSide]);
  }

  // -------- DANGER --------
  else{

    digitalWrite(greenLED, LOW);
    digitalWrite(redLED, HIGH);
    digitalWrite(buzzer, HIGH);

    lcd.setCursor(0,1);
    lcd.print("ALERT ");
    lcd.print(directions[detectedSide]);
  }

  delay(250);
}