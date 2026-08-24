import { Video, Channel } from '../types';

export const MOCK_CHANNELS: Channel[] = [
  {
    id: 'ch-mappa',
    name: 'MAPPA Channel Official',
    avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
    subscribers: '4.82M',
    isVerified: true,
    handle: '@MAPPA_Official',
  },
  {
    id: 'ch-toei',
    name: 'Toei Animation World',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
    subscribers: '8.15M',
    isVerified: true,
    handle: '@ToeiAnimation_EN',
  },
  {
    id: 'ch-ufotable',
    name: 'ufotable Works',
    avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
    subscribers: '3.41M',
    isVerified: true,
    handle: '@ufotable_jp',
  },
  {
    id: 'ch-crunchy',
    name: 'AniTube Prime Hub',
    avatar: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80',
    subscribers: '12.6M',
    isVerified: true,
    handle: '@AniTubePrime',
  },
  {
    id: 'ch-anitrack',
    name: 'Anime Symphony Beats',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
    subscribers: '950K',
    isVerified: true,
    handle: '@AnimeSymphony',
  },
  {
    id: 'ch-soloclub',
    name: 'Shadow Monarch Club',
    avatar: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150&auto=format&fit=crop&q=80',
    subscribers: '1.24M',
    isVerified: false,
    handle: '@ShadowMonarchs',
  }
];

export const MOCK_VIDEOS: Video[] = [
  {
    id: 'v1',
    malId: 21,
    title: 'One Piece - Episode 1 (Sub & Dub)',
    description: `Gold Roger was known as the "Pirate King," the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world.
    
Streamed in Ultra High Definition with automatic English subtitles.`,
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    duration: '24:00',
    views: '5.1M views',
    viewsCount: 5120000,
    uploadedAt: '4 days ago',
    channel: MOCK_CHANNELS[1],
    streamUrl: '',
    category: 'One Piece',
    tags: ['One Piece', 'Luffy', 'Gear 5', 'Anime Battle', 'Shonen'],
    likes: '480K',
    likesCount: 480000,
    commentsCount: '28,104',
    comments: [
      {
        id: 'c4',
        author: 'ZoroLostAgain',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
        timeAgo: '3 days ago',
        content: 'The pacing and fluid animation in this fight sequence is peak Toei excellence.',
        likes: 3100,
        repliesCount: 84
      }
    ]
  },
  {
    id: 'v2',
    malId: 52991,
    title: 'Frieren: Beyond Journey\'s End - Episode 1',
    description: `After the party of heroes defeated the Demon King, they restored peace to the land and returned to lives of solitude. But generations pass, and the elven mage Frieren comes face to face with humanity's mortality.`,
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    duration: '24:00',
    views: '3.4M views',
    viewsCount: 3420000,
    uploadedAt: '2 days ago',
    channel: MOCK_CHANNELS[0],
    streamUrl: '',
    category: 'Fantasy',
    tags: ['Frieren', 'Fantasy', 'Adventure', 'Madhouse'],
    likes: '240K',
    likesCount: 240000,
    commentsCount: '14,289',
    comments: [
      {
        id: 'c1',
        author: 'FrierenAppreciator',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        timeAgo: '1 day ago',
        content: 'Evan Call\'s score paired with this emotional storytelling is pure art.',
        likes: 1240,
        isHeartedByCreator: true,
        repliesCount: 42
      }
    ]
  }
];

export const MOCK_SHORTS = [
  {
    id: 's1',
    malId: 40748,
    streamUrl: '/api/stream/manifest?url=' + encodeURIComponent('https://s1.akirax.buzz/agbf9aa0bc977556508e15754883731bc54h/master.m3u8') + '&referer=' + encodeURIComponent('https://megaplay.buzz/'),
    title: 'Gojo Satoru Domain Expansion: Infinite Void 🌌 (Clean Sakuga)',
    views: '12.4M',
    likes: '980K',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    channel: MOCK_CHANNELS[0],
    commentsCount: '3,840',
  },
  {
    id: 's2',
    malId: 21,
    streamUrl: '/api/stream/manifest?url=' + encodeURIComponent('https://cdn.watching.onl/anime/f899139df5e1059396431415e770c6dd/61b87186ab260d05003427e16ccf5657/master.m3u8') + '&referer=' + encodeURIComponent('https://megaplay.buzz/'),
    title: 'Luffy Gear 5 Drum of Liberation sound effect reaction! 🥁⚡',
    views: '8.7M',
    likes: '720K',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    channel: MOCK_CHANNELS[1],
    commentsCount: '2,190',
  },
  {
    id: 's3',
    malId: 38000,
    streamUrl: '/api/stream/manifest?url=' + encodeURIComponent('https://s1.akirax.buzz/agbf9aa0bc977556508e15754883731bc54h/master.m3u8') + '&referer=' + encodeURIComponent('https://megaplay.buzz/'),
    title: 'Tanjiro Sun Breathing Hinokami Kagura Tenth Form 🔥',
    views: '6.9M',
    likes: '540K',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    channel: MOCK_CHANNELS[2],
    commentsCount: '1,730',
  },
  {
    id: 's4',
    malId: 52991,
    streamUrl: '/api/stream/manifest?url=' + encodeURIComponent('https://cdn.watching.onl/anime/bb6d2babd7797d94d8f4a8600bc9b44e/b7d51fb7e838ee9b60dcdb34b953bc07/master.m3u8') + '&referer=' + encodeURIComponent('https://megaplay.buzz/'),
    title: 'Jin-Woo Arise Scene with Dolby Atmos Audio ⚔️',
    views: '14.2M',
    likes: '1.2M',
    thumbnail: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    channel: MOCK_CHANNELS[5],
    commentsCount: '5,210',
  },
  {
    id: 's5',
    malId: 16498,
    streamUrl: '/api/stream/manifest?url=' + encodeURIComponent('https://s1.akirax.buzz/agbf9aa0bc977556508e15754883731bc54h/master.m3u8') + '&referer=' + encodeURIComponent('https://megaplay.buzz/'),
    title: 'Top 5 cleanest anime sound designs ever made 🎧',
    views: '4.3M',
    likes: '310K',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    channel: MOCK_CHANNELS[4],
    commentsCount: '980',
  },
  {
    id: 's6',
    malId: 1535,
    streamUrl: '/api/stream/manifest?url=' + encodeURIComponent('https://s1.akirax.buzz/agbf9aa0bc977556508e15754883731bc54h/master.m3u8') + '&referer=' + encodeURIComponent('https://megaplay.buzz/'),
    title: 'Anime studio budget comparison 2026 💸',
    views: '3.1M',
    likes: '220K',
    thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    channel: MOCK_CHANNELS[3],
    commentsCount: '640',
  }
];

export const CATEGORIES = [
  'All',
  'Action',
  'Adventure',
  'Fantasy',
  'Shounen',
  'Super Power',
  'Comedy',
  'Drama',
  'Sci-Fi',
  'Mystery',
  'Supernatural',
  'Romance',
  'Slice of Life'
];
