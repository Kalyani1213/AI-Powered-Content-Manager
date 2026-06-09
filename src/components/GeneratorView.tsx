import React, { useState } from "react";
import { PostType, UserRole } from "../types";
import { 
  Sparkles, 
  Send, 
  Check, 
  Copy, 
  Activity, 
  HelpCircle, 
  Eye, 
  ShieldAlert, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Tag, 
  CheckCircle2, 
  Lightbulb, 
  ArrowRight,
  TrendingUp,
  Search,
  BookOpen,
  ShoppingBag,
  Megaphone,
  Briefcase
} from "lucide-react";

interface GeneratorViewProps {
  creditsRemaining: number;
  onPostCreated: (post: {
    title: string;
    body: string;
    type: PostType;
    status: 'draft' | 'scheduled' | 'published';
    scheduledDate?: string;
    keywords?: string[];
  }) => void;
  onActivityLog: (text: string, type: 'ai' | 'action' | 'system') => void;
  onRefreshStats: () => void;
}

export default function GeneratorView({
  creditsRemaining,
  onPostCreated,
  onActivityLog,
  onRefreshStats
}: GeneratorViewProps) {
  const getAuthHeaders = () => {
    const userStr = localStorage.getItem("contentflow_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && u.email) {
          return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${u.email}`
          };
        }
      } catch (e) {}
    }
    return { "Content-Type": "application/json" };
  };

  // Form State
  const [type, setType] = useState<PostType>("blog");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("");
  const [extraPrompt, setExtraPrompt] = useState("");

  // UI Flow State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Generated Result State
  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    body: string;
    keywords: string[];
    seoScore: number;
    engagementScore: number;
    isSandbox?: boolean;
  } | null>(null);

  // AI Review Suggestions State
  const [auditResult, setAuditResult] = useState<{
    auditScore: number;
    seoScore: number;
    suggestions: string[];
    headlineVariations: string[];
  } | null>(null);

  // Schedule & Draft state
  const [isCopied, setIsCopied] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<'draft' | 'scheduled'>('draft');
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const tones = [
    { value: "professional", label: "💼 Professional" },
    { value: "engaging", label: "🔥 Highly Engaging" },
    { value: "bold", label: "⚡ Bold & Fearless" },
    { value: "playful", label: "🎉 Playful & Warm" },
    { value: "educational", label: "🎓 Academic & Insightful" },
    { value: "persuasive", label: "🎯 Persuasive Copy" }
  ];

  const contentTypes: { value: PostType; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { 
      value: "blog", 
      label: "Blog Post", 
      icon: <BookOpen className="w-4 h-4" />,
      placeholder: "e.g., 5 cloud architecture patterns for scaling databases in 2026"
    },
    { 
      value: "linkedin", 
      label: "LinkedIn Editorial", 
      icon: <Briefcase className="w-4 h-4" />,
      placeholder: "e.g., Why we moved away from generic mock analytics to real-time SVG charts"
    },
    { 
      value: "twitter", 
      label: "Twitter/X Thread", 
      icon: <ShareTwitterIcon />,
      placeholder: "e.g., The secret blueprint to scaling self-healing Docker containers"
    },
    { 
      value: "instagram", 
      label: "Instagram Caption", 
      icon: <Eye className="w-4 h-4" />,
      placeholder: "e.g., Launch day for our new minimalist design system"
    },
    { 
      value: "ad", 
      label: "Persuasive Ad Copy", 
      icon: <Megaphone className="w-4 h-4" />,
      placeholder: "e.g., Limited time discount code for premium database storage"
    },
    { 
      value: "product", 
      label: "Product Description", 
      icon: <ShoppingBag className="w-4 h-4" />,
      placeholder: "e.g., ContentFlow AI Premium Suite - automated social scheduling & copywriting"
    },
  ];

  // Handler to perform Gemini content drafting
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg("Please provide a core theme or topic keyword to trigger the draft.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");
    setFeedbackMsg("");
    setAuditResult(null); // Reset previous audit
    
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type,
          topic,
          tone,
          targetAudience,
          extraPrompt
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Generation engine returned an unexpected error.");
      }

      setGeneratedResult({
        title: data.title,
        body: data.body,
        keywords: data.keywords || [],
        seoScore: data.seoScore || 80,
        engagementScore: data.engagementScore || 80,
        isSandbox: data.isSandbox
      });

      // Update parent controls & trigger timeline
      const typeLabel = contentTypes.find(c => c.value === type)?.label || type;
      onActivityLog(`AI generated professional ${typeLabel} draft: "${data.title.substring(0, 30)}..."`, "ai");
      onRefreshStats();

      if (data.isSandbox) {
        setFeedbackMsg("Draft generated! Running in secure offline sandbox mode.");
      } else {
        setFeedbackMsg("Content synthesized successfully via Gemini-3.5-Flash model.");
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to establish a pipeline to Gemini models. Verify server logs.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler to call Gemini Content Audit
  const handleAnalyzeContent = async () => {
    if (!generatedResult) return;
    setIsAuditing(true);
    setErrorMsg("");
    
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: generatedResult.title,
          body: generatedResult.body,
          type
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Analysis engine failed.");
      }

      setAuditResult({
        auditScore: data.auditScore,
        seoScore: data.seoScore,
        suggestions: data.suggestions || [],
        headlineVariations: data.headlineVariations || []
      });

      onActivityLog(`Performed Gemini SEO & Readability audit on "${generatedResult.title.substring(0, 25)}"`, "ai");
      onRefreshStats();

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to trigger content audit. Please try again.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyClipboard = () => {
    if (!generatedResult) return;
    const textToCopy = `TITLE: ${generatedResult.title}\n\n${generatedResult.body}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApplyHeadline = (variation: string) => {
    if (!generatedResult) return;
    setGeneratedResult({
      ...generatedResult,
      title: variation
    });
    onActivityLog(`Applied AI suggested headline option: "${variation.substring(0, 30)}..."`, "action");
  };

  const handleSavePost = () => {
    if (!generatedResult) return;

    let finalDate = undefined;
    if (scheduleStatus === 'scheduled') {
      if (!scheduledDate) {
        setErrorMsg("Please select a valid scheduled calendar date.");
        return;
      }
      finalDate = `${scheduledDate}T${scheduledTime}:00Z`;
    }

    onPostCreated({
      title: generatedResult.title,
      body: generatedResult.body,
      type,
      status: scheduleStatus,
      scheduledDate: finalDate,
      keywords: generatedResult.keywords
    });

    onActivityLog(`Added generated post to active system space as: ${scheduleStatus.toUpperCase()}`, "action");

    // Clear state/Reset
    setGeneratedResult(null);
    setAuditResult(null);
    setTopic("");
    setExtraPrompt("");
    setFeedbackMsg(`Successfully created campaign item: "${scheduleStatus.toUpperCase()}"! Keep writing!`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Controls & Input Form */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-display">
              <Sparkles className="w-5 h-5 text-gold animate-bounce" />
              <span>Draft Marketing Post</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your platform format, outline a core direction, and let Gemini structure an optimized template instantly.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            
            {/* Format Type Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Content Format</label>
              <div className="grid grid-cols-2 gap-2">
                {contentTypes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setType(item.value);
                      if (generatedResult) setGeneratedResult(null);
                    }}
                    className={`p-3 rounded-xl border mb-0 text-left transition-all flex items-center gap-2 group cursor-pointer
                      ${type === item.value 
                        ? 'border-primary bg-slate-50 dark:bg-primary-dark/20 text-indigo-700 dark:text-gold-light font-semibold ring-2 ring-primary/10' 
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300'}
                    `}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                      ${type === item.value 
                        ? 'bg-primary dark:bg-gold-dark text-white dark:text-primary' 
                        : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}
                    `}>
                      {item.icon}
                    </div>
                    <span className="text-xs truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Theme Topic */}
            <div className="space-y-1.5">
              <label htmlFor="topic-input" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                What is this content about?
              </label>
              <textarea
                id="topic-input"
                required
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={contentTypes.find(c => c.value === type)?.placeholder}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder-slate-400"
              />
            </div>

            {/* Grid for Tone and Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="tone-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Writing Persona/Tone
                </label>
                <select
                  id="tone-select"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {tones.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="audience-input" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Target Audience
                </label>
                <input
                  id="audience-input"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Tech Founders, Copywriters"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder-slate-400"
                />
              </div>
            </div>

            {/* Optional / Extra Prompt Details */}
            <div className="space-y-1.5">
              <label htmlFor="extra-prompt-input" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Additional Instructions (Optional)
              </label>
              <input
                id="extra-prompt-input"
                type="text"
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                placeholder="e.g., Include emojis, reference custom discount 'FLOW20'"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Error & Feedback Messages */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {feedbackMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* Launch / Draft Button */}
            <button
              type="submit"
              disabled={isGenerating || creditsRemaining <= 0}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark text-white font-semibold text-sm shadow-md shadow-indigo-950/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-gold animate-pulse" />
              <span>{isGenerating ? 'Synthesizing with Gemini AI...' : 'Generate Content (-20 Credits)'}</span>
            </button>
          </form>
        </div>

        {/* AI Credits Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-amber-55/40 border border-indigo-100/40 dark:from-slate-900/50 dark:to-slate-900/30 dark:border-slate-800 flex items-start gap-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-gold flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {creditsRemaining} AI Generation Credits Remaining
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Every copy creation queries real-time reasoning models and reduces credits count by 20. Optimize content using the content audit panel for 10 credits.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Output Previews & Optimizer Tools */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* State 1: Nothing Generated Yet placeholder */}
        {!generatedResult && !isGenerating && (
          <div className="p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4 py-20 min-h-[500px]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 animate-pulse">
              <Eye className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 font-display">
                Social Campaigns Preview
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Set parameters in the left dock and formulate content ideas. Instantly inspect visual representations, hashtag clusters, or run readability metrics.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl max-w-sm border border-slate-100 dark:border-slate-800/40 text-left">
              <div className="flex items-center gap-1.5 mb-1.5 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-gold-dark" />
                <span>Pro Tip</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Provide rich details like "target persona: SaaS copywriters" or "conclude with a prompt inviting developers to comment" to trigger maximum engagement copy templates.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Active Generation loader */}
        {isGenerating && (
          <div className="p-12 rounded-3xl bg-white border border-slate-200/50 dark:bg-slate-900 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-5 min-h-[500px] animate-pulse">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-primary dark:border-slate-800 dark:border-t-gold animate-spin" />
              <Sparkles className="w-6 h-6 text-gold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping" />
            </div>

            <div className="space-y-1 max-w-xs">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 font-display">
                Formulating Playbook...
              </h4>
              <p className="text-xs text-slate-400">
                Contacting server routes and requesting structured JSON schemas for {type.toUpperCase()} platforms...
              </p>
            </div>

            <div className="space-y-1 pt-4 text-left max-w-sm bg-slate-50 dark:bg-slate-950/30 p-4 border border-slate-100 dark:border-slate-800/50 rounded-xl">
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">Reasoning Pipeline Steps:</div>
              <ul className="text-[10px] text-slate-500 space-y-1 list-disc list-inside mt-1.5">
                <li>Parsing raw topics & targeted keywords list</li>
                <li>Selecting vocabulary matching the {tone} persona</li>
                <li>Enforcing strict character constraints per tweet/post blocks</li>
                <li>Structuring micro-conversions hooks & CTAs</li>
              </ul>
            </div>
          </div>
        )}

        {/* State 3: Content Ready / Live Preview and Audit */}
        {generatedResult && !isGenerating && (
          <div className="space-y-6">
            
            {/* Visual Header Toolbar */}
            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200/50 dark:bg-slate-900/70 dark:border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Format:</span>
                <span className="text-xs font-bold uppercase rounded-lg px-2 py-0.5 bg-primary/10 text-primary dark:bg-gold-dark/10 dark:text-gold-light">
                  {type}
                </span>
                {generatedResult.isSandbox && (
                  <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    SANDBOX
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="p-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  title="Copy formatted text to clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  disabled={isAuditing}
                  onClick={handleAnalyzeContent}
                  className="p-2 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 border border-indigo-200/50 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isAuditing ? 'Auditing...' : 'AI SEO Audit (-10)'}</span>
                </button>
              </div>
            </div>

            {/* THE VISUAL SOCIAL POST PLATFORM PREVIEW MOCKUP */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-display font-bold text-xs text-white">
                    CF
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">ContentFlow Agent</h4>
                    <span className="text-[10px] text-slate-400">@contentflow_hq • Draft Preview</span>
                  </div>
                </div>

                {/* Score estimates badge */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">SEO Friendly</span>
                    <span className="text-xs font-bold font-mono text-emerald-500">{generatedResult.seoScore}/100</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Engagement</span>
                    <span className="text-xs font-bold font-mono text-indigo-500 dark:text-indigo-400">{generatedResult.engagementScore}%</span>
                  </div>
                </div>
              </div>

              {/* Dynamic body parsing depending on Content Format Type */}
              <div className="space-y-4 text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                
                {/* Title display */}
                {generatedResult.title && (
                  <h3 className="text-md font-bold font-display tracking-tight text-slate-900 dark:text-white border-l-2 border-gold pl-2.5">
                    {generatedResult.title}
                  </h3>
                )}

                {/* Body parsing logic */}
                {type === 'twitter' ? (
                  /* Twitter thread split layout */
                  <div className="space-y-4">
                    {generatedResult.body.split('[TWEET_BREAK]').map((tweet, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">Tweet {i + 1}</span>
                          <span>{tweet.trim().length} / 280 chars</span>
                        </div>
                        <p className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-300 font-sans leading-relaxed">
                          {tweet.trim()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Default rendered text block (Supports basic html tags if returned) */
                  <div 
                    className="whitespace-pre-wrap font-sans text-xs sm:text-sm prose dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-slate-800 dark:prose-headings:text-slate-100"
                    dangerouslySetInnerHTML={{ __html: generatedResult.body }}
                  />
                )}

                {/* Keywords cluster footer */}
                {generatedResult.keywords && generatedResult.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-4">
                    {generatedResult.keywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800/30">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI AUDIT RESULT CARD PANEL */}
            {auditResult && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/20 to-violet-50/10 border border-indigo-200/40 dark:from-indigo-950/10 dark:to-slate-900 dark:border-slate-800 space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <span>Gemini SEO & Copywriting Audit</span>
                  </h3>
                  <span className="p-1 px-2.5 rounded-full text-[11px] font-bold font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300">
                    Audit Score: {auditResult.auditScore}/100
                  </span>
                </div>

                {/* Suggestions List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">Readability Suggestions</h4>
                  <ul className="space-y-1.5">
                    {auditResult.suggestions.map((s, index) => (
                      <li key={index} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Headline alternatives section */}
                {auditResult.headlineVariations && auditResult.headlineVariations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-gold" />
                      <span>Alternate Highly-Clickable Headlines</span>
                    </h4>
                    <div className="space-y-1.5">
                      {auditResult.headlineVariations.map((h, i) => (
                        <div key={i} className="flex gap-2 items-center justify-between p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800 p-2 text-xs">
                          <span className="text-slate-700 dark:text-slate-300 line-clamp-1">{h}</span>
                          <button
                            type="button"
                            onClick={() => handleApplyHeadline(h)}
                            className="shrink-0 p-1 px-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Swap Title</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACTIONS TO PERSIST / SCHEDULE POST */}
            <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 dark:bg-slate-900/65 dark:border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Publish Agenda Coordinator</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Save Mode toggle */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 block">Workflow Path</span>
                  <div className="flex gap-2 p-1 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setScheduleStatus('draft')}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer
                        ${scheduleStatus === 'draft' 
                          ? 'bg-primary text-white dark:bg-slate-800 dark:text-gold-light shadow-xs' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}
                      `}
                    >
                      Draft Folder
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleStatus('scheduled')}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer
                        ${scheduleStatus === 'scheduled' 
                          ? 'bg-primary text-white dark:bg-slate-800 dark:text-gold-light shadow-xs' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}
                      `}
                    >
                      Social Calendar
                    </button>
                  </div>
                </div>

                {/* Calendar inputs shown when "Schedule" is active */}
                {scheduleStatus === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-2 animate-fade-in">
                    <div className="space-y-1">
                      <label htmlFor="schedule-date" className="text-[11px] font-semibold text-slate-500 block">Date</label>
                      <input
                        id="schedule-date"
                        type="date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="schedule-time" className="text-[11px] font-semibold text-slate-500 block">Time (UTC)</label>
                      <input
                        id="schedule-time"
                        type="time"
                        required
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Empty block so we align elements nicely on desktop */}
                {scheduleStatus === 'draft' && (
                  <div className="text-[11px] text-slate-400 flex items-center pt-5 italic leading-relaxed">
                    🎯 Drafts folder is ideal for offline editing blocks. Add scheduling slots anytime.
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedResult(null);
                    setAuditResult(null);
                    setTopic("");
                  }}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  Clear Preview
                </button>

                <button
                  type="button"
                  onClick={handleSavePost}
                  className="py-2.5 px-5 rounded-xl bg-slate-800 text-white hover:bg-slate-900 dark:bg-gold dark:hover:bg-gold-light dark:text-primary font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {scheduleStatus === 'draft' ? "Commit to Drafts Backlog" : "Approve and Lock to Calendar Slot"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// Simple internal icon helper for Twitter / X
function ShareTwitterIcon() {
  return (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
