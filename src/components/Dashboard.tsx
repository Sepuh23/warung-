import React, { useMemo } from 'react';
import { 
  Coffee, 
  DollarSign, 
  ShoppingBag, 
  CloudRain, 
  Sun,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  Target,
  TrendingDown,
  TrendingUp,
  Box,
  CheckCircle2,
  Sparkles,
  TrendingUp as TrendingUpIcon,
  Volume2,
  ArrowRight,
  Lightbulb,
  PieChart,
  Calendar,
  Clock,
  ArrowDownToLine,
  ChevronRight,
  Bot
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { SalesData, ShopInfo, MenuItem } from '@/src/types';

interface DashboardProps {
  sales: SalesData;
  shop: ShopInfo;
  weather: any;
  isDarkMode?: boolean;
  inventory: any[];
  onNavigate: (tab: 'chat' | 'inventory' | 'pos' | 'menu' | 'reports' | 'customers' | 'settings') => void;
  isTabletMode?: boolean;
  speak?: (text: string) => void;
  playVibrate?: () => void;
  aiMessage?: string;
  menu: MenuItem[];
}

export default function Dashboard({ 
  sales, 
  shop, 
  weather, 
  isDarkMode = false, 
  inventory, 
  onNavigate, 
  isTabletMode, 
  speak, 
  playVibrate,
  aiMessage,
  menu
}: DashboardProps) {
  const isUp = sales.revenueChange >= 0;
  const lowStockItems = inventory.filter(i => (i.stock || 0) < 5);
  
  // Mock data for AI analysis
  const estimatedProfit = useMemo(() => sales.revenue * 0.35, [sales.revenue]);
  
  const topProduct = useMemo(() => {
    if (!menu.length) return null;
    return menu.reduce((prev, current) => {
      return (prev.stock || 0) < (current.stock || 0) ? prev : current;
    }, menu[0]);
  }, [menu]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item: any = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30
      }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20 px-4 sm:px-6 lg:px-8"
    >
      {/* AI HERO ASSISTANT - Futuristic Glassmorphism */}
      <motion.div 
        variants={item}
        className={cn(
          "relative p-6 sm:p-8 rounded-[3rem] border-4 overflow-hidden group shadow-2xl transition-all duration-500",
          isDarkMode 
            ? "bg-zinc-900/60 border-orange-500/20 shadow-orange-500/5 hover:border-orange-500/40" 
            : "bg-white/80 border-orange-500/10 shadow-orange-500/10 hover:border-orange-500/20"
        )}
      >
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 sm:gap-8 items-start lg:items-center">
          <div className="relative shrink-0 mx-auto lg:mx-0">
             <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-[2.2rem] flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                <Bot className="w-10 h-10 text-white" />
             </div>
             <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
             </div>
          </div>

          <div className="flex-1 space-y-2 text-center lg:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <h2 className={cn("text-2xl sm:text-3xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-zinc-900")}>
                 Halo, {shop.ownerName}! 👋
              </h2>
              <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-orange-500/20">
                 AI Assistant Active
              </span>
            </div>
            <div className={cn(
              "text-base sm:text-lg font-bold leading-relaxed max-w-4xl",
              isDarkMode ? "text-zinc-300" : "text-zinc-600"
            )}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={aiMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {aiMessage || "Toko kamu hari ini menghasilkan penjualan " + formatCurrency(sales.revenue) + " dengan estimasi keuntungan " + formatCurrency(estimatedProfit) + "."}
                </motion.p>
              </AnimatePresence>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-6 justify-center lg:justify-start">
              <SuggestionChip label="Analisa Stok" onClick={() => onNavigate('inventory')} />
              <SuggestionChip label="Tips Promosi" onClick={() => onNavigate('chat')} />
              <SuggestionChip label="Tanya AI" onClick={() => onNavigate('chat')} />
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto flex flex-col items-center gap-2">
             <button 
               onClick={() => {
                 playVibrate?.();
                 speak?.(aiMessage || "");
               }}
               className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 hover:scale-110 active:scale-95 transition-all"
               aria-label="Listen to AI Insight"
             >
                <Volume2 className="w-7 h-7" />
             </button>
             <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Audio AI</p>
          </div>
        </div>
      </motion.div>

      {/* STATS TILES - Modern Card Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernStatCard 
          title="Omzet Hari Ini"
          value={formatCurrency(sales.revenue)}
          change={sales.revenueChange}
          isUp={isUp}
          icon={<DollarSign />}
          isDarkMode={isDarkMode}
          color="orange"
        />
        <ModernStatCard 
          title="Estimasi Profit"
          value={formatCurrency(estimatedProfit)}
          change={8}
          isUp={true}
          icon={<TrendingUp />}
          isDarkMode={isDarkMode}
          color="green"
        />
        <ModernStatCard 
          title="Produk Terjual"
          value={sales.itemsSold.toString()}
          change={15}
          isUp={true}
          icon={<ShoppingBag />}
          isDarkMode={isDarkMode}
          color="blue"
        />
         <ModernStatCard 
          title="Kondisi Cuaca"
          value={weather.condition}
          subValue={`${weather.temp}°C`}
          icon={weather.condition.includes('Hujan') ? <CloudRain /> : <Sun />}
          isDarkMode={isDarkMode}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CENTER COLUMN: ANALYTICS & SUMMARY */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Chart Card */}
          <motion.div 
            variants={item}
            className={cn(
              "p-6 sm:p-8 rounded-[3rem] border-4 shadow-xl",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
            )}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div>
                <h3 className={cn("text-xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>Performa Penjualan</h3>
                <p className="text-[10px] font-black text-zinc-400 capitalize tracking-[0.1em] mt-1">Real-time Analytics System</p>
              </div>
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                 <button className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">Harian</button>
                 <button className="px-5 py-2.5 rounded-xl text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Mingguan</button>
              </div>
            </div>

            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales.weeklySales}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="10 10" vertical={false} stroke={isDarkMode ? "#27272a" : "#f1f5f9"} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: isDarkMode ? '#52525b' : '#94a3b8'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: isDarkMode ? '#52525b' : '#94a3b8'}} 
                    tickFormatter={(v) => `Rp${v/1000}k`} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                      padding: '20px',
                      backgroundColor: isDarkMode ? '#18181b' : '#fff',
                      color: isDarkMode ? '#fff' : '#000'
                    }}
                    cursor={{ stroke: '#F97316', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#F97316" 
                    strokeWidth={5} 
                    fill="url(#chartGradient)" 
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* AI Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Strategy Card */}
             <InsightCard 
                title="Tips Promosi" 
                icon={<Lightbulb />}
                color="orange"
                isDarkMode={isDarkMode}
                delay={0.2}
              >
                <div className="space-y-4">
                  <div className="p-5 bg-orange-500/5 rounded-[2rem] border border-orange-500/10">
                    <p className="text-[11px] font-black text-orange-500 uppercase mb-2 flex items-center gap-2">
                       <Zap className="w-3 h-3" /> Ide Hari Ini
                    </p>
                    <p className={cn("text-sm font-medium leading-relaxed", isDarkMode ? "text-zinc-300" : "text-zinc-600")}>
                       Buat paket bundling <span className="font-black text-orange-500">"{sales.topSellingToday || 'Produk Unggulan'}"</span> dengan camilan. 
                       Beri diskon <span className="font-black">10%</span> untuk pembelian di jam sibuk.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                     <Clock className="w-4 h-4" /> Waktu Terbaik: 15:00 - 17:00
                  </div>
                </div>
             </InsightCard>

             {/* Stock Prediction Card */}
             <InsightCard 
                title="Analisa Stok" 
                icon={<PieChart />}
                color="blue"
                isDarkMode={isDarkMode}
                delay={0.3}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn("text-xs font-black", isDarkMode ? "text-white" : "text-zinc-900")}>{lowStockItems.length} Item Menipis</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">Perlu Restock Segera</p>
                    </div>
                    <button 
                      onClick={() => onNavigate('inventory')} 
                      className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                           <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
                             <span>{item.name}</span>
                             <span>{item.stock} {item.unit}</span>
                           </div>
                           <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max((item.stock / (item.threshold || 10)) * 100, 5)}%` }}
                                className={cn("h-full", idx === 0 ? "bg-red-500" : "bg-blue-500")}
                              />
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                         <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-20" />
                         <p className="text-[10px] font-black text-zinc-400 uppercase">Stok Terkendali</p>
                      </div>
                    )}
                  </div>
                </div>
             </InsightCard>
          </div>
        </div>

        {/* RIGHT COLUMN: RECAP & TRENDS */}
        <div className="lg:col-span-4 space-y-8">
           {/* Ringkasan Harian Card */}
           <motion.div 
            variants={item}
            className={cn(
              "p-8 rounded-[3rem] border-4 shadow-xl flex flex-col h-full relative overflow-hidden",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-[40px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className={cn("text-lg font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>Ringkasan</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            </div>

            <div className="flex-1 space-y-7">
              <SummaryItem label="Total Penjualan" value={formatCurrency(sales.revenue)} icon={<DollarSign />} color="orange" />
              <SummaryItem label="Estimasi Untung" value={formatCurrency(estimatedProfit)} icon={<TrendingUp />} color="green" />
              <SummaryItem label="Jumlah Transaksi" value={sales.transactions.toString()} icon={<ShoppingBag />} color="blue" />
              <SummaryItem label="Menu Terlaris" value={sales.topSellingToday || 'N/A'} icon={<Zap />} color="yellow" />
            </div>

             <div className={cn(
               "mt-12 p-6 rounded-[2.5rem] border-2 border-dashed relative",
               isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
             )}>
               <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">AI Prediction</p>
               </div>
               <p className={cn("text-xs font-bold leading-relaxed", isDarkMode ? "text-zinc-300" : "text-zinc-600")}>
                  Berdasarkan data hari ini, diprediksi besok akan ada kenaikan <span className="text-green-500 font-black">+12%</span> karena hari libur nasional dan cuaca cerah.
               </p>
             </div>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Reusable Components inside Dashboard

function SuggestionChip({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-white/10 hover:bg-white/20 dark:bg-zinc-800 dark:hover:bg-zinc-700 backdrop-blur-md border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
    >
      {label}
    </button>
  );
}

function ModernStatCard({ title, value, subValue, change, isUp, icon, isDarkMode, color }: any) {
  const colors: any = {
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    sky: "text-sky-500 bg-sky-500/10 border-sky-500/20"
  };

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className={cn(
        "p-6 rounded-[2.5rem] border-4 transition-all shadow-lg relative overflow-hidden group",
        isDarkMode ? "bg-zinc-900 border-zinc-800/80" : "bg-white border-zinc-50"
      )}
    >
       <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
       
       <div className="flex justify-between items-start mb-6 relative z-10">
          <div className={cn("w-14 h-14 rounded-[1.4rem] flex items-center justify-center transition-transform group-hover:rotate-12", colors[color])}>
            {React.cloneElement(icon, { className: "w-7 h-7" })}
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-xl shadow-sm",
              isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change}%
            </div>
          )}
       </div>
       <div className="relative z-10">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-1.5">{title}</p>
          <div className="flex items-baseline gap-2">
            <h4 className={cn("text-2xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-zinc-900")}>{value}</h4>
            {subValue && <span className="text-xs font-bold text-zinc-400">{subValue}</span>}
          </div>
       </div>
    </motion.div>
  );
}

function InsightCard({ title, icon, children, color, isDarkMode, delay = 0 }: any) {
  const accentColor = color === 'orange' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "p-8 rounded-[3rem] border-4 shadow-xl relative group overflow-hidden",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
      )}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-zinc-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-orange-500/5 transition-colors" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", accentColor)}>
          {React.cloneElement(icon, { className: "w-6 h-6" })}
        </div>
        <h3 className={cn("text-lg font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>{title}</h3>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

function SummaryItem({ label, value, icon, color }: any) {
  const colors: any = {
    orange: "bg-orange-500/10 text-orange-500",
    green: "bg-green-500/10 text-green-500",
    blue: "bg-blue-500/10 text-blue-500",
    yellow: "bg-yellow-500/10 text-yellow-500"
  };

  return (
    <div className="flex items-center gap-4 group cursor-default">
      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm", colors[color])}>
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest truncate mb-0.5">{label}</p>
        <p className="text-sm font-black truncate">{value}</p>
      </div>
    </div>
  );
}
