import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  User, 
  Phone, 
  MoreVertical, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageSquare,
  Check,
  CheckCheck,
  ArrowLeft,
  Smartphone,
  Plus,
  Image as ImageIcon,
  FileText,
  ShoppingBag,
  ExternalLink,
  UserPlus,
  Bot,
  Zap,
  MessageCircle,
  Sticker
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { CustomerChat as CustomerChatType, CustomerMessage } from '@/src/types';

interface CustomerChatProps {
  chats: CustomerChatType[];
  messages: CustomerMessage[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onSendMessage: (chatId: string, content: string) => void;
  onToggleAIChat?: (chatId: string) => void;
  isAIEnabled?: boolean;
  isDarkMode?: boolean;
}

export default function CustomerChat({ 
  chats, 
  messages, 
  activeChatId, 
  onSelectChat, 
  onSendMessage,
  onToggleAIChat,
  isAIEnabled = false,
  isDarkMode = false
}: CustomerChatProps) {
  const [input, setInput] = useState('');
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const filteredChats = chats.filter(c => 
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChatId) return;
    onSendMessage(activeChatId, input);
    setInput('');
  };

  const handleWhatsApp = (phone?: string) => {
    const number = phone || "628123456789"; // Fallback
    window.open(`https://wa.me/${number}`, '_blank');
  };

  return (
    <div className="flex h-full gap-4 relative pb-4 px-2 sm:px-4">
      {/* Chat List Sidebar */}
      <div className={cn(
        "w-full lg:w-96 shrink-0 rounded-3xl border overflow-hidden flex flex-col shadow-xl transition-all duration-500",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100",
        !isMobileListVisible && activeChatId ? "hidden lg:flex" : "flex"
      )}>
        <div className={cn(
          "p-6 border-b transition-colors",
          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-100"
        )}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={cn("text-lg font-black tracking-tighter flex items-center gap-2", isDarkMode ? "text-white" : "text-zinc-900")}>
                <MessageCircle className="w-5 h-5 text-emerald-500" />
                WhatsApp Inbox
              </h2>
              <p className="text-[9px] font-black text-zinc-400 opacity-60 uppercase tracking-widest mt-1">Real-time AI Assistant</p>
            </div>
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Cari chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full rounded-xl py-3 pl-12 pr-4 text-xs font-bold transition-all outline-none border",
                isDarkMode 
                  ? "bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500/50" 
                  : "bg-white border-zinc-200 text-zinc-900 focus:border-emerald-500/50"
              )}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto smooth-scroll py-2 px-2">
          <AnimatePresence initial={false}>
            {filteredChats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">Inbox Kosong</p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <motion.button 
                  key={chat.id}
                  layout
                  onClick={() => {
                    onSelectChat(chat.id);
                    setIsMobileListVisible(false);
                  }}
                  className={cn(
                    "w-full p-4 flex gap-4 transition-all relative group rounded-2xl mb-1",
                    activeChatId === chat.id 
                      ? (isDarkMode ? "bg-zinc-800" : "bg-emerald-50/50") 
                      : (isDarkMode ? "hover:bg-zinc-800/50" : "hover:bg-zinc-50")
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110",
                      isDarkMode ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"
                    )}>
                      <User className="w-6 h-6 text-zinc-400" />
                    </div>
                    {/* Status Dot */}
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 bg-emerald-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className={cn("text-xs font-black truncate", isDarkMode ? "text-white" : "text-zinc-900")}>
                        {chat.customerName}
                      </h3>
                      <span className="text-[9px] font-black text-zinc-400">
                        {chat.lastTimestamp.toLocaleTimeString('id-id', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-400 mt-0.5 truncate leading-tight group-hover:text-zinc-300 transition-colors">
                      {chat.lastMessage}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-tighter flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" /> WhatsApp Business
                       </span>
                       {chat.unreadCount > 0 && (
                        <span className="bg-emerald-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-emerald-500/20">
                          {chat.unreadCount}
                        </span>
                       )}
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 rounded-3xl border overflow-hidden flex flex-col shadow-xl transition-all duration-500",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100",
        isMobileListVisible && "hidden lg:flex"
      )}>
        {activeChat ? (
          <>
            <div className={cn(
              "p-4 sm:p-6 border-b transition-colors flex justify-between items-center relative z-10",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-100"
            )}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMobileListVisible(true)}
                  className="lg:hidden p-2 -ml-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border transition-transform",
                    isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
                  )}>
                    <User className={cn("w-6 h-6 text-zinc-400")} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 bg-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h3 className={cn("text-sm sm:text-base font-black truncate tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>
                    {activeChat.customerName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                     <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Customer Active</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                 {/* AI Toggle Button */}
                 <button 
                    onClick={() => onToggleAIChat?.(activeChatId)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      isAIEnabled 
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                        : isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                    )}
                 >
                    <Bot className={cn("w-4 h-4", isAIEnabled && "animate-pulse")} />
                    AI Auto-Reply
                 </button>
                 <button 
                    onClick={() => handleWhatsApp()}
                    className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all"
                    title="Open in WhatsApp"
                 >
                    <Smartphone className="w-5 h-5" />
                 </button>
                 <button className={cn(
                   "p-3 rounded-xl transition-all hover:scale-110 border",
                   isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-100 text-zinc-400"
                 )}>
                    <MoreVertical className="w-5 h-5" />
                 </button>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className={cn(
                "flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 smooth-scroll relative overscroll-none",
                isDarkMode ? "bg-zinc-950/20" : "bg-zinc-50/30"
              )}
            >
              <div className="flex justify-center mb-6">
                <span className={cn(
                  "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm border flex items-center gap-2",
                  isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-100 text-zinc-500"
                )}>
                  <CheckCheck className="w-3 h-3 text-emerald-500" /> Direct WhatsApp Business Session
                </span>
              </div>
              
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => (
                  <motion.div 
                    key={m.id || idx}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "flex flex-col group transition-all",
                      m.role === 'shop' ? "ml-auto items-end text-right" : "mr-auto items-start text-left"
                    )}
                  >
                    <div className="flex flex-col gap-1.5 max-w-[90%] sm:max-w-[75%]">
                      <div className={cn(
                        "p-4 rounded-2xl shadow-sm relative",
                        m.role === 'shop' 
                          ? "bg-emerald-600 text-white rounded-tr-none" 
                          : isDarkMode ? "bg-zinc-800 text-white rounded-tl-none" : "bg-white border text-zinc-900 rounded-tl-none"
                      )}>
                        <p className="text-xs font-medium leading-relaxed">{m.content}</p>
                        
                        <div className={cn(
                          "flex items-center gap-1.5 mt-2 opacity-60",
                          m.role === 'shop' ? "justify-end" : "justify-start"
                        )}>
                          <span className="text-[8px] font-bold uppercase tracking-widest">
                            {m.timestamp.toLocaleTimeString('id-id', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {m.role === 'shop' && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className={cn(
              "p-4 sm:p-6 border-t transition-colors",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
            )}>
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button type="button" className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors">
                       <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className={cn(
                      "w-full rounded-2xl py-4 pl-14 pr-14 text-xs font-medium transition-all outline-none border focus:ring-4",
                      isDarkMode 
                        ? "bg-zinc-950 border-zinc-800 text-white focus:ring-emerald-500/5 focus:border-emerald-500/50" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-emerald-500/5 focus:border-emerald-500/50"
                    )}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button type="button" className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors">
                       <Sticker className="w-5 h-5" />
                    </button>
                    <button type="button" className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors">
                       <Mic className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="w-14 h-14 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              <div className="flex flex-wrap gap-2 mt-4">
                <ActionChip icon={<FileText />} label="Invoice Pesanan" color="orange" onClick={() => setInput("Struk Pesanan Digital: http://ais.studio/invoice/POS-1234")} />
                <ActionChip icon={<ShoppingBag />} label="Kirim Promo" color="blue" onClick={() => setInput("PROMO SPESIAL: Buy 1 Get 1 Es Kopi Susu Aren untuk pelanggan setia!")} />
                <ActionChip icon={<ImageIcon />} label="Gallery Menu" color="green" onClick={() => setInput("Lihat menu lengkap kami disini: http://ais.studio/menu-kopi")} />
                <ActionChip icon={<Bot />} label="AI Greeting" color="violet" onClick={() => setInput("Halo! Ada yang bisa WARUNG+ Assistant bantu?")} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 lg:p-24 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-32 h-32 bg-orange-500/10 rounded-[3rem] flex items-center justify-center mb-10 transform rotate-12 animate-pulse transition-transform shadow-2xl">
                  <MessageSquare className="w-16 h-16 text-orange-500" />
                </div>
                <h2 className={cn("text-3xl font-black tracking-tighter mb-4", isDarkMode ? "text-white" : "text-zinc-900")}>Mari Mengobrol</h2>
                <p className={cn("text-lg font-bold max-w-sm leading-relaxed", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                  Pilih salah satu percakapan di kolom kiri untuk mulai melayani pelanggan Anda secara real-time.
                </p>
                <div className="mt-12 flex gap-4">
                   <div className="flex -space-x-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-12 h-12 rounded-2xl border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800" />
                      ))}
                   </div>
                   <div className="flex flex-col items-start justify-center">
                      <p className="text-xs font-black uppercase tracking-widest">{chats.length}+ Pelanggan</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Menunggu balasan Anda</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* New Chat Modal - Simplified */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className={cn(
               "w-full max-w-md p-10 rounded-[3.5rem] border-4 shadow-3xl text-center",
               isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
             )}
           >
              <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-[2.2rem] flex items-center justify-center mx-auto mb-8">
                 <UserPlus className="w-10 h-10" />
              </div>
              <h3 className={cn("text-2xl font-black tracking-tighter mb-4", isDarkMode ? "text-white" : "text-zinc-900")}>Mulai Chat Baru</h3>
              <p className="text-sm font-bold text-zinc-400 opacity-60 uppercase tracking-widest mb-10">Input Nomor Pelanggan</p>
              
              <div className="space-y-4">
                 <input 
                   type="tel" 
                   placeholder="62812345xxxxx"
                   className={cn(
                     "w-full rounded-[2rem] py-5 px-8 text-center text-xl font-black transition-all outline-none border-4",
                     isDarkMode ? "bg-zinc-950 border-zinc-800 focus:border-orange-500" : "bg-zinc-50 border-zinc-100 focus:border-orange-500"
                   )}
                 />
                 <div className="grid grid-cols-2 gap-4 mt-8">
                   <button 
                     onClick={() => setShowNewChatModal(false)}
                     className={cn(
                       "py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em]",
                       isDarkMode ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-600"
                     )}
                   >
                     Batal
                   </button>
                   <button 
                     className="py-5 bg-orange-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30"
                   >
                     Mulai Chat
                   </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

function ActionChip({ icon, label, color, onClick }: any) {
  const colors: any = {
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20 hover:bg-green-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20",
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95",
        colors[color] || "text-zinc-400 bg-zinc-100 border-zinc-200"
      )}
    >
      {React.cloneElement(icon, { className: "w-4 h-4" })}
      {label}
    </button>
  );
}
