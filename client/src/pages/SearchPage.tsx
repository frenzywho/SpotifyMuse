import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Music as MusicIcon, User as UserIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SpotifyTrack } from '@/lib/spotify';

interface SearchResults {
  tracks?: {
    items: SpotifyTrack[];
    total: number;
  };
  artists?: {
    items: any[];
    total: number;
  };
  albums?: {
    items: any[];
    total: number;
  };
}

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  // Extract search query from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [location]);

  // Search query with debounce
  const {
    data: searchResults,
    isLoading,
    error,
    refetch
  } = useQuery<SearchResults>({
    queryKey: ['/api/spotify/search', searchQuery, activeTab],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim() === '') return { tracks: { items: [], total: 0 }, artists: { items: [], total: 0 }, albums: { items: [], total: 0 } };
      
      const types = activeTab === 'all' ? 'track,artist,album' : activeTab;
      const response = await apiRequest('GET', `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=${types}&limit=20`);
      return await response.json();
    },
    enabled: !!searchQuery && searchQuery.trim().length > 0,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.trim() === '') {
      toast({
        title: "Search query required",
        description: "Please enter an artist, song, or album name to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Update the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchQuery);
      window.history.pushState({}, '', url.toString());
      
      await refetch();
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Failed to fetch search results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getArtistImage = (artist: any) => {
    return artist.images && artist.images.length > 0
      ? artist.images[0].url
      : 'https://via.placeholder.com/150?text=No+Image';
  };

  const getAlbumImage = (album: any) => {
    return album.images && album.images.length > 0
      ? album.images[0].url
      : 'https://via.placeholder.com/150?text=No+Image';
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
      <p className="text-muted-foreground">
        Search for any artist, track, or album on Spotify
      </p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Search for artists, songs, or albums"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
          Search
        </Button>
      </form>

      {searchQuery && (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="track">Tracks</TabsTrigger>
            <TabsTrigger value="artist">Artists</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">Error fetching search results</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="space-y-8">
                {/* Tracks Section */}
                {searchResults?.tracks && searchResults.tracks.items.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-semibold flex items-center">
                        <MusicIcon className="mr-2 h-5 w-5" /> Tracks
                      </h2>
                      <Button variant="link" onClick={() => setActiveTab('track')}>
                        View all {searchResults.tracks.total} results
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.tracks.items.slice(0, 6).map((track) => (
                        <Card key={track.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex h-full">
                            <img
                              src={track.album.images[0]?.url || 'https://via.placeholder.com/80'}
                              alt={track.name}
                              className="h-[80px] w-[80px] object-cover"
                            />
                            <div className="flex flex-col justify-between p-4 flex-1">
                              <div>
                                <h3 className="font-medium truncate">{track.name}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {track.artists.map(a => a.name).join(', ')}
                                </p>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-muted-foreground">{formatDuration(track.duration_ms)}</span>
                                <a
                                  href={track.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  Play on Spotify
                                </a>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Artists Section */}
                {searchResults?.artists && searchResults.artists.items.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-semibold flex items-center">
                        <UserIcon className="mr-2 h-5 w-5" /> Artists
                      </h2>
                      <Button variant="link" onClick={() => setActiveTab('artist')}>
                        View all {searchResults.artists.total} results
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {searchResults.artists.items.slice(0, 6).map((artist) => (
                        <Card key={artist.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex flex-col items-center p-4">
                            <div className="w-full aspect-square mb-3 rounded-full overflow-hidden">
                              <img
                                src={getArtistImage(artist)}
                                alt={artist.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <h3 className="font-medium text-center truncate w-full">{artist.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {artist.followers?.total?.toLocaleString() || 0} followers
                            </p>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto mt-2"
                              onClick={() => setLocation(`/artists/${artist.id}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="track">
                {searchResults?.tracks && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center">
                      <MusicIcon className="mr-2 h-5 w-5" /> Tracks
                      <Badge className="ml-3">{searchResults.tracks.total} results</Badge>
                    </h2>
                    
                    <ScrollArea className="h-[600px] rounded-md border">
                      <div className="p-4 space-y-4">
                        {searchResults.tracks.items.map((track) => (
                          <Card key={track.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex">
                              <img
                                src={track.album.images[0]?.url || 'https://via.placeholder.com/80'}
                                alt={track.name}
                                className="h-[80px] w-[80px] object-cover"
                              />
                              <div className="flex flex-col justify-between p-4 flex-1">
                                <div>
                                  <h3 className="font-medium">{track.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {track.artists.map(a => a.name).join(', ')}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Album: {track.album.name}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs">{formatDuration(track.duration_ms)}</span>
                                  <div className="flex space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                      // Create a playlist with this track
                                      // TO DO: Implement this functionality
                                      toast({
                                        title: "Feature coming soon",
                                        description: "Adding tracks to playlists will be available soon!",
                                      });
                                    }}>
                                      Add to Playlist
                                    </Button>
                                    <a
                                      href={track.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button size="sm">
                                        Play on Spotify
                                      </Button>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="artist">
                {searchResults?.artists && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center">
                      <UserIcon className="mr-2 h-5 w-5" /> Artists
                      <Badge className="ml-3">{searchResults.artists.total} results</Badge>
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {searchResults.artists.items.map((artist) => (
                        <Card key={artist.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardHeader className="p-0">
                            <div className="w-full aspect-square">
                              <img
                                src={getArtistImage(artist)}
                                alt={artist.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <CardTitle className="text-xl mb-2">{artist.name}</CardTitle>
                            <CardDescription>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {artist.genres?.slice(0, 3).map((genre: string) => (
                                  <Badge key={genre} variant="secondary" className="capitalize">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm">
                                {artist.followers?.total?.toLocaleString() || 0} followers
                              </p>
                            </CardDescription>
                          </CardContent>
                          <CardFooter className="pb-6 pt-0">
                            <Button 
                              className="w-full"
                              onClick={() => setLocation(`/artist/${artist.id}`)}
                            >
                              Explore Artist
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      )}
    </div>
  );
}