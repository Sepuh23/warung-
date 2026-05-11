import React, { useRef, useState } from 'react';
import { 
  ShoppingBag, 
  Check, 
  X, 
  Clock, 
  Table, 
  User, 
  CreditCard,
  ChevronRight,
  MessageCircle,
  MoreVertical,
  Printer,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { CustomerOrder } from '@/src/types';
import { ReceiptPrint } from './ReceiptPrint';

interface IncomingOrdersManagerProps {
  orders: CustomerOrder[];
  onUpdateStatus: (orderId: string, status: CustomerOrder['status'], queueNumber?: string) => void;
  isDarkMode?: boolean;
}

export default function IncomingOrdersManager({ 
  orders, 
  onUpdateStatus, 
  isDarkMode = false 
}: IncomingOrdersManagerProps) {
  const [printingOrder, setPrintingOrder] = useState<CustomerOrder | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => ['confirmed', 'processing', 'ready'].includes(o.status));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'processing': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'ready': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const handlePrint = (order: CustomerOrder) => {
    setPrintingOrder(order);
    // Wait for the ref to be available
    setTimeout(() => {
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
                <title>Cetak Struk - ${order.id}</title>
                <style>
                  @page { margin: 0; size: 58mm auto; }
                  body { margin: 0; padding: 10px; background: #fff; }
                  * { box-sizing: border-box; }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
                <script>
                  window.focus();
                  setTimeout(() => {
                    window.print();
                    window.parent.postMessage('print-done', '*');
                  }, 400);
                </script>
              </body>
            </html>
          `);
          doc.close();
        }
      }
    }, 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Hidden Print Content */}
      <div className="hidden">
        {printingOrder && (
          <ReceiptPrint 
            ref={printRef} 
            order={{
              ...printingOrder,
              date: new Date(printingOrder.createdAt),
              taxAmount: 0,
              discountAmount: 0,
              subTotal: printingOrder.total,
              paymentMethod: printingOrder.paymentMethod
            }}
            shopName="WARUNG+"
          />
        )}
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h2 className={cn("text-2xl font-black uppercase tracking-tight", isDarkMode ? "text-white" : "text-coffee-dark")}>Incoming Orders</h2>
          <p className="text-xs text-coffee-muted font-bold mt-1 uppercase tracking-widest">Verify and process customer orders</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {pendingOrders.length} Pending
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Verification */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2">Menunggu Konfirmasi</h3>
          <div className="space-y-4">
             {pendingOrders.map(order => (
               <motion.div 
                 key={order.id}
                 layout
                 className={cn(
                   "p-6 rounded-[2rem] border shadow-sm transition-all relative overflow-hidden group",
                   isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
                 )}
               >
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                           <User className="w-5 h-5" />
                        </div>
                        <div>
                           <h4 className="text-sm font-black">{order.customerName}</h4>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-black uppercase text-zinc-400">{order.contactInfo}</span>
                              <span className="text-zinc-300">•</span>
                              <Table className="w-3 h-3 text-zinc-400" />
                              <span className="text-[10px] font-black uppercase text-zinc-400">{order.tableNumber}</span>
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-lg font-black tracking-tighter text-orange-500">Rp {order.total.toLocaleString()}</p>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{order.paymentMethod}</p>
                     </div>
                  </div>

                  <div className="space-y-2 mb-6">
                     {order.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center text-xs font-bold bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg">
                          <span>{item.name} <span className="text-zinc-400">x{item.quantity}</span></span>
                          <span>Rp {(item.price * item.quantity).toLocaleString()}</span>
                       </div>
                     ))}
                     {order.note && (
                       <p className="text-[10px] italic text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg mt-2">
                          Note: {order.note}
                       </p>
                     )}
                  </div>

                  <div className="flex gap-2">
                     <button 
                       onClick={() => onUpdateStatus(order.id, 'confirmed')}
                       className="flex-[2] py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                     >
                        <Check className="w-4 h-4" />
                        Terima Pesanan
                     </button>
                     <button 
                       onClick={() => onUpdateStatus(order.id, 'rejected')}
                       className="flex-1 py-3 border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                     >
                        <X className="w-4 h-4" />
                        Tolak
                     </button>
                  </div>
               </motion.div>
             ))}
             {pendingOrders.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem] opacity-30">
                   <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada pesanan masuk</p>
                </div>
             )}
          </div>
        </section>

        {/* Active Orders Status */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2">Pesanan Aktif</h3>
          <div className="space-y-4">
             {activeOrders.map(order => (
               <motion.div 
                 key={order.id}
                 layout
                 className={cn(
                   "p-4 rounded-3xl border shadow-sm flex items-center gap-4 group",
                   isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-50"
                 )}
               >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 border-2",
                    order.status === 'ready' ? "bg-green-500 text-white border-green-400" : "bg-zinc-100 dark:bg-zinc-800 border-transparent"
                  )}>
                     {order.queueNumber || "..."}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                     <h4 className="text-xs font-black truncate">{order.customerName}</h4>
                     <p className={cn(
                       "text-[8px] font-black uppercase tracking-widest mt-0.5 inline-block px-2 py-0.5 rounded-full border",
                       getStatusBadge(order.status)
                     )}>
                        {order.status}
                     </p>
                  </div>

                  <div className="flex items-center gap-2">
                     <button 
                        onClick={() => handlePrint(order)}
                        className="p-2 text-zinc-400 hover:text-orange-500 transition-colors"
                        title="Cetak Struk"
                     >
                        <Printer className="w-4 h-4" />
                     </button>
                     {order.status === 'confirmed' && (
                        <button 
                           onClick={() => onUpdateStatus(order.id, 'processing')}
                           className="p-2 bg-orange-500 text-white rounded-lg shadow-lg shadow-orange-500/20 active:scale-90 transition-all"
                        >
                           <ChevronRight className="w-4 h-4" />
                        </button>
                     )}
                     {order.status === 'processing' && (
                        <button 
                           onClick={() => onUpdateStatus(order.id, 'ready')}
                           className="px-4 py-2 bg-green-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-90 transition-all"
                        >
                           Selesai
                        </button>
                     )}
                     {order.status === 'ready' && (
                        <button 
                           onClick={() => onUpdateStatus(order.id, 'completed')}
                           className="p-2 bg-zinc-900 text-white rounded-lg active:scale-90 transition-all"
                        >
                           <Check className="w-4 h-4" />
                        </button>
                     )}
                  </div>
               </motion.div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}
