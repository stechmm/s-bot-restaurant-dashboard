import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Layers, 
  Package, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import api from '../api/client';

export default function Products({ lang }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const fileInputRef = React.useRef(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    is_active: true
  });

  const [catForm, setCatForm] = useState({
    name: '',
    icon: '📦',
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes] = await Promise.all([
        api.get('/products/'),
        api.get('/products/categories')
      ]);
      setProducts(prodsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category_id: categories[0]?.id || '',
      price: '',
      stock: '10',
      description: '',
      image_url: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setForm({
      name: prod.name,
      category_id: prod.category_id || '',
      price: prod.price,
      stock: prod.stock,
      description: prod.description || '',
      image_url: prod.image_url || '',
      is_active: prod.is_active
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e, productId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (productId) {
        // Upload directly to existing product
        const res = await api.post(`/products/${productId}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setForm(f => ({ ...f, image_url: res.data.image_url }));
        fetchData();
      } else {
        // Upload generic and store URL in form
        const res = await api.post('/products/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setForm(f => ({ ...f, image_url: res.data.image_url }));
      }
    } catch (err) {
      alert('ပုံ upload မအောင်မြင်ပါ: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products/', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error saving product: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('ဤကုန်ပစ္စည်းကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products/categories', catForm);
      setIsCatModalOpen(false);
      setCatForm({ name: '', icon: '📦', description: '' });
      fetchData();
    } catch (err) {
      alert('Error saving category');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCat === 'all' || p.category_id === parseInt(selectedCat);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {lang === 'mm' ? 'ကုန်ပစ္စည်းများ စီမံခန့်ခွဲခြင်း' : 'Product & Catalog Management'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {lang === 'mm' ? 'Bot တွင် ပြသမည့် ပစ္စည်းများနှင့် အမျိုးအစားများကို စီမံနိုင်ပါသည်' : 'Manage your items shown in Telegram Shop'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>{lang === 'mm' ? 'အမျိုးအစား ထည့်မည်' : 'New Category'}</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'mm' ? 'ပစ္စည်းအသစ်ထည့်မည်' : 'Add Product'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCat === 'all'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {lang === 'mm' ? 'အားလုံး' : 'All Products'} ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id.toString())}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCat === cat.id.toString()
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'mm' ? 'ပစ္စည်းရှာရန်...' : 'Search products...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">ကုန်ပစ္စည်း မရှိသေးပါ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="glass-panel rounded-2xl overflow-hidden flex flex-col border border-slate-800 hover:border-slate-700 transition duration-200 group"
            >
              {/* Product Image */}
              <div className="h-44 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                {prod.image_url ? (
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-slate-600" />
                )}
                {/* Stock Badge */}
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-slate-300 border border-slate-700">
                  Stock: {prod.stock}
                </span>
                {/* Category Pill */}
                {prod.category && (
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-sky-950/80 backdrop-blur-md text-[10px] font-semibold text-sky-400 border border-sky-800">
                    {prod.category.icon} {prod.category.name}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm line-clamp-1">{prod.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prod.description || 'အသေးစိတ် မရှိပါ'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Price</p>
                    <p className="text-sm font-extrabold text-emerald-400">{prod.price.toLocaleString()} MMK</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? (lang === 'mm' ? 'ကုန်ပစ္စည်း ပြင်ဆင်မည်' : 'Edit Product') : (lang === 'mm' ? 'ကုန်ပစ္စည်း အသစ်ထည့်မည်' : 'Add New Product')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ပစ္စည်းအမည် (Product Name) *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ဥပမာ- Wireless Earbuds"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">အမျိုးအစား (Category)</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">ရွေးချယ်ပါ</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">စျေးနှုန်း (Price - MMK) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="35000"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">လက်ကျန် (Stock Quantity)</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="50"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ပုံ (Product Image)</label>
                  <div className="flex flex-col gap-2">
                    {form.image_url && (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                        <img
                          src={form.image_url}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display='none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image_url: '' })}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600 rounded-lg text-white hover:bg-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => handleImageUpload(e, editingProduct?.id)}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 border-dashed hover:border-sky-500 hover:bg-slate-700/50 text-slate-400 hover:text-sky-400 rounded-xl text-xs font-semibold transition"
                      >
                        <ImageIcon className="w-4 h-4" />
                        {uploadingImage ? 'Upload နေသည်...' : 'ပုံရွေးချယ် Upload မည်'}
                      </button>
                    </div>
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="သို့မဟုတ် Image URL ထည့်ပါ..."
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">အသေးစိတ် ဖော်ပြချက် (Description)</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ပစ္စည်း၏ အချက်အလက်များ..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30"
                >
                  သိမ်းဆည်းမည် (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">အမျိုးအစား အသစ်ထည့်မည်</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Icon</label>
                  <input
                    type="text"
                    value={catForm.icon}
                    onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center text-base text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">အမျိုးအစား အမည် *</label>
                  <input
                    type="text"
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="ဥပမာ- အဝတ်အထည်"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ဖော်ပြချက် (Description)</label>
                <input
                  type="text"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="အမျိုးအစား အကျဉ်း..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold"
                >
                  ထည့်သွင်းမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
