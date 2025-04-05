import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MoodSelector from "@/components/MoodSelector";
import { queryClient } from "@/lib/queryClient";

const MoodCreator = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedMood, setSelectedMood] = useState<string>("dreamy");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [playlistLength, setPlaylistLength] = useState<number>(60);
  const [playlistName, setPlaylistName] = useState<string>("My Mood Mix");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  const [previewPlaylist, setPreviewPlaylist] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  
  // Get available genres
  const { data: genresData } = useQuery({
    queryKey: ["/api/spotify/genres"],
    enabled: isAuthenticated,
  });
  
  // Generate mood recommendations
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/spotify/recommendations/mood", data);
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewPlaylist({
        name: playlistName,
        tracks: data.tracks,
        metadata: data.metadata
      });
      setStep(2);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate mood playlist. Please try again.",
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
        description: "Your mood playlist has been saved to your Spotify account.",
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
  
  const handleGeneratePlaylist = () => {
    generateMutation.mutate({
      mood: selectedMood,
      genre: selectedGenre || undefined,
      duration: playlistLength,
      limit: Math.ceil(playlistLength / 3) // Approximate number of tracks for the duration
    });
  };
  
  const handleSavePlaylist = () => {
    if (!previewPlaylist) return;
    
    savePlaylistMutation.mutate({
      name: playlistName,
      description: `A ${selectedMood} mood playlist ${selectedGenre ? `with ${selectedGenre} vibes` : ''}`,
      trackUris: previewPlaylist.tracks.map((track: any) => track.uri),
      type: "mood",
      metadata: {
        mood: selectedMood,
        genre: selectedGenre || undefined,
        totalTracks: previewPlaylist.tracks.length,
        totalDurationMin: previewPlaylist.metadata.totalDurationMin
      }
    });
  };
  
  const getMoodTitle = (mood: string) => {
    const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    return capitalizeFirst(mood);
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Mood Creator</h1>
            <p className="text-[#B3B3B3]">Generate playlists tailored to your current mood</p>
          </div>
          
          {step === 1 && (
            <div className="bg-[#282828] rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium mb-3">How are you feeling today?</label>
                  <MoodSelector selectedMood={selectedMood} onSelectMood={setSelectedMood} />
                  
                  <label className="block text-sm font-medium mb-3 mt-6">Mix with genre (optional)</label>
                  <Select 
                    value={selectedGenre} 
                    onValueChange={setSelectedGenre}
                  >
                    <SelectTrigger className="w-full bg-[#3E3E3E] border-gray-700">
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#3E3E3E] border-gray-700">
                      <SelectItem value="">No specific genre</SelectItem>
                      {genresData?.genres.map((genre: string) => (
                        <SelectItem key={genre} value={genre}>
                          {genre.replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="mb-6 mt-6">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium">Playlist length</label>
                      <span className="text-sm text-[#B3B3B3]">{playlistLength} minutes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#B3B3B3] mt-2 mb-2">
                      <span>15 min</span>
                      <span>1 hour</span>
                      <span>3+ hours</span>
                    </div>
                    <Slider 
                      value={[playlistLength]} 
                      onValueChange={(value) => setPlaylistLength(value[0])}
                      min={15}
                      max={180}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Playlist Name</label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="w-full bg-[#3E3E3E] border border-gray-700 rounded-md p-2 text-white"
                    />
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <Button
                      onClick={handleGeneratePlaylist}
                      disabled={!selectedMood || generateMutation.isPending}
                      className="bg-[#1DB954] text-black rounded-full flex-1 hover:bg-opacity-90 font-medium"
                    >
                      {generateMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                      ) : (
                        'Create Playlist'
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      variant="outline"
                      className="rounded-full w-12 h-12 p-0 flex items-center justify-center border-gray-700"
                    >
                      <Settings size={18} />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-center relative hidden md:flex">
                  <div className="w-64 h-64 rounded-lg overflow-hidden relative shadow-xl">
                    <img 
                      src={`https://source.unsplash.com/random/600x600/?${selectedMood}+music`} 
                      className="w-full h-full object-cover" 
                      alt={`${selectedMood} mood visualization`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-xs font-medium bg-[#4F46E5] bg-opacity-80 rounded-full px-3 py-1">
                        {getMoodTitle(selectedMood)}
                      </span>
                      <h3 className="text-xl font-bold mt-2">{playlistName}</h3>
                      <p className="text-sm text-white text-opacity-80">
                        {selectedGenre ? `${selectedGenre} vibes` : `Pure ${selectedMood} vibes`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute -right-4 -bottom-4 w-48 h-48 rounded-lg overflow-hidden transform rotate-6 shadow-lg opacity-70">
                    <img 
                      src={`https://source.unsplash.com/random/400x400/?music+${selectedMood}`}
                      className="w-full h-full object-cover" 
                      alt="Mood visualization background"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && previewPlaylist && (
            <div className="bg-[#282828] rounded-lg p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{previewPlaylist.name}</h2>
                  <p className="text-[#B3B3B3]">
                    {previewPlaylist.tracks.length} tracks • {previewPlaylist.metadata.totalDurationMin} minutes • 
                    {getMoodTitle(selectedMood)} {selectedGenre ? `• ${selectedGenre}` : ''}
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

export default MoodCreator;
