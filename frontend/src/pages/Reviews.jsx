import React, { useState, useEffect } from 'react';
import { Star, Trash2, MessageSquare } from 'lucide-react';
import api from '../api/client';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  );
}

export default function Reviews({ lang }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/');
      setReviews(res.data);
      if (res.data.length > 0) {
        const avg = res.data.reduce((sum, r) => sum + r.rating, 0) / res.data.length;
        setAvgRating(avg.toFixed(1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('ဤ Review ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      alert('Error deleting review');
    }
  };

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    star: r,
    count: reviews.filter(rv => rv.rating === r).length
  }));

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">⭐ Reviews & Ratings</h2>
        <p className="text-slate-400 text-xs mt-1">Customer တို့ပေးသော အကဲဖြတ်ချက်များ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl text-center">
          <p className="text-4xl font-black text-amber-400">{avgRating || '—'}</p>
          <StarRating rating={Math.round(avgRating)} />
          <p className="text-xs text-slate-400 mt-1">ပျမ်းမျှ Rating</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl text-center">
          <p className="text-4xl font-black text-white">{reviews.length}</p>
          <p className="text-xs text-slate-400 mt-1">စုစုပေါင်း Reviews</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl space-y-1">
          {ratingCounts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="text-amber-400 font-bold w-4">{star}★</span>
              <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-slate-400 w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                <th className="px-5 py-3.5 text-left font-semibold">Customer</th>
                <th className="px-5 py-3.5 text-left font-semibold">Order</th>
                <th className="px-5 py-3.5 text-left font-semibold">Rating</th>
                <th className="px-5 py-3.5 text-left font-semibold">Comment</th>
                <th className="px-5 py-3.5 text-left font-semibold">Date</th>
                <th className="px-5 py-3.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Star className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Review မရှိသေးပါ</p>
                    <p className="text-slate-600 text-xs mt-1">Order Delivered ဖြစ်ပြီးနောက် Customer တို့ Rating ပေးနိုင်ပါသည်</p>
                  </td>
                </tr>
              ) : reviews.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-white text-sm">{r.user_name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-sky-400">{r.order_code || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StarRating rating={r.rating} />
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    {r.comment ? (
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-300 line-clamp-2">{r.comment}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
