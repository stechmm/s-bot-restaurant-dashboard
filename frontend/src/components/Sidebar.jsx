import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  PackageCheck, 
  MessageSquareText, 
  Radio, 
  Users, 
  Settings as SettingsIcon,
  Bot,
  ExternalLink,
  Tag,
  Star
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview & Stats', labelMm: 'ခြုံငုံသုံးသပ်ချက်', icon: LayoutDashboard },
  { id: 'products', label: 'Food Menu & Catalog', labelMm: 'ဟင်းလျာနှင့် Menu', icon: UtensilsCrossed },
  { id: 'orders', label: 'Food Orders', labelMm: 'အော်ဒါစာရင်းများ', icon: PackageCheck },
  { id: 'support', label: 'Support Live Chat', labelMm: 'Support တိုက်ရိုက်ပြောရန်', icon: MessageSquareText },
  { id: 'broadcast', label: 'Promos & Broadcast', labelMm: 'ပရိုမိုးရှင်းနှင့် သတင်း', icon: Radio },
  { id: 'coupons', label: 'Coupons & Discounts', labelMm: 'Coupon နှင့် လျှော့ဈေး', icon: Tag },
  { id: 'reviews', label: 'Reviews & Ratings', labelMm: 'အကဲဖြတ်ချက်များ', icon: Star },
  { id: 'users', label: 'Bot Subscribers', labelMm: 'Bot အသုံးပြုသူများ', icon: Users },
  { id: 'settings', label: 'Settings & FAQ', labelMm: 'ဆက်တင်များ / FAQ', icon: SettingsIcon },
];

export default function Sidebar({ activeTab, setActiveTab, unreadCount = 0, pendingOrders = 0, lang = 'mm', theme = 'dark' }) {
  const isDark = theme === 'dark';

  return (
    <aside className={`w-64 border-r flex flex-col shrink-0 transition-colors duration-200 ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Brand Logo */}
      <div className={`h-16 px-6 flex items-center gap-3 border-b ${
        isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/70'
      }`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold text-lg">
          🤖
        </div>
        <div>
          <h1 className={`font-bold tracking-wide text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            S-BOT
          </h1>
          <p className="text-[11px] text-amber-500 font-semibold">Restaurant Control Center</p>
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {lang === 'mm' ? 'အဓိက ကဏ္ဍများ' : 'Main Menu'}
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{lang === 'mm' ? item.labelMm : item.label}</span>
              </div>

              {/* Badges */}
              {item.id === 'support' && unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
              {item.id === 'orders' && pendingOrders > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {pendingOrders}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className={`p-4 border-t ${
        isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className={`rounded-xl p-3 flex items-center justify-between text-xs border ${
          isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Telegram Bot</p>
            <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              FastAPI Engine
            </p>
          </div>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className={`p-1.5 rounded-lg transition ${
              isDark ? 'bg-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
            title="Open Telegram"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
  );
}
