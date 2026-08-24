import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

  // CORS middleware for all API routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Proxy for Anikoto Category APIs (popular, latest-episodes, ongoing, upcoming, completed)
  const VALID_CATEGORIES = ['popular', 'latest-episodes', 'ongoing', 'upcoming', 'completed'];
  app.get('/api/anime/category/:type', async (req, res) => {
    const { type } = req.params;
    if (!VALID_CATEGORIES.includes(type)) {
      return res.status(400).json({ success: false, error: `Invalid category: ${type}. Allowed: ${VALID_CATEGORIES.join(', ')}` });
    }

    try {
      const targetUrl = `https://anikoto-api.vercel.app/api/${type}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: `Failed to fetch ${type} from Anikoto API` });
      }

      const data = await response.json();
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      res.json(data);
    } catch (error: any) {
      console.error(`Error fetching category ${type}:`, error);
      res.status(500).json({ success: false, error: error?.message || `Failed to fetch ${type}` });
    }
  });

  // Direct convenience proxy routes for category endpoints
  app.get('/api/anime/popular', async (req, res) => {
    res.redirect('/api/anime/category/popular');
  });
  app.get('/api/anime/latest-episodes', async (req, res) => {
    res.redirect('/api/anime/category/latest-episodes');
  });
  app.get('/api/anime/ongoing', async (req, res) => {
    res.redirect('/api/anime/category/ongoing');
  });
  app.get('/api/anime/upcoming', async (req, res) => {
    res.redirect('/api/anime/category/upcoming');
  });
  app.get('/api/anime/completed', async (req, res) => {
    res.redirect('/api/anime/category/completed');
  });

  // Proxy for Recent Anime with fallback to latest-episodes / popular
  app.get('/api/recent-anime', async (req, res) => {
    const page = parseInt((req.query.page as string) || '1', 10);
    const perPage = parseInt((req.query.per_page as string) || '10', 10);

    // 1. Try Primary API (anikotoapi.site)
    try {
      const primaryUrl = `https://anikotoapi.site/recent-anime?page=${page}&per_page=${perPage}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const primaryRes = await fetch(primaryUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (primaryRes.ok) {
        const data = await primaryRes.json();
        if (data && data.ok && Array.isArray(data.data)) {
          return res.json(data);
        }
      }
    } catch (err) {
      console.warn('Primary recent-anime endpoint failed or timed out, trying fallback...');
    }

    // 2. Fallback to Anikoto latest-episodes API
    try {
      const fallbackUrl = `https://anikoto-api.vercel.app/api/latest-episodes`;
      const fbRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData && fbData.success && Array.isArray(fbData.data)) {
          // Normalize AnikotoCategoryItem to AnikotoAnime structure
          const normalizedAnime = fbData.data.map((item: any, idx: number) => {
            const epNum = item.episodes ? parseInt(item.episodes, 10) : 1;
            return {
              id: item.id || `latest-${idx}`,
              title: item.title || 'Live Anime',
              slug: item.id ? String(item.id).replace(/^slug-/, '') : '',
              poster: item.image,
              background_image: item.image,
              is_sub: item.sub ? 1 : 0,
              is_dub: item.dub ? 1 : 0,
              description: item.title ? `${item.title} - Currently airing episode streaming in HD on AniTube.` : '',
              status: 'Currently Airing',
              episodes: item.episodes || String(epNum),
              updated_at: new Date().toISOString(),
              terms_by_type: {
                type: [item.type || 'TV'],
              },
            };
          });

          // Paginate results
          const startIndex = (page - 1) * perPage;
          const paginated = normalizedAnime.slice(startIndex, startIndex + perPage);

          return res.json({
            ok: true,
            data: paginated.length > 0 ? paginated : normalizedAnime.slice(0, perPage),
            pagination: {
              page,
              per_page: perPage,
              total: normalizedAnime.length,
              total_pages: Math.ceil(normalizedAnime.length / perPage) || 1,
            },
            source: 'latest-episodes-fallback',
          });
        }
      }
    } catch (fbErr) {
      console.error('Fallback recent-anime failed:', fbErr);
    }

    res.status(500).json({ ok: false, error: 'Failed to load recent anime' });
  });

  // Proxy for search
  app.get('/api/anime/search', async (req, res) => {
    const { keyword, page = '1' } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, error: 'keyword query parameter is required' });
    }

    try {
      // 1. Try Primary API
      const primaryUrl = `https://anikototvapi.vercel.app/api/search?keyword=${encodeURIComponent(keyword as string)}&page=${page}`;
      const primaryRes = await fetch(primaryUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      let primaryData;
      if (primaryRes.ok) {
        primaryData = await primaryRes.json();
        if (primaryData.success && primaryData.results && Array.isArray(primaryData.results.data)) {
          // Normalize to AnikotoCategoryItem format
          const normalizedData = primaryData.results.data.map((item: any) => {
            // Slug might be "road-of-naruto-ggjw8/ep-1", we need "road-of-naruto-ggjw8"
            let id = item.slug || '';
            if (id.includes('/')) id = id.split('/')[0];
            
            return {
              id: id,
              title: item.title || item.japaneseTitle,
              image: item.poster,
              type: item.type || 'TV',
              sub: item.sub ? String(item.sub) : null,
              dub: item.dub ? String(item.dub) : null,
              episodes: item.total ? String(item.total) : null,
            };
          });
          
          return res.json({
            success: true,
            data: normalizedData,
            source: 'primary',
            page: parseInt(page as string),
            totalPages: primaryData.results.totalPages || 1
          });
        }
      }

      // 2. Fallback API
      const fallbackUrl = `https://anikoto-api.vercel.app/api/search?keyword=${encodeURIComponent(keyword as string)}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && Array.isArray(fallbackData.data)) {
          return res.json({
            success: true,
            data: fallbackData.data, // already in AnikotoCategoryItem format
            source: 'fallback',
            page: 1,
            totalPages: 1
          });
        }
      }
      
      return res.status(404).json({ success: false, error: 'No results found' });
      
    } catch (error: any) {
      console.error('Search API error:', error);
      res.status(500).json({ success: false, error: 'Failed to search anime' });
    }
  });

  // Proxy for Anime Info API (Anikoto Info: genres, episodes, seasons, related, MAL/AniList IDs)
  app.get('/api/anime/info', async (req, res) => {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, error: 'id query parameter is required (e.g. slug)' });
    }

    try {
      const url = `https://anikoto-api.vercel.app/api/info?id=${encodeURIComponent(id as string)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: `Upstream error ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Anime info API error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch anime info' });
    }
  });

  // Proxy for Genre API (anikototvapi genre filter)
  app.get('/api/anime/genre/:genre', async (req, res) => {
    const { genre } = req.params;
    const { page = '1' } = req.query;

    if (!genre) {
      return res.status(400).json({ success: false, error: 'genre parameter is required' });
    }

    try {
      const formattedGenre = genre.toLowerCase().trim().replace(/\s+/g, '-');
      const url = `https://anikototvapi.vercel.app/api/genre/${formattedGenre}?page=${page}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: `Upstream error ${response.status}` });
      }

      const data = await response.json();
      if (data.success && data.results && Array.isArray(data.results.data)) {
        // Normalize items
        const normalizedData = data.results.data.map((item: any) => {
          let id = item.slug || '';
          if (id.includes('/')) id = id.split('/')[0];

          return {
            id,
            title: item.title || item.japaneseTitle,
            image: item.poster,
            type: item.type || 'TV',
            sub: item.sub ? String(item.sub) : null,
            dub: item.dub ? String(item.dub) : null,
            episodes: item.total ? String(item.total) : null,
            rating: item.rating || null,
            genres: item.genres || [genre],
          };
        });

        return res.json({
          success: true,
          genre: formattedGenre,
          data: normalizedData,
          page: parseInt(page as string),
          totalPages: data.results.totalPages || 1,
        });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Anime genre API error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch anime by genre' });
    }
  });

  // Proxy for Anime Metadata & Episode Thumbnails API (anime-metadata-api by AniList ID)
  app.get('/api/anime/metadata/:anilistId', async (req, res) => {
    const { anilistId } = req.params;
    const { season, extras } = req.query;

    if (!anilistId) {
      return res.status(400).json({ success: false, error: 'anilistId parameter is required' });
    }

    try {
      let targetUrl = `https://anime-metadata-api.vercel.app/api/episodes/${encodeURIComponent(anilistId)}`;
      const params = new URLSearchParams();
      if (season) params.set('season', season as string);
      if (extras === 'true') targetUrl += '/extras';
      if (params.toString()) targetUrl += `?${params.toString()}`;

      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: `Metadata upstream error ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Metadata API error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch anime episode metadata' });
    }
  });

  // Proxy for MAL ID stream endpoint (with automatic slug fallback)
  app.get('/api/anime/stream/:malId/:episode?', async (req, res) => {
    const { malId } = req.params;
    const episode = req.params.episode || '1';
    const slugQuery = req.query.slug as string | undefined;

    if (!malId) {
      return res.status(400).json({ success: false, error: 'malId is required' });
    }

    try {
      // First try anikoto endpoint requested by user
      const anikotoUrl = `https://aniapikoto.vercel.app/api/anikoto/mal/${malId}/${episode}`;
      let apiResponse = null;

      try {
        const response = await fetch(anikotoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.success && data.data) {
            // Check if it has active stream servers
            const hasServers = (Array.isArray(data.data.sub) && data.data.sub.length > 0) ||
                               (Array.isArray(data.data.ssub) && data.data.ssub.length > 0) ||
                               (Array.isArray(data.data.dub) && data.data.dub.length > 0);
            if (hasServers) {
              apiResponse = data;
            } else if (data.data.slug) {
              // We have a slug from MAL API response, can be used for fallback!
              console.log(`MAL ID ${malId} returned 0 stream servers, falling back to slug: ${data.data.slug}`);
            }
          }
        }
      } catch (err) {
        console.warn('Anikoto endpoint fetch error, trying anineko fallback:', err);
      }

      // Fallback to anineko if anikoto returned no stream or error
      if (!apiResponse) {
        try {
          const aninekoUrl = `https://aniapikoto.vercel.app/api/anineko/mal/${malId}/${episode}`;
          const fallbackRes = await fetch(aninekoUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
            },
          });
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            if (fbData && fbData.success && fbData.data) {
              const hasServers = (Array.isArray(fbData.data.sub) && fbData.data.sub.length > 0) ||
                                 (Array.isArray(fbData.data.ssub) && fbData.data.ssub.length > 0) ||
                                 (Array.isArray(fbData.data.dub) && fbData.data.dub.length > 0);
              if (hasServers) {
                apiResponse = fbData;
              }
            }
          }
        } catch (fbErr) {
          console.warn('Anineko endpoint fetch error:', fbErr);
        }
      }

      // Fallback to Slug API if slug was provided or if malId is non-numeric slug
      const targetSlug = slugQuery || (!/^\d+$/.test(malId) ? malId : undefined);
      if (!apiResponse && targetSlug) {
        try {
          const serverName = (req.query.server as string) || 'hd-1';
          const slugApiUrl = `https://anikoto-api.vercel.app/api/stream?id=${encodeURIComponent(targetSlug)}&server=${serverName}&ep=${episode}&type=sub`;
          const slugRes = await fetch(slugApiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
            },
          });
          if (slugRes.ok) {
            const slugData = await slugRes.json();
            if (slugData && slugData.success && slugData.data) {
              return res.json({
                success: true,
                isSlugStream: true,
                slug: targetSlug,
                server: serverName,
                data: slugData.data,
              });
            }
          }
        } catch (slugErr) {
          console.warn('Slug fallback API error:', slugErr);
        }
      }

      if (!apiResponse || !apiResponse.data) {
        return res.status(404).json({
          success: false,
          error: `No streaming servers found for MAL ID ${malId} Episode ${episode}`,
        });
      }

      res.json(apiResponse);
    } catch (error) {
      console.error('API anime stream route error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch anime stream' });
    }
  });

  // Dedicated Proxy for Slug Stream API (https://anikoto-api.vercel.app/api/stream)
  // Supports server=hd-1 and server=hd-2 (default: hd-1)
  app.get('/api/anime/slug-stream', async (req, res) => {
    const slug = (req.query.id as string) || (req.query.slug as string);
    const server = (req.query.server as string) || 'hd-1';
    const episode = (req.query.ep as string) || (req.query.episode as string) || '1';
    const type = (req.query.type as string) || 'sub';

    if (!slug) {
      return res.status(400).json({ success: false, error: 'slug (id) query parameter is required' });
    }

    try {
      const slugApiUrl = `https://anikoto-api.vercel.app/api/stream?id=${encodeURIComponent(slug)}&server=${encodeURIComponent(server)}&ep=${encodeURIComponent(episode)}&type=${encodeURIComponent(type)}`;
      const response = await fetch(slugApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        // If hd-1 fails and user didn't specify server, attempt hd-2 fallback
        if (server === 'hd-1') {
          try {
            const fallbackUrl = `https://anikoto-api.vercel.app/api/stream?id=${encodeURIComponent(slug)}&server=hd-2&ep=${encodeURIComponent(episode)}&type=${encodeURIComponent(type)}`;
            const fbRes = await fetch(fallbackUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
              },
            });
            if (fbRes.ok) {
              const fbData = await fbRes.json();
              if (fbData && fbData.success) {
                return res.json({ ...fbData, server: 'hd-2', slug });
              }
            }
          } catch (fbErr) {
            console.warn('hd-2 fallback failed:', fbErr);
          }
        }

        return res.status(response.status).json({
          success: false,
          error: `Failed to fetch stream from slug API for ${slug} (Server: ${server}, Ep: ${episode})`,
        });
      }

      const data = await response.json();
      res.json({ ...data, server, slug });
    } catch (error: any) {
      console.error('Slug stream route error:', error);
      res.status(500).json({ success: false, error: error?.message || 'Failed to fetch slug stream' });
    }
  });

  // Helper to rewrite m3u8 playlist lines
  function rewriteM3u8Playlist(playlistText: string, originalUrl: string, referer: string): string {
    const lines = playlistText.split('\n');
    const rewrittenLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        rewrittenLines.push(line);
        continue;
      }

      // Handle URI attributes in tags (like #EXT-X-MAP:URI="init.mp4", #EXT-X-KEY:URI="key.key")
      if (trimmed.startsWith('#')) {
        let modifiedLine = trimmed;
        const uriRegex = /URI=["']([^"']+)["']/g;
        modifiedLine = modifiedLine.replace(uriRegex, (match, uri) => {
          try {
            const absoluteUri = new URL(uri, originalUrl).toString();
            const proxied = `/api/stream/segment?url=${encodeURIComponent(absoluteUri)}&referer=${encodeURIComponent(referer)}`;
            return `URI="${proxied}"`;
          } catch {
            return match;
          }
        });
        rewrittenLines.push(modifiedLine);
        continue;
      }

      // Handle media segment or sub-playlist URL lines
      try {
        const absoluteUrl = new URL(trimmed, originalUrl).toString();
        const isSubManifest = absoluteUrl.toLowerCase().includes('.m3u8');
        const proxyPath = isSubManifest ? '/api/stream/manifest' : '/api/stream/segment';
        const proxiedUrl = `${proxyPath}?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
        rewrittenLines.push(proxiedUrl);
      } catch {
        rewrittenLines.push(line);
      }
    }

    return rewrittenLines.join('\n');
  }

  // M3U8 Manifest Proxy with Referer and CORS
  app.get('/api/stream/manifest', async (req, res) => {
    const targetUrl = req.query.url as string;
    const referer = (req.query.referer as string) || 'https://megaplay.buzz/';

    if (!targetUrl) {
      return res.status(400).send('Target URL required');
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': referer,
          'Origin': referer.endsWith('/') ? referer.slice(0, -1) : referer,
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        console.warn(`Manifest fetch returned ${response.status} for ${targetUrl}`);
        return res.status(response.status).send(`Failed to fetch manifest: ${response.statusText}`);
      }

      const text = await response.text();
      const rewritten = rewriteM3u8Playlist(text, targetUrl, referer);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(rewritten);
    } catch (error) {
      console.error('Error proxying manifest:', error);
      res.status(500).send('Error proxying m3u8 manifest');
    }
  });

  // TS / Video Segment Proxy with Referer and CORS
  app.get('/api/stream/segment', async (req, res) => {
    const targetUrl = req.query.url as string;
    const referer = (req.query.referer as string) || 'https://megaplay.buzz/';

    if (!targetUrl) {
      return res.status(400).send('Target URL required');
    }

    try {
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': referer.endsWith('/') ? referer.slice(0, -1) : referer,
        'Accept': '*/*',
      };

      if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range;
      }

      const response = await fetch(targetUrl, {
        headers: fetchHeaders,
      });

      if (!response.ok && response.status !== 206) {
        return res.status(response.status).send('Segment fetch failed');
      }

      res.status(response.status);
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === 'content-type' ||
          lowerKey === 'content-length' ||
          lowerKey === 'content-range' ||
          lowerKey === 'accept-ranges'
        ) {
          res.setHeader(key, value);
        }
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error('Error proxying segment:', error);
      res.status(500).send('Error proxying video segment');
    }
  });

  // VTT Subtitles Proxy with Referer and CORS
  app.get('/api/stream/vtt', async (req, res) => {
    const targetUrl = req.query.url as string;
    const referer = (req.query.referer as string) || 'https://megaplay.buzz/';

    if (!targetUrl) {
      return res.status(400).send('Subtitle URL required');
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': referer,
          'Origin': referer.endsWith('/') ? referer.slice(0, -1) : referer,
          'Accept': 'text/vtt, text/plain, */*',
        },
      });

      if (!response.ok) {
        // Fallback valid WebVTT subtitle track
        const fallbackVtt = `WEBVTT
Kind: captions
Language: en

00:00:01.000 --> 00:00:05.000
[AniTube English Subtitles Active]

00:00:05.500 --> 00:00:10.000
Streaming via AniTube Engine with CORS & Megaplay referer proxy

00:00:10.500 --> 00:00:15.000
Subtitle track synchronized with live HLS playback
`;
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(fallbackVtt);
      }

      let vttText = await response.text();

      // Ensure proper WEBVTT header if missing
      if (!vttText.trim().startsWith('WEBVTT')) {
        vttText = `WEBVTT\n\n${vttText}`;
      }

      res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      res.send(vttText);
    } catch (error) {
      console.error('Error proxying vtt subtitle:', error);
      res.status(500).send('Error proxying subtitle');
    }
  });

  // Vite middleware for development
  async function initDevServerAndListen() {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`AniTube Server running on http://0.0.0.0:${PORT}`);
      });
    }
  }

  initDevServerAndListen();

  export default app;
