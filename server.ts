import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Robust helper to parse and clean JSON output from Gemini responses
function parseAndCleanJson(rawText: string): any {
  let cleaned = rawText.trim();
  
  // Remove markdown block wraps if they exist
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/i, "").trim();
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3).trim();
    }
  }
  
  // Clean potential trailing characters or surrounding non-json noise
  const firstCurly = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;
  let endToken = "";
  
  if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
    startIdx = firstCurly;
    endToken = "}";
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endToken = "]";
  }
  
  if (startIdx !== -1) {
    const lastIdx = cleaned.lastIndexOf(endToken);
    if (lastIdx !== -1 && lastIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, lastIdx + 1);
    }
  }
  
  return JSON.parse(cleaned);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client Lazily/Safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is not defined in this environment. Content Flow AI will run in Sandbox mode.");
    }
    // Optional chaining / fallback config for safety
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_CRITICAL_FALLBACK",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// In-Memory Database / Store (Pre-seeded with mock data for polished presentation)
interface User {
  id: string;
  email: string;
  passwordHash: string; // Plain comparative password check
  name: string;
  role: 'creator' | 'admin';
  creditsRemaining: number;
}

interface Post {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'blog' | 'instagram' | 'linkedin' | 'twitter' | 'ad' | 'product';
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate?: string;
  engagementScore?: number;
  seoScore?: number;
  keywords?: string[];
  createdAt: string;
  stats?: {
    likes: number;
    shares: number;
    clicks: number;
    comments: number;
  };
}

interface Idea {
  id: string;
  userId: string;
  title: string;
  description: string;
  platform: 'blog' | 'instagram' | 'linkedin' | 'twitter' | 'ad' | 'product' | 'general';
  keywords: string[];
  status: 'backlog' | 'in_progress' | 'completed';
  createdAt: string;
}

let users: User[] = [
  {
    id: "user_1",
    email: "creator@contentflow.ai",
    passwordHash: "password123",
    name: "Demo Creator",
    role: "creator",
    creditsRemaining: 820
  },
  {
    id: "user_2",
    email: "kalyanilalugani1312@gmail.com",
    passwordHash: "password123",
    name: "Kalyani Lalugani",
    role: "admin",
    creditsRemaining: 1000
  }
];

let posts: Post[] = [
  {
    id: "1",
    userId: "user_1",
    title: "10 AI Strategies for Enterprise Scale in 2026",
    body: "Enterprise artificial intelligence is no longer about testing basic chat models. It's about designing agentic workflows that coordinate complex actions across multiple internal databases. In this deep dive, we outline 10 core strategies including database schema automated synchronization, self-healing code compilation, and cost-optimized caching frameworks...",
    type: "blog",
    status: "published",
    seoScore: 92,
    engagementScore: 88,
    keywords: ["Artificial Intelligence", "Enterprise SaaS", "Agentic Frameworks", "Automation"],
    createdAt: "2026-06-01T08:00:00Z",
    stats: { likes: 342, shares: 89, clicks: 1205, comments: 41 }
  },
  {
    id: "2",
    userId: "user_1",
    title: "Designing Delightful User Experiences in Minimalist Dashboards",
    body: "True craftsmanship means executing a focused UI scope with pristine typography, generous negative space, and elegant transitions. Here is how we designed ContentFlow AI using golden amber accents (#C9A227) paired alongside a dark loyal core (#1A1F4E) to establish a distinct, professional visual rhythm.",
    type: "linkedin",
    status: "published",
    seoScore: 88,
    engagementScore: 95,
    keywords: ["Web Design", "UIUX", "SaaS Dashboard", "Typography"],
    createdAt: "2026-06-03T14:30:00Z",
    stats: { likes: 512, shares: 124, clicks: 1845, comments: 76 }
  },
  {
    id: "3",
    userId: "user_1",
    title: "Unveiling ContentFlow AI 🚀 Your Smart SaaS Marketing Agent",
    body: "Say goodbye to creative burnout! ContentFlow AI helps you brainstorm high-performing content ideas, generate SEO-optimized blogs, structure Twitter threads, and schedule them to your favorite social networks instantly. Powered by Gemini’s state-of-the-art reasoning engines.",
    type: "twitter",
    status: "scheduled",
    scheduledDate: "2026-06-12T10:00:00Z",
    seoScore: 85,
    engagementScore: 82,
    keywords: ["SaaS", "Content Marketing", "Artificial Intelligence", "Launch"],
    createdAt: "2026-06-08T09:12:00Z",
    stats: { likes: 0, shares: 0, clicks: 0, comments: 0 }
  },
  {
    id: "4",
    userId: "user_1",
    title: "Instagram Launch Campaign: Smart Workflows",
    body: "Unlock your visual workspace magic 🌟 ContentFlow AI optimizes captions, detects perfect hashtag groups, and estimates post engagement before you go live. Elevate your brand density with tailored display layouts. #SaasUX #MarketingTool #ContentMarketing #AIWriter",
    type: "instagram",
    status: "draft",
    seoScore: 78,
    engagementScore: 71,
    keywords: ["Instagram Marketing", "Visual SaaS", "Creatives"],
    createdAt: "2026-06-09T03:00:00Z",
    stats: { likes: 0, shares: 0, clicks: 0, comments: 0 }
  }
];

let ideas: Idea[] = [
  {
    id: "id_1",
    userId: "user_1",
    title: "Interactive Interactive Audio Synthesizers UI Case Study",
    description: "Write about the visual layout patterns used inside web instruments using React and standard AudioContext",
    platform: "blog",
    keywords: ["Web Audio", "Case Study", "UI Design"],
    status: "backlog",
    createdAt: "2026-06-02T11:00:00Z"
  },
  {
    id: "id_2",
    userId: "user_1",
    title: "TypeScript natively handles Type Stripping in Node 23",
    description: "A quick update explaining how direct TS execution is changing developer experience and toolchains.",
    platform: "twitter",
    keywords: ["TypeScript", "Nodejs", "WebDev"],
    status: "in_progress",
    createdAt: "2026-06-05T15:20:00Z"
  },
  {
    id: "id_3",
    userId: "user_1",
    title: "Boost conversion on your SaaS signup page with direct microcopy changes",
    description: "A carousel for LinkedIn showing 5 tactical changes to call-to-action cards that increase click-through rate.",
    platform: "linkedin",
    keywords: ["Copywriting", "SaaS Growth", "CRO"],
    status: "completed",
    createdAt: "2026-06-07T12:00:00Z"
  }
];

// Helper to seed standard sandbox templates for any new users
function seedUserSandboxData(userId: string) {
  // Check if they already have posts to avoid duplicating
  if (posts.some(p => p.userId === userId)) return;

  const userPosts: Post[] = [
    {
      id: "p1_" + userId,
      userId,
      title: "10 AI Strategies for Enterprise Scale in 2026",
      body: "Enterprise artificial intelligence is no longer about testing basic chat models. It's about designing agentic workflows that coordinate complex actions across multiple internal databases. In this deep dive, we outline 10 core strategies including database schema automated synchronization, self-healing code compilation, and cost-optimized caching frameworks...",
      type: "blog",
      status: "published",
      seoScore: 92,
      engagementScore: 88,
      keywords: ["Artificial Intelligence", "Enterprise SaaS", "Agentic Frameworks", "Automation"],
      createdAt: "2026-06-01T08:00:00Z",
      stats: { likes: 342, shares: 89, clicks: 1205, comments: 41 }
    },
    {
      id: "p2_" + userId,
      userId,
      title: "Designing Delightful User Experiences in Minimalist Dashboards",
      body: "True craftsmanship means executing a focused UI scope with pristine typography, generous negative space, and elegant transitions. Here is how we designed ContentFlow AI using golden amber accents (#C9A227) paired alongside a dark loyal core (#1A1F4E) to establish a distinct, professional visual rhythm.",
      type: "linkedin",
      status: "published",
      seoScore: 88,
      engagementScore: 95,
      keywords: ["Web Design", "UIUX", "SaaS Dashboard", "Typography"],
      createdAt: "2026-06-03T14:30:00Z",
      stats: { likes: 512, shares: 124, clicks: 1845, comments: 76 }
    },
    {
      id: "p3_" + userId,
      userId,
      title: "Unveiling ContentFlow AI 🚀 Your Smart SaaS Marketing Agent",
      body: "Say goodbye to creative burnout! ContentFlow AI helps you brainstorm high-performing content ideas, generate SEO-optimized blogs, structure Twitter threads, and schedule them to your favorite social networks instantly.",
      type: "twitter",
      status: "scheduled",
      scheduledDate: "2026-06-12T10:00:00Z",
      seoScore: 85,
      engagementScore: 82,
      keywords: ["SaaS", "Content Marketing", "Artificial Intelligence", "Launch"],
      createdAt: "2026-06-08T09:12:00Z",
      stats: { likes: 0, shares: 0, clicks: 0, comments: 0 }
    }
  ];

  const userIdeas: Idea[] = [
    {
      id: "i1_" + userId,
      userId,
      title: "Interactive Interactive Audio Synthesizers UI Case Study",
      description: "Write about the visual layout patterns used inside web instruments using React and standard AudioContext",
      platform: "blog",
      keywords: ["Web Audio", "Case Study", "UI Design"],
      status: "backlog",
      createdAt: "2026-06-02T11:00:00Z"
    },
    {
      id: "i2_" + userId,
      userId,
      title: "TypeScript natively handles Type Stripping in Node 23",
      description: "A quick update explaining how direct TS execution is changing developer experience and toolchains.",
      platform: "twitter",
      keywords: ["TypeScript", "Nodejs", "WebDev"],
      status: "in_progress",
      createdAt: "2026-06-05T15:20:00Z"
    }
  ];

  posts.push(...userPosts);
  ideas.push(...userIdeas);
}

// Authentication Middleware
const authenticateUser = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing authentication header." });
  }

  // Get email from authorization header
  const email = authHeader.replace(/^Bearer\s+/, "").trim();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(401).json({ error: "Unauthorized session. Please login again." });
  }

  req.user = user;
  next();
};

// Auth API endpoints
app.post("/api/auth/signup", (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Please provide all required fields: email, password, name" });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "A user account with this email already exists." });
  }

  const newUser: User = {
    id: "user_" + Math.random().toString(36).substring(2, 9),
    email: email.trim(),
    passwordHash: password, // custom sandbox comparative verification
    name: name.trim(),
    role: role || "creator",
    creditsRemaining: 1000
  };

  users.push(newUser);
  // Seed fallback records for the new account so they have an active interactive experience
  seedUserSandboxData(newUser.id);

  res.status(201).json({
    success: true,
    user: {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      creditsRemaining: newUser.creditsRemaining
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials fields." });
  }

  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Auto-onboard user dynamically for full sandbox flexibility
    const nameStr = email.split("@")[0] || "Workspace Creator";
    const beautifiedName = nameStr.split(/[._-]/).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    
    user = {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      email: email.trim(),
      passwordHash: password,
      name: beautifiedName,
      role: email.toLowerCase().includes("admin") ? "admin" : "creator",
      creditsRemaining: 1000
    };
    users.push(user);
    seedUserSandboxData(user.id);
  } else if (user.passwordHash !== password) {
    return res.status(400).json({ error: "Incorrect email address or security credential." });
  }

  // Seed sample content if they somehow lost it or just registered
  seedUserSandboxData(user.id);

  res.json({
    success: true,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
      creditsRemaining: user.creditsRemaining
    }
  });
});

app.get("/api/auth/me", authenticateUser, (req: any, res) => {
  res.json({
    success: true,
    user: {
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      creditsRemaining: req.user.creditsRemaining
    }
  });
});

// 1. Get stats overview
app.get("/api/overview", authenticateUser, (req: any, res) => {
  const userPosts = posts.filter(p => p.userId === req.user.id);
  
  const publishedCount = userPosts.filter(p => p.status === "published").length;
  const scheduledCount = userPosts.filter(p => p.status === "scheduled").length;
  const draftCount = userPosts.filter(p => p.status === "draft").length;
  
  // Calculate average engagement & SEO scores for published
  const publishedPosts = userPosts.filter(p => p.status === "published");
  const avgEngagement = publishedPosts.length 
    ? Math.round(publishedPosts.reduce((acc, curr) => acc + (curr.engagementScore || 0), 0) / publishedPosts.length) 
    : 85;
  const avgSeo = publishedPosts.length
    ? Math.round(publishedPosts.reduce((acc, curr) => acc + (curr.seoScore || 0), 0) / publishedPosts.length)
    : 80;

  // Recent activity logs
  const activities = [
    { text: "Successfully generated content previews", time: "15 minutes ago", type: "ai" },
    { text: "Scheduled and synchronized active social calendars", time: "2 hours ago", type: "system" },
    { text: "Upgraded ideas and upgraded flow backlog priorities", time: "4 hours ago", type: "action" },
    { text: "Added drafts inside workspace modules", time: "1 day ago", type: "action" }
  ];

  res.json({
    totalCreated: userPosts.length,
    publishedCount,
    scheduledCount,
    draftCount,
    creditsRemaining: req.user.creditsRemaining,
    avgEngagement,
    avgSeo,
    activities
  });
});

// 2. Posts APIs
app.get("/api/posts", authenticateUser, (req: any, res) => {
  const userPosts = posts.filter(p => p.userId === req.user.id);
  // Sort posts by creation date desc
  const sortedPosts = [...userPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sortedPosts);
});

app.post("/api/posts", authenticateUser, (req: any, res) => {
  const { title, body, type, status, scheduledDate, keywords } = req.body;
  if (!title || !body || !type) {
    return res.status(400).json({ error: "Missing required fields: title, body, type" });
  }

  // Auto-estimate SEO and engagement score for new posts
  const seoScore = Math.floor(Math.random() * 20) + 75; // 75-95
  const engagementScore = Math.floor(Math.random() * 25) + 70; // 70-95

  const newPost: Post = {
    id: Math.random().toString(36).substring(2, 9),
    userId: req.user.id,
    title,
    body,
    type,
    status: status || 'draft',
    scheduledDate: status === 'scheduled' ? scheduledDate : undefined,
    seoScore,
    engagementScore,
    keywords: keywords || [],
    createdAt: new Date().toISOString(),
    stats: { likes: 0, shares: 0, clicks: 0, comments: 0 }
  };

  posts.push(newPost);
  res.status(201).json(newPost);
});

app.put("/api/posts/:id", authenticateUser, (req: any, res) => {
  const { id } = req.params;
  const index = posts.findIndex(p => p.id === id && p.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ error: "Post not found or unauthorized access" });
  }

  const updatedPost = {
    ...posts[index],
    ...req.body,
  };

  posts[index] = updatedPost;
  res.json(updatedPost);
});

app.delete("/api/posts/:id", authenticateUser, (req: any, res) => {
  const { id } = req.params;
  const initialLen = posts.length;
  posts = posts.filter(p => !(p.id === id && p.userId === req.user.id));
  
  if (posts.length === initialLen) {
    return res.status(404).json({ error: "Post not found or unauthorized access" });
  }
  res.json({ success: true, message: "Post deleted" });
});

// 3. Ideas APIs
app.get("/api/ideas", authenticateUser, (req: any, res) => {
  const userIdeas = ideas.filter(i => i.userId === req.user.id);
  res.json(userIdeas);
});

app.post("/api/ideas", authenticateUser, (req: any, res) => {
  const { title, description, platform, keywords, status } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required for custom ideas." });
  }

  const newIdea: Idea = {
    id: "id_" + Math.random().toString(36).substring(2, 9),
    userId: req.user.id,
    title,
    description: description || "",
    platform: platform || "general",
    keywords: keywords || [],
    status: status || "backlog",
    createdAt: new Date().toISOString()
  };

  ideas.push(newIdea);
  res.status(201).json(newIdea);
});

app.put("/api/ideas/:id", authenticateUser, (req: any, res) => {
  const { id } = req.params;
  const index = ideas.findIndex(i => i.id === id && i.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ error: "Idea not found or unauthorized access" });
  }

  ideas[index] = {
    ...ideas[index],
    ...req.body
  };
  res.json(ideas[index]);
});

app.delete("/api/ideas/:id", authenticateUser, (req: any, res) => {
  const { id } = req.params;
  const initialLen = ideas.length;
  ideas = ideas.filter(i => !(i.id === id && i.userId === req.user.id));
  
  if (ideas.length === initialLen) {
    return res.status(404).json({ error: "Idea not found or unauthorized access" });
  }
  res.json({ success: true });
});

// 4. Gemini AI operations

// Generate Content via AI API
app.post("/api/gemini/generate", authenticateUser, async (req: any, res) => {
  if (req.user.creditsRemaining <= 0) {
    return res.status(400).json({ error: "Insufficient AI credits remaining. Reset your workspace to try again!" });
  }

  const { type, topic, tone, targetAudience, extraPrompt } = req.body;
  if (!type || !topic) {
    return res.status(400).json({ error: "Please specify post format type and core topic." });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Sandbox fallback mode - mock generated response if API Key is not set up
      req.user.creditsRemaining = Math.max(0, req.user.creditsRemaining - 20);
      const parsedMock = getMockGeneration(type, topic, tone || "professional");
      return res.json({
        title: parsedMock.title,
        body: parsedMock.body,
        keywords: parsedMock.keywords,
        seoScore: parsedMock.seoScore,
        engagementScore: parsedMock.engagementScore,
        creditsUsed: 20,
        creditsRemaining: req.user.creditsRemaining,
        isSandbox: true
      });
    }

    const ai = getGeminiClient();
    
    // Formulate a structured format request prompt
    const systemInstruction = 
      "You are ContentFlow AI, a premium copywriter who produces ultra-polished, ready-to-publish content " +
      "optimized for specific platforms and exceptional target engagement. Keep your syntax flawless and clean.";

    const platformGuidance = {
      blog: "Write a complete, structured blog post with an appealing heading, introductory hook, section subtitles, and a powerful call to action. 300 to 500 words.",
      instagram: "Write a highly visual caption. Start with a captivating line, include line breaks for optimal legibility, outline core takeaways, and append a cohesive list of 5 to 8 trending relevant hashtags. Keep it engaging and fun.",
      linkedin: "Write an editorial post suited for professional networks. Begin with an industry insight, provide 3 readable structured points using bullet points or emojis, and include a question to spark comment thread discussion.",
      twitter: "Write an engaging Twitter/X post or a short 3-part thread. Use concise, high-impact phrasing. Ensure strict compliance with 280-character counts per tweet, separated with [TWEET_BREAK].",
      ad: "Write short-form persuasive ad copy (Headline, Core Hook, Body, Call to Action, and Benefits points). Focused heavily on click conversions.",
      product: "Write a high-converting product description including a rich sensory title, bulleted key features, and target user persona matches."
    }[type as string] || "Write elegant marketing content.";

    const fullPrompt = `Topic: ${topic}
Format: ${type}
Tone: ${tone || 'professional'}
Target Audience: ${targetAudience || 'general professional public'}
Additional Directions: ${extraPrompt || 'none'}

${platformGuidance}

Return your answer strictly as a valid JSON object matching this schema. Do not output anything outside of the JSON block:
{
  "title": "A highly clickable title or catchy headline fitting the platform",
  "body": "The full synthesized body content with complete formatting",
  "keywords": ["array", "of", "3-5", "relevant", "keywords"],
  "seoScore": 88, // estimated SEO friendliness out of 100
  "engagementScore": 92 // estimated post value out of 100
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            seoScore: { type: Type.INTEGER },
            engagementScore: { type: Type.INTEGER }
          },
          required: ["title", "body", "keywords", "seoScore", "engagementScore"]
        },
        temperature: 0.8,
      }
    });

    const data = parseAndCleanJson(response.text || "{}");

    req.user.creditsRemaining = Math.max(0, req.user.creditsRemaining - 20);

    res.json({
      title: data.title || `${topic} in ${tone} tone`,
      body: data.body || "",
      keywords: data.keywords || [topic],
      seoScore: data.seoScore || 85,
      engagementScore: data.engagementScore || 85,
      creditsUsed: 20,
      creditsRemaining: req.user.creditsRemaining,
      isSandbox: false
    });

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate content using Gemini. Try sandbox generation instead." });
  }
});

// AI suggestions for improving & optimizing SEO and readability engagement
app.post("/api/gemini/analyze", authenticateUser, async (req: any, res) => {
  const { title, body, type } = req.body;
  if (!body) {
    return res.status(400).json({ error: "Content body is required for AI audit." });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Sandbox fallback mode
      req.user.creditsRemaining = Math.max(0, req.user.creditsRemaining - 10);
      return res.json({
        auditScore: 89,
        seoScore: 91,
        suggestions: [
          "Incorporate 2 more specific keywords in the first 100 words to improve context density",
          "Shorten your third paragraph from 4 sentences to 2 for improved mobile reading patterns",
          "Include an explicit call-to-action directive like 'Let us know in the comments!'",
          "Your current reading level is intermediate—ideal for this software industry target!"
        ],
        headlineVariations: [
          `Ultimate Hack Guide: ${title || 'Your Topic'}`,
          `Why Every SaaS Brand Needs ${title || 'This Platform'}`,
          `Secrets of High-Converting ${title || 'Content Flow'}`
        ],
        creditsRemaining: req.user.creditsRemaining
      });
    }

    const ai = getGeminiClient();
    const prompt = `Analyze this piece of content for readability, SEO optimization, and target social media engagement potential.
Title: ${title || "Untitled"}
Format Type: ${type || "general"}
Body: ${body}

Return a solid review formatted strictly as a single JSON object. Do not include markdown tags wraps outside the raw JSON:
{
  "auditScore": 85, // estimated overall content health out of 100
  "seoScore": 80, // seo capability
  "suggestions": [
     "detailed visual optimization instruction 1",
     "SEO or keyword placement advice 2",
     "sentence formatting or CTA advice 3"
  ],
  "headlineVariations": [
     "Alternate dynamic optimized headline option 1",
     "Alternate dynamic optimized headline option 2",
     "Alternate dynamic optimized headline option 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            auditScore: { type: Type.INTEGER },
            seoScore: { type: Type.INTEGER },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            headlineVariations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["auditScore", "seoScore", "suggestions", "headlineVariations"]
        },
        temperature: 0.7,
      }
    });

    const review = parseAndCleanJson(response.text || "{}");
    req.user.creditsRemaining = Math.max(0, req.user.creditsRemaining - 10);

    res.json({
      auditScore: review.auditScore || 85,
      seoScore: review.seoScore || 85,
      suggestions: review.suggestions || ["Add a strong question to conclude your post."],
      headlineVariations: review.headlineVariations || [`Optimized: ${title}`],
      creditsRemaining: req.user.creditsRemaining
    });

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze content using Gemini." });
  }
});

// AI Ideas Brainstorm
app.post("/api/gemini/brainstorm-ideas", authenticateUser, async (req: any, res) => {
  const { topic, platform } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required to spark ideas." });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({
        ideas: [
          {
            title: `Why traditional ${topic} is broken in 2026`,
            description: "An opinion-driven deep dive pointing out outdated habits and proposing immediate fixes for growth.",
            keywords: [topic, "Trends", "IndustryFix"],
            platform: platform || "blog"
          },
          {
            title: `5 micro-lessons on ${topic} everyone should know`,
            description: "A bulleted carousel breakdown focused heavily on tactical takeaways and clear visual examples.",
            keywords: [topic, "Educational", "Growth Hacks"],
            platform: platform || "linkedin"
          },
          {
            title: `Cheat sheet for mastering ${topic}`,
            description: "A comprehensive high-value reference table checklist that users want to bookmark instantly.",
            keywords: [topic, "Cheatsheet", "ContentTools"],
            platform: platform || "twitter"
          }
        ]
      });
    }

    const ai = getGeminiClient();
    const prompt = `Brainstorm 3 high-impact, actionable, clickable content ideas with topics based on:
Topic Area: ${topic}
Preferred Platform: ${platform || 'general / all platforms'}

Generate the list of ideas strictly as a JSON object of this structure with no supplementary text markup:
{
  "ideas": [
    {
      "title": "Inspiring Specific Idea Title",
      "description": "Short explanation of the post angle / story line",
      "keywords": ["keyword1", "keyword2"],
      "platform": "${platform || 'blog'}"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  platform: { type: Type.STRING }
                },
                required: ["title", "description", "keywords", "platform"]
              }
            }
          },
          required: ["ideas"]
        },
        temperature: 0.85,
      }
    });

    const data = parseAndCleanJson(response.text || "{}");
    res.json({ ideas: data.ideas || [] });

  } catch (error: any) {
    console.error("Gemini Brainstorm Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate brainstorm results." });
  }
});

// Admin reset endpoint
app.post("/api/reset", authenticateUser, (req: any, res) => {
  req.user.creditsRemaining = 1000;
  res.json({ success: true, creditsRemaining: req.user.creditsRemaining });
});

// Fallback mock engine helper
function getMockGeneration(type: string, topic: string, tone: string) {
  const formattedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  const titles = {
    blog: `The Ultimate Guide to ${formattedTopic} (2026 Edition)`,
    instagram: `Unlocking ${formattedTopic} Potential ✨`,
    linkedin: `How ${formattedTopic} Drives Modern Growth & Innovation`,
    twitter: `Mastering ${formattedTopic} [A Quick Thread] 👇`,
    ad: `Get Your Brand Noticed: Discover high-performance ${formattedTopic}!`,
    product: `Enterprise ${formattedTopic} Engine v2.0`
  };

  const bodies = {
    blog: `<h1>The New Era of ${formattedTopic}</h1>\n\n<p>In the fast-moving modern workspace, mastering <strong>${topic}</strong> has transformed from an option to a core prerequisite. Whether you are scaling a remote team or building a personal platform, knowing the exact structural frameworks can save you hours of wasted manual effort.</p>\n\n<h3>1. Build with Intentional Density</h3>\n<p>Don't write fluffy text. Craftsmanship requires deliberate structures, high-density bullet points, and responsive feedback cycles. When users interface with your products, they should immediately understand the exact functional outcomes you enable.</p>\n\n<h3>2. Optimize and Iterate</h3>\n<p>Analyze your SEO ranks and engagement ratings weekly. Make slight, regular adjustments to hook phrases and visual hierarchy. Stay consistent!</p>Defaults`,
    
    instagram: `Ready to master ${topic}? 🌟\n\nHere are the 3 actions you need to take today:\n\n1️⃣ Audit your current pipeline and remove single points of failure.\n2️⃣ Structure clean paragraphs with distinct margins.\n3️⃣ Refine your call-to-action to spark conversational threads.\n\nSave this for later and share with a founder who needs this check!\n\n#${formattedTopic.replace(/\s+/g, '')} #SaaS #GrowthMindset #ContentCreator #ModernDesign #AITemplate`,
    
    linkedin: `In modern SaaS development, **${topic}** is evolving at a breakneck pace.\n\nOver the past few months, we've interviewed over 100 content strategists, engineers, and product designers. The major takeaway is clear:\n\n💡 Consolidating too many parameters into complex systems limits your flexibility. Modular, highly readable blocks survive market transitions better.\n\nHere are our top 3 guidelines:\n- Standardize on Inter typography for professional readability.\n- Prefer light-mode neutral palettes with high contrast for comfortable long-term work sessions.\n- Build actual APIs first, reserving mock layers purely for local offline developer testing.\n\nLet’s hear from you: how is your brand tackling this shift today? Leave your thoughts below! 👇`,
    
    twitter: `1/ Mastering ${topic} doesn't require a master's degree. It requires a repeatable, structured playbook.\n\nHere is how you can level up your workflow in less than 3 minutes: [THREAD] 🧵 [TWEET_BREAK]\n2/ Focus purely on high-contrast, distraction-free views. Strip out persistent sidebars, terminal indicators, and mock telemetry. Simplicity is sophistication. [TWEET_BREAK]\n3/ Leverage server-side integration tools like Gemini to draft blogs and optimized keywords in real time. \n\nLiked this? Follow for daily design tips! 🚀`,
    
    ad: `⚡ STUCK ON ${formattedTopic.toUpperCase()}?\n\nStop wasting 10+ hours a week staring at a blank page. ContentFlow AI uses Gemini's intelligence to compose SEO-optimized blogs, catchy Instagram captions, and high-converting marketing Copy in seconds.\n\n👉 Click 'Sign Up' to start generating for FREE today!`,
    
    product: `Introducing the **${formattedTopic} Productivity Suite** – your new full-stack companion for content scaling. Engineered with an executive navy UI (#1A1F4E) and premium amber accents, it features real-time social campaign planners, smart SEO scoring, and state-of-the-art text drafting. Built from the ground up to empower independent creative freelancers and agile agency content managers.`
  };

  const selectedTitle = titles[type as keyof typeof titles] || `Boost Your Workflow: ${formattedTopic}`;
  const selectedBody = bodies[type as keyof typeof bodies] || `This is a pre-synthesized creative draft about ${topic} utilizing a ${tone} writing tone. It is fully ready for export.`;

  return {
    title: selectedTitle,
    body: selectedBody,
    keywords: [formattedTopic, "SaaS", tone, "Marketing"],
    seoScore: 88,
    engagementScore: 90
  };
}

// Vite integration & routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ContentFlow AI full-stack server listening on http://localhost:${PORT}`);
  });
}

startServer();
