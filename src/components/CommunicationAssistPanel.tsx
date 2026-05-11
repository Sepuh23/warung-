import React, { useState } from 'react';
import { Volume2, X, MessageSquare, Send, Ear } from 'lucide-react';
import { useAccessibility } from './AccessibilityContext';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function CommunicationAssistPanel() {
  const { isTunaWicaraMode, speakText } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [history, setHistory] = useState<{text: string, time: Date}[]>([]);

  if (!isTunaWicaraMode) return null;

  const quickPhrases = [
    "Halo",
    "Terima kasih",
    "QRIS saja",
    "Tunai",
    "Mohon tunggu",
    "Pesanan selesai",
    "Butuh bantuan?",
    "Silakan scan QR",
    "Silakan duduk"
  ];

  const handleSpeak = (text: string) => {
    speakText(text);
    setHistory(prev => [...prev, { text, time: new Date() }]);
  };

  const handeSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customText.trim()) {
      handleSpeak(customText);
      setCustomText('');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[60] w-20 h-20 bg-blue-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none focus-visible:ring-4 ring-offset-2 ring-blue-600"
        aria-label="Buka Asisten Komunikasi"
      >
        <Ear className="w-10 h-10" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-4 md:inset-10 z-[70] bg-white border-4 border-blue-100 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left Panel: Controls */}
            <div className="flex-1 flex flex-col bg-blue-50/50 h-full border-b md:border-b-0 md:border-r border-blue-100">
              <div className="bg-blue-600 text-white p-6 justify-between flex md:hidden items-center shadow-md">
                <h3 className="font-black text-xl uppercase tracking-widest">Asisten Bicara</h3>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6 md:p-10 flex-1 overflow-y-auto space-y-8">
                <div>
                  <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-6 px-2">Ketik Sesuatu</h4>
                  <form onSubmit={handeSendCustom} className="flex gap-4">
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Contoh: Totalnya tujuh puluh ribu ya kak..."
                      className="flex-1 px-8 py-6 bg-white border-2 border-blue-200 focus:border-blue-500 rounded-[2rem] text-xl font-bold outline-none transition-all shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={!customText.trim()}
                      className="w-20 md:w-28 bg-blue-600 disabled:bg-gray-300 text-white rounded-[2rem] flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      <Send className="w-8 h-8" />
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-6 px-2">Sobat Kata (Cepat)</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {quickPhrases.map((phrase, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSpeak(phrase)}
                        className="p-6 md:p-8 bg-white border-2 border-blue-100 rounded-[2rem] text-left hover:border-blue-500 hover:bg-blue-50 hover:shadow-xl active:scale-95 transition-all group flex flex-col justify-between min-h-[140px]"
                      >
                        <span className="font-bold text-blue-900 text-xl md:text-2xl leading-tight">{phrase}</span>
                        <Volume2 className="w-8 h-8 text-blue-300 group-hover:text-blue-600 mt-4 self-end transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Chat History */}
            <div className="w-full md:w-[400px] lg:w-[500px] flex flex-col bg-white">
              <div className="bg-white p-6 md:p-10 flex items-center justify-between shadow-sm z-10 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center hidden md:flex">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-widest text-blue-900">Live Layar</h3>
                    <p className="text-gray-500 text-sm font-medium mt-1">Teks yang dibaca</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl hidden md:flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 bg-gray-50">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <MessageSquare className="w-16 h-16 mb-4" />
                    <p className="font-bold text-lg">Belum ada percakapan</p>
                  </div>
                ) : (
                  history.map((msg, idx) => (
                    <div key={idx} className="bg-blue-600 text-white p-6 rounded-3xl rounded-tr-sm shadow-md ml-auto max-w-[85%] animate-in slide-in-from-right-4">
                      <p className="text-xl md:text-2xl font-bold leading-snug">{msg.text}</p>
                      <span className="text-xs text-blue-200 mt-3 block font-medium">
                        {msg.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
