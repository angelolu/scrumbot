#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>

#include "secret.h"

#define PIN_LED 16
#define PIN_BUTTON 13
#define LAG_TIME 10800000 // 3 hours in millis
#define FEED_INTERVAL 28800000 // 8 hours in millis

#define BLINK_INTERVAL 500
bool pressed = false;
unsigned long lastRelease = 0;
unsigned long lastPress = 0;
unsigned long lastBlink = 0;
bool blinkOn = true;
int queuedServings = 0;

char ssid[] = WIFI_NAME;
char password[] = WIFI_PASSWORD;
char host[] = AWSHOST;

WiFiClientSecure client;

void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  Serial.begin(57600);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUTTON, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  Serial.print(F("Connecting to Wifi: "));
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(F("."));
    delay(500);
  }
  Serial.println(F("WiFi connected"));
  Serial.println(F("IP address: "));
  IPAddress ip = WiFi.localIP();
  Serial.println(ip);

}

// the loop function runs over and over again forever
void loop() {
  int state = digitalRead(PIN_BUTTON);

  if (queuedServings > 0 && lastPress != 0) {
    if (millis() - lastPress > 500) {
      // Turn off the LED after 0.5 seconds after press
      digitalWrite(PIN_LED, LOW);
    } 
    if (millis() - lastPress > 5000) {
      // If it has been more than 5 seconds without a press, post to AWS
      tellAWS(queuedServings);
      queuedServings = 0;
    }
  } else if (queuedServings == 0 && lastPress != 0) {
    if (millis() - lastPress > FEED_INTERVAL && lastPress != 0) {
      if (blinkOn) {
        digitalWrite(PIN_LED, HIGH);
      } else {
        digitalWrite(PIN_LED, LOW);
      }
      if (millis() - lastBlink > BLINK_INTERVAL) {
        blinkOn = !blinkOn;
        lastBlink = millis();
      }
    } else if (millis() - lastPress < LAG_TIME && lastPress != 0) {
      digitalWrite(PIN_LED, HIGH);
      //Serial.println("WAIT ON");
    } else {
      digitalWrite(PIN_LED, LOW);
      //Serial.println("WAIT OFF");
    }
  }

  if (!pressed) {
    // The button is not currently held down
    if (state == LOW && millis() - lastRelease > 250) {
      // The button has been pressed and 250ms has passed since the button was released (bye noise)
      digitalWrite(PIN_LED, HIGH);
      Serial.println(F("Pressed"));
      queuedServings = queuedServings + 1;
      lastPress = millis();
      pressed = true;
    }
  } else {
    // The button is currently held down, as soon as it is released, reset the pressed flag and record the current time
    if (state == HIGH) {
      Serial.println(F("Released"));
      lastRelease = millis();
      pressed = false;
    }
  }
}

void tellAWS(int cups) {
  Serial.println(F("Connecting..."));
  if (client.connect(host, 443))
  {
    Serial.println(F("Connected to AWS"));

    String URL = "/dev/buttonpressed";
    String PostData = "cups=" + String(cups);
    Serial.println(URL);
    Serial.println(PostData);

    client.println("POST " + URL + " HTTP/1.1");
    client.print("Host: ");
    client.println(host);
    client.println("User-Agent: arduino/1.0");
    client.println("Content-Type: application/x-www-form-urlencoded");
    client.print("Content-Length: ");
    client.println(PostData.length());
    client.println();
    client.println(PostData);


    while (!client.available()) {
      delay(100);
    }
  } else {
    Serial.println(F("Connection failed"));
  }
}

