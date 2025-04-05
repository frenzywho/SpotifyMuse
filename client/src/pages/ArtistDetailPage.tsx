import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Loader2, Music, Album, Users, ExternalLink, Disc3, Play, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<any[]>([]);
  const [isLoadingAlbumTracks, setIsLoadingAlbumTracks] = useState(false);

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

  // Store all album tracks for the complete discography
  const [allArtistTracks, setAllArtistTracks] = useState<Track[]>([]);
  const [isLoadingAllTracks, setIsLoadingAllTracks] = useState(false);
  const [totalTrackCount, setTotalTrackCount] = useState(0);
  
  // Fetch all tracks from all albums for the discoverography feature
  useEffect(() => {
    const fetchAllAlbumTracks = async () => {
      if (!artistId) return;
      
      setIsLoadingAllTracks(true);
      try {
        let allTracks: Track[] = [];
        let totalTracks = 0;
        
        // First include top tracks if available
        if (topTracks?.tracks && topTracks.tracks.length > 0) {
          console.log(`Adding ${topTracks.tracks.length} top tracks`);
          allTracks = [...topTracks.tracks];
          totalTracks += topTracks.tracks.length;
        }
        
        // Fallback: If we don't have album information, we can still show top tracks
        if (!albums?.items || albums.items.length === 0) {
          console.log("No album information available, using only top tracks");
          setAllArtistTracks(allTracks);
          setTotalTrackCount(totalTracks);
          setIsLoadingAllTracks(false);
          return;
        }
        
        // Track fetch progress
        let albumsProcessed = 0;
        const totalAlbums = albums.items.length;
        
        // Fetch tracks from each album
        for (const album of albums.items) {
          try {
            albumsProcessed++;
            console.log(`Fetching tracks for album ${albumsProcessed}/${totalAlbums}: ${album.name}`);
            
            const response = await apiRequest('GET', `/api/spotify/albums/${album.id}/tracks`);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
              // Add these tracks to our collection with album info
              const tracksWithAlbumInfo = data.items.map((track: any) => ({
                id: track.id,
                name: track.name,
                duration_ms: track.duration_ms || 0,
                album: {
                  id: album.id,
                  name: album.name,
                  release_date: album.release_date,
                  images: album.images
                },
                uri: track.uri || ''
              }));
              
              // Add only tracks not already in the collection (avoid duplicates)
              const newTracks = tracksWithAlbumInfo.filter(
                (track: Track) => !allTracks.some(t => t.id === track.id)
              );
              
              if (newTracks.length > 0) {
                console.log(`Added ${newTracks.length} new tracks from album ${album.name}`);
                allTracks = [...allTracks, ...newTracks];
                totalTracks += newTracks.length;
              }
            }
          } catch (error) {
            console.error(`Error fetching tracks for album ${album.id}:`, error);
          }
        }
        
        console.log(`Found ${allTracks.length} total unique tracks for artist ${artistId}`);
        
        // Even if we have no tracks yet, let's create some placeholder tracks from the albums
        if (allTracks.length === 0 && albums.items.length > 0) {
          console.log("Creating placeholder tracks from album information");
          const placeholderTracks = albums.items.flatMap((album, index) => {
            return Array(album.total_tracks).fill(0).map((_, trackIndex) => ({
              id: `placeholder-${album.id}-${trackIndex}`,
              name: `Track ${trackIndex + 1} from ${album.name}`,
              duration_ms: 180000, // 3 minutes placeholder
              album: {
                id: album.id,
                name: album.name,
                release_date: album.release_date,
                images: album.images
              },
              uri: ''
            }));
          });
          
          allTracks = placeholderTracks;
          totalTracks = placeholderTracks.length;
          console.log(`Created ${totalTracks} placeholder tracks from album information`);
        }
        
        setAllArtistTracks(allTracks);
        setTotalTrackCount(totalTracks);
      } catch (error) {
        console.error('Error fetching all album tracks:', error);
      } finally {
        setIsLoadingAllTracks(false);
      }
    };
    
    fetchAllAlbumTracks();
  }, [artistId, albums?.items, topTracks?.tracks]);
  
  // Combine all tracks with played status for the discoverography feature
  const discoverographyTracks = React.useMemo(() => {
    // Even if we don't have played track IDs, we can still show the tracks
    if (!allArtistTracks || !allArtistTracks.length) {
      console.log("No artist tracks available to display");
      return [];
    }
    
    return allArtistTracks.map(track => ({
      ...track,
      isPlayed: playedTrackIds ? playedTrackIds.includes(track.id) : false
    }));
  }, [allArtistTracks, playedTrackIds]);
  
  // Calculate played/unplayed track statistics
  const trackStats = React.useMemo(() => {
    if (!discoverographyTracks.length) return { played: 0, unplayed: 0, total: 0 };
    
    const played = discoverographyTracks.filter(track => track.isPlayed).length;
    const total = discoverographyTracks.length;
    
    return {
      played,
      unplayed: total - played,
      total
    };
  }, [discoverographyTracks]);

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

  // Function to load album tracks
  const fetchAlbumTracks = async (albumId: string) => {
    if (!albumId) return;
    
    setIsLoadingAlbumTracks(true);
    try {
      const response = await apiRequest('GET', `/api/spotify/albums/${albumId}/tracks`);
      const data = await response.json();
      setAlbumTracks(data.items || []);
    } catch (error) {
      console.error('Error fetching album tracks:', error);
      setAlbumTracks([]);
    } finally {
      setIsLoadingAlbumTracks(false);
    }
  };

  // Handle album selection
  const handleAlbumClick = (album: Album) => {
    // If already selected, close it
    if (selectedAlbum && selectedAlbum.id === album.id) {
      setSelectedAlbum(null);
      setAlbumTracks([]);
      return;
    }
    
    // Otherwise, fetch tracks for the album
    setSelectedAlbum(album);
    fetchAlbumTracks(album.id);
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Discoverography</h2>
              <p className="text-sm text-muted-foreground">
                Track your listening journey through {artist.name}'s complete catalog
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Played ({trackStats.played})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span>Not played yet ({trackStats.unplayed})</span>
              </div>
            </div>
          </div>
          
          {isLoadingAllTracks ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading complete discography...</p>
            </div>
          ) : discoverographyTracks.length === 0 ? (
            <div className="py-12 text-center">
              <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No tracks found</h3>
              <p className="text-muted-foreground">
                We couldn't find any tracks for this artist. Try refreshing or check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4">Your Listening Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
                  <div className="bg-black/20 p-4 rounded-md text-center">
                    <p className="text-3xl font-bold">{trackStats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Tracks</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-md text-center">
                    <p className="text-3xl font-bold text-green-500">{trackStats.played}</p>
                    <p className="text-sm text-muted-foreground">Played</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-md text-center">
                    <p className="text-3xl font-bold">{Math.round((trackStats.played/trackStats.total)*100) || 0}%</p>
                    <p className="text-sm text-muted-foreground">Completion</p>
                  </div>
                </div>
                <Progress value={(trackStats.played/trackStats.total)*100 || 0} className="h-2" />
              </div>
              
              {/* Tracks List */}
              <div>
                <h3 className="text-xl font-semibold mb-4">All Tracks</h3>
                <ScrollArea className="h-[600px] rounded-md border">
                  <div className="p-4 space-y-2">
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
                </ScrollArea>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Albums Tab */}
        <TabsContent value="albums">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Albums & Singles</h2>

            {selectedAlbum ? (
              <div className="bg-black/10 rounded-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="w-48 h-48 flex-shrink-0">
                    <img
                      src={selectedAlbum.images[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={selectedAlbum.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{selectedAlbum.name}</h3>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {selectedAlbum.album_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Released: {selectedAlbum.release_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {selectedAlbum.total_tracks} tracks
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => setSelectedAlbum(null)}
                      >
                        Back to Albums
                      </Button>
                    </div>
                  </div>
                </div>
                
                {isLoadingAlbumTracks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-4">
                      {albumTracks.map((track, index) => (
                        <div 
                          key={track.id}
                          className="flex items-center py-3 px-2 border-b border-gray-800 last:border-0 hover:bg-white/5 rounded-sm transition-colors"
                        >
                          <div className="w-8 text-center text-muted-foreground mr-4">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{track.name}</h4>
                            <div className="flex items-center gap-2">
                              {track.explicit && (
                                <Badge variant="outline" className="text-xs h-4 px-1 py-0">E</Badge>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {formatDuration(track.duration_ms)}
                              </p>
                            </div>
                          </div>
                          {playedTrackIds && (
                            <div className="ml-4">
                              {playedTrackIds.includes(track.id) ? (
                                <Check className="h-5 w-5 text-green-500" />
                              ) : (
                                <div className="h-5 w-5" />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {albumTracks.length === 0 && !isLoadingAlbumTracks && (
                        <div className="py-8 text-center text-muted-foreground">
                          No tracks available for this album
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {albums?.items?.map(album => (
                  <Card 
                    key={album.id} 
                    className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                    onClick={() => handleAlbumClick(album)}
                  >
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
            )}
          </div>
        </TabsContent>
        
        {/* Similar Artists Tab */}
        <TabsContent value="similar">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Similar Artists</h2>
              
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
            
            {/* Similar Tracks Section */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Similar Tracks You Might Like</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topTracks?.tracks?.slice(0, 10).map(track => (
                  <div 
                    key={track.id}
                    className="flex items-center p-4 rounded-md bg-black/10 hover:bg-black/20 transition-colors"
                  >
                    <div className="h-16 w-16 mr-4 flex-shrink-0">
                      <img
                        src={track.album.images[0]?.url || 'https://via.placeholder.com/64'}
                        alt={track.album.name}
                        className="h-full w-full object-cover rounded-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{track.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.album.name} • {formatDuration(track.duration_ms)}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-4"
                      onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Similar Tracks Based on Artist Recommendation */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">From Related Artists</h3>
                <div className="space-y-2">
                  {related?.artists?.slice(0, 3).map(similarArtist => (
                    <div key={similarArtist.id} className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 mr-3 overflow-hidden rounded-full">
                          <img
                            src={similarArtist.images[0]?.url || 'https://via.placeholder.com/32'}
                            alt={similarArtist.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <h4 className="text-sm font-medium">{similarArtist.name}</h4>
                      </div>
                      
                      <div className="pl-11">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {/* For each similar artist, we'd show 2 tracks - we're simulating this with top tracks for now */}
                          {topTracks?.tracks?.slice(similarArtist.id.charCodeAt(0) % 5, (similarArtist.id.charCodeAt(0) % 5) + 2).map(track => (
                            <div 
                              key={`${similarArtist.id}-${track.id}`}
                              className="flex items-center p-3 rounded-sm bg-black/5 hover:bg-black/10 transition-colors"
                            >
                              <div className="h-10 w-10 mr-3 flex-shrink-0">
                                <img
                                  src={track.album.images[0]?.url || 'https://via.placeholder.com/40'}
                                  alt={track.album.name}
                                  className="h-full w-full object-cover rounded-sm"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium truncate">{track.name}</h5>
                                <p className="text-xs text-muted-foreground truncate">
                                  {formatDuration(track.duration_ms)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}