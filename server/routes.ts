import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import axios from "axios";
import { z } from "zod";
import { insertUserSchema, insertPlaylistSchema } from "@shared/schema";
import MemoryStore from "memorystore";

// Extend the express-session types to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "spotify-playlist-generator-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // 24 hours
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000 // 24 hours
    }
  }));

  // Spotify OAuth endpoints
  app.get("/api/auth/login", (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    
    // Use Replit's environment variables to build the redirect URI
    let redirectUri;
    if (process.env.REPLIT_DEV_DOMAIN) {
      // When running on Replit
      redirectUri = `https://${process.env.REPLIT_DEV_DOMAIN}/callback`;
    } else {
      // Local development fallback
      redirectUri = 'http://localhost:5000/callback';
    }
    
    const scope = "user-read-private user-read-email playlist-modify-public playlist-modify-private user-top-read user-read-recently-played";
    
    console.log(`Using redirect URI for login: ${redirectUri}`); // Log the redirectUri for debugging
    
    res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`);
  });

  // Handle the callback route from Spotify
  app.get("/callback", async (req, res) => {
    // Redirect to the actual API endpoint
    res.redirect(`/api/auth/callback${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`);
  });

  app.get("/api/auth/callback", async (req, res) => {
    const code = req.query.code as string;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // Use Replit's environment variables to build the redirect URI (must match login URI exactly)
    let redirectUri;
    if (process.env.REPLIT_DEV_DOMAIN) {
      // When running on Replit
      redirectUri = `https://${process.env.REPLIT_DEV_DOMAIN}/callback`;
    } else {
      // Local development fallback
      redirectUri = 'http://localhost:5000/callback';
    }
    
    console.log(`Callback received with code: ${code ? 'Code present' : 'No code'}`);
    console.log(`Using redirect URI for token exchange: ${redirectUri}`);

    if (!code) {
      return res.status(400).json({ message: "Authorization code not provided" });
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Get user profile information
      const userResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const userData = userResponse.data;
      
      // Check if user already exists
      let user = await storage.getUserBySpotifyId(userData.id);
      
      if (user) {
        // Update tokens
        user = await storage.updateUserTokens(
          userData.id,
          access_token,
          refresh_token,
          expiresAt
        );
      } else {
        // Create new user
        user = await storage.createUser({
          spotifyId: userData.id,
          displayName: userData.display_name,
          email: userData.email,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          imageUrl: userData.images?.length > 0 ? userData.images[0].url : null,
        });
      }

      // Set the user in the session
      if (user && user.id) {
        req.session.userId = user.id;
        console.log(`User authenticated successfully. User ID: ${user.id}`);
      } else {
        console.error('Authentication successful but user object is invalid');
        return res.status(500).json({ message: "Authentication failed - invalid user data" });
      }
      
      // Redirect back to the frontend
      res.redirect('/');
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // User info endpoint
  app.get("/api/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data without sensitive information
      const safeUser = {
        id: user.id,
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        email: user.email,
        imageUrl: user.imageUrl
      };

      res.json(safeUser);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });

  // Artist details endpoints
  app.get("/api/spotify/artists/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const artistId = req.params.id;
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Get artist error:', error);
      res.status(500).json({ message: "Failed to get artist details" });
    }
  });
  
  app.get("/api/spotify/artists/:id/top-tracks", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const artistId = req.params.id;
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Get artist top tracks error:', error);
      res.status(500).json({ message: "Failed to get artist top tracks" });
    }
  });
  
  app.get("/api/spotify/artists/:id/albums", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const artistId = req.params.id;
    const includeGroups = req.query.include_groups as string || 'album,single';
    const limit = parseInt(req.query.limit as string) || 50;
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=${includeGroups}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Get artist albums error:', error);
      res.status(500).json({ message: "Failed to get artist albums" });
    }
  });
  
  app.get("/api/spotify/artists/:id/related-artists", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const artistId = req.params.id;
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Get related artists error:', error);
      res.status(500).json({ message: "Failed to get related artists" });
    }
  });
  
  // Get album tracks
  app.get("/api/spotify/albums/:id/tracks", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const albumId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 50;
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const response = await axios.get(
        `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Get album tracks error:', error);
      res.status(500).json({ message: "Failed to get album tracks" });
    }
  });
  
  // Get user's played tracks for an artist (for the discoverography feature)
  app.get("/api/spotify/me/played-tracks/artist/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const artistId = req.params.id;
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      // Get user's recently played tracks
      const recentResponse = await axios.get(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      // Get user's top tracks
      const topResponse = await axios.get(
        "https://api.spotify.com/v1/me/top/tracks?limit=50",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      // Filter tracks by the specified artist
      const recentTracks = recentResponse.data.items
        .filter((item: any) => item.track.artists.some((artist: any) => artist.id === artistId))
        .map((item: any) => item.track.id);
      
      const topTracks = topResponse.data.items
        .filter((track: any) => track.artists.some((artist: any) => artist.id === artistId))
        .map((track: any) => track.id);
      
      // Combine all tracks (removing duplicates)
      const playedTrackIds = [...new Set([...recentTracks, ...topTracks])];
      
      res.json(playedTrackIds);
    } catch (error) {
      console.error('Get played tracks error:', error);
      res.status(500).json({ message: "Failed to get played tracks" });
    }
  });
  
  // Refresh tokens when needed
  async function refreshAccessToken(userId: number) {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    // Check if token needs refreshing
    if (user.expiresAt > new Date()) {
      return user.accessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: user.refreshToken,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Update user tokens
      const refreshToken = refresh_token || user.refreshToken;
      const updatedUser = await storage.updateUserTokens(
        user.spotifyId,
        access_token,
        refreshToken,
        expiresAt
      );

      return access_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  // Playlist endpoints
  app.get("/api/playlists/recent", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const playlists = await storage.getRecentPlaylistsByUserId(req.session.userId, 5);
      res.json(playlists);
    } catch (error) {
      console.error('Get recent playlists error:', error);
      res.status(500).json({ message: "Failed to get recent playlists" });
    }
  });

  app.get("/api/playlists", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const playlists = await storage.getPlaylistsByUserId(req.session.userId);
      res.json(playlists);
    } catch (error) {
      console.error('Get playlists error:', error);
      res.status(500).json({ message: "Failed to get playlists" });
    }
  });

  // Spotify API proxy endpoints
  app.get("/api/spotify/recommendations/daily", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Get a fresh access token
      const accessToken = await refreshAccessToken(req.session.userId);
      
      // Get user's top tracks to base recommendations on
      const topTracksResponse = await axios.get(
        "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      const topTrackIds = topTracksResponse.data.items.map((track: any) => track.id);
      
      if (topTrackIds.length === 0) {
        // Fallback to recent tracks if no top tracks available
        const recentTracksResponse = await axios.get(
          "https://api.spotify.com/v1/me/player/recently-played?limit=5",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        const recentTrackIds = recentTracksResponse.data.items.map((item: any) => item.track.id);
        
        if (recentTrackIds.length === 0) {
          return res.status(404).json({ message: "No tracks found to base recommendations on" });
        }
        
        // Use recent tracks for seed
        const recommendationsResponse = await axios.get(
          `https://api.spotify.com/v1/recommendations?seed_tracks=${recentTrackIds.slice(0, 5).join(",")}&limit=20`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        return res.json({
          name: "Your Daily Spark",
          description: "Based on your recent listening",
          tracks: recommendationsResponse.data.tracks
        });
      }
      
      // Get recommendations based on top tracks
      const recommendationsResponse = await axios.get(
        `https://api.spotify.com/v1/recommendations?seed_tracks=${topTrackIds.join(",")}&limit=20`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json({
        name: "Your Daily Spark",
        description: "Based on what you've been enjoying lately",
        tracks: recommendationsResponse.data.tracks
      });
    } catch (error) {
      console.error('Get daily recommendations error:', error);
      res.status(500).json({ message: "Failed to get daily recommendations" });
    }
  });

  // Genre-based recommendations
  app.get("/api/spotify/genres", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const response = await axios.get(
        "https://api.spotify.com/v1/recommendations/available-genre-seeds",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Get genres error:', error);
      res.status(500).json({ message: "Failed to get available genres" });
    }
  });

  app.post("/api/spotify/recommendations/genre", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      genres: z.array(z.string()).min(1).max(5),
      tempo: z.number().optional(),
      popularity: z.number().optional(),
      acousticness: z.number().optional(),
      danceability: z.number().optional(),
      energy: z.number().optional(),
      limit: z.number().min(1).max(100).default(20)
    });
    
    try {
      const data = schema.parse(req.body);
      const accessToken = await refreshAccessToken(req.session.userId);
      
      let queryParams = new URLSearchParams();
      queryParams.append('seed_genres', data.genres.join(','));
      queryParams.append('limit', data.limit.toString());
      
      if (data.tempo) queryParams.append('target_tempo', data.tempo.toString());
      if (data.popularity) queryParams.append('target_popularity', data.popularity.toString());
      if (data.acousticness) queryParams.append('target_acousticness', data.acousticness.toString());
      if (data.danceability) queryParams.append('target_danceability', data.danceability.toString());
      if (data.energy) queryParams.append('target_energy', data.energy.toString());
      
      const response = await axios.get(
        `https://api.spotify.com/v1/recommendations?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Genre recommendations error:', error);
      res.status(500).json({ message: "Failed to get genre recommendations" });
    }
  });

  // Comprehensive search functionality
  app.get("/api/spotify/search", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const type = req.query.type as string || 'track,artist,album';
    const limit = parseInt(req.query.limit as string) || 20;
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: "Failed to search Spotify" });
    }
  });
  
  // Legacy endpoint - Artist search (kept for backward compatibility)
  app.get("/api/spotify/search/artists", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      res.json(response.data.artists);
    } catch (error) {
      console.error('Artist search error:', error);
      res.status(500).json({ message: "Failed to search artists" });
    }
  });

  app.post("/api/spotify/recommendations/artist", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      artistIds: z.array(z.string()).min(1).max(5),
      includeTopTracks: z.boolean().default(true),
      includeRelatedArtists: z.boolean().default(true),
      limit: z.number().min(1).max(100).default(20)
    });
    
    try {
      const data = schema.parse(req.body);
      const accessToken = await refreshAccessToken(req.session.userId);
      
      let results: any = { tracks: [] };
      
      // Get recommendations based on artist
      const recommendationsResponse = await axios.get(
        `https://api.spotify.com/v1/recommendations?seed_artists=${data.artistIds.slice(0, 5).join(",")}&limit=${data.limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      results.tracks = [...recommendationsResponse.data.tracks];
      
      // If requested, add artist's top tracks
      if (data.includeTopTracks) {
        for (const artistId of data.artistIds.slice(0, 5)) {
          const topTracksResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          
          // Add top tracks, avoiding duplicates
          const newTracks = topTracksResponse.data.tracks.filter(
            (track: any) => !results.tracks.some((t: any) => t.id === track.id)
          );
          
          results.tracks = [...results.tracks, ...newTracks];
        }
      }
      
      // If requested, add tracks from related artists
      if (data.includeRelatedArtists && data.artistIds.length > 0) {
        const relatedArtistsResponse = await axios.get(
          `https://api.spotify.com/v1/artists/${data.artistIds[0]}/related-artists`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        const relatedArtistIds = relatedArtistsResponse.data.artists
          .slice(0, 3) // Limit to 3 related artists
          .map((artist: any) => artist.id);
        
        for (const artistId of relatedArtistIds) {
          const topTracksResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          
          // Add a few top tracks per related artist, avoiding duplicates
          const newTracks = topTracksResponse.data.tracks
            .slice(0, 3) // Take only 3 tracks per related artist
            .filter((track: any) => !results.tracks.some((t: any) => t.id === track.id));
          
          results.tracks = [...results.tracks, ...newTracks];
        }
      }
      
      // Limit total tracks to requested limit
      results.tracks = results.tracks.slice(0, data.limit);
      
      res.json(results);
    } catch (error) {
      console.error('Artist recommendations error:', error);
      res.status(500).json({ message: "Failed to get artist recommendations" });
    }
  });

  // Mood-based recommendations
  app.post("/api/spotify/recommendations/mood", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      mood: z.enum(["happy", "chill", "energetic", "romantic", "dreamy", "angry"]),
      genre: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      duration: z.number().min(15).max(180).default(60) // Duration in minutes
    });
    
    try {
      const data = schema.parse(req.body);
      const accessToken = await refreshAccessToken(req.session.userId);
      
      // Map moods to audio features
      const moodFeatures: Record<string, any> = {
        happy: { valence: 0.8, energy: 0.7, danceability: 0.7 },
        chill: { valence: 0.5, energy: 0.4, acousticness: 0.7 },
        energetic: { energy: 0.9, tempo: 150, danceability: 0.8 },
        romantic: { valence: 0.6, energy: 0.4, acousticness: 0.6 },
        dreamy: { valence: 0.5, energy: 0.3, acousticness: 0.7 },
        angry: { valence: 0.2, energy: 0.9, tempo: 140 }
      };
      
      let queryParams = new URLSearchParams();
      
      // Add mood-specific features
      for (const [feature, value] of Object.entries(moodFeatures[data.mood])) {
        queryParams.append(`target_${feature}`, value.toString());
      }
      
      // If genre is specified, use it as seed
      if (data.genre) {
        queryParams.append('seed_genres', data.genre);
      } else {
        // Otherwise get user's top genres from their top artists
        const topArtistsResponse = await axios.get(
          "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        // Extract genres from top artists
        let genres = new Set<string>();
        topArtistsResponse.data.items.forEach((artist: any) => {
          artist.genres.forEach((genre: string) => genres.add(genre));
        });
        
        // Get available genre seeds
        const genreSeedsResponse = await axios.get(
          "https://api.spotify.com/v1/recommendations/available-genre-seeds",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        const availableGenres = new Set(genreSeedsResponse.data.genres);
        
        // Find overlapping genres (user's genres that are available as seeds)
        const seedGenres = [...genres].filter(genre => availableGenres.has(genre)).slice(0, 2);
        
        if (seedGenres.length > 0) {
          queryParams.append('seed_genres', seedGenres.join(','));
        } else {
          // Fallback to top artist IDs as seeds if no matching genres
          const artistIds = topArtistsResponse.data.items.map((artist: any) => artist.id).slice(0, 3);
          queryParams.append('seed_artists', artistIds.join(','));
        }
      }
      
      // Add limit
      queryParams.append('limit', data.limit.toString());
      
      const response = await axios.get(
        `https://api.spotify.com/v1/recommendations?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      // Calculate playlist metadata
      const tracks = response.data.tracks;
      let totalDurationMs = tracks.reduce((sum: number, track: any) => sum + track.duration_ms, 0);
      const totalDurationMin = Math.round(totalDurationMs / 60000);
      
      res.json({
        tracks,
        metadata: {
          mood: data.mood,
          genre: data.genre,
          totalTracks: tracks.length,
          totalDurationMin: totalDurationMin
        }
      });
    } catch (error) {
      console.error('Mood recommendations error:', error);
      res.status(500).json({ message: "Failed to get mood recommendations" });
    }
  });

  // Must-listen recommendations
  app.get("/api/spotify/recommendations/must-listen", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const accessToken = await refreshAccessToken(req.session.userId);
      
      // Get user's saved tracks (liked but maybe not listened to recently)
      const savedTracksResponse = await axios.get(
        "https://api.spotify.com/v1/me/tracks?limit=50",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      // Get user's top artists to find their preferred genres
      const topArtistsResponse = await axios.get(
        "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=10",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      // Extract genres from top artists
      let topGenres = new Set<string>();
      topArtistsResponse.data.items.forEach((artist: any) => {
        artist.genres.forEach((genre: string) => topGenres.add(genre));
      });
      
      // Get recommendations based on top 2 artists
      const topArtistIds = topArtistsResponse.data.items.slice(0, 2).map((artist: any) => artist.id);
      const recommendationsResponse = await axios.get(
        `https://api.spotify.com/v1/recommendations?seed_artists=${topArtistIds.join(",")}&limit=20`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      // Combine tracks we want to highlight
      let mustListenTracks = [];
      
      // Add saved tracks that haven't been listened to recently (first 5)
      if (savedTracksResponse.data.items.length > 0) {
        mustListenTracks = [...savedTracksResponse.data.items.slice(0, 5).map((item: any) => item.track)];
      }
      
      // Add popular tracks in user's preferred genres (from recommendations)
      const newTracks = recommendationsResponse.data.tracks
        .filter((track: any) => !mustListenTracks.some((t: any) => t.id === track.id))
        .slice(0, 15);
      
      mustListenTracks = [...mustListenTracks, ...newTracks];
      
      res.json({
        name: "Your Must-Listen Mix",
        description: "Tracks we think you'll love based on your taste",
        tracks: mustListenTracks
      });
    } catch (error) {
      console.error('Must-listen recommendations error:', error);
      res.status(500).json({ message: "Failed to get must-listen recommendations" });
    }
  });

  // Create playlist in Spotify
  app.post("/api/spotify/playlists", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      trackUris: z.array(z.string()).min(1),
      type: z.enum(["genre", "artist", "mood", "must-listen", "replay"]),
      metadata: z.record(z.any()).optional()
    });
    
    try {
      const data = schema.parse(req.body);
      const accessToken = await refreshAccessToken(req.session.userId);
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a playlist
      const createPlaylistResponse = await axios.post(
        `https://api.spotify.com/v1/users/${user.spotifyId}/playlists`,
        {
          name: data.name,
          description: data.description || `Generated by SpotGen - ${new Date().toLocaleDateString()}`,
          public: true
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      const playlistId = createPlaylistResponse.data.id;
      
      // Add tracks to the playlist
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          uris: data.trackUris
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      // Save playlist to our database
      const playlist = await storage.createPlaylist({
        userId: user.id,
        spotifyId: playlistId,
        name: data.name,
        description: data.description,
        imageUrl: createPlaylistResponse.data.images?.[0]?.url,
        type: data.type,
        metadata: data.metadata
      });
      
      res.json(playlist);
    } catch (error) {
      console.error('Create playlist error:', error);
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
