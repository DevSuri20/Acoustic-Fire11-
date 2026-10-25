/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  Database, 
  Settings, 
  HelpCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Cpu,
  Info,
  ShieldCheck,
  BatteryCharging,
  Zap,
  Volume2,
  Sun,
  Moon,
  Trash2,
  CheckCircle2,
  X,
  Activity,
  Sliders
} from "lucide-react";

import { FireLog } from "./types";
import { initialLogs } from "./initialLogs";
import DashboardStats from "./components/DashboardStats";
import SuppressionSimulator from "./components/SuppressionSimulator";
import FireLogTable from "./components/FireLogTable";
import LogDetailModal from "./components/LogDetailModal";
import HardwareDeploymentGuide from "./components/HardwareDeploymentGuide";

import { playClickSound, playToggleSound } from "./utils/soundEffects";

export default function App() {
  // Theme state: dark mode vs light mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("acoustic_theme") === "dark";
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("acoustic_theme", next ? "dark" : "light");
      playToggleSound(next);
      return next;
    });
  };

  // Hardware guide modal state
  const [showHardwareGuide, setShowHardwareGuide] = useState(false);

  // Load initial logs from localStorage or fallback
  const [logs, setLogs] = useState<FireLog[]>(() => {
    const saved = localStorage.getItem("acoustic_fire_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved logs", e);
      }
    }
    return initialLogs;
  });

  const [selectedLog, setSelectedLog] = useState<FireLog | null>(null);
  const [systemBattery, setSystemBattery] = useState(100);
  const [relayState, setRelayState] = useState<"NORMAL" | "TRIPPED">("NORMAL");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Custom modal and toast states for reset action
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetToast, setShowResetToast] = useState(false);

  // Active view tab navigation ("DASHBOARD" | "SIMULATOR" | "LOGS")
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "SIMULATOR" | "LOGS">("DASHBOARD");

  // Save logs to localStorage on changes
  useEffect(() => {
    localStorage.setItem("acoustic_fire_logs", JSON.stringify(logs));
  }, [logs]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle new log generation from the simulator
  const handleLogGenerated = (newLog: FireLog) => {
    setLogs((prev) => [newLog, ...prev]);
    
    // Slightly degrade battery during active suppression to represent physical discharge, then recharge
    if (newLog.fireOccurred) {
      setSystemBattery((prev) => Math.max(prev - 4, 10));
    }
  };

  // Recharge battery slowly back to 100%
  useEffect(() => {
    if (systemBattery < 100) {
      const interval = setInterval(() => {
        setSystemBattery((prev) => Math.min(prev + 1, 100));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [systemBattery]);

  // Trigger reset confirmation modal
  const handleResetLogs = () => {
    playClickSound();
    setShowResetModal(true);
  };

  // Confirm and execute reset to factory defaults
  const confirmResetLogs = () => {
    playClickSound();
    setLogs(initialLogs);
    setRelayState("NORMAL");
    setSystemBattery(100);
    localStorage.removeItem("acoustic_fire_logs");
    setShowResetModal(false);

    // Show temporary success toast
    setShowResetToast(true);
    setTimeout(() => {
      setShowResetToast(false);
    }, 4000);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-rose-50/70 text-slate-900"} font-sans selection:bg-rose-600 selection:text-white pb-16 relative overflow-hidden transition-colors duration-300`}>
      {/* High-visibility Red / Fire background grid lines covering the entire page */}
      <div className={`fixed inset-0 z-0 pointer-events-none ${
        isDarkMode 
        ? "bg-[linear-gradient(to_right,rgba(225,29,72,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(225,29,72,0.18)_1px,transparent_1px)]" 
        : "bg-[linear-gradient(to_right,rgba(225,29,72,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(225,29,72,0.14)_1px,transparent_1px)]"
      } bg-[size:3rem_3rem]`} />

      {/* Ambient Red / Fire Radial Spotlight */}
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] ${isDarkMode ? 'bg-rose-600/20' : 'bg-rose-500/15'} blur-3xl pointer-events-none rounded-full z-0`} />

      {/* Primary Header - Dark toolbar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b-2 border-rose-900/60 px-4 sm:px-6 lg:px-8 py-4 shadow-xl shadow-rose-950/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-rose-600/20 border-2 border-rose-500/50 text-rose-500 rounded-xl shadow-inner animate-pulse">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 border border-slate-950">
                <Volume2 className="w-2.5 h-2.5" />
              </div>
            </div>
            <div>
              <h1 className="text-sm sm:text-md font-sans font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Acoustic Fire Suppression Log & Monitor
              </h1>
              <p className="text-3xs font-mono text-slate-400 font-bold">
                STATION_NODE: 9192-FS • MULTI-SENSOR FUSION LOGGING SYSTEM
              </p>
            </div>
          </div>

          {/* Clock & Status Panel */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Live Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-3xs text-slate-200 font-bold">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
              </span>
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-600/50 font-mono text-3xs text-rose-300 font-extrabold">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping" />
              <span>STATION SECURE ONLINE</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Tactical Dark Mode"}
              className="p-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 cursor-pointer transition flex items-center gap-1.5 text-3xs font-mono font-bold shadow-2xs"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">LIGHT MODE</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline">DARK MODE</span>
                </>
              )}
            </button>

            {/* ESP8266 Firmware Guide Button */}
            <button
              id="esp8266-firmware-btn"
              onClick={() => {
                playClickSound();
                setShowHardwareGuide(true);
              }}
              title="Open ESP8266 C++ Arduino Code & Wiring Guide"
              className="p-2 px-3 rounded-xl bg-rose-950/90 hover:bg-rose-900 text-rose-200 hover:text-white border-2 border-rose-700/80 cursor-pointer transition flex items-center gap-1.5 text-3xs font-mono font-black shadow-md shadow-rose-950/40"
            >
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              <span>ESP8266 FIRMWARE</span>
            </button>

            {/* Reset Logs Action */}
            <button
              id="reset-logs-btn"
              onClick={handleResetLogs}
              title="Reset Database to defaults"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition flex items-center gap-1 text-3xs font-mono font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              RESET
            </button>
          </div>

        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">
        
        {/* Core Description Welcome Banner - Golden Tint Box with Aqua Blue Accents */}
        <div className="bg-gradient-to-br from-amber-50 via-amber-100/50 to-cyan-50/80 dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-600/60 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg shadow-cyan-500/10 relative overflow-hidden transition-colors">
          {/* Subtle decorative background glow */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start sm:items-center gap-3.5 relative z-10">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-cyan-600 text-white shadow-md shadow-cyan-600/30 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-4xs font-mono font-black bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 uppercase tracking-wider">
                  <Flame className="w-2.5 h-2.5 text-amber-600 fill-current" /> Acoustic Suppression Tech
                </span>
              </div>
              <h2 className="text-base font-sans font-black text-slate-900 dark:text-white tracking-tight">
                Next-Gen Fire Extinguishment via Sound Waves
              </h2>
              <p className="text-2xs text-slate-800 dark:text-slate-200 leading-relaxed max-w-3xl mt-0.5 font-semibold">
                Instantly disrupt flame boundaries using low-frequency acoustic pressure (<strong className="text-cyan-800 dark:text-cyan-300 font-extrabold">80Hz–140Hz for this particular setup</strong>) — starving fire of oxygen with <strong className="text-slate-950 dark:text-white font-extrabold">zero chemical residue or water damage</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 relative z-10 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200 dark:border-slate-800 w-full md:w-auto justify-between md:justify-end">
            <div className="text-left md:text-right">
              <span className="text-4xs font-mono text-slate-600 dark:text-slate-400 uppercase block font-extrabold tracking-wider">BACKUP BATTERY</span>
              <span className="text-xs font-mono text-slate-900 dark:text-slate-100 font-black flex items-center gap-1.5 md:justify-end mt-0.5">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                {systemBattery}% {systemBattery < 100 && "(Charging)"}
              </span>
            </div>
            <div className="text-right border-l-2 border-amber-300 dark:border-slate-700 pl-4">
              <span className="text-4xs font-mono text-slate-600 dark:text-slate-400 uppercase block font-extrabold tracking-wider">GRID RELAY</span>
              <span className={`text-xs font-mono font-black flex items-center gap-1 justify-end mt-0.5 ${relayState === "NORMAL" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${relayState === "NORMAL" ? "bg-emerald-500" : "bg-rose-500 animate-ping"}`} />
                {relayState === "NORMAL" ? "NORMAL" : "TRIPPED"}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace View Tabs Selector */}
        <div className="flex items-center gap-2 border-b-2 border-amber-300 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
          <button
            id="tab-dashboard-btn"
            onClick={() => {
              playClickSound();
              setActiveTab("DASHBOARD");
            }}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-mono font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm ${
              activeTab === "DASHBOARD"
                ? "bg-gradient-to-r from-amber-500 to-cyan-600 text-white shadow-md shadow-cyan-500/25 border-2 border-cyan-300"
                : "bg-amber-50/80 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300 border-2 border-amber-300 dark:border-slate-700 hover:border-cyan-400"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>1. System Overview</span>
          </button>

          <button
            id="tab-simulator-btn"
            onClick={() => {
              playClickSound();
              setActiveTab("SIMULATOR");
            }}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-mono font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm ${
              activeTab === "SIMULATOR"
                ? "bg-gradient-to-r from-amber-500 to-cyan-600 text-white shadow-md shadow-cyan-500/25 border-2 border-cyan-300"
                : "bg-amber-50/80 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300 border-2 border-amber-300 dark:border-slate-700 hover:border-cyan-400"
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>2. IoT Acoustic Suppressor</span>
            <span className="px-1.5 py-0.5 rounded-full text-4xs bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-extrabold">Interactive</span>
          </button>

          <button
            id="tab-logs-btn"
            onClick={() => {
              playClickSound();
              setActiveTab("LOGS");
            }}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-mono font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm ${
              activeTab === "LOGS"
                ? "bg-gradient-to-r from-amber-500 to-cyan-600 text-white shadow-md shadow-cyan-500/25 border-2 border-cyan-300"
                : "bg-amber-50/80 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300 border-2 border-amber-300 dark:border-slate-700 hover:border-cyan-400"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. Incident & Event Logs</span>
            <span className="px-1.5 py-0.5 rounded-full text-4xs bg-amber-100 dark:bg-slate-800 text-amber-900 dark:text-slate-300 font-bold border border-amber-300 dark:border-slate-700">{logs.length}</span>
          </button>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === "DASHBOARD" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Metric Counters */}
            <DashboardStats 
              logs={logs} 
              batteryLevel={systemBattery} 
              relayState={relayState} 
            />

            {/* Quick Action Banner to Test Simulator */}
            <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-800 p-6 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-rose-950/20 relative overflow-hidden">
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="p-3 bg-rose-500/20 border-2 border-rose-500/40 text-rose-300 rounded-2xl shrink-0">
                  <Zap className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-sans font-black text-white">
                    Test Live Acoustic Extinguishment
                  </h3>
                  <p className="text-2xs text-slate-200 font-sans mt-0.5 font-semibold">
                    Simulate real-time fire scenarios, adjust smoke/thermal sensors, and test low-frequency sound disruption.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab("SIMULATOR");
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-black bg-rose-600 hover:bg-rose-500 text-white border-2 border-rose-400 cursor-pointer shadow-lg shadow-rose-600/40 transition flex items-center gap-2 shrink-0 relative z-10"
              >
                <span>OPEN IoT SIMULATOR</span>
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Troubleshooting & Diagnostic section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Engineering Specifications Card */}
              <div className="bg-gradient-to-br from-amber-50/95 via-amber-100/30 to-cyan-50/40 dark:bg-slate-900 border-2 border-amber-300/90 dark:border-amber-600/60 p-6 rounded-3xl shadow-md shadow-cyan-500/10 hover:border-cyan-400 transition-all">
                <h3 className="text-xs font-sans font-black text-slate-900 dark:text-white mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Acoustic Suppression Parameters
                </h3>
                <div className="space-y-3 font-mono text-2xs text-slate-700 dark:text-slate-300 font-bold">
                  <div className="flex justify-between py-2 border-b border-amber-200 dark:border-slate-800">
                    <span>Optimized Wave Range</span>
                    <span className="text-cyan-700 dark:text-cyan-300 font-extrabold">80 Hz - 140 Hz</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-amber-200 dark:border-slate-800">
                    <span>Minimum Decibel Level</span>
                    <span className="text-slate-900 dark:text-white font-black">112 dB SPL</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-amber-200 dark:border-slate-800">
                    <span>Combustion Shear Force</span>
                    <span className="text-slate-900 dark:text-white font-black">6.8 N/m²</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-amber-200 dark:border-slate-800">
                    <span>Disruption Window Max</span>
                    <span className="text-slate-900 dark:text-white font-black">15 seconds</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Automatic Gas Isolation Relay</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Fail-Safe Active</span>
                  </div>
                </div>
              </div>

              {/* Fusion Classification Logic Card */}
              <div className="bg-gradient-to-br from-amber-50/95 via-amber-100/30 to-cyan-50/40 dark:bg-slate-900 border-2 border-amber-300/90 dark:border-amber-600/60 p-6 rounded-3xl shadow-md shadow-cyan-500/10 hover:border-cyan-400 transition-all">
                <h3 className="text-xs font-sans font-black text-slate-900 dark:text-white mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Fusion Classification Logic
                </h3>
                <div className="space-y-2 font-sans text-2xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  <p>
                    To avoid acoustic alerts during cooking steam, compressed-air dusting, or transient water vapor, our device uses an ABAC-like multi-sensor fusion logic gate:
                  </p>
                  <ul className="list-disc pl-4 space-y-2 mt-2 font-mono text-3xs text-slate-800 dark:text-slate-200">
                    <li>
                      <span className="text-purple-700 dark:text-purple-400 font-black">False Alarm:</span> High smoke %, but ambient thermal index & gas ppm remain steady (no optical flame). No sound.
                    </li>
                    <li>
                      <span className="text-cyan-700 dark:text-cyan-300 font-black">Acoustic suppression:</span> High smoke + thermal rise (&gt;60°C) + flame. Deploys tuned 80-140Hz sound waves.
                    </li>
                    <li>
                      <span className="text-rose-700 dark:text-rose-400 font-black">Grid Relay Trip:</span> Extreme thermal state (&gt;110°C). Deploys sound waves, cuts regional electrical relay grid immediately.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Self-Diagnostic Reports Card */}
              <div className="bg-gradient-to-br from-amber-50/95 via-amber-100/30 to-cyan-50/40 dark:bg-slate-900 border-2 border-amber-300/90 dark:border-amber-600/60 p-6 rounded-3xl shadow-md shadow-cyan-500/10 hover:border-cyan-400 transition-all">
                <h3 className="text-xs font-sans font-black text-slate-900 dark:text-white mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Built-In Self-Diagnostics
                </h3>
                <div className="space-y-3 font-mono text-2xs text-slate-700 dark:text-slate-300 font-bold">
                  <div className="flex items-center justify-between py-1 border-b border-amber-200 dark:border-slate-800">
                    <span>Speaker Driver Impedance</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">4.2 Ω (OK)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-amber-200 dark:border-slate-800">
                    <span>Optical Flame Poller Sensor</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">100% (OK)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-amber-200 dark:border-slate-800">
                    <span>Gas Calibration (CO/H2)</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">Calibrated</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-amber-200 dark:border-slate-800">
                    <span>Solid State Backup Battery Charge</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">Healthy (Stable)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Grid Isolator Relay Resistance</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">0.05 mΩ (OK)</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: INTERACTIVE IOT SIMULATOR */}
        {activeTab === "SIMULATOR" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SuppressionSimulator 
              onLogGenerated={handleLogGenerated}
              systemBattery={systemBattery}
              relayState={relayState}
              setRelayState={setRelayState}
            />
          </motion.div>
        )}

        {/* TAB 3: INCIDENT LOGS TABLE */}
        {activeTab === "LOGS" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <FireLogTable 
              logs={logs} 
              onSelectLog={(log) => setSelectedLog(log)} 
            />
          </motion.div>
        )}

      </main>

      {/* Forensic Audit Detail Modal */}
      {selectedLog && (
        <LogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}

      {/* In-App Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-sans font-extrabold text-slate-900 dark:text-slate-100">
                    Reset Log Database?
                  </h3>
                  <p className="text-3xs font-mono text-slate-400">
                    STATION_NODE: RESTORE FACTORY DEFAULTS
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <p className="font-semibold text-slate-800 dark:text-slate-200">This action will perform the following:</p>
                <ul className="list-disc pl-4 space-y-1 text-2xs font-mono text-slate-600 dark:text-slate-400">
                  <li>Clear all custom simulated fire logs created in this session</li>
                  <li>Restore original baseline incident records</li>
                  <li>Reset backup battery level back to 100% capacity</li>
                  <li>Restore regional safety relay grid status to NORMAL</li>
                  <li>Flush browser local cache storage</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmResetLogs}
                  className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500 cursor-pointer shadow-md transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  CONFIRM RESET
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification Toast */}
      <AnimatePresence>
        {showResetToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-300 flex items-center gap-3 font-mono text-xs font-bold"
          >
            <CheckCircle2 className="w-5 h-5 text-cyan-400 dark:text-cyan-600 shrink-0" />
            <span>Database & System Status Restored to Factory Defaults</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hardware Deployment Code Modal */}
      <HardwareDeploymentGuide 
        isOpen={showHardwareGuide} 
        onClose={() => setShowHardwareGuide(false)} 
      />
    </div>
  );
}

