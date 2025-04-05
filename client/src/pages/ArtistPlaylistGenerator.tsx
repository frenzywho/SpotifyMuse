import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Loader2, UserCircle, Save, Disc3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SpotifyTrack } from '@/lib/spotify';

interface Artist {
  id: string;
  name: string;
  images: {url: string}[];
  genres: string[];
}

interface RecommendationResponse {
  tracks: SpotifyTrack[];
}

export default function ArtistPlaylistGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Parse query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialArtistId = urlParams.get('id');
  const initialArtistName = urlParams.get('name');
  
  // State
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [trackLimit, setTrackLimit] = useState(30);
  const [includeTopTracks, setIncludeTopTracks] = useState(true);
  const [includeRelatedArtists, setIncludeRelatedArtists] = useState(true);
  
  // Set initial artist if provided in URL
  useEffect(() => {
    if (initialArtistId && initialArtistName) {
      const fetchArtist = async () => {
        try {
          const response = await apiRequest('GET', `/api/spotify/artists/${initialArtistId}`);
          const artist = await response.json();
          setSelectedArtists([artist]);
          
          // Set default playlist name
          setPlaylistName(`${artist.name} Mix`);
          setPlaylistDescription(`A playlist featuring ${artist.name} and similar artists.`);
        } catch (error) {
          console.error("Error fetching initial artist:", error);
        }
      };
      
      fetchArtist();
    }
  }, [initialArtistId, initialArtistName]);
  
  // Search artists
  const { 
    data: searchResults,
    isLoading: searchLoading,
    refetch: searchArtists
  } = useQuery({
    queryKey: ['/api/spotify/search/artists', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { items: [] };
      
      const response = await apiRequest('GET', `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=10`);
      const data = await response.json();
      return data.artists;
    },
    enabled: false, // Don't run automatically
  });
  
  // Get recommendations
  const { 
    data: recommendations,
    isLoading: recommendationsLoading,
    refetch: fetchRecommendations
  } = useQuery<RecommendationResponse>({
    queryKey: ['/api/spotify/recommendations/artist', selectedArtists.map(a => a.id), includeTopTracks, includeRelatedArtists, trackLimit],
    queryFn: async () => {
      if (selectedArtists.length === 0) return { tracks: [] };
      
      const response = await apiRequest('POST', '/api/spotify/recommendations/artist', {
        artistIds: selectedArtists.map(a => a.id),
        includeTopTracks,
        includeRelatedArtists,
        limit: trackLimit
      });
      
      return await response.json();
    },
    enabled: selectedArtists.length > 0,
  });
  
  // Create playlist mutation
  const savePlaylistMutation = useMutation({
    mutationFn: async () => {
      if (!recommendations?.tracks?.length) {
        throw new Error("No tracks to save");
      }
      
      const trackUris = recommendations.tracks.map(track => track.uri);
      
      const response = await apiRequest('POST', '/api/spotify/playlists', {
        name: playlistName,
        description: playlistDescription,
        trackUris: trackUris,
        type: 'artist',
        metadata: {
          artists: selectedArtists.map(a => ({ id: a.id, name: a.name })),
          includeTopTracks,
          includeRelatedArtists,
          totalTracks: trackUris.length,
          totalDurationMin: Math.floor(recommendations.tracks.reduce((acc, track) => acc + track.duration_ms, 0) / 60000)
        }
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Playlist saved!",
        description: `Your "${playlistName}" playlist has been created successfully.`,
      });
      
      // Invalidate playlists cache
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playlists/recent'] });
      
      // Redirect to playlists page
      setTimeout(() => setLocation('/'), 1500);
    },
    onError: (error) => {
      console.error("Error saving playlist:", error);
      toast({
        title: "Failed to save playlist",
        description: "There was an error creating your playlist. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchArtists();
    }
  };
  
  const handleSelectArtist = (artist: Artist) => {
    if (selectedArtists.some(a => a.id === artist.id)) {
      // Remove if already selected
      setSelectedArtists(selectedArtists.filter(a => a.id !== artist.id));
    } else {
      // Add if not already selected (max 5)
      if (selectedArtists.length >= 5) {
        toast({
          title: "Maximum artists reached",
          description: "You can select up to 5 artists. Remove one to add another.",
          variant: "destructive",
        });
        return;
      }
      setSelectedArtists([...selectedArtists, artist]);
      
      // Update playlist name if this is the first artist
      if (selectedArtists.length === 0) {
        setPlaylistName(`${artist.name} Mix`);
        setPlaylistDescription(`A playlist featuring ${artist.name} and similar artists.`);
      } 
      // Update for multiple artists
      else if (selectedArtists.length === 1) {
        const artists = [...selectedArtists, artist];
        setPlaylistName(`${artists[0].name} & ${artists[1].name} Mix`);
        setPlaylistDescription(`A playlist featuring ${artists.map(a => a.name).join(', ')}.`);
      }
    }
  };
  
  const handleGenerateRecommendations = () => {
    if (selectedArtists.length === 0) {
      toast({
        title: "No artists selected",
        description: "Please select at least one artist to generate recommendations.",
        variant: "destructive",
      });
      return;
    }
    
    fetchRecommendations();
  };
  
  const handleSavePlaylist = () => {
    if (!playlistName.trim()) {
      toast({
        title: "Playlist name required",
        description: "Please enter a name for your playlist.",
        variant: "destructive",
      });
      return;
    }
    
    if (!recommendations?.tracks?.length) {
      toast({
        title: "No tracks to save",
        description: "Generate recommendations first before saving a playlist.",
        variant: "destructive",
      });
      return;
    }
    
    savePlaylistMutation.mutate();
  };
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Artist Playlist Generator</h1>
        <p className="text-muted-foreground">
          Create custom playlists based on your favorite artists
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel - Artist Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCircle className="mr-2 h-5 w-5" /> 
                Select Artists
              </CardTitle>
              <CardDescription>
                Choose up to 5 artists to base your playlist on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={searchLoading}>
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </form>
              
              {/* Selected Artists */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedArtists.map(artist => (
                  <Badge 
                    key={artist.id} 
                    className="cursor-pointer bg-primary hover:bg-primary/80 flex items-center gap-1 p-1 pr-2"
                    onClick={() => handleSelectArtist(artist)}
                  >
                    <Avatar className="h-5 w-5 mr-1">
                      <AvatarImage src={artist.images[0]?.url} />
                      <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {artist.name}
                    <span className="ml-1">×</span>
                  </Badge>
                ))}
                {selectedArtists.length === 0 && (
                  <span className="text-sm text-muted-foreground">No artists selected</span>
                )}
              </div>
              
              {/* Search Results */}
              {searchResults?.items?.length > 0 && (
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-3">
                    {searchResults.items.map((artist: Artist) => (
                      <div 
                        key={artist.id} 
                        className={`flex items-center p-3 rounded-md cursor-pointer ${
                          selectedArtists.some(a => a.id === artist.id) 
                            ? 'bg-primary/20' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => handleSelectArtist(artist)}
                      >
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={artist.images[0]?.url} />
                          <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{artist.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {artist.genres?.slice(0, 3).join(', ') || 'No genres available'}
                          </p>
                        </div>
                        {selectedArtists.some(a => a.id === artist.id) && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleGenerateRecommendations}
                disabled={selectedArtists.length === 0 || recommendationsLoading}
              >
                {recommendationsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Disc3 className="mr-2 h-4 w-4" />
                    Generate Recommendations
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
              <CardDescription>
                Customize how your playlist is generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Top Tracks</Label>
                  <p className="text-xs text-muted-foreground">
                    Add the artists' most popular songs
                  </p>
                </div>
                <Switch 
                  checked={includeTopTracks}
                  onCheckedChange={setIncludeTopTracks}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Related Artists</Label>
                  <p className="text-xs text-muted-foreground">
                    Add tracks from similar artists
                  </p>
                </div>
                <Switch 
                  checked={includeRelatedArtists}
                  onCheckedChange={setIncludeRelatedArtists}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="track-limit">Number of Tracks</Label>
                <select
                  id="track-limit"
                  value={trackLimit}
                  onChange={(e) => setTrackLimit(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={20}>20 tracks</option>
                  <option value={30}>30 tracks</option>
                  <option value={40}>40 tracks</option>
                  <option value={50}>50 tracks</option>
                </select>
              </div>
            </CardContent>
          </Card>
          
          {/* Playlist Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Disc3 className="mr-2 h-5 w-5" /> 
                Playlist Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-name">Playlist Name</Label>
                <Input
                  id="playlist-name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Enter a name for your playlist"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="playlist-description">Description</Label>
                <Input
                  id="playlist-description"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="Describe your playlist"
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  className="w-full" 
                  onClick={handleSavePlaylist}
                  disabled={!recommendations?.tracks?.length || savePlaylistMutation.isPending}
                >
                  {savePlaylistMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Playlist to Spotify
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Panel - Recommendations & Track List */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center">
                  <Disc3 className="mr-2 h-5 w-5" /> 
                  Recommended Tracks
                </span>
                {recommendations?.tracks?.length > 0 && (
                  <Badge variant="outline">
                    {recommendations.tracks.length} tracks
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selectedArtists.length > 0 
                  ? `Based on ${selectedArtists.map(a => a.name).join(', ')}`
                  : 'Select artists to see recommendations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !recommendations?.tracks?.length ? (
                <div className="text-center py-12">
                  <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tracks yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Select artists and click "Generate Recommendations" to get started
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[700px]">
                  <div className="space-y-2">
                    {recommendations.tracks.map((track, index) => (
                      <div 
                        key={track.id} 
                        className="flex items-center p-3 rounded-md hover:bg-accent"
                      >
                        <div className="mr-4 text-muted-foreground font-medium w-6">
                          {index + 1}
                        </div>
                        <div className="h-10 w-10 mr-3">
                          <img
                            src={track.album.images[0]?.url || 'https://via.placeholder.com/40'}
                            alt={track.album.name}
                            className="h-full w-full object-cover rounded-sm"
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
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}