import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, X, CheckCircle2, CreditCard, Banknote, Printer, Search, Percent, Smartphone, ArrowDownToLine, Receipt, Wallet } from 'lucide-react';
import { MenuItem, OrderItem } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { ReceiptPrint } from './ReceiptPrint';
import html2pdf from 'html2pdf.js';
import { useAccessibility } from './AccessibilityContext';
import { VoiceOrderControl } from './VoiceOrderControl';

interface POSProps {
  menu: MenuItem[];
  onPlaceOrder: (items: OrderItem[], total: number, paymentMethod: string) => void;
  shopName?: string;
  speak?: (text: string) => void;
  playVibrate?: () => void;
  isTabletMode?: boolean;
  isDarkMode?: boolean;
}

const MenuItemCard = React.memo(({ item, onAdd, isDarkMode }: any) => {
  return (
    <button 
      onClick={() => onAdd(item)}
      className={cn(
        "group p-0 rounded-3xl border transition-all text-left relative overflow-hidden flex flex-col justify-between h-full gpu",
        isDarkMode ? "bg-zinc-900 border-zinc-800 hover:border-orange-500/50" : "bg-white border-coffee-border hover:border-orange-500/50",
        !item.available && "opacity-60 grayscale cursor-not-allowed"
      )}
      disabled={!item.available}
    >
      <div className="aspect-[4/3] bg-coffee-neutral relative border-b border-gray-100 dark:border-zinc-800">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center opacity-30">
            <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
          </div>
        )}
        {item.badge && item.badge !== 'none' && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">
            {item.badge}
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg">HABIS</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="relative z-10 flex-1">
          <span className="text-[9px] font-black uppercase text-coffee-muted tracking-widest block mb-1 opacity-80">{item.category}</span>
          <h4 className={cn("text-sm font-black tracking-tight mb-1 line-clamp-2", isDarkMode ? "text-white" : "text-coffee-dark")}>{item.name}</h4>
          {item.description && <p className="text-[10px] text-gray-500 dark:text-zinc-400 line-clamp-1 mb-2">{item.description}</p>}
        </div>
        <div className="flex justify-between items-end relative z-10 mt-2">
          <p className="text-sm font-black text-orange-500">{formatCurrency(item.price)}</p>
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 transition-colors" />
    </button>
  );
});

export default function POS({ menu, onPlaceOrder, shopName = "WARUNG+", speak, playVibrate, isTabletMode, isDarkMode }: POSProps) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer' | 'ewallet'>('cash');
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // New State for Search, Tax, Discount
  const [searchQuery, setSearchQuery] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false);
  
  // Performance optimization: limit the number of rendered items
  const [displayLimit, setDisplayLimit] = useState(24);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const { playVisualAlert, playHaptic: playAccessHaptic } = useAccessibility();

  const printRef = useRef<HTMLDivElement>(null);

  const filteredMenu = useMemo(() => {
    let result = menu;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
      );
    }
    return result;
  }, [searchQuery, menu]);

  const displayedMenu = useMemo(() => {
    return filteredMenu.slice(0, displayLimit);
  }, [filteredMenu, displayLimit]);

  // Handle infinite scroll / lazy loading for menu items
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 200) {
        setDisplayLimit(prev => Math.min(prev + 12, filteredMenu.length));
      }
    };
    
    const container = menuContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [filteredMenu.length]);

  // Reset limit when search changes
  useEffect(() => {
    setDisplayLimit(24);
  }, [searchQuery]);

  const addToCart = useCallback((item: MenuItem) => {
    speak?.(`${item.name} ditambahkan`);
    playVibrate?.();
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }, [speak, playVibrate]);

  const removeFromCart = useCallback((menuItemId: string) => {
    playVibrate?.();
    setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
  }, [playVibrate]);

  const updateQuantity = useCallback((menuItemId: string, delta: number) => {
    playVibrate?.();
    setCart(prev => prev.map(i => {
      if (i.menuItemId === menuItemId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  }, [playVibrate]);

  const subTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const taxAmount = Math.round(subTotal * taxRate);
  const discountVal = parseFloat(discountAmount) || 0;
  const total = Math.max(0, subTotal + taxAmount - discountVal);

  const handleStartPayment = useCallback(() => {
    playVibrate?.();
    setIsPaymentModalOpen(true);
    setCashReceived('');
  }, [playVibrate]);

  const currentCashReceived = parseFloat(cashReceived) || 0;
  const currentChange = paymentMethod === 'cash' ? Math.max(0, currentCashReceived - total) : 0;

  const handleFinalizeOrder = () => {
    const orderId = "INV-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const orderTime = new Date();
    
    // Detailed order info for the success modal
    const orderData = { 
      id: orderId,
      items: [...cart], 
      subTotal,
      taxAmount,
      discountAmount: discountVal,
      total, 
      cashReceived: paymentMethod === 'cash' ? currentCashReceived : undefined,
      change: paymentMethod === 'cash' ? currentChange : undefined,
      paymentMethod,
      date: orderTime,
      cashier: shopName || "Sarah"
    };

    speak?.("Pembayaran berhasil. Terima kasih.");
    playVibrate?.();
    playAccessHaptic?.([200, 100, 200]);
    playVisualAlert?.('success', 'Pembayaran Berhasil!');
    
    onPlaceOrder(cart, total, paymentMethod);
    setLastOrder(orderData);
    
    setCart([]);
    setDiscountAmount('');
    setIsPaymentModalOpen(false);
    setAutoPrintTriggered(false);
    setIsReceiptModalOpen(true);
  };

  const handlePrint = useCallback(() => {
    playVisualAlert('process', 'Mencetak Struk...');
    playAccessHaptic(200);

    const printContent = printRef.current;
    if (printContent) {
      let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <title>Cetak Struk - ${lastOrder?.id}</title>
              <style>
                @page { margin: 0; size: 58mm auto; }
                body { 
                  margin: 0; 
                  padding: 10px; 
                  background: #fff;
                }
                /* Reset tailwind/browser specifics for print */
                * { box-sizing: border-box; }
                svg { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>
                window.focus();
                setTimeout(() => {
                  window.print();
                }, 400);
              </script>
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [lastOrder]);

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (element && lastOrder) {
      const opt = {
        margin:       10,
        filename:     `Struk-${lastOrder.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: [58, 200] as [number, number], orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    // No auto-print. We show the modal when lastOrder is set.
    if (lastOrder) {
      setIsReceiptModalOpen(true);
    }
  }, [lastOrder]);

  const handleDigitalReceipt = useCallback((method: 'whatsapp' | 'email' | 'digital') => {
    playAccessHaptic?.(100);
    playVisualAlert?.('info', `Mengirim Struk via ${method}...`);
    // Simulation logic
    setTimeout(() => {
      playVisualAlert?.('success', `Struk berhasil dikirim ke ${method}!`);
    }, 1500);
  }, [playAccessHaptic, playVisualAlert]);

  const handleVoiceCommand = useCallback((command: { action: 'add' | 'remove' | 'clear'; productName: string; quantity: number }) => {
    const { action, productName, quantity } = command;
    
    if (action === 'clear') {
      setCart([]);
      speak?.("Keranjang telah dikosongkan");
      return;
    }

    const item = menu.find(i => i.name.toLowerCase().includes(productName.toLowerCase()));
    
    if (item) {
      if (action === 'add') {
        speak?.(`Menambahkan ${quantity} ${item.name}`);
        setCart(prev => {
          const existing = prev.find(i => i.menuItemId === item.id);
          if (existing) {
            return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + quantity } : i);
          }
          return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity }];
        });
      } else if (action === 'remove') {
        speak?.(`Menghapus ${item.name}`);
        setCart(prev => prev.filter(i => i.menuItemId !== item.id));
      }
    } else {
      speak?.(`Menu ${productName} tidak ditemukan`);
    }
  }, [menu, speak]);

  return (
    <div className="flex h-full gap-6 relative flex-col lg:flex-row" role="main">
      {/* Invisible Barcode Scanner Listener */}
      <input 
        type="text" 
        className="sr-only" 
        aria-hidden="true" 
        autoFocus 
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const code = (e.target as HTMLInputElement).value;
            if (code) {
              const item = menu.find(i => i.id === code || i.name.toLowerCase().includes(code.toLowerCase()));
              if (item) addToCart(item);
              (e.target as HTMLInputElement).value = '';
            }
          }
        }}
      />

      {/* Mobile Cart Toggle */}
      <button 
        onClick={() => setIsCartMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-orange-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 active:scale-95 transition-transform"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-orange-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-orange-500">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        <span className="font-black text-xs uppercase tracking-widest pr-2">Keranjang</span>
      </button>

      {/* Mobile Cart Overlay */}
      {isCartMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in"
          onClick={() => setIsCartMobileOpen(false)}
        />
      )}
      {/* Modern Receipt Choice Modal */}
      {isReceiptModalOpen && lastOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in transition-all">
          <div 
            className={cn(
              "rounded-[3rem] w-full max-w-lg shadow-[0_0_50px_rgba(34,197,94,0.15)] overflow-hidden animate-in zoom-in-95 border-4", 
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-green-500/10"
            )}
            role="alertdialog"
            aria-labelledby="success-title"
          >
            <div className="p-10 pb-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-green-500/30 mb-6 rotate-2 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 id="success-title" className={cn("text-3xl font-black uppercase tracking-tighter italic", isDarkMode ? "text-white" : "text-gray-900")}>
                Pembayaran Berhasil
              </h3>
              <p className={cn("text-sm font-bold mt-2 opacity-60 uppercase tracking-widest")}>Pesanan telah diproses</p>
            </div>

            <div className={cn("px-10 py-8 grid grid-cols-2 gap-y-6 gap-x-12 border-y", isDarkMode ? "border-zinc-800 bg-zinc-950/30" : "border-gray-50 bg-gray-50/50")}>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">ID Transaksi</p>
                <p className="text-sm font-bold font-mono">{lastOrder.id}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Kasir</p>
                <p className="text-sm font-bold">{lastOrder.cashier}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Tagihan</p>
                <p className="text-xl font-black text-green-500">{formatCurrency(lastOrder.total)}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Metode Bayar</p>
                <p className="text-sm font-black uppercase">{lastOrder.paymentMethod}</p>
              </div>
              <div className="col-span-2 pt-2 text-center">
                <p className="text-xs font-bold opacity-60">{new Date(lastOrder.date).toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handlePrint}
                  className="flex flex-col items-center justify-center gap-2 bg-orange-500 text-white p-5 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all group"
                  aria-label="Cetak Struk Printer"
                >
                  <Printer className="w-6 h-6 mb-1 group-hover:animate-bounce" />
                  Cetak Print
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-5 rounded-[2rem] border-2 font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all group",
                    isDarkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-gray-200 text-gray-900"
                  )}
                  aria-label="Download Struk PDF"
                >
                  <ArrowDownToLine className="w-6 h-6 mb-1 group-hover:translate-y-1 transition-transform" />
                  PDF File
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleDigitalReceipt('whatsapp')}
                  className={cn(
                    "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 font-bold text-[9px] uppercase tracking-widest hover:border-green-500 hover:text-green-500 transition-all active:scale-95",
                    isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-gray-100"
                  )}
                >
                  <Smartphone className="w-4 h-4" /> WhatsApp
                </button>
                <button 
                  onClick={() => handleDigitalReceipt('email')}
                  className={cn(
                    "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 font-bold text-[9px] uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all active:scale-95",
                    isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-gray-100"
                  )}
                >
                  <Receipt className="w-4 h-4" /> Email
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setLastOrder(null);
                }}
                className="w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:scale-[1.02] active:scale-95 transition-all text-sm"
              >
                Selesai / Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className={cn("rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95", isDarkMode ? "bg-zinc-900 border border-zinc-800" : "bg-white")}>
            <div className={cn("p-6 md:p-8 border-b flex justify-between items-center", isDarkMode ? "border-zinc-800" : "border-gray-100 bg-gray-50")}>
              <div>
                <h3 className={cn("text-sm font-black uppercase tracking-[0.2em]", isDarkMode ? "text-white" : "text-gray-900")}>Ringkasan Pembayaran</h3>
                <p className={cn("text-[10px] font-medium mt-1", isDarkMode ? "text-zinc-400" : "text-gray-500")}>Pastikan pesanan sudah sesuai</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-white text-gray-400")}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 smooth-scroll">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex justify-between text-xs">
                    <span className={cn("font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>{item.name} <span className="opacity-50">x{item.quantity}</span></span>
                    <span className={cn("font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className={cn("pt-4 border-t flex justify-between items-end", isDarkMode ? "border-zinc-800" : "border-gray-100")}>
                <span className={cn("text-[10px] font-bold uppercase tracking-[0.1em]", isDarkMode ? "text-zinc-500" : "text-gray-400")}>Total Tagihan</span>
                <span className={cn("text-2xl font-black", isDarkMode ? "text-white" : "text-gray-900")}>{formatCurrency(total)}</span>
              </div>

              {paymentMethod === 'cash' && (
                <div className={cn("space-y-4 pt-4 border-t", isDarkMode ? "border-zinc-800" : "border-gray-100")}>
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-gray-500")}>Uang Tunai Diterima</label>
                    <div className="relative">
                      <span className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold", isDarkMode ? "text-zinc-500" : "text-gray-400")}>Rp</span>
                      <input 
                        type="number" 
                        autoFocus
                        placeholder="0"
                        className={cn(
                          "w-full p-4 pl-12 rounded-2xl text-lg font-bold outline-none border transition-all",
                          isDarkMode ? "bg-zinc-800 border-zinc-700 text-white focus:border-orange-500 focus:bg-zinc-800/50" : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        )}
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <span className="text-[10px] font-bold text-orange-800 uppercase tracking-widest">Kembalian</span>
                    <span className="text-xl font-black text-orange-900">{formatCurrency(currentChange)}</span>
                  </div>
                </div>
              )}

              {['qris', 'ewallet'].includes(paymentMethod) && (
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-center space-y-4">
                  <div className="w-48 h-48 bg-white mx-auto flex items-center justify-center border border-blue-200 rounded-xl shadow-sm">
                    {/* Placeholder QR */}
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code" className="w-40 h-40 opacity-80" />
                  </div>
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Scan QR Untuk Bayar</p>
                </div>
              )}
            </div>

            <div className={cn("p-6 md:p-8 border-t", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-100")}>
              <button 
                onClick={handleFinalizeOrder}
                disabled={(paymentMethod === 'cash' && currentCashReceived < total) || cart.length === 0}
                className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                Bayar & Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Content */}
      <div className="hidden">
        {lastOrder && (
          <ReceiptPrint 
            ref={printRef} 
            order={lastOrder}
            shopName={shopName}
          />
        )}
      </div>

      {/* Main POS Product UI */}
      <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
        
        {/* Success Banner */}
        {lastOrder && (
          <div className={cn("p-5 rounded-3xl flex items-center justify-between mb-6 shadow-sm animate-in slide-in-from-top-4 shrink-0", isDarkMode ? "bg-green-950/30 border border-green-900" : "bg-green-50 border border-green-200")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Transaksi Berhasil</p>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px] font-bold", isDarkMode ? "text-green-500/70" : "text-green-600/70")}>ID: {lastOrder.id}</span>
                  <span className={cn("text-[10px] font-bold", isDarkMode ? "text-green-500/70" : "text-green-600/70")}>•</span>
                  <span className={cn("text-sm font-black", isDarkMode ? "text-green-400" : "text-green-800")}>{formatCurrency(lastOrder.total)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-white text-green-700 border border-green-200 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-50 transition-all shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Cetak (Re-print)
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-sm active:scale-95"
              >
                <ArrowDownToLine className="w-4 h-4" />
                PDF
              </button>
              <button 
                onClick={() => setLastOrder(null)}
                className={cn("p-2 rounded-xl transition-colors ml-2", isDarkMode ? "text-green-500 hover:bg-green-900/50" : "text-green-600 hover:bg-green-100")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Top bar with Search */}
        <div className="flex items-center justify-between mb-6 shrink-0 gap-4">
          <div className="relative max-w-md w-full">
            <input 
              type="text" 
              placeholder="Cari menu, kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white focus:border-orange-500" : "bg-white border-coffee-border text-coffee-dark focus:ring-2 focus:ring-coffee-dark"
              )}
            />
            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", isDarkMode ? "text-zinc-500" : "text-coffee-muted")} />
          </div>
          
          <VoiceOrderControl onCommand={handleVoiceCommand} isDarkMode={isDarkMode} />
        </div>

        {/* Product Grid */}
        <div ref={menuContainerRef} className="flex-1 overflow-y-auto smooth-scroll relative overscroll-none pr-2 pb-10">
          {displayedMenu.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 mt-20">
              <Search className="w-16 h-16" />
              <p className="font-medium">Produk tidak ditemukan</p>
            </div>
          ) : (
            <>
              <div className={cn(
                "grid gap-4",
                isTabletMode ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {displayedMenu.map(item => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onAdd={addToCart} 
                    isDarkMode={isDarkMode} 
                  />
                ))}
              </div>
              {filteredMenu.length > displayedMenu.length && (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={cn(
        "rounded-3xl shadow-sm flex flex-col overflow-hidden shrink-0 border z-50",
        "fixed inset-y-4 right-4 w-[calc(100%-32px)] sm:w-96 transition-transform lg:static lg:w-96 lg:translate-x-0 lg:shadow-none lg:inset-auto",
        isCartMobileOpen ? "translate-x-0" : "translate-x-[calc(100%+32px)]",
        isTabletMode && "lg:w-[400px]",
        isDarkMode ? "bg-zinc-950 border-zinc-900" : "bg-white border-coffee-border"
      )}>
        <div className={cn("p-6 border-b flex items-center justify-between", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-100")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg text-white">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", isDarkMode ? "text-white" : "text-gray-900")}>Pesanan Saat Ini</h2>
              <p className={cn("text-[10px] font-medium block mt-0.5", isDarkMode ? "text-zinc-500" : "text-gray-500")}>{cart.length} Item dalam keranjang</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button onClick={() => { playVibrate?.(); setCart([]); }} className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors">Kosongkan</button>
            )}
            <button onClick={() => setIsCartMobileOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 smooth-scroll">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
              <Receipt className="w-16 h-16" />
              <p className="text-xs font-medium">Belum ada pesanan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.menuItemId} className={cn("flex flex-col gap-3 group rounded-2xl p-4 transition-all border", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 hover:border-gray-200")}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className={cn("font-black leading-tight text-sm", isDarkMode ? "text-white" : "text-gray-900")}>{item.name}</p>
                    <p className={cn("font-bold mt-1 uppercase tracking-wider text-[10px]", isDarkMode ? "text-zinc-400" : "text-gray-500")}>{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-1 py-1 shadow-sm shrink-0">
                    <button onClick={() => updateQuantity(item.menuItemId, -1)} className={cn("p-1.5 rounded-lg transition-colors hover:bg-white dark:hover:bg-zinc-800", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className={cn("font-black text-center text-sm w-8", isDarkMode ? "text-white" : "text-gray-900")}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItemId, 1)} className={cn("p-1.5 rounded-lg transition-colors hover:bg-white dark:hover:bg-zinc-800", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <button 
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                  >
                    <X className="w-3.5 h-3.5" /> Hapus
                  </button>
                  <p className={cn("font-black text-sm", isDarkMode ? "text-white" : "text-orange-600")}>{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={cn("p-6 border-t space-y-5", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-100")}>
          
          {/* Quick Controls: Tax & Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className={cn("p-3 rounded-2xl border transition-all flex flex-col gap-2", isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200")}>
              <label className={cn("text-[9px] font-black uppercase tracking-widest flex items-center justify-between", isDarkMode ? "text-zinc-500" : "text-gray-500")}>
                Pajak (PB1)
              </label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shrink-0">
                <button 
                  onClick={() => setTaxRate(0)}
                  className={cn("flex-1 py-1.5 text-xs font-bold transition-all", taxRate === 0 ? "bg-orange-500 text-white" : "bg-transparent text-gray-500 dark:text-zinc-500")}
                >0%</button>
                <button 
                  onClick={() => setTaxRate(0.11)}
                  className={cn("flex-1 py-1.5 text-xs font-bold transition-all border-l border-gray-200 dark:border-zinc-800", taxRate > 0 ? "bg-orange-500 text-white" : "bg-transparent text-gray-500 dark:text-zinc-500")}
                >11%</button>
              </div>
            </div>
            
            <div className={cn("p-3 rounded-2xl border transition-all flex flex-col gap-2", isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200")}>
              <label className={cn("text-[9px] font-black uppercase tracking-widest flex items-center justify-between", isDarkMode ? "text-zinc-500" : "text-gray-500")}>
                Diskon
                <Percent className="w-3 h-3" />
              </label>
              <div className="relative">
                <span className={cn("absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold", isDarkMode ? "text-zinc-600" : "text-gray-400")}>Rp</span>
                <input 
                  type="number" 
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                  className={cn("w-full py-1.5 pl-7 pr-3 rounded-xl border text-xs font-bold outline-none", isDarkMode ? "bg-zinc-900 border-zinc-800 text-white focus:border-orange-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className={isDarkMode ? "text-zinc-400" : "text-gray-500"}>Subtotal</span>
              <span className={cn("font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>{formatCurrency(subTotal)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className={isDarkMode ? "text-zinc-400" : "text-gray-500"}>Pajak (11%)</span>
                <span className={cn("font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>+{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {discountVal > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className={isDarkMode ? "text-zinc-400" : "text-gray-500"}>Diskon</span>
                <span className={cn("font-medium text-orange-500")}>-{formatCurrency(discountVal)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-gray-200 dark:border-zinc-800 border-dashed">
              <span className={cn("font-bold uppercase tracking-[0.1em]", isDarkMode ? "text-zinc-400" : "text-gray-500", isTabletMode ? "text-xs" : "text-[10px]")}>Total Pembayaran</span>
              <span className={cn("font-black tracking-tighter", isDarkMode ? "text-white" : "text-gray-900", isTabletMode ? "text-3xl" : "text-2xl")}>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash', icon: Banknote, label: 'Tunai' },
              { id: 'qris', icon: CreditCard, label: 'QRIS' },
              { id: 'ewallet', icon: Smartphone, label: 'E-Wallet' },
              { id: 'transfer', icon: Wallet, label: 'Transfer' },
            ].map((method) => (
              <button 
                key={method.id}
                onClick={() => {
                  setPaymentMethod(method.id as any);
                  playVibrate?.();
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all active:scale-95",
                  paymentMethod === method.id 
                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20" 
                    : isDarkMode 
                      ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white" 
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900"
                )}
              >
                <method.icon className="w-5 h-5" />
                <span className="font-bold text-[8px] uppercase tracking-wider">{method.label}</span>
              </button>
            ))}
          </div>

          <button
            disabled={cart.length === 0}
            onClick={handleStartPayment}
            className={cn(
              "group w-full bg-orange-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:translate-y-0 flex items-center justify-center gap-3",
              isTabletMode ? "py-6 text-sm" : "py-5 text-xs"
            )}
          >
            <CheckCircle2 className="w-5 h-5" />
            Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
