/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Flame, ShieldCheck, Activity, Zap, ShieldAlert, CheckCircle2 } from "lucide-react";
import { FireLog } from "../types";

interface DashboardStatsProps {
  logs: FireLog[];
  batteryLevel: number;
  relayState: "NORMAL" | "TRIPPED";
}

export default function DashboardStats({ logs, batteryLevel, relayState }: DashboardStatsProps) {
  const totalEvents = logs.length;
  const fireCount = logs.filter((l) => l.fireOccurred).length;
  const suppressedCount = logs.filter((l) => l.classification === "SUPPRESSED").length;
  const falseAlarmCount = logs.filter((l) => l.classification === "FALSE_ALARM").length;

  const successRate = fireCount > 0 ? Math.round((suppressedCount / (suppressedCount + logs.filter(l => l.classification === "ESCALATED").length)) * 100) : 100;

  const stats = [
    {
      id: "stat-scans",
      title: "Total Monitored Logs",
      value: totalEvents,
      subtext: "Continuous environmental polling",
      icon: Activity,
      color: "text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800",
      accent: "from-rose-600 to-red-600",
      badge: "Real-time",
      badgeColor: "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-extrabold",
    },
    {
      id: "stat-fires",
      title: "Fire Occurrences",
      value: fireCount,
      subtext: `${suppressedCount} suppressed by sound waves`,
      icon: Flame,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-800/60",
      accent: "from-amber-500 to-rose-500",
      badge: fireCount > 0 ? "Detected" : "Clear",
      badgeColor: fireCount > 0 ? "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" : "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    {
      id: "stat-suppressed",
      title: "Acoustic Success Rate",
      value: `${successRate}%`,
      subtext: "Wave interference extinguishments",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800/60",
      accent: "from-emerald-500 to-teal-500",
      badge: "Target: 95%+",
      badgeColor: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    {
      id: "stat-false-alarms",
      title: "False Alarms Avoided",
      value: falseAlarmCount,
      subtext: "Prevented via multi-sensor fusion",
      icon: ShieldCheck,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/60 border-purple-200/60 dark:border-purple-800/60",
      accent: "from-purple-500 to-pink-500",
      badge: "Fusion Safe",
      badgeColor: "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.3, delay: idx * 0.08 }}
          className="flex flex-col p-5 bg-gradient-to-br from-amber-50/95 via-amber-100/30 to-cyan-50/40 dark:bg-slate-900 border-2 border-amber-300/90 dark:border-amber-600/60 rounded-2xl shadow-md shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20 hover:border-cyan-400 dark:hover:border-cyan-400 transition-all relative overflow-hidden group"
        >
          {/* Top gradient highlight bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.accent}`} />
          
          {/* Subtle corner glow background */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-slate-50 dark:bg-slate-800/40 opacity-60 blur-2xl rounded-full group-hover:scale-110 transition-transform" />
          
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-2xs font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold">
              {stat.title}
            </span>
            <div className={`p-2 rounded-xl border ${stat.color} shadow-2xs`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline justify-between mt-1 relative z-10">
            <span className="text-3xl font-sans font-black tracking-tight text-slate-900 dark:text-white">
              {stat.value}
            </span>
            <span className={`text-4xs font-mono font-extrabold px-2 py-0.5 rounded-full border ${stat.badgeColor}`}>
              {stat.badge}
            </span>
          </div>
          
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 font-sans font-semibold relative z-10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400 inline-block shrink-0" />
            {stat.subtext}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
