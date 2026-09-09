import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, X, CheckCircle2, XCircle, Edit2 } from 'lucide-react';
import api from '../api/client';

export default function Coupons({ lang }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_amount: '0',
    max_uses: '0',
    is_active: true,
    expires_at: ''
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons/');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openAddModal = () => {
    setEditingCoupon(null);
    setForm({ code: '', description: '', discount_type: 'percent', discount_value: '', min_order_amount: '0', max_uses: '0', is_active: true, expires_at: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount,
      max_uses: c.max_uses,
      is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.substring(0, 16) : ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses: parseInt(form.max_uses) || 0,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null
      };
      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, payload);
      } else {
        await api.post('/coupons/', payload);
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ဤ Coupon ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      alert('Error deleting coupon');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">🏷️ Coupon & Discount Management</h2>
          <p className="text-slate-400 text-xs mt-1">Promo codes နှင့် discount များ စီမံနိုင်ပါသည်</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Coupon အသစ်ထည့်မည်
        </button>
      </div>

      {/* Coupons Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                <th className="px-5 py-3.5 text-left font-semibold">Code</th>
                <th className="px-5 py-3.5 text-left font-semibold">Discount</th>
                <th className="px-5 py-3.5 text-left font-semibold">Min Order</th>
                <th className="px-5 py-3.5 text-left font-semibold">Uses</th>
                <th className="px-5 py-3.5 text-left font-semibold">Expires</th>
                <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Coupon မရှိသေးပါ</td></tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-bold text-white font-mono text-sm">{c.code}</span>
                    </div>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-emerald-400 font-bold">
                      {c.discount_type === 'percent'
                        ? `${c.discount_value}%`
                        : `${c.discount_value.toLocaleString()} MMK`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 text-xs">
                    {c.min_order_amount > 0 ? `${c.min_order_amount.toLocaleString()} MMK` : 'မရှိ'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 text-xs">
                    {c.used_count} / {c.max_uses === 0 ? '∞' : c.max_uses}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 text-xs">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'မသတ်မှတ်'}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingCoupon ? 'Coupon ပြင်ဆင်မည်' : 'Coupon အသစ်ထည့်မည်'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code *</label>
                  <input
                    required value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE10"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discount အမျိုးအစား</label>
                  <select
                    value={form.discount_type}
                    onChange={e => setForm({ ...form, discount_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="percent">% Percentage</option>
                    <option value="flat">MMK Flat Amount</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Discount {form.discount_type === 'percent' ? '(%)' : '(MMK)'} *
                  </label>
                  <input
                    required type="number" value={form.discount_value}
                    onChange={e => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percent' ? '10' : '5000'}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Order (MMK)</label>
                  <input
                    type="number" value={form.min_order_amount}
                    onChange={e => setForm({ ...form, min_order_amount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Uses (0 = unlimited)</label>
                  <input
                    type="number" value={form.max_uses}
                    onChange={e => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expires At</label>
                  <input
                    type="datetime-local" value={form.expires_at}
                    onChange={e => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ဖော်ပြချက် (Optional)</label>
                <input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="ဥပမာ: ပထမဆုံး Order အတွက် 10% discount"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 accent-sky-500"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-300">Active (သုံးနိုင်သည်)</label>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
                  မလုပ်တော့ပါ
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30">
                  သိမ်းဆည်းမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
