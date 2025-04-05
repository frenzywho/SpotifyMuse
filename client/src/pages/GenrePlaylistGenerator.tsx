import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Music, Loader2, Disc3, Save, Sliders } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SpotifyTrack } from '@/lib/spotify';

interface GenreResponse {
  genres: string[];
}

interface RecommendationResponse {
  tracks: SpotifyTrack[];
  seeds: any[];
}

export default function GenrePlaylistGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track properties
  const [tempo, setTempo] = useState<number | null>(null);
  const [popularity, setPopularity] = useState<number | null>(null);
  const [acousticness, setAcousticness] = useState<number | null>(null);
  const [danceability, setDanceability] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [trackLimit, setTrackLimit] = useState(30);
  
  // Auto-generate playlist name based on genres
  useEffect(() => {
    if (selectedGenres.length > 0) {
      const genreNames = selectedGenres.map(genre => 
        genre.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      );
      
      const formatGenres = () => {
        if (genreNames.length === 1) return genreNames[0];
        if (genreNames.length === 2) return `${genreNames[0]} & ${genreNames[1]}`;
        return `${genreNames.slice(0, -1).join(', ')} & ${genreNames[genreNames.length - 1]}`;
      };
      
      setPlaylistName(`${formatGenres()} Mix`);
      setPlaylistDescription(`A playlist featuring ${formatGenres()} music.`);
    }
  }, [selectedGenres]);
  
  // Fetch available genres
  const { data: genreData, isLoading: genresLoading } = useQuery<GenreResponse>({
    queryKey: ['/api/spotify/genres'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/spotify/genres');
      return await response.json();
    },
  });
  
  // Fetch recommendations based on selected genres and parameters
  const { 
    data: recommendations,
    isLoading: recommendationsLoading,
    refetch: fetchRecommendations
  } = useQuery<RecommendationResponse>({
    queryKey: ['/api/spotify/recommendations/genre', selectedGenres, tempo, popularity, acousticness, danceability, energy, trackLimit],
    queryFn: async () => {
      if (selectedGenres.length === 0) return { tracks: [], seeds: [] };
      
      const response = await apiRequest('POST', '/api/spotify/recommendations/genre', {
        genres: selectedGenres,
        tempo: tempo,
        popularity: popularity,
        acousticness: acousticness,
        danceability: danceability,
        energy: energy,
        limit: trackLimit
      });
      
      return await response.json();
    },
    enabled: selectedGenres.length > 0,
  });
  
  // Create playlist mutation
  const savePlaylistMutation = useMutation({
    mutationFn: async () => {
      if (!recommendations || !recommendations.tracks || recommendations.tracks.length === 0) {
        throw new Error("No tracks to save");
      }
      
      const trackUris = recommendations.tracks.map(track => track.uri);
      
      const response = await apiRequest('POST', '/api/spotify/playlists', {
        name: playlistName,
        description: playlistDescription,
        trackUris: trackUris,
        type: 'genre',
        metadata: {
          genres: selectedGenres,
          parameters: {
            tempo, popularity, acousticness, danceability, energy
          },
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
  
  const handleGenreSelect = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      if (selectedGenres.length >= 5) {
        toast({
          title: "Maximum genres reached",
          description: "You can select up to 5 genres. Remove one to add another.",
          variant: "destructive",
        });
        return;
      }
      setSelectedGenres([...selectedGenres, genre]);
    }
  };
  
  const handleGenerateRecommendations = () => {
    if (selectedGenres.length === 0) {
      toast({
        title: "No genres selected",
        description: "Please select at least one genre to generate recommendations.",
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
    
    if (!recommendations || !recommendations.tracks || recommendations.tracks.length === 0) {
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
  
  const filteredGenres = genreData?.genres
    .filter(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort() || [];
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Genre Playlist Generator</h1>
        <p className="text-muted-foreground">
          Create custom playlists by selecting genres and tuning audio parameters
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel - Genre Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Music className="mr-2 h-5 w-5" /> 
                Select Genres
              </CardTitle>
              <CardDescription>
                Choose up to 5 genres to include in your playlist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Search genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedGenres.map(genre => (
                  <Badge 
                    key={genre} 
                    className="cursor-pointer bg-primary hover:bg-primary/80"
                    onClick={() => handleGenreSelect(genre)}
                  >
                    {genre.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    <span className="ml-1">×</span>
                  </Badge>
                ))}
                {selectedGenres.length === 0 && (
                  <span className="text-sm text-muted-foreground">No genres selected</span>
                )}
              </div>
              
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="flex flex-wrap gap-2">
                  {genresLoading ? (
                    <div className="w-full flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredGenres.length === 0 ? (
                    <div className="w-full text-center py-4 text-muted-foreground">
                      No genres found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredGenres.map(genre => (
                      <Badge 
                        key={genre} 
                        variant={selectedGenres.includes(genre) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => handleGenreSelect(genre)}
                      >
                        {genre.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleGenerateRecommendations}
                disabled={selectedGenres.length === 0 || recommendationsLoading}
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
          
          {/* Audio Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sliders className="mr-2 h-5 w-5" /> 
                Fine-tune Parameters
              </CardTitle>
              <CardDescription>
                Adjust audio features to customize your playlist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Tempo (BPM)</Label>
                    <span className="text-sm font-medium">
                      {tempo === null ? 'Any' : tempo}
                    </span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={200}
                    step={1}
                    value={tempo !== null ? [tempo] : [0]}
                    onValueChange={(value) => setTempo(value[0] === 0 ? null : value[0])}
                    className="py-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Popularity</Label>
                    <span className="text-sm font-medium">
                      {popularity === null ? 'Any' : popularity}
                    </span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={100}
                    step={5}
                    value={popularity !== null ? [popularity] : [0]}
                    onValueChange={(value) => setPopularity(value[0] === 0 ? null : value[0])}
                    className="py-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Acousticness</Label>
                    <span className="text-sm font-medium">
                      {acousticness === null ? 'Any' : acousticness / 100}
                    </span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={100}
                    step={5}
                    value={acousticness !== null ? [acousticness] : [0]}
                    onValueChange={(value) => setAcousticness(value[0] === 0 ? null : value[0])}
                    className="py-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Danceability</Label>
                    <span className="text-sm font-medium">
                      {danceability === null ? 'Any' : danceability / 100}
                    </span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={100}
                    step={5}
                    value={danceability !== null ? [danceability] : [0]}
                    onValueChange={(value) => setDanceability(value[0] === 0 ? null : value[0])}
                    className="py-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Energy</Label>
                    <span className="text-sm font-medium">
                      {energy === null ? 'Any' : energy / 100}
                    </span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={100}
                    step={5}
                    value={energy !== null ? [energy] : [0]}
                    onValueChange={(value) => setEnergy(value[0] === 0 ? null : value[0])}
                    className="py-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Number of Tracks</Label>
                    <span className="text-sm font-medium">{trackLimit}</span>
                  </div>
                  <Slider 
                    defaultValue={[30]} 
                    min={10}
                    max={50}
                    step={5}
                    value={[trackLimit]}
                    onValueChange={(value) => setTrackLimit(value[0])}
                    className="py-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Panel - Recommendations & Playlist Creation */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Disc3 className="mr-2 h-5 w-5" /> 
                Playlist Details
              </CardTitle>
              <CardDescription>
                Customize your playlist before saving
              </CardDescription>
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
              
              <div className="pt-4">
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
          
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center">
                  <Music className="mr-2 h-5 w-5" /> 
                  Recommended Tracks
                </span>
                {recommendations?.tracks?.length > 0 && (
                  <Badge variant="outline">
                    {recommendations.tracks.length} tracks
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selectedGenres.length > 0 
                  ? `Based on ${selectedGenres.map(g => g.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')).join(', ')}`
                  : 'Select genres to see recommendations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !recommendations || !recommendations.tracks || recommendations.tracks.length === 0 ? (
                <div className="text-center py-12">
                  <Disc3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tracks yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Select genres and click "Generate Recommendations" to get started
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
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