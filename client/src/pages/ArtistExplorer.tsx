import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { queryClient } from "@/lib/queryClient";

const ArtistExplorer = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedArtists, setSelectedArtists] = useState<any[]>([]);
  const [includeTopTracks, setIncludeTopTracks] = useState<boolean>(true);
  const [includeRelatedArtists, setIncludeRelatedArtists] = useState<boolean>(true);
  const [playlistName, setPlaylistName] = useState<string>("Artist Exploration");
  const [playlistLength, setPlaylistLength] = useState<number>(60);
  
  const [previewPlaylist, setPreviewPlaylist] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  
  // Search artists query
  const { data: searchResults, isLoading: searching, refetch } = useQuery({
    queryKey: ["/api/spotify/search/artists", searchQuery],
    enabled: false,
  });
  
  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      refetch();
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  const handleSelectArtist = (artist: any) => {
    if (selectedArtists.some(a => a.id === artist.id)) {
      setSelectedArtists(selectedArtists.filter(a => a.id !== artist.id));
    } else {
      if (selectedArtists.length < 5) {
        setSelectedArtists([...selectedArtists, artist]);
      } else {
        toast({
          title: "Maximum artists selected",
          description: "You can select up to 5 artists.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Generate recommendations
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/spotify/recommendations/artist", data);
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
  
  const handleGeneratePlaylist = () => {
    if (selectedArtists.length === 0) {
      toast({
        title: "No artists selected",
        description: "Please select at least one artist.",
        variant: "destructive",
      });
      return;
    }
    
    generateMutation.mutate({
      artistIds: selectedArtists.map(artist => artist.id),
      includeTopTracks,
      includeRelatedArtists,
      limit: Math.ceil(playlistLength / 3) // Approximate number of tracks for the duration
    });
  };
  
  const handleSavePlaylist = () => {
    if (!previewPlaylist) return;
    
    savePlaylistMutation.mutate({
      name: playlistName,
      description: `An exploration of ${selectedArtists.map(a => a.name).join(', ')} and similar artists`,
      trackUris: previewPlaylist.tracks.map((track: any) => track.uri),
      type: "artist",
      metadata: {
        artists: selectedArtists.map(a => ({ id: a.id, name: a.name })),
        includeTopTracks,
        includeRelatedArtists,
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Artist Explorer</h1>
            <p className="text-[#B3B3B3]">Dive deep into artists with essential and hidden tracks</p>
          </div>
          
          {step === 1 && (
            <div className="bg-[#282828] rounded-lg p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Search for Artists</h2>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Search for an artist..."
                      className="w-full bg-[#3E3E3E] border border-gray-700 rounded-md p-2 pl-8 text-white"
                    />
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#B3B3B3]" />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={searchQuery.trim().length === 0 || searching}
                    className="bg-[#1DB954] text-black hover:bg-opacity-90"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>
                
                {/* Search Results */}
                {searchResults && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.items.map((artist: any) => (
                      <div 
                        key={artist.id} 
                        className={`flex items-center p-3 rounded-lg cursor-pointer ${
                          selectedArtists.some(a => a.id === artist.id) 
                            ? 'bg-[#1DB954] bg-opacity-20 border border-[#1DB954]' 
                            : 'bg-[#3E3E3E] hover:bg-[#4E4E4E]'
                        }`}
                        onClick={() => handleSelectArtist(artist)}
                      >
                        <img 
                          src={artist.images[0]?.url || 'https://place-hold.it/64x64/1e1e1e/ffffff?text=No%20Image&fontsize=12'} 
                          alt={artist.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="ml-3">
                          <div className="font-medium">{artist.name}</div>
                          <div className="text-xs text-[#B3B3B3]">
                            {artist.followers?.total?.toLocaleString()} followers
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Selected Artists */}
                {selectedArtists.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Selected Artists</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedArtists.map(artist => (
                        <div key={artist.id} className="bg-[#1DB954] text-black rounded-full px-3 py-1 flex items-center">
                          <span className="mr-2">{artist.name}</span>
                          <button 
                            onClick={() => handleSelectArtist(artist)}
                            className="hover:bg-black hover:bg-opacity-20 rounded-full h-5 w-5 flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
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
                
                <div className="mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="top-tracks">Include Top Tracks</Label>
                      <div className="text-xs text-[#B3B3B3]">Add the artist's most popular songs</div>
                    </div>
                    <Switch
                      id="top-tracks"
                      checked={includeTopTracks}
                      onCheckedChange={setIncludeTopTracks}
                      className="data-[state=checked]:bg-[#1DB954]"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="related-artists">Include Related Artists</Label>
                      <div className="text-xs text-[#B3B3B3]">Add tracks from similar artists</div>
                    </div>
                    <Switch
                      id="related-artists"
                      checked={includeRelatedArtists}
                      onCheckedChange={setIncludeRelatedArtists}
                      className="data-[state=checked]:bg-[#1DB954]"
                    />
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
                disabled={selectedArtists.length === 0 || generateMutation.isPending}
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
                    {selectedArtists.map(a => a.name).join(', ')}
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

export default ArtistExplorer;
