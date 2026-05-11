import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Settings2, 
  Zap, 
  Sparkles,
  Bot,
  ChevronUp,
  X,
  FastForward,
  User,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface VoiceAssistantProps {
  script: string;
  autoPlay?: boolean;
  onComplete?: () => void;
  isDarkMode?: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  script, 
  autoPlay = true, 
  onComplete,
  isDarkMode = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceRate, setVoiceRate] = useState(1);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentText, setCurrentText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setCurrentText('');
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!text || isMuted) return;

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Voice Selection (Try to find Indonesian)
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(v => v.lang.includes('id-ID'));
    
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }
    
    utterance.lang = 'id-ID';
    utterance.rate = voiceRate;
    utterance.pitch = voiceGender === 'female' ? 1.2 : 0.8;

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentText('');
      onComplete?.();
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isMuted, voiceRate, voiceGender, onComplete, stopSpeaking]);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    // Wait for voices to load
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setIsInitializing(false);
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  useEffect(() => {
    if (autoPlay && script && !isInitializing) {
      const timer = setTimeout(() => {
        speak(script);
      }, 1500); // Small delay to let user settle
      return () => clearTimeout(timer);
    }
  }, [script, autoPlay, isInitializing, speak]);

  if (!script && !isPlaying) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      {/* AI Subtitles Card */}
      <AnimatePresence>
        {isPlaying && isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "max-w-xs sm:max-w-sm p-6 rounded-[2rem] border-4 backdrop-blur-xl shadow-[0_32px_64px_rgba(0,0,0,0.2)] pointer-events-auto overflow-hidden relative group",
              isDarkMode ? "bg-zinc-900/90 border-zinc-800" : "bg-white/90 border-zinc-100"
            )}
          >
            {/* Gloss Header */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Assistant Briefing</span>
              <div className="ml-auto flex items-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Live Analysis</span>
              </div>
            </div>

            <p className={cn(
              "text-xs sm:text-sm font-bold leading-relaxed italic pr-4",
              isDarkMode ? "text-zinc-200" : "text-zinc-700"
            )}>
              "{script}"
            </p>

            {/* Progress/Waveform for subtiles */}
            <div className="mt-6 flex items-center gap-2">
              <div className="flex gap-0.5 items-end h-3">
                {[...Array(12)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      height: isPlaying ? [4, 12, 4] : 4 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.4, 
                      delay: i * 0.05 
                    }}
                    className="w-1 bg-orange-500 rounded-full"
                  />
                ))}
              </div>
              <span className="text-[8px] font-black text-orange-500/50 uppercase tracking-widest">Processing Audio</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Assistant Orb & Controls */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {/* Quick Settings Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-lg",
                isDarkMode ? "bg-zinc-950/80 border-zinc-800" : "bg-white/80 border-zinc-100"
              )}
            >
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={cn("p-2 rounded-xl transition-all", isMuted ? "bg-red-500/10 text-red-500" : "text-zinc-500")}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
              
              <button 
                onClick={() => setVoiceRate(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1)}
                className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-500"
              >
                <FastForward className={cn("w-4 h-4", voiceRate > 1 && "text-orange-500")} />
                <span className="text-[10px] font-black">{voiceRate}x</span>
              </button>

              <button 
                onClick={() => setVoiceGender(prev => prev === 'male' ? 'female' : 'male')}
                className="p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-500"
              >
                {voiceGender === 'male' ? <User className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The ORB */}
        <div
          onClick={() => isPlaying ? stopSpeaking() : speak(script)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              isPlaying ? stopSpeaking() : speak(script);
            }
          }}
          role="button"
          tabIndex={0}
          className="relative w-20 h-20 group cursor-pointer"
        >
          {/* Outer Glows */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-2xl transition-all duration-700",
            isPlaying 
              ? "bg-orange-500/50 scale-125 opacity-100" 
              : "bg-orange-500/20 scale-100 opacity-30 group-hover:opacity-50"
          )} />
          
          <div className={cn(
            "relative w-full h-full rounded-full border-4 flex items-center justify-center p-1 transition-all overflow-hidden",
            isPlaying 
              ? "bg-zinc-900 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)]" 
              : isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 shadow-xl"
          )}>
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div 
                  key="playing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-1"
                >
                   {/* Dancing Orb/Logo */}
                   <motion.div 
                     animate={{ 
                       scale: [1, 1.2, 1],
                       rotate: [0, 180, 360]
                     }}
                     transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                     className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 via-rose-500 to-amber-300 flex items-center justify-center"
                   >
                     <Zap className="w-5 h-5 text-white fill-white animate-pulse" />
                   </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="static"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-orange-500"
                >
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sine/Wave Overlays (Futuristic effect) */}
            {isPlaying && (
               <div className="absolute inset-0 pointer-events-none opacity-20">
                  <motion.div 
                    animate={{ x: [-100, 100] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12"
                  />
               </div>
            )}
          </div>

          {/* Toggle Tab */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={cn(
              "absolute -top-4 -right-1 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white pointer-events-auto",
              !isExpanded && "rotate-180"
            )}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
