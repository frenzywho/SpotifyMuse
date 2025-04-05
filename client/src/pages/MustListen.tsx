import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const MustListen = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [playlistName, setPlaylistName] = useState<string>("My Must-Listen Mix");
  
  // Get Must-Listen recommendations
  const { data: recommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ["/api/spotify/recommendations/must-listen"],
    enabled: isAuthenticated,
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
        description: "Your must-listen playlist has been saved to your Spotify account.",
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
  
  const handleSavePlaylist = () => {
    if (!recommendations) return;
    
    savePlaylistMutation.mutate({
      name: playlistName,
      description: recommendations.description,
      trackUris: recommendations.tracks.map((track: any) => track.uri),
      type: "must-listen",
      metadata: {
        totalTracks: recommendations.tracks.length,
        totalDurationMin: Math.round(recommendations.tracks.reduce((acc: number, track: any) => acc + track.duration_ms, 0) / 60000)
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Must-Listen</h1>
            <p className="text-[#B3B3B3]">Discover hidden gems and essential tracks we think you'll love</p>
          </div>
          
          {loadingRecommendations ? (
            <div className="bg-[#282828] rounded-lg p-6 md:p-8 flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-[#1DB954]" />
            </div>
          ) : recommendations ? (
            <div className="bg-[#282828] rounded-lg p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                  <img 
                    src={`https://source.unsplash.com/random/300x300/?music+collection`}
                    alt="Must-Listen Playlist"
                    className="w-full h-auto rounded-lg shadow-lg mb-4" 
                  />
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Playlist Name</label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="w-full bg-[#3E3E3E] border border-gray-700 rounded-md p-2 text-white"
                    />
                  </div>
                  
                  <p className="text-sm text-[#B3B3B3] mb-4">
                    This playlist features a mix of tracks you've saved but may have forgotten, 
                    new releases from artists you follow, and popular songs in your favorite genres 
                    that you haven't heard yet.
                  </p>
                  
                  <Button
                    onClick={handleSavePlaylist}
                    disabled={savePlaylistMutation.isPending}
                    className="w-full bg-[#1DB954] text-black hover:bg-opacity-90 font-medium py-2.5"
                  >
                    {savePlaylistMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      'Save to Spotify'
                    )}
                  </Button>
                </div>
                
                <div className="md:col-span-2">
                  <h2 className="text-xl font-bold mb-4">{recommendations.name}</h2>
                  <p className="text-[#B3B3B3] mb-4">{recommendations.description}</p>
                  
                  <div className="bg-[#1E1E1E] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="border-b border-[#3E3E3E]">
                        <tr>
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left hidden md:table-cell">Artist</th>
                          <th className="px-4 py-2 text-right">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendations.tracks.map((track: any, index: number) => (
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
                            <td className="px-4 py-2 text-right">
                              {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#282828] rounded-lg p-6 md:p-8 text-center py-10">
              <p className="text-[#B3B3B3]">Failed to load recommendations. Please try again later.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MustListen;
