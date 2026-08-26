import React, { useState, useEffect } from 'react';
import { User, Check, Sparkles, RefreshCw, ArrowRight, ShieldCheck, Wand2, Palette } from 'lucide-react';
import { UserProfile, saveUserProfile, setHasVisitedLanding } from '../services/sessionStorage';

interface AvatarSetupModalProps {
  isOpen: boolean;
  currentProfile: UserProfile;
  onClose: () => void;
  onSaveComplete: (updatedProfile: UserProfile) => void;
}

interface AvatarStyleOption {
  id: string;
  name: string;
  category: 'Illustrated & Cartoon' | 'Gaming & Retro' | 'Minimalist & Artistic';
  description: string;
}

const AVATAR_BG_COLORS = [
  'b6e3f4', // Soft Sky Blue
  'c0aede', // Soft Lavender
  'd1d4f9', // Periwinkle
  'ffd5dc', // Pastel Pink
  'ffdfbf', // Peach
  'fdba74', // Soft Amber
  'fef08a', // Pastel Yellow
  'a7f3d0', // Mint Green
  'bae6fd', // Ice Blue
  'c7d2fe', // Soft Indigo
  'fbcfe8', // Bubblegum Pink
  '38bdf8', // Electric Cyan
  '818cf8', // Bright Violet
  'f472b6', // Neon Pink
  'fb7185', // Coral Red
  '10b981', // Emerald
  'f59e0b', // Golden Amber
  '6366f1', // Indigo
  'ec4899', // Hot Pink
  '14b8a6', // Teal
  '1e293b', // Slate Dark
  '311b92', // Deep Purple
];

const AVATAR_STYLES: AvatarStyleOption[] = [
  // 1. Illustrated & Cartoon
  {
    id: 'lorelei',
    name: 'Lorelei (Anime)',
    category: 'Illustrated & Cartoon',
    description: 'Anime & manga styled expressions and hairstyles',
  },
  {
    id: 'adventurer',
    name: 'Adventurer',
    category: 'Illustrated & Cartoon',
    description: 'Vibrant cartoon faces with detailed hairstyles & accessories',
  },
  {
    id: 'dylan',
    name: 'Dylan',
    category: 'Illustrated & Cartoon',
    description: 'Flat, chunky illustrations with bold outlines and modern styling',
  },
  {
    id: 'open-peeps',
    name: 'Open Peeps',
    category: 'Illustrated & Cartoon',
    description: 'Hand-drawn, black-and-white comic book style avatars',
  },
  {
    id: 'avataaars',
    name: 'Avataaars',
    category: 'Illustrated & Cartoon',
    description: 'Clean, modern tech-illustration characters',
  },

  // 2. Gaming & Retro
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    category: 'Gaming & Retro',
    description: 'Classic 8-bit video game character sprites',
  },
  {
    id: 'bottts',
    name: 'Bottts (Robots)',
    category: 'Gaming & Retro',
    description: 'Custom robotic parts, wires, and machinery faces',
  },

  // 3. Minimalist & Artistic
  {
    id: 'personas',
    name: 'Personas',
    category: 'Minimalist & Artistic',
    description: 'Clean, geometric human icons used in modern products',
  },
  {
    id: 'notionists',
    name: 'Notionists',
    category: 'Minimalist & Artistic',
    description: 'Distinctive black-and-white icons inspired by Notion app design',
  },
];

export const AvatarSetupModal: React.FC<AvatarSetupModalProps> = ({
  isOpen,
  currentProfile,
  onClose,
  onSaveComplete,
}) => {
  const [name, setName] = useState(currentProfile.name || 'Otaku Explorer');
  const [username, setUsername] = useState(currentProfile.username || 'otaku_master');
  const [selectedStyle, setSelectedStyle] = useState<string>(currentProfile.avatarStyle || 'lorelei');
  const [bgColor, setBgColor] = useState<string>(() => {
    if (currentProfile.avatarBgColor) return currentProfile.avatarBgColor;
    if (currentProfile.avatarUrl) {
      const match = currentProfile.avatarUrl.match(/backgroundColor=([a-fA-F0-9]+)/);
      if (match) return match[1];
    }
    return 'b6e3f4';
  });
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Sync initial state if currentProfile changes
  useEffect(() => {
    if (isOpen) {
      setName(currentProfile.name || 'Otaku Explorer');
      setUsername(currentProfile.username || 'otaku_master');
      setSelectedStyle(currentProfile.avatarStyle || 'lorelei');
      if (currentProfile.avatarBgColor) {
        setBgColor(currentProfile.avatarBgColor);
      } else if (currentProfile.avatarUrl) {
        const match = currentProfile.avatarUrl.match(/backgroundColor=([a-fA-F0-9]+)/);
        if (match) setBgColor(match[1]);
      }
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  // Active seed is based on username (cleaned) + optional random variation
  const activeSeed = `${username.trim() || 'otaku'}${randomSeed > 0 ? `_${randomSeed}` : ''}`;

  // Helper to build DiceBear API URL with background color parameter:
  // https://api.dicebear.com/9.x/{style}/png?seed={username}&backgroundColor={hex}
  const getAvatarUrl = (styleId: string, seed: string, colorHex: string) => {
    return `https://api.dicebear.com/9.x/${styleId}/png?seed=${encodeURIComponent(seed)}&backgroundColor=${colorHex}`;
  };

  const selectedAvatarUrl = getAvatarUrl(selectedStyle, activeSeed, bgColor);

  const handleRandomize = () => {
    setRandomSeed((prev) => prev + 1);
    const randomColor = AVATAR_BG_COLORS[Math.floor(Math.random() * AVATAR_BG_COLORS.length)];
    setBgColor(randomColor);
  };

  const handleSave = () => {
    setIsSaving(true);
    const newProfile: UserProfile = {
      name: name.trim() || 'Otaku Explorer',
      username: username.trim() || 'otaku_master',
      avatarUrl: selectedAvatarUrl,
      avatarStyle: selectedStyle,
      avatarBgColor: bgColor,
    };

    saveUserProfile(newProfile);
    setHasVisitedLanding(true);

    setTimeout(() => {
      setIsSaving(false);
      onSaveComplete(newProfile);
      onClose();
    }, 400);
  };

  // Group styles by category
  const categories: Array<'Illustrated & Cartoon' | 'Gaming & Retro' | 'Minimalist & Artistic'> = [
    'Illustrated & Cartoon',
    'Gaming & Retro',
    'Minimalist & Artistic',
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#141414] border border-[#2b2b2b] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-auto text-white">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profile Avatar Customization</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Create Your Anime Avatar
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
            Type your username to dynamically generate custom avatars with colorful backgrounds using the DiceBear API.
          </p>
        </div>

        {/* Selected Avatar Placeholder Box & Name Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl shadow-inner">
          {/* Avatar Placeholder View */}
          <div className="relative group shrink-0 flex flex-col items-center">
            <div 
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-xl shadow-red-900/20 flex items-center justify-center p-2 transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: `#${bgColor}` }}
            >
              <img
                src={selectedAvatarUrl}
                alt="Selected Avatar Preview"
                className="w-full h-full object-contain drop-shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <button
              onClick={handleRandomize}
              type="button"
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#272727] hover:bg-[#333333] active:scale-95 text-[11px] font-semibold text-gray-300 hover:text-white border border-[#383838] transition-all cursor-pointer"
              title="Shuffle avatar parameters & background color"
            >
              <RefreshCw className="w-3 h-3 text-red-400" />
              <span>Randomize Color & Seed</span>
            </button>
          </div>

          {/* User Details Form */}
          <div className="w-full space-y-3 min-w-0">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gojo Satoru"
                className="w-full px-3.5 py-2 text-xs bg-[#222222] text-white placeholder-gray-500 rounded-xl border border-[#383838] focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Username (Drives Avatar Generation)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="e.g. otaku_master"
                  className="w-full pl-8 pr-3.5 py-2 text-xs bg-[#222222] text-white placeholder-gray-500 rounded-xl border border-[#383838] focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Background Color Swatches */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-300">
                  <Palette className="w-3 h-3 text-amber-400" />
                  <span>Avatar Background Color</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const randomColor = AVATAR_BG_COLORS[Math.floor(Math.random() * AVATAR_BG_COLORS.length)];
                    setBgColor(randomColor);
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                >
                  Randomize
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {AVATAR_BG_COLORS.slice(0, 14).map((colorHex) => (
                  <button
                    key={colorHex}
                    type="button"
                    onClick={() => setBgColor(colorHex)}
                    style={{ backgroundColor: `#${colorHex}` }}
                    className={`w-6 h-6 rounded-full shrink-0 border transition-transform cursor-pointer ${
                      bgColor === colorHex ? 'scale-125 border-white ring-2 ring-red-500 shadow-md' : 'border-black/30 hover:scale-110'
                    }`}
                    title={`#${colorHex}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Style Picker Grid */}
        <div className="space-y-4 max-h-[220px] sm:max-h-[260px] overflow-y-auto pr-1">
          {categories.map((category) => {
            const stylesInCat = AVATAR_STYLES.filter((s) => s.category === category);
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-red-500" />
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    {category}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {stylesInCat.map((style) => {
                    const styleUrl = getAvatarUrl(style.id, activeSeed, bgColor);
                    const isSelected = selectedStyle === style.id;

                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          setSelectedStyle(style.id);
                          // Optionally shift to a new color when picking a style
                          const randomColor = AVATAR_BG_COLORS[Math.floor(Math.random() * AVATAR_BG_COLORS.length)];
                          setBgColor(randomColor);
                        }}
                        className={`group relative flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-950/30 border-red-500 ring-2 ring-red-500/40 shadow-lg'
                            : 'bg-[#1a1a1a] border-[#292929] hover:bg-[#222222] hover:border-[#3d3d3d]'
                        }`}
                      >
                        <div 
                          className="relative w-12 h-12 rounded-lg p-1 shrink-0 overflow-hidden border border-[#333] transition-colors"
                          style={{ backgroundColor: `#${bgColor}` }}
                        >
                          <img
                            src={styleUrl}
                            alt={style.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                            {style.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 line-clamp-1">
                            {style.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#272727]">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Profile session saved locally</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setHasVisitedLanding(true);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#222222] hover:bg-[#2d2d2d] text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/40 cursor-pointer disabled:opacity-50"
            >
              <span>{isSaving ? 'Saving Profile...' : 'Finish & Enter AniTube'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

