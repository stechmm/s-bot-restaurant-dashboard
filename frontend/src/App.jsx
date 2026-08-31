import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import SupportChat from './pages/SupportChat';
import BroadcastNews from './pages/BroadcastNews';
import UsersList from './pages/UsersList';
import Settings from './pages/Settings';
import api from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState('mm'); // 'mm' | 'en'
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  const [botStatus, setBotStatus] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const fetchStatus = async () => {
    try {
      const [setRes, statsRes] = await Promise.all([
        api.get('/settings/'),
        api.get('/stats/overview')
      ]);
      setBotStatus(setRes.data.bot_is_running);
      setUnreadCount(statsRes.data.unread_messages || 0);
      setPendingOrders(statsRes.data.pending_orders || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBot = async () => {
    try {
      if (botStatus) {
        await api.post('/settings/bot/stop');
      } else {
        await api.post('/settings/bot/start');
      }
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error toggling bot');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        pendingOrders={pendingOrders}
        lang={lang}
        theme={theme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          botStatus={botStatus}
          onToggleBot={handleToggleBot}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
        />

        <main className={`flex-1 overflow-y-auto ${
          isDark ? 'bg-slate-950/60' : 'bg-slate-50/80'
        }`}>
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} lang={lang} theme={theme} />}
          {activeTab === 'products' && <Products lang={lang} theme={theme} />}
          {activeTab === 'orders' && <Orders lang={lang} theme={theme} />}
          {activeTab === 'support' && <SupportChat lang={lang} theme={theme} />}
          {activeTab === 'broadcast' && <BroadcastNews lang={lang} theme={theme} />}
          {activeTab === 'users' && <UsersList lang={lang} theme={theme} />}
          {activeTab === 'settings' && (
            <Settings
              lang={lang}
              botStatus={botStatus}
              onToggleBot={handleToggleBot}
              theme={theme}
            />
          )}
        </main>
      </div>
    </div>
  );
}
