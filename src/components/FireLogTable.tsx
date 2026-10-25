/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Search, Filter, ShieldCheck, ShieldX, CheckCircle, ShieldAlert, Thermometer, Wind, AlertTriangle, Eye, ArrowUpDown } from "lucide-react";
import { FireLog, EventClassification } from "../types";
import { playClickSound } from "../utils/soundEffects";

interface FireLogTableProps {
  logs: FireLog[];
  onSelectLog: (log: FireLog) => void;
}

type SortField = "timestamp" | "temperature" | "smoke" | "id";
type SortOrder = "asc" | "desc";

export default function FireLogTable({ logs, onSelectLog }: FireLogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Get unique locations for dropdown filter
  const locations = Array.from(new Set(logs.map((log) => log.location)));

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.falseAlarmReason && log.falseAlarmReason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClass = classFilter === "ALL" || log.classification === classFilter;
    const matchesLocation = locationFilter === "ALL" || log.location === locationFilter;

    return matchesSearch && matchesClass && matchesLocation;
  });

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let valueA: any = a[sortField];
    let valueB: any = b[sortField];

    // Handle nested sensor fields
    if (sortField === "temperature") {
      valueA = a.sensorData.temperature;
      valueB = b.sensorData.temperature;
    } else if (sortField === "smoke") {
      valueA = a.sensorData.smoke;
      valueB = b.sensorData.smoke;
    }

    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/95 via-amber-100/30 to-cyan-50/40 dark:bg-slate-900 border-2 border-amber-300/90 dark:border-amber-600/60 rounded-3xl shadow-lg shadow-cyan-500/10 overflow-hidden transition-colors">
      {/* Search & Filter Header */}
      <div className="p-5 sm:p-6 border-b-2 border-amber-200 dark:border-slate-800 bg-amber-100/50 dark:bg-slate-950/60 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h2 className="text-md font-sans font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" /> System Activity & Suppression Logs
          </h2>
          <span className="text-2xs font-mono text-slate-800 dark:text-slate-200 font-bold bg-amber-50 dark:bg-slate-850 px-3 py-1 rounded-xl border border-amber-300 dark:border-slate-700 shadow-xs">
            Showing {sortedLogs.length} of {logs.length} logged incidents
          </span>
        </div>

        {/* Quick Filter Pill Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            type="button"
            id="pill-filter-all"
            onClick={() => {
              playClickSound();
              setClassFilter("ALL");
            }}
            className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-extrabold shrink-0 cursor-pointer transition border ${
              classFilter === "ALL"
              ? "bg-gradient-to-r from-amber-500 to-cyan-600 text-white border-cyan-400 shadow-xs"
              : "bg-amber-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 border-amber-300 dark:border-slate-700 hover:border-cyan-400"
            }`}
          >
            ALL INCIDENTS ({logs.length})
          </button>
          <button
            type="button"
            id="pill-filter-suppressed"
            onClick={() => {
              playClickSound();
              setClassFilter("SUPPRESSED");
            }}
            className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-extrabold shrink-0 cursor-pointer transition border ${
              classFilter === "SUPPRESSED"
              ? "bg-cyan-600 text-white border-cyan-400 shadow-xs"
              : "bg-amber-50 dark:bg-slate-850 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/60"
            }`}
          >
            🔥 ACOUSTICALLY EXTINGUISHED ({logs.filter(l => l.classification === 'SUPPRESSED').length})
          </button>
          <button
            type="button"
            id="pill-filter-false-alarm"
            onClick={() => {
              playClickSound();
              setClassFilter("FALSE_ALARM");
            }}
            className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-extrabold shrink-0 cursor-pointer transition border ${
              classFilter === "FALSE_ALARM"
              ? "bg-purple-600 text-white border-purple-600 shadow-xs"
              : "bg-amber-50 dark:bg-slate-850 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/60"
            }`}
          >
            🔍 STEAM / FALSE ALARMS ({logs.filter(l => l.classification === 'FALSE_ALARM').length})
          </button>
          <button
            type="button"
            id="pill-filter-escalated"
            onClick={() => {
              playClickSound();
              setClassFilter("ESCALATED");
            }}
            className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-extrabold shrink-0 cursor-pointer transition border ${
              classFilter === "ESCALATED"
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-amber-50 dark:bg-slate-850 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/60"
            }`}
          >
            🚨 ESCALATED TRIPS ({logs.filter(l => l.classification === 'ESCALATED').length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Search logs, zones, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-amber-50/90 dark:bg-slate-850 border-2 border-amber-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-cyan-400 placeholder-slate-500 dark:placeholder-slate-400 shadow-xs transition"
            />
          </div>

          {/* Classification Filter */}
          <div>
            <select
              id="class-filter"
              value={classFilter}
              onChange={(e) => {
                playClickSound();
                setClassFilter(e.target.value);
              }}
              className="w-full bg-amber-50/90 dark:bg-slate-850 border-2 border-amber-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-cyan-400 cursor-pointer shadow-xs transition"
            >
              <option value="ALL">All Event Types</option>
              <option value="SUPPRESSED">Suppressed Acoustically</option>
              <option value="FALSE_ALARM">False Alarms Avoided</option>
              <option value="ESCALATED">Escalated Thermal Trips</option>
              <option value="NORMAL">Diagnostics & Ambient Logs</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={(e) => {
                playClickSound();
                setLocationFilter(e.target.value);
              }}
              className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-rose-500 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap shadow-xs transition"
            >
              <option value="ALL">All Physical Zones</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Field */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="sort-by-time"
              onClick={() => toggleSort("timestamp")}
              className={`px-3 py-2 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition shadow-xs ${
                sortField === "timestamp"
                  ? "bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  : "bg-white dark:bg-slate-850 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Date {sortField === "timestamp" && (sortOrder === "desc" ? "▼" : "▲")}
            </button>
            <button
              id="sort-by-temp"
              onClick={() => toggleSort("temperature")}
              className={`px-3 py-2 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition shadow-xs ${
                sortField === "temperature"
                  ? "bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  : "bg-white dark:bg-slate-850 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Temp {sortField === "temperature" && (sortOrder === "desc" ? "▼" : "▲")}
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 text-2xs font-mono text-slate-800 dark:text-slate-200 uppercase tracking-wider font-extrabold">
              <th className="py-3.5 px-4">Event ID</th>
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Physical Zone / Location</th>
              <th className="py-3.5 px-4 text-center">Status / Classification</th>
              <th className="py-3.5 px-4">Sensors (Max)</th>
              <th className="py-3.5 px-4">Acoustic Driver Response</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                  No fire suppression logs match the selected search criteria or filters.
                </td>
              </tr>
            ) : (
              sortedLogs.map((log) => {
                // Determine classification styling
                let badgeClass = "";
                let statusIcon = null;
                let statusLabel = "";

                switch (log.classification) {
                  case "NORMAL":
                    badgeClass = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm";
                    statusIcon = <ShieldCheck className="w-3 h-3 text-slate-500 dark:text-slate-400" />;
                    statusLabel = "Baseline Normal";
                    break;
                  case "FALSE_ALARM":
                    badgeClass = "bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 shadow-sm";
                    statusIcon = <ShieldX className="w-3 h-3 text-purple-600 dark:text-purple-400" />;
                    statusLabel = "False Alarm Avoided";
                    break;
                  case "SUPPRESSED":
                    badgeClass = "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold";
                    statusIcon = <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;
                    statusLabel = "Acoustically Extinguished";
                    break;
                  case "ESCALATED":
                    badgeClass = "bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse shadow-sm font-bold";
                    statusIcon = <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />;
                    statusLabel = "Relay Tripped (Thermal)";
                    break;
                }

                return (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Log ID */}
                    <td className="py-4 px-4 font-mono text-xs font-black text-slate-900 dark:text-white">
                      {log.id}
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-4 text-2xs text-slate-700 dark:text-slate-300 font-mono font-bold">
                      {formatTimestamp(log.timestamp)}
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-xs font-sans text-slate-900 dark:text-slate-100 font-bold max-w-[200px] truncate">
                      {log.location}
                    </td>

                    {/* Badge Classification */}
                    <td className="py-4 px-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-mono font-extrabold border ${badgeClass}`}>
                        {statusIcon}
                        {statusLabel}
                      </div>
                    </td>

                    {/* Sensors */}
                    <td className="py-4 px-4 font-mono text-3xs text-slate-700 dark:text-slate-300">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span className="font-extrabold text-slate-900 dark:text-white">{log.sensorData.temperature}°C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="font-bold">S: {log.sensorData.smoke}%</span>
                        </div>
                        {log.sensorData.combustibleGas > 50 && (
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-extrabold text-4xs w-fit">
                            Gas: {log.sensorData.combustibleGas} ppm
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Acoustic Response */}
                    <td className="py-4 px-4 text-xs font-mono text-slate-800 dark:text-slate-200 font-bold">
                      {log.acousticDetails ? (
                        <div className="text-2xs text-slate-800 dark:text-slate-200">
                          <span className="text-amber-700 dark:text-amber-400 font-black">{log.acousticDetails.frequency}Hz</span> @ {log.acousticDetails.amplitudeDb}dB 
                          <span className="block text-4xs text-slate-600 dark:text-slate-400 mt-0.5 font-bold">Duration: {log.acousticDetails.durationSeconds}s ({log.acousticDetails.waveForm})</span>
                        </div>
                      ) : (
                        <span className="text-3xs text-slate-500 dark:text-slate-400 italic font-bold">No sound deployed</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-4 text-right">
                      <button
                        id={`view-details-${log.id}`}
                        onClick={() => {
                          playClickSound();
                          onSelectLog(log);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 cursor-pointer transition flex items-center justify-center gap-1 text-3xs font-mono font-extrabold float-right shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        INSPECT
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
