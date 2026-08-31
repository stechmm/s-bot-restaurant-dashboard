import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Clock, 
  FileText, 
  Phone, 
  MapPin, 
  CreditCard,
  Send,
  X
} from 'lucide-react';
import api from '../api/client';

const STATUS_CONFIG = {
  Pending: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Clock, label: 'Pending (စစ်ဆေးဆဲ)' },
  Confirmed: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: CheckCircle2, label: 'Confirmed (အတည်ပြုပြီး)' },
  Shipped: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Truck, label: 'Shipped (ပို့ဆောင်ဆဲ)' },
  Delivered: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Delivered (ရောက်ရှိပြီး)' },
  Cancelled: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: XCircle, label: 'Cancelled (ပယ်ဖျက်)' }
};

export default function Orders({ lang }) {
  const [orders, setOrders] = useState([]);
  const [activeStatus, setActiveStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderDetail = (ord) => {
    setSelectedOrder(ord);
    setUpdatingStatus(ord.status);
    setNotes(ord.notes || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.patch(`/orders/${selectedOrder.id}/status?notify_user=${notifyCustomer}`, {
        status: updatingStatus,
        notes: notes
      });
      setSelectedOrder(res.data);
      fetchOrders();
      alert('Order status updated successfully!');
    } catch (err) {
      alert('Error updating order status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = activeStatus === 'All' || ord.status === activeStatus;
    const matchesSearch =
      ord.order_code.toLowerCase().includes(search.toLowerCase()) ||
      ord.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      ord.customer_phone.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {lang === 'mm' ? 'အော်ဒါများ စီမံခန့်ခွဲခြင်း' : 'Orders Management'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {lang === 'mm'
              ? 'Bot မှ တက်လာသော အော်ဒါများကို စစ်ဆေးခြင်းနှင့် Status ပြောင်းလဲခြင်း'
              : 'Review and update order fulfillment status in real-time'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeStatus === st
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {st} ({st === 'All' ? orders.length : orders.filter(o => o.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'mm' ? 'Order code, အမည်၊ ဖုန်း ရှာရန်...' : 'Search by code, customer, phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">အော်ဒါမှတ်တမ်း မရှိသေးပါ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order Code</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredOrders.map((ord) => {
                  const cfg = STATUS_CONFIG[ord.status] || STATUS_CONFIG.Pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>{ord.order_code}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-200">{ord.customer_name}</td>
                      <td className="px-6 py-4">{ord.customer_phone}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-semibold border border-slate-700">
                          {ord.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400">
                        {ord.total_amount?.toLocaleString()} MMK
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          <span>{ord.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {new Date(ord.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openOrderDetail(ord)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                        >
                          View & Edit
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Order: {selectedOrder.order_code}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${STATUS_CONFIG[selectedOrder.status]?.color}`}>
                    {selectedOrder.status}
                  </span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Customer & Delivery Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Customer Information</p>
                  <p className="text-sm font-bold text-white mt-1">{selectedOrder.customer_name}</p>
                  <p className="text-slate-300 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-sky-400" /> {selectedOrder.customer_phone}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Delivery Address</p>
                  <p className="text-slate-200 mt-1 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
                  </p>
                  <p className="text-slate-300 flex items-center gap-1.5 mt-2">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Method: <b>{selectedOrder.payment_method}</b>
                  </p>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Ordered Items</h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Product Name</th>
                        <th className="px-4 py-2.5">Price</th>
                        <th className="px-4 py-2.5">Qty</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2.5 font-medium text-white">{item.product_name}</td>
                          <td className="px-4 py-2.5">{item.price?.toLocaleString()} MMK</td>
                          <td className="px-4 py-2.5">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-400">
                            {item.subtotal?.toLocaleString()} MMK
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-850 font-bold text-white">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">Total:</td>
                        <td className="px-4 py-3 text-right text-emerald-400 text-sm">
                          {selectedOrder.total_amount?.toLocaleString()} MMK
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Slip Image Preview (if uploaded) */}
              {selectedOrder.payment_slip_url && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Payment Slip / Screenshot</h4>
                  <div className="bg-slate-800 p-2 rounded-xl max-w-xs border border-slate-700">
                    <img
                      src={selectedOrder.payment_slip_url}
                      alt="Payment Slip"
                      className="w-full rounded-lg object-contain max-h-60"
                    />
                  </div>
                </div>
              )}

              {/* Status Update Form */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Update Order Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Status</label>
                    <select
                      value={updatingStatus}
                      onChange={(e) => setUpdatingStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Pending">Pending (စစ်ဆေးဆဲ)</option>
                      <option value="Confirmed">Confirmed (အတည်ပြုပြီး)</option>
                      <option value="Shipped">Shipped (ပို့ဆောင်ဆဲ)</option>
                      <option value="Delivered">Delivered (ရောက်ရှိပြီး)</option>
                      <option value="Cancelled">Cancelled (ပယ်ဖျက်)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notes / Tracking No.</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ဥပမာ- ရန်ကုန်ကားဂိတ်သို့ ပို့ပြီးပါပြီ"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyCustomer}
                      onChange={(e) => setNotifyCustomer(e.target.checked)}
                      className="rounded border-slate-700 text-sky-600 focus:ring-0"
                    />
                    <span>Customer ၏ Telegram သို့ အလိုအလျောက် အသိပေးစာ ပို့မည်</span>
                  </label>

                  <button
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save & Notify</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
