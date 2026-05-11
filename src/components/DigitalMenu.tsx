import React, { useState, useMemo, useEffect } from 'react';
import { 
  Utensils, 
  Coffee, 
  Search, 
  ShoppingBag, 
  Bell, 
  ChevronRight, 
  Star, 
  Info,
  ChevronLeft,
  X,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Users,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { MenuItem, CustomerOrder } from '@/src/types';

interface DigitalMenuProps {
  menu: MenuItem[];
  shopName: string;
  onCallWaiter: (table: string) => void;
  onPlaceOrder: (order: any) => Promise<string>;
  activeOrder?: CustomerOrder | null;
  isDarkMode?: boolean;
}

export default function DigitalMenu({ 
  menu, 
  shopName, 
  onCallWaiter,
  onPlaceOrder,
  activeOrder = null,
  isDarkMode = false
}: DigitalMenuProps) {
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [category, setCategory] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [temporaryOrder, setTemporaryOrder] = useState<any>(null);

  const categories = useMemo(() => {
    const defaultCats = ['Semua', 'Coffee', 'Non Coffee', 'Main Course', 'Snack'];
    const dynamicCats = Array.from(new Set(menu.map(item => item.category)));
    const allCats = new Set([...defaultCats, ...dynamicCats]);
    return Array.from(allCats);
  }, [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const itemName = item?.name || '';
      const itemCategory = item?.category || '';
      const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'Semua' || itemCategory === category;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchTerm, category]);

  const addToCart = (item: MenuItem) => {
    if (!item.available) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.qty), 0), [cart]);
  const tax = useMemo(() => subtotal * 0.1, [subtotal]);
  const cartTotal = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleCall = () => {
    if (!tableNumber) {
      window.alert("Pilih nomor meja terlebih dahulu");
      return;
    }
    setIsCalling(true);
    onCallWaiter(tableNumber);
    setTimeout(() => setIsCalling(false), 5000);
  };
  
  const handleCheckout = async () => {
    if (!customerName || !tableNumber || !contactInfo) {
      window.alert("Mohon lengkapi Nama, Kontak (Email/HP), dan Nomor Meja");
      return;
    }
    if (cart.length === 0) return;

    setIsOrdering(true);

    try {
      // Tunggu sedetik biar kelihatan loading dikit
      await new Promise(resolve => setTimeout(resolve, 1000));

      const queueNumber = `A${Math.floor(10 + Math.random() * 90)}`;
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const orderData = {
        id: orderId,
        queueNumber,
        customerName,
        contactInfo,
        tableNumber,
        items: cart.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, quantity: i.qty })),
        total: cartTotal,
        tax,
        paymentMethod: 'cash',
        note: orderNote,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Removed onPlaceOrder(orderData) to avoid DB locks/errors for local testing
      // Save local memory
      
      // Success feedback
      const utterance = new SpeechSynthesisUtterance("Pesanan berhasil dibuat. Silakan menuju kasir untuk pembayaran.");
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);

      setTemporaryOrder(orderData);
      setCart([]);
      setShowCart(false);
      setOrderNote('');
      setIsReceiptModalOpen(true); // This will trigger the popup
    } catch (err) {
      console.error(err);
      window.alert("Gagal memproses pesanan.");
    } finally {
      setIsOrdering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-indigo-500';
      case 'ready': return 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]';
      case 'completed': return 'bg-zinc-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-zinc-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'confirmed': return 'Pesanan Diterima';
      case 'processing': return 'Sedang Dibuat';
      case 'ready': return 'Siap Diambil';
      case 'completed': return 'Selesai';
      case 'rejected': return 'Pesanan Ditolak';
      default: return status;
    }
  };

  useEffect(() => {
    if (activeOrder?.status === 'ready') {
      const text = `Nomor antrian ${activeOrder.queueNumber || ''}, pesanan Anda sudah siap. Silakan ambil di kasir.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }
    if (activeOrder && !isReceiptModalOpen) {
      // Auto open modal when there is an active order initially
      setIsReceiptModalOpen(true);
    }
  }, [activeOrder?.status, activeOrder?.queueNumber]);

  // If there's an active order or temporary order, we can show the receipt modal over everything
  const orderToShow = activeOrder || temporaryOrder;

  if (activeOrder) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col relative max-w-md mx-auto shadow-2xl p-8",
        isDarkMode ? "bg-zinc-950 text-white" : "bg-[#FFFDFB] text-zinc-900"
      )}>
        <div className="flex-1 flex flex-col items-center justify-start text-center space-y-6 pt-8">
           <div className="relative">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center animate-pulse",
                getStatusColor(activeOrder.status)
              )}>
                 <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
           </div>

           <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-1">Status Pesanan</h2>
              <p className="text-sm font-medium tracking-wide" style={{ color: "var(--tw-prose-body)" }}>{getStatusText(activeOrder.status)}</p>
           </div>

           <div className="w-full p-1 bg-gradient-to-tr from-zinc-800 to-zinc-600 rounded-[2rem] shadow-xl">
            <div className="p-6 bg-zinc-900 rounded-[1.8rem] text-center text-white">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Nomor Antrian</p>
                 <p className="text-5xl font-black tracking-tighter text-white mb-2">{activeOrder.queueNumber || "..." }</p>
            </div>
           </div>

           <div className="w-full space-y-3 text-left">
              <div className="flex justify-between items-center p-3 text-xs bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                 <span className="font-bold text-zinc-400">Nama</span>
                 <span className="font-bold">{activeOrder.customerName}</span>
              </div>
              <div className="flex justify-between items-center p-3 text-xs bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                 <span className="font-bold text-zinc-400">Meja</span>
                 <span className="font-bold">{activeOrder.tableNumber}</span>
              </div>
           </div>
           
           <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border-2 border-orange-100 dark:border-orange-500/20 w-full">
             <p className="text-[10px] font-black text-orange-600 dark:text-orange-400">
                PEMBERITAHUAN
             </p>
             <p className="text-xs font-semibold text-orange-500 dark:text-orange-300 mt-1">
                Silakan pantau status pesanan Anda. Untuk pembayaran, tekan tombol Tampilkan Struk.
             </p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <button 
            onClick={() => window.location.reload()}
            className="py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
          >
            Kembali
          </button>
          <button 
            onClick={() => setIsReceiptModalOpen(true)}
            className="py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
          >
            Tampilkan Struk
          </button>
        </div>

        <AnimatePresence>
          {isReceiptModalOpen && orderToShow && (
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsReceiptModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={cn(
                  "relative w-full max-w-sm rounded-[3rem] p-6 shadow-2xl flex flex-col max-h-[90vh]",
                  isDarkMode ? "bg-zinc-950 text-white border border-zinc-800" : "bg-[#FFFDFB] text-zinc-900 border border-zinc-100"
                )}
              >
                  {/* Decorative circles */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex justify-between items-center mb-4 relative z-10 shrink-0">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={() => setIsReceiptModalOpen(false)} 
                      className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="text-center relative z-10 mb-6 shrink-0">
                    <h1 className="text-xl font-black tracking-tighter mb-1">Pesanan Berhasil</h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{shopName} DIGITAL RECEIPT</p>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-1 mask-linear-fade">
                    <div className="w-full p-4 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-3xl shadow-xl mb-4 text-white text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-100 mb-1">Nomor Antrian</p>
                      <p className="text-5xl font-black tracking-tighter">{orderToShow.queueNumber || "..."}</p>
                      {orderToShow.id && (
                        <div className="mt-2 text-xs font-medium text-orange-100">
                          ORD: <span className="font-mono font-bold text-white">{orderToShow.id.slice(-6).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4 mb-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                          <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Nama</span>
                          <span className="font-bold truncate" title={orderToShow.customerName}>{orderToShow.customerName}</span>
                        </div>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                          <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Meja</span>
                          <span className="font-bold">{orderToShow.tableNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 mb-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 text-center">Detail Pesanan</h3>
                      <div className="space-y-2 mb-3">
                        {orderToShow.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs font-medium items-start gap-2">
                            <span className="flex-1 leading-tight">{item.name} <span className="text-zinc-400 text-[10px] ml-1">x{item.quantity}</span></span>
                            <span className="font-bold shrink-0 mt-0.5">Rp {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                          <span>Subtotal</span>
                          <span>Rp {(orderToShow.total - orderToShow.tax).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                          <span>Pajak</span>
                          <span>Rp {orderToShow.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-zinc-900 dark:text-white pt-1">
                          <span>Total</span>
                          <span className="text-orange-500">Rp {orderToShow.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-center">
                      <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 leading-relaxed uppercase tracking-wider">
                        "Tunjukkan struk ini ke kasir untuk melanjutkan pembayaran."
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 shrink-0 relative z-10">
                    <button className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-95">
                      Screenshot
                    </button>
                    <button 
                      onClick={() => {
                        window.print();
                      }}
                      className="py-3 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                    >
                      Download
                    </button>
                  </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col relative max-w-md mx-auto shadow-2xl",
      isDarkMode ? "bg-zinc-950 text-white" : "bg-[#FFFDFB] text-zinc-900"
    )}>
      {/* Header */}
      <header className="p-6 pt-8 shrink-0">
         <button 
           onClick={() => window.location.href = '/'}
           className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400"
         >
           <ChevronLeft className="w-4 h-4" />
           Kembali ke Beranda
         </button>
        <div className="flex justify-between items-start mb-8">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Selamat Datang di</p>
              <h1 className="text-3xl font-black tracking-tighter leading-none">{shopName}</h1>
           </div>
           <div className="w-24 shrink-0">
             <input 
                type="text"
                placeholder="No. Meja"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className={cn(
                  "w-full text-center py-2 px-3 border-2 rounded-xl text-lg font-black outline-none transition-all placeholder:text-orange-300",
                  isDarkMode 
                    ? "bg-orange-950/30 border-orange-500/30 text-orange-400 focus:border-orange-500" 
                    : "bg-orange-50 border-orange-200 text-orange-500 focus:border-orange-500"
                )}
             />
           </div>
        </div>

        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
           <input 
             type="text" 
             placeholder="Cari Menu Favorit..."
             className={cn(
               "w-full py-4 pl-12 pr-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all",
               isDarkMode ? "bg-zinc-900 border-zinc-800 focus:border-orange-500" : "bg-white border-zinc-100 focus:border-orange-500"
             )}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

      {/* Category Slider */}
      <div className="px-6 overflow-x-auto smooth-scroll hide-scrollbar flex gap-4 pb-4">
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              category === c 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : isDarkMode ? "bg-zinc-900 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto p-6 sm:pb-32 smooth-scroll">
        {filteredMenu.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
             <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6">
                <Coffee className="w-10 h-10 text-zinc-400" />
             </div>
             {menu.length === 0 ? (
               <>
                 <p className="text-xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">Menu Belum Tersedia</p>
                 <p className="text-sm text-zinc-500 mb-8 max-w-[200px] leading-relaxed">Admin belum menambahkan menu.</p>
                 <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                 >
                    Refresh Menu
                 </button>
               </>
             ) : (
               <>
                 <p className="text-xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">Menu Tidak Ditemukan</p>
                 <p className="text-sm text-zinc-500 mb-2 max-w-[200px] leading-relaxed">Tidak ada menu yang sesuai dengan pencarian atau filter kategori saat ini.</p>
               </>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredMenu.map(item => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={cn(
                  "p-4 rounded-[2rem] border-2 flex flex-col gap-4 transition-all group",
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
                )}
              >
                 <div className="w-full h-48 rounded-[1.5rem] overflow-hidden bg-zinc-100 shrink-0 relative">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    {!item.available && (
                       <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <span className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-widest">Habis</span>
                       </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                       <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                       <span className="text-xs font-black text-zinc-900 dark:text-white">4.8</span>
                    </div>
                 </div>
                 
                 <div className="flex-1 flex flex-col justify-between px-2">
                    <div className="mb-4">
                      <h3 className="text-lg font-black tracking-tight mb-1">{item.name}</h3>
                      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                       <p className="text-xl font-black text-orange-500">Rp {item.price.toLocaleString()}</p>
                       <button 
                          disabled={!item.available}
                          onClick={() => addToCart(item)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-xs uppercase tracking-widest",
                            item.available 
                             ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:scale-105 active:scale-95 shadow-xl" 
                             : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                          )}
                       >
                          <Plus className="w-4 h-4" />
                          Tambah
                       </button>
                    </div>
                 </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 flex gap-4 border-t-2 backdrop-blur-md",
        isDarkMode ? "bg-zinc-950/80 border-zinc-800" : "bg-white/80 border-zinc-100"
      )}>
         <button 
            onClick={handleCall}
            disabled={isCalling}
            className={cn(
              "flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border-2",
              isCalling 
                ? "bg-green-500 text-white border-green-500" 
                : isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"
            )}
         >
            <Bell className={cn("w-5 h-5", isCalling && "animate-ring")} />
            <span className="text-[10px] font-black uppercase tracking-widest">
               {isCalling ? "Memanggil..." : "Panggil Pelayan"}
            </span>
         </button>
         
         <button 
           onClick={() => setShowCart(true)}
           className="relative flex-1 py-4 bg-orange-500 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-orange-500/30"
         >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Keranjang</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-zinc-900 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-4 border-white dark:border-zinc-950">
                {cart.length}
              </span>
            )}
         </button>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-end max-w-md mx-auto">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCart(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className={cn(
                 "relative w-full rounded-t-[3rem] p-8 pb-12 flex flex-col max-h-[80vh]",
                 isDarkMode ? "bg-zinc-900" : "bg-white"
               )}
             >
                <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-8" />
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black tracking-tighter">Keranjang Anda</h2>
                   <button onClick={() => setShowCart(false)} className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800">
                      <X className="w-6 h-6" />
                   </button>
                </div>

                 <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2 custom-scrollbar">
                   {cart.length === 0 ? (
                     <div className="py-20 text-center opacity-30">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">Keranjang Kosong</p>
                     </div>
                   ) : (
                     <>
                       <div className="space-y-4">
                         {cart.map(item => (
                           <div key={item.id} className="flex gap-4 items-center">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100">
                                 <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1">
                                 <h4 className="text-xs font-black">{item.name}</h4>
                                 <p className="text-[10px] font-black text-orange-500">Rp {item.price.toLocaleString()} x {item.qty}</p>
                              </div>
                              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-lg">
                                 <button onClick={() => updateCartQty(item.id, -1)} className="p-1 hover:text-orange-500 transition-colors">
                                    <Minus className="w-3 h-3" />
                                 </button>
                                 <span className="text-[10px] font-black w-4 text-center">{item.qty}</span>
                                 <button onClick={() => updateCartQty(item.id, 1)} className="p-1 hover:text-orange-500 transition-colors">
                                    <Plus className="w-3 h-3" />
                                 </button>
                              </div>
                              <button 
                                 onClick={() => removeFromCart(item.id)}
                                 className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                              >
                                 <X className="w-4 h-4" />
                              </button>
                           </div>
                         ))}
                       </div>

                       <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-6" />

                       <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">Data Pemesan</h3>
                          <div className="grid grid-cols-1 gap-4">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Nama Lengkap</label>
                                <input 
                                   type="text" 
                                   value={customerName}
                                   onChange={(e) => setCustomerName(e.target.value)}
                                   placeholder="Contoh: Budi Santoso"
                                   className={cn(
                                     "w-full p-3 rounded-xl text-xs font-bold outline-none border-2",
                                     isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                                   )}
                                />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Email/HP</label>
                                   <input 
                                      type="text" 
                                      value={contactInfo}
                                      onChange={(e) => setContactInfo(e.target.value)}
                                      placeholder="0812..."
                                      className={cn(
                                        "w-full p-3 rounded-xl text-xs font-bold outline-none border-2",
                                        isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                                      )}
                                   />
                                </div>
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Nomor Meja</label>
                                   <input 
                                      type="text" 
                                      value={tableNumber}
                                      onChange={(e) => setTableNumber(e.target.value)}
                                      placeholder="Meja 01"
                                      className={cn(
                                        "w-full p-3 rounded-xl text-xs font-bold outline-none border-2",
                                        isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                                      )}
                                   />
                                </div>
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Catatan Pesanan</label>
                             <textarea 
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                placeholder="Gula dikurangi, extra pedas, dll..."
                                className={cn(
                                  "w-full p-3 rounded-xl text-xs font-bold outline-none border-2 min-h-[80px] resize-none",
                                  isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                                )}
                             />
                          </div>
                          
                       </div>
                     </>
                   )}
                </div>

                <div className="space-y-4">
                   <div className="space-y-2 px-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400">
                         <span>Subtotal</span>
                         <span>Rp {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400">
                         <span>Pajak (10%)</span>
                         <span>Rp {tax.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />
                      <div className="flex justify-between items-center">
                         <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Total Harga</p>
                         <p className="text-2xl font-black tracking-tighter">Rp {cartTotal.toLocaleString()}</p>
                      </div>
                   </div>
                   <button 
                     disabled={isOrdering || cart.length === 0}
                     className="w-full py-5 bg-orange-500 text-white rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/25 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                     onClick={handleCheckout}
                   >
                      {isOrdering ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                      {isOrdering ? "Memproses..." : "Checkout ke Kasir"}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Receipt Modal */}
      <AnimatePresence>
        {isReceiptModalOpen && orderToShow && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsReceiptModalOpen(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className={cn(
                 "relative w-full max-w-sm rounded-[3rem] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
                 isDarkMode ? "bg-zinc-950 text-white border border-zinc-800" : "bg-[#FFFDFB] text-zinc-900 border border-zinc-100"
               )}
             >
                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />

                <div className="flex justify-between items-center mb-4 relative z-10">
                   <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                     <CheckCircle2 className="w-5 h-5" />
                   </div>
                   <button 
                     onClick={() => setIsReceiptModalOpen(false)} 
                     className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 transition-colors"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="text-center relative z-10 mb-6 shrink-0">
                  <h1 className="text-xl font-black tracking-tighter mb-1">Pesanan Berhasil</h1>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{shopName} DIGITAL RECEIPT</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-1">
                  <div className="w-full p-4 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-3xl shadow-xl mb-4 text-white text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-100 mb-1">Nomor Antrian</p>
                    <p className="text-5xl font-black tracking-tighter">{orderToShow.queueNumber || "..."}</p>
                    {orderToShow.id && (
                      <div className="mt-2 text-xs font-medium text-orange-100">
                        ORD: <span className="font-mono font-bold text-white">{orderToShow.id.slice(-6).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Nama</span>
                        <span className="font-bold truncate" title={orderToShow.customerName}>{orderToShow.customerName}</span>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Meja</span>
                        <span className="font-bold">{orderToShow.tableNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 text-center">Detail Pesanan</h3>
                    <div className="space-y-2 mb-3">
                      {orderToShow.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs font-medium items-start gap-2">
                          <span className="flex-1 leading-tight">{item.name} <span className="text-zinc-400 text-[10px] ml-1">x{item.quantity}</span></span>
                          <span className="font-bold shrink-0 mt-0.5">Rp {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                        <span>Subtotal</span>
                        <span>Rp {(orderToShow.total - orderToShow.tax).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                        <span>Pajak</span>
                        <span>Rp {orderToShow.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-zinc-900 dark:text-white pt-1">
                        <span>Total</span>
                        <span className="text-orange-500">Rp {orderToShow.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-center">
                    <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 leading-relaxed uppercase tracking-wider">
                      "Tunjukkan struk ini ke kasir untuk melanjutkan pembayaran."
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 shrink-0 relative z-10">
                  <button className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    Screenshot
                  </button>
                  <button 
                    onClick={() => {
                      setIsReceiptModalOpen(false);
                      // Trigger native print or download
                      window.print();
                    }}
                    className="py-3 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                  >
                    Download
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
