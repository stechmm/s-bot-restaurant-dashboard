import React from 'react';
import { Bot, Power, Globe, Sun, Moon } from 'lucide-react';

export default function Navbar({ botStatus, onToggleBot, lang, setLang, theme, setTheme }) {
  const isDark = theme === 'dark';

  return (
    <header className={`h-16 px-8 backdrop-blur-md border-b flex items-center justify-between z-10 transition-colors duration-200 ${
      isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Bot Live Status Pill */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            botStatus
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${botStatus ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          <span>
            {botStatus
              ? (lang === 'mm' ? 'Bot လည်ပတ်နေပါသည် (Online)' : 'Bot Active (Online)')
              : (lang === 'mm' ? 'Bot ရပ်တန့်နေပါသည် (Offline)' : 'Bot Inactive (Offline)')}
          </span>
        </div>

        <button
          onClick={onToggleBot}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
            botStatus
              ? isDark
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-rose-500/30'
                : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
              : isDark
                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{botStatus ? (lang === 'mm' ? 'Bot ရပ်မည်' : 'Stop Bot') : (lang === 'mm' ? 'Bot စတင်မည်' : 'Start Bot')}</span>
        </button>
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
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/20">
            A
          </div>
          <div className="text-left hidden md:block">
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Restaurant Admin</p>
            <p className="text-[10px] text-slate-400">Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
