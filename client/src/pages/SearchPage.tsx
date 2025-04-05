import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute, Link } from 'wouter';
import { Search as SearchIcon, Loader2, Music, Disc3, User, Headphones } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  const [, navigate] = useLocation();
  const [, params] = useRoute('/search');
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  
  // Function to extract query from URL
  useEffect(() => {
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [window.location.search]);
  
  // Perform search when query param changes
  const { 
    data: searchResults, 
    isLoading 
  } = useQuery<SearchResults>({
    queryKey: ['/api/spotify/search', searchQuery, activeTab],
    queryFn: async () => {
      if (!searchQuery.trim()) return {};
      
      let types = 'track,artist,album';
      if (activeTab === 'tracks') types = 'track';
      if (activeTab === 'artists') types = 'artist';
      if (activeTab === 'albums') types = 'album';
      
      const response = await apiRequest('GET', `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=${types}&limit=20`);
      return response.json();
    },
    enabled: !!searchQuery.trim(),
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">Search</h1>
        
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
          <Input
            type="text"
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <Button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            Search
          </Button>
        </form>
      </div>
      
      {searchQuery && (
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !searchResults || (
              !searchResults.tracks?.items?.length && 
              !searchResults.artists?.items?.length && 
              !searchResults.albums?.items?.length
            ) ? (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find anything matching "{searchQuery}". Try different keywords or check for typos.
              </p>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="space-y-8">
                {/* Tracks Section */}
                {searchResults.tracks?.items?.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Tracks</h2>
                      {searchResults.tracks.total > searchResults.tracks.items.length && (
                        <Button 
                          variant="link" 
                          onClick={() => setActiveTab('tracks')}
                          className="text-primary"
                        >
                          View all {searchResults.tracks.total} tracks
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {searchResults.tracks.items.slice(0, 5).map((track) => (
                        <div 
                          key={track.id} 
                          className="flex items-center p-3 rounded-md hover:bg-accent cursor-pointer"
                        >
                          <div className="h-12 w-12 mr-4">
                            <img
                              src={track.album.images[0]?.url || 'https://via.placeholder.com/48'}
                              alt={track.album.name}
                              className="h-full w-full object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{track.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {track.artists.map(a => a.name).join(', ')}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground ml-4">
                            {formatDuration(track.duration_ms)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Artists Section */}
                {searchResults.artists?.items?.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Artists</h2>
                      {searchResults.artists.total > searchResults.artists.items.length && (
                        <Button 
                          variant="link" 
                          onClick={() => setActiveTab('artists')}
                          className="text-primary"
                        >
                          View all {searchResults.artists.total} artists
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {searchResults.artists.items.slice(0, 5).map((artist) => (
                        <Link key={artist.id} href={`/artist/${artist.id}`}>
                          <Card className="h-full hover:shadow-md cursor-pointer transition-all overflow-hidden">
                            <div className="aspect-square overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
                              <img
                                src={artist.images?.[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                                alt={artist.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold truncate">{artist.name}</h3>
                              <p className="text-xs text-muted-foreground">Artist</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Albums Section */}
                {searchResults.albums?.items?.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Albums</h2>
                      {searchResults.albums.total > searchResults.albums.items.length && (
                        <Button 
                          variant="link" 
                          onClick={() => setActiveTab('albums')}
                          className="text-primary"
                        >
                          View all {searchResults.albums.total} albums
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {searchResults.albums.items.slice(0, 5).map((album) => (
                        <Card key={album.id} className="h-full hover:shadow-md cursor-pointer transition-all overflow-hidden">
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={album.images?.[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                              alt={album.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold truncate">{album.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{album.artists.map((a: any) => a.name).join(', ')}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="tracks">
                {searchResults.tracks?.items?.length > 0 ? (
                  <ScrollArea className="h-[700px]">
                    <div className="space-y-2">
                      {searchResults.tracks.items.map((track) => (
                        <div 
                          key={track.id} 
                          className="flex items-center p-3 rounded-md hover:bg-accent cursor-pointer"
                        >
                          <div className="h-12 w-12 mr-4">
                            <img
                              src={track.album.images[0]?.url || 'https://via.placeholder.com/48'}
                              alt={track.album.name}
                              className="h-full w-full object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{track.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground ml-4">
                            {formatDuration(track.duration_ms)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12">
                    <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No tracks found</h3>
                    <p className="text-muted-foreground">Try a different search term</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="artists">
                {searchResults.artists?.items?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchResults.artists.items.map((artist) => (
                      <Link key={artist.id} href={`/artist/${artist.id}`}>
                        <Card className="h-full hover:shadow-md cursor-pointer transition-all overflow-hidden">
                          <div className="aspect-square overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
                            <img
                              src={artist.images?.[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                              alt={artist.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold truncate">{artist.name}</h3>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {artist.genres?.slice(0, 2).map((genre: string) => (
                                <Badge key={genre} variant="secondary" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0 pb-3 px-4">
                            <div className="text-xs text-muted-foreground">
                              {artist.followers?.total?.toLocaleString()} followers
                            </div>
                          </CardFooter>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No artists found</h3>
                    <p className="text-muted-foreground">Try a different search term</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="albums">
                {searchResults.albums?.items?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchResults.albums.items.map((album) => (
                      <Card key={album.id} className="h-full hover:shadow-md cursor-pointer transition-all overflow-hidden">
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={album.images?.[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                            alt={album.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold truncate">{album.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {album.artists.map((a: any) => a.name).join(', ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {album.release_date?.slice(0, 4)} • {album.total_tracks} tracks
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Disc3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No albums found</h3>
                    <p className="text-muted-foreground">Try a different search term</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      )}
      
      {!searchQuery && (
        <div className="text-center py-12">
          <Headphones className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-3">Start searching for music</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Look up artists, songs, albums, or even genres to discover new music and create personalized playlists.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            <Badge className="cursor-pointer hover:bg-primary px-3 py-1.5" onClick={() => setSearchQuery('pop')}>Pop</Badge>
            <Badge className="cursor-pointer hover:bg-primary px-3 py-1.5" onClick={() => setSearchQuery('rock')}>Rock</Badge>
            <Badge className="cursor-pointer hover:bg-primary px-3 py-1.5" onClick={() => setSearchQuery('hip hop')}>Hip Hop</Badge>
            <Badge className="cursor-pointer hover:bg-primary px-3 py-1.5" onClick={() => setSearchQuery('country')}>Country</Badge>
            <Badge className="cursor-pointer hover:bg-primary px-3 py-1.5" onClick={() => setSearchQuery('edm')}>Electronic</Badge>
            <Badge className="cursor-pointer hover:bg-primary px-3 py-1.5" onClick={() => setSearchQuery('jazz')}>Jazz</Badge>
            <Badge className="cursor-pointer hover:bg-primary px-3 py-1.5" onClick={() => setSearchQuery('r&b')}>R&B</Badge>
            <Badge className="cursor-pointer hover:bg-primary px-3 py-1.5" onClick={() => setSearchQuery('classical')}>Classical</Badge>
          </div>
        </div>
      )}
    </div>
  );
}