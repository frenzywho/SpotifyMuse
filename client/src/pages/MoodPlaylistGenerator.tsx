import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Loader2, Save, Disc3, Smile, Github } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SpotifyTrack } from '@/lib/spotify';

interface MoodCard {
  id: string;
  name: string;
  description: string;
  color: string;
  parameters: {
    valence: number;
    energy: number;
    danceability: number;
    tempo: number | null;
    acousticness: number | null;
  };
}

interface RecommendationResponse {
  tracks: SpotifyTrack[];
  seeds: any[];
}

const moodCards: MoodCard[] = [
  {
    id: 'happy',
    name: 'Happy',
    description: 'Uplifting, positive vibes',
    color: 'bg-yellow-500',
    parameters: {
      valence: 90,
      energy: 80,
      danceability: 75,
      tempo: null,
      acousticness: null
    }
  },
  {
    id: 'energetic',
    name: 'Energetic',
    description: 'High-energy, workout ready',
    color: 'bg-red-500',
    parameters: {
      valence: 70,
      energy: 95,
      danceability: 85,
      tempo: 140,
      acousticness: 10
    }
  },
  {
    id: 'chill',
    name: 'Chill',
    description: 'Relaxed, laid-back mood',
    color: 'bg-blue-400',
    parameters: {
      valence: 50,
      energy: 30,
      danceability: 40,
      tempo: null,
      acousticness: 70
    }
  },
  {
    id: 'romantic',
    name: 'Romantic',
    description: 'Love songs and intimate vibes',
    color: 'bg-pink-400',
    parameters: {
      valence: 60,
      energy: 40,
      danceability: 50,
      tempo: null,
      acousticness: 60
    }
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    description: 'Ethereal, atmospheric music',
    color: 'bg-purple-400',
    parameters: {
      valence: 40,
      energy: 35,
      danceability: 30,
      tempo: null,
      acousticness: 75
    }
  },
  {
    id: 'angry',
    name: 'Angry',
    description: 'Intense, aggressive sound',
    color: 'bg-orange-600',
    parameters: {
      valence: 20,
      energy: 90,
      danceability: 60,
      tempo: null,
      acousticness: 10
    }
  },
  {
    id: 'melancholy',
    name: 'Melancholy',
    description: 'Sad, reflective, introspective',
    color: 'bg-indigo-400',
    parameters: {
      valence: 15,
      energy: 25,
      danceability: 30,
      tempo: null,
      acousticness: 65
    }
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Concentration and productivity',
    color: 'bg-emerald-500',
    parameters: {
      valence: 45,
      energy: 40,
      danceability: 30,
      tempo: null,
      acousticness: 60
    }
  }
];

export default function MoodPlaylistGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<MoodCard | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [trackLimit, setTrackLimit] = useState(30);
  
  // Auto-generate playlist name based on mood
  useEffect(() => {
    if (selectedMood) {
      let name = `${selectedMood.name} Vibes`;
      if (selectedGenre) {
        const formattedGenre = selectedGenre.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        name = `${selectedMood.name} ${formattedGenre} Mix`;
      }
      setPlaylistName(name);
      
      let description = `A playlist with ${selectedMood.name.toLowerCase()} vibes`;
      if (selectedGenre) {
        const formattedGenre = selectedGenre.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        description += ` featuring ${formattedGenre} music`;
      }
      setPlaylistDescription(description);
    }
  }, [selectedMood, selectedGenre]);
  
  // Fetch available genres
  const { data: genreData, isLoading: genresLoading } = useQuery({
    queryKey: ['/api/spotify/genres'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/spotify/genres');
      return await response.json();
    },
  });
  
  // Fetch recommendations based on selected mood and genre
  const { 
    data: recommendations,
    isLoading: recommendationsLoading,
    refetch: fetchRecommendations
  } = useQuery<RecommendationResponse>({
    queryKey: ['/api/spotify/recommendations/mood', selectedMood?.id, selectedGenre, trackLimit],
    queryFn: async () => {
      if (!selectedMood) return { tracks: [], seeds: [] };
      
      const params: any = {
        mood: selectedMood.id,
        limit: trackLimit
      };
      
      if (selectedGenre) {
        params.genre = selectedGenre;
      }
      
      const response = await apiRequest('POST', '/api/spotify/recommendations/mood', params);
      return await response.json();
    },
    enabled: !!selectedMood,
  });
  
  // Create playlist mutation
  const savePlaylistMutation = useMutation({
    mutationFn: async () => {
      if (!recommendations || !recommendations.tracks || recommendations.tracks.length === 0) {
        throw new Error("No tracks to save");
      }
      
      if (!selectedMood) {
        throw new Error("No mood selected");
      }
      
      const trackUris = recommendations.tracks.map(track => track.uri);
      
      const response = await apiRequest('POST', '/api/spotify/playlists', {
        name: playlistName,
        description: playlistDescription,
        trackUris: trackUris,
        type: 'mood',
        metadata: {
          mood: selectedMood.id,
          genre: selectedGenre || undefined,
          parameters: selectedMood.parameters,
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
  
  const handleSelectMood = (mood: MoodCard) => {
    setSelectedMood(mood);
  };
  
  const handleSelectGenre = (genre: string | null) => {
    setSelectedGenre(genre);
    // Re-fetch recommendations when genre changes
    if (selectedMood) {
      setTimeout(() => fetchRecommendations(), 100);
    }
  };
  
  const handleGenerateRecommendations = () => {
    if (!selectedMood) {
      toast({
        title: "No mood selected",
        description: "Please select a mood to generate recommendations.",
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
  
  const sortedGenres = genreData?.genres?.sort() || [];
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Mood Playlist Generator</h1>
        <p className="text-muted-foreground">
          Create playlists matching your current mood and emotions
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel - Mood Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smile className="mr-2 h-5 w-5" /> 
                Select a Mood
              </CardTitle>
              <CardDescription>
                Choose the mood for your playlist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {moodCards.map(mood => (
                  <Card 
                    key={mood.id}
                    className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                      selectedMood?.id === mood.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectMood(mood)}
                  >
                    <div className={`h-2 w-full ${mood.color}`}></div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-center mb-1">{mood.name}</h3>
                      <p className="text-xs text-center text-muted-foreground">{mood.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleGenerateRecommendations}
                disabled={!selectedMood || recommendationsLoading}
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
          
          {/* Genre Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Github className="mr-2 h-5 w-5" /> 
                Optional Genre Filter
              </CardTitle>
              <CardDescription>
                Narrow your mood playlist to a specific genre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="popular" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="popular">Popular Genres</TabsTrigger>
                  <TabsTrigger value="all">All Genres</TabsTrigger>
                </TabsList>
                <TabsContent value="popular" className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {["pop", "rock", "hip_hop", "r_n_b", "electronic", "country", "jazz", "classical", "folk", "latin"].map(genre => (
                      <Badge 
                        key={genre} 
                        variant={selectedGenre === genre ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => handleSelectGenre(selectedGenre === genre ? null : genre)}
                      >
                        {genre.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  {genresLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="flex flex-wrap gap-2 pb-4">
                        {sortedGenres.map((genre: string) => (
                          <Badge 
                            key={genre} 
                            variant={selectedGenre === genre ? "default" : "outline"}
                            className="cursor-pointer capitalize"
                            onClick={() => handleSelectGenre(selectedGenre === genre ? null : genre)}
                          >
                            {genre.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  {selectedGenre && (
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="text-sm">Selected: <strong className="capitalize">
                        {selectedGenre.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </strong></span>
                      <Button variant="ghost" size="sm" onClick={() => handleSelectGenre(null)}>
                        Clear
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="track-limit">Number of Tracks</Label>
                  <span className="text-sm font-medium">{trackLimit}</span>
                </div>
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
        
        {/* Right Panel - Recommendations & Playlist Preview */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center">
                  <Disc3 className="mr-2 h-5 w-5" /> 
                  {selectedMood ? `${selectedMood.name} Tracks` : 'Recommended Tracks'}
                </span>
                {recommendations?.tracks?.length > 0 && (
                  <Badge variant="outline">
                    {recommendations.tracks.length} tracks
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selectedMood 
                  ? `Music to match your ${selectedMood.name.toLowerCase()} mood${selectedGenre ? ` with ${selectedGenre.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} vibes` : ''}`
                  : 'Select a mood to see recommendations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !recommendations || !recommendations.tracks || recommendations.tracks.length === 0 ? (
                <div className="text-center py-12">
                  <Smile className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select your mood</h3>
                  <p className="text-muted-foreground mb-6">
                    Pick a mood from the left panel to generate a playlist that matches how you feel
                  </p>
                  {selectedMood && (
                    <Button onClick={handleGenerateRecommendations}>
                      Generate {selectedMood.name} Playlist
                    </Button>
                  )}
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