/**
 * Types and interfaces for ContentFlow AI
 */

export type PostType = 'blog' | 'instagram' | 'linkedin' | 'twitter' | 'ad' | 'product';

export interface Post {
  id: string;
  title: string;
  body: string;
  type: PostType;
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

export interface Idea {
  id: string;
  title: string;
  description: string;
  platform: PostType | 'general';
  keywords: string[];
  status: 'backlog' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface OverviewStats {
  totalCreated: number;
  publishedCount: number;
  scheduledCount: number;
  draftCount: number;
  creditsRemaining: number;
  avgEngagement: number;
  avgSeo: number;
  activities: {
    text: string;
    time: string;
    type: 'ai' | 'system' | 'action';
  }[];
}

export type UserRole = 'creator' | 'admin';
export type ActiveTab = 'dashboard' | 'generator' | 'calendar' | 'ideas' | 'analytics';
