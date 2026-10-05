import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import AIChatWindow from '@/components/ai/AIChatWindow';
import {
  Sparkles, Users, FileText, Briefcase, Search, GitCompare,
  Plus, Trash2, MessageSquare, Clock, ChevronRight, Menu, X,
  Star, Target, Zap, Bot, Lightbulb, BarChart3, Award
} from 'lucide-react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { cn, getRelativeTime, truncate } from '@/lib/utils';
import { getChatHistory, sendMessage, deleteChat, createChat } from '@/services/chatService';

const SUGGESTED_PROMPTS = [
  {
    title: 'Find my best candidates',
    prompt: 'Analyze my job postings and surface the top 5 candidates overall, ranking by match potential. Include key strengths, risk factors, and which job each is best suited for.',
    icon: Users,
    category: 'Sourcing',
  },
  {
    title: "Explain this candidate's match",
    prompt: 'Pick one of my candidates with a high match score for the most recent job I posted, and explain in detail why they are a strong match — break down skills, experience, education, and location fit. Also mention any potential gaps.',
    icon: Target,
    category: 'Matching',
  },
  {
    title: 'Generate interview questions',
    prompt: 'Create 10 interview questions for a Senior Full Stack Developer role (React + Node.js). Mix: 4 technical/coding, 3 system design/architecture, 2 behavioral with STAR format, 1 cultural fit. Include difficulty level and what to look for in answers.',
    icon: Zap,
    category: 'Interviews',
  },
  {
    title: 'Create a job description',
    prompt: 'Draft a compelling job description for a Senior React Developer at a fast-growing SaaS startup (Bangalore, 5-8 years, 20-30 LPA). Include: role summary, key responsibilities, must-have skills, nice-to-haves, benefits, and a catchy "Why join us?" section. Optimize for inclusivity and ATS.',
    icon: FileText,
    category: 'Job Posts',
  },
  {
    title: 'Find skill gaps in my team',
    prompt: "Analyze the most in-demand skills across my active job postings and tell me: (1) Top 5 skills my candidate pool is missing, (2) How to upskill existing team members in those areas with specific courses, (3) 3 interview questions to probe those skills in candidates.",
    icon: BarChart3,
    category: 'Team',
  },
  {
    title: 'Compare candidates side-by-side',
    prompt: 'Take the last 3 candidates I shortlisted and build a comparison table: experience, top skills, college tier, notice period, expected salary, culture signals. Then make a data-driven recommendation on who to advance to final rounds with pros/cons for each.',
    icon: GitCompare,
    category: 'Decisions',
  },
];

const CATEGORY_ORDER = ['Sourcing', 'Matching', 'Interviews', 'Job Posts', 'Team', 'Decisions'];

export default function AIAssistant() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await getChatHistory();
      setChats(history);
      if (history.length > 0 && !activeChatId) {
        setActiveChatId(history[0].id);
        setMessages(history[0].messages || []);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [activeChatId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    if (activeChatId) {
      const chat = chats.find(c => c.id === activeChatId);
      if (chat) setMessages(chat.messages || []);
    }
  }, [activeChatId, chats]);

  const handleNewChat = async () => {
    try {
      const newChat = await createChat('New Chat');
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
      setSidebarOpen(false);
      toast.success('Started a new conversation');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;
    setIsTyping(true);
    try {
      let chatId = activeChatId;
      if (!chatId) {
        const nc = await createChat(text.slice(0, 50));
        chatId = nc.id;
        setActiveChatId(chatId);
        setChats(prev => [nc, ...prev]);
      }
      const res = await sendMessage(chatId, text.trim());
      const userMsg = res.userMessage;
      const aiMsg = res.assistantMessage;
      setMessages(prev => [...prev, userMsg, aiMsg]);
      setChats(prev => prev.map(c => c.id === chatId
        ? { ...c, messages: [...(c.messages || []), userMsg, aiMsg], title: c.title === 'New Chat' ? text.slice(0, 50) + (text.length > 50 ? '...' : '') : c.title }
        : c
      ));
    } catch (e) {
      toast.error(e.message || 'Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleDelete = async (chatId, e) => {
    e?.stopPropagation?.();
    setDeleting(chatId);
    try {
      await deleteChat(chatId);
      const remaining = chats.filter(c => c.id !== chatId);
      setChats(remaining);
      if (activeChatId === chatId) {
        if (remaining.length > 0) {
          setActiveChatId(remaining[0].id);
          setMessages(remaining[0].messages || []);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
      toast.success('Chat deleted');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setSidebarOpen(false);
  };

  const handleClearChat = async () => {
    if (!activeChatId) return;
    try {
      const nc = await createChat('New Chat');
      setChats(prev => [nc, ...prev]);
      setActiveChatId(nc.id);
      setMessages([]);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const activeSuggestions = useMemo(() => {
    const list = activeChatId ? [] : SUGGESTED_PROMPTS;
    if (messages.length > 0 && messages.length < 6) {
      return [
        { title: 'Shortlist and rank these candidates', prompt: 'Based on what we discussed, shortlist the top 3 candidates and rank them. Justify each ranking with 2 specific data points.', icon: Award, category: 'Follow-up' },
        { title: 'Draft outreach messages', prompt: 'Write 3 personalized recruiter outreach messages (LinkedIn/email) to the top candidates. Keep each under 120 words with clear call-to-action.', icon: MessageSquare, category: 'Follow-up' },
        { title: 'Design a take-home test', prompt: 'Design a 90-minute take-home coding challenge for these candidates. Include: problem statement, evaluation rubric (scored 1-5), and what submissions separate top 10%.', icon: FileText, category: 'Follow-up' },
      ];
    }
    return list;
  }, [activeChatId, messages.length]);

  const promptSuggestions = useMemo(() => {
    if (messages.length > 0) return [
      'Explain the tradeoffs in your recommendation',
      'What other data should I consider?',
      'Draft a feedback email to the candidates not selected',
      'Create interview scorecards',
    ];
    return SUGGESTED_PROMPTS.slice(0, 4).map(p => p.title);
  }, [messages.length]);

  if (error) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Header onNew={handleNewChat} />
        <ErrorState onRetry={loadHistory} message={error.message} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 h-[calc(100vh-200px)] min-h-[620px]">
        {/* Sidebar (desktop) / Drawer (mobile) */}
        <div className={cn(
          'fixed lg:relative inset-y-0 left-0 z-40 lg:z-0 w-72 max-w-[85%] lg:w-72 shrink-0 bg-white dark:bg-surface-900 lg:bg-transparent lg:!inset-auto',
          'transform transition-transform duration-300 ease-out flex flex-col lg:translate-x-0 lg:!static',
          sidebarOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        )}>
          {sidebarOpen && (
            <div
              className="absolute inset-0 -z-10 lg:hidden bg-black/50 backdrop-blur-sm w-screen"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Card className="h-full flex flex-col flex-1 lg:!shadow-sm relative -ml-2 pl-2 lg:pl-0 lg:!ml-0 !w-auto !bg-white/80 lg:!bg-surface-card dark:!bg-surface-900/80 backdrop-blur">
            <CardContent className="p-4 flex flex-col h-full gap-3 flex-1 overflow-hidden">
              <div className="flex items-center justify-between gap-2 lg:hidden mb-1">
                <h3 className="font-bold text-surface-900 dark:text-white">Chat History</h3>
                <Button size="sm" variant="ghost" onClick={() => setSidebarOpen(false)} icon={<X className="w-4 h-4" />} />
              </div>

              <Button fullWidth icon={<Plus className="w-4 h-4" />} onClick={handleNewChat}>
                New Chat
              </Button>

              {loading ? (
                <div className="mt-2 flex-1 overflow-y-auto"><SkeletonList count={6} /></div>
              ) : chats.length === 0 ? (
                <div className="mt-6">
                  <EmptyState size="sm" title="No conversations yet" description="Start a chat above or pick a suggestion below." />
                </div>
              ) : (
                <div className="mt-2 flex-1 overflow-y-auto pr-1 space-y-1 -mr-1">
                  <div className="flex items-center justify-between px-2 pt-1 pb-2 sticky top-0 bg-white dark:bg-surface-900 z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Recent</span>
                    <span className="text-[10px] text-surface-400">{chats.length}</span>
                  </div>
                  {chats.map(c => {
                    const isActive = c.id === activeChatId;
                    const lastMsg = (c.messages || []).slice(-1)[0];
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectChat(c.id)}
                        className={cn(
                          'w-full text-left p-3 rounded-xl transition-all group relative flex flex-col gap-1.5',
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 shadow-sm'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-800/60 border border-transparent'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={cn(
                              'w-7 h-7 rounded-lg shrink-0 flex items-center justify-center',
                              isActive ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                            )}>
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <p className={cn(
                              'text-sm font-semibold truncate flex-1 min-w-0',
                              isActive ? 'text-brand-700 dark:text-brand-300' : 'text-surface-800 dark:text-surface-200'
                            )}>
                              {c.title || 'New Chat'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDelete(c.id, e)}
                            disabled={deleting === c.id}
                            className={cn(
                              'shrink-0 p-1 rounded-md transition-all',
                              'opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100',
                              'text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40',
                              isActive && '!opacity-100',
                              deleting === c.id && 'animate-pulse'
                            )}
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 pl-9 text-[11px] text-surface-500 dark:text-surface-400">
                          <Clock className="w-3 h-3 shrink-0 opacity-70" />
                          <span className="truncate">{c.messages?.length || 0} msgs • {getRelativeTime(c.updatedAt || c.createdAt)}</span>
                        </div>
                        {lastMsg && (
                          <p className="pl-9 text-xs text-surface-500 dark:text-surface-400 truncate line-clamp-1">
                            {lastMsg.role === 'user' ? 'You: ' : ''}{truncate(lastMsg.content, 80)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-surface-100 dark:border-surface-800">
                <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors cursor-pointer">
                  <Avatar name={user?.name || 'You'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{user?.name || 'Recruiter'}</p>
                    <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate">{user?.company || 'Workspace'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 gap-4 h-full">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                size="sm"
                variant="ghost"
                className="lg:hidden"
                icon={<Menu className="w-5 h-5" />}
                onClick={() => setSidebarOpen(true)}
              />
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-brand-500" />
                  AI Recruiter Assistant
                </h1>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 hidden sm:block">
                  Strategize sourcing, analyze matches, draft outreach, and make faster, data-backed hiring decisions
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
              <Badge variant="soft" className="gap-1.5"><Bot className="w-3 h-3" /> Powered by HireMind AI</Badge>
              {chats.length > 0 && (
                <Badge variant="outline" className="gap-1.5"><MessageSquare className="w-3 h-3" /> {chats.length} conversations</Badge>
              )}
            </div>
          </div>

          {/* Suggestions header (shown before any active chat OR on new chat) */}
          {(!activeChatId || messages.length === 0) && activeSuggestions.length > 0 && (
            <Card className="!shadow-sm overflow-hidden border-2 border-brand-100 dark:border-brand-900/60 bg-gradient-to-br from-brand-50/50 via-transparent to-emerald-50/40 dark:from-brand-950/20 dark:to-emerald-950/10">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400">Suggested Workflows</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white">How can I accelerate your hiring today?</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Tap a card below to get started with a ready-made, recruiter-tested prompt.</p>
                  </div>
                  {!activeChatId && chats.length > 0 && (
                    <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={() => handleSelectChat(chats[0].id)}>
                      Continue last chat
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {CATEGORY_ORDER.flatMap(cat =>
                    SUGGESTED_PROMPTS
                      .filter(s => s.category === cat)
                      .map(s => {
                        const SIcon = s.icon;
                        return (
                          <button
                            key={s.title}
                            onClick={() => handleSend(s.prompt)}
                            className="group text-left p-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-brand-400 dark:hover:border-brand-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                                <SIcon className="w-5 h-5" />
                              </div>
                              <Badge size="sm" variant="soft">{s.category}</Badge>
                            </div>
                            <h4 className="font-bold text-surface-900 dark:text-white mb-1.5 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                              {s.title}
                            </h4>
                            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-3">
                              {truncate(s.prompt, 140)}
                            </p>
                          </button>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat window */}
          <Card className="flex-1 !shadow-sm min-h-0 overflow-hidden">
            <CardContent className="!p-0 h-full flex flex-col">
              <AIChatWindow
                messages={messages}
                onSend={handleSend}
                isTyping={isTyping}
                suggestions={promptSuggestions}
                onClear={handleClearChat}
                title={activeChatId
                  ? (chats.find(c => c.id === activeChatId)?.title || 'HireMind AI Assistant')
                  : 'Start a New Conversation'}
                subtitle={activeChatId
                  ? `${messages.length} messages • Recruiter workspace`
                  : 'Ask anything or choose a suggested workflow above'}
                placeholder="Ask about candidates, jobs, interviews, outreach, skill gaps, hiring strategy..."
                className="!border-0 !rounded-none !shadow-none h-full !min-h-0 !max-h-none flex-1"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Header({ onNew }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-500" />
          AI Recruiter Assistant
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Strategize sourcing, analyze matches, draft outreach, and make data-backed hiring decisions
        </p>
      </div>
      <Button icon={<Plus className="w-4 h-4" />} onClick={onNew}>New Chat</Button>
    </div>
  );
}
