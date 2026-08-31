import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Send, 
  Newspaper, 
  Plus, 
  Trash2, 
  Eye, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  History, 
  CheckCircle2, 
  XCircle,
  X
} from 'lucide-react';
import api from '../api/client';

export default function BroadcastNews({ lang }) {
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'news'
  const [newsList, setNewsList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Broadcast Form
  const [broadcastForm, setBroadcastForm] = useState({
    message_text: '',
    image_url: '',
    button_text: '',
    button_url: ''
  });

  // News Form Modal
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    image_url: '',
    button_text: '',
    button_url: '',
    is_published: true
  });

  const fetchData = async () => {
    try {
      const [newsRes, logsRes] = await Promise.all([
        api.get('/broadcast/news'),
        api.get('/broadcast/logs')
      ]);
      setNewsList(newsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.message_text.trim()) return;

    if (!window.confirm('Bot အသုံးပြုသူ အားလုံးထံသို့ ဤ Broadcast Message ကို ပို့ရန် သေချာပါသလား?')) return;

    try {
      setLoading(true);
      const res = await api.post('/broadcast/send', broadcastForm);
      alert(`Broadcast ပို့ဆောင်ခြင်း ပြီးဆုံးပါပြီ!\nအောင်မြင်: ${res.data.success} ယောက် | မအောင်မြင်: ${res.data.fail} ယောက်`);
      setBroadcastForm({ message_text: '', image_url: '', button_text: '', button_url: '' });
      fetchData();
    } catch (err) {
      alert('Broadcast Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    try {
      await api.post('/broadcast/news', newsForm);
      setIsNewsModalOpen(false);
      setNewsForm({ title: '', content: '', image_url: '', button_text: '', button_url: '', is_published: true });
      fetchData();
    } catch (err) {
      alert('Error creating news: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('ဤသတင်းကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await api.delete(`/broadcast/news/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting news');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {lang === 'mm' ? 'သတင်းနှင့် Broadcast စီမံခန့်ခွဲမှု' : 'Broadcast & News Center'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {lang === 'mm'
              ? 'Bot အသုံးပြုသူများထံ တစ်ပြိုင်နက် Message ပို့ခြင်းနှင့် သတင်းအသစ်များ တင်ခြင်း'
              : 'Push mass announcements and publish feed articles'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'broadcast' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Instant Broadcast</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'news' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>News Posts ({newsList.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'broadcast' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Broadcast Composer */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Radio className="w-4 h-4 text-sky-400" />
              <span>Broadcast Composer (မက်ဆေ့ခ်ျ ရေးသားရန်)</span>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message Body (HTML formatting supported) *</label>
                <textarea
                  rows={5}
                  required
                  value={broadcastForm.message_text}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message_text: e.target.value })}
                  placeholder="🌟 အထူးပရိုမိုးရှင်း ကြေညာချက်..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ပုံ Link (Optional Photo URL)</label>
                <input
                  type="url"
                  value={broadcastForm.image_url}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Button Text (Optional)</label>
                  <input
                    type="text"
                    value={broadcastForm.button_text}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, button_text: e.target.value })}
                    placeholder="ဥပမာ- 🛍️ စျေးဝယ်မည်"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Button Link (URL)</label>
                  <input
                    type="url"
                    value={broadcastForm.button_url}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, button_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !broadcastForm.message_text.trim()}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Broadcast ပို့နေပါသည်...' : 'Send Broadcast Now'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Broadcast Logs & History */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm mb-4">
                <History className="w-4 h-4 text-slate-400" />
                <span>Recent Broadcast History</span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Broadcast မှတ်တမ်း မရှိသေးပါ</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                      <p className="text-slate-200 line-clamp-2">{log.message_text}</p>
                      <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-semibold">Sent: {log.success_count}/{log.total_sent}</span>
                        <span className="text-slate-400">{new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* News Posts Management */
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsNewsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'mm' ? 'သတင်းအသစ် တင်မည်' : 'Create News Article'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((post) => (
              <div key={post.id} className="glass-panel rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between">
                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{post.title}</h4>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">{post.content}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {post.views_count} views
                    </span>
                    <button
                      onClick={() => handleDeleteNews(post.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                      title="Delete News"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News Creation Modal */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">သတင်းအသစ် တင်မည်</h3>
              <button onClick={() => setIsNewsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNews} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">သတင်း ခေါင်းစဉ် (Title) *</label>
                <input
                  type="text"
                  required
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  placeholder="ဥပမာ- ရာသီပွဲတော် အထူးလျှော့စျေး"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">သတင်း အကြောင်းအရာ (Content) *</label>
                <textarea
                  rows={4}
                  required
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  placeholder="သတင်းအသေးစိတ်..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ပုံ Link (Photo URL)</label>
                <input
                  type="url"
                  value={newsForm.image_url}
                  onChange={(e) => setNewsForm({ ...newsForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={newsForm.button_text}
                    onChange={(e) => setNewsForm({ ...newsForm, button_text: e.target.value })}
                    placeholder="ဥပမာ- ဖတ်ရှုရန်"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Button Link</label>
                  <input
                    type="url"
                    value={newsForm.button_url}
                    onChange={(e) => setNewsForm({ ...newsForm, button_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold"
                >
                  တင်မည် (Publish)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
