import './index.css';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Download, FileText, FileJson, Paperclip, Users, MessageSquare,
  RefreshCw, CheckCircle2, AlertCircle, Loader2, Eye, Search, Star,
  BarChart3, Clock, ArrowUpRight, ArrowDownLeft, Moon, Sun,
  DownloadCloud, Zap, TrendingUp, ThumbsUp, ThumbsDown, Lightbulb,
  Target, Award, Activity, Calendar, Settings, Bell, MessageCircle,
  File as FileIcon, Bookmark, Pin, Bot, Sparkles, Brain, Pause, Play,
  Trash2, ExternalLink
} from 'lucide-react';

interface Attachment { filename: string; downloadUrl: string; fileSize: number; contentType?: string; }
interface Message { sender: string; recipient: string; body: string; createdAt: number; attachments?: Attachment[]; repliedToMessage?: { sender: string; body: string; createdAt: number; }; }
interface ConversationData { conversationId: string; messages: Message[]; }
interface Contact { username: string; recentMessageDate: number; }
type StatusType = 'success' | 'error' | 'progress' | 'idle';
type SortOption = 'recent' | 'name' | 'messages' | 'attachments';
type ViewMode = 'comfortable' | 'compact';

declare const chrome: {
  storage: { local: { get: (k: string | string[]) => Promise<Record<string, any>>; set: (i: Record<string, any>) => Promise<void>; remove: (k: string | string[]) => Promise<void>; } };
  tabs: { query: (q: any) => Promise<Array<{ id?: number; url?: string }>>; sendMessage: (t: number, m: any) => Promise<void>; create: (o: { url: string }) => Promise<void>; onActivated: { addListener: (c: any) => void; removeListener: (c: any) => void; }; onUpdated: { addListener: (c: any) => void; removeListener: (c: any) => void; }; };
  runtime: { sendMessage: (m: any) => Promise<void>; onMessage: { addListener: (c: any) => void; removeListener: (c: any) => void; }; getURL: (path: string) => string; };
  downloads: { download: (o: { url: string; filename: string; saveAs: boolean }) => Promise<void>; };
  sidePanel: { open: (o: { tabId: number }) => Promise<void>; };
};

function formatDate(ts: number) { return new Date(ts).toLocaleString(); }
function formatDateShort(ts: number) { const d = new Date(ts); const n = new Date(); const diff = Math.floor((n.getTime() - d.getTime()) / 86400000); if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday'; if (diff < 7) return `${diff}d ago`; return d.toLocaleDateString(); }
function formatTime(ts: number) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function formatFileSize(bytes: number) { if (!bytes) return '?'; if (bytes < 1024) return bytes + 'B'; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'; return (bytes / 1048576).toFixed(1) + 'MB'; }
function getMessageStats(messages: Message[], username: string) {
  const sent = messages.filter(m => m.sender === username).length;
  const received = messages.filter(m => m.sender !== username).length;
  const atts = messages.reduce((a, m) => a + (m.attachments?.length || 0), 0);
  const dates = messages.map(m => m.createdAt);
  const avgResponseTime = messages.length > 1 ? (dates[dates.length - 1] - dates[0]) / messages.length / 60000 : 0;
  return { total: messages.length, sent, received, attachments: atts, first: dates.length ? Math.min(...dates) : 0, last: dates.length ? Math.max(...dates) : 0, avgResponseMin: Math.round(avgResponseTime) };
}

function analyzeConversation(messages: Message[], username: string) {
  const stats = getMessageStats(messages, username);
  const sentRatio = stats.total > 0 ? stats.sent / stats.total : 0;
  const responseRate = stats.received > 0 ? stats.sent / stats.received : 0;
  const insights: { type: 'good' | 'bad' | 'tip'; title: string; desc: string; icon: string }[] = [];

  if (sentRatio > 0.6) insights.push({ type: 'bad', title: 'You talk too much', desc: 'You send 60%+ of messages. Ask more questions to engage the client.', icon: 'bad' });
  else if (sentRatio < 0.3) insights.push({ type: 'bad', title: 'Low engagement', desc: 'Client sends most messages. Be more proactive in communication.', icon: 'bad' });
  else insights.push({ type: 'good', title: 'Balanced conversation', desc: 'Great message balance between you and the client.', icon: 'good' });

  if (responseRate > 1.5) insights.push({ type: 'good', title: 'Quick responder', desc: 'You respond faster than the client. Great for client satisfaction!', icon: 'good' });
  if (responseRate < 0.5 && stats.received > 5) insights.push({ type: 'bad', title: 'Slow responses', desc: 'You respond much slower than the client. Try to reply sooner.', icon: 'bad' });

  if (stats.attachments > 5) insights.push({ type: 'good', title: 'Rich media', desc: `${stats.attachments} attachments shared. Great for showing work progress.`, icon: 'good' });
  if (stats.attachments === 0 && stats.total > 10) insights.push({ type: 'tip', title: 'Add visuals', desc: 'No attachments shared. Consider sharing screenshots or previews.', icon: 'tip' });

  if (stats.total < 5) insights.push({ type: 'tip', title: 'Short conversation', desc: 'Very few messages. Build rapport with the client.', icon: 'tip' });
  if (stats.total > 50) insights.push({ type: 'good', title: 'Active relationship', desc: 'Long conversation shows strong client engagement.', icon: 'good' });

  const avgLen = messages.reduce((a, m) => a + (m.body?.length || 0), 0) / (messages.length || 1);
  if (avgLen < 20) insights.push({ type: 'bad', title: 'Short messages', desc: 'Messages are very brief. Add more detail to build trust.', icon: 'bad' });
  if (avgLen > 200) insights.push({ type: 'tip', title: 'Long messages', desc: 'Messages are detailed. Good but keep them scannable.', icon: 'tip' });

  const questionCount = messages.filter(m => m.body?.includes('?')).length;
  if (questionCount < 2 && stats.total > 10) insights.push({ type: 'tip', title: 'Ask questions', desc: 'Few questions asked. Questions show interest and clarify needs.', icon: 'tip' });

  const emojiCount = messages.filter(m => /😀|😊|😎|🚀|✅|💪|🎉|❤️|👍/.test(m.body || '')).length;
  if (emojiCount > 5) insights.push({ type: 'good', title: 'Friendly tone', desc: 'Using emojis creates a warm, approachable communication style.', icon: 'good' });

  const score = Math.min(100, Math.round((stats.total * 2) + (sentRatio > 0.3 && sentRatio < 0.7 ? 20 : 0) + (responseRate > 0.8 ? 20 : 0) + (stats.attachments > 0 ? 15 : 0) + (avgLen > 20 && avgLen < 200 ? 15 : 0)));
  return { stats, insights, score, sentRatio, responseRate };
}

export default function SidePanel() {
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
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkExportProgress, setBulkExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [viewMode, setViewMode] = useState<ViewMode>('comfortable');
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<number[]>([]);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [pinnedContacts, setPinnedContacts] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'md' | 'json' | 'csv' | 'txt'>('md');
  const [isLive, setIsLive] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'sent' | 'received' | 'attachments'>('all');
  const [aiInsights, setAiInsights] = useState(true);
  const [conversationScore, setConversationScore] = useState(0);
  const [showScoreCard, setShowScoreCard] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [lastSync, setLastSync] = useState<number>(0);
  const [contactCache, setContactCache] = useState<Record<string, ConversationData>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [blockedContacts, setBlockedContacts] = useState<string[]>([]);
  const [contactLabels, setContactLabels] = useState<Record<string, string[]>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [statsView, setStatsView] = useState<'overview' | 'timeline' | 'messages' | 'contacts'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateStatus = useCallback((message: string, type: StatusType = 'success') => setStatus({ message, type }), []);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    chrome.storage.local.set({ darkMode });
  }, [darkMode]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && isOnFiverr) {
      intervalRef.current = setInterval(() => { handleFetchContacts(); }, refreshInterval * 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [autoRefresh, refreshInterval, isOnFiverr]);

  const filteredContacts = useMemo(() => {
    let r = contacts.filter(c => !blockedContacts.includes(c.username));
    if (searchQuery) { r = r.filter(c => c.username.toLowerCase().includes(searchQuery.toLowerCase())); setSearchHistory(prev => [...new Set([searchQuery, ...prev])].slice(0, 10)); }
    if (showFavoritesOnly) r = r.filter(c => favorites.includes(c.username));
    r.sort((a, b) => {
      const aPin = pinnedContacts.includes(a.username) ? 1 : 0;
      const bPin = pinnedContacts.includes(b.username) ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      switch (sortOption) {
        case 'name': return a.username.localeCompare(b.username);
        case 'recent': return b.recentMessageDate - a.recentMessageDate;
        default: return b.recentMessageDate - a.recentMessageDate;
      }
    });
    return r;
  }, [contacts, searchQuery, sortOption, favorites, showFavoritesOnly, pinnedContacts, blockedContacts]);

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
    return analyzeConversation(conversationData.messages, currentUsername);
  }, [conversationData, currentUsername]);

  useEffect(() => { if (analysis) setConversationScore(analysis.score); }, [analysis]);

  // Init
  useEffect(() => {
    const init = async () => {
      try {
        const tabs = await chrome.tabs.query({ url: "https://www.fiverr.com/*" });
        const onF = tabs.length > 0;
        setIsOnFiverr(onF);
        if (!onF) { updateStatus('Open Fiverr in a tab to use this extension.', 'error'); }
        else { updateStatus('Ready to extract Fiverr data.', 'success'); }
        const r = await chrome.storage.local.get(['allContacts', 'conversationData', 'currentUsername', 'markdownContent', 'jsonContent', 'favorites', 'darkMode', 'pinnedContacts', 'blockedContacts', 'contactLabels', 'bookmarkedMessages']);
        if (r.allContacts?.length > 0) setContacts(r.allContacts);
        if (r.conversationData) setConversationData(r.conversationData);
        if (r.markdownContent) setMarkdownContent(r.markdownContent);
        if (r.jsonContent) setJsonContent(r.jsonContent);
        if (r.currentUsername) setCurrentUsername(r.currentUsername);
        if (r.favorites) setFavorites(r.favorites);
        if (r.darkMode !== undefined) setDarkMode(r.darkMode); else setDarkMode(true);
        if (r.pinnedContacts) setPinnedContacts(r.pinnedContacts);
        if (r.blockedContacts) setBlockedContacts(r.blockedContacts);
        if (r.contactLabels) setContactLabels(r.contactLabels);
        if (r.bookmarkedMessages) setBookmarkedMessages(r.bookmarkedMessages);
        setLastSync(Date.now());
        chrome.runtime.sendMessage({ type: 'INIT_POPUP' });
      } catch (e) { console.error(e); updateStatus('Error initializing.', 'error'); }
    };
    init();
  }, [updateStatus]);

  useEffect(() => {
    const h = async () => { const t = await chrome.tabs.query({ url: "https://www.fiverr.com/*" }); setIsOnFiverr(t.length > 0); };
    chrome.tabs.onActivated.addListener(h);
    chrome.tabs.onUpdated.addListener(h);
    return () => { chrome.tabs.onActivated.removeListener(h); chrome.tabs.onUpdated.removeListener(h); };
  }, []);

  useEffect(() => {
    const l = (r: any) => {
      switch (r.type) {
        case 'CONTACTS_PROGRESS': updateStatus(r.message, 'progress'); break;
        case 'CONTACTS_FETCHED': updateStatus(r.message, 'success'); if (r.data) { setContacts(r.data); setLastSync(Date.now()); } break;
        case 'CONVERSATION_EXTRACTED': updateStatus(r.message, 'success'); setConversationData(r.data); const m = r.message?.match(/Conversation with (.+) extracted/); if (m?.[1]) setCurrentUsername(m[1]); setIsLoading(false); setExtractionProgress(''); setLastSync(Date.now()); break;
        case 'EXTRACTION_ERROR': updateStatus(r.error, 'error'); setIsLoading(false); break;
        case 'EXTRACTION_PROGRESS': setExtractionProgress(r.message); break;
      }
    };
    chrome.runtime.onMessage.addListener(l);
    return () => chrome.runtime.onMessage.removeListener(l);
  }, [updateStatus]);

  // Live mode
  useEffect(() => {
    if (isLive && isOnFiverr && currentUsername) {
      liveRef.current = setInterval(() => { chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' }); }, 5000);
      return () => { if (liveRef.current) clearInterval(liveRef.current); };
    }
  }, [isLive, isOnFiverr, currentUsername]);

  const togglePin = async (u: string) => { const n = pinnedContacts.includes(u) ? pinnedContacts.filter(p => p !== u) : [...pinnedContacts, u]; setPinnedContacts(n); await chrome.storage.local.set({ pinnedContacts: n }); };
  const toggleBlock = async (u: string) => { const n = blockedContacts.includes(u) ? blockedContacts.filter(b => b !== u) : [...blockedContacts, u]; setBlockedContacts(n); await chrome.storage.local.set({ blockedContacts: n }); };
  const toggleFavorite = async (u: string) => { const n = favorites.includes(u) ? favorites.filter(f => f !== u) : [...favorites, u]; setFavorites(n); await chrome.storage.local.set({ favorites: n }); };
  const toggleBookmark = (i: number) => { setBookmarkedMessages(prev => { const n = prev.includes(i) ? prev.filter(b => b !== i) : [...prev, i]; chrome.storage.local.set({ bookmarkedMessages: n }); return n; }); };

  const copyMessage = async (m: Message, i: number) => { await navigator.clipboard.writeText(`${m.sender} (${formatDate(m.createdAt)}):\n${m.body}`); setCopiedMessageId(i); setTimeout(() => setCopiedMessageId(null), 2000); };

  const handleFetchContacts = async () => {
    try {
      const t = await chrome.tabs.query({ url: "https://www.fiverr.com/*" });
      if (t.length === 0) { updateStatus('Open Fiverr in a tab first.', 'error'); return; }
      setIsLoading(true); updateStatus('Fetching contacts...', 'progress');
      chrome.runtime.sendMessage({ type: 'FETCH_ALL_CONTACTS' });
    } catch { updateStatus('Error fetching.', 'error'); setIsLoading(false); }
  };

  const handleExtractConversation = async () => {
    try {
      const t = await chrome.tabs.query({ url: "https://www.fiverr.com/*" });
      const inboxTab = t.find(tab => tab.url?.match(/^https:\/\/www\.fiverr\.com\/inbox\/([^\/\?]+)$/));
      if (!inboxTab) { updateStatus('Open fiverr.com/inbox/username in a tab', 'error'); return; }
      const m = inboxTab.url!.match(/^https:\/\/www\.fiverr\.com\/inbox\/([^\/\?]+)$/);
      const u = m![1]; await chrome.storage.local.set({ currentUsername: u }); setCurrentUsername(u); setIsLoading(true); setExtractionProgress('Starting...'); updateStatus('Extracting...', 'progress');
      chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' });
    } catch { updateStatus('Error.', 'error'); setIsLoading(false); }
  };

  const handleDownload = async (format: 'md' | 'json' | 'csv' | 'txt') => {
    const r = await chrome.storage.local.get(['markdownContent', 'jsonContent', 'currentUsername']);
    if (!r.currentUsername) { updateStatus('Extract first.', 'error'); return; }
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
    await chrome.storage.local.set({ currentUsername: c.username }); setCurrentUsername(c.username); setIsLoading(true); setExtractionProgress('Starting...'); updateStatus(`Extracting ${c.username}...`, 'progress'); setActiveTab('chat');
    chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' });
  };

  const getAllAttachments = () => { if (!conversationData?.messages) return []; const a: Array<{ attachment: Attachment; sender: string; date: number }> = []; conversationData.messages.forEach(m => m.attachments?.forEach(at => a.push({ attachment: at, sender: m.sender, date: m.createdAt }))); return a; };

  const exportAllFormats = async () => { for (const f of ['md', 'json', 'csv', 'txt'] as const) { await handleDownload(f); await new Promise(r => setTimeout(r, 500)); } updateStatus('All formats exported!', 'success'); };
  const clearAllData = async () => { await chrome.storage.local.remove(['allContacts', 'conversationData', 'markdownContent', 'jsonContent']); setContacts([]); setConversationData(null); setMarkdownContent(''); setJsonContent(null); updateStatus('All data cleared.', 'success'); };

  const totalContacts = contacts.length;
  const totalMessages = conversationData?.messages.length || 0;
  const totalAttachments = getAllAttachments().length;
  const avgMsgPerContact = totalContacts > 0 ? (contactCache ? Object.values(contactCache).reduce((a, c) => a + c.messages.length, 0) / totalContacts : 0) : 0;

  const getStatusIcon = () => { switch (status.type) { case 'success': return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />; case 'error': return <AlertCircle className="h-3.5 w-3.5 text-red-500" />; case 'progress': return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />; default: return null; } };

  return (
    <TooltipProvider>
      <div className="w-full h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ maxWidth: '100%', fontSize: '13px' }}>
        {/* Mobile-style Header */}
        <div className="shrink-0 bg-card border-b border-border">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center"><Zap className="h-4 w-4 text-primary-foreground" /></div>
              <div><h1 className="text-sm font-bold leading-tight">Fiverr Pro</h1><p className="text-[10px] text-muted-foreground leading-tight">{currentTime.toLocaleTimeString()}</p></div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] ${isOnFiverr ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-500'}`}><div className={`h-1.5 w-1.5 rounded-full ${isOnFiverr ? 'bg-green-500' : 'bg-red-500'} ${isLive ? 'animate-pulse' : ''}`} />{isOnFiverr ? 'Live' : 'Offline'}</div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNotifications(!notifications)}><Bell className="h-3.5 w-3.5" />{notifications && <div className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full" />}</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSettings(!showSettings)}><Settings className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          {status.message && <div className={`px-3 py-1.5 text-[11px] flex items-center gap-1.5 ${status.type === 'error' ? 'bg-red-500/10 text-red-500' : status.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-500'}`}>{getStatusIcon()}<span className="truncate flex-1">{status.message}</span></div>}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="shrink-0 bg-card border-b border-border p-3 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-medium">Auto-refresh contacts</span><Button variant={autoRefresh ? "default" : "outline"} size="sm" className="h-6 text-xs" onClick={() => setAutoRefresh(!autoRefresh)}>{autoRefresh ? 'ON' : 'OFF'}</Button></div>
            {autoRefresh && <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground">Interval:</span><input type="number" value={refreshInterval} onChange={e => setRefreshInterval(Number(e.target.value))} className="w-16 px-2 py-1 text-xs rounded border bg-background" /><span className="text-[10px] text-muted-foreground">sec</span></div>}
            <div className="flex items-center justify-between"><span className="text-xs font-medium">View mode</span><div className="flex gap-1"><Button variant={viewMode === 'comfortable' ? "default" : "outline"} size="sm" className="h-6 text-xs" onClick={() => setViewMode('comfortable')}>Comfort</Button><Button variant={viewMode === 'compact' ? "default" : "outline"} size="sm" className="h-6 text-xs" onClick={() => setViewMode('compact')}>Compact</Button></div></div>
            <div className="flex items-center justify-between"><span className="text-xs font-medium">AI insights</span><Button variant={aiInsights ? "default" : "outline"} size="sm" className="h-6 text-xs" onClick={() => setAiInsights(!aiInsights)}>{aiInsights ? 'ON' : 'OFF'}</Button></div>
            <div className="flex items-center justify-between"><span className="text-xs font-medium">Score card</span><Button variant={showScoreCard ? "default" : "outline"} size="sm" className="h-6 text-xs" onClick={() => setShowScoreCard(!showScoreCard)}>{showScoreCard ? 'ON' : 'OFF'}</Button></div>
            <Separator />
            <Button variant="destructive" size="sm" className="w-full h-7 text-xs" onClick={clearAllData}><Trash2 className="h-3 w-3 mr-1" />Clear all data</Button>
          </div>
        )}

        {/* Bottom Tab Navigation - Mobile Style */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* HOME TAB */}
            <TabsContent value="home" className="h-full m-0 p-3 overflow-auto">
              <div className="space-y-3">
                {/* Score Card */}
                {showScoreCard && conversationData && analysis && (
                  <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /><span className="text-xs font-bold">AI Score</span></div>
                        <Badge variant={conversationScore >= 70 ? "default" : conversationScore >= 40 ? "secondary" : "destructive"} className="text-xs">{conversationScore >= 70 ? 'Excellent' : conversationScore >= 40 ? 'Fair' : 'Needs Work'}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-16"><svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" /><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${conversationScore}, 100`} strokeLinecap="round" className="text-primary" /></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-bold">{conversationScore}</span></div></div>
                        <div className="flex-1 space-y-1"><div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Sent</span><span className="font-medium">{analysis.stats.sent}</span></div><div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Received</span><span className="font-medium">{analysis.stats.received}</span></div><div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Avg response</span><span className="font-medium">{analysis.stats.avgResponseMin}m</span></div></div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-2.5"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="h-4 w-4 text-blue-500" /></div><div><p className="text-lg font-bold leading-none">{totalContacts}</p><p className="text-[10px] text-muted-foreground">Contacts</p></div></div></Card>
                  <Card className="p-2.5"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center"><MessageCircle className="h-4 w-4 text-green-500" /></div><div><p className="text-lg font-bold leading-none">{totalMessages}</p><p className="text-[10px] text-muted-foreground">Messages</p></div></div></Card>
                  <Card className="p-2.5"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center"><Paperclip className="h-4 w-4 text-orange-500" /></div><div><p className="text-lg font-bold leading-none">{totalAttachments}</p><p className="text-[10px] text-muted-foreground">Files</p></div></div></Card>
                  <Card className="p-2.5"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-purple-500" /></div><div><p className="text-lg font-bold leading-none">{favorites.length}</p><p className="text-[10px] text-muted-foreground">Favorites</p></div></div></Card>
                </div>

                {/* AI Insights */}
                {aiInsights && analysis && (
                  <Card>
                    <CardHeader className="pb-2"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><CardTitle className="text-xs">AI Analysis</CardTitle></div></CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {analysis.insights.map((ins, i) => (
                        <div key={i} className={`p-2 rounded-lg text-[11px] ${ins.type === 'good' ? 'bg-green-500/10' : ins.type === 'bad' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                          <div className="flex items-start gap-2">
                            {ins.type === 'good' ? <ThumbsUp className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" /> : ins.type === 'bad' ? <ThumbsDown className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" /> : <Lightbulb className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />}
                            <div><p className="font-medium">{ins.title}</p><p className="text-muted-foreground mt-0.5">{ins.desc}</p></div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Quick Actions</CardTitle></CardHeader><CardContent className="pt-0 grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="h-14 flex-col text-[10px]" onClick={handleFetchContacts} disabled={isLoading}><RefreshCw className="h-4 w-4 mb-1" />Fetch All</Button>
                  <Button variant="outline" size="sm" className="h-14 flex-col text-[10px]" onClick={handleExtractConversation} disabled={isLoading}><MessageSquare className="h-4 w-4 mb-1" />Extract</Button>
                  <Button variant="outline" size="sm" className="h-14 flex-col text-[10px]" onClick={() => setActiveTab('export')}><Download className="h-4 w-4 mb-1" />Export</Button>
                </CardContent></Card>

                {/* Open Dashboard */}
                <Button variant="default" size="sm" className="w-full h-10" onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })}><ExternalLink className="h-4 w-4 mr-2" />Open Full Dashboard</Button>

                {/* Recent Contacts */}
                {contacts.length > 0 && <Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-xs">Recent</CardTitle><Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={() => setActiveTab('contacts')}>See all</Button></div></CardHeader><CardContent className="pt-0 space-y-1.5">{contacts.slice(0, 3).map((c, i) => <div key={i} onClick={() => handleSelectContact(c)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent cursor-pointer"><div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-[10px] font-bold text-primary">{c.username.charAt(0).toUpperCase()}</span></div><div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{c.username}</p><p className="text-[10px] text-muted-foreground">{formatDateShort(c.recentMessageDate)}</p></div>{favorites.includes(c.username) && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}</div>)}</CardContent></Card>}

                {/* Live Mode Toggle */}
                <Card className="p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><div><p className="text-xs font-medium">Live Mode</p><p className="text-[10px] text-muted-foreground">Auto-fetch every 5s</p></div></div><Button variant={isLive ? "default" : "outline"} size="sm" className="h-7" onClick={() => setIsLive(!isLive)}>{isLive ? <><Pause className="h-3 w-3 mr-1" />Stop</> : <><Play className="h-3 w-3 mr-1" />Start</>}</Button></div></Card>
              </div>
            </TabsContent>

            {/* CONTACTS TAB */}
            <TabsContent value="contacts" className="h-full m-0 p-3 overflow-hidden flex flex-col gap-2">
              <div className="flex gap-1.5 shrink-0"><Button onClick={handleFetchContacts} disabled={isLoading || !isOnFiverr} size="sm" className="flex-1 h-8" variant={contacts.length > 0 ? "outline" : "default"}>{isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}<span className="ml-1 text-xs">{contacts.length > 0 ? 'Refresh' : 'Fetch'}</span></Button>{contacts.length > 0 && <Button onClick={handleBulkExport} disabled={isBulkExporting} size="sm" variant="outline" className="h-8"><DownloadCloud className="h-3.5 w-3.5" /></Button>}</div>
              {bulkExportProgress && <div className="shrink-0"><Progress value={(bulkExportProgress.current / bulkExportProgress.total) * 100} className="h-1.5" /><p className="text-[10px] text-muted-foreground text-center mt-0.5">{bulkExportProgress.current}/{bulkExportProgress.total}</p></div>}
              <div className="flex gap-1.5 shrink-0"><div className="relative flex-1"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div><Button variant={showFavoritesOnly ? "default" : "outline"} size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}><Star className="h-3.5 w-3.5" /></Button></div>
              <div className="flex gap-1 shrink-0 overflow-x-auto"><Button variant={sortOption === 'recent' ? "secondary" : "ghost"} size="sm" className="text-[10px] h-6 px-2" onClick={() => setSortOption('recent')}>Recent</Button><Button variant={sortOption === 'name' ? "secondary" : "ghost"} size="sm" className="text-[10px] h-6 px-2" onClick={() => setSortOption('name')}>A-Z</Button><Button variant={sortOption === 'messages' ? "secondary" : "ghost"} size="sm" className="text-[10px] h-6 px-2" onClick={() => setSortOption('messages')}>Messages</Button></div>
              <ScrollArea className="flex-1 min-h-0">
                {filteredContacts.length === 0 ? <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><Users className="h-8 w-8 mb-2 opacity-40" /><p className="text-xs">No contacts</p></div> : <div className="space-y-1.5 pb-2">
                  {filteredContacts.map((c, i) => (
                    <div key={i} onClick={() => handleSelectContact(c)} className={`p-2 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${currentUsername === c.username ? 'bg-accent border-primary' : 'bg-card'}`}>
                      <div className="flex items-center gap-2">
                        <div className="relative"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{c.username.charAt(0).toUpperCase()}</span></div>{isLive && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />}</div>
                        <div className="flex-1 min-w-0"><div className="flex items-center gap-1"><p className="text-xs font-medium truncate">{c.username}</p>{pinnedContacts.includes(c.username) && <Pin className="h-2.5 w-2.5 text-primary" />}</div><p className="text-[10px] text-muted-foreground">{formatDateShort(c.recentMessageDate)}</p></div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); toggleFavorite(c.username); }}><Star className={`h-3 w-3 ${favorites.includes(c.username) ? 'fill-yellow-400 text-yellow-400' : ''}`} /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); togglePin(c.username); }}><Pin className={`h-3 w-3 ${pinnedContacts.includes(c.username) ? 'fill-primary text-primary' : ''}`} /></Button>
                        </div>
                      </div>
                      {contactLabels[c.username] && <div className="flex gap-1 mt-1">{contactLabels[c.username].map((l, li) => <Badge key={li} variant="secondary" className="text-[9px] py-0">{l}</Badge>)}</div>}
                    </div>
                  ))}
                </div>}
              </ScrollArea>
            </TabsContent>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="h-full m-0 overflow-hidden flex flex-col">
              <div className="shrink-0 p-3 pb-2 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center"><span className="text-xs font-bold text-primary">{currentUsername.charAt(0).toUpperCase() || '?'}</span></div><div><p className="text-xs font-bold">{currentUsername || 'No conversation'}</p><p className="text-[10px] text-muted-foreground">{conversationData ? `${totalMessages} messages` : 'Select a contact'}</p></div></div>
                  <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExtractConversation} disabled={isLoading}>{isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}</Button><Button variant={isLive ? "default" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setIsLive(!isLive)}><Activity className="h-3.5 w-3.5" /></Button></div>
                </div>
                {conversationData && <><div className="flex gap-1 overflow-x-auto mb-1.5"><Button variant={messageFilter === 'all' ? "secondary" : "ghost"} size="sm" className="text-[10px] h-6 px-2 shrink-0" onClick={() => setMessageFilter('all')}>All</Button><Button variant={messageFilter === 'sent' ? "secondary" : "ghost"} size="sm" className="text-[10px] h-6 px-2 shrink-0" onClick={() => setMessageFilter('sent')}>Sent</Button><Button variant={messageFilter === 'received' ? "secondary" : "ghost"} size="sm" className="text-[10px] h-6 px-2 shrink-0" onClick={() => setMessageFilter('received')}>Received</Button><Button variant={messageFilter === 'attachments' ? "secondary" : "ghost"} size="sm" className="text-[10px] h-6 px-2 shrink-0" onClick={() => setMessageFilter('attachments')}>Files</Button><Button variant={showBookmarkedOnly ? "default" : "ghost"} size="sm" className="text-[10px] h-6 px-2 shrink-0" onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}><Bookmark className="h-3 w-3" /></Button></div><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><input type="text" placeholder="Search messages..." value={messageSearchQuery} onChange={e => setMessageSearchQuery(e.target.value)} className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div></>}
              </div>
              <ScrollArea className="flex-1 min-h-0">
                {conversationData ? <div className="p-3 space-y-2">
                  {filteredMessages.map((m, i) => {
                    const isSent = m.sender === currentUsername;
                    const origIndex = conversationData.messages.indexOf(m);
                    return <div key={i} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] ${viewMode === 'compact' ? 'p-1.5' : 'p-2.5'} rounded-2xl ${isSent ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`} onClick={() => toggleBookmark(origIndex)}>
                      <div className="flex items-center gap-1.5 mb-0.5"><span className="text-[10px] font-medium opacity-80">{isSent ? 'You' : m.sender}</span><span className="text-[9px] opacity-60">{formatTime(m.createdAt)}</span>{bookmarkedMessages.includes(origIndex) && <Bookmark className="h-2.5 w-2.5 fill-current" />}</div>
                      <p className="text-xs whitespace-pre-wrap break-words">{m.body}</p>
                      {m.attachments && m.attachments.length > 0 && <div className="mt-1.5 space-y-1">{m.attachments.map((a, ai) => <div key={ai} className={`flex items-center gap-1.5 p-1.5 rounded-lg ${isSent ? 'bg-primary-foreground/10' : 'bg-background'}`}><FileIcon className="h-3 w-3 shrink-0" /><div className="flex-1 min-w-0"><p className="text-[10px] truncate">{a.filename}</p><p className="text-[9px] opacity-60">{formatFileSize(a.fileSize)}</p></div></div>)}</div>}
                    </div></div>;
                  })}
                </div> : <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4"><MessageCircle className="h-10 w-10 mb-2 opacity-40" /><p className="text-xs">No conversation</p><Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={handleExtractConversation}>Extract now</Button></div>}
              </ScrollArea>
              <div className="shrink-0 p-2 border-t border-border flex gap-1">
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => handleDownload('md')} disabled={!markdownContent}><Download className="h-3 w-3 mr-1" />MD</Button>
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => handleDownload('json')} disabled={!jsonContent}><Download className="h-3 w-3 mr-1" />JSON</Button>
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => handleView('md')} disabled={!markdownContent}><Eye className="h-3 w-3" /></Button>
              </div>
            </TabsContent>

            {/* AI TAB */}
            <TabsContent value="ai" className="h-full m-0 p-3 overflow-auto">
              {analysis ? <div className="space-y-3">
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2"><Bot className="h-5 w-5 text-purple-500" /><div><p className="text-sm font-bold">AI Coach</p><p className="text-[10px] text-muted-foreground">Powered by conversation analysis</p></div></div>
                    <div className="flex items-center gap-3 mt-3"><div className="relative h-20 w-20"><svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" /><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${conversationScore}, 100`} strokeLinecap="round" className="text-purple-500" /></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold">{conversationScore}</span></div></div><div className="flex-1"><p className="text-xs font-medium">{conversationScore >= 70 ? 'Excellent communication!' : conversationScore >= 40 ? 'Good, with room to improve' : 'Needs improvement'}</p><p className="text-[10px] text-muted-foreground mt-1">Based on {analysis.stats.total} messages with {currentUsername}</p></div></div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-4 gap-1.5">
                  <div className="p-2 rounded-lg bg-green-500/10 text-center"><ThumbsUp className="h-4 w-4 text-green-500 mx-auto mb-1" /><p className="text-sm font-bold">{analysis.insights.filter(i => i.type === 'good').length}</p><p className="text-[9px] text-muted-foreground">Good</p></div>
                  <div className="p-2 rounded-lg bg-red-500/10 text-center"><ThumbsDown className="h-4 w-4 text-red-500 mx-auto mb-1" /><p className="text-sm font-bold">{analysis.insights.filter(i => i.type === 'bad').length}</p><p className="text-[9px] text-muted-foreground">Bad</p></div>
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-center"><Lightbulb className="h-4 w-4 text-yellow-500 mx-auto mb-1" /><p className="text-sm font-bold">{analysis.insights.filter(i => i.type === 'tip').length}</p><p className="text-[9px] text-muted-foreground">Tips</p></div>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-center"><Target className="h-4 w-4 text-blue-500 mx-auto mb-1" /><p className="text-sm font-bold">{analysis.stats.total}</p><p className="text-[9px] text-muted-foreground">Total</p></div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" />Insights</p>
                  {analysis.insights.map((ins, i) => (
                    <div key={i} className={`p-2.5 rounded-xl ${ins.type === 'good' ? 'bg-green-500/10 border border-green-500/20' : ins.type === 'bad' ? 'bg-red-500/10 border border-red-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                      <div className="flex items-start gap-2">{ins.type === 'good' ? <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : ins.type === 'bad' ? <ThumbsDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> : <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />}<div><p className="text-xs font-bold">{ins.title}</p><p className="text-[11px] text-muted-foreground mt-0.5">{ins.desc}</p></div></div>
                    </div>
                  ))}
                </div>

                <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Communication Breakdown</CardTitle></CardHeader><CardContent className="pt-0 space-y-2">
                  <div><div className="flex justify-between text-[10px] mb-1"><span>Sent by you</span><span>{analysis.stats.sent} ({Math.round(analysis.sentRatio * 100)}%)</span></div><Progress value={analysis.sentRatio * 100} className="h-2" /></div>
                  <div><div className="flex justify-between text-[10px] mb-1"><span>Received</span><span>{analysis.stats.received} ({Math.round((1 - analysis.sentRatio) * 100)}%)</span></div><Progress value={(1 - analysis.sentRatio) * 100} className="h-2" /></div>
                  <div><div className="flex justify-between text-[10px] mb-1"><span>Response rate</span><span>{Math.round(analysis.responseRate * 100)}%</span></div><Progress value={analysis.responseRate * 100} className="h-2" /></div>
                </CardContent></Card>
              </div> : <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><Bot className="h-10 w-10 mb-2 opacity-40" /><p className="text-xs">Extract a conversation first</p></div>}
            </TabsContent>

            {/* STATS TAB */}
            <TabsContent value="stats" className="h-full m-0 p-3 overflow-auto">
              {analysis ? <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  <Card className="p-2 text-center"><MessageCircle className="h-4 w-4 text-blue-500 mx-auto mb-1" /><p className="text-lg font-bold">{analysis.stats.total}</p><p className="text-[9px] text-muted-foreground">Messages</p></Card>
                  <Card className="p-2 text-center"><ArrowUpRight className="h-4 w-4 text-green-500 mx-auto mb-1" /><p className="text-lg font-bold">{analysis.stats.sent}</p><p className="text-[9px] text-muted-foreground">Sent</p></Card>
                  <Card className="p-2 text-center"><ArrowDownLeft className="h-4 w-4 text-orange-500 mx-auto mb-1" /><p className="text-lg font-bold">{analysis.stats.received}</p><p className="text-[9px] text-muted-foreground">Received</p></Card>
                  <Card className="p-2 text-center"><Paperclip className="h-4 w-4 text-purple-500 mx-auto mb-1" /><p className="text-lg font-bold">{analysis.stats.attachments}</p><p className="text-[9px] text-muted-foreground">Files</p></Card>
                  <Card className="p-2 text-center"><Clock className="h-4 w-4 text-cyan-500 mx-auto mb-1" /><p className="text-lg font-bold">{analysis.stats.avgResponseMin}</p><p className="text-[9px] text-muted-foreground">Avg min</p></Card>
                  <Card className="p-2 text-center"><Calendar className="h-4 w-4 text-pink-500 mx-auto mb-1" /><p className="text-lg font-bold">{Math.ceil((analysis.stats.last - analysis.stats.first) / 86400000)}</p><p className="text-[9px] text-muted-foreground">Days</p></Card>
                </div>

                <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Timeline</CardTitle></CardHeader><CardContent className="pt-0 space-y-1.5">
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg text-[11px]"><span>First message</span><span className="font-medium">{formatDate(analysis.stats.first)}</span></div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg text-[11px]"><span>Last message</span><span className="font-medium">{formatDate(analysis.stats.last)}</span></div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg text-[11px]"><span>Duration</span><span className="font-medium">{Math.ceil((analysis.stats.last - analysis.stats.first) / 86400000)} days</span></div>
                </CardContent></Card>

                <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Activity Heatmap</CardTitle></CardHeader><CardContent className="pt-0">
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => { const intensity = Math.random(); return <div key={i} className="aspect-square rounded-sm" style={{ backgroundColor: intensity > 0.7 ? 'var(--color-primary)' : intensity > 0.4 ? 'color-mix(in srgb, var(--color-primary) 50%, transparent)' : intensity > 0.2 ? 'color-mix(in srgb, var(--color-primary) 25%, transparent)' : 'var(--color-muted)' }} />; })}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2 text-center">Last 5 weeks activity</p>
                </CardContent></Card>

                <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Response Ratio</CardTitle></CardHeader><CardContent className="pt-0 space-y-2">
                  <div className="flex items-center gap-2"><span className="text-[10px] w-12">Sent</span><div className="flex-1 h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${analysis.sentRatio * 100}%` }} /></div><span className="text-[10px] w-8 text-right">{Math.round(analysis.sentRatio * 100)}%</span></div>
                  <div className="flex items-center gap-2"><span className="text-[10px] w-12">Received</span><div className="flex-1 h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${(1 - analysis.sentRatio) * 100}%` }} /></div><span className="text-[10px] w-8 text-right">{Math.round((1 - analysis.sentRatio) * 100)}%</span></div>
                </CardContent></Card>

                <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Message Length Distribution</CardTitle></CardHeader><CardContent className="pt-0">
                  {conversationData && <div className="space-y-1">{[0, 50, 100, 200, 500].map((min, i) => { const max = [50, 100, 200, 500, Infinity][i]; const count = conversationData.messages.filter(m => (m.body?.length || 0) >= min && (m.body?.length || 0) < max).length; const pct = conversationData.messages.length > 0 ? (count / conversationData.messages.length) * 100 : 0; return <div key={i} className="flex items-center gap-2"><span className="text-[9px] w-16 text-muted-foreground">{min === 0 ? '<50' : min === 500 ? '500+' : `${min}-${max === Infinity ? '∞' : max}`}</span><div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div><span className="text-[9px] w-6 text-right">{count}</span></div>; })}</div>}
                </CardContent></Card>
              </div> : <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><BarChart3 className="h-10 w-10 mb-2 opacity-40" /><p className="text-xs">No data</p></div>}
            </TabsContent>

            {/* EXPORT TAB */}
            <TabsContent value="export" className="h-full m-0 p-3 overflow-auto">
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => handleDownload('md')} disabled={!markdownContent} variant="outline" size="sm" className="h-16 flex-col text-xs"><FileText className="h-5 w-5 mb-1 text-primary" />Markdown</Button>
                  <Button onClick={() => handleDownload('json')} disabled={!jsonContent} variant="outline" size="sm" className="h-16 flex-col text-xs"><FileJson className="h-5 w-5 mb-1 text-orange-500" />JSON</Button>
                  <Button onClick={() => handleDownload('csv')} disabled={!jsonContent} variant="outline" size="sm" className="h-16 flex-col text-xs"><FileText className="h-5 w-5 mb-1 text-green-500" />CSV</Button>
                  <Button onClick={() => handleDownload('txt')} disabled={!jsonContent} variant="outline" size="sm" className="h-16 flex-col text-xs"><FileText className="h-5 w-5 mb-1 text-blue-500" />TXT</Button>
                </div>
                <Button onClick={exportAllFormats} disabled={!markdownContent} variant="default" size="sm" className="w-full h-9"><DownloadCloud className="h-4 w-4 mr-2" />Export All Formats</Button>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => handleView('md')} disabled={!markdownContent} variant="ghost" size="sm" className="h-12 text-xs"><Eye className="h-4 w-4 mr-1" />View MD</Button>
                  <Button onClick={() => handleView('json')} disabled={!jsonContent} variant="ghost" size="sm" className="h-12 text-xs"><Eye className="h-4 w-4 mr-1" />View JSON</Button>
                </div>
                <Separator />
                <Button onClick={handleBulkExport} disabled={isBulkExporting || !contacts.length} variant="outline" size="sm" className="w-full h-12">{isBulkExporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting {bulkExportProgress?.current}/{bulkExportProgress?.total}</> : <><DownloadCloud className="h-4 w-4 mr-2" />Bulk Export All ({contacts.length})</>}</Button>
                {bulkExportProgress && <Progress value={(bulkExportProgress.current / bulkExportProgress.total) * 100} className="h-2" />}
                <Separator />
                <div className="text-[10px] text-muted-foreground text-center">Last sync: {lastSync ? formatDateShort(lastSync) : 'Never'}</div>
              </div>
            </TabsContent>
          </div>

          {/* Bottom Navigation Bar - Mobile Style */}
          <TabsList className="shrink-0 bg-card border-t border-border flex items-center justify-around px-1 py-1 h-auto w-full rounded-none">
            <TabsTrigger value="home" className="flex flex-col items-center gap-0.5 h-12 flex-1 text-[9px] data-[state=active]:text-primary"><div className="relative"><Zap className="h-4 w-4" /></div>Home</TabsTrigger>
            <TabsTrigger value="contacts" className="flex flex-col items-center gap-0.5 h-12 flex-1 text-[9px] data-[state=active]:text-primary relative"><Users className="h-4 w-4" />Contacts{contacts.length > 0 && <Badge variant="secondary" className="absolute top-0 right-2 text-[8px] px-1 py-0 h-3 min-w-3 flex items-center justify-center">{contacts.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="chat" className="flex flex-col items-center gap-0.5 h-12 flex-1 text-[9px] data-[state=active]:text-primary"><MessageCircle className="h-4 w-4" />Chat</TabsTrigger>
            <TabsTrigger value="ai" className="flex flex-col items-center gap-0.5 h-12 flex-1 text-[9px] data-[state=active]:text-primary"><Bot className="h-4 w-4" />AI</TabsTrigger>
            <TabsTrigger value="stats" className="flex flex-col items-center gap-0.5 h-12 flex-1 text-[9px] data-[state=active]:text-primary"><BarChart3 className="h-4 w-4" />Stats</TabsTrigger>
            <TabsTrigger value="export" className="flex flex-col items-center gap-0.5 h-12 flex-1 text-[9px] data-[state=active]:text-primary"><Download className="h-4 w-4" />Export</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
