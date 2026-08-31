import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  HelpCircle, 
  CreditCard, 
  Store, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Power,
  ExternalLink,
  X
} from 'lucide-react';
import api from '../api/client';

export default function Settings({ lang, botStatus, onToggleBot }) {
  const [activeTab, setActiveTab] = useState('bot'); // 'bot' | 'faqs' | 'store'
  const [settings, setSettings] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [botToken, setBotToken] = useState('');
  const [storeName, setStoreName] = useState('');
  const [currency, setCurrency] = useState('MMK');
  const [kpayNumber, setKpayNumber] = useState('');
  const [wavepayNumber, setWavepayNumber] = useState('');

  // FAQ Modal
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'General'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setRes, faqRes] = await Promise.all([
        api.get('/settings/'),
        api.get('/settings/faqs')
      ]);
      setSettings(setRes.data);
      setFaqs(faqRes.data);
      setStoreName(setRes.data.store_name || '');
      setCurrency(setRes.data.currency || 'MMK');
      setKpayNumber(setRes.data.kpay_number || '');
      setWavepayNumber(setRes.data.wavepay_number || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBotToken = async (e) => {
    e.preventDefault();
    if (!botToken.trim()) return;

    try {
      const res = await api.post('/settings/', { bot_token: botToken.trim() });
      alert(res.data.message || 'Bot Token saved and bot restarted!');
      setBotToken('');
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/', {
        store_name: storeName,
        currency: currency,
        kpay_number: kpayNumber,
        wavepay_number: wavepayNumber
      });
      alert('Store settings saved successfully!');
      fetchData();
    } catch (err) {
      alert('Error saving store settings');
    }
  };

  const handleCreateFaq = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/faqs', faqForm);
      setIsFaqModalOpen(false);
      setFaqForm({ question: '', answer: '', category: 'General' });
      fetchData();
    } catch (err) {
      alert('Error creating FAQ');
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('ဤ FAQ ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await api.delete(`/settings/faqs/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting FAQ');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {lang === 'mm' ? 'စနစ်နှင့် Bot ဆက်တင်များ' : 'Settings & Bot Configuration'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {lang === 'mm'
              ? 'Telegram Bot Token၊ ငွေလွှဲအကောင့်များနှင့် FAQ မေးခွန်းများကို ပြင်ဆင်နိုင်ပါသည်'
              : 'Configure your Bot Token, FAQ Knowledge Base and Payment info'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'bot' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Telegram Bot</span>
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'store' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Store & Payments</span>
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'faqs' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ Knowledge Base</span>
          </button>
        </div>
      </div>

      {activeTab === 'bot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bot Token Configuration */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-400" />
                <span>Telegram Bot Token ချိတ်ဆက်ရန်</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Telegram တွင် <code>@BotFather</code> မှ ရရှိထားသော API Token ကို ဤနေရာတွင် ထည့်သွင်းပါ
              </p>
            </div>

            {/* Current Token Status */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 font-medium">လက်ရှိ ချိတ်ဆက်ထားသော Token:</p>
                <p className="font-mono text-white mt-1 text-sm">
                  {settings?.bot_token_masked ? (
                    <span className="text-emerald-400 font-bold">{settings.bot_token_masked}</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">မထည့်ရသေးပါ (Not Configured)</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleBot}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    botStatus
                      ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{botStatus ? 'Stop Bot' : 'Start Bot'}</span>
                </button>
              </div>
            </div>

            {/* Change Token Form */}
            <form onSubmit={handleSaveBotToken} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Token အသစ်ထည့်သွင်းခြင်း / အသစ်လဲလှယ်ခြင်း
                </label>
                <input
                  type="text"
                  required
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition"
                >
                  Save & Connect Bot
                </button>
              </div>
            </form>
          </div>

          {/* BotFather Quick Guide */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm">💡 Bot Token ရယူနည်း</h3>
            <ol className="space-y-2.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
              <li>Telegram တွင် <b>@BotFather</b> ကို ရှာဖွေပါ</li>
              <li><code>/newbot</code> command ပို့ပါ</li>
              <li>Bot Name နှင့် Username (e.g. <code>my_shop_bot</code>) သတ်မှတ်ပါ</li>
              <li>ရရှိလာသော <b>HTTP API Token</b> ကို ကူးယူပြီး ဘယ်ဘက်တွင် ထည့်ပါ</li>
              <li>Save & Connect နှိပ်သည်နှင့် Bot စတင် အလုပ်လုပ်ပါမည်</li>
            </ol>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold mt-2"
            >
              <span>Open @BotFather in Telegram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {activeTab === 'store' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-2xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-sky-400" />
            <span>ဆိုင်အချက်အလက်နှင့် ငွေလက်ခံမည့် အကောင့်များ</span>
          </h3>

          <form onSubmit={handleSaveStoreSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ဆိုင်အမည် (Store Name)</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="OMNI Store"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ငွေကြေး သတ်မှတ်ချက် (Currency)</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="MMK"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">KBZPay Account & Name</label>
                <input
                  type="text"
                  value={kpayNumber}
                  onChange={(e) => setKpayNumber(e.target.value)}
                  placeholder="09-xxxxxxxxx (Name)"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WavePay Account & Name</label>
                <input
                  type="text"
                  value={wavepayNumber}
                  onChange={(e) => setWavepayNumber(e.target.value)}
                  placeholder="09-xxxxxxxxx (Name)"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30"
              >
                သိမ်းဆည်းမည် (Save Store Info)
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsFaqModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'mm' ? 'FAQ အသစ်ထည့်မည်' : 'Add New FAQ'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-white text-sm">❓ {faq.question}</h4>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] text-sky-400 font-semibold">
                  Category: {faq.category}
                </div>
              </div>
            ))}
          </div>

          {/* Add FAQ Modal */}
          {isFaqModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">FAQ မေးခွန်းအသစ် ထည့်သွင်းမည်</h3>
                  <button onClick={() => setIsFaqModalOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateFaq} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">မေးခွန်း (Question) *</label>
                    <input
                      type="text"
                      required
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="ဥပမာ- ပစ္စည်းဘယ်နှစ်ရက်နဲ့ ရောက်မလဲ?"
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">အဖြေ (Answer) *</label>
                    <textarea
                      rows={4}
                      required
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      placeholder="ဖြေကြားချက်..."
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      placeholder="General / Delivery / Payment"
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsFaqModalOpen(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      မလုပ်တော့ပါ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold"
                    >
                      ထည့်သွင်းမည်
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
