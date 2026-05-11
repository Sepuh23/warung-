import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  Coffee, 
  Loader2, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Bot,
  Zap,
  Star,
  Brain,
  History,
  Trash2,
  Share2,
  Copy,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Message } from '@/src/types';

interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping: boolean;
  shopName: string;
  isDarkMode?: boolean;
}

export default function Chat({ messages, onSendMessage, isTyping, shopName, isDarkMode = false }: ChatProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Voice Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('WebkitSpeechRecognition' in window || 'speechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'id-ID';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex h-full gap-8 relative pb-4 px-4 sm:px-6">
      {/* Sidebar - History & Suggestion */}
      <div className={cn(
        "hidden xl:flex w-80 shrink-0 rounded-[2.5rem] border-4 overflow-hidden flex-col shadow-2xl transition-all duration-500",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
      )}>
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                <Brain className="w-6 h-6" />
              </div>
              <h2 className={cn("text-lg font-black tracking-tighter", isDarkMode ? "text-white" : "text-zinc-900")}>AI Intelligence</h2>
           </div>
           
           <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Sering Ditanyakan</p>
              <div className="space-y-2">
                 <HistoryItem label="Analisa Penjualan" icon={<TrendingUp />} />
                 <HistoryItem label="Peringatan Stok" icon={<AlertTriangle />} />
                 <HistoryItem label="Prediksi Besok" icon={<Sparkles />} />
                 <HistoryItem label="Tips Efisiensi" icon={<Zap />} />
              </div>
           </div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto space-y-8">
           <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Kesehatan AI</p>
              <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black text-green-600">AKTIF</span>
                   <span className="text-[10px] font-black text-green-600">100%</span>
                 </div>
                 <div className="h-1.5 w-full bg-green-500/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-green-500" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main AI Chat Interface */}
      <div className={cn(
        "flex-1 rounded-[3rem] border-4 overflow-hidden flex flex-col shadow-3xl transition-all duration-500 relative",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
      )}>
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Header */}
        <div className={cn(
          "px-8 py-6 border-b flex justify-between items-center bg-gradient-to-r via-transparent to-transparent",
          isDarkMode ? "border-zinc-800 from-orange-500/5" : "border-zinc-100 from-orange-500/5"
        )}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>
            </div>
            <div>
              <h3 className={cn("text-lg font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>Asisten Pintar AI</h3>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                 Neural Network <span className="text-orange-500">v3.5 Flash</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className={cn(
              "p-3 rounded-2xl transition-all hover:scale-105 active:scale-95",
              isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-50 text-zinc-400 hover:text-zinc-900"
            )}>
              <Share2 className="w-5 h-5" />
            </button>
            <button className={cn(
              "p-3 rounded-2xl transition-all hover:scale-105 active:scale-95",
              isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-50 text-zinc-400 hover:text-zinc-900"
            )}>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto p-8 sm:p-12 space-y-10 smooth-scroll relative overscroll-none",
            isDarkMode ? "bg-zinc-950/20" : "bg-zinc-50/30"
          )}
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-8 animate-in fade-in duration-1000">
              <div className="w-24 h-24 bg-orange-500/10 rounded-[2.5rem] flex items-center justify-center text-orange-500 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                <Coffee className="w-12 h-12" />
              </div>
              <div className="space-y-4">
                <h3 className={cn("text-2xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-zinc-900")}>Ada yang bisa dibantu?</h3>
                <p className={cn("text-sm font-bold leading-relaxed opacity-60", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                  "Tanyakan analisa penjualan hari ini, tips promosi kreatif, atau cara optimasi stok baha baku toko kamu."
                </p>
              </div>
              <div className="grid grid-cols-1 w-full gap-3">
                 <QuickPrompt label="Analisa untung rugi hari ini" onClick={() => setInput("Analisa untung rugi hari ini")} />
                 <QuickPrompt label="Menu apa yang perlu promo?" onClick={() => setInput("Menu apa yang perlu promo?")} />
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-5 group",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-xs font-black shadow-xl transform transition-transform group-hover:scale-110",
                  m.role === 'user' 
                    ? "bg-zinc-900 text-white" 
                    : "bg-gradient-to-br from-orange-500 to-pink-500 text-white"
                )}>
                  {m.role === 'user' ? 'ME' : <Bot className="w-6 h-6" />}
                </div>
                
                <div className={cn(
                  "relative max-w-[85%] sm:max-w-[75%] p-6 rounded-[2rem] text-sm leading-relaxed transition-all",
                  m.role === 'user' 
                    ? "bg-zinc-900 text-white rounded-tr-none shadow-2xl shadow-zinc-900/10" 
                    : "bg-white border-4 border-zinc-100 text-zinc-900 rounded-tl-none shadow-xl shadow-zinc-100/50"
                )}>
                  <div className="markdown-body">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  
                  <div className={cn(
                    "mt-4 flex items-center gap-3 border-t pt-3 opacity-40",
                    isDarkMode ? "border-zinc-800" : "border-zinc-50"
                  )}>
                    <button onClick={() => speak(m.content)} className="hover:text-orange-500 transition-colors">
                       <Volume2 className="w-4 h-4" />
                    </button>
                    <button className="hover:text-orange-500 transition-colors">
                       <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 text-[10px] font-black text-orange-500 uppercase tracking-widest pl-2"
            >
              <div className="flex gap-1.5">
                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              </div>
              <span className="animate-pulse">Thinking deeply...</span>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className={cn(
          "p-6 sm:p-10 border-t transition-colors",
          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
        )}>
          <form onSubmit={handleSubmit} className="flex gap-4 relative">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan apapun tentang bisnismu..."
                className={cn(
                  "w-full rounded-[2.5rem] py-6 px-10 pr-20 text-sm font-bold transition-all focus:ring-8 outline-none border-4",
                  isDarkMode 
                    ? "bg-zinc-950 border-zinc-800 text-white focus:ring-orange-500/5 placeholder:text-zinc-600" 
                    : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-orange-500/5 placeholder:text-zinc-400 shadow-inner"
                )}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                  isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "text-zinc-400 hover:text-orange-500 bg-transparent"
                )}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>
            <button
              disabled={isTyping || !input.trim()}
              type="submit"
              className="bg-orange-500 text-white w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-orange-500/40 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shrink-0"
            >
              <Send className="w-8 h-8" />
            </button>
          </form>
          
          <div className="mt-8 flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
             <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mr-2 shrink-0">Suggestions:</span>
             <SuggestionTag label="Prediksi Penjualan" onClick={() => setInput("Apa prediksi penjualan besok?")} />
             <SuggestionTag label="Promo Hari Ini" onClick={() => setInput("Berikan ide promo hari ini")} />
             <SuggestionTag label="Audit Stok" onClick={() => setInput("Produk apa yang stoknya menipis?")} />
             <SuggestionTag label="Top Performer" onClick={() => setInput("Siapa produk terlaris hari ini?")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ label, icon }: { label: string, icon: React.ReactNode }) {
  return (
    <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-orange-500/5 group transition-all text-left">
       <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors">
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
       </div>
       <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate">{label}</span>
       <ChevronRight className="w-4 h-4 ml-auto text-zinc-100 dark:text-zinc-800 group-hover:text-orange-500 transition-colors" />
    </button>
  );
}

function QuickPrompt({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-5 rounded-2xl bg-zinc-50 hover:bg-orange-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-2 border-transparent hover:border-orange-500/20 text-left transition-all group"
    >
       <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold opacity-80 group-hover:opacity-100 group-hover:text-orange-600 transition-all font-sans">{label}</span>
       </div>
    </button>
  );
}

function SuggestionTag({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="whitespace-nowrap px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-orange-500 hover:text-white hover:shadow-lg shadow-orange-500/20 active:scale-95 border-2 border-transparent"
    >
      {label}
    </button>
  );
}
