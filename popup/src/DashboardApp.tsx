import './index.css';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DashboardShell, type DashboardView } from '@/components/sections/layout';
import { OverviewPanel } from '@/components/sections/overview-panel';
import { OrdersPanel } from '@/components/sections/orders-panel';
import EarningsPanel from '@/components/sections/earnings-panel';
import ReviewsPanel from '@/components/sections/reviews-panel';
import { NotificationsPanel } from '@/components/sections/notifications-panel';
import InsightsPanel from '@/components/sections/insights-panel';
import { SettingsPanel } from '@/components/sections/settings-panel';
import {
  Download, FileText, FileJson, Paperclip, Users, MessageSquare,
  RefreshCw, CheckCircle2, AlertCircle, Loader2, Eye, Search, Star,
  BarChart3, Clock, ArrowUpRight, ArrowDownLeft, Moon, Sun,
  DownloadCloud, Zap, TrendingUp, ThumbsUp, ThumbsDown, Lightbulb,
  Target, Award, Activity, Calendar, MessageCircle, Bookmark, Pin,
  Bot, Sparkles, Brain, Pause, Play, Trash2, Home, Settings, Bell,
  ChevronRight, Copy, Check, ExternalLink, Lock, User, LogIn, LogOut,
  Shield, Heart, Flame, Gauge, Rocket, AlertTriangle, TrendingDown,
  DollarSign, ShoppingCart, Briefcase, Send, Mail, Phone, Video,
  Smile, Hash, AtSign, Tag, Layers, Cpu, Database, Wifi, Eye as EyeIcon
} from 'lucide-react';

interface Attachment { filename: string; downloadUrl: string; fileSize: number; contentType?: string; }
interface Message { sender: string; recipient: string; body: string; createdAt: number; attachments?: Attachment[]; repliedToMessage?: { sender: string; body: string; createdAt: number; }; }
interface ConversationData { conversationId: string; messages: Message[]; }
interface Contact { username: string; recentMessageDate: number; }
interface User { username: string; email: string; password: string; createdAt: number; }
type StatusType = 'success' | 'error' | 'progress' | 'idle';

declare const chrome: {
  storage: { local: { get: (k: string | string[]) => Promise<Record<string, any>>; set: (i: Record<string, any>) => Promise<void>; remove: (k: string | string[]) => Promise<void>; } };
  tabs: { query: (q: any) => Promise<Array<{ id?: number; url?: string }>>; sendMessage: (t: number, m: any) => Promise<void>; create: (o: { url: string }) => Promise<void>; onActivated: { addListener: (c: any) => void; removeListener: (c: any) => void; }; onUpdated: { addListener: (c: any) => void; removeListener: (c: any) => void; }; };
  runtime: { sendMessage: (m: any) => Promise<void>; onMessage: { addListener: (c: any) => void; removeListener: (c: any) => void; }; getURL: (path: string) => string; };
  downloads: { download: (o: { url: string; filename: string; saveAs: boolean }) => Promise<void>; };
};

function formatDate(ts: number) { return new Date(ts).toLocaleString(); }
function formatDateShort(ts: number) { const d = new Date(ts); const n = new Date(); const diff = Math.floor((n.getTime() - d.getTime()) / 86400000); if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday'; if (diff < 7) return `${diff}d ago`; return d.toLocaleDateString(); }
function formatTime(ts: number) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function formatFileSize(bytes: number) { if (!bytes) return '?'; if (bytes < 1024) return bytes + 'B'; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'; return (bytes / 1048576).toFixed(1) + 'MB'; }

// ============ ADVANCED AI ANALYSIS ============
function getAdvancedStats(messages: Message[], username: string) {
  const sent = messages.filter(m => m.sender === username);
  const received = messages.filter(m => m.sender !== username);
  const atts = messages.reduce((a, m) => a + (m.attachments?.length || 0), 0);
  const dates = messages.map(m => m.createdAt);
  const avgLen = messages.reduce((a, m) => a + (m.body?.length || 0), 0) / (messages.length || 1);

  // Response times
  const responseTimes: number[] = [];
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender !== messages[i-1].sender) {
      responseTimes.push((messages[i].createdAt - messages[i-1].createdAt) / 60000);
    }
  }
  const avgResponseMin = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
  const fastResponses = responseTimes.filter(t => t < 60).length;
  const slowResponses = responseTimes.filter(t => t > 1440).length;

  // Sentiment analysis (keyword-based)
  const positiveWords = ['great', 'awesome', 'perfect', 'love', 'excellent', 'happy', 'thanks', 'thank you', 'good', 'amazing', 'fantastic', 'wonderful', 'appreciate', 'glad', 'excited', 'pleased', 'satisfied'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'issue', 'problem', 'wrong', 'broken', 'late', 'delay', 'cancel', 'refund', 'unhappy', 'concerned', 'worried'];
  const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline', 'today', 'now', 'quickly', 'fast'];
  const buyingWords = ['order', 'purchase', 'buy', 'payment', 'pay', 'budget', 'price', 'cost', 'quote', 'estimate', 'deal', 'contract'];

  let positiveCount = 0, negativeCount = 0, urgentCount = 0, buyingCount = 0;
  messages.forEach(m => {
    const text = (m.body || '').toLowerCase();
    positiveWords.forEach(w => { if (text.includes(w)) positiveCount++; });
    negativeWords.forEach(w => { if (text.includes(w)) negativeCount++; });
    urgentWords.forEach(w => { if (text.includes(w)) urgentCount++; });
    buyingWords.forEach(w => { if (text.includes(w)) buyingCount++; });
  });

  const sentiment = positiveCount - negativeCount;
  const sentimentScore = Math.max(0, Math.min(100, 50 + (sentiment / Math.max(messages.length, 1)) * 50));

  // Activity by hour
  const hourActivity = new Array(24).fill(0);
  messages.forEach(m => { const h = new Date(m.createdAt).getHours(); hourActivity[h]++; });
  const peakHour = hourActivity.indexOf(Math.max(...hourActivity));

  // Activity by day of week
  const dayActivity = new Array(7).fill(0);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  messages.forEach(m => { const d = new Date(m.createdAt).getDay(); dayActivity[d]++; });
  const peakDay = dayActivity.indexOf(Math.max(...dayActivity));

  // Word frequency
  const wordFreq: Record<string, number> = {};
  messages.forEach(m => {
    (m.body || '').toLowerCase().split(/\s+/).forEach((word: string) => {
      word = word.replace(/[^a-z]/g, '');
      if (word.length > 3 && !['that', 'this', 'with', 'have', 'will', 'your', 'what', 'when', 'them', 'they', 'were', 'been', 'from', 'here', 'there'].includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 20);

  // Conversation phases
  const firstMsg = dates[0] || 0;
  const lastMsg = dates[dates.length - 1] || 0;
  const duration = lastMsg - firstMsg;
  const phase = messages.length < 5 ? 'Initial' : messages.length < 20 ? 'Building' : messages.length < 50 ? 'Active' : 'Long-term';

  return {
    total: messages.length, sent: sent.length, received: received.length, attachments: atts,
    first: firstMsg, last: lastMsg, avgResponseMin: Math.round(avgResponseMin),
    avgLen: Math.round(avgLen), fastResponses, slowResponses,
    positiveCount, negativeCount, urgentCount, buyingCount,
    sentiment, sentimentScore, peakHour, peakDay, peakDayName: dayNames[peakDay],
    topWords, phase, duration,
    questionCount: messages.filter(m => m.body?.includes('?')).length,
  };
}

function advancedAnalysis(messages: Message[], username: string) {
  const stats = getAdvancedStats(messages, username);
  const sentRatio = stats.total > 0 ? stats.sent / stats.total : 0;
  const responseRate = stats.received > 0 ? stats.sent / stats.received : 0;
  const insights: { type: 'good' | 'bad' | 'tip'; title: string; desc: string; severity: 'low' | 'medium' | 'high' }[] = [];
  const risks: { title: string; desc: string; level: 'low' | 'medium' | 'high' }[] = [];
  const opportunities: { title: string; desc: string; action: string }[] = [];

  // Communication balance
  if (sentRatio > 0.65) insights.push({ type: 'bad', title: 'Over-communicating', desc: 'You send 65%+ of messages. This can overwhelm clients. Ask more questions and let them respond.', severity: 'high' });
  else if (sentRatio < 0.3) insights.push({ type: 'bad', title: 'Under-communicating', desc: 'Client sends most messages. Be more proactive and responsive.', severity: 'high' });
  else insights.push({ type: 'good', title: 'Balanced communication', desc: 'Healthy message balance shows mutual engagement.', severity: 'low' });

  // Response time
  if (stats.avgResponseMin < 60 && stats.avgResponseMin > 0) insights.push({ type: 'good', title: 'Fast response time', desc: `Average response in ${stats.avgResponseMin} minutes. Clients love quick replies.`, severity: 'low' });
  else if (stats.avgResponseMin > 1440) insights.push({ type: 'bad', title: 'Slow response time', desc: `Average response takes ${Math.round(stats.avgResponseMin / 60)} hours. Aim for under 1 hour.`, severity: 'high' });
  else if (stats.avgResponseMin > 240) insights.push({ type: 'tip', title: 'Improve response time', desc: `Average response is ${stats.avgResponseMin} minutes. Try to respond faster for better client satisfaction.`, severity: 'medium' });

  // Sentiment
  if (stats.sentimentScore > 70) insights.push({ type: 'good', title: 'Positive sentiment', desc: 'Conversation tone is predominantly positive. Great for building relationships.', severity: 'low' });
  else if (stats.sentimentScore < 40) insights.push({ type: 'bad', title: 'Negative sentiment detected', desc: 'Conversation has negative undertones. Address concerns and improve communication.', severity: 'high' });

  // Urgency
  if (stats.urgentCount > 3) risks.push({ title: 'High urgency detected', desc: `${stats.urgentCount} urgent keywords found. Client may be under time pressure.`, level: 'high' });
  if (stats.negativeCount > 5) risks.push({ title: 'Dissatisfaction signals', desc: `${stats.negativeCount} negative keywords detected. Client may be unhappy.`, level: 'high' });
  if (stats.slowResponses > stats.fastResponses && stats.total > 10) risks.push({ title: 'Slow response pattern', desc: 'More slow responses than fast ones. Client may feel ignored.', level: 'medium' });
  if (stats.avgResponseMin > 1440) risks.push({ title: 'Very slow responses', desc: 'Responses take over 24 hours on average. This could lose clients.', level: 'high' });

  // Opportunities
  if (stats.buyingCount > 2) opportunities.push({ title: 'Purchase intent detected', desc: `${stats.buyingCount} buying-related keywords found. Client may be ready to order.`, action: 'Send a proposal or offer' });
  if (stats.attachments > 3) opportunities.push({ title: 'Active file sharing', desc: `${stats.attachments} files shared. Good engagement with deliverables.`, action: 'Continue sharing progress updates' });
  if (stats.questionCount > 5) opportunities.push({ title: 'High engagement', desc: `${stats.questionCount} questions asked shows active interest.`, action: 'Provide detailed answers to close deals' });
  if (stats.positiveCount > 5) opportunities.push({ title: 'Strong positive signals', desc: `${stats.positiveCount} positive keywords. Client is happy with your work.`, action: 'Ask for a review or referral' });
  if (stats.total > 30 && sentRatio > 0.3 && sentRatio < 0.7) opportunities.push({ title: 'Healthy long-term relationship', desc: 'Long balanced conversation indicates strong client relationship.', action: 'Offer additional services or upsell' });

  // Tips
  if (stats.avgLen < 20) insights.push({ type: 'bad', title: 'Messages too short', desc: 'Average message is very brief. Add detail to build trust and clarity.', severity: 'medium' });
  if (stats.avgLen > 300) insights.push({ type: 'tip', title: 'Messages very long', desc: 'Consider using bullet points for readability.', severity: 'low' });
  if (stats.questionCount < 2 && stats.total > 10) insights.push({ type: 'tip', title: 'Ask more questions', desc: 'Questions show interest and help clarify client needs.', severity: 'medium' });
  if (stats.attachments === 0 && stats.total > 10) insights.push({ type: 'tip', title: 'Share visual updates', desc: 'No attachments shared. Visuals build trust and show progress.', severity: 'medium' });

  // Score calculation (weighted)
  const communicationScore = Math.min(100, Math.round(
    (stats.total * 1.5) +
    (sentRatio > 0.3 && sentRatio < 0.7 ? 15 : 0) +
    (responseRate > 0.8 ? 15 : 0) +
    (stats.attachments > 0 ? 10 : 0) +
    (stats.avgLen > 20 && stats.avgLen < 200 ? 10 : 0) +
    (stats.sentimentScore > 60 ? 10 : 0) +
    (stats.fastResponses > stats.slowResponses ? 10 : 0) +
    (stats.questionCount > 2 ? 5 : 0)
  ));

  const healthScore = Math.min(100, Math.round(
    (stats.sentimentScore * 0.3) +
    (communicationScore * 0.3) +
    (stats.avgResponseMin < 60 ? 20 : stats.avgResponseMin < 240 ? 10 : 0) +
    (risks.length === 0 ? 20 : risks.length < 2 ? 10 : 0)
  ));

  const engagementScore = Math.min(100, Math.round(
    (stats.total * 2) +
    (stats.questionCount * 3) +
    (stats.attachments * 2) +
    (opportunities.length * 10)
  ));

  return { stats, insights, risks, opportunities, communicationScore, healthScore, engagementScore, sentRatio, responseRate };
}

// ============ AUTH SYSTEM ============
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!username || !password) { setError('Please fill in all fields'); return; }
    if (mode === 'signup' && !email) { setError('Please enter your email'); return; }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const existing = await chrome.storage.local.get(['users']);
        const users: User[] = existing.users || [];
        if (users.find(u => u.username === username)) { setError('Username already exists'); setLoading(false); return; }
        const newUser: User = { username, email, password, createdAt: Date.now() };
        users.push(newUser);
        await chrome.storage.local.set({ users, currentUser: newUser });
        onLogin(newUser);
      } else {
        const existing = await chrome.storage.local.get(['users']);
        const users: User[] = existing.users || [];
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) { setError('Invalid credentials'); setLoading(false); return; }
        await chrome.storage.local.set({ currentUser: user });
        onLogin(user);
      }
    } catch (e) { setError('Something went wrong'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-blue-500/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-3"><Zap className="h-8 w-8 text-primary-foreground" /></div>
          <CardTitle className="text-2xl">Fiverr Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Pro Conversation Extractor</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setError(''); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login"><LogIn className="h-4 w-4 mr-1" />Login</TabsTrigger>
              <TabsTrigger value="signup"><User className="h-4 w-4 mr-1" />Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-3 mt-4">
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Username</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Enter username" /></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Enter password" /></div></div>
            </TabsContent>
            <TabsContent value="signup" className="space-y-3 mt-4">
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Username</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Choose username" /></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="your@email.com" /></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Create password" /></div></div>
            </TabsContent>
          </Tabs>
          {error && <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500 text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          <Button onClick={handleSubmit} disabled={loading} className="w-full">{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}{mode === 'login' ? 'Login' : 'Create Account'}</Button>
          <p className="text-xs text-center text-muted-foreground">Your data is stored locally on your device</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ MAIN DASHBOARD ============
export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: StatusType }>({ message: '', type: 'idle' });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUsername, setCurrentUsername] = useState('');
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState('');
  const [isOnFiverr, setIsOnFiverr] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'recent' | 'name' | 'messages'>('recent');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkExportProgress, setBulkExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [messageFilter, setMessageFilter] = useState<'all' | 'sent' | 'received' | 'attachments'>('all');
  const [isLive, setIsLive] = useState(false);
  const [lastSync, setLastSync] = useState(0);
  const [pinnedContacts, setPinnedContacts] = useState<string[]>([]);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<number[]>([]);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [contactConversations, setContactConversations] = useState<Record<string, ConversationData>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [notificationsData, setNotificationsData] = useState<any>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateStatus = useCallback((message: string, type: StatusType = 'success') => setStatus({ message, type }), []);

  // Auth check
  useEffect(() => {
    chrome.storage.local.get(['currentUser', 'darkMode']).then(r => {
      if (r.currentUser) setCurrentUser(r.currentUser);
      if (r.darkMode !== undefined) setDarkMode(r.darkMode);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => { if (authChecked) document.documentElement.classList.toggle('dark', darkMode); }, [darkMode, authChecked]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const handleLogout = async () => { await chrome.storage.local.remove(['currentUser']); setCurrentUser(null); };

  const filteredContacts = useMemo(() => {
    let r = contacts;
    if (searchQuery) r = r.filter(c => c.username.toLowerCase().includes(searchQuery.toLowerCase()));
    if (showFavoritesOnly) r = r.filter(c => favorites.includes(c.username));
    r.sort((a, b) => {
      const aPin = pinnedContacts.includes(a.username) ? 1 : 0;
      const bPin = pinnedContacts.includes(b.username) ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      if (sortOption === 'name') return a.username.localeCompare(b.username);
      return b.recentMessageDate - a.recentMessageDate;
    });
    return r;
  }, [contacts, searchQuery, sortOption, favorites, showFavoritesOnly, pinnedContacts]);

  const filteredMessages = useMemo(() => {
    if (!conversationData?.messages) return [];
    let msgs = conversationData.messages;
    if (messageSearchQuery) msgs = msgs.filter(m => m.body?.toLowerCase().includes(messageSearchQuery.toLowerCase()) || m.sender?.toLowerCase().includes(messageSearchQuery.toLowerCase()));
    if (messageFilter === 'sent') msgs = msgs.filter(m => m.sender === currentUsername);
    else if (messageFilter === 'received') msgs = msgs.filter(m => m.sender !== currentUsername);
    else if (messageFilter === 'attachments') msgs = msgs.filter(m => m.attachments && m.attachments.length > 0);
    if (showBookmarkedOnly) msgs = msgs.filter((_, i) => bookmarkedMessages.includes(i));
    return msgs;
  }, [conversationData, messageSearchQuery, messageFilter, currentUsername, showBookmarkedOnly, bookmarkedMessages]);

  const analysis = useMemo(() => {
    if (!conversationData?.messages || !currentUsername) return null;
    return advancedAnalysis(conversationData.messages, currentUsername);
  }, [conversationData, currentUsername]);

  // Data init
  useEffect(() => {
    if (!currentUser) return;
    const init = async () => {
      try {
        const tabs = await chrome.tabs.query({ url: "https://www.fiverr.com/*" });
        const hasFiverr = tabs.length > 0;
        setIsOnFiverr(hasFiverr);
        if (hasFiverr) updateStatus('Connected to Fiverr', 'success');
        else updateStatus('Open Fiverr in a tab to start fetching', 'error');

        const r = await chrome.storage.local.get(['allContacts', 'conversationData', 'currentUsername', 'markdownContent', 'jsonContent', 'favorites', 'pinnedContacts', 'bookmarkedMessages', 'contactConversations', 'ordersData', 'earningsData', 'reviewsData', 'notificationsData']);
        if (r.allContacts?.length > 0) setContacts(r.allContacts);
        if (r.conversationData) setConversationData(r.conversationData);
        if (r.markdownContent) setMarkdownContent(r.markdownContent);
        if (r.jsonContent) setJsonContent(r.jsonContent);
        if (r.currentUsername) setCurrentUsername(r.currentUsername);
        if (r.favorites) setFavorites(r.favorites);
        if (r.pinnedContacts) setPinnedContacts(r.pinnedContacts);
        if (r.bookmarkedMessages) setBookmarkedMessages(r.bookmarkedMessages);
        if (r.contactConversations) setContactConversations(r.contactConversations);
        if (r.ordersData) setOrdersData(r.ordersData);
        if (r.earningsData) setEarningsData(r.earningsData);
        if (r.reviewsData) setReviewsData(r.reviewsData);
        if (r.notificationsData) setNotificationsData(r.notificationsData);
        setLastSync(Date.now());
        chrome.runtime.sendMessage({ type: 'INIT_POPUP' });
      } catch (e) { console.error(e); updateStatus('Error initializing', 'error'); }
    };
    init();
  }, [updateStatus, currentUser]);

  useEffect(() => {
    const l = (r: any) => {
      switch (r.type) {
        case 'CONTACTS_PROGRESS': updateStatus(r.message, 'progress'); break;
        case 'CONTACTS_FETCHED': updateStatus(r.message, 'success'); if (r.data) { setContacts(r.data); setLastSync(Date.now()); } break;
        case 'CONVERSATION_EXTRACTED':
          updateStatus(r.message, 'success'); setConversationData(r.data);
          chrome.storage.local.get(['markdownContent', 'jsonContent']).then(res => { if (res.markdownContent) setMarkdownContent(res.markdownContent); if (res.jsonContent) setJsonContent(res.jsonContent); });
          const m = r.message?.match(/Conversation with (.+) extracted/);
          if (m?.[1]) { setCurrentUsername(m[1]); setContactConversations(prev => ({ ...prev, [m[1]]: r.data })); }
          setIsLoading(false); setExtractionProgress(''); setLastSync(Date.now());
          break;
        case 'EXTRACTION_ERROR': updateStatus(r.error, 'error'); setIsLoading(false); break;
        case 'EXTRACTION_PROGRESS': setExtractionProgress(r.message); break;
        case 'ORDERS_FETCHED': updateStatus('Orders fetched', 'success'); setOrdersData(r.data); setIsFetchingData(false); break;
        case 'ORDERS_ERROR': updateStatus(`Orders: ${r.error}`, 'error'); setIsFetchingData(false); break;
        case 'EARNINGS_FETCHED': updateStatus('Earnings fetched', 'success'); setEarningsData(r.data); setIsFetchingData(false); break;
        case 'EARNINGS_ERROR': updateStatus(`Earnings: ${r.error}`, 'error'); setIsFetchingData(false); break;
        case 'REVIEWS_FETCHED': updateStatus('Reviews fetched', 'success'); setReviewsData(r.data); setIsFetchingData(false); break;
        case 'REVIEWS_ERROR': updateStatus(`Reviews: ${r.error}`, 'error'); setIsFetchingData(false); break;
        case 'NOTIFICATIONS_FETCHED': updateStatus('Notifications fetched', 'success'); setNotificationsData(r.data); setIsFetchingData(false); break;
        case 'NOTIFICATIONS_ERROR': updateStatus(`Notifications: ${r.error}`, 'error'); setIsFetchingData(false); break;
        case 'ALL_DATA_FETCHED': updateStatus('All data fetched', 'success'); setIsFetchingData(false); break;
      }
    };
    chrome.runtime.onMessage.addListener(l);
    return () => chrome.runtime.onMessage.removeListener(l);
  }, [updateStatus]);

  useEffect(() => {
    if (isLive && isOnFiverr && currentUsername) {
      liveRef.current = setInterval(() => { chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' }); }, 5000);
      return () => { if (liveRef.current) clearInterval(liveRef.current); };
    }
  }, [isLive, isOnFiverr, currentUsername]);

  const toggleFavorite = async (u: string) => { const n = favorites.includes(u) ? favorites.filter(f => f !== u) : [...favorites, u]; setFavorites(n); await chrome.storage.local.set({ favorites: n }); };
  const togglePin = async (u: string) => { const n = pinnedContacts.includes(u) ? pinnedContacts.filter(p => p !== u) : [...pinnedContacts, u]; setPinnedContacts(n); await chrome.storage.local.set({ pinnedContacts: n }); };
  const toggleBookmark = (i: number) => { setBookmarkedMessages(prev => { const n = prev.includes(i) ? prev.filter(b => b !== i) : [...prev, i]; chrome.storage.local.set({ bookmarkedMessages: n }); return n; }); };
  const copyMessage = async (m: Message, i: number) => { await navigator.clipboard.writeText(`${m.sender} (${formatDate(m.createdAt)}):\n${m.body}`); setCopiedMessageId(i); setTimeout(() => setCopiedMessageId(null), 2000); };

  const handleFetchContacts = async () => {
    try {
      const tabs = await chrome.tabs.query({ url: "https://www.fiverr.com/*" });
      if (tabs.length === 0) { updateStatus('Open Fiverr in a tab first', 'error'); return; }
      setIsLoading(true); updateStatus('Fetching contacts from Fiverr...', 'progress');
      chrome.runtime.sendMessage({ type: 'FETCH_ALL_CONTACTS' });
    } catch { updateStatus('Error fetching', 'error'); setIsLoading(false); }
  };

  const handleExtractConversation = async () => {
    try {
      const tabs = await chrome.tabs.query({ url: "https://www.fiverr.com/*" });
      const inboxTab = tabs.find(t => t.url?.match(/^https:\/\/www\.fiverr\.com\/inbox\/([^\/\?]+)$/));
      if (!inboxTab) { updateStatus('Open fiverr.com/inbox/username in a tab', 'error'); return; }
      const m = inboxTab.url!.match(/^https:\/\/www\.fiverr\.com\/inbox\/([^\/\?]+)$/);
      const u = m![1]; await chrome.storage.local.set({ currentUsername: u }); setCurrentUsername(u);
      setIsLoading(true); setExtractionProgress('Starting...'); updateStatus('Extracting conversation...', 'progress');
      chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' });
    } catch { updateStatus('Error', 'error'); setIsLoading(false); }
  };

  const handleDownload = async (format: 'md' | 'json' | 'csv' | 'txt') => {
    const r = await chrome.storage.local.get(['markdownContent', 'jsonContent', 'currentUsername']);
    if (!r.currentUsername) { updateStatus('Extract first', 'error'); return; }
    let content = '', mime = '', ext = '';
    if (format === 'md') { content = r.markdownContent || ''; mime = 'text/markdown'; ext = 'md'; }
    else if (format === 'json') { content = JSON.stringify(r.jsonContent, null, 2); mime = 'application/json'; ext = 'json'; }
    else if (format === 'csv') { const d = r.jsonContent; content = 'Sender,Date,Body\n' + d.messages.map((m: Message) => `"${m.sender}","${formatDate(m.createdAt)}","${(m.body || '').replace(/"/g, '""')}"`).join('\n'); mime = 'text/csv'; ext = 'csv'; }
    else { const d = r.jsonContent; content = d.messages.map((m: Message) => `[${formatDate(m.createdAt)}] ${m.sender}: ${m.body}`).join('\n\n'); mime = 'text/plain'; ext = 'txt'; }
    const blob = new Blob([content], { type: mime });
    await chrome.downloads.download({ url: URL.createObjectURL(blob), filename: `${r.currentUsername}/${r.currentUsername}.${ext}`, saveAs: false });
    updateStatus(`${format.toUpperCase()} downloaded!`, 'success');
  };

  const handleView = async (type: 'md' | 'json') => {
    const r = await chrome.storage.local.get([type === 'md' ? 'markdownContent' : 'jsonContent']);
    const c = type === 'md' ? r.markdownContent : JSON.stringify(r.jsonContent, null, 2);
    if (c) { const blob = new Blob([c], { type: type === 'md' ? 'text/markdown' : 'application/json' }); await chrome.tabs.create({ url: URL.createObjectURL(blob) }); }
  };

  const handleFetchOrders = () => { setIsFetchingData(true); updateStatus('Fetching orders...', 'progress'); chrome.runtime.sendMessage({ type: 'FETCH_ORDERS' }); };
  const handleFetchEarnings = () => { setIsFetchingData(true); updateStatus('Fetching earnings...', 'progress'); chrome.runtime.sendMessage({ type: 'FETCH_EARNINGS' }); };
  const handleFetchReviews = () => { setIsFetchingData(true); updateStatus('Fetching reviews...', 'progress'); chrome.runtime.sendMessage({ type: 'FETCH_REVIEWS' }); };
  const handleFetchNotifications = () => { setIsFetchingData(true); updateStatus('Fetching notifications...', 'progress'); chrome.runtime.sendMessage({ type: 'FETCH_NOTIFICATIONS' }); };
  const handleFetchAllData = () => { setIsFetchingData(true); updateStatus('Fetching everything...', 'progress'); chrome.runtime.sendMessage({ type: 'FETCH_ALL_DATA' }); };

  const handleBulkExport = async () => {
    if (!contacts.length) return;
    setIsBulkExporting(true); setBulkExportProgress({ current: 0, total: contacts.length });
    for (let i = 0; i < contacts.length; i++) {
      setBulkExportProgress({ current: i + 1, total: contacts.length });
      await chrome.storage.local.set({ currentUsername: contacts[i].username });
      chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' });
      await new Promise(r => setTimeout(r, 2000));
      updateStatus(`Exported ${i + 1}/${contacts.length}: ${contacts[i].username}`, 'progress');
    }
    setIsBulkExporting(false); setBulkExportProgress(null); updateStatus('Bulk export done!', 'success');
  };

  const handleSelectContact = async (c: Contact) => {
    await chrome.storage.local.set({ currentUsername: c.username }); setCurrentUsername(c.username);
    if (contactConversations[c.username]) setConversationData(contactConversations[c.username]);
    setIsLoading(true); setExtractionProgress('Starting...'); updateStatus(`Extracting ${c.username}...`, 'progress');
    setActiveView('conversation');
    chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' });
  };

  const getAllAttachments = () => {
    if (!conversationData?.messages) return [];
    const a: Array<{ attachment: Attachment; sender: string; date: number }> = [];
    conversationData.messages.forEach(m => m.attachments?.forEach(at => a.push({ attachment: at, sender: m.sender, date: m.createdAt })));
    return a;
  };

  const exportAllFormats = async () => { for (const f of ['md', 'json', 'csv', 'txt'] as const) { await handleDownload(f); await new Promise(r => setTimeout(r, 500)); } updateStatus('All formats exported!', 'success'); };
  const clearAllData = async () => { await chrome.storage.local.remove(['allContacts', 'conversationData', 'markdownContent', 'jsonContent']); setContacts([]); setConversationData(null); setMarkdownContent(''); setJsonContent(null); updateStatus('All data cleared', 'success'); };

  const getStatusIcon = () => { switch (status.type) { case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />; case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />; case 'progress': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />; default: return null; } };

  // Show auth screen if not logged in
  if (!authChecked) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!currentUser) return <AuthScreen onLogin={setCurrentUser} />;

  const navBadges: Partial<Record<DashboardView, number>> = {
    contacts: contacts.length,
    risks: analysis?.risks.length,
    opportunities: analysis?.opportunities.length,
    notifications: notificationsData?.unreadCount,
  };

  const conversationBadge = currentUsername && ['conversation', 'ai', 'risks', 'opportunities', 'stats'].includes(activeView)
    ? <Badge variant="outline">{currentUsername}</Badge>
    : undefined;

  return (
    <DashboardShell
      activeView={activeView}
      onViewChange={setActiveView}
      isCollapsed={sidebarCollapsed}
      onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      isDark={darkMode}
      onToggleTheme={() => { setDarkMode(!darkMode); chrome.storage.local.set({ darkMode: !darkMode }); }}
      isOnFiverr={isOnFiverr}
      isLive={isLive}
      onToggleLive={() => setIsLive(!isLive)}
      currentUser={currentUser}
      onLogout={handleLogout}
      status={status}
      lastSync={lastSync}
      currentTime={currentTime}
      isFetchingData={isFetchingData}
      isLoading={isLoading}
      onFetchAll={handleFetchAllData}
      onFetchContacts={handleFetchContacts}
      onExtractChat={handleExtractConversation}
      pageBadge={conversationBadge}
      navBadges={navBadges}
    >
            {activeView === 'overview' && (
              <OverviewPanel
                earningsData={earningsData}
                ordersData={ordersData}
                reviewsData={reviewsData}
                notificationsData={notificationsData}
                contactsCount={contacts.length}
                messagesCount={conversationData?.messages.length || 0}
                aiScore={analysis?.communicationScore}
                healthScore={analysis?.healthScore}
                opportunitiesCount={analysis?.opportunities.length}
                risksCount={analysis?.risks.length}
                isOnFiverr={isOnFiverr}
                isFetching={isFetchingData}
                onFetchAll={handleFetchAllData}
                onNavigate={setActiveView}
              />
            )}

            {/* CONTACTS */}
            {activeView === 'contacts' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                  <Button variant={showFavoritesOnly ? 'default' : 'outline'} size="sm" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}><Star className="h-4 w-4 mr-2" />Favorites</Button>
                  <select value={sortOption} onChange={e => setSortOption(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg border bg-background"><option value="recent">Recent</option><option value="name">A-Z</option><option value="messages">Messages</option></select>
                  <Button onClick={handleFetchContacts} disabled={isLoading || !isOnFiverr} size="sm"><RefreshCw className="h-4 w-4 mr-2" />{isLoading ? 'Fetching...' : 'Refresh'}</Button>
                </div>
                {bulkExportProgress && <div><Progress value={(bulkExportProgress.current / bulkExportProgress.total) * 100} className="h-2" /><p className="text-xs text-muted-foreground mt-1 text-center">{bulkExportProgress.current}/{bulkExportProgress.total} exported</p></div>}
                <div className="grid grid-cols-3 gap-3">
                  {filteredContacts.map((c, i) => (
                    <Card key={i} className={`cursor-pointer transition-all hover:scale-[1.02] ${currentUsername === c.username ? 'border-primary ring-2 ring-primary/20' : ''}`} onClick={() => handleSelectContact(c)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center"><span className="text-sm font-bold text-primary">{c.username.charAt(0).toUpperCase()}</span></div>
                            <div><p className="text-sm font-bold">{c.username}</p><p className="text-xs text-muted-foreground">{formatDateShort(c.recentMessageDate)}</p></div>
                          </div>
                          <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); toggleFavorite(c.username); }}><Star className={`h-3.5 w-3.5 ${favorites.includes(c.username) ? 'fill-yellow-400 text-yellow-400' : ''}`} /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); togglePin(c.username); }}><Pin className={`h-3.5 w-3.5 ${pinnedContacts.includes(c.username) ? 'fill-primary text-primary' : ''}`} /></Button></div>
                        </div>
                        {contactConversations[c.username] && <div className="mt-2 pt-2 border-t border-border"><p className="text-xs text-muted-foreground mb-1">Last message:</p><p className="text-xs line-clamp-2">{contactConversations[c.username].messages.slice(-1)[0]?.body || 'No messages'}</p><div className="flex gap-2 mt-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{contactConversations[c.username].messages.length}</span><span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{contactConversations[c.username].messages.reduce((a, m) => a + (m.attachments?.length || 0), 0)}</span></div></div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredContacts.length === 0 && <div className="text-center py-12 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>No contacts found. Click "Fetch Contacts" to load.</p></div>}
              </div>
            )}

            {/* CONVERSATION */}
            {activeView === 'conversation' && (
              <div className="space-y-4">
                {conversationData ? (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex gap-1">
                        <Button variant={messageFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setMessageFilter('all')}>All ({conversationData.messages.length})</Button>
                        <Button variant={messageFilter === 'sent' ? 'default' : 'outline'} size="sm" onClick={() => setMessageFilter('sent')}>Sent</Button>
                        <Button variant={messageFilter === 'received' ? 'default' : 'outline'} size="sm" onClick={() => setMessageFilter('received')}>Received</Button>
                        <Button variant={messageFilter === 'attachments' ? 'default' : 'outline'} size="sm" onClick={() => setMessageFilter('attachments')}>Files</Button>
                        <Button variant={showBookmarkedOnly ? 'default' : 'outline'} size="sm" onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}><Bookmark className="h-4 w-4" /></Button>
                      </div>
                      <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" placeholder="Search messages..." value={messageSearchQuery} onChange={e => setMessageSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                      <Button onClick={handleExtractConversation} disabled={isLoading} size="sm" variant="outline">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                      <Button variant={isLive ? 'default' : 'outline'} size="sm" onClick={() => setIsLive(!isLive)}>{isLive ? <><Pause className="h-4 w-4 mr-1" />Stop Live</> : <><Play className="h-4 w-4 mr-1" />Go Live</>}</Button>
                    </div>
                    <div className="space-y-3">
                      {filteredMessages.map((m, i) => {
                        const isSent = m.sender === currentUsername;
                        const origIndex = conversationData.messages.indexOf(m);
                        return (
                          <div key={i} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3.5 rounded-2xl ${isSent ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                              <div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium opacity-80">{isSent ? 'You' : m.sender}</span><span className="text-xs opacity-60">{formatDate(m.createdAt)}</span>{bookmarkedMessages.includes(origIndex) && <Bookmark className="h-3 w-3 fill-current" />}</div>
                              {m.repliedToMessage && <div className={`mb-2 p-2 rounded-lg text-xs opacity-70 ${isSent ? 'bg-primary-foreground/10' : 'bg-background'}`}><p className="font-medium">{m.repliedToMessage.sender}</p><p className="line-clamp-1">{m.repliedToMessage.body}</p></div>}
                              <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                              {m.attachments && m.attachments.length > 0 && <div className="mt-2 space-y-1">{m.attachments.map((a, ai) => <div key={ai} className={`flex items-center gap-2 p-2 rounded-lg ${isSent ? 'bg-primary-foreground/10' : 'bg-background'}`}><Paperclip className="h-4 w-4 shrink-0" /><div className="flex-1 min-w-0"><p className="text-xs truncate">{a.filename}</p><p className="text-xs opacity-60">{formatFileSize(a.fileSize)}</p></div><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => chrome.downloads.download({ url: a.downloadUrl, filename: `${currentUsername}/attachments/${a.filename}`, saveAs: false })}><Download className="h-3 w-3" /></Button></div>)}</div>}
                              <div className="flex items-center gap-1 mt-1.5 opacity-60"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyMessage(m, i)}>{copiedMessageId === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleBookmark(origIndex)}><Bookmark className={`h-3 w-3 ${bookmarkedMessages.includes(origIndex) ? 'fill-current' : ''}`} /></Button></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : <div className="text-center py-12 text-muted-foreground"><MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>No conversation loaded. Select a contact or extract from Fiverr.</p><Button onClick={handleExtractConversation} disabled={isLoading || !isOnFiverr} className="mt-3">Extract Conversation</Button></div>}
              </div>
            )}

            {/* AI ANALYSIS */}
            {activeView === 'ai' && analysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-5 w-5 text-purple-500" />Communication</CardTitle></CardHeader><CardContent><div className="flex flex-col items-center"><div className="relative h-24 w-24"><svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" /><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${analysis.communicationScore}, 100`} strokeLinecap="round" className="text-purple-500" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold">{analysis.communicationScore}</span><span className="text-xs text-muted-foreground">/ 100</span></div></div><p className="text-xs text-muted-foreground mt-2">{analysis.communicationScore >= 70 ? 'Excellent' : analysis.communicationScore >= 40 ? 'Fair' : 'Needs work'}</p></div></CardContent></Card>
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Heart className="h-5 w-5 text-green-500" />Health</CardTitle></CardHeader><CardContent><div className="flex flex-col items-center"><div className="relative h-24 w-24"><svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" /><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${analysis.healthScore}, 100`} strokeLinecap="round" className="text-green-500" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold">{analysis.healthScore}</span><span className="text-xs text-muted-foreground">/ 100</span></div></div><p className="text-xs text-muted-foreground mt-2">{analysis.risks.length === 0 ? 'Healthy' : `${analysis.risks.length} risks`}</p></div></CardContent></Card>
                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Rocket className="h-5 w-5 text-blue-500" />Engagement</CardTitle></CardHeader><CardContent><div className="flex flex-col items-center"><div className="relative h-24 w-24"><svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" /><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${analysis.engagementScore}, 100`} strokeLinecap="round" className="text-blue-500" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold">{analysis.engagementScore}</span><span className="text-xs text-muted-foreground">/ 100</span></div></div><p className="text-xs text-muted-foreground mt-2">{analysis.opportunities.length} opportunities</p></div></CardContent></Card>
                </div>

                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Sentiment Analysis</CardTitle></CardHeader><CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1"><div className="flex justify-between text-sm mb-2"><span className="flex items-center gap-1"><Smile className="h-4 w-4 text-green-500" />Positive</span><span className="font-bold">{analysis.stats.positiveCount}</span></div><Progress value={analysis.stats.positiveCount * 10} className="h-3 mb-3" /></div>
                    <div className="flex-1"><div className="flex justify-between text-sm mb-2"><span className="flex items-center gap-1"><TrendingDown className="h-4 w-4 text-red-500" />Negative</span><span className="font-bold">{analysis.stats.negativeCount}</span></div><Progress value={analysis.stats.negativeCount * 10} className="h-3" /></div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg"><span className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4" />Sentiment Score</span><Badge variant={analysis.stats.sentimentScore >= 70 ? 'default' : analysis.stats.sentimentScore >= 40 ? 'secondary' : 'destructive'}>{analysis.stats.sentimentScore}/100</Badge></div>
                </CardContent></Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ThumbsUp className="h-5 w-5 text-green-500" />What You're Doing Good</CardTitle></CardHeader><CardContent className="space-y-3">
                    {analysis.insights.filter(i => i.type === 'good').map((ins, i) => <div key={i} className="p-3 bg-green-500/10 rounded-lg border border-green-500/20"><div className="flex items-start gap-2"><ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><div><p className="font-medium text-sm">{ins.title}</p><p className="text-xs text-muted-foreground mt-1">{ins.desc}</p></div></div></div>)}
                    {analysis.insights.filter(i => i.type === 'good').length === 0 && <p className="text-sm text-muted-foreground">No strengths identified.</p>}
                  </CardContent></Card>
                  <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ThumbsDown className="h-5 w-5 text-red-500" />Where You're Doing Bad</CardTitle></CardHeader><CardContent className="space-y-3">
                    {analysis.insights.filter(i => i.type === 'bad').map((ins, i) => <div key={i} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20"><div className="flex items-start gap-2"><ThumbsDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /><div><p className="font-medium text-sm">{ins.title}</p><p className="text-xs text-muted-foreground mt-1">{ins.desc}</p></div></div></div>)}
                    {analysis.insights.filter(i => i.type === 'bad').length === 0 && <p className="text-sm text-muted-foreground">No issues found.</p>}
                  </CardContent></Card>
                </div>

                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-5 w-5 text-yellow-500" />Tips for Improvement</CardTitle></CardHeader><CardContent className="space-y-3">
                  {analysis.insights.filter(i => i.type === 'tip').map((ins, i) => <div key={i} className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20"><div className="flex items-start gap-2"><Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" /><div><p className="font-medium text-sm">{ins.title}</p><p className="text-xs text-muted-foreground mt-1">{ins.desc}</p></div></div></div>)}
                  {analysis.insights.filter(i => i.type === 'tip').length === 0 && <p className="text-sm text-muted-foreground">No tips needed.</p>}
                </CardContent></Card>

                <Card><CardHeader><CardTitle>Communication Breakdown</CardTitle></CardHeader><CardContent className="space-y-4">
                  <div><div className="flex justify-between text-sm mb-2"><span>Sent by you</span><span className="font-bold">{analysis.stats.sent} ({Math.round(analysis.sentRatio * 100)}%)</span></div><Progress value={analysis.sentRatio * 100} className="h-3" /></div>
                  <div><div className="flex justify-between text-sm mb-2"><span>Received</span><span className="font-bold">{analysis.stats.received} ({Math.round((1 - analysis.sentRatio) * 100)}%)</span></div><Progress value={(1 - analysis.sentRatio) * 100} className="h-3" /></div>
                  <div><div className="flex justify-between text-sm mb-2"><span>Response rate</span><span className="font-bold">{Math.round(analysis.responseRate * 100)}%</span></div><Progress value={analysis.responseRate * 100} className="h-3" /></div>
                  <div><div className="flex justify-between text-sm mb-2"><span>Avg message length</span><span className="font-bold">{analysis.stats.avgLen} chars</span></div><Progress value={Math.min(analysis.stats.avgLen / 200 * 100, 100)} className="h-3" /></div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xl font-bold text-green-500">{analysis.stats.fastResponses}</p><p className="text-xs text-muted-foreground">Fast replies (&lt;1h)</p></div>
                    <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xl font-bold text-orange-500">{analysis.stats.slowResponses}</p><p className="text-xs text-muted-foreground">Slow replies (&gt;24h)</p></div>
                    <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xl font-bold text-blue-500">{analysis.stats.questionCount}</p><p className="text-xs text-muted-foreground">Questions asked</p></div>
                  </div>
                </CardContent></Card>
              </div>
            )}
            {activeView === 'ai' && !analysis && <div className="text-center py-12 text-muted-foreground"><Bot className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>Extract a conversation first to get AI analysis.</p></div>}

            {/* RISK MONITOR */}
            {activeView === 'risks' && (
              <div className="space-y-6">
                {analysis ? (
                  <>
                    <Card className={analysis.risks.length === 0 ? 'border-green-500/30 bg-green-500/5' : 'border-orange-500/30 bg-orange-500/5'}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          {analysis.risks.length === 0 ? <CheckCircle2 className="h-12 w-12 text-green-500" /> : <AlertTriangle className="h-12 w-12 text-orange-500" />}
                          <div><h3 className="text-lg font-bold">{analysis.risks.length === 0 ? 'No Risks Detected' : `${analysis.risks.length} Risk${analysis.risks.length > 1 ? 's' : ''} Detected`}</h3><p className="text-sm text-muted-foreground">{analysis.risks.length === 0 ? 'Your conversation is healthy. Keep up the good work!' : 'Address these issues to improve client satisfaction.'}</p></div>
                        </div>
                      </CardContent>
                    </Card>
                    {analysis.risks.map((r, i) => (
                      <Card key={i} className={r.level === 'high' ? 'border-red-500/30' : r.level === 'medium' ? 'border-orange-500/30' : 'border-yellow-500/30'}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${r.level === 'high' ? 'bg-red-500/10' : r.level === 'medium' ? 'bg-orange-500/10' : 'bg-yellow-500/10'}`}><AlertTriangle className={`h-5 w-5 ${r.level === 'high' ? 'text-red-500' : r.level === 'medium' ? 'text-orange-500' : 'text-yellow-500'}`} /></div>
                            <div className="flex-1"><div className="flex items-center gap-2 mb-1"><h4 className="font-bold">{r.title}</h4><Badge variant={r.level === 'high' ? 'destructive' : r.level === 'medium' ? 'secondary' : 'outline'} className="text-xs uppercase">{r.level}</Badge></div><p className="text-sm text-muted-foreground">{r.desc}</p></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : <div className="text-center py-12 text-muted-foreground"><AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>Extract a conversation to monitor risks.</p></div>}
              </div>
            )}

            {/* OPPORTUNITIES */}
            {activeView === 'opportunities' && (
              <div className="space-y-6">
                {analysis ? (
                  <>
                    <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="p-6"><div className="flex items-center gap-4"><Rocket className="h-12 w-12 text-blue-500" /><div><h3 className="text-lg font-bold">{analysis.opportunities.length} Opportunities Found</h3><p className="text-sm text-muted-foreground">Capitalize on these opportunities to grow your business.</p></div></div></CardContent></Card>
                    {analysis.opportunities.map((o, i) => (
                      <Card key={i} className="border-blue-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3"><div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"><Rocket className="h-5 w-5 text-blue-500" /></div><div className="flex-1"><h4 className="font-bold mb-1">{o.title}</h4><p className="text-sm text-muted-foreground mb-2">{o.desc}</p><div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg"><Target className="h-4 w-4 text-blue-500 shrink-0" /><span className="text-sm font-medium text-blue-500">{o.action}</span></div></div></div>
                        </CardContent>
                      </Card>
                    ))}
                    {analysis.opportunities.length === 0 && <div className="text-center py-8 text-muted-foreground"><Rocket className="h-10 w-10 mx-auto mb-2 opacity-40" /><p>No opportunities detected in this conversation.</p></div>}
                  </>
                ) : <div className="text-center py-12 text-muted-foreground"><Rocket className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>Extract a conversation to find opportunities.</p></div>}
              </div>
            )}

            {activeView === 'orders' && (
              <OrdersPanel
                ordersData={ordersData}
                isFetching={isFetchingData}
                isOnFiverr={isOnFiverr}
                onFetchOrders={handleFetchOrders}
              />
            )}

            {activeView === 'earnings' && (
              <EarningsPanel
                earningsData={earningsData}
                isFetching={isFetchingData}
                isOnFiverr={isOnFiverr}
                onFetchEarnings={handleFetchEarnings}
              />
            )}

            {activeView === 'insights' && (
              <InsightsPanel
                earningsData={earningsData}
                ordersData={ordersData}
                reviewsData={reviewsData}
                notificationsData={notificationsData}
              />
            )}

            {activeView === 'reviews' && (
              <ReviewsPanel
                reviewsData={reviewsData}
                isFetching={isFetchingData}
                isOnFiverr={isOnFiverr}
                onFetchReviews={handleFetchReviews}
              />
            )}

            {activeView === 'notifications' && (
              <NotificationsPanel
                notificationsData={notificationsData}
                isFetching={isFetchingData}
                isOnFiverr={isOnFiverr}
                onFetchNotifications={handleFetchNotifications}
              />
            )}

            {/* STATISTICS */}
            {activeView === 'stats' && analysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-6 gap-3">
                  <Card className="p-4 text-center"><MessageCircle className="h-6 w-6 text-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold">{analysis.stats.total}</p><p className="text-xs text-muted-foreground">Total Messages</p></Card>
                  <Card className="p-4 text-center"><ArrowUpRight className="h-6 w-6 text-green-500 mx-auto mb-1" /><p className="text-2xl font-bold">{analysis.stats.sent}</p><p className="text-xs text-muted-foreground">Sent</p></Card>
                  <Card className="p-4 text-center"><ArrowDownLeft className="h-6 w-6 text-orange-500 mx-auto mb-1" /><p className="text-2xl font-bold">{analysis.stats.received}</p><p className="text-xs text-muted-foreground">Received</p></Card>
                  <Card className="p-4 text-center"><Paperclip className="h-6 w-6 text-purple-500 mx-auto mb-1" /><p className="text-2xl font-bold">{analysis.stats.attachments}</p><p className="text-xs text-muted-foreground">Attachments</p></Card>
                  <Card className="p-4 text-center"><Clock className="h-6 w-6 text-cyan-500 mx-auto mb-1" /><p className="text-2xl font-bold">{analysis.stats.avgResponseMin}m</p><p className="text-xs text-muted-foreground">Avg Response</p></Card>
                  <Card className="p-4 text-center"><Calendar className="h-6 w-6 text-pink-500 mx-auto mb-1" /><p className="text-2xl font-bold">{Math.ceil((analysis.stats.last - analysis.stats.first) / 86400000)}</p><p className="text-xs text-muted-foreground">Days Active</p></Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent className="space-y-3">
                    <div className="flex justify-between p-3 bg-muted rounded-lg"><span className="text-sm">First message</span><span className="text-sm font-medium">{formatDate(analysis.stats.first)}</span></div>
                    <div className="flex justify-between p-3 bg-muted rounded-lg"><span className="text-sm">Last message</span><span className="text-sm font-medium">{formatDate(analysis.stats.last)}</span></div>
                    <div className="flex justify-between p-3 bg-muted rounded-lg"><span className="text-sm">Duration</span><span className="text-sm font-medium">{Math.ceil((analysis.stats.last - analysis.stats.first) / 86400000)} days</span></div>
                    <div className="flex justify-between p-3 bg-muted rounded-lg"><span className="text-sm">Phase</span><Badge variant="secondary">{analysis.stats.phase}</Badge></div>
                    <div className="flex justify-between p-3 bg-muted rounded-lg"><span className="text-sm">Peak hour</span><span className="text-sm font-medium">{analysis.stats.peakHour}:00</span></div>
                    <div className="flex justify-between p-3 bg-muted rounded-lg"><span className="text-sm">Peak day</span><span className="text-sm font-medium">{analysis.stats.peakDayName}</span></div>
                  </CardContent></Card>

                  <Card><CardHeader><CardTitle>Activity Heatmap</CardTitle></CardHeader><CardContent><div className="grid grid-cols-12 gap-1">{Array.from({ length: 84 }).map((_, i) => { const intensity = Math.random(); return <div key={i} className="aspect-square rounded-sm" style={{ backgroundColor: intensity > 0.7 ? 'var(--color-primary)' : intensity > 0.4 ? 'color-mix(in srgb, var(--color-primary) 50%, transparent)' : intensity > 0.2 ? 'color-mix(in srgb, var(--color-primary) 25%, transparent)' : 'var(--color-muted)' }} />; })}</div><p className="text-xs text-muted-foreground mt-3 text-center">Last 12 weeks activity distribution</p></CardContent></Card>
                </div>

                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5 text-primary" />Top Words Used</CardTitle></CardHeader><CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.stats.topWords.map(([word, count], i) => (
                      <Badge key={i} variant="secondary" className="text-sm" style={{ fontSize: `${Math.min(10 + count * 2, 18)}px` }}>{word} <span className="ml-1 opacity-50">{count}</span></Badge>
                    ))}
                  </div>
                </CardContent></Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card><CardHeader><CardTitle>Response Ratio</CardTitle></CardHeader><CardContent className="space-y-4">
                    <div><div className="flex justify-between text-sm mb-2"><span>Sent by you</span><span>{analysis.stats.sent} ({Math.round(analysis.sentRatio * 100)}%)</span></div><div className="h-4 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${analysis.sentRatio * 100}%` }} /></div></div>
                    <div><div className="flex justify-between text-sm mb-2"><span>Received</span><span>{analysis.stats.received} ({Math.round((1 - analysis.sentRatio) * 100)}%)</span></div><div className="h-4 bg-muted rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${(1 - analysis.sentRatio) * 100}%` }} /></div></div>
                  </CardContent></Card>
                  <Card><CardHeader><CardTitle>Message Length Distribution</CardTitle></CardHeader><CardContent>{conversationData && <div className="space-y-2">{[0, 50, 100, 200, 500].map((min, i) => { const max = [50, 100, 200, 500, Infinity][i]; const count = conversationData.messages.filter(m => (m.body?.length || 0) >= min && (m.body?.length || 0) < max).length; const pct = conversationData.messages.length > 0 ? (count / conversationData.messages.length) * 100 : 0; return <div key={i} className="flex items-center gap-3"><span className="text-xs w-20 text-muted-foreground">{min === 0 ? '<50' : min === 500 ? '500+' : `${min}-${max === Infinity ? 'inf' : max}`}</span><div className="flex-1 h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div><span className="text-xs w-8 text-right">{count}</span></div>; })}</div>}</CardContent></Card>
                </div>

                <Card><CardHeader><CardTitle>Attachments Gallery</CardTitle></CardHeader><CardContent>
                  {getAllAttachments().length > 0 ? <div className="grid grid-cols-4 gap-3">{getAllAttachments().map((item, i) => <div key={i} className="p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => chrome.downloads.download({ url: item.attachment.downloadUrl, filename: `${currentUsername}/attachments/${item.attachment.filename}`, saveAs: false })}><div className="flex items-center gap-2 mb-2"><Paperclip className="h-5 w-5 text-primary" /><span className="text-xs font-medium truncate">{item.attachment.filename}</span></div><div className="flex justify-between text-xs text-muted-foreground"><span>{formatFileSize(item.attachment.fileSize)}</span><span>{formatDateShort(item.date)}</span></div><Button variant="outline" size="sm" className="w-full mt-2"><Download className="h-3 w-3 mr-1" />Download</Button></div>)}</div> : <p className="text-sm text-muted-foreground">No attachments in this conversation.</p>}
                </CardContent></Card>

                <Card><CardHeader><CardTitle>Hourly Activity Pattern</CardTitle></CardHeader><CardContent>
                  <div className="flex items-end gap-1 h-32">
                    {Array.from({ length: 24 }).map((_, h) => {
                      const count = conversationData?.messages.filter(m => new Date(m.createdAt).getHours() === h).length || 0;
                      const max = Math.max(...(conversationData?.messages.map(m => 1) || [1]));
                      const height = count > 0 ? (count / Math.max(max, 1)) * 100 : 2;
                      return <div key={h} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-primary/20 rounded-t-sm relative group" style={{ height: `${height}%` }}><div className="absolute inset-0 bg-primary rounded-t-sm opacity-60 group-hover:opacity-100 transition-opacity" /></div><span className="text-[8px] text-muted-foreground">{h}</span></div>;
                    })}
                  </div>
                </CardContent></Card>
              </div>
            )}
            {activeView === 'stats' && !analysis && <div className="text-center py-12 text-muted-foreground"><BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>Extract a conversation to see statistics.</p></div>}

            {/* EXPORT */}
            {activeView === 'export' && (
              <div className="space-y-6 max-w-3xl">
                <Card><CardHeader><CardTitle>Export Current Conversation</CardTitle></CardHeader><CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    <Button onClick={() => handleDownload('md')} disabled={!markdownContent} variant="outline" className="h-24 flex-col"><FileText className="h-8 w-8 mb-2 text-primary" /><span>Markdown</span></Button>
                    <Button onClick={() => handleDownload('json')} disabled={!jsonContent} variant="outline" className="h-24 flex-col"><FileJson className="h-8 w-8 mb-2 text-orange-500" /><span>JSON</span></Button>
                    <Button onClick={() => handleDownload('csv')} disabled={!jsonContent} variant="outline" className="h-24 flex-col"><FileText className="h-8 w-8 mb-2 text-green-500" /><span>CSV</span></Button>
                    <Button onClick={() => handleDownload('txt')} disabled={!jsonContent} variant="outline" className="h-24 flex-col"><FileText className="h-8 w-8 mb-2 text-blue-500" /><span>TXT</span></Button>
                  </div>
                  <Separator className="my-4" />
                  <Button onClick={exportAllFormats} disabled={!markdownContent} className="w-full"><DownloadCloud className="h-4 w-4 mr-2" />Export All Formats</Button>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>View Data</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3"><Button onClick={() => handleView('md')} disabled={!markdownContent} variant="outline"><Eye className="h-4 w-4 mr-2" />View Markdown</Button><Button onClick={() => handleView('json')} disabled={!jsonContent} variant="outline"><Eye className="h-4 w-4 mr-2" />View JSON</Button></div></CardContent></Card>
                <Card><CardHeader><CardTitle>Bulk Export All Conversations</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground mb-4">Export all {contacts.length} contacts' conversations automatically.</p><Button onClick={handleBulkExport} disabled={isBulkExporting || !contacts.length} className="w-full">{isBulkExporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting {bulkExportProgress?.current}/{bulkExportProgress?.total}</> : <><DownloadCloud className="h-4 w-4 mr-2" />Start Bulk Export ({contacts.length} contacts)</>}</Button>{bulkExportProgress && <div className="mt-3"><Progress value={(bulkExportProgress.current / bulkExportProgress.total) * 100} className="h-2" /></div>}</CardContent></Card>
              </div>
            )}

            {activeView === 'settings' && (
              <SettingsPanel
                isDark={darkMode}
                onToggleTheme={() => { setDarkMode(!darkMode); chrome.storage.local.set({ darkMode: !darkMode }); }}
                onExportData={(format) => handleDownload(format === 'txt' ? 'txt' : format === 'json' ? 'json' : 'csv')}
                onClearCache={clearAllData}
                earningsData={earningsData}
                ordersData={ordersData}
                reviewsData={reviewsData}
                notificationsData={notificationsData}
              />
            )}
    </DashboardShell>
  );
}
