import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface DailyRecommendationProps {
  recommendation: {
    name: string;
    description: string;
    tracks: any[];
  };
}

const DailyRecommendation = ({ recommendation }: DailyRecommendationProps) => {
  const { toast } = useToast();
  
  const savePlaylistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/spotify/playlists", {
        name: recommendation.name,
        description: recommendation.description,
        trackUris: recommendation.tracks.map(track => track.uri),
        type: "daily",
        metadata: {
          totalTracks: recommendation.tracks.length,
          totalDurationMin: Math.round(recommendation.tracks.reduce((acc, track) => acc + track.duration_ms, 0) / 60000)
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your daily playlist has been saved to your Spotify account.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save playlist. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Get a random image from the tracks for display
  const getRandomImage = () => {
    if (recommendation.tracks.length === 0) return "";
    const randomTrack = recommendation.tracks[Math.floor(Math.random() * recommendation.tracks.length)];
    return randomTrack.album.images[0]?.url || "";
  };
  
  // Calculate total duration of the playlist
  const totalDuration = Math.round(recommendation.tracks.reduce((acc, track) => acc + track.duration_ms, 0) / 60000);

  return (
    <div className="bg-gradient-to-r from-[#4F46E5] to-[#EC4899] rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center">
      <div className="mb-4 md:mb-0 md:mr-6 relative">
        <img 
          src={getRandomImage() || "https://source.unsplash.com/random/240x240/?music+mood+concept"} 
          alt={recommendation.name} 
          className="w-40 h-40 md:w-60 md:h-60 object-cover rounded shadow-lg"
        />
        <div className="absolute -right-3 -bottom-3 bg-[#4F46E5] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-play text-lg"></i>
        </div>
      </div>
      <div className="flex-1">
        <span className="bg-white bg-opacity-20 text-xs rounded-full px-3 py-1 inline-block mb-2">
          {recommendation.description}
        </span>
        <h3 className="text-2xl md:text-3xl font-bold mb-2">{recommendation.name}</h3>
        <p className="text-white text-opacity-80 mb-4">
          A custom mix of {recommendation.tracks.length} tracks created just for you today.
        </p>
        <div className="flex items-center text-sm text-white text-opacity-70 mb-5">
          <span className="mr-4"><i className="fa-regular fa-clock mr-1"></i> {totalDuration} min</span>
          <span><i className="fa-solid fa-music mr-1"></i> {recommendation.tracks.length} tracks</span>
        </div>
        <div className="flex space-x-3">
          <Button 
            className="bg-white text-[#121212] rounded-full px-6 py-2 font-medium flex items-center hover:bg-opacity-90"
          >
            <i className="fa-solid fa-play mr-2"></i> Play Now
          </Button>
          <Button
            onClick={() => savePlaylistMutation.mutate()}
            disabled={savePlaylistMutation.isPending}
            variant="outline"
            className="bg-transparent border border-white text-white rounded-full px-6 py-2 font-medium hover:bg-white hover:bg-opacity-10"
          >
            {savePlaylistMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              'Save to Spotify'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyRecommendation;
