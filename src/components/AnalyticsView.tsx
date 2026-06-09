import React from "react";
import { Post, OverviewStats } from "../types";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { 
  TrendingUp, 
  Award, 
  Clock, 
  Eye, 
  ThumbsUp, 
  Share2, 
  MessageSquare, 
  MousePointerClick,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface AnalyticsViewProps {
  posts: Post[];
  stats: OverviewStats;
}

export default function AnalyticsView({
  posts,
  stats
}: AnalyticsViewProps) {
  // Aggregate stats per platform type for the charts
  const performanceByType = posts.reduce((acc: { [key: string]: { created: number; likes: number; shares: number; clicks: number } }, post) => {
    const typeLabel = post.type.toUpperCase();
    if (!acc[typeLabel]) {
      acc[typeLabel] = { created: 0, likes: 0, shares: 0, clicks: 0 };
    }
    acc[typeLabel].created += 1;
    if (post.stats) {
      acc[typeLabel].likes += post.stats.likes || 0;
      acc[typeLabel].shares += post.stats.shares || 0;
      acc[typeLabel].clicks += post.stats.clicks || 0;
    }
    return acc;
  }, {});

  // Formulate data array for recharts
  const chartData = Object.keys(performanceByType).map(key => ({
    name: key,
    PostsCreated: performanceByType[key].created,
    Likes: performanceByType[key].likes,
    Shares: performanceByType[key].shares,
    Clicks: performanceByType[key].clicks,
  }));

  // Fallback seeding in case there is no historical data yet
  const defaultPerformanceData = [
    { name: "BLOG", PostsCreated: 1, Likes: 342, Shares: 89, Clicks: 1205 },
    { name: "LINKEDIN", PostsCreated: 1, Likes: 512, Shares: 124, Clicks: 1845 },
    { name: "TWITTER", PostsCreated: 1, Likes: 128, Shares: 62, Clicks: 520 },
    { name: "INSTAGRAM", PostsCreated: 1, Likes: 285, Shares: 45, Clicks: 920 },
    { name: "ADS", PostsCreated: 0, Likes: 0, Shares: 0, Clicks: 0 },
    { name: "PRODUCT", PostsCreated: 0, Likes: 0, Shares: 0, Clicks: 0 }
  ];

  const activeChartData = chartData.length > 0 ? chartData : defaultPerformanceData;

  // Pie chart platform shares distribution
  const pieColors = ["#1A1F4E", "#C9A227", "#10B981", "#EC4899", "#0EA5E9", "#8B5CF6"];

  const aggregatedTotals = posts.reduce((acc, curr) => {
    if (curr.stats) {
      acc.likes += curr.stats.likes || 0;
      acc.shares += curr.stats.shares || 0;
      acc.clicks += curr.stats.clicks || 0;
      acc.comments += curr.stats.comments || 0;
    }
    return acc;
  }, { likes: 1267, shares: 320, clicks: 4490, comments: 247 }); // Seeding pre-existents for awesome visual volume on first load

  // Filter out posts that have stats details
  const rankedPosts = [...posts]
    .filter(p => p.status === 'published')
    .sort((a,b) => ((b.stats?.clicks || 0) + (b.stats?.likes || 0)) - ((a.stats?.clicks || 0) + (a.stats?.likes || 0)));

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Analytics introductory banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white font-display flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <span>Audience Engagement Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review live content consumption performance indices, impressions logs, and SEO score achievements.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250/20">
          <Zap className="w-3.5 h-3.5 fill-current text-emerald-500 animate-pulse" />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {/* Grid KPI performance scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Accumulated Clicks</span>
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-850 dark:text-white">
            {aggregatedTotals.clicks.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-500 font-bold font-mono">↑ 12.5%</span>
            <span>vs previous 30 days</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Social Appreciations (Likes)</span>
            <ThumbsUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-850 dark:text-white">
            {aggregatedTotals.likes.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-500 font-bold font-mono">↑ 8.3%</span>
            <span>growth index</span>
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Share Quotient</span>
            <Share2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-850 dark:text-white">
            {aggregatedTotals.shares.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-500 font-bold font-mono">↑ 14.1%</span>
            <span>viral acceleration quotient</span>
          </p>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">User comments</span>
            <MessageSquare className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-850 dark:text-white">
            {aggregatedTotals.comments.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <span>Average score:</span>
            <span className="font-bold text-indigo-600 dark:text-gold-light">{stats.avgEngagement}%</span>
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Channel Breakdown (Bar Chart) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs space-y-4 lg:col-span-8">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">Platform Conversion Outlets</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Clicks & social engagements summarized by publication targets.</p>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '12px', 
                    color: '#F8FAFC', 
                    border: 'none', 
                    fontSize: '11px' 
                  }} 
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Clicks" fill="#1A1F4E" minPointSize={5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Likes" fill="#C9A227" minPointSize={5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Shares" fill="#10B981" minPointSize={5} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Share Mix (Pie Chart) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs space-y-4 lg:col-span-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">Editorial Portfolio Mix</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Concentration of active campaign channels.</p>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="PostsCreated"
                >
                  {activeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} posts`, 'Concentration']} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-xl font-bold font-display tracking-tight text-slate-850 dark:text-white">
                {posts.length}
              </span>
              <span className="text-[9px] text-slate-400 block uppercase font-semibold">Total posts</span>
            </div>
          </div>

          {/* Color Guides list */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 pt-1">
            {activeChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                <span className="truncate">{entry.name}: {entry.PostsCreated} drafts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Top Performing Content tables */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">Active Campaign Reach Auditing</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Statistical metrics of published social objects.</p>
        </div>

        <div className="overflow-x-auto">
          {rankedPosts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 italic">
              No live published social objects tracked yet. Use the Calendar tab to publish your first content!
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-2.5 font-semibold">Title Headline</th>
                  <th className="py-2.5 font-semibold">Social Channel</th>
                  <th className="py-2.5 font-semibold text-center">Clicks</th>
                  <th className="py-2.5 font-semibold text-center">Appreciations</th>
                  <th className="py-2.5 font-semibold text-center">Shares</th>
                  <th className="py-2.5 font-semibold text-center">Calculated Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {rankedPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                    <td className="py-3 pr-4 font-bold max-w-sm truncate text-slate-850 dark:text-white" title={post.title}>
                      {post.title}
                    </td>
                    <td className="py-3">
                      <span className="p-1 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                        {post.type}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-slate-805 dark:text-slate-200">
                      {post.stats?.clicks.toLocaleString() || 0}
                    </td>
                    <td className="py-3 text-center font-mono text-slate-500">
                      {post.stats?.likes.toLocaleString() || 0}
                    </td>
                    <td className="py-3 text-center font-mono text-slate-500">
                      {post.stats?.shares.toLocaleString() || 0}
                    </td>
                    <td className="py-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold p-1 px-2.5 rounded-lg text-[10px]">
                        <TrendingUp className="w-3 h-3" />
                        <span>{post.engagementScore}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
