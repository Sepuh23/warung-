import React, { useState, useEffect, useRef } from 'react';
import { Accessibility, Volume2, Mic, X, Type, Search, Command, Ear, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useAccessibility } from './AccessibilityContext';

interface AccessibilityWidgetProps {
  onNavigate: (tab: any) => void;
  onReadScreen: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  isLargeText: boolean;
  onToggleLargeText: () => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  isHapticEnabled: boolean;
  onToggleHaptic: () => void;
  isTabletMode: boolean;
  onToggleTabletMode: () => void;
}

export default function AccessibilityWidget({ 
  onNavigate, 
  onReadScreen,
  isHighContrast,
  onToggleHighContrast,
  isLargeText,
  onToggleLargeText,
  isVoiceEnabled,
  onToggleVoice,
  isHapticEnabled,
  onToggleHaptic,
  isTabletMode,
  onToggleTabletMode
}: AccessibilityWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeVoiceNav, setActiveVoiceNav] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const { 
    isTunaRunguMode, toggleTunaRunguMode, 
    isTunaWicaraMode, toggleTunaWicaraMode,
    isSeniorMode, toggleSeniorMode,
    isHighContrastMode, toggleHighContrastMode
  } = useAccessibility();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('WebkitSpeechRecognition' in window || 'speechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'id-ID';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        
        if (transcript.includes('dashboard') || transcript.includes('beranda')) onNavigate('dashboard');
        if (transcript.includes('pos') || transcript.includes('kasir') || transcript.includes('order')) onNavigate('pos');
        if (transcript.includes('menu') || transcript.includes('produk')) onNavigate('menu');
        if (transcript.includes('stok') || transcript.includes('inventory') || transcript.includes('gudang')) onNavigate('inventory');
        if (transcript.includes('rekap') || transcript.includes('laporan') || transcript.includes('data')) onNavigate('reports');
        if (transcript.includes('chat') || transcript.includes('tanya')) onNavigate('chat');
        if (transcript.includes('pelanggan') || transcript.includes('pembeli')) onNavigate('customers');
        
        if (transcript.includes('baca') || transcript.includes('suara')) onReadScreen();
      };
    }
  }, [onNavigate, onReadScreen]);

  const toggleVoiceNavigation = () => {
    if (activeVoiceNav) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      const utterance = new SpeechSynthesisUtterance("Navigasi suara aktif. Katakan: Kasir, Stok, atau Rekap.");
      utterance.lang = 'id-ID';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
    setActiveVoiceNav(!activeVoiceNav);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-20 right-0 w-72 bg-white border border-coffee-border rounded-3xl shadow-2xl p-6 space-y-6 gpu"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-coffee-dark">Aksesibilitas</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-coffee-sub rounded-lg">
                <X className="w-4 h-4 text-coffee-muted" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button 
                  onClick={toggleTunaRunguMode}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    isTunaRunguMode ? "bg-coffee-dark text-white border-coffee-dark" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                  )}
                >
                  <Eye className="w-5 h-5" />
                  <div className="text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest block">Tuna Rungu</span>
                    <span className="text-[8px] opacity-60">Visual Alert</span>
                  </div>
                </button>
                <button 
                  onClick={toggleTunaWicaraMode}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    isTunaWicaraMode ? "bg-blue-600 text-white border-blue-600" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                  )}
                >
                  <Ear className="w-5 h-5" />
                  <div className="text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest block">Tuna Wicara</span>
                    <span className="text-[8px] opacity-60">Asisten Bicara</span>
                  </div>
                </button>
                <button 
                  onClick={toggleSeniorMode}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    isSeniorMode ? "bg-green-600 text-white border-green-600" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                  )}
                >
                  <Type className="w-5 h-5" />
                  <div className="text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest block">Mode Lansia</span>
                    <span className="text-[8px] opacity-60">UI & Font Besar</span>
                  </div>
                </button>
                <button 
                  onClick={toggleHighContrastMode}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    isHighContrastMode ? "bg-purple-600 text-white border-purple-600" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                  )}
                >
                  <Search className="w-5 h-5" />
                  <div className="text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest block">Kontras</span>
                    <span className="text-[8px] opacity-60">Tinggi (Jelas)</span>
                  </div>
                </button>
              </div>

              <button 
                onClick={toggleVoiceNavigation}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl border transition-all",
                  activeVoiceNav ? "bg-orange-500 text-white border-orange-500 shadow-lg font-bold" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                )}
              >
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Voice Command</p>
                    <p className="text-[9px] opacity-60 mt-1">{activeVoiceNav ? "Mendengarkan..." : "Gunakan suara"}</p>
                  </div>
                </div>
                {activeVoiceNav && <div className="w-2 h-2 rounded-full bg-white animate-ping" />}
              </button>

              <button 
                onClick={onToggleVoice}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl border transition-all",
                  isVoiceEnabled ? "bg-coffee-dark text-white border-coffee-dark shadow-lg font-bold" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                )}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Voice Assistant</p>
                    <p className="text-[9px] opacity-60 mt-1">{isVoiceEnabled ? "Aktif" : "Nonaktif"}</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={onToggleHaptic}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl border transition-all",
                  isHapticEnabled ? "bg-coffee-dark text-white border-coffee-dark shadow-lg font-bold" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                )}
              >
                <div className="flex items-center gap-3">
                  <Command className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Haptic Feedback</p>
                    <p className="text-[9px] opacity-60 mt-1">{isHapticEnabled ? "Aktif" : "Nonaktif"}</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={onToggleTabletMode}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl border transition-all",
                  isTabletMode ? "bg-coffee-dark text-white border-coffee-dark shadow-lg font-bold" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                )}
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Tablet Mode</p>
                    <p className="text-[9px] opacity-60 mt-1">{isTabletMode ? "Aktif" : "Nonaktif"}</p>
                  </div>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={onToggleLargeText}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    isLargeText ? "bg-coffee-dark text-white border-coffee-dark" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                  )}
                >
                  <Type className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Font</span>
                </button>
                <button 
                  onClick={onToggleHighContrast}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    isHighContrast ? "bg-coffee-dark text-white border-coffee-dark" : "bg-white border-coffee-border text-coffee-dark hover:bg-coffee-sub"
                  )}
                >
                  <Accessibility className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Kontras</span>
                </button>
              </div>
            </div>

            <p className="text-[8px] text-center text-coffee-muted font-bold uppercase tracking-[0.2em] pt-2">Powered by Kopix Accessibility</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 group",
          isOpen ? "bg-coffee-dark text-white rotate-90" : "bg-white text-coffee-dark border-4 border-coffee-sub hover:scale-110"
        )}
      >
        <Accessibility className={cn("w-6 h-6", !isOpen && "group-hover:animate-bounce")} />
      </button>
    </div>
  );
}
