import React from 'react';
import { Bot, Power, Globe, Sun, Moon, Store, ChevronDown } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Navbar({ lang, setLang, theme, setTheme, onManageStores }) {
  const isDark = theme === 'dark';
  const { stores, activeStore, switchStore, refreshStores } = useStore();

  const isRunning = activeStore?.bot_is_running || false;

  const handleToggleActiveBot = async () => {
    if (!activeStore) return;
    try {
      if (isRunning) {
        await api.post(`/stores/${activeStore.id}/bot/stop`);
      } else {
        await api.post(`/stores/${activeStore.id}/bot/start`);
      }
      refreshStores();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className={`h-16 px-8 backdrop-blur-md border-b flex items-center justify-between z-10 transition-colors duration-200 ${
      isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Left: Store Switcher & Active Bot Status */}
      <div className="flex items-center gap-4">
        {/* Store Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Store className="w-4 h-4 text-indigo-400 absolute left-3 pointer-events-none" />
            <select
              value={activeStore?.id || ''}
              onChange={(e) => switchStore(e.target.value)}
              className={`pl-9 pr-8 py-1.5 rounded-xl text-xs font-semibold border outline-none appearance-none cursor-pointer transition ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900'
              }`}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.business_type})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Bot Live Status Pill for Active Store */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span>
              {isRunning
                ? (lang === 'mm' ? 'Bot Online' : 'Bot Online')
                : (lang === 'mm' ? 'Bot Offline' : 'Bot Offline')}
            </span>
          </div>

          {activeStore?.bot_token && (
            <button
              onClick={handleToggleActiveBot}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isRunning
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-rose-500/30'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                  : isDark
                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{isRunning ? (lang === 'mm' ? 'ရပ်မည်' : 'Stop') : (lang === 'mm' ? 'စတင်မည်' : 'Start')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Tools: Theme Toggle, Language, Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Light / Dark Mode Switcher */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`p-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          <span className="hidden sm:inline text-xs">
            {isDark ? (lang === 'mm' ? 'Light Mode' : 'Light') : (lang === 'mm' ? 'Dark Mode' : 'Dark')}
          </span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'mm' ? 'en' : 'mm')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'mm' ? '🇲🇲 မြန်မာ' : '🇬🇧 EN'}</span>
        </button>

        {/* Admin Badge */}
        <div className={`flex items-center gap-2.5 pl-3 border-l ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/20">
            S
          </div>
          <div className="text-left hidden md:block">
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Super Admin</p>
            <p className="text-[10px] text-indigo-400 font-medium">Control Center</p>
          </div>
        </div>
      </div>
    </header>
  );
}
