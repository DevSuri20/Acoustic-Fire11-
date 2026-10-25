/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Sliders, Play, Volume2, VolumeX, ShieldAlert, Cpu, AlertTriangle, ShieldCheck, Zap, Activity } from "lucide-react";
import { FireLog, SensorData, EventClassification } from "../types";

import { playClickSound, playPresetSound, playSuppressionTriggerSound } from "../utils/soundEffects";

interface SuppressionSimulatorProps {
  onLogGenerated: (log: FireLog) => void;
  systemBattery: number;
  relayState: "NORMAL" | "TRIPPED";
  setRelayState: (state: "NORMAL" | "TRIPPED") => void;
}

const LOCATIONS = [
  "Electrical Cabinet A-4 (Main Server Hall)",
  "Lithium-Ion Battery Storage Unit B",
  "Cleanroom Laser Laboratory (North Wing)",
  "Kitchen Range Hood (Staff Lounge)",
  "Power Distribution Room (Basement)",
  "Chemical Storage Vault 3",
  "Main Control Console Rack"
];

export default function SuppressionSimulator({ 
  onLogGenerated, 
  systemBattery, 
  relayState,
  setRelayState
}: SuppressionSimulatorProps) {
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [smoke, setSmoke] = useState(10);
  const [temperature, setTemperature] = useState(25);
  const [gas, setGas] = useState(15);
  const [flame, setFlame] = useState(0);

  // Simulation run state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<"IDLE" | "FUSION_ANALYSIS" | "ACOUSTIC_EMISSION" | "SUCCESS" | "ESCALATED">("IDLE");
  const [suppressedFrequency, setSuppressedFrequency] = useState(45);
  const [suppressedDb, setSuppressedDb] = useState(115);
  const [suppressedDuration, setSuppressedDuration] = useState(5.0);

  // Audio preview synthesizer state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const toggleAudioPreview = (targetFreq: number = 42) => {
    if (isPlayingAudio) {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (_) {}
      }
      setIsPlayingAudio(false);
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(targetFreq, ctx.currentTime);
        
        // Gentle low gain for safe audio listening
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        oscRef.current = osc;
        setIsPlayingAudio(true);
      } catch (err) {
        console.warn("Audio Context unavailable:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Computed Sensor Fusion Classification
  const [fusionResult, setFusionResult] = useState<{
    classification: EventClassification;
    reason: string;
    isFire: boolean;
  }>({ classification: "NORMAL", reason: "Environment nominal.", isFire: false });

  // Live Multi-sensor Fusion Decision Model
  useEffect(() => {
    // 1. Extreme Critical Thermal Runaway (Battery / Extreme fire)
    if (temperature >= 110 && smoke >= 75 && gas >= 500 && flame >= 7) {
      setFusionResult({
        classification: "ESCALATED",
        reason: "Extreme thermal runaway detected. Acoustic wave deployed but exceeds threshold. Automatic safety relay trip engaged to isolate grid.",
        isFire: true
      });
    }
    // 2. Genuine controllable fire
    else if ((temperature >= 60 || flame >= 4) && smoke >= 45) {
      setFusionResult({
        classification: "SUPPRESSED",
        reason: "Genuine localized combustion verified. Temperature & smoke indices confirm fire. Low-frequency acoustic sweep required.",
        isFire: true
      });
    }
    // 3. Potential False Alarm: Steam (high smoke-like density, but cold & no flame/gas)
    else if (smoke >= 40 && temperature < 45 && gas < 50 && flame <= 1) {
      setFusionResult({
        classification: "FALSE_ALARM",
        reason: "Steam signature recognized. Elevated particulate density with low thermal, gas, and optical flame readings. No sound waves deployed.",
        isFire: false
      });
    }
    // 4. Potential False Alarm: Dust
    else if (smoke >= 30 && temperature < 35 && gas < 30 && flame === 0) {
      setFusionResult({
        classification: "FALSE_ALARM",
        reason: "Suspended particulate burst (dust). Negative flame and normal thermal registers. Standing down sound drivers.",
        isFire: false
      });
    }
    // 5. Environmental Nominal
    else {
      setFusionResult({
        classification: "NORMAL",
        reason: "Sensors report ambient standard ranges. Continuous monitoring active.",
        isFire: false
      });
    }
  }, [smoke, temperature, gas, flame]);

  // Handle triggering simulation
  const handleStartSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    playSuppressionTriggerSound();

    // Sequence the simulation
    setSimulationStep("FUSION_ANALYSIS");

    // After 1.5s analysis, transition to suppression or immediate resolution
    setTimeout(() => {
      if (fusionResult.classification === "NORMAL" || fusionResult.classification === "FALSE_ALARM") {
        // Safe triggers resolve immediately
        generateAndSaveLog(fusionResult.classification);
        setSimulationStep(fusionResult.classification === "FALSE_ALARM" ? "SUCCESS" : "IDLE");
        setIsSimulating(false);
      } else {
        // Fire needs suppression
        // Calculate tailored acoustic frequency (typically 35-50Hz)
        // Heavier gas/smoke needs lower frequency to break molecular boundaries
        let freq = 45;
        let db = 115;
        let duration = 5.0;

        if (smoke > 75) {
          freq = 38; // Heavy particles need deeper sound waves (lower freq)
          db = 120;
          duration = 8.5;
        } else if (gas > 400) {
          freq = 40;
          db = 118;
          duration = 7.0;
        } else {
          freq = 48; // Light paper/wood localized fire
          db = 112;
          duration = 4.5;
        }

        setSuppressedFrequency(freq);
        setSuppressedDb(db);
        setSuppressedDuration(duration);
        setSimulationStep("ACOUSTIC_EMISSION");

        // Suppressing for 3.5 seconds visually
        setTimeout(() => {
          if (fusionResult.classification === "ESCALATED") {
            setSimulationStep("ESCALATED");
            setRelayState("TRIPPED");
            generateAndSaveLog("ESCALATED", freq, db, duration);
          } else {
            setSimulationStep("SUCCESS");
            generateAndSaveLog("SUPPRESSED", freq, db, duration);
          }
          
          // Stay on completion state for 3 seconds, then return to idle
          setTimeout(() => {
            setSimulationStep("IDLE");
            setIsSimulating(false);
          }, 3500);
        }, 4000);
      }
    }, 1500);
  };

  const generateAndSaveLog = (
    finalClass: EventClassification, 
    freq?: number, 
    db?: number, 
    duration?: number
  ) => {
    const timestampStr = new Date().toISOString();
    const uniqueId = `LOG-${Math.floor(1000 + Math.random() * 9000)}`;

    let noteText = "";
    if (finalClass === "NORMAL") {
      noteText = "Manual baseline diagnostics logged. Ambient environment healthy.";
    } else if (finalClass === "FALSE_ALARM") {
      noteText = `Diverted false alarm. Sensor fusion identified: ${fusionResult.reason}`;
    } else if (finalClass === "SUPPRESSED") {
      noteText = `Arc or small flame detected. System engaged low-frequency acoustic wave generator at ${freq}Hz (${db}dB) for ${duration}s. Sound wave pressure safely disrupted flame-ambient oxygen interface, suppressing fire in ${duration}s without residue. Relay safe.`;
    } else if (finalClass === "ESCALATED") {
      noteText = `Severe fire / thermal runaway detected at ${temperature}°C. Engaged acoustic driver at ${freq}Hz for maximum ${duration}s window. Flame intensity surpassed sound boundary. Tripped isolation relay automatically to prevent electrical feedback. Emergency sirens active.`;
    }

    const newLog: FireLog = {
      id: uniqueId,
      timestamp: timestampStr,
      location,
      fireOccurred: finalClass === "SUPPRESSED" || finalClass === "ESCALATED",
      sensorData: {
        smoke,
        temperature,
        combustibleGas: gas,
        opticalFlame: flame
      },
      classification: finalClass,
      falseAlarmReason: finalClass === "FALSE_ALARM" ? fusionResult.reason : undefined,
      acousticDetails: freq ? {
        frequency: freq,
        amplitudeDb: db || 115,
        durationSeconds: duration || 5.0,
        waveForm: freq < 42 ? "Square" : "Sweep"
      } : undefined,
      relayStatus: finalClass === "ESCALATED" ? "TRIPPED" : "NORMAL",
      batteryLevel: systemBattery,
      notes: noteText
    };

    onLogGenerated(newLog);
  };

  const presetNormal = () => {
    playPresetSound();
    setSmoke(12);
    setTemperature(24);
    setGas(15);
    setFlame(0);
  };

  const presetSteam = () => {
    playPresetSound();
    setSmoke(70);
    setTemperature(28);
    setGas(8);
    setFlame(0);
  };

  const presetAcousticFire = () => {
    playPresetSound();
    setSmoke(65);
    setTemperature(72);
    setGas(180);
    setFlame(6);
  };

  const presetBatteryRunaway = () => {
    playPresetSound();
    setSmoke(92);
    setTemperature(135);
    setGas(750);
    setFlame(9);
  };
  return (
    <div className="bg-gradient-to-br from-amber-50/95 via-amber-100/30 to-cyan-50/40 dark:bg-slate-900 border-2 border-amber-300/90 dark:border-amber-600/60 rounded-3xl shadow-lg shadow-cyan-500/10 overflow-hidden p-6 relative transition-colors">
      <div className="flex items-center justify-between mb-5 pb-5 border-b-2 border-amber-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-cyan-600 text-white rounded-xl shadow-md shadow-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-md font-sans font-bold text-slate-900 dark:text-slate-100 leading-tight">IoT Suppression Device Simulator</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Trigger simulated environment scenarios to log responses</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-slate-850 border border-amber-300 dark:border-slate-750 font-mono text-2xs text-amber-900 dark:text-cyan-300 font-bold shadow-sm">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
          DEVICE_STATION_ACTIVE
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="mb-6 bg-amber-100/60 dark:bg-slate-950/60 p-4 border-2 border-amber-300/80 dark:border-slate-800 rounded-2xl transition-colors">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-2xs font-mono text-slate-700 dark:text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Preset Fire Scenarios:
          </span>
          <span className="text-3xs font-mono text-slate-500 dark:text-slate-500 font-semibold">Click to instantly populate sensors</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            id="preset-normal"
            disabled={isSimulating}
            onClick={presetNormal}
            className="px-3.5 py-2.5 text-2xs font-mono rounded-xl bg-amber-50/90 dark:bg-slate-850 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 hover:text-emerald-900 dark:hover:text-emerald-300 border-2 border-amber-300/80 dark:border-slate-750 hover:border-emerald-400 disabled:opacity-50 transition-all text-left cursor-pointer font-bold shadow-xs flex items-center gap-2 group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform shrink-0" />
            <span className="truncate">Ambient Normal</span>
          </button>
          <button
            id="preset-steam"
            disabled={isSimulating}
            onClick={presetSteam}
            className="px-3.5 py-2.5 text-2xs font-mono rounded-xl bg-amber-50/90 dark:bg-slate-850 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 hover:text-purple-900 dark:hover:text-purple-300 border-2 border-amber-300/80 dark:border-slate-750 hover:border-purple-400 disabled:opacity-50 transition-all text-left cursor-pointer font-bold shadow-xs flex items-center gap-2 group"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 group-hover:scale-125 transition-transform shrink-0" />
            <span className="truncate">Dishwasher Steam</span>
          </button>
          <button
            id="preset-suppress"
            disabled={isSimulating}
            onClick={presetAcousticFire}
            className="px-3.5 py-2.5 text-2xs font-mono rounded-xl bg-amber-50/90 dark:bg-slate-850 hover:bg-cyan-50/80 dark:hover:bg-cyan-950/40 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-300 border-2 border-amber-300/80 dark:border-slate-750 hover:border-cyan-400 disabled:opacity-50 transition-all text-left cursor-pointer font-bold shadow-xs flex items-center gap-2 group"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500 group-hover:scale-125 transition-transform shrink-0" />
            <span className="truncate">Small Arc Fire</span>
          </button>
          <button
            id="preset-runaway"
            disabled={isSimulating}
            onClick={presetBatteryRunaway}
            className="px-3.5 py-2.5 text-2xs font-mono rounded-xl bg-amber-50/90 dark:bg-slate-850 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 text-slate-800 dark:text-slate-200 hover:text-rose-900 dark:hover:text-rose-300 border-2 border-amber-300/80 dark:border-slate-750 hover:border-rose-400 disabled:opacity-50 transition-all text-left cursor-pointer font-bold shadow-xs flex items-center gap-2 group"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 group-hover:scale-125 transition-transform shrink-0" />
            <span className="truncate">Battery Runaway</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <label className="text-2xs font-mono text-slate-700 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-extrabold">Target Physical Zone:</label>
            <select
              id="simulator-location"
              disabled={isSimulating}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-amber-50/90 dark:bg-slate-850 border-2 border-amber-300 dark:border-slate-750 rounded-xl px-3 py-2.5 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-50 transition cursor-pointer font-bold shadow-xs"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-950/60 p-5 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-5 transition-colors">
            <h3 className="text-2xs font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Sliders className="w-3.5 h-3.5 text-cyan-500" /> Sensor Controls
            </h3>

            {/* Temperature Sensor */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-900 dark:text-slate-100 font-sans font-bold">Temperature (°C)</span>
                <span className={`font-mono font-black ${temperature >= 90 ? 'text-rose-600 dark:text-rose-400' : temperature >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {temperature}°C
                </span>
              </div>
              <input
                id="sensor-temp"
                type="range"
                min="15"
                max="160"
                disabled={isSimulating}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-3xs font-mono text-slate-600 dark:text-slate-400 mt-1 font-bold">
                <span>15°C (Ambient)</span>
                <span>65°C (Warning)</span>
                <span>160°C (Critical)</span>
              </div>
            </div>

            {/* Smoke Sensor */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-900 dark:text-slate-100 font-sans font-bold">Smoke Obstruction (%)</span>
                <span className={`font-mono font-black ${smoke >= 60 ? 'text-rose-600 dark:text-rose-400' : smoke >= 30 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {smoke}%
                </span>
              </div>
              <input
                id="sensor-smoke"
                type="range"
                min="0"
                max="100"
                disabled={isSimulating}
                value={smoke}
                onChange={(e) => setSmoke(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-3xs font-mono text-slate-600 dark:text-slate-400 mt-1 font-bold">
                <span>0% (Clean)</span>
                <span>40% (Steam/Dust)</span>
                <span>100% (Thick Fire)</span>
              </div>
            </div>

            {/* Gas Sensor */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-900 dark:text-slate-100 font-sans font-bold">Combustible Gas (ppm)</span>
                <span className={`font-mono font-black ${gas >= 400 ? 'text-rose-600 dark:text-rose-400' : gas >= 100 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {gas} ppm
                </span>
              </div>
              <input
                id="sensor-gas"
                type="range"
                min="0"
                max="1000"
                disabled={isSimulating}
                value={gas}
                onChange={(e) => setGas(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-3xs font-mono text-slate-600 dark:text-slate-400 mt-1 font-bold">
                <span>0 ppm</span>
                <span>250 ppm</span>
                <span>1000 ppm</span>
              </div>
            </div>

            {/* Optical Flame Sensor */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-900 dark:text-slate-100 font-sans font-bold">Optical Flame Intensity</span>
                <span className={`font-mono font-black ${flame >= 6 ? 'text-rose-600 dark:text-rose-400' : flame >= 2 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {flame} / 10
                </span>
              </div>
              <input
                id="sensor-flame"
                type="range"
                min="0"
                max="10"
                disabled={isSimulating}
                value={flame}
                onChange={(e) => setFlame(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-3xs font-mono text-slate-600 dark:text-slate-400 mt-1 font-bold">
                <span>0 (None)</span>
                <span>4 (Visible Spark)</span>
                <span>10 (Intense Fire)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fusion Decision & Suppressor Animation Frame */}
        <div className="lg:col-span-5 h-full flex flex-col justify-between">
          {/* Decision Box */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex-grow flex flex-col justify-between transition-colors">
            <div>
              <span className="text-2xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">FUSION DECISION MODEL</span>
              
              <div className="flex items-center gap-2 mb-3">
                {fusionResult.classification === "NORMAL" && (
                  <span className="px-2.5 py-1 rounded-lg text-3xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-3xs">
                    🟢 SYSTEM STANDBY
                  </span>
                )}
                {fusionResult.classification === "FALSE_ALARM" && (
                  <span className="px-2.5 py-1 rounded-lg text-3xs font-mono font-bold bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 shadow-3xs">
                    🔍 STEAM/DUST DETECTED
                  </span>
                )}
                {fusionResult.classification === "SUPPRESSED" && (
                  <span className="px-2.5 py-1 rounded-lg text-3xs font-mono font-bold bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 animate-pulse shadow-3xs">
                    🔥 FIRE VERIFIED
                  </span>
                )}
                {fusionResult.classification === "ESCALATED" && (
                  <span className="px-2.5 py-1 rounded-lg text-3xs font-mono font-bold bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse shadow-3xs">
                    🚨 ESCALATION CRITICAL
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed mb-4 font-medium">
                {fusionResult.reason}
              </p>
            </div>

            {/* Diagnostic Indicators */}
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3.5 mb-4">
              <div className="text-left">
                <span className="text-3xs font-mono text-slate-400 block uppercase font-bold">ACOUSTIC DRIVERS</span>
                <span className={`text-2xs font-mono font-bold ${fusionResult.isFire ? "text-rose-600" : "text-slate-500"}`}>
                  {fusionResult.isFire ? "ARMED (LOW-FREQ)" : "STANDBY"}
                </span>
              </div>
              <div className="text-left">
                <span className="text-3xs font-mono text-slate-400 block uppercase font-bold">GRID SAFETY RELAY</span>
                <span className={`text-2xs font-mono font-bold ${fusionResult.classification === "ESCALATED" ? "text-rose-600" : "text-emerald-600"}`}>
                  {fusionResult.classification === "ESCALATED" ? "WILL TRIP" : "ONLINE (NORMAL)"}
                </span>
              </div>
            </div>

            {/* Suppression Wave Visualizer during active simulation - kept sleek dark for hardware screen contrast */}
            <div className="relative h-28 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-3 mb-4 shadow-inner">
              <AnimatePresence mode="wait">
                {simulationStep === "IDLE" && (
                  <motion.div
                    key="idle-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <Volume2 className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                    <span className="text-2xs font-mono text-slate-500">Press Trigger below to deploy</span>
                  </motion.div>
                )}

                {simulationStep === "FUSION_ANALYSIS" && (
                  <motion.div
                    key="analysis-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-2xs font-mono text-slate-300">FUSING MULTI-SENSOR INPUTS...</span>
                  </motion.div>
                )}

                {simulationStep === "ACOUSTIC_EMISSION" && (
                  <motion.div
                    key="emission-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-between"
                  >
                    {/* Vibrating Speaker Icon on Left */}
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ repeat: Infinity, duration: 0.12 }}
                      className="text-slate-300 relative z-10"
                    >
                      <Volume2 className="w-10 h-10 text-rose-500" />
                    </motion.div>

                    {/* Acoustic wave pulses propagating to the right */}
                    <div className="flex-1 flex justify-around items-center px-4 overflow-hidden relative h-full">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scaleY: 0.2, opacity: 0, x: -20 }}
                          animate={{ 
                            scaleY: [0.3, 1.3, 0.3], 
                            opacity: [0, 0.9, 0],
                            x: [0, 100, 120] 
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 1.4, 
                            delay: i * 0.25, 
                            ease: "linear" 
                          }}
                          className="w-1 bg-gradient-to-b from-rose-500 via-amber-400 to-rose-500 h-16 rounded-full"
                        />
                      ))}
                    </div>

                    {/* Extinguishing Flame Icon on Right */}
                    <div className="relative z-10">
                      <motion.div
                        animate={{ 
                          scale: [1, 0.7, 0.4, 0],
                          opacity: [1, 0.7, 0.4, 0],
                          y: [0, 2, 4, 6]
                        }}
                        transition={{ duration: 4 }}
                        className="text-rose-500"
                      >
                        <Flame className="w-10 h-10 text-rose-500 animate-pulse fill-rose-500" />
                      </motion.div>
                    </div>

                    {/* Overlay specs */}
                    <div className="absolute bottom-1 left-2 font-mono text-4xs text-slate-400">
                      WAVE: {suppressedFrequency}Hz @ {suppressedDb}dB
                    </div>
                  </motion.div>
                )}

                {simulationStep === "SUCCESS" && (
                  <motion.div
                    key="success-view"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-1">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-2xs font-mono text-emerald-400 uppercase font-bold block">FLAME EXTINGUISHED</span>
                    <span className="text-4xs font-mono text-slate-400">Acoustic Suppressor resolved incident successfully. Logged!</span>
                  </motion.div>
                )}

                {simulationStep === "ESCALATED" && (
                  <motion.div
                    key="escalated-view"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500 text-rose-500 flex items-center justify-center mx-auto mb-1 animate-pulse">
                      <Zap className="w-5 h-5 fill-rose-500" />
                    </div>
                    <span className="text-2xs font-mono text-rose-400 uppercase font-bold block">RELAY TRIPPED / ISOLATED</span>
                    <span className="text-4xs font-mono text-slate-400">Suppression bounds breached. Isolated power and registered alarm.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Acoustic Wave Audio Synthesizer Control */}
            <div className="flex items-center justify-between gap-2 mb-3.5 bg-slate-950 border border-slate-800 p-2.5 rounded-2xl text-slate-200 shadow-inner">
              <div className="flex items-center gap-2 pl-1">
                <span className={`w-2 h-2 rounded-full ${isPlayingAudio ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                <div>
                  <span className="text-3xs font-mono font-bold text-slate-300 block leading-tight">ACOUSTIC SYNTHESIZER</span>
                  <span className="text-4xs font-mono text-slate-500 block">Low-frequency sine generator</span>
                </div>
              </div>
              <button
                type="button"
                id="test-audio-tone-btn"
                onClick={() => toggleAudioPreview(suppressedFrequency || 42)}
                className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isPlayingAudio
                  ? "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs animate-pulse"
                  : "bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750"
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" /> Stop Wave Tone
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Hear {suppressedFrequency || 42}Hz Wave Tone
                  </>
                )}
              </button>
            </div>

            {/* Action Trigger Button */}
            <button
              id="trigger-simulation"
              disabled={isSimulating}
              onClick={handleStartSimulation}
              className={`w-full font-sans font-bold text-xs py-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition ${
                isSimulating 
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                : fusionResult.isFire
                ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md hover:shadow-lg hover:shadow-rose-500/20 shadow-rose-600/10"
                : fusionResult.classification === "FALSE_ALARM"
                ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-sm hover:shadow-md"
                : "bg-slate-900 hover:bg-slate-800 text-white border-slate-800 shadow-sm"
              }`}
            >
              {isSimulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Suppressing via low-frequency waves...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {fusionResult.isFire 
                    ? `Trigger Acoustic suppression (${suppressedFrequency}Hz)` 
                    : fusionResult.classification === "FALSE_ALARM"
                    ? "Validate False-Alarm Prevention Logging"
                    : "Register Ambient baseline log"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
