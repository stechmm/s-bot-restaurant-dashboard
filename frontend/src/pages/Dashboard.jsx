import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Utensils, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  MessageSquare, 
  PlusCircle, 
  Send
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../api/client';

export default function Dashboard({ setActiveTab, lang, theme = 'dark' }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/overview');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 15000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: lang === 'mm' ? 'စုစုပေါင်း Customer များ' : 'Total Bot Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-amber-500 to-orange-600',
      badge: 'Active Subscribers',
    },
    {
      title: lang === 'mm' ? 'အစားအသောက် အော်ဒါများ' : 'Total Food Orders',
      value: stats?.total_orders || 0,
      icon: Utensils,
      color: 'from-rose-500 to-red-600',
      badge: `${stats?.pending_orders || 0} Pending`,
    },
    {
      title: lang === 'mm' ? 'ရရှိပြီး ဝင်ငွေ စုစုပေါင်း' : 'Total Sales Revenue',
      value: `${(stats?.total_revenue || 0).toLocaleString()} MMK`,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Completed Orders',
    },
    {
      title: lang === 'mm' ? 'မဖြေရသေးသော စာများ' : 'Unread Messages',
      value: stats?.unread_messages || 0,
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Live Support',
      onClick: () => setActiveTab('support'),
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-amber-200/70'
      }`}>
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {lang === 'mm' ? 'မင်္ဂလာပါ စားသောက်ဆိုင် Admin 👋' : 'Welcome back, Restaurant Admin 👋'}
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {lang === 'mm'
              ? 'ရွှေမန္တလေး စားသောက်ဆိုင်၏ ဟင်းလျာ Menu၊ အော်ဒါ၊ Support Chat နှင့် ပရိုမိုးရှင်းများကို စီမံနိုင်ပါသည်'
              : 'Real-time control center for Restaurant Orders, Food Menu & Live Customer Support'}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('products')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'mm' ? 'ဟင်းလျာ အသစ်ထည့်မည်' : 'New Dish / Item'}</span>
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            <Send className="w-4 h-4 text-amber-500" />
            <span>{lang === 'mm' ? 'ပရိုမိုးရှင်း ပို့မည်' : 'Broadcast Promo'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:scale-[1.02] ${
                card.onClick ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.title}</p>
                  <h3 className={`text-2xl font-extrabold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</h3>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-lg text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.badge}</span>
                <ArrowUpRight className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Chart & Recent Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {lang === 'mm' ? 'အရောင်းနှင့် Customer စာရင်း' : 'Daily Sales & Customer Traffic'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Past 7 Days Analytics</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Sales (MMK)
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Users
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chart_data || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#cbd5e1', 
                    borderRadius: '8px', 
                    color: isDark ? '#fff' : '#0f172a' 
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {lang === 'mm' ? 'နောက်ဆုံး အော်ဒါများ' : 'Recent Food Orders'}
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-amber-500 hover:text-amber-600 font-semibold"
              >
                {lang === 'mm' ? 'အားလုံးကြည့်ရန် →' : 'View All →'}
              </button>
            </div>

            <div className="space-y-3">
              {stats?.recent_orders?.length > 0 ? (
                stats.recent_orders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => setActiveTab('orders')}
                    className={`p-3 rounded-xl transition cursor-pointer border flex items-center justify-between ${
                      isDark 
                        ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/50' 
                        : 'bg-slate-50 hover:bg-amber-50/50 border-slate-200'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ord.order_code}</p>
                      <p className="text-[11px] text-slate-400">{ord.customer_name} • {ord.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-500">{ord.total_amount?.toLocaleString()} MMK</p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                          ord.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">အော်ဒါမရှိသေးပါ</p>
              )}
            </div>
          </div>

          <div className={`pt-4 border-t mt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <button
              onClick={() => setActiveTab('support')}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <span>{lang === 'mm' ? 'Support Inbox ဖွင့်မည်' : 'Open Support Live Inbox'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
