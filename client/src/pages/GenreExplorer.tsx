import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import { apiRequest } from "@/lib/queryClient";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const GenreExplorer = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [energy, setEnergy] = useState<number>(50);
  const [popularity, setPopularity] = useState<number>(50);
  const [playlistName, setPlaylistName] = useState("My Genre Mix");
  const [playlistLength, setPlaylistLength] = useState<number>(60);
  
  const [previewPlaylist, setPreviewPlaylist] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  
  // Genre list query
  const { data: genresData, isLoading: loadingGenres } = useQuery({
    queryKey: ["/api/spotify/genres"],
    enabled: isAuthenticated,
  });
  
  // Generate recommendations
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/spotify/recommendations/genre", data);
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewPlaylist({
        name: playlistName,
        tracks: data.tracks,
        totalDurationMin: Math.round(data.tracks.reduce((acc: number, track: any) => acc + track.duration_ms, 0) / 60000)
      });
      setStep(2);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Save playlist to Spotify
  const savePlaylistMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/spotify/playlists", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your playlist has been saved to your Spotify account.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/recent"] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save playlist. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      if (selectedGenres.length < 5) {
        setSelectedGenres([...selectedGenres, genre]);
      } else {
        toast({
          title: "Maximum genres selected",
          description: "You can select up to 5 genres.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleGeneratePlaylist = () => {
    if (selectedGenres.length === 0) {
      toast({
        title: "No genres selected",
        description: "Please select at least one genre.",
        variant: "destructive",
      });
      return;
    }
    
    generateMutation.mutate({
      genres: selectedGenres,
      energy: energy / 100,
      popularity: popularity,
      limit: Math.ceil(playlistLength / 3) // Approximate number of tracks needed for the requested duration
    });
  };
  
  const handleSavePlaylist = () => {
    if (!previewPlaylist) return;
    
    savePlaylistMutation.mutate({
      name: playlistName,
      description: `A genre mix of ${selectedGenres.join(', ')}`,
      trackUris: previewPlaylist.tracks.map((track: any) => track.uri),
      type: "genre",
      metadata: {
        genres: selectedGenres,
        energy: energy / 100,
        popularity: popularity,
        totalTracks: previewPlaylist.tracks.length,
        totalDurationMin: previewPlaylist.totalDurationMin
      }
    });
  };
  
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#121212]">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#121212] text-white">
      <Sidebar />
      <MobileNavigation />
      
      <div className="flex-1 overflow-auto custom-scrollbar bg-gradient-to-b from-[#1e1e1e] to-[#121212] pt-4 md:pt-0">
        <main className="p-4 md:p-8 mt-14 md:mt-0">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Genre Explorer</h1>
            <p className="text-[#B3B3B3]">Create playlists based on your favorite music genres</p>
          </div>
          
          {step === 1 && (
            <div className="bg-[#282828] rounded-lg p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Select Genres</h2>
                <p className="text-[#B3B3B3] mb-4">Choose up to 5 genres to include in your playlist</p>
                
                {loadingGenres ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1DB954]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {genresData?.genres.map((genre: string) => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`genre-${genre}`}
                          checked={selectedGenres.includes(genre)}
                          onCheckedChange={() => handleGenreToggle(genre)}
                          className="border-[#1DB954] data-[state=checked]:bg-[#1DB954] data-[state=checked]:text-black"
                        />
                        <Label 
                          htmlFor={`genre-${genre}`}
                          className="text-sm capitalize"
                        >
                          {genre.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-4">Customize Your Playlist</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Playlist Name</label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="w-full bg-[#3E3E3E] border border-gray-700 rounded-md p-2 text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Energy Level</label>
                  <div className="flex items-center">
                    <span className="text-xs text-[#B3B3B3] mr-3">Chill</span>
                    <Slider 
                      value={[energy]} 
                      onValueChange={(value) => setEnergy(value[0])}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-[#B3B3B3] ml-3">Energetic</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Popularity</label>
                  <div className="flex items-center">
                    <span className="text-xs text-[#B3B3B3] mr-3">Obscure</span>
                    <Slider 
                      value={[popularity]} 
                      onValueChange={(value) => setPopularity(value[0])}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-[#B3B3B3] ml-3">Popular</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Playlist Length (minutes)</label>
                  <div className="flex items-center space-x-4">
                    {[30, 60, 90, 120].map(duration => (
                      <button
                        key={duration}
                        onClick={() => setPlaylistLength(duration)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          playlistLength === duration 
                            ? 'bg-[#1DB954] text-black' 
                            : 'bg-[#3E3E3E] text-white'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleGeneratePlaylist}
                disabled={selectedGenres.length === 0 || generateMutation.isPending}
                className="w-full bg-[#1DB954] text-black hover:bg-opacity-90 font-medium py-2.5"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  'Generate Playlist'
                )}
              </Button>
            </div>
          )}
          
          {step === 2 && previewPlaylist && (
            <div className="bg-[#282828] rounded-lg p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{previewPlaylist.name}</h2>
                  <p className="text-[#B3B3B3]">
                    {previewPlaylist.tracks.length} tracks • {previewPlaylist.totalDurationMin} minutes • 
                    {selectedGenres.join(', ')}
                  </p>
                </div>
                <div className="flex space-x-3 mt-4 md:mt-0">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="border-white text-white"
                  >
                    Back to Edit
                  </Button>
                  <Button
                    onClick={handleSavePlaylist}
                    disabled={savePlaylistMutation.isPending}
                    className="bg-[#1DB954] text-black hover:bg-opacity-90"
                  >
                    {savePlaylistMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      'Save to Spotify'
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-[#1E1E1E] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="border-b border-[#3E3E3E]">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left hidden md:table-cell">Artist</th>
                      <th className="px-4 py-2 text-left hidden md:table-cell">Album</th>
                      <th className="px-4 py-2 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPlaylist.tracks.map((track: any, index: number) => (
                      <tr key={track.id} className="hover:bg-[#3E3E3E]">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <img 
                              src={track.album.images[2]?.url} 
                              alt={track.album.name}
                              className="w-10 h-10 mr-3 rounded" 
                            />
                            <div>
                              <div className="font-medium">{track.name}</div>
                              <div className="text-sm text-[#B3B3B3] md:hidden">{track.artists[0].name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell">{track.artists.map((a: any) => a.name).join(', ')}</td>
                        <td className="px-4 py-2 hidden md:table-cell">{track.album.name}</td>
                        <td className="px-4 py-2 text-right">
                          {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GenreExplorer;
