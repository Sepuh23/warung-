import React from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Timer, 
  Bell, 
  Trash2, 
  Monitor, 
  Smartphone,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { QueueItem, WaiterCall } from '@/src/types';

interface QueueManagerProps {
  queue: QueueItem[];
  waiterCalls: WaiterCall[];
  onUpdateQueueStatus: (id: string, status: QueueItem['status']) => void;
  onResolveWaiterCall: (id: string) => void;
  isDarkMode?: boolean;
}

export default function QueueManager({ 
  queue, 
  waiterCalls, 
  onUpdateQueueStatus, 
  onResolveWaiterCall,
  isDarkMode = false
}: QueueManagerProps) {
  const pendingQueue = queue.filter(q => q.status === 'waiting');
  const preparingQueue = queue.filter(q => q.status === 'processing');
  const readyQueue = queue.filter(q => q.status === 'ready');
  const activeWaiterCalls = waiterCalls.filter(c => c.status === 'pending');

  return (
    <div className="flex flex-col h-full gap-8 p-4 sm:p-8 overflow-y-auto smooth-scroll">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-orange-500" />} 
          label="Total Antrian" 
          value={queue.length.toString()} 
          color="orange"
          isDarkMode={isDarkMode}
        />
        <StatCard 
          icon={<Timer className="text-blue-500" />} 
          label="Est. Tunggu" 
          value={`${pendingQueue.length * 5} Min`} 
          color="blue"
          isDarkMode={isDarkMode}
        />
        <StatCard 
          icon={<Bell className="text-red-500" />} 
          label="Panggilan Meja" 
          value={activeWaiterCalls.length.toString()} 
          color="red"
          isDarkMode={isDarkMode}
        />
        <button 
          onClick={() => window.open('/public-queue', '_blank')}
          className={cn(
            "p-6 rounded-[2.5rem] border-4 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 group shadow-2xl",
            isDarkMode ? "bg-zinc-900 border-zinc-800 hover:border-orange-500/50" : "bg-white border-zinc-100 hover:border-orange-500/50"
          )}
        >
          <Monitor className="w-8 h-8 text-orange-500 group-hover:animate-bounce" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Buka Layar TV</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Waiter Calls Section */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn("text-xl font-black tracking-tighter flex items-center gap-3", isDarkMode ? "text-white" : "text-zinc-900")}>
               <Bell className="w-6 h-6 text-red-500 animate-ring" />
               Panggilan Pelayan
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
             <AnimatePresence>
                {activeWaiterCalls.length === 0 ? (
                  <div className="col-span-full py-8 text-center opacity-30">
                     <p className="text-xs font-black uppercase tracking-widest">Tidak ada panggilan aktif</p>
                  </div>
                ) : (
                  activeWaiterCalls.map(call => (
                    <motion.button
                      key={call.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => onResolveWaiterCall(call.id)}
                      className="bg-red-500 text-white p-6 rounded-[2rem] shadow-xl shadow-red-500/20 flex flex-col items-center gap-2 hover:scale-110 transition-all group relative overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Meja</span>
                       <span className="text-3xl font-black">{call.tableNumber}</span>
                       <CheckCircle2 className="w-5 h-5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* Pending Queue */}
        <div className="space-y-6">
           <SectionHeader title="Menunggu" count={pendingQueue.length} color="zinc" isDarkMode={isDarkMode} />
           <div className="space-y-4">
              {pendingQueue.map(item => (
                <QueueCard 
                  key={item.id} 
                  item={item} 
                  isDarkMode={isDarkMode}
                  onNext={() => onUpdateQueueStatus(item.id, 'processing')}
                />
              ))}
           </div>
        </div>

        {/* Preparing Queue */}
        <div className="space-y-6">
           <SectionHeader title="Dibuat" count={preparingQueue.length} color="orange" isDarkMode={isDarkMode} />
           <div className="space-y-4">
              {preparingQueue.map(item => (
                <QueueCard 
                  key={item.id} 
                  item={item} 
                  isDarkMode={isDarkMode}
                  onNext={() => onUpdateQueueStatus(item.id, 'ready')}
                />
              ))}
           </div>
        </div>

        {/* Ready Queue */}
        <div className="space-y-6">
           <SectionHeader title="Selesai" count={readyQueue.length} color="green" isDarkMode={isDarkMode} />
           <div className="space-y-4">
              {readyQueue.map(item => (
                <QueueCard 
                  key={item.id} 
                  item={item} 
                  isDarkMode={isDarkMode}
                  onNext={() => onUpdateQueueStatus(item.id, 'waiting')} // Recyle or mark as picked up
                  isReady
                />
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, isDarkMode }: any) {
  const colors: any = {
    orange: "border-orange-500/10 bg-orange-500/5",
    blue: "border-blue-500/10 bg-blue-500/5",
    red: "border-red-500/10 bg-red-500/5",
  };

  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border-4 transition-all shadow-2xl relative overflow-hidden group",
      isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100",
      colors[color]
    )}>
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-xl flex items-center justify-center transition-transform group-hover:scale-110">
           {React.cloneElement(icon, { className: "w-7 h-7" })}
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className={cn("text-2xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-zinc-900")}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, color, isDarkMode }: any) {
  const colors: any = {
    zinc: "bg-zinc-500",
    orange: "bg-orange-500",
    green: "bg-emerald-500",
  };

  return (
    <div className="flex items-center justify-between px-2">
       <div className="flex items-center gap-4">
          <div className={cn("w-3 h-3 rounded-full animate-pulse", colors[color])} />
          <h3 className={cn("text-sm font-black uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
            {title}
          </h3>
       </div>
       <span className={cn(
         "px-3 py-1 rounded-full text-[10px] font-black",
         isDarkMode ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-600"
       )}>
         {count}
       </span>
    </div>
  );
}

function QueueCard({ item, isDarkMode, onNext, isReady }: any) {
  return (
    <motion.div
      layout
      className={cn(
        "p-6 rounded-[2rem] border-4 shadow-xl transition-all relative overflow-hidden group",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
      )}
    >
       <div className="flex justify-between items-start mb-4">
          <div>
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Nomor Antrian</p>
             <h4 className={cn("text-3xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-zinc-900")}>
                #{item.queueNumber}
             </h4>
          </div>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isReady ? "bg-green-500 text-white" : "bg-orange-500/10 text-orange-500"
          )}>
             {isReady ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
       </div>

       <div className="space-y-1 mb-6">
          <p className={cn("text-xs font-bold truncate", isDarkMode ? "text-zinc-300" : "text-zinc-600")}>
             {item.customerName}
          </p>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">
             Total: {item.itemsCount} Item • {item.estimatedWaitTime} Menit
          </p>
       </div>

       <button 
         onClick={onNext}
         className={cn(
           "w-full py-4 rounded-2xl flex items-center justify-center gap-2 group transition-all",
           isReady 
             ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-200" 
             : "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-105"
         )}
       >
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isReady ? "Tandai Diambil" : item.status === 'waiting' ? "Mulai Proses" : "Selesai & Panggil"}
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
       </button>
    </motion.div>
  );
}
