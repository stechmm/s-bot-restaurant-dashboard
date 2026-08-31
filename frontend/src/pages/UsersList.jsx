import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock,
  Phone
} from 'lucide-react';
import api from '../api/client';

export default function UsersList({ lang }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (userId) => {
    try {
      await api.post(`/settings/users/${userId}/toggle-block`);
      fetchUsers();
    } catch (err) {
      alert('Error updating user block status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const username = (u.username || '').toLowerCase();
    const tgId = u.telegram_id.toString();
    const phone = u.phone || '';
    const q = search.toLowerCase();
    return name.includes(q) || username.includes(q) || tgId.includes(q) || phone.includes(q);
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {lang === 'mm' ? 'Bot အသုံးပြုသူများ စာရင်း' : 'Telegram Bot Subscribers'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {lang === 'mm'
              ? 'Bot နှင့် စတင်ချိတ်ဆက်ထားသော အသုံးပြုသူအားလုံး၏ စာရင်းနှင့် အခြေအနေ'
              : 'Registered subscribers, activity logs & access control'}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'mm' ? 'User အမည်၊ ID၊ ဖုန်း ရှာရန်...' : 'Search user, ID, phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">အသုံးပြုသူ မရှိသေးပါ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Telegram ID</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredUsers.map((u) => {
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Anonymous';
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sky-400 font-bold text-xs border border-slate-700">
                            {fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{fullName}</p>
                            <p className="text-[11px] text-slate-400">
                              {u.username ? `@${u.username}` : 'No username'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        <code>{u.telegram_id}</code>
                      </td>
                      <td className="px-6 py-4">
                        {u.phone ? (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Phone className="w-3 h-3 text-sky-400" /> {u.phone}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(u.last_active).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4">
                        {u.is_blocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <ShieldAlert className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleBlock(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            u.is_blocked
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          {u.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
