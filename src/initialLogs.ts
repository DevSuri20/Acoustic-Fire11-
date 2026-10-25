/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FireLog } from "./types";

export const initialLogs: FireLog[] = [
  {
    id: "LOG-1028",
    timestamp: "2026-07-05T09:12:00-07:00",
    location: "Electrical Cabinet A-4 (Main Server Hall)",
    fireOccurred: true,
    sensorData: {
      smoke: 82,
      temperature: 78.4,
      combustibleGas: 240,
      opticalFlame: 8
    },
    classification: "SUPPRESSED",
    acousticDetails: {
      frequency: 42,
      amplitudeDb: 118,
      durationSeconds: 6.8,
      waveForm: "Sweep"
    },
    relayStatus: "NORMAL",
    batteryLevel: 98,
    notes: "Arc flash ignition detected. Low-frequency 42Hz acoustic sweep activated immediately, disrupting fuel-air boundaries and starving the fire. Extinguishment achieved in 6.8 seconds. Electrical relay remained operational."
  },
  {
    id: "LOG-1027",
    timestamp: "2026-07-04T18:30:15-07:00",
    location: "Kitchen Range Hood (Staff Lounge)",
    fireOccurred: false,
    sensorData: {
      smoke: 65,
      temperature: 42.1,
      combustibleGas: 15,
      opticalFlame: 1
    },
    classification: "FALSE_ALARM",
    falseAlarmReason: "High steam concentration during dishwasher exhaust cycle.",
    relayStatus: "NORMAL",
    batteryLevel: 100,
    notes: "Multi-sensor fusion identified steam signature. High humidity and elevated smoke index detected without corresponding optical flames or combustible gas spikes. Acoustic driver remained in standby; alarm suppressed."
  },
  {
    id: "LOG-1026",
    timestamp: "2026-07-03T11:45:22-07:00",
    location: "Lithium-Ion Battery Storage Unit B",
    fireOccurred: true,
    sensorData: {
      smoke: 95,
      temperature: 138.2,
      combustibleGas: 780,
      opticalFlame: 9
    },
    classification: "ESCALATED",
    acousticDetails: {
      frequency: 38,
      amplitudeDb: 120,
      durationSeconds: 15.0,
      waveForm: "Square"
    },
    relayStatus: "TRIPPED",
    batteryLevel: 94,
    notes: "Thermal runaway event initiated. Acoustic driver deployed high-amplitude 38Hz waves for the maximum safety threshold of 15 seconds. Fire suppressed temporarily, but heat spike continued. Automatic circuit breaker relay tripped to disconnect electrical backup and isolate the cabinet. Emergency dispatch notified."
  },
  {
    id: "LOG-1025",
    timestamp: "2026-07-02T14:20:00-07:00",
    location: "Cleanroom Laser Laboratory (North Wing)",
    fireOccurred: true,
    sensorData: {
      smoke: 74,
      temperature: 69.5,
      combustibleGas: 110,
      opticalFlame: 6
    },
    classification: "SUPPRESSED",
    acousticDetails: {
      frequency: 45,
      amplitudeDb: 115,
      durationSeconds: 4.2,
      waveForm: "Sine"
    },
    relayStatus: "NORMAL",
    batteryLevel: 100,
    notes: "Laser alignment target paper ignited. 45Hz pure acoustic wave extinguished the combustion boundary layer within 4.2 seconds. Cleanroom atmosphere preserved without residue. Sensitive instrumentation safe."
  },
  {
    id: "LOG-1024",
    timestamp: "2026-06-30T08:15:35-07:00",
    location: "Server Rack Cabinets (Row F)",
    fireOccurred: false,
    sensorData: {
      smoke: 52,
      temperature: 28.3,
      combustibleGas: 5,
      opticalFlame: 0
    },
    classification: "FALSE_ALARM",
    falseAlarmReason: "Dust explosion during server fan compressed air maintenance.",
    relayStatus: "NORMAL",
    batteryLevel: 100,
    notes: "Transient smoke sensor spike due to particulate dispersion. Temperature and flame checks negative. System successfully differentiated maintenance dust from real thermal hazard. Zero-acoustic downtime maintained."
  }
];
