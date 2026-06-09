import React, { useState } from "react";
import { Idea, PostType } from "../types";
import { 
  PlusCircle, 
  Sparkles, 
  Tag, 
  Trash2, 
  FolderDown, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  AlertCircle, 
  Plus,
  RefreshCw,
  Lightbulb,
  ArrowUpRight,
  HelpCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface IdeasViewProps {
  ideas: Idea[];
  onAddIdea: (idea: { title: string; description: string; platform: string }) => void;
  onUpdateIdea: (id: string, updatedFields: Partial<Idea>) => void;
  onDeleteIdea: (id: string) => void;
  onConvertIdeaToDraft: (title: string, platform: string, description: string) => void;
  onActivityLog: (text: string, type: 'ai' | 'action' | 'system') => void;
}

export default function IdeasView({
  ideas,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onConvertIdeaToDraft,
  onActivityLog
}: IdeasViewProps) {
  // Manual additions state
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("general");
  const [newDesc, setNewDesc] = useState("");

  // Brainstorm states
  const [brainstormTopic, setBrainstormTopic] = useState("");
  const [brainstormPlatform, setBrainstormPlatform] = useState("all");
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormResults, setBrainstormResults] = useState<{
    title: string;
    description: string;
    keywords: string[];
    platform: string;
  }[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddIdea({
      title: newTitle,
      description: newDesc,
      platform: newPlatform
    });

    onActivityLog(`Created workflow idea: "${newTitle.substring(0, 20)}..."`, "action");

    // Clear state
    setNewTitle("");
    setNewDesc("");
    setNewPlatform("general");
    setSuccessMsg("Idea successfully logged in your backlog board.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Launch Gemini AI brainstorm
  const handleAIBrainstorm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainstormTopic.trim()) {
      setErrorMsg("Please enter a core topic keyword to guide Gemini's suggestions.");
      return;
    }

    setIsBrainstorming(true);
    setErrorMsg("");
    setBrainstormResults([]);

    try {
      const response = await fetch("/api/gemini/brainstorm-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: brainstormTopic,
          platform: brainstormPlatform === "all" ? undefined : brainstormPlatform
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Brainstorm request returned an unexpected error.");
      }

      setBrainstormResults(data.ideas || []);
      onActivityLog(`AI brainstormed 3 campaign expansion ideas for topic: "${brainstormTopic}"`, "ai");
      setSuccessMsg("Gemini brainstorm successful! See recommended strategies.");
      setTimeout(() => setSuccessMsg(""), 4000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to trigger AI brainstorming engine. Review endpoints.");
    } finally {
      setIsBrainstorming(false);
    }
  };

  const handleKeepAIIdea = (item: any) => {
    onAddIdea({
      title: item.title,
      description: item.description,
      platform: item.platform || "general"
    });
    onActivityLog(`Saved AI-brainstorm suggestion into organizer space: "${item.title.substring(0, 20)}..."`, "action");
    
    // Remote item from results array
    setBrainstormResults(prev => prev.filter(p => p.title !== item.title));
  };

  const ideaColumns = [
    { id: 'backlog', title: '📋 Ideation / Backlog', border: 'border-indigo-150', pills: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' },
    { id: 'in_progress', title: '⚡ In Production', border: 'border-amber-150', pills: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-gold-light' },
    { id: 'completed', title: '✅ Completed Campaigns', border: 'border-emerald-150', pills: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Create and Brainstorm Tools */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Gemini AI Ideation Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold animate-bounce" />
            <h3 className="text-md font-bold font-display tracking-tight text-white">Gemini Idea Generator</h3>
          </div>
          
          <p className="text-xs text-blue-150 leading-relaxed">
            Stuck on topics? State a general keyword (e.g., "Web3 scaling", "retailing tips") and let Gemini brainstorm 3 highly specific click-magnet storylines.
          </p>

          <form onSubmit={handleAIBrainstorm} className="space-y-3.5 pt-1 text-slate-800">
            <div className="space-y-1">
              <label htmlFor="brainstorm-topic" className="text-[10px] uppercase font-bold tracking-widest text-blue-200 block">Core Topic</label>
              <input
                id="brainstorm-topic"
                type="text"
                required
                value={brainstormTopic}
                onChange={(e) => setBrainstormTopic(e.target.value)}
                placeholder="e.g., TypeScript, remote marketing"
                className="w-full p-2.5 rounded-xl border-none bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-gold focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="brainstorm-platform" className="text-[10px] uppercase font-bold tracking-widest text-blue-200 block">Channel Format</label>
              <select
                id="brainstorm-platform"
                value={brainstormPlatform}
                onChange={(e) => setBrainstormPlatform(e.target.value)}
                className="w-full p-2.5 rounded-xl border-none bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-gold focus:outline-none"
              >
                <option value="all">🌐 Any platform option</option>
                <option value="blog">📝 Blog Post</option>
                <option value="linkedin">💼 LinkedIn Article</option>
                <option value="twitter">🐦 Twitter/X Threads</option>
                <option value="instagram">📸 Instagram Visuals</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isBrainstorming}
              className="w-full py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-light active:bg-gold-dark text-primary font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBrainstorming ? 'animate-spin' : ''}`} />
              <span>{isBrainstorming ? 'Brainstorming Ideas...' : 'A.I. Spark Content Ideas'}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/20 text-[11px] text-red-200 flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Brainstorm Results list */}
        {brainstormResults.length > 0 && (
          <div className="space-y-3.5 animate-scale-up">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Lightbulb className="w-4 h-4 text-gold-dark" />
              <span>A.I. Suggested Campaign angles</span>
            </h4>

            {brainstormResults.map((item, id) => (
              <div 
                key={id} 
                className="p-4 rounded-xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 shadow-xs space-y-2 relative group"
              >
                <span className="text-[9px] uppercase font-bold tracking-wider rounded-lg px-2 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400">
                  {item.platform}
                </span>

                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 pr-5">
                  {item.title}
                </h5>
                
                <p className="text-[11px] text-slate-400 leading-normal">
                  {item.description}
                </p>

                {item.keywords && (
                  <div className="flex flex-wrap gap-1">
                    {item.keywords.map((kw, idx) => (
                      <span key={idx} className="text-[9px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex gap-2 items-center justify-end border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleKeepAIIdea(item)}
                    className="p-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-gold-light text-[10px] font-bold border border-amber-200/20 cursor-pointer"
                  >
                    Keep in Backlog
                  </button>

                  <button
                    type="button"
                    onClick={() => onConvertIdeaToDraft(item.title, item.platform, item.description)}
                    className="px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Export ideas directly to content generation form"
                  >
                    <span>Draft Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual Add Ideas Folder */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Log Custom Content Idea</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Draft simple workflow reminders and categorizations manually.</p>
          </div>

          <form onSubmit={handleManualAdd} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="custom-idea-title" className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Title outline</label>
              <input
                id="custom-idea-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Launch week promo campaign"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="custom-idea-platform" className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Target Outlet</label>
              <select
                id="custom-idea-platform"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="general">📚 General Concept</option>
                <option value="blog">📝 Blog Post</option>
                <option value="linkedin">💼 LinkedIn Editorial</option>
                <option value="twitter">🐦 Twitter/X Thread</option>
                <option value="instagram">📸 Instagram Post</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="custom-idea-desc" className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Short Description</label>
              <input
                id="custom-idea-desc"
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Details of the campaign angle..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs focus:outline-none placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-slate-800 text-white dark:bg-slate-700 hover:bg-slate-900 transition-colors font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Idea to Backlog</span>
            </button>
          </form>

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Kanban Board representation */}
      <div className="lg:col-span-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-[500px]">
          {ideaColumns.map((col) => {
            const columnIdeas = ideas.filter(i => i.status === col.id);
            
            return (
              <div 
                key={col.id} 
                className={`flex flex-col bg-slate-100/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-4 space-y-4`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-display">
                    {col.title}
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${col.pills}`}>
                    {columnIdeas.length}
                  </span>
                </div>

                {/* Ideas list */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnIdeas.length === 0 ? (
                    <div className="p-8 text-center text-[11px] text-slate-400 italic rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-12">
                      <FolderDown className="w-6 h-6 text-slate-300 mb-1.5" />
                      <span>Workspace category empty</span>
                    </div>
                  ) : (
                    columnIdeas.map((idea) => (
                      <div 
                        key={idea.id} 
                        className="p-4 rounded-xl bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 shadow-xs space-y-3 hover:translate-y-[-1px] transition-transform relative group"
                      >
                        {/* Platform indicators tag */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded-md border border-slate-200/40 dark:border-slate-800/30">
                            {idea.platform.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteIdea(idea.id);
                              onActivityLog(`Deleted idea: "${idea.title.substring(0, 15)}"`, "action");
                            }}
                            className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all cursor-pointer"
                            title="Remove idea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Text values */}
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                            {idea.title}
                          </h4>
                          {idea.description && (
                            <p className="text-[11px] text-slate-400 leading-normal line-clamp-3">
                              {idea.description}
                            </p>
                          )}
                        </div>

                        {/* Interactive triggers to change pipeline step */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1 items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-400">Move:</span>
                            {col.id === 'backlog' && (
                              <button
                                type="button"
                                onClick={() => onUpdateIdea(idea.id, { status: "in_progress" })}
                                className="text-[9px] font-bold text-amber-600 hover:underline cursor-pointer"
                              >
                                In Production
                              </button>
                            )}
                            {col.id === 'in_progress' && (
                              <button
                                type="button"
                                onClick={() => onUpdateIdea(idea.id, { status: "completed" })}
                                className="text-[9px] font-bold text-emerald-600 hover:underline cursor-pointer"
                              >
                                Complete
                              </button>
                            )}
                            {col.id === 'completed' && (
                              <button
                                type="button"
                                onClick={() => onUpdateIdea(idea.id, { status: "backlog" })}
                                className="text-[9px] font-bold text-slate-500 hover:underline cursor-pointer"
                              >
                                Re-Ideate
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => onConvertIdeaToDraft(idea.title, idea.platform, idea.description || "")}
                            className="p-1 px-1.5 rounded-lg bg-indigo-50/60 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer border border-indigo-120/40"
                          >
                            <span>Draft</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  );
}
