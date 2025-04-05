import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Disc, Disc3, Users2, Music, Calendar, Loader2, 
  Check, Clock, Headphones, Play, ExternalLink
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
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
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch artist details
  const { data: artist, isLoading: artistLoading } = useQuery<ArtistDetails>({
    queryKey: [`/api/spotify/artists/${id}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/artists/${id}`);
      return await response.json();
    },
  });
  
  // Fetch top tracks
  const { data: topTracks, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: [`/api/spotify/artists/${id}/top-tracks`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/artists/${id}/top-tracks`);
      const data = await response.json();
      return data.tracks;
    },
  });
  
  // Fetch albums
  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: [`/api/spotify/artists/${id}/albums`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/artists/${id}/albums?include_groups=album,single&limit=50`);
      const data = await response.json();
      return data.items;
    },
  });
  
  // Fetch related artists
  const { data: relatedArtists, isLoading: relatedLoading } = useQuery<RelatedArtist[]>({
    queryKey: [`/api/spotify/artists/${id}/related-artists`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/spotify/artists/${id}/related-artists`);
      const data = await response.json();
      return data.artists;
    },
  });
  
  // Fetch user's played tracks for this artist (to support the discoverography feature)
  const { data: playedTracks, isLoading: playedLoading } = useQuery<string[]>({
    queryKey: [`/api/spotify/me/played-tracks/artist/${id}`],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/spotify/me/played-tracks/artist/${id}`);
        return await response.json();
      } catch (error) {
        console.error("Error fetching played tracks:", error);
        return [];
      }
    },
  });
  
  // Generate a playlist based on this artist
  const handleGeneratePlaylist = async () => {
    toast({
      title: "Creating playlist...",
      description: "Generating a personalized playlist based on this artist",
    });
    
    try {
      const response = await apiRequest('POST', `/api/spotify/recommendations/artist`, {
        artistIds: [id],
        includeTopTracks: true,
        includeRelatedArtists: true,
        limit: 30
      });
      
      const result = await response.json();
      
      toast({
        title: "Playlist created!",
        description: `Created a playlist with ${result.tracks.length} tracks based on ${artist?.name}`,
      });
      
      // Redirect to the playlist details page in the future
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Error creating playlist",
        description: "There was a problem generating your playlist. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const formatReleaseDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const isTrackPlayed = (trackId: string) => {
    return playedTracks?.includes(trackId) || false;
  };
  
  const calculatePlayedPercentage = (albumTracks: Track[]) => {
    if (!albumTracks || albumTracks.length === 0 || !playedTracks) return 0;
    const played = albumTracks.filter(track => isTrackPlayed(track.id)).length;
    return Math.round((played / albumTracks.length) * 100);
  };
  
  const isLoading = artistLoading || tracksLoading || albumsLoading || relatedLoading || playedLoading;
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!artist) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Artist not found</h1>
        <p className="text-muted-foreground mb-6">The requested artist could not be loaded.</p>
        <Button onClick={() => setLocation('/search')}>Back to Search</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Artist Header */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-lg">
          <img 
            src={artist.images[0]?.url || 'https://via.placeholder.com/300'} 
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start my-3">
            {artist.genres.map(genre => (
              <Badge key={genre} variant="outline" className="capitalize">
                {genre}
              </Badge>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-muted-foreground" />
              <span>{artist.followers.total.toLocaleString()} followers</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Disc className="h-5 w-5 text-muted-foreground" />
              <span>{albums?.length || 0} albums & singles</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Popularity:</span>
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${artist.popularity}%` }}
                ></div>
              </div>
              <span>{artist.popularity}%</span>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 justify-center md:justify-start">
            <Button onClick={handleGeneratePlaylist}>
              <Disc3 className="mr-2 h-4 w-4" />
              Generate Playlist
            </Button>
            <a 
              href={artist.external_urls.spotify} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Spotify
              </Button>
            </a>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="discoverography">Discoverography</TabsTrigger>
          <TabsTrigger value="similar">Similar Artists</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-8">
          {/* Top Tracks Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Music className="mr-2 h-5 w-5" /> Top Tracks
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topTracks?.slice(0, 10).map((track, index) => (
                <Card key={track.id} className="flex overflow-hidden hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img 
                      src={track.album.images[0]?.url || 'https://via.placeholder.com/80'} 
                      alt={track.album.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 items-center p-4">
                    <div className="mr-3 text-muted-foreground font-medium w-5 text-center">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{track.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{track.album.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{formatDuration(track.duration_ms)}</span>
                      <a 
                        href={track.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-accent"
                      >
                        <Play className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Albums Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Disc3 className="mr-2 h-5 w-5" /> Albums & Singles
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums?.slice(0, 10).map(album => (
                <Card key={album.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="p-0">
                    <div className="aspect-square w-full">
                      <img 
                        src={album.images[0]?.url || 'https://via.placeholder.com/300'} 
                        alt={album.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-base truncate" title={album.name}>{album.name}</CardTitle>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(album.release_date).getFullYear()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        <span>{album.total_tracks} tracks</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <a 
                      href={album.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Open in Spotify
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {albums && albums.length > 10 && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={() => setActiveTab('discoverography')}>
                  View All Albums
                </Button>
              </div>
            )}
          </div>
          
          {/* Related Artists */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Users2 className="mr-2 h-5 w-5" /> Fans Also Like
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedArtists?.slice(0, 6).map(artist => (
                <Card key={artist.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 flex flex-col items-center text-center">
                    <div className="w-full aspect-square rounded-full overflow-hidden mb-3">
                      <img 
                        src={artist.images[0]?.url || 'https://via.placeholder.com/150'} 
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-sm truncate w-full" title={artist.name}>{artist.name}</h3>
                    <Button 
                      variant="link" 
                      className="mt-2 h-auto p-0"
                      onClick={() => setLocation(`/artist/${artist.id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {relatedArtists && relatedArtists.length > 6 && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={() => setActiveTab('similar')}>
                  View All Similar Artists
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Discoverography Tab */}
        <TabsContent value="discoverography" className="mt-6">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold flex items-center">
                <Headphones className="mr-2 h-5 w-5" /> Your Listening Journey
              </h2>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Played</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 rounded-full bg-muted"></div>
                  <span>Not played</span>
                </div>
              </div>
            </div>
            
            <ScrollArea className="h-[600px] rounded-md border">
              <div className="p-6 space-y-8">
                {albums?.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
                  .map(album => {
                    // Normally we'd fetch the tracks for each album, but for now we'll simulate
                    // with available data
                    const albumTracks = topTracks?.filter(track => track.album.id === album.id) || [];
                    const playedPercentage = calculatePlayedPercentage(albumTracks);
                    
                    return (
                      <div key={album.id} className="rounded-lg border p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-40 h-40 flex-shrink-0">
                            <img 
                              src={album.images[0]?.url || 'https://via.placeholder.com/160'} 
                              alt={album.name}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-1">{album.name}</h3>
                            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatReleaseDate(album.release_date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Music className="h-4 w-4" />
                                <span>{album.total_tracks} tracks</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Disc className="h-4 w-4" />
                                <span>{album.album_type === 'album' ? 'Album' : 'Single'}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Your progress</span>
                                  <span className="font-medium">{playedPercentage}%</span>
                                </div>
                                <Progress value={playedPercentage} className="h-2" />
                              </div>
                              
                              {albumTracks.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-medium mb-2">Tracks You've Heard</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {albumTracks.map(track => (
                                      <div 
                                        key={track.id}
                                        className={`flex items-center gap-2 p-2 rounded-md ${
                                          isTrackPlayed(track.id) 
                                            ? 'bg-primary/10 text-primary' 
                                            : 'bg-secondary/50'
                                        }`}
                                      >
                                        {isTrackPlayed(track.id) ? (
                                          <Check className="h-4 w-4 flex-shrink-0" />
                                        ) : (
                                          <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                        )}
                                        <span className="truncate flex-1">{track.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDuration(track.duration_ms)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="pt-2">
                                <a 
                                  href={album.external_urls.spotify}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="outline" size="sm">
                                    <ExternalLink className="mr-2 h-3 w-3" />
                                    Open in Spotify
                                  </Button>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
        
        {/* Similar Artists Tab */}
        <TabsContent value="similar" className="mt-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Users2 className="mr-2 h-5 w-5" /> Similar Artists
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedArtists?.map(artist => (
              <Card key={artist.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="aspect-square w-full">
                    <img 
                      src={artist.images[0]?.url || 'https://via.placeholder.com/300'} 
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-xl mb-2">{artist.name}</CardTitle>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">Popularity:</span>
                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${artist.popularity}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button 
                    className="w-full"
                    onClick={() => setLocation(`/artist/${artist.id}`)}
                  >
                    View Profile
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}