import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, Plus, Power, RotateCw, Edit2, Trash2, 
  Bot, CheckCircle2, XCircle, ShoppingBag, UtensilsCrossed, 
  ExternalLink, Sparkles, DollarSign 
} from 'lucide-react';
import api from '../api/client';
import { useStore } from '../context/StoreContext';

export default function Stores({ lang = 'mm', theme = 'dark' }) {
  const isDark = theme === 'dark';
  const { stores, switchStore, refreshStores } = useStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    business_type: 'restaurant',
    bot_token: '',
    bot_username: '',
    currency: 'MMK',
    description: '',
    admin_telegram_id: '',
    support_chat_id: '',
    is_active: true
  });

  const openCreateModal = () => {
    setEditingStore(null);
    setFormData({
      name: '',
      business_type: 'restaurant',
      bot_token: '',
      bot_username: '',
      currency: 'MMK',
      description: '',
      admin_telegram_id: '',
      support_chat_id: '',
      is_active: true
    });
    setModalOpen(true);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      business_type: store.business_type || 'restaurant',
      bot_token: store.bot_token || '',
      bot_username: store.bot_username || '',
      currency: store.currency || 'MMK',
      description: store.description || '',
      admin_telegram_id: store.admin_telegram_id || '',
      support_chat_id: store.support_chat_id || '',
      is_active: store.is_active
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingStore) {
        await api.put(`/stores/${editingStore.id}`, formData);
      } else {
        await api.post('/stores/', formData);
      }
      setModalOpen(false);
      refreshStores();
    } catch (err) {
      alert('Error saving store: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeId) => {
    if (!confirm(lang === 'mm' ? 'ဤဆိုင်နှင့် Bot ကို ဖျက်ရန် သေချာပါသလား?' : 'Are you sure you want to delete this store and bot?')) return;
    try {
      await api.delete(`/stores/${storeId}`);
      refreshStores();
    } catch (err) {
      alert('Failed to delete store: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleBotAction = async (storeId, action) => {
    setActionLoading(prev => ({ ...prev, [storeId]: true }));
    try {
      await api.post(`/stores/${storeId}/bot/${action}`);
      refreshStores();
    } catch (err) {
      alert(`Bot ${action} failed: ` + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(prev => ({ ...prev, [storeId]: false }));
    }
  };

  const getBusinessIcon = (type) => {
    switch (type) {
      case 'restaurant': return <UtensilsCrossed className="w-4 h-4 text-amber-500" />;
      case 'retail': return <ShoppingBag className="w-4 h-4 text-pink-500" />;
      default: return <StoreIcon className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <StoreIcon className="w-7 h-7 text-indigo-500" />
            {lang === 'mm' ? 'ဆိုင်များနှင့် Telegram Bots စီမံခန့်ခွဲမှု (Multi-Store Hub)' : 'Stores & Telegram Bots Management'}
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {lang === 'mm' 
              ? 'လုပ်ငန်းအမျိုးအစား မတူညီသော ဆိုင်ခွဲများနှင့် သီးခြား Telegram Bot များကို တစ်နေရာတည်းမှ စီမံပါ'
              : 'Manage multiple businesses, stores, and concurrent Telegram bots from a central hub'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          {lang === 'mm' ? 'ဆိုင်အသစ် / Bot အသစ် ထည့်မည်' : 'Add New Store / Bot'}
        </button>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => {
          const isRunning = store.bot_is_running;
          const isBusy = actionLoading[store.id];

          return (
            <div
              key={store.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl ${
                isDark 
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' 
                  : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                {/* Store Header & Badges */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50 border-indigo-100'
                    }`}>
                      {getBusinessIcon(store.business_type)}
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium capitalize border ${
                          isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {store.business_type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          #{store.id} • {store.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(store)}
                      className={`p-1.5 rounded-lg border transition ${
                        isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800' : 'hover:bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title="Edit Store"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {stores.length > 1 && (
                      <button
                        onClick={() => handleDelete(store.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          isDark ? 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-800' : 'hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200'
                        }`}
                        title="Delete Store"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bot Status Card */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Bot className={`w-5 h-5 ${isRunning ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {store.bot_username || (store.bot_token ? 'Telegram Bot' : 'No Token Set')}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {isRunning ? 'Online (Polling)' : 'Offline (Stopped)'}
                      </p>
                    </div>
                  </div>

                  {/* Start / Stop / Restart Buttons */}
                  {store.bot_token && (
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isBusy}
                        onClick={() => handleBotAction(store.id, isRunning ? 'stop' : 'start')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition ${
                          isRunning
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {isRunning ? (lang === 'mm' ? 'ရပ်မည်' : 'Stop') : (lang === 'mm' ? 'စတင်မည်' : 'Start')}
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => handleBotAction(store.id, 'restart')}
                        className={`p-1 rounded-lg text-xs border text-slate-400 hover:text-white transition ${
                          isDark ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-slate-200 border-slate-300'
                        }`}
                        title="Restart Bot"
                      >
                        <RotateCw className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-[10px] text-slate-400 font-medium">Products</p>
                    <p className={`text-sm font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {store.products_count || 0}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-[10px] text-slate-400 font-medium">Orders</p>
                    <p className={`text-sm font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {store.orders_count || 0}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-[10px] text-slate-400 font-medium">Revenue</p>
                    <p className={`text-xs font-bold mt-1 text-emerald-400 truncate`}>
                      {(store.total_revenue || 0).toLocaleString()} K
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer: Switch to this Store */}
              <div className="pt-5 mt-4 border-t border-slate-800/50 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {lang === 'mm' ? 'ဤဆိုင်ကို စီမံမည်' : 'Manage this Store'}
                </span>
                <button
                  onClick={() => switchStore(store.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  {lang === 'mm' ? 'ရွေးချယ်မည်' : 'Switch Store'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Store */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-5 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 border-slate-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-indigo-500" />
                {editingStore 
                  ? (lang === 'mm' ? 'ဆိုင်နှင့် Bot အချက်အလက် ပြင်ဆင်ရန်' : 'Edit Store & Bot') 
                  : (lang === 'mm' ? 'ဆိုင်အသစ်နှင့် Telegram Bot အသစ် ထည့်ရန်' : 'Create New Store & Bot')}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  {lang === 'mm' ? 'ဆိုင်အမည် (Store Name)' : 'Store Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Yangon Food House / Fashion Boutique"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    {lang === 'mm' ? 'လုပ်ငန်းအမျိုးအစား (Business Type)' : 'Business Type'}
                  </label>
                  <select
                    value={formData.business_type}
                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="restaurant">🍕 စားသောက်ဆိုင် (Restaurant)</option>
                    <option value="retail">🛍️ အရောင်းဆိုင် (Retail/Fashion)</option>
                    <option value="service">💼 ဝန်ဆောင်မှု (Service/Agency)</option>
                    <option value="general">📦 အထွေထွေ (General)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    {lang === 'mm' ? 'ငွေကြေး (Currency)' : 'Currency'}
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="MMK"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300 flex items-center justify-between">
                  <span>{lang === 'mm' ? 'Telegram Bot HTTP Token' : 'Telegram Bot Token'}</span>
                  <span className="text-[11px] text-slate-400">@BotFather မှ ရယူပါ</span>
                </label>
                <input
                  type="text"
                  value={formData.bot_token}
                  onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Bot Username
                  </label>
                  <input
                    type="text"
                    value={formData.bot_username}
                    onChange={(e) => setFormData({ ...formData, bot_username: e.target.value })}
                    placeholder="@mybot"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    {lang === 'mm' ? 'Admin Telegram User ID' : 'Admin Telegram ID'}
                  </label>
                  <input
                    type="text"
                    value={formData.admin_telegram_id}
                    onChange={(e) => setFormData({ ...formData, admin_telegram_id: e.target.value })}
                    placeholder="e.g. 12345678"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  {lang === 'mm' ? 'ဆိုင်ဖော်ပြချက် (Description)' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="About this store..."
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-xs font-medium text-slate-300">
                  {lang === 'mm' ? 'ဆိုင်နှင့် Bot ကို အသက်သွင်းမည် (Active)' : 'Active Store & Bot'}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {lang === 'mm' ? 'မလုပ်တော့ပါ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                >
                  {loading ? 'Saving...' : (lang === 'mm' ? 'သိမ်းဆည်းမည်' : 'Save Store')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
