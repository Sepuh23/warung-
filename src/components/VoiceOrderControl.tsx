import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface VoiceOrderControlProps {
  onCommand: (command: { action: 'add' | 'remove' | 'clear'; productName: string; quantity: number }) => void;
  isDarkMode?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceOrderControl: React.FC<VoiceOrderControlProps> = ({ onCommand, isDarkMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'id-ID';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        setTranscript(resultTranscript);

        if (event.results[current].isFinal) {
          processCommand(resultTranscript.toLowerCase());
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processCommand = (text: string) => {
    setIsProcessing(true);
    
    // Simple parsing logic for the demo
    // Commands: "Tambah 2 kopi susu", "Hapus es teh", "Reset keranjang"
    
    let action: 'add' | 'remove' | 'clear' | null = null;
    let quantity = 1;
    let productName = '';

    if (text.includes('tambah') || text.includes('masukkan')) {
      action = 'add';
      const parts = text.split('tambah');
      const suffix = parts[1]?.trim();
      
      // Try to find quantity
      const qtyMatch = suffix.match(/(\d+)/);
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[0]);
        productName = suffix.replace(qtyMatch[0], '').trim();
      } else {
        productName = suffix;
      }
    } else if (text.includes('hapus') || text.includes('kurangi')) {
      action = 'remove';
      productName = text.split('hapus')[1]?.trim();
    } else if (text.includes('reset') || text.includes('kosongkan') || text.includes('hapus semua')) {
      action = 'clear';
    }

    if (action) {
      onCommand({ action, productName, quantity });
      
      // Feedback animation delay
      setTimeout(() => {
        setIsProcessing(false);
        setTranscript('');
      }, 1000);
    } else {
      setIsProcessing(false);
      // Maybe some UI feedback for unrecognized command
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="relative flex items-center gap-3">
      <AnimatePresence>
        {(isListening || transcript) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              "absolute right-14 top-1/2 -translate-y-1/2 px-4 py-2 rounded-2xl border backdrop-blur-md shadow-xl flex items-center gap-3 whitespace-nowrap z-50",
              isDarkMode ? "bg-zinc-900/90 border-orange-500/30 text-white" : "bg-white/90 border-orange-200 text-zinc-900"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
            ) : (
              <div className="flex gap-1 items-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Listening...</span>
              </div>
            )}
            <p className="text-sm font-bold italic">
              {transcript || "Silakan bicara..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleListening}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group overflow-hidden",
          isListening 
            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-4 ring-orange-500/20" 
            : isDarkMode 
              ? "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-orange-500 hover:text-orange-500" 
              : "bg-white text-zinc-500 border border-zinc-200 hover:border-orange-500 hover:text-orange-500 shadow-sm"
        )}
        title="Dikte Pesanan (Voice POS)"
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="mic-on"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <Mic className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="mic-off"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
               <MicOff className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {isListening && (
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 bg-white rounded-full group-hover:scale-150 transition-transform"
          />
        )}
      </button>

      {isListening && (
         <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="flex items-end gap-1 h-8">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: [8, 16 + Math.random() * 16, 8]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.5 + Math.random() * 0.5,
                    delay: i * 0.1
                  }}
                  className="w-1 bg-orange-500 rounded-full"
                />
              ))}
            </div>
         </div>
      )}
    </div>
  );
};
