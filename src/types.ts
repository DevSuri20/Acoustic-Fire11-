/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EventClassification = "NORMAL" | "FALSE_ALARM" | "SUPPRESSED" | "ESCALATED";

export interface SensorData {
  smoke: number;           // Percentage (0 - 100)
  temperature: number;     // Celsius (°C)
  combustibleGas: number;  // Parts per million (ppm)
  opticalFlame: number;    // Sensor reading (0 - 10 scale)
}

export interface AcousticDetails {
  frequency: number;       // Low-frequency wave in Hertz (Hz), typically 30 - 60 Hz
  amplitudeDb: number;     // Sound pressure level (dB), e.g. 110 - 120 dB
  durationSeconds: number; // Time active (seconds)
  waveForm: "Sine" | "Square" | "Sweep";
}

export interface FireLog {
  id: string;
  timestamp: string;
  location: string;
  fireOccurred: boolean;
  sensorData: SensorData;
  classification: EventClassification;
  falseAlarmReason?: string;
  acousticDetails?: AcousticDetails;
  relayStatus: "NORMAL" | "TRIPPED";
  batteryLevel: number;    // % backup charge during event
  notes: string;
}

export interface SystemStatus {
  online: boolean;
  operationalMode: "ACTIVE" | "STANDBY" | "MAINTENANCE";
  batteryLevel: number;
  relayState: "NORMAL" | "TRIPPED";
  temperature: number;
  smoke: number;
  gas: number;
  flame: number;
  lastDiagnosticTest: string;
}
