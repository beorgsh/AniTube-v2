import { useState, useEffect } from 'react';
import { Mic, X, Sparkles } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceResult: (query: string) => void;
}

export const VoiceSearchModal = ({
  isOpen,
  onClose,
  onVoiceResult
}: VoiceSearchModalProps) => {
  const [isListening, setIsListening] = useState(true);
  const [spokenText, setSpokenText] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setIsListening(true);
    setSpokenText('Listening...');

    // Simulate voice recognition animation & speech detection
    const timer = setTimeout(() => {
      const sampleAnimeQueries = [
        'Jujutsu Kaisen Season 3 trailer',
        'One Piece Gear 5 fight 4K',
        'Demon Slayer Infinity Castle OST',
        'Solo Leveling Arise episode 12',
        'Anime lofi 24/7'
      ];
      const randomQuery = sampleAnimeQueries[Math.floor(Math.random() * sampleAnimeQueries.length)];
      setSpokenText(randomQuery);
      setIsListening(false);

      const confirmTimer = setTimeout(() => {
        onVoiceResult(randomQuery);
        onClose();
      }, 1400);

      return () => clearTimeout(confirmTimer);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isOpen, onVoiceResult, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-[#212121] border border-[#383838] rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2e2e2e] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-8">
          {isListening ? 'Search with your voice' : 'Heard you loud and clear!'}
        </h3>

        {/* Animated Mic Ring */}
        <div className="relative flex items-center justify-center my-4">
          {isListening && (
            <>
              <div className="absolute w-32 h-32 rounded-full bg-red-600/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-red-600/40 animate-pulse" />
            </>
          )}
          <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-red-600 text-white shadow-xl shadow-red-600/40">
            <Mic className="w-9 h-9" />
          </div>
        </div>

        <p className="mt-8 text-base font-medium text-gray-200 min-h-[48px]">
          "{spokenText}"
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>Say an anime title, character, or soundtrack name</span>
        </div>
      </div>
    </div>
  );
};
