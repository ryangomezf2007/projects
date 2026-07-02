#include <SoftwareSerial.h>

// Bluetooth RX, TX
SoftwareSerial BT(10, 11);

// LEFT motors
#define RPWM_L 5
#define LPWM_L 6

// RIGHT motors
#define RPWM_R 9
#define LPWM_R 3

char command;

int targetSpeed = 0;
int currentSpeed = 0;
int maxSpeed = 200;
int rampStep = 5;

unsigned long lastCmdTime = 0;
int timeout = 300;

// motion mode
char motion = 'S';

// ---------- MOTOR CONTROL ----------

// FORWARD
void moveForward(int spd) {
  analogWrite(RPWM_L, spd);
  analogWrite(LPWM_L, 0);

  analogWrite(RPWM_R, spd);
  analogWrite(LPWM_R, 0);
}

// BACKWARD
void moveBackward(int spd) {
  analogWrite(RPWM_L, 0);
  analogWrite(LPWM_L, spd);

  analogWrite(RPWM_R, 0);
  analogWrite(LPWM_R, spd);
}

// SPIN RIGHT
void spinRight(int spd) {
  analogWrite(RPWM_L, spd);
  analogWrite(LPWM_L, 0);

  analogWrite(RPWM_R, 0);
  analogWrite(LPWM_R, spd);
}

// SPIN LEFT
void spinLeft(int spd) {
  analogWrite(RPWM_L, 0);
  analogWrite(LPWM_L, spd);

  analogWrite(RPWM_R, spd);
  analogWrite(LPWM_R, 0);
}

// STOP
void stopMotors() {
  analogWrite(RPWM_L, 0);
  analogWrite(LPWM_L, 0);
  analogWrite(RPWM_R, 0);
  analogWrite(LPWM_R, 0);
}

// ---------- SETUP ----------
void setup() {
  pinMode(RPWM_L, OUTPUT);
  pinMode(LPWM_L, OUTPUT);
  pinMode(RPWM_R, OUTPUT);
  pinMode(LPWM_R, OUTPUT);

  BT.begin(9600);
}

// ---------- LOOP ----------
void loop() {

  // Read Bluetooth
  if (BT.available()) {
    command = BT.read();
    lastCmdTime = millis();

    if (command == 'F') {
      motion = 'B';
      targetSpeed = maxSpeed;
    }
    else if (command == 'B') {
      motion = 'F';
      targetSpeed = maxSpeed;
    }
    else if (command == 'R') {
      motion = 'R';
      targetSpeed = maxSpeed;
    }
    else if (command == 'L') {
      motion = 'L';
      targetSpeed = maxSpeed;
    }
    else if (command == 'S') {
      motion = 'S';
      targetSpeed = 0;
    }
  }

  // Safety stop
  if (millis() - lastCmdTime > timeout) {
    targetSpeed = 0;
    motion = 'S';
  }

  // ---------- SMOOTH RAMP ----------
  if (currentSpeed < targetSpeed)
    currentSpeed += rampStep;
  else if (currentSpeed > targetSpeed)
    currentSpeed -= rampStep;

  // ---------- APPLY MOTION ----------
  switch (motion) {

    case 'F':
      moveForward(currentSpeed);
      break;

    case 'B':
      moveBackward(currentSpeed);
      break;

    case 'R':
      spinRight(currentSpeed);
      break;

    case 'L':
      spinLeft(currentSpeed);
      break;

    default:
      stopMotors();
  }

  delay(15); // smooth timing
}