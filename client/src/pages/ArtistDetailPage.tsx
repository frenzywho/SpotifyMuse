import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Loader2, Music, Album, Users, ExternalLink, Disc3, Play, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';

interface ArtistDetails {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  followers: { total: number };
  popularity: number;
  external_urls: { spotify: string };
}

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  album: {
    id: string;
    name: string;
    release_date: string;
    images: { url: string }[];
  };
  uri: string;
  isPlayed?: boolean;
}

interface Album {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  total_tracks: number;
  images: { url: string }[];
  external_urls: { spotify: string };
}

interface RelatedArtist {
  id: string;
  name: string;
  images: { url: string }[];
  popularity: number;
}

export default function ArtistDetailPage() {
  const [, params] = useRoute('/artist/:id');
  const [, navigate] = useLocation();
  const artistId = params?.id;
  const [selectedTab, setSelectedTab] = useState('discoverography');

  // Fetch artist details
  const { data: artist, isLoading: artistLoading } = useQuery<ArtistDetails>({
    queryKey: [`/api/spotify/artists/${artistId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/artists/${artistId}`);
      return response.json();
    },
    enabled: !!artistId,
  });

  // Fetch artist top tracks
  const { data: topTracks, isLoading: tracksLoading } = useQuery<{ tracks: Track[] }>({
    queryKey: [`/api/spotify/artists/${artistId}/top-tracks`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/artists/${artistId}/top-tracks`);
      return response.json();
    },
    enabled: !!artistId,
  });

  // Fetch artist albums
  const { data: albums, isLoading: albumsLoading } = useQuery<{ items: Album[] }>({
    queryKey: [`/api/spotify/artists/${artistId}/albums`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/artists/${artistId}/albums`);
      return response.json();
    },
    enabled: !!artistId,
  });

  // Fetch related artists
  const { data: related, isLoading: relatedLoading } = useQuery<{ artists: RelatedArtist[] }>({
    queryKey: [`/api/spotify/artists/${artistId}/related-artists`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/artists/${artistId}/related-artists`);
      return response.json();
    },
    enabled: !!artistId,
  });

  // Fetch user's played tracks for this artist
  const { data: playedTrackIds, isLoading: playedLoading } = useQuery<string[]>({
    queryKey: [`/api/spotify/me/played-tracks/artist/${artistId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/me/played-tracks/artist/${artistId}`);
      return response.json();
    },
    enabled: !!artistId,
  });

  // Combine top tracks with played status for the discoverography feature
  const discoverographyTracks = React.useMemo(() => {
    if (!topTracks?.tracks || !playedTrackIds) return [];
    
    return topTracks.tracks.map(track => ({
      ...track,
      isPlayed: playedTrackIds.includes(track.id)
    }));
  }, [topTracks?.tracks, playedTrackIds]);

  // Create a playlist with this artist's tracks
  const handleCreatePlaylist = () => {
    if (!artistId || !artist) return;
    navigate(`/create-playlist/artist?id=${artistId}&name=${encodeURIComponent(artist.name)}`);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const isLoading = artistLoading || tracksLoading || albumsLoading || relatedLoading || playedLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold">Artist not found</h2>
        <p className="mt-4 text-muted-foreground">
          The artist you're looking for doesn't exist or there was an error loading their information.
        </p>
        <Button className="mt-8" onClick={() => navigate('/')}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Artist Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
            <img 
              src={artist.images[0]?.url || 'https://via.placeholder.com/300?text=No+Image'} 
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {artist.genres.slice(0, 5).map(genre => (
              <Badge key={genre} variant="secondary" className="capitalize">
                {genre}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-6 mb-6 text-muted-foreground">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>{formatNumber(artist.followers.total)} followers</span>
            </div>
            <div className="flex items-center">
              <Music className="w-4 h-4 mr-2" />
              <span>Popularity: {artist.popularity}/100</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleCreatePlaylist}>
              <Play className="mr-2 h-4 w-4" /> Create Playlist
            </Button>
            <Button variant="outline" asChild>
              <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open in Spotify
              </a>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="discoverography">Discoverography</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="similar">Similar Artists</TabsTrigger>
        </TabsList>
        
        {/* Discoverography Tab */}
        <TabsContent value="discoverography" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Discoverography</h2>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Played</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span>Not played yet</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {discoverographyTracks.map((track) => (
              <div 
                key={track.id} 
                className={`flex items-center p-4 rounded-md ${track.isPlayed ? 'bg-green-500/10 hover:bg-green-500/20' : 'bg-gray-500/10 hover:bg-gray-500/20'} transition-colors`}
              >
                <div className="mr-4">
                  {track.isPlayed ? (
                    <Check className="h-6 w-6 text-green-500" />
                  ) : (
                    <Disc3 className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                <div className="h-10 w-10 mr-4">
                  <img
                    src={track.album.images[0]?.url || 'https://via.placeholder.com/40'}
                    alt={track.album.name}
                    className="h-full w-full object-cover rounded-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{track.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.album.name} • {track.album.release_date?.slice(0, 4) || ''}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground ml-4">
                  {formatDuration(track.duration_ms)}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Albums Tab */}
        <TabsContent value="albums">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Albums & Singles</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {albums?.items?.map(album => (
                <Card key={album.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={album.images[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={album.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{album.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {album.album_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {album.release_date?.slice(0, 4)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {album.total_tracks} tracks
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        {/* Similar Artists Tab */}
        <TabsContent value="similar">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Similar Artists</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {related?.artists?.map(artist => (
                <Card 
                  key={artist.id} 
                  className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/artist/${artist.id}`)}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={artist.images[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={artist.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{artist.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Popularity: {artist.popularity}/100
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}