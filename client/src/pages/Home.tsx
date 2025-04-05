import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import DailyRecommendation from "@/components/DailyRecommendation";
import PlaylistGeneratorCard from "@/components/PlaylistGeneratorCard";
import PlaylistCard from "@/components/PlaylistCard";
import ArtistCard from "@/components/ArtistCard";

const Home = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const { data: dailyRecommendation, isLoading: loadingDaily } = useQuery({
    queryKey: ["/api/spotify/recommendations/daily"],
    enabled: isAuthenticated,
  });

  const { data: recentPlaylists, isLoading: loadingRecent } = useQuery({
    queryKey: ["/api/playlists/recent"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#121212]">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#121212] text-white">
      <Sidebar />
      <MobileNavigation />
      
      <div className="flex-1 overflow-auto custom-scrollbar bg-gradient-to-b from-[#1e1e1e] to-[#121212] pt-4 md:pt-0">
        <main className="p-4 md:p-8 mt-14 md:mt-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user?.displayName || 'User'}</h1>
            <p className="text-[#B3B3B3]">Let's create some amazing playlists today!</p>
          </div>

          {/* Daily Recommendation */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Your Daily Spark</h2>
            </div>
            
            {loadingDaily ? (
              <div className="h-60 bg-[#282828] rounded-lg animate-pulse"></div>
            ) : (
              dailyRecommendation && <DailyRecommendation recommendation={dailyRecommendation} />
            )}
          </section>

          {/* Playlist Generators */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">Create a Playlist</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PlaylistGeneratorCard 
                title="Genre Explorer" 
                description="Create playlists based on your favorite music genres"
                icon="music"
                color="indigo"
                link="/genre-explorer"
              />
              
              <PlaylistGeneratorCard 
                title="Artist Explorer" 
                description="Dive deep into artists with essential and hidden tracks"
                icon="user-group"
                color="pink"
                link="/artist-explorer"
              />
              
              <PlaylistGeneratorCard 
                title="Mood Creator" 
                description="Generate playlists tailored to your current mood"
                icon="face-smile"
                color="amber"
                link="/mood-creator"
              />
            </div>
          </section>

          {/* Recent Playlists */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recently Created</h2>
            </div>
            
            {loadingRecent ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-[#282828] rounded-lg p-4 animate-pulse h-60"></div>
                ))}
              </div>
            ) : recentPlaylists && recentPlaylists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentPlaylists.map(playlist => (
                  <PlaylistCard 
                    key={playlist.id}
                    id={playlist.spotifyId}
                    name={playlist.name}
                    imageUrl={playlist.imageUrl || ''}
                    totalTracks={playlist.metadata?.totalTracks || 0}
                    duration={playlist.metadata?.totalDurationMin || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[#B3B3B3]">
                <p>You haven't created any playlists yet. Get started with one of the generators above!</p>
              </div>
            )}
          </section>

          {/* Featured Artist Explorer */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Artist Explorer</h2>
              <button onClick={() => navigate('/artist-explorer')} className="text-[#B3B3B3] hover:text-white text-sm">See More</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ArtistCard 
                title="Dive into the 80s"
                description="Explore essential tracks from the defining decade"
                imageUrl="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=120&ixid=MnwxfDB8MXxyYW5kb218MHx8bXVzaWMgc3RyZWFtaW5nIGludGVyZmFjZXx8fHx8fDE2OTA4NDUxMjg&ixlib=rb-4.0.3&q=80&w=120"
                gradientColors="from-[#F59E0B] to-[#EC4899]"
                link="/artist-explorer"
              />
              
              <ArtistCard 
                title="Jazz Pioneers"
                description="Discover influential artists who shaped modern jazz"
                imageUrl="https://images.unsplash.com/photo-1501612780327-45045538702b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=120&ixid=MnwxfDB8MXxyYW5kb218MHx8bXVzaWMgc3RyZWFtaW5nIGludGVyZmFjZXx8fHx8fDE2OTA4NDUxODA&ixlib=rb-4.0.3&q=80&w=120"
                gradientColors="from-[#14B8A6] to-[#4F46E5]"
                link="/artist-explorer"
              />
            </div>
          </section>

          {/* Footer Information */}
          <footer className="text-center text-[#B3B3B3] text-xs mt-12 pb-6">
            <p>© {new Date().getFullYear()} SpotGen • Made with <i className="fa-solid fa-heart text-[#1DB954]"></i> for Spotify users</p>
            <p className="mt-2">All music is streamed through your Spotify account. SpotGen does not store or host any music files.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Home;
