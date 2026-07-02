#include <Wire.h>
#include <U8g2lib.h>

// OLED
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0);

// -------- PINS --------
#define BUTTON 2
#define BUZZER 8
#define LED 7
#define LDR A1

#define ECG A0
#define LO_PLUS 10
#define LO_MINUS 11

// -------- VARIABLES --------
volatile bool modeChangeRequest = false;
unsigned long lastInterruptTime = 0;

int mode = 0;
int bpm = 75;
bool nightMode = false;

int heartSize = 3;
bool grow = true;

unsigned long lastBeatTime = 0;

// -------- ECG FILTER --------
#define FILTER_SIZE 10
int readings[FILTER_SIZE];
int indexECG = 0;
int total = 0;

//////////////// INTERRUPT //////////////////
void buttonISR() {
  if (millis() - lastInterruptTime > 250) {
    modeChangeRequest = true;
    lastInterruptTime = millis();
  }
}

//////////////// SETUP //////////////////
void setup() {

  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  pinMode(LED, OUTPUT);

  pinMode(LO_PLUS, INPUT);
  pinMode(LO_MINUS, INPUT);

  Serial.begin(115200);

  u8g2.begin();
  u8g2.setContrast(200);   // default brightness

  attachInterrupt(digitalPinToInterrupt(BUTTON), buttonISR, FALLING);

  startupScreen();
}

//////////////// LOOP //////////////////
void loop() {

  if (modeChangeRequest) {
    mode++;
    if (mode > 3) mode = 0;
    modeChangeRequest = false;
  }

  detectNight();          // ⭐ brightness control
  setHeartCondition();
  drawScreen();
  heartbeatManager();
}

//////////////// CLEAN ECG //////////////////
int getCleanECG(int rawValue) {

  total -= readings[indexECG];
  readings[indexECG] = rawValue;
  total += readings[indexECG];

  indexECG++;
  if (indexECG >= FILTER_SIZE) indexECG = 0;

  return total / FILTER_SIZE;
}

//////////////// HEART SOURCE //////////////////
void setHeartCondition() {

  if (mode == 0) {
    bpm = 75;
  }
  else if (mode == 1) {
    bpm = 120;
  }
  else if (mode == 2) {
    bpm = 45;
  }
  else if (mode == 3) {

    if (digitalRead(LO_PLUS) == HIGH || digitalRead(LO_MINUS) == HIGH) {
      bpm = 0;
    } else {
      int rawECG = analogRead(ECG);
      int cleanECG = getCleanECG(rawECG);

      Serial.println(cleanECG);

      bpm = map(cleanECG, 300, 700, 60, 110);
      bpm = constrain(bpm, 50, 130);
    }
  }
}

//////////////// NIGHT BRIGHTNESS CONTROL //////////////////
void detectNight() {

  int lightValue = analogRead(LDR);

  if (lightValue < 400) {
    nightMode = true;
    u8g2.setContrast(40);     // DIM at night
  } else {
    nightMode = false;
    u8g2.setContrast(200);    // BRIGHT at day
  }
}

//////////////// DISPLAY //////////////////
void drawScreen() {

  u8g2.clearBuffer();

  u8g2.setFont(u8g2_font_6x12_tf);
  u8g2.drawStr(2,10,"CARDIOS Monitor");

  if (nightMode)
    u8g2.drawStr(95,10,"NIGHT");

  u8g2.drawStr(2,22,getModeName());

  animateHeart(25,40);

  char bpmText[10];
  sprintf(bpmText,"%d BPM",bpm);

  u8g2.setFont(u8g2_font_logisoso20_tf);
  u8g2.drawStr(45,50,bpmText);

  u8g2.sendBuffer();
}

//////////////// HEART ANIMATION //////////////////
void animateHeart(int x,int y) {

  if (grow) heartSize++;
  else heartSize--;

  if (heartSize > 5) grow = false;
  if (heartSize < 3) grow = true;

  u8g2.drawDisc(x-heartSize,y,heartSize);
  u8g2.drawDisc(x+heartSize,y,heartSize);
  u8g2.drawTriangle(x-2*heartSize,y,
                    x+2*heartSize,y,
                    x,y+3*heartSize);
}

//////////////// MODE NAME //////////////////
const char* getModeName() {

  if(mode==0) return "NORMAL";
  if(mode==1) return "HIGH HR";
  if(mode==2) return "LOW HR";
  return "REAL ECG";
}

//////////////// HEARTBEAT //////////////////
void heartbeatManager() {

  if (bpm <= 0) return;

  unsigned long interval = 60000UL / bpm;
  bool abnormal = (bpm > 100 || bpm < 55);

  if (millis() - lastBeatTime >= interval) {

    lastBeatTime = millis();

    digitalWrite(LED, HIGH);
    tone(BUZZER, 1000, 80);   // ⭐ SOUND ALWAYS
    delay(40);
    digitalWrite(LED, LOW);

    if (abnormal)
      cardiacAlert();          // ⭐ works day & night
  }
}

//////////////// ALERT //////////////////
void cardiacAlert() {

  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_logisoso20_tf);
  u8g2.drawStr(10,30,"CARDIAC");
  u8g2.drawStr(25,60,"ALERT!");
  u8g2.sendBuffer();

  tone(BUZZER,1500,200);

  digitalWrite(LED,HIGH);
  delay(120);
  digitalWrite(LED,LOW);
}

//////////////// STARTUP //////////////////
void startupScreen() {

  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_logisoso20_tf);
  u8g2.drawStr(10,40,"CARDIOS");
  u8g2.sendBuffer();

  delay(2000);
}