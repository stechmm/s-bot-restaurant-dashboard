import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquareText, 
  Send, 
  User, 
  Search, 
  RefreshCw, 
  Bot, 
  CheckCheck,
  ShieldAlert,
  Clock
} from 'lucide-react';
import api from '../api/client';

export default function SupportChat({ lang }) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/support/conversations');
      setConversations(res.data);
      if (!selectedUser && res.data.length > 0) {
        setSelectedUser(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (userId) => {
    if (!userId) return;
    try {
      const res = await api.get(`/support/messages/${userId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.user_id);
      const msgInterval = setInterval(() => fetchMessages(selectedUser.user_id), 4000);
      return () => clearInterval(msgInterval);
    }
  }, [selectedUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUser || sending) return;

    try {
      setSending(true);
      const res = await api.post('/support/send', {
        user_id: selectedUser.user_id,
        message: replyText.trim()
      });
      setMessages((prev) => [...prev, res.data]);
      setReplyText('');
      scrollToBottom();
      fetchConversations();
    } catch (err) {
      alert('Failed to send reply: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.username && c.username.toLowerCase().includes(search.toLowerCase())) ||
    c.telegram_id.toString().includes(search)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {lang === 'mm' ? 'Customer Support တိုက်ရိုက်ပြောဆိုရန်' : 'Live Support Chat Inbox'}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {lang === 'mm'
              ? 'Telegram အသုံးပြုသူများနှင့် Real-time စကားပြောနိုင်ပြီး Dashboard မှ စာပြန်နိုင်ပါသည်'
              : '2-Way real-time messaging with Telegram users'}
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Chat Box */}
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden border border-slate-800 flex flex-col md:flex-row min-h-0">
        {/* Left: Conversations list */}
        <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'mm' ? 'User ရှာရန်...' : 'Search user...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {loadingConv ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500 mx-auto"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                မက်ဆေ့ခ်ျ ပို့ထားသူ မရှိသေးပါ
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedUser?.user_id === conv.user_id;
                return (
                  <div
                    key={conv.user_id}
                    onClick={() => setSelectedUser(conv)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                      isSelected ? 'bg-sky-600/15 border-l-4 border-sky-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0 border border-slate-700">
                      {conv.name.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{conv.name}</p>
                        {conv.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.last_message || 'မက်ဆေ့ခ်ျ မရှိပါ'}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col bg-slate-900/30 min-h-0">
            {/* Chat Top Bar */}
            <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-850/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
                  {selectedUser.name.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedUser.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    TG ID: <code>{selectedUser.telegram_id}</code> {selectedUser.username && `• @${selectedUser.username}`}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Connected
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  ဤ User ထံမှ မက်ဆေ့ခ်ျ မရှိသေးပါ
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[80%]">
                        {isUser && (
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] text-slate-300 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                              : 'bg-sky-600 text-white rounded-br-none shadow-md shadow-sky-600/20'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <p className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${isUser ? 'text-slate-400' : 'text-sky-200'}`}>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {!isUser && <CheckCheck className="w-3 h-3 text-sky-200" />}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-800 bg-slate-850/40 flex items-center gap-3">
              <input
                type="text"
                placeholder={lang === 'mm' ? 'Customer ထံ တိုက်ရိုက် စာပြန်ရန်...' : 'Type a reply to Telegram user...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'ပို့နေသည်...' : 'Send'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
            <MessageSquareText className="w-12 h-12 text-slate-700 mb-3" />
            <p>စကားပြောဆိုရန် ဘယ်ဘက်မှ User တစ်ဦးကို ရွေးချယ်ပါ</p>
          </div>
        )}
      </div>
    </div>
  );
}
