import React from "react";
import { OverviewStats, UserRole } from "../types";
import { 
  FileText, 
  Calendar, 
  Cpu, 
  Sparkles, 
  PlusCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  FileEdit,
  ShieldCheck,
  RefreshCw,
  Award
} from "lucide-react";

interface DashboardViewProps {
  stats: OverviewStats;
  role: UserRole;
  onNavigate: (tab: 'dashboard' | 'generator' | 'calendar' | 'ideas' | 'analytics') => void;
  onResetCredits: () => void;
  isLoading: boolean;
}

export default function DashboardView({
  stats,
  role,
  onNavigate,
  onResetCredits,
  isLoading
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white shadow-lg">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-gold-light border border-gold/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>SaaS Content Engine v1.2</span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-display font-bold tracking-tight">
              Welcome back, {role === "admin" ? "Platform Admin" : "Content Expert"}!
            </h1>
            <p className="mt-1.5 text-blue-100 max-w-xl text-sm md:text-base font-light">
              Create, optimize, and organize high-converting campaigns with Gemini's automated reasoning engines.
            </p>
          </div>
          
          <button 
            type="button"
            onClick={() => onNavigate('generator')}
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light active:bg-gold-dark text-primary font-semibold text-sm transition-colors shadow-md shadow-black/10 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Content Now</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Items</span>
            <div className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-white">
              {stats.totalCreated}
            </div>
            <div className="flex gap-1.5 items-center text-[11px] text-slate-500">
              <span className="text-emerald-500 font-medium font-mono">{stats.publishedCount} Live</span>
              <span>•</span>
              <span className="text-amber-500 font-medium font-mono">{stats.scheduledCount} Scheduled</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Scheduled Posts</span>
            <div className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-white">
              {stats.scheduledCount}
            </div>
            <div className="text-[11px] text-slate-500">
              Queued for social publication
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">AI Core Credits</span>
            <div className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <span className={stats.creditsRemaining < 100 ? "text-red-500" : ""}>{stats.creditsRemaining}</span>
              <span className="text-xs font-normal text-slate-400 font-mono">/ 1000</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Refreshes monthly
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-gold">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Engagement Score</span>
            <div className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-white flex items-baseline gap-1">
              <span>{stats.avgEngagement}%</span>
              <span className="text-xs text-emerald-500 font-mono font-medium">↑ 4.2%</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>SEO Avg:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{stats.avgSeo}/100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Performance Hub & Quick Actions */}
        <div className="space-y-6 lg:col-span-8">
          
          {/* Quick Actions Panel */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs space-y-4">
            <h3 className="text-md font-semibold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Intelligent Campaign Quick Start</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onNavigate('generator')}
                className="p-4 rounded-xl text-left bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <FileEdit className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-gold-light transition-colors">
                  AI Copywriting
                </h4>
                <p className="text-xs text-slate-400 mt-1">Draft LinkedIn, Twitter threads, or Blogs instantly</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ideas')}
                className="p-4 rounded-xl text-left bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-gold-light transition-colors">
                  Brainstorm Ideas
                </h4>
                <p className="text-xs text-slate-400 mt-1">Stuck on topics? Gather 3 AI topic suggestions.</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="p-4 rounded-xl text-left bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group sm:col-span-2 md:col-span-1"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-gold-light transition-colors">
                  Campaign Calendar
                </h4>
                <p className="text-xs text-slate-400 mt-1">Review scheduled distribution slots and publish triggers</p>
              </button>
            </div>
          </div>

          {/* Admin Tools Panel, only visible if Admin mode is on */}
          {role === 'admin' ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 to-amber-600/10 border border-amber-500/20 dark:from-amber-950/10 dark:to-yellow-950/20 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-amber-800 dark:text-gold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  <span>Admin Control Console</span>
                </h3>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-gold-light border border-amber-500/20">
                  SYSTEM POWER
                </span>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                As a Platform Manager, you have permission to command simulation routines. Force credit replenishments, review diagnostic telemetry blocks, or audit creator statistics.
              </p>

              <div className="flex flex-wrap gap-3 items-center pt-1">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onResetCredits}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Restore AI Credits to 1000</span>
                </button>
                <div className="text-[11px] text-slate-500 italic">
                  *Resets core process quotas instantly.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-slate-200/50 dark:bg-slate-900/60 dark:border-slate-800/60 flex items-center gap-3.5">
              <div className="w-10 h-10 shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Creator Seat Active
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Need to adjust default parameters? Try selecting the <strong>Admin Role</strong> in the workspace top-header.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Recent Activity Timeline */}
        <div className="space-y-6 lg:col-span-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs space-y-4">
            <h3 className="text-md font-semibold tracking-tight text-slate-800 dark:text-white">
              Recent Workspace Pulse
            </h3>
            
            <div className="space-y-4">
              {stats.activities && stats.activities.map((act, index) => (
                <div key={index} className="flex gap-3 relative group">
                  {/* Timeline connector bar */}
                  {index !== stats.activities.length - 1 && (
                    <div className="absolute left-[13px] top-[26px] bottom-[-24px] w-[2px] bg-slate-100 dark:bg-slate-800 pointer-events-none" />
                  )}
                  
                  {/* Bullet */}
                  <div className={`w-7 h-7 rounded-full shrink-0 border-2 dark:-outline-offset-1 flex items-center justify-center text-[10px] relative z-10
                    ${act.type === 'ai' ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/30' : 
                      act.type === 'system' ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/30' : 
                      'bg-slate-50 border-slate-300 text-slate-600 dark:bg-slate-800'}
                  `}>
                    {act.type === 'ai' ? <Sparkles className="w-3 h-3 text-gold" /> : 
                     act.type === 'system' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : 
                     <Clock className="w-3 h-3" />}
                  </div>

                  {/* Content */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                      {act.text}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {act.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
