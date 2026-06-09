import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, User, Mail, Lock, LogIn, UserPlus, AlertCircle, Cpu, CheckCircle } from "lucide-react";

interface AuthUser {
  email: string;
  name: string;
  role: 'creator' | 'admin';
  creditsRemaining: number;
}

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  
  // Input fields
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<'creator' | 'admin'>("creator");
  
  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quick-fill helper for instant workspace testing
  const handleDemoFill = () => {
    setEmail("creator@contentflow.ai");
    setPassword("password123");
    setIsLogin(true);
    setErrorMsg("");
    setSuccessMsg("Prefilled credentials. Click Login!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!email || !password || (!isLogin && !name)) {
      setErrorMsg("Please complete all the required fields.");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const payload = isLogin 
        ? { email, password } 
        : { email, password, name, role };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Validate your inputs.");
      }

      if (isLogin) {
        setSuccessMsg(`Welcome back, ${data.user.name}! Synchronizing workspace...`);
        // Slight delay to appreciate the beautiful animation
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      } else {
        setSuccessMsg("Account registered successfully! Switching to Login view...");
        setTimeout(() => {
          setIsLogin(true);
          setPassword("");
          setSuccessMsg("Please enter password to complete login setup.");
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Endpoint communication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth_view_container" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans p-4 relative overflow-hidden transition-colors duration-500">
      
      {/* Dynamic decorative backdrop spheres */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl dark:bg-primary/5 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl dark:bg-gold/5 pointer-events-none" />

      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] border border-slate-100 dark:border-slate-800/80 transition-all duration-300">
        
        {/* Left column: Brand Narrative Card */}
        <div className="lg:col-span-5 bg-radial from-slate-900 to-primary text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle design overlays */}
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gold text-primary flex items-center justify-center font-display font-extrabold text-lg shadow-lg shadow-gold/20">
                CF
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight font-display text-white">ContentFlow AI</h1>
                <span className="text-[10px] text-blue-300 font-mono tracking-wider font-light block">PRO AGENT SUITE</span>
              </div>
            </div>
            
            <p className="text-blue-100/90 text-[13px] leading-relaxed font-light pt-4 md:pt-8">
              A premium content management agent and generation suite powered by Google Gemini reasoning engines. Elevate your SaaS dashboard aesthetics, organize social media posts, and design high-converting campaigns under a unified workflow.
            </p>
          </div>

          <div className="space-y-6 pt-12 relative z-10">
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold block text-slate-150">Multi-Channel Planner</span>
                  <span className="text-blue-200/80">Draft blogs, LinkedIn posts, or Twit threads instantly and audit preview dates.</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold block text-slate-150">Gemini Optimization</span>
                  <span className="text-blue-200/80">Calculate dynamic SEO levels and receive precise tone rewrite modifications.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold block text-slate-150">Durable Credit Sandbox</span>
                  <span className="text-blue-200/80">Keep distinct posts and brainstorming ideas separate for each creator credential.</span>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-blue-500/20 flex items-center justify-between text-[11px] text-blue-200">
              <span>Dynamic Multi-User Auth</span>
              <span>v1.2.0</span>
            </div>
          </div>
        </div>

        {/* Right column: Interactive form view */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors">
          <div className="max-w-md w-full mx-auto space-y-8">
            
            {/* Form Header */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gold uppercase tracking-widest mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold animate-bounce" />
                <span>AI Creative Workspace Access</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                {isLogin ? "Welcome back to ContentFlow" : "Register Creator Account"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isLogin ? "Sign in using your account credentials to begin your campaign pipeline." : "Create your credentials to explore private workspace sandboxes."}
              </p>
            </div>

            {/* Quick-Fill demo box */}
            {isLogin && (
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-indigo-900 dark:text-indigo-400">Testing Sandbox?</span> Use instant demo account.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Prefill Demo
                </button>
              </div>
            )}

            {/* Form Inputs Container */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Field (Signup Only) */}
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kalyani Lalugani"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="creator@contentflow.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
                  />
                </div>
              </div>

              {/* Security Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Security Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
                  />
                </div>
              </div>

              {/* Role Select (Signup Only) */}
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Workspace Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'creator' | 'admin')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-gold outline-none transition"
                  >
                    <option value="creator">Content Creator Role (Default)</option>
                    <option value="admin">Platform Manager Admin</option>
                  </select>
                </div>
              )}

              {/* Notifications / Feedback */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-xl flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 px-4 bg-primary text-white hover:bg-primary-dark rounded-xl text-xs font-bold font-display shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin text-gold" />
                    <span>Processing Authorization request...</span>
                  </>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4 text-gold" />
                    <span>Authorize & Access Workspace</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-gold" />
                    <span>Compile Account Credentials</span>
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode Toggle Footer */}
            <div className="pt-6 border-t border-slate-150 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
              {isLogin ? (
                <p>
                  New to ContentFlow?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-primary dark:text-gold font-bold hover:underline cursor-pointer"
                  >
                    Create a free credential
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-primary dark:text-gold font-bold hover:underline cursor-pointer"
                  >
                    Sign in to your account
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
