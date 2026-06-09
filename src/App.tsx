import React, { useState, useEffect } from "react";
import { ActiveTab, Post, Idea, OverviewStats, UserRole } from "./types";
import DashboardView from "./components/DashboardView";
import GeneratorView from "./components/GeneratorView";
import CalendarView from "./components/CalendarView";
import IdeasView from "./components/IdeasView";
import AnalyticsView from "./components/AnalyticsView";
import AuthView from "./components/AuthView";
import { 
  BarChart2, 
  Calendar, 
  Cpu, 
  Layers, 
  Layout, 
  Sparkles, 
  Sun, 
  Moon, 
  User, 
  UserCheck, 
  Menu, 
  X, 
  LogOut, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  BookOpen,
  Settings
} from "lucide-react";

interface AuthUser {
  email: string;
  name: string;
  role: 'creator' | 'admin';
  creditsRemaining: number;
}

export default function App() {
  // Global Session state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("contentflow_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Global View states
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Sync state pools
  const [posts, setPosts] = useState<Post[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState<OverviewStats>({
    totalCreated: 0,
    publishedCount: 0,
    scheduledCount: 0,
    draftCount: 0,
    creditsRemaining: 1000,
    avgEngagement: 85,
    avgSeo: 80,
    activities: []
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorHeader, setErrorHeader] = useState<string>("");

  // Temporary container bridge states to populate generator parameters from Ideas view
  const [bridgeTopic, setBridgeTopic] = useState("");
  const [bridgeType, setBridgeType] = useState<string>("blog");

  // Load initial dataset from backend APIs
  const fetchAllData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const headers = { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.email}`
      };
      const [statsRes, postsRes, ideasRes] = await Promise.all([
        fetch("/api/overview", { headers }),
        fetch("/api/posts", { headers }),
        fetch("/api/ideas", { headers })
      ]);

      if (!statsRes.ok || !postsRes.ok || !ideasRes.ok) {
        if (statsRes.status === 401 || postsRes.status === 401) {
          // Session expired
          handleLogout();
          return;
        }
        throw new Error("Backend server APIs returned errors during database refresh.");
      }

      const statsData = await statsRes.json();
      const postsData = await postsRes.json();
      const ideasData = await ideasRes.json();

      setStats(statsData);
      setPosts(postsData);
      setIdeas(ideasData);
      setErrorHeader("");

      // Keep user object credits count in sync
      if (currentUser.creditsRemaining !== statsData.creditsRemaining) {
        const updated = { ...currentUser, creditsRemaining: statsData.creditsRemaining };
        setCurrentUser(updated);
        localStorage.setItem("contentflow_user", JSON.stringify(updated));
      }
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
      setErrorHeader("Failing to establish continuous pipe to content databases. Running local state.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [activeTab, currentUser?.email]);

  // Handle Dark mode theme class triggers
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Method to log custom timeline actions via server or in state
  const handleActivityLog = (text: string, type: 'ai' | 'action' | 'system') => {
    const newActivity = {
      text,
      time: "Just now",
      type
    };
    
    setStats(prev => ({
      ...prev,
      activities: [newActivity, ...prev.activities].slice(0, 8) // keep 8
    }));
  };

  // REST API Actions

  // 1. Reset credit counts (Admin override)
  const handleResetCredits = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/reset", { 
        method: "POST",
        headers: { "Authorization": `Bearer ${currentUser.email}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(prev => ({
          ...prev,
          creditsRemaining: data.creditsRemaining
        }));
        
        const updated = { ...currentUser, creditsRemaining: data.creditsRemaining };
        setCurrentUser(updated);
        localStorage.setItem("contentflow_user", JSON.stringify(updated));

        handleActivityLog("Reset workspace credits quotas back to full 1,000 allowance.", "system");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Created Social Post
  const handlePostCreated = async (postData: {
    title: string;
    body: string;
    type: string;
    status: 'draft' | 'scheduled' | 'published';
    scheduledDate?: string;
    keywords?: string[];
  }) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.email}`
        },
        body: JSON.stringify(postData)
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Update Social Post Fields (Status change, Title update, Body, etc.)
  const handleUpdatePost = async (id: string, updatedFields: Partial<Post>) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.email}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Delete Social Post
  const handleDeletePost = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${currentUser.email}` }
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Add custom Idea
  const handleAddIdea = async (ideaData: { title: string; description: string; platform: string }) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.email}`
        },
        body: JSON.stringify({
          title: ideaData.title,
          description: ideaData.description,
          platform: ideaData.platform,
          status: "backlog"
        })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Update Idea Status (move column step)
  const handleUpdateIdea = async (id: string, updatedFields: Partial<Idea>) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/ideas/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.email}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Delete content Idea
  const handleDeleteIdea = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/ideas/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${currentUser.email}` }
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 8. Convert brainstorming idea into generator view directly!
  const handleConvertIdeaToDraft = (title: string, platform: string, description: string) => {
    setBridgeTopic(`${title}. Context angle: ${description}`);
    
    // Validate matching platform type mapping if exists
    const safeTypeMap: { [key: string]: string } = {
      blog: "blog",
      linkedin: "linkedin", 
      twitter: "twitter",
      instagram: "instagram"
    };

    setBridgeType(safeTypeMap[platform] || "blog");
    setActiveTab("generator");
    handleActivityLog(`Loaded brainstorming thread model: "${title.substring(0, 20)}..." into generator engine workspace.`, "action");
  };

  // Logout session trigger
  const handleLogout = () => {
    localStorage.removeItem("contentflow_user");
    setCurrentUser(null);
    setPosts([]);
    setIdeas([]);
    setActiveTab("dashboard");
  };

  // Navigation mapping object containing labels, icons
  const navTabs = [
    { id: "dashboard", label: "Dashboard", icon: <Layout className="w-4 h-4" /> },
    { id: "generator", label: "AI Copywriter", icon: <Sparkles className="w-4 h-4 text-gold animate-pulse" /> },
    { id: "calendar", label: "Campaign Calendar", icon: <Calendar className="w-4 h-4" /> },
    { id: "ideas", label: "Workflow Ideas", icon: <Layers className="w-4 h-4" /> },
    { id: "analytics", label: "Audience Analytics", icon: <BarChart2 className="w-4 h-4" /> },
  ] as const;

  // Intercept and redirect to Auth validation screen if session is inactive
  if (!currentUser) {
    return (
      <AuthView 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("contentflow_user", JSON.stringify(user));
        }} 
      />
    );
  }

  const userRole: UserRole = currentUser.role || "creator";

  return (
    <div className="min-h-screen flex text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors font-sans">
      
      {/* 1. SIDEBAR NAVIGATION: Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary text-white shrink-0 border-r border-primary-dark select-none h-screen sticky top-0">
        
        {/* Brand Banner */}
        <div className="p-6 border-b border-primary-light flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold text-primary flex items-center justify-center font-display font-extrabold text-base">
              CF
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight font-display text-white">ContentFlow AI</h1>
              <span className="text-[10px] text-blue-300 font-mono tracking-wider font-light">PRO AGENT SUITE</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto font-sans">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer group
                ${activeTab === tab.id 
                  ? 'bg-gold text-primary shadow-md font-bold' 
                  : 'text-blue-100 hover:bg-primary-light/40 hover:text-white'}
              `}
            >
              <span className={`shrink-0 transition-transform group-hover:scale-105 duration-200
                ${activeTab === tab.id ? 'text-primary' : 'text-blue-200'}
              `}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* Global toggles inside baseline sidebar footer */}
        <div className="p-4 border-t border-primary-light space-y-4 bg-primary-dark/30">
          
          {/* Quick Credit Display */}
          <div className="space-y-1 p-3 bg-primary-light/10 border border-primary-light/20 rounded-xl">
            <div className="flex items-center justify-between text-[10px] font-bold text-blue-200">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-gold" />
                <span>AI CREDITS</span>
              </span>
              <span className="font-mono text-gold-light">{stats.creditsRemaining} / 1000</span>
            </div>
            <div className="w-full bg-primary-dark/80 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-gold h-1 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (stats.creditsRemaining / 1000) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-blue-200">
            {/* Theme switcher */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-primary-light/35 hover:bg-primary-light/60 text-white cursor-pointer"
              title={darkMode ? "Switch to comfortable Light Mode" : "Switch to eye-safe SaaS Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
            </button>

            {/* Account Logged Persona Info */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold tracking-wide uppercase bg-gold/15 text-gold px-2 py-1 rounded-md">
                {currentUser.role === 'admin' ? "PLATFORM ADMIN" : "CREATOR ROLE"}
              </span>
            </div>
          </div>

          {/* Secure Logout CTA */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-100 hover:text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 cursor-pointer transition border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Sign Out Workspace</span>
          </button>
        </div>
      </aside>

      {/* 2. RESPONSIVE CONTAINER & TOP BAR HEADER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR HEADER */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 dark:border-slate-800/80 dark:bg-slate-900 shadow-xs">
          
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-200 lg:hidden cursor-pointer"
              aria-label="Toggle structural menu link panel"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Title representing active context */}
            <div className="font-display">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white capitalize flex items-center gap-1.5">
                <span>{navTabs.find(t => t.id === activeTab)?.label}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active User Email profile tag */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-[11px] font-semibold">
              <div className="w-5 h-5 rounded-full bg-primary/10 dark:bg-amber-500/15 flex items-center justify-center text-primary dark:text-gold-light">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 dark:text-slate-300 max-w-[170px] truncate" title={currentUser.email}>{currentUser.name || currentUser.email}</span>
            </div>

            {/* Quick theme toggler for mobile users */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-200 cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
            </button>

            {/* Logout trigger topbar for easier mobile checkout */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-slate-500 dark:text-slate-300 transition cursor-pointer"
              title="Sign Out Account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 3. MOBILE DIRECTORY DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex">
            <div className="w-64 bg-primary text-white h-full relative flex flex-col p-5 space-y-6">
              
              <div className="flex items-center justify-between border-b border-primary-light pb-3">
                <span className="font-bold text-sm">ContentFlow AI Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-blue-300" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                {navTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs text-left flex items-center gap-3
                      ${activeTab === tab.id ? 'bg-gold text-primary font-bold' : 'text-blue-100 hover:bg-primary-light/40'}
                    `}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Sidebar baselines */}
              <div className="border-t border-primary-light pt-4 space-y-4">
                <div className="text-center">
                  <div className="text-[10px] text-blue-150">Logged In Creator</div>
                  <span className="text-[11px] font-semibold text-white block truncate" title={currentUser.email}>
                    {currentUser.name} ({currentUser.email})
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span>Authorization:</span>
                  <span className="font-mono text-[10px] font-bold text-gold uppercase bg-gold/15 px-2 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2 bg-red-500/20 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition border border-red-500/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Account</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. MAIN CENTRAL PAGE PANEL CONTENT */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {/* Global network fail warning indicator */}
          {errorHeader && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorHeader}</span>
            </div>
          )}

          {/* Core Page Tab Routing */}
          {activeTab === "dashboard" && (
            <DashboardView 
              stats={stats}
              role={userRole}
              onNavigate={setActiveTab}
              onResetCredits={handleResetCredits}
              isLoading={isLoading}
            />
          )}

          {activeTab === "generator" && (
            <GeneratorView
              creditsRemaining={stats.creditsRemaining}
              onPostCreated={handlePostCreated}
              onActivityLog={handleActivityLog}
              onRefreshStats={fetchAllData}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarView 
              posts={posts}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              onActivityLog={handleActivityLog}
            />
          )}

          {activeTab === "ideas" && (
            <IdeasView 
              ideas={ideas}
              onAddIdea={handleAddIdea}
              onUpdateIdea={handleUpdateIdea}
              onDeleteIdea={handleDeleteIdea}
              onConvertIdeaToDraft={handleConvertIdeaToDraft}
              onActivityLog={handleActivityLog}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView 
              posts={posts}
              stats={stats}
            />
          )}

        </main>
      </div>

    </div>
  );
}
