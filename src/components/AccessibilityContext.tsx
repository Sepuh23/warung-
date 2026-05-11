import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextProps {
  isTunaRunguMode: boolean;
  isTunaWicaraMode: boolean;
  isSeniorMode: boolean;
  isHighContrastMode: boolean;
  toggleTunaRunguMode: () => void;
  toggleTunaWicaraMode: () => void;
  toggleSeniorMode: () => void;
  toggleHighContrastMode: () => void;
  playVisualAlert: (type: 'success' | 'process' | 'error' | 'info', message: string) => void;
  speakText: (text: string) => void;
  playHaptic: (pattern?: VibratePattern) => void;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isTunaRunguMode, setIsTunaRunguMode] = useState(false);
  const [isTunaWicaraMode, setIsTunaWicaraMode] = useState(false);
  const [isSeniorMode, setIsSeniorMode] = useState(false);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'process' | 'error' | 'info', message: string, id: number } | null>(null);

  const toggleTunaRunguMode = () => setIsTunaRunguMode(prev => !prev);
  const toggleTunaWicaraMode = () => setIsTunaWicaraMode(prev => !prev);
  const toggleSeniorMode = () => setIsSeniorMode(prev => {
    if (!prev) setIsHighContrastMode(true); // Auto-enable high contrast for senior mode
    return !prev;
  });
  const toggleHighContrastMode = () => setIsHighContrastMode(prev => !prev);

  const playVisualAlert = (type: 'success' | 'process' | 'error' | 'info', message: string) => {
    if (isTunaRunguMode || isSeniorMode) {
      setAlert({ type, message, id: Date.now() });
      setTimeout(() => setAlert(null), type === 'info' ? 5000 : 3000);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9; // Slightly slower for better clarity
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const playHaptic = (pattern: VibratePattern = 200) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate && (isTunaRunguMode || isSeniorMode)) {
      navigator.vibrate(pattern);
    }
  };

  // Apply root classes based on modes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (isSeniorMode) html.classList.add('accessibility-senior');
      else html.classList.remove('accessibility-senior');
      
      if (isHighContrastMode) html.classList.add('accessibility-high-contrast');
      else html.classList.remove('accessibility-high-contrast');
    }
  }, [isSeniorMode, isHighContrastMode]);

  return (
    <AccessibilityContext.Provider value={{
      isTunaRunguMode,
      isTunaWicaraMode,
      isSeniorMode,
      isHighContrastMode,
      toggleTunaRunguMode,
      toggleTunaWicaraMode,
      toggleSeniorMode,
      toggleHighContrastMode,
      playVisualAlert,
      speakText,
      playHaptic
    }}>
      {children}
      {/* Global Visual Notification System (Tuna Rungu) */}
      {alert && isTunaRunguMode && (
        <div 
          key={alert.id}
          className="fixed inset-0 z-[100] flex items-center justify-center p-8 pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" />
          <div 
            className={`
              relative flex flex-col items-center justify-center text-center p-12 rounded-[3rem] shadow-2xl max-w-2xl w-full animate-in zoom-in-50 duration-500
              ${alert.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${alert.type === 'process' ? 'bg-yellow-400 text-yellow-900' : ''}
              ${alert.type === 'error' ? 'bg-red-500 text-white' : ''}
            `}
          >
            {/* Pulsing background effect */}
            <div className="absolute inset-0 rounded-[3rem] bg-white opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
            
            <div className="text-[10rem] leading-none mb-8">
              {alert.type === 'success' && '✨'}
              {alert.type === 'process' && '⏳'}
              {alert.type === 'error' && '⚠️'}
            </div>
            <h1 className="text-5xl font-black uppercase tracking-widest leading-tight">
              {alert.message}
            </h1>
          </div>
        </div>
      )}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
