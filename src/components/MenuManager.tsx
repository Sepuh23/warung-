import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, Upload } from 'lucide-react';
import { MenuItem } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { useAccessibility } from './AccessibilityContext';

interface MenuManagerProps {
  menu: MenuItem[];
  onAddMenuItem: (item: Partial<MenuItem>) => void;
  onUpdateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  onDeleteMenuItem: (id: string) => void;
  speak?: (text: string) => void;
  playVibrate?: () => void;
  isTabletMode?: boolean;
}

export default function MenuManager({ menu, onAddMenuItem, onUpdateMenuItem, onDeleteMenuItem, speak, playVibrate, isTabletMode }: MenuManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    costPrice: 0,
    category: 'Coffee',
    description: '',
    available: true,
    stock: 0,
    badge: 'none'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = ['Coffee', 'Non-Coffee', 'Snack', 'Main Course', 'Specialty'];
  const badges = ['none', 'Best Seller', 'Promo', 'Baru', 'Signature'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Increased to 2MB
        playVibrate?.();
        alert('File too large! Maximum 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEditMode && editingItemId) {
          onUpdateMenuItem(editingItemId, { imageUrl: result });
        } else {
          setNewItem({ ...newItem, imageUrl: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.price) {
      if (editingItemId) {
        onUpdateMenuItem(editingItemId, newItem);
      } else {
        onAddMenuItem({
          ...newItem,
          stockStatus: (newItem.stock || 0) > 10 ? 'in_stock' : (newItem.stock || 0) > 0 ? 'low' : 'out_of_stock'
        });
      }
      setNewItem({ name: '', price: 0, costPrice: 0, category: 'Coffee', description: '', available: true, stock: 0, badge: 'none', imageUrl: undefined });
      setIsAdding(false);
      setEditingItemId(null);
      speak?.(`${newItem.name} berhasil disimpan`);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setNewItem(item);
    setEditingItemId(item.id);
    setIsAdding(true);
    speak?.(`Mengedit ${item.name}`);
  };

  return (
    <div className="space-y-8 h-full overflow-y-auto pr-2 pb-10 smooth-scroll relative overscroll-none" role="region" aria-label="Menu Management">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-coffee-dark dark:text-white uppercase tracking-[0.2em]">Pengaturan Produk</h2>
          <p className="text-[10px] font-bold text-coffee-muted uppercase tracking-widest mt-1">Kelola katalog menu Warung Anda</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingItemId(null);
            setNewItem({ name: '', price: 0, costPrice: 0, category: 'Coffee', description: '', available: true, stock: 0, badge: 'none', imageUrl: undefined });
          }}
          className="w-full sm:w-auto bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/20"
          aria-label="Tambah Menu Baru"
        >
          <Plus className="w-5 h-5" />
          Produk Baru
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className={cn("bg-white border-coffee-border p-8 rounded-[3rem] border-4 space-y-6 animate-in slide-in-from-top-12 duration-500 shadow-2xl relative", "dark:bg-zinc-900 dark:border-zinc-800")}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black uppercase tracking-widest text-sm italic">{editingItemId ? 'Edit Produk' : 'Buat Produk Baru'}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingItemId(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Image Upload Area */}
            <div className="lg:row-span-2">
              <label className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] mb-3 block">Poster / Foto Produk</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  handleImageUpload({ target: { files: [file] } } as any);
                }}
                className="w-full aspect-square bg-gray-50 dark:bg-zinc-950/50 border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-all overflow-hidden group relative"
              >
                {newItem.imageUrl ? (
                  <>
                    <img src={newItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <Edit2 className="w-8 h-8 text-white mb-2" />
                      <span className="text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-white rounded-full">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 opacity-40 group-hover:opacity-100 transition-all group-hover:scale-105">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform">
                      <Upload className="w-8 h-8 text-coffee-dark dark:text-white" />
                    </div>
                    <p className="text-[10px] font-black text-coffee-dark dark:text-white uppercase tracking-widest">Unggah Gambar</p>
                    <p className="text-[8px] text-coffee-muted mt-2 uppercase tracking-widest leading-relaxed">Square 1:1 Recommended <br /> (Max 2MB)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="space-y-6 col-span-1 md:col-span-1 lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] ml-1">Identitas Menu</label>
                  <input 
                    type="text" required
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    placeholder="cth: Ayam Geprek Sambal Matah"
                    className="w-full bg-gray-50 dark:bg-zinc-950/50 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] ml-1">Kategori</label>
                  <select 
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-zinc-950/50 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-orange-500 outline-none transition-all appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] ml-1">Harga Jual Konsumen</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-xs text-coffee-muted">Rp</span>
                    <input 
                      type="number" required
                      value={newItem.price || ''}
                      onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-950/50 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl pl-12 pr-5 py-4 text-sm font-black focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] ml-1">Biaya Modal (HPP)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-xs text-coffee-muted">Rp</span>
                    <input 
                      type="number" 
                      value={newItem.costPrice || ''}
                      onChange={e => setNewItem({...newItem, costPrice: Number(e.target.value)})}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-950/50 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] ml-1">Persediaan Stok</label>
                  <input 
                    type="number" 
                    value={newItem.stock || ''}
                    onChange={e => setNewItem({...newItem, stock: Number(e.target.value)})}
                    placeholder="Jumlah stok saat ini"
                    className="w-full bg-gray-50 dark:bg-zinc-950/50 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] ml-1">Label Promosi</label>
                  <select 
                    value={newItem.badge}
                    onChange={e => setNewItem({...newItem, badge: e.target.value as any})}
                    className="w-full bg-gray-50 dark:bg-zinc-950/50 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-orange-500 outline-none transition-all"
                  >
                    {badges.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] ml-1">Deskripsi & Catatan</label>
                <textarea 
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                  placeholder="Deskripsi singkat produk (opsional)..."
                  className="w-full bg-gray-50 dark:bg-zinc-950/50 border-2 border-gray-100 dark:border-zinc-800 rounded-3xl px-5 py-4 text-sm font-medium focus:border-orange-500 outline-none transition-all resize-none h-24"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setNewItem({...newItem, available: !newItem.available})}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                    newItem.available ? "bg-green-500 border-green-500 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-800"
                  )}
                >
                  {newItem.available ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {newItem.available ? 'Aktif di POS' : 'Nonaktif di POS'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-10 border-t-2 border-gray-100 dark:border-zinc-800">
            <button type="button" onClick={() => { setIsAdding(false); setEditingItemId(null); }} className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-coffee-muted hover:text-orange-500 transition-colors">Batal / Kembali</button>
            <button type="submit" className="bg-zinc-900 dark:bg-white dark:text-zinc-950 text-white px-12 py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
              {editingItemId ? 'Update Produk' : 'Terbitkan Produk'}
            </button>
          </div>
        </form>
      )}

      <div className={cn(
        "grid gap-6 md:gap-8",
        isTabletMode ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      )}>
        {menu.map(item => (
          <div key={item.id} className={cn(
            "bg-white dark:bg-zinc-900 border-4 border-coffee-border dark:border-zinc-800 rounded-[3rem] group hover:border-orange-500/50 hover:shadow-2xl transition-all overflow-hidden flex flex-col relative",
            "hover:-translate-y-2"
          )}>
            <div className="aspect-[4/3] bg-gray-50 dark:bg-zinc-950 relative overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center opacity-20">
                  <ImageIcon className="w-12 h-12 mb-2" />
                </div>
              )}
              {item.badge && item.badge !== 'none' && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                  {item.badge}
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-10 group-hover:translate-x-0">
                <button onClick={() => handleEdit(item)} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-zinc-900 shadow-xl hover:bg-orange-500 hover:text-white transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => { if(confirm('Hapus produk ini?')) { playVibrate?.(); onDeleteMenuItem(item.id); speak?.(`${item.name} dihapus`); } }} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-red-600 shadow-xl hover:bg-red-600 hover:text-white transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="mb-4">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">{item.category}</p>
                <h3 className="text-lg font-black text-coffee-dark dark:text-white leading-tight">{item.name}</h3>
              </div>
              
              <div className="mt-auto space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-coffee-muted uppercase tracking-widest mb-1 opacity-50">Harga Jual</p>
                    <p className="text-xl font-black text-coffee-dark dark:text-white tracking-tighter">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-coffee-muted uppercase tracking-widest mb-1 opacity-50">Stok</p>
                    <p className={cn("text-lg font-black tracking-tighter", (item.stock || 0) < 5 ? "text-red-500" : "text-coffee-dark dark:text-white")}>{item.stock || 0}</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    playVibrate?.();
                    const nextStatus = !item.available;
                    onUpdateMenuItem(item.id, { available: nextStatus });
                  }}
                  className={cn(
                    "w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2",
                    item.available ? "bg-green-500/5 border-green-500/20 text-green-600" : "bg-red-500/5 border-red-500/20 text-red-600"
                  )}
                >
                  {item.available ? 'ACTIVE IN POS' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
