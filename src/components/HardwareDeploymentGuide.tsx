import React, { useState } from "react";
import { 
  Cpu, 
  Copy, 
  Check, 
  Zap, 
  Volume2, 
  Radio, 
  Terminal, 
  Flame, 
  Sliders, 
  AlertTriangle, 
  Code2, 
  ExternalLink,
  X,
  Play,
  RotateCcw
} from "lucide-react";

interface HardwareDeploymentGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HardwareDeploymentGuide({ isOpen, onClose }: HardwareDeploymentGuideProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"CODE" | "WIRING" | "SIMULATE_HW">("CODE");

  // Hardware Pin Simulation State
  const [isSimulatingHW, setIsSimulatingHW] = useState(false);
  const [servoAngle, setServoAngle] = useState(90);
  const [flameTriggered, setFlameTriggered] = useState(false);
  const [sweepDirection, setSweepDirection] = useState<1 | -1>(1);

  // ESP8266 C++ Arduino Code according to user's exact specifications
  const esp8266Code = `/*
 * =========================================================================================
 * ACOUSTIC FIRE SUPPRESSION & MONITORING SYSTEM - ESP8266 FIRMWARE
 * =========================================================================================
 * Target Board: ESP8266 NodeMCU v1.0 / WeMos D1 Mini
 * 
 * HARDWARE PIN MAPPING:
 * -----------------------------------------------------------------------------------------
 *  Pin D0 (GPIO 16) : BUZZER (Audio Alert / High Frequency Alarm)
 *  Pin D5 (GPIO 14) : SERVO MOTOR (Continuous Scanning Arm - 0° to 180° Sweep)
 *  Pin D6 (GPIO 12) : FLAME SENSOR (IR Optical Flame Detector - Active LOW on fire)
 *  Pin D7 (GPIO 13) : MP3 PLAYER / RELAY TRIGGER (Triggers DAC + Subwoofer 35-50Hz Audio)
 *  Pin D8 (GPIO 15) : STATUS LED / AUX RELAY (System Health / Fire Active LED Indicator)
 * -----------------------------------------------------------------------------------------
 * 
 * HARDWARE WORKING LOGIC:
 * 1. The Servo motor on D5 continually pans back and forth (0° <-> 180°) to sweep the room.
 * 2. Flame sensor on D6 continuously monitors IR radiation during the sweep.
 * 3. When NO FLAME is detected:
 *    - Servo keeps sweeping.
 *    - Buzzer (D0) is OFF.
 *    - MP3 Trigger (D7) is LOW (Subwoofer Standby).
 *    - Sends baseline pseudo telemetry (Temp: 22°C, Smoke: 2%, Gas: 15ppm, Flame: 0).
 * 4. When FLAME IS DETECTED (D6 goes LOW):
 *    - Servo STOPS panning immediately and HOLDS position pointing at the fire!
 *    - Buzzer (D0) sounds intermittent high-pitch alert pulses.
 *    - MP3 Trigger (D7) goes HIGH to trigger low-frequency acoustic wave playback to Subwoofer.
 *    - Sends fire alert telemetry (Temp: 78°C, Smoke: 80%, Gas: 350ppm, Flame: 9/10).
 * =========================================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Servo.h>

// -----------------------------------------------------------------------------------------
// PIN DEFINITIONS (ESP8266 NodeMCU / WeMos D1 Mini)
// -----------------------------------------------------------------------------------------
const int PIN_BUZZER       = 16; // D0 (GPIO 16) - Buzzer Output
const int PIN_SERVO        = 14; // D5 (GPIO 14) - Servo Sweep Control
const int PIN_FLAME_SENSOR = 12; // D6 (GPIO 12) - IR Flame Sensor Input
const int PIN_MP3_TRIGGER  = 13; // D7 (GPIO 13) - MP3 / DAC Subwoofer Trigger
const int PIN_STATUS_LED   = 15; // D8 (GPIO 15) - Status / Auxiliary LED

// -----------------------------------------------------------------------------------------
// WIFI CONFIGURATION (Optional: Update with your WiFi credentials)
// -----------------------------------------------------------------------------------------
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Telemetry Server URL (Updates app server if online)
const char* serverUrl = "http://192.168.1.100:3000/api/telemetry"; 

// Servo Object
Servo scannerServo;

// Sweep Variables
int currentAngle = 0;
int sweepStep = 3;             // Degrees per step
unsigned long lastSweepTime = 0;
const int sweepInterval = 30;  // Delay between servo steps (ms)

// Telemetry Timing
unsigned long lastTelemetryTime = 0;
const int telemetryInterval = 2000; // Send telemetry every 2 seconds

// System State
bool isFireDetected = false;

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("=====================================================");
  Serial.println(" ACOUSTIC FIRE SUPPRESSION - ESP8266 INITIALIZING ");
  Serial.println("=====================================================");

  // Pin Modes Configuration
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_MP3_TRIGGER, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_FLAME_SENSOR, INPUT); // Most IR modules are Active LOW

  // Initial State
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_MP3_TRIGGER, LOW);
  digitalWrite(PIN_STATUS_LED, HIGH); // LED ON = System Powered & Ready

  // Attach Servo
  scannerServo.attach(PIN_SERVO);
  scannerServo.write(90); // Start at center position
  delay(500);

  // WiFi Connection Attempt (Non-blocking fallback if no WiFi)
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 10) {
    delay(500);
    Serial.print(".");
    wifiRetries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n[WiFi] Connected! IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\\n[WiFi] Offline mode active. Running local acoustic loop.");
  }

  Serial.println("[System] Scanning loop engaged.");
}

void loop() {
  unsigned long now = millis();

  // Read IR Flame Sensor (Active LOW on most flame sensor modules)
  // LOW = Flame Detected | HIGH = Normal Ambient Clear
  int flameSensorState = digitalRead(PIN_FLAME_SENSOR);
  isFireDetected = (flameSensorState == LOW);

  // ---------------------------------------------------------------------------------------
  // SCENARIO 1: FLAME DETECTED!
  // ---------------------------------------------------------------------------------------
  if (isFireDetected) {
    // 1. FREEZE SERVO AT CURRENT FLAME ANGLE (Points at fire)
    // We do not increment currentAngle while fire is detected

    // 2. TRIGGER HIGH-FREQUENCY BUZZER ALARM (D0)
    digitalWrite(PIN_BUZZER, HIGH);

    // 3. TRIGGER MP3 PLAYER / DAC ACOUSTIC WAVE SUBWOOFER (D7)
    digitalWrite(PIN_MP3_TRIGGER, HIGH);

    // 4. FLASH STATUS LED (D8)
    digitalWrite(PIN_STATUS_LED, (now / 200) % 2 == 0 ? HIGH : LOW);

    Serial.print("[ALARM!] FLAME DETECTED at Servo Angle: ");
    Serial.print(currentAngle);
    Serial.println(" deg | Acoustic Subwoofer Output ACTIVE (35-50Hz)");
  } 
  // ---------------------------------------------------------------------------------------
  // SCENARIO 2: AMBIENT NORMAL (NO FLAME)
  // ---------------------------------------------------------------------------------------
  else {
    // 1. DEACTIVATE ALARMS & MP3 TRIGGER
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_MP3_TRIGGER, LOW);
    digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON = Ready

    // 2. CONTINUOUS SERVO SWEEP (0° to 180° back and forth)
    if (now - lastSweepTime >= sweepInterval) {
      lastSweepTime = now;
      currentAngle += sweepStep;

      if (currentAngle >= 180) {
        currentAngle = 180;
        sweepStep = -abs(sweepStep); // Reverse to sweep left
      } else if (currentAngle <= 0) {
        currentAngle = 0;
        sweepStep = abs(sweepStep);  // Reverse to sweep right
      }

      scannerServo.write(currentAngle);
    }
  }

  // ---------------------------------------------------------------------------------------
  // TELEMETRY TRANSMISSION (Sends real-time or pseudo sensor data to app)
  // ---------------------------------------------------------------------------------------
  if (now - lastTelemetryTime >= telemetryInterval) {
    lastTelemetryTime = now;
    sendTelemetryPayload(isFireDetected, currentAngle);
  }

  yield(); // Prevent ESP8266 WDT (Watchdog Timer) reset
}

// -----------------------------------------------------------------------------------------
// TELEMETRY HELPER FUNCTION
// -----------------------------------------------------------------------------------------
void sendTelemetryPayload(bool fireActive, int angle) {
  // Generate pseudo values for future hardware upgrades (Temperature, Gas, Smoke)
  int temperature    = fireActive ? random(72, 88) : random(21, 25);
  int smokePercent   = fireActive ? random(65, 85) : random(1, 4);
  int gasPpm         = fireActive ? random(280, 420) : random(10, 20);
  int opticalFlame   = fireActive ? 9 : 0;

  String payload = "{";
  payload += "\\"location\\": \\"Acoustic Zone - Servo Angle " + String(angle) + "°\\",";
  payload += "\\"sensorData\\": {";
  payload += "\\"temperature\\": " + String(temperature) + ",";
  payload += "\\"smoke\\": " + String(smokePercent) + ",";
  payload += "\\"combustibleGas\\": " + String(gasPpm) + ",";
  payload += "\\"opticalFlame\\": " + String(opticalFlame);
  payload += "},";
  payload += "\\"fireOccurred\\": " + String(fireActive ? "true" : "false") + ",";
  payload += "\\"classification\\": \\"" + String(fireActive ? "SUPPRESSED" : "NORMAL") + "\\"";
  payload += "}";

  Serial.println("[TELEMETRY] " + payload);

  // Send over HTTP if WiFi is connected
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(payload);
    http.end();
  }
}
`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(esp8266Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-gradient-to-br from-amber-50 via-amber-100/40 to-cyan-50 dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600/80 rounded-3xl max-w-4xl w-full my-auto overflow-hidden shadow-2xl shadow-cyan-500/20 relative flex flex-col max-h-[90vh]">
        
        {/* Header Modal Bar */}
        <div className="p-5 bg-slate-950 border-b-2 border-amber-500/60 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-cyan-600 border-2 border-cyan-400/50 text-white rounded-2xl shadow-md shadow-cyan-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-4xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wider">
                  ESP8266 FIRMWARE v1.0
                </span>
                <span className="text-4xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> NODEMCU / WEMOS READY
                </span>
              </div>
              <h2 className="text-base font-sans font-extrabold text-white mt-0.5">
                ESP8266 Hardware Deployment & C++ Code
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="bg-amber-100/80 dark:bg-slate-950 px-5 py-2.5 border-b-2 border-amber-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("CODE")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "CODE"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>1. Arduino C++ Code (.ino)</span>
            </button>

            <button
              onClick={() => setActiveTab("WIRING")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "WIRING"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>2. Hardware Pinout & Wiring</span>
            </button>

            <button
              onClick={() => setActiveTab("SIMULATE_HW")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "SIMULATE_HW"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>3. Live Pin Tester</span>
            </button>
          </div>

          {activeTab === "CODE" && (
            <button
              onClick={copyCodeToClipboard}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "COPIED TO CLIPBOARD!" : "COPY ARDUINO CODE"}</span>
            </button>
          )}
        </div>

        {/* Modal Body Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow font-sans text-xs">

          {/* TAB 1: CODE VIEWER */}
          {activeTab === "CODE" && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-4 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold font-sans text-xs">Exact Pin & Hardware Setup Preserved:</p>
                  <p className="text-2xs font-mono">
                    • <strong>Buzzer:</strong> D0 (GPIO 16) | • <strong>Servo Motor:</strong> D5 (GPIO 14) | • <strong>IR Flame Sensor:</strong> D6 (GPIO 12) | • <strong>MP3 Trigger:</strong> D7 (GPIO 13) | • <strong>Status LED:</strong> D8 (GPIO 15)
                  </p>
                  <p className="text-3xs text-amber-700 dark:text-amber-300">
                    * Future features (Temperature & Gas) are transmitted as background baseline metrics so the webapp dashboard remains fully synchronized without requiring extra physical chips today!
                  </p>
                </div>
              </div>

              {/* Code Editor Container */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
                <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-3xs font-mono text-slate-400">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Acoustic_Fire_Suppression_ESP8266.ino
                  </span>
                  <span>Board: NodeMCU 1.0 (ESP-12E) | Baud: 115200</span>
                </div>

                <pre className="p-4 text-3xs font-mono text-cyan-300 leading-relaxed overflow-x-auto selection:bg-cyan-500 selection:text-slate-950 max-h-[450px] scrollbar-thin">
                  <code>{esp8266Code}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: WIRING DIAGRAM & PIN TABLE */}
          {activeTab === "WIRING" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Pinout Table */}
                <div className="bg-slate-50 dark:bg-slate-950 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h3 className="text-xs font-mono uppercase font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-500" /> ESP8266 Physical Wiring Table
                  </h3>

                  <div className="space-y-2 font-mono text-2xs">
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-cyan-600 dark:text-cyan-400">D0 (GPIO 16)</span>
                        <span className="block text-3xs text-slate-500">Audio Alarm Output</span>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                        Buzzer (+)
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-cyan-600 dark:text-cyan-400">D5 (GPIO 14)</span>
                        <span className="block text-3xs text-slate-500">PWM Scanning Arm</span>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800">
                        Servo Signal (Orange)
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-cyan-600 dark:text-cyan-400">D6 (GPIO 12)</span>
                        <span className="block text-3xs text-slate-500">Digital IR Flame Sensor</span>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                        Flame Sensor OUT (D0)
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-cyan-600 dark:text-cyan-400">D7 (GPIO 13)</span>
                        <span className="block text-3xs text-slate-500">Acoustic Trigger Signal</span>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                        MP3 Player / Subwoofer DAC
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-cyan-600 dark:text-cyan-400">D8 (GPIO 15)</span>
                        <span className="block text-3xs text-slate-500">Auxiliary Indicator</span>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                        Status LED / Relay
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Arduino IDE Flashing Guide */}
                <div className="bg-slate-50 dark:bg-slate-950 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h3 className="text-xs font-mono uppercase font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" /> How to Flash Code in Arduino IDE
                  </h3>

                  <ol className="list-decimal pl-4 space-y-2.5 font-sans text-2xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    <li>
                      Open <strong>Arduino IDE</strong> and go to <em>File &gt; Preferences</em>.
                    </li>
                    <li>
                      Add ESP8266 Board Manager URL:<br />
                      <code className="text-3xs font-mono text-cyan-600 dark:text-cyan-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-md break-all block mt-1">
                        http://arduino.esp8266.com/stable/package_esp8266com_index.json
                      </code>
                    </li>
                    <li>
                      Go to <em>Tools &gt; Board &gt; Boards Manager...</em>, search for <strong>esp8266</strong> and click <strong>Install</strong>.
                    </li>
                    <li>
                      Select Board: <strong>NodeMCU 1.0 (ESP-12E Module)</strong> or <strong>LOLIN(WEMOS) D1 R2 & mini</strong>.
                    </li>
                    <li>
                      Paste the code from Tab 1 into your sketch, connect your ESP8266 via Micro-USB, select the COM Port, and click <strong>Upload</strong>!
                    </li>
                  </ol>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: LIVE HARDWARE STATE SIMULATOR */}
          {activeTab === "SIMULATE_HW" && (
            <div className="bg-slate-50 dark:bg-slate-950 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-sans font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-500" /> Interactive ESP8266 Logic Tester
                  </h3>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    Test how the servo sweep and MP3 trigger react to the D6 flame sensor in real time.
                  </p>
                </div>

                <button
                  onClick={() => setIsSimulatingHW(!isSimulatingHW)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                    isSimulatingHW
                      ? "bg-rose-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {isSimulatingHW ? <X className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isSimulatingHW ? "PAUSE SERVO SWEEP" : "START SERVO SWEEP"}</span>
                </button>
              </div>

              {/* Pin Status Indicators Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-2xs">
                {/* D0 BUZZER */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  flameTriggered 
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300 animate-pulse" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                }`}>
                  <span className="text-4xs uppercase block font-bold">D0 (GPIO 16) BUZZER</span>
                  <span className="text-sm font-extrabold block mt-1">
                    {flameTriggered ? "HIGH (ALARM ON)" : "LOW (OFF)"}
                  </span>
                </div>

                {/* D5 SERVO */}
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-cyan-600 dark:text-cyan-400">
                  <span className="text-4xs uppercase block font-bold text-slate-400">D5 (GPIO 14) SERVO</span>
                  <span className="text-sm font-extrabold block mt-1">
                    {flameTriggered ? `FROZEN @ ${servoAngle}°` : `SWEEPING ${servoAngle}°`}
                  </span>
                </div>

                {/* D6 FLAME SENSOR */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  flameTriggered 
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400"
                }`}>
                  <span className="text-4xs uppercase block font-bold text-slate-400">D6 (GPIO 12) FLAME</span>
                  <span className="text-sm font-extrabold block mt-1">
                    {flameTriggered ? "LOW (FLAME DETECTED)" : "HIGH (CLEAR)"}
                  </span>
                </div>

                {/* D7 MP3 TRIGGER */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  flameTriggered 
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                }`}>
                  <span className="text-4xs uppercase block font-bold text-slate-400">D7 (GPIO 13) MP3 WAVE</span>
                  <span className="text-sm font-extrabold block mt-1">
                    {flameTriggered ? "HIGH (DAC 35Hz ON)" : "LOW (STANDBY)"}
                  </span>
                </div>
              </div>

              {/* Flame Trigger Action Button */}
              <div className="pt-2 flex items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Simulate IR Flame Detection:</span>
                  <span className="text-3xs text-slate-500 font-sans">Toggle D6 low state to simulate fire detection during servo sweep.</span>
                </div>

                <button
                  onClick={() => setFlameTriggered(!flameTriggered)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer shadow-md flex items-center gap-2 ${
                    flameTriggered
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "bg-rose-600 hover:bg-rose-500 text-white"
                  }`}
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{flameTriggered ? "CLEAR FLAME SENSOR (RESET D6)" : "TRIGGER FLAME SENSOR (PULL D6 LOW)"}</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 font-mono text-3xs text-slate-500">
          <span>HARDWARE_CONFIG: ESP8266_SERVO_SWEEP_ACUPHONE</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-sans font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 cursor-pointer shadow-sm transition"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
