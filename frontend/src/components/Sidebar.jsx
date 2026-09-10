import React from 'react';
import { 
  LayoutDashboard, 
  Store,
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
  { id: 'stores', label: 'Stores & Bots Hub', labelMm: 'ဆိုင်များနှင့် Bots စီမံမှု', icon: Store },
  { id: 'products', label: 'Products & Menu', labelMm: 'ကုန်ပစ္စည်း / Menu', icon: UtensilsCrossed },
  { id: 'orders', label: 'Customer Orders', labelMm: 'အော်ဒါစာရင်းများ', icon: PackageCheck },
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
          🤖
        </div>
        <div>
          <h1 className={`font-bold tracking-wide text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            S-BOT
          </h1>
          <p className="text-[11px] text-indigo-400 font-semibold">Multi-Bot Control Center</p>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{lang === 'mm' ? item.labelMm : item.label}</span>
              </div>

              {/* Badges for unread messages or pending orders */}
              {item.id === 'support' && unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
              {item.id === 'orders' && pendingOrders > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                  {pendingOrders}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className={`p-4 border-t ${
        isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Platform v2.0</p>
            <p className="text-[10px] text-slate-400">Multi-Tenant SaaS</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
        </div>
      </div>
    </aside>
  );
}
