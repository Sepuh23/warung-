import React, { useState, useMemo } from 'react';
import { Box, Search, Filter, X, Check, Package2, DollarSign, History, TrendingUp, AlertCircle, ArrowUpDown } from 'lucide-react';
import { MenuItem } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { useAccessibility } from './AccessibilityContext';

interface InventoryProps {
  items: MenuItem[];
  onUpdateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  isTabletMode?: boolean;
  isDarkMode?: boolean;
}

type SortKey = 'name' | 'stock' | 'price' | 'category';

export default function Inventory({ 
  items, 
  onUpdateMenuItem,
  isTabletMode,
  isDarkMode
}: InventoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { playHaptic } = useAccessibility();

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const status = (item.stock || 0) > 10 ? 'in_stock' : (item.stock || 0) > 0 ? 'low' : 'out_of_stock';
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
    });

    return result;
  }, [items, searchQuery, filterStatus, sortKey, sortOrder]);

  const totalStockValue = items.reduce((acc, item) => acc + ((item.costPrice || 0) * (item.stock || 0)), 0);
  const totalPotentialRevenue = items.reduce((acc, item) => acc + ((item.price || 0) * (item.stock || 0)), 0);
  const lowStockCount = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= 10).length;
  const outOfStockCount = items.filter(i => (i.stock || 0) === 0).length;

  const handleUpdateStock = (id: string, newStock: number) => {
    if (newStock < 0) {
      alert('Stok tidak boleh negatif!');
      return;
    }
    
    onUpdateMenuItem(id, { 
      stock: newStock,
      stockStatus: newStock > 10 ? 'in_stock' : newStock > 0 ? 'low' : 'out_of_stock'
    });
    setEditingStockId(null);
    playHaptic?.();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8" role="region" aria-label="Inventory Management">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className={cn("p-6 rounded-[2.5rem] border-4 flex items-center gap-5", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-blue-500/10 shadow-lg shadow-blue-500/5")}>
          <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center shrink-0">
            <Package2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] mb-1">Items Katalog</p>
            <p className={cn("text-2xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-coffee-dark")}>{items.length}</p>
          </div>
        </div>
        <div className={cn("p-6 rounded-[2.5rem] border-4 flex items-center gap-5", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-red-500/10 shadow-lg shadow-red-500/5")}>
          <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] mb-1">Restock Segera</p>
            <p className={cn("text-2xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-coffee-dark")}>{lowStockCount + outOfStockCount}</p>
          </div>
        </div>
        <div className={cn("p-6 rounded-[2.5rem] border-4 flex items-center gap-5", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-green-500/10 shadow-lg shadow-green-500/5")}>
          <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center shrink-0">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] mb-1">Nilai Aset (HPP)</p>
            <p className={cn("text-2xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-coffee-dark")}>{formatCurrency(totalStockValue)}</p>
          </div>
        </div>
        <div className={cn("p-6 rounded-[2.5rem] border-4 flex items-center gap-5", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-orange-500/10 shadow-lg shadow-orange-500/5")}>
          <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-3xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-coffee-muted uppercase tracking-[0.2em] mb-1">Potensi Omzet</p>
            <p className={cn("text-2xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-coffee-dark")}>{formatCurrency(totalPotentialRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-stretch sm:items-center shrink-0">
        <div className="relative flex-1 max-w-xl group">
          <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-coffee-muted group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari produk berdasarkan nama atau kategori..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-14 pr-6 py-4 border-4 rounded-[2rem] text-sm font-bold outline-none transition-all",
              isDarkMode ? "bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700" : "bg-white border-zinc-100 focus:border-orange-500 shadow-xl shadow-orange-500/5"
            )}
            aria-label="Cari Produk"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl border-2 border-transparent dark:border-zinc-800">
            {['all', 'in_stock', 'low', 'out_of_stock'].map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                  filterStatus === status 
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg" 
                    : "text-coffee-muted hover:text-coffee-dark dark:hover:text-white"
                )}
              >
                {status === 'all' ? 'Semua' : status === 'in_stock' ? 'Aman' : status === 'low' ? 'Tipis' : 'Habis'}
              </button>
            ))}
          </div>

          <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl border-2 border-transparent dark:border-zinc-800">
             <button 
              onClick={() => toggleSort('stock')} 
              className={cn(
                "px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                sortKey === 'stock' ? "text-orange-500" : "text-coffee-muted"
              )}
            >
              <ArrowUpDown className="w-3 h-3" /> Stok
            </button>
            <button 
              onClick={() => toggleSort('price')} 
              className={cn(
                "px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                sortKey === 'price' ? "text-orange-500" : "text-coffee-muted"
              )}
            >
              <ArrowUpDown className="w-3 h-3" /> Harga
            </button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto smooth-scroll pr-2 pb-10 relative overscroll-none">
        {filteredAndSortedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-900 rounded-[3rem] flex items-center justify-center mb-6 text-coffee-neutral">
              <Box className="w-12 h-12" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-widest opacity-40">Data Tidak Ditemukan</h4>
            <p className="text-sm font-bold opacity-30 mt-2">Coba kata kunci lain atau ubah filter Anda</p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6",
            isTabletMode ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          )}>
            {filteredAndSortedItems.map(item => {
              const currentStock = item.stock || 0;
              const status = currentStock > 10 ? 'in_stock' : currentStock > 0 ? 'low' : 'out_of_stock';
              
              return (
                <div key={item.id} className={cn(
                  "border-4 rounded-[2.5rem] p-6 flex flex-col transition-all group relative overflow-hidden",
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100 shadow-xl shadow-zinc-500/5",
                  status === 'out_of_stock' && "opacity-70 grayscale-[0.5]",
                  "hover:border-orange-500/30 hover:-translate-y-2"
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-950 rounded-2xl overflow-hidden shrink-0 border-2 border-gray-100 dark:border-zinc-800 transition-transform group-hover:scale-110">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                          <Package2 className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm",
                      status === 'in_stock' ? "bg-green-500 text-white" : 
                      status === 'low' ? "bg-orange-500 text-white" : 
                      "bg-red-500 text-white"
                    )}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {status === 'in_stock' ? 'Safe' : status === 'low' ? 'Low' : 'Empty'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-[9px] font-black uppercase text-orange-500 tracking-[0.2em] mb-1">{item.category}</p>
                    <h3 className="text-sm font-black leading-tight line-clamp-2 md:h-10">{item.name}</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                      <p className="text-[9px] font-bold text-coffee-muted uppercase tracking-widest">HPP Unit</p>
                      <p className="text-[10px] font-black">{formatCurrency(item.costPrice || 0)}</p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                      <p className="text-[9px] font-bold text-coffee-muted uppercase tracking-widest">Harga Jual</p>
                      <p className="text-[10px] font-black text-orange-500">{formatCurrency(item.price)}</p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    {editingStockId === item.id ? (
                      <div className="flex gap-2 items-center">
                        <input 
                          type="number" 
                          autoFocus
                          value={tempStock}
                          onChange={(e) => setTempStock(parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock(item.id, tempStock)}
                          className={cn(
                            "w-full px-4 py-3 border-2 rounded-2xl text-center font-black transition-all",
                            isDarkMode ? "bg-zinc-950 border-orange-500 text-white" : "bg-white border-orange-500 shadow-lg shadow-orange-500/20"
                          )}
                        />
                         <button 
                          onClick={() => handleUpdateStock(item.id, tempStock)} 
                          className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                           <Check className="w-6 h-6" />
                         </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingStockId(item.id); setTempStock(item.stock || 0); }}
                        className={cn(
                          "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all border-2",
                          status === 'in_stock' ? "bg-zinc-900 border-zinc-900 text-white hover:bg-black" : 
                          status === 'low' ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" : 
                          "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        )}
                        aria-label={`Update stock for ${item.name}`}
                      >
                        <span>Update Stock</span>
                        <span className="text-sm bg-white/20 px-3 py-0.5 rounded-lg">{item.stock || 0}</span>
                      </button>
                    )}
                    
                    <button className="w-full flex items-center justify-center gap-2 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-coffee-muted opacity-40 hover:opacity-100 transition-opacity">
                      <History className="w-3 h-3" /> Riwayat Perubahan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
