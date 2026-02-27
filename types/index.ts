export type Category =
  | 'Layoffs'
  | 'Funding'
  | 'Product Launch'
  | 'Regulation'
  | 'Breakthrough'
  | 'Acquisition'
  | 'General';

export type Sentiment = 'positive' | 'negative' | 'neutral';

export type FeedItemType = 'tweet' | 'news';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  content: string;
  author: string;
  source: string;
  url: string;
  imageUrl?: string;
  engagementScore: number;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  category: Category;
  sentiment: Sentiment;
  tags: string[];
  publishedAt: string;
  createdAt: string;
}

export interface TrendingCompany {
  name: string;
  count: number;
  sentiment: Sentiment;
}

export interface SidebarStats {
  trendingCompanies: TrendingCompany[];
  totalLayoffs: number | null;
  totalFunding: string | null;
  lastRefreshed: string;
  totalItems: number;
}

export interface FetchLog {
  id: number;
  type: string;
  status: string;
  count: number;
  error: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalPosts: number;
  totalNews: number;
  lastFetch: string | null;
  fetchLogs: FetchLog[];
  categoryBreakdown: Record<Category, number>;
  sentimentBreakdown: Record<Sentiment, number>;
  topSources: { source: string; count: number }[];
}

export interface ApiResponse<T> {
  data: T;
  cached: boolean;
  timestamp: string;
  error?: string;
}

export interface TwitterRawTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    impression_count: number;
  };
  entities?: {
    urls?: Array<{ expanded_url: string; display_url: string }>;
  };
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    tweet_count: number;
  };
}

export interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage?: string;
  source: { id: string | null; name: string };
  author: string | null;
  publishedAt: string;
}

export interface KeywordCount {
  keyword: string;
  count: number;
  category: Category;
}

export type FilterType = 'all' | 'tweet' | 'news';
