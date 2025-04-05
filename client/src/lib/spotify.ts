import { apiRequest } from './queryClient';

export interface SpotifyUser {
  id: number;
  spotifyId: string;
  displayName: string | null;
  email: string | null;
  imageUrl: string | null;
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
}

export interface SpotifyPlaylist {
  id: number;
  spotifyId: string;
  userId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  type: 'genre' | 'artist' | 'mood' | 'must-listen' | 'replay' | 'daily';
  metadata: {
    totalTracks?: number;
    totalDurationMin?: number;
    genres?: string[];
    artists?: Array<{ id: string; name: string }>;
    mood?: string;
    [key: string]: any;
  };
}

export interface DailyRecommendation {
  name: string;
  description: string;
  tracks: SpotifyTrack[];
}

// Get the current user
export const getCurrentUser = async (): Promise<SpotifyUser> => {
  const response = await fetch('/api/user', { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to get current user');
  }
  return response.json();
};

// Logout the user
export const logout = async (): Promise<void> => {
  await apiRequest('GET', '/api/auth/logout');
};

// Get recent playlists
export const getRecentPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  const response = await fetch('/api/playlists/recent', { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to get recent playlists');
  }
  return response.json();
};

// Get all playlists
export const getAllPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  const response = await fetch('/api/playlists', { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to get all playlists');
  }
  return response.json();
};

// Get daily recommendations
export const getDailyRecommendations = async (): Promise<DailyRecommendation> => {
  const response = await fetch('/api/spotify/recommendations/daily', { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to get daily recommendations');
  }
  return response.json();
};

// Get available genres
export const getAvailableGenres = async (): Promise<{ genres: string[] }> => {
  const response = await fetch('/api/spotify/genres', { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to get available genres');
  }
  return response.json();
};

// Search for artists
export const searchArtists = async (query: string): Promise<any> => {
  const response = await fetch(`/api/spotify/search/artists?q=${encodeURIComponent(query)}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to search artists');
  }
  return response.json();
};
