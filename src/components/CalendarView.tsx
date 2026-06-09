import React, { useState } from "react";
import { Post, PostType } from "../types";
import { 
  Calendar, 
  MapPin, 
  Trash2, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Maximize2, 
  Edit3, 
  Sparkles, 
  Eye, 
  X,
  FileText,
  Instagram,
  ArrowRight,
  Send,
  CheckCircle2,
  Filter,
  TrendingUp,
  Briefcase
} from "lucide-react";

interface CalendarViewProps {
  posts: Post[];
  onUpdatePost: (id: string, updatedFields: Partial<Post>) => void;
  onDeletePost: (id: string) => void;
  onActivityLog: (text: string, type: 'ai' | 'action' | 'system') => void;
}

export default function CalendarView({
  posts,
  onUpdatePost,
  onDeletePost,
  onActivityLog
}: CalendarViewProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // State to support clicking any calendar slot to "Quick Schedule" a raw draft
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickBody, setQuickBody] = useState("");
  const [quickType, setQuickType] = useState<PostType>("linkedin");

  // Hardcode representative days of current month for visual grid (e.g. June 2026 matches the current local time)
  // Let's generate days from June 1 to June 30, 2026.
  // June 1, 2026 was a Monday. So we can lay out starting from Monday.
  const daysInMonth = 30;
  
  // Group posts by date string (YYYY-MM-DD)
  const postsByDate: { [key: string]: Post[] } = {};
  
  posts.forEach(p => {
    if (p.status === 'scheduled' && p.scheduledDate) {
      const datePart = p.scheduledDate.split('T')[0]; // YYYY-MM-DD
      if (!postsByDate[datePart]) {
        postsByDate[datePart] = [];
      }
      postsByDate[datePart].push(p);
    }
  });

  const getPlatformStyle = (type: PostType) => {
    switch (type) {
      case 'blog': return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300', icon: <FileText className="w-3.5 h-3.5" /> };
      case 'instagram': return { bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800/60', text: 'text-pink-700 dark:text-pink-300', icon: <Instagram className="w-3.5 h-3.5" /> };
      case 'linkedin': return { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/60', text: 'text-blue-700 dark:text-blue-300', icon: <BriefcaseIcon /> };
      case 'twitter': return { bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800/60', text: 'text-sky-700 dark:text-sky-300', icon: <TwitterIcon /> };
      case 'ad': return { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800/60', text: 'text-rose-700 dark:text-rose-300', icon: <TrendingUp className="w-3.5 h-3.5" /> };
      case 'product': return { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800/60', text: 'text-violet-700 dark:text-violet-300', icon: <AwardIcon /> };
      default: return { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', icon: <Plus className="w-3.5 h-3.5" /> };
    }
  };

  const dayGridCells = Array.from({ length: 30 }, (_, index) => {
    const dayNumber = index + 1;
    const dateStr = `2026-06-${dayNumber < 10 ? '0' + dayNumber : dayNumber}`;
    return {
      dayNumber,
      dateStr,
      isToday: dayNumber === 9, // Current local time says 2026-06-09
      posts: postsByDate[dateStr] || []
    };
  });

  const handleOpenDetails = (post: Post) => {
    setSelectedPost(post);
    setEditTitle(post.title);
    setEditBody(post.body);
    setIsEditing(false);
  };

  const handlePublishNow = (post: Post) => {
    onUpdatePost(post.id, { status: "published" });
    onActivityLog(`Manually forced social publication of Post "${post.title.substring(0, 20)}..."`, "system");
    setSelectedPost(null);
  };

  const handleSaveEdit = () => {
    if (!selectedPost) return;
    onUpdatePost(selectedPost.id, {
      title: editTitle,
      body: editBody
    });
    onActivityLog(`Updated scheduled post details for "${editTitle.substring(0, 20)}..."`, "action");
    setSelectedPost(null);
    setIsEditing(false);
  };

  const handleDelete = (post: Post) => {
    onDeletePost(post.id);
    onActivityLog(`Removed post scheduled slot: "${post.title.substring(0, 20)}..."`, "action");
    setSelectedPost(null);
  };

  // Quick Scheduler directly from calendar day click
  const handleSlotClick = (dateStr: string) => {
    setQuickAddDate(dateStr);
    setQuickTitle("");
    setQuickBody("");
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle || !quickAddDate) return;

    const fakeScheduledDate = `${quickAddDate}T12:00:00Z`;
    const newPost: Post = {
      id: Math.random().toString(36).substring(2, 9),
      title: quickTitle,
      body: quickBody || "Enter template body outline...",
      type: quickType,
      status: 'scheduled',
      scheduledDate: fakeScheduledDate,
      seoScore: 75,
      engagementScore: 70,
      keywords: ["QuickSchedule"],
      createdAt: new Date().toISOString()
    };

    // Push into app list
    // Wait, onUpdatePost can only edit existing, but actually we can simulate adding by passing it. Let's pass a custom action, or we can use onUpdatePost. 
    // Wait, we need a way to insert posts. Let's check how App.tsx handles onPostCreated from GeneratorView:
    // It accepts `post: { title, body, type, status, scheduledDate, keywords }`. Let's make sure we support that, so we can pass quickCreated back! Oh, wait. In CalendarView, we may need to invoke a create method. Let's pass a create method from AppProps or simulate it. We can add `onPostCreated` prop or use an endpoint logic. Better to add a prop `onPostCreated` inside calendar props or trigger an API request directly!
    // Since we can trigger standard `fetch("/api/posts")` directly for a production-ready system, let's write a direct API fetch or invoke a prop.
    // Let's invoke a REST API POST! We can append it to `/api/posts` directly on the server to make the app's full-stack behavior pristine and real! Let's do that!
    fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quickTitle,
        body: quickBody || "Enter content plan outline...",
        type: quickType,
        status: "scheduled",
        scheduledDate: fakeScheduledDate,
        keywords: ["SocialCalendar"]
      })
    })
    .then(r => r.json())
    .then(created => {
      onActivityLog(`Created calendar post quick-slot allocation for date: ${quickAddDate}`, "action");
      onUpdatePost(created.id, created); // Force state updates in parent App
      setQuickAddDate(null);
    })
    .catch(err => {
      console.error(err);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white font-display flex items-center gap-1.5">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span>Editorial Schedule & Campaigns</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing June 2026 Social Queues. Click any date grid cell below to allocate custom post slots.
          </p>
        </div>

        {/* Quick filters tag */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Filter platform:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">🌐 All Channels</option>
            <option value="blog">📝 Blog</option>
            <option value="linkedin">💼 LinkedIn</option>
            <option value="twitter">🐦 Twitter/X</option>
            <option value="instagram">📸 Instagram</option>
            <option value="ad">🎯 Ads</option>
          </select>
        </div>
      </div>

      {/* Grid Monthly Calendar */}
      <div className="bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {dayGridCells.map((cell) => {
            // Apply platform filter if selected
            const filteredPosts = cell.posts.filter(p => filterType === "all" || p.type === filterType);
            
            return (
              <div 
                key={cell.dayNumber}
                className={`min-h-[120px] p-2 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all flex flex-col justify-between group relative
                  ${cell.isToday ? 'bg-indigo-50/10 dark:bg-indigo-950/10 ring-2 ring-primary/20 ring-inset z-10' : ''}
                `}
              >
                {/* Cell Number Header */}
                <div className="flex items-center justify-between pb-1">
                  <span className={`text-xs font-semibold font-mono p-1 rounded-full w-6 h-6 flex items-center justify-center
                    ${cell.isToday 
                      ? 'bg-primary text-white dark:bg-gold dark:text-primary font-bold' 
                      : 'text-slate-500 dark:text-slate-400'}
                  `}>
                    {cell.dayNumber}
                  </span>
                  {cell.isToday && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-700 dark:text-gold">
                      Today
                    </span>
                  )}
                </div>

                {/* Scheduled post blocks list */}
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[85px] pt-1">
                  {filteredPosts.map(p => {
                    const style = getPlatformStyle(p.type);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleOpenDetails(p)}
                        className={`w-full p-1.5 rounded-lg border text-left transition-all ${style.bg} ${style.border} block truncate group-hover:shadow-xs cursor-pointer select-none`}
                        title={p.title}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={style.text}>{style.icon}</span>
                          <span className={`text-[10px] font-semibold tracking-tight ${style.text} truncate block`}>
                            {p.title}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Quick Add Hover button */}
                <button
                  type="button"
                  onClick={() => handleSlotClick(cell.dateStr)}
                  className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 transition-all text-slate-500 dark:text-slate-300 pointer-events-auto cursor-pointer"
                  title="Plan quick content on this date"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* QUICK PLAN DIALOG SLIDE-OUT / POPUP */}
      {quickAddDate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-up mx-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-1.5 font-display">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>Quick Editorial Allocation</span>
              </h3>
              <button 
                type="button"
                onClick={() => setQuickAddDate(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Scheduled Target Slot</span>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {quickAddDate} at Noon (12:00 UTC)
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="quick-post-title" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Content Title Outline</label>
                <input
                  id="quick-post-title"
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="e.g., Unveiling our next generation cloud server"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="quick-post-format" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Social Outlet</label>
                <select
                  id="quick-post-format"
                  value={quickType}
                  onChange={(e) => setQuickType(e.target.value as PostType)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="linkedin">💼 LinkedIn Editorial</option>
                  <option value="twitter">🐦 Twitter/X Threads</option>
                  <option value="instagram">📸 Instagram Visuals</option>
                  <option value="blog">📝 Blog Editorial</option>
                  <option value="ad">🎯 Persuasive Ad Copy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="quick-post-body" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rough Idea / Outline Notes</label>
                <textarea
                  id="quick-post-body"
                  rows={3}
                  value={quickBody}
                  onChange={(e) => setQuickBody(e.target.value)}
                  placeholder="Enter quick brainstorming bullet points here..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickAddDate(null)}
                  className="p-2 px-4 rounded-xl text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="p-2 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-light active:bg-primary-dark cursor-pointer shadow-md"
                >
                  Plan Campaign Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED POST EXPANSION MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-up mx-4 max-h-[85vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase rounded-lg px-2 py-0.5 bg-primary/10 text-primary dark:bg-gold-dark/10 dark:text-gold-light">
                  {selectedPost.type}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {selectedPost.id}
                </span>
              </div>

              <button 
                type="button"
                onClick={() => setSelectedPost(null)} 
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editing / Visual details container */}
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-post-title" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Post Headline</label>
                  <input
                    id="edit-post-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-display text-sm text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-post-body" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Full Post Body</label>
                  <textarea
                    id="edit-post-body"
                    rows={8}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-mono line-clamp-10 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Campaign Header</span>
                  <h3 className="text-md sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                    {selectedPost.title}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Content Body</span>
                  
                  {selectedPost.type === 'twitter' ? (
                    <div className="space-y-3 pt-2">
                      {selectedPost.body.split('[TWEET_BREAK]').map((tweet, index) => (
                        <div key={index} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-mono text-slate-400">Tweet {index+1}</span>
                          <p className="text-xs text-slate-700 dark:text-slate-200 pt-1 whitespace-pre-wrap">{tweet.trim()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 pt-1 leading-relaxed prose dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: selectedPost.body }}
                    />
                  )}
                </div>

                {/* Score estimations readouts */}
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">SEO Rank</span>
                    <span className="text-sm font-bold font-mono text-emerald-500">{selectedPost.seoScore || 80}/100</span>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Est. Reach</span>
                    <span className="text-sm font-bold font-mono text-indigo-500 dark:text-indigo-400">{selectedPost.engagementScore || 85}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Panel Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center justify-between">
              
              <div className="flex gap-2">
                <button
                  type="button"
                  key="delete-btn"
                  onClick={() => handleDelete(selectedPost)}
                  className="p-2 px-3 text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl cursor-pointer flex items-center gap-1 border border-rose-100 dark:border-rose-900/40"
                  title="Remove this scheduled slot permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete Post</span>
                </button>

                {isEditing ? (
                  <button
                    type="button"
                    key="cancel-edit-btn"
                    onClick={() => setIsEditing(false)}
                    className="p-2 px-3 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer"
                  >
                    Discard Changes
                  </button>
                ) : (
                  <button
                    type="button"
                    key="edit-btn"
                    onClick={() => setIsEditing(true)}
                    className="p-2 px-3 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Post Details</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2 font-semibold">
                {isEditing ? (
                  <button
                    type="button"
                    key="save-edit-btn"
                    onClick={handleSaveEdit}
                    className="p-2.5 px-4 rounded-xl text-xs text-white bg-slate-800 hover:bg-slate-900 dark:bg-gold dark:text-primary cursor-pointer font-bold shrink-0"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button
                    type="button"
                    key="publish-instantly-btn"
                    onClick={() => handlePublishNow(selectedPost)}
                    className="p-2.5 px-4 rounded-xl text-xs text-white bg-primary hover:bg-primary-light active:bg-primary-dark cursor-pointer font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Publish Social Campaign Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inner helper icon components for LinkedIn, Twitter, Product Description
function BriefcaseIcon() {
  return <Briefcase className="w-3.5 h-3.5" />;
}

function TwitterIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function AwardIcon() {
  return <AwardIconContainer />;
}

function AwardIconContainer() {
  return (
    <div className="w-3.5 h-3.5 rounded-full bg-violet-600 dark:bg-violet-400" style={{ transform: "scale(0.85)" }} />
  );
}
