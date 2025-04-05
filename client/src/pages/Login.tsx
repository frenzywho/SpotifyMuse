import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#121212]">Loading...</div>;
  }
  
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white p-4">
      <div className="max-w-md w-full bg-[#282828] rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <i className="fa-brands fa-spotify text-[#1DB954] text-6xl"></i>
        </div>
        <h1 className="text-3xl font-bold mb-2">SpotGen</h1>
        <p className="text-xl mb-6">Smart Playlist Generator</p>
        
        <p className="text-[#B3B3B3] mb-8">
          Connect with your Spotify account to create customized playlists based on genres, 
          artists, moods, and your listening habits.
        </p>
        
        <Button
          onClick={handleLogin}
          className="w-full bg-[#1DB954] text-black hover:bg-opacity-90 font-medium py-3 text-lg"
        >
          <i className="fa-brands fa-spotify mr-2"></i> Connect with Spotify
        </Button>
        
        <p className="mt-6 text-xs text-[#B3B3B3]">
          By connecting, you authorize SpotGen to access your Spotify data and create playlists on your behalf.
          We do not store your Spotify password.
        </p>
      </div>
      
      <div className="mt-12 text-center max-w-md">
        <h2 className="text-xl font-bold mb-4">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#282828] p-4 rounded-lg">
            <i className="fa-solid fa-music text-[#1DB954] text-xl mb-2"></i>
            <h3 className="font-bold mb-1">Genre Explorer</h3>
            <p className="text-sm text-[#B3B3B3]">Create playlists from your favorite genres</p>
          </div>
          <div className="bg-[#282828] p-4 rounded-lg">
            <i className="fa-solid fa-user-group text-[#EC4899] text-xl mb-2"></i>
            <h3 className="font-bold mb-1">Artist Explorer</h3>
            <p className="text-sm text-[#B3B3B3]">Discover essential and hidden tracks</p>
          </div>
          <div className="bg-[#282828] p-4 rounded-lg">
            <i className="fa-solid fa-face-smile text-[#F59E0B] text-xl mb-2"></i>
            <h3 className="font-bold mb-1">Mood Creator</h3>
            <p className="text-sm text-[#B3B3B3]">Generate playlists based on your mood</p>
          </div>
          <div className="bg-[#282828] p-4 rounded-lg">
            <i className="fa-solid fa-gem text-[#14B8A6] text-xl mb-2"></i>
            <h3 className="font-bold mb-1">Must-Listen Mix</h3>
            <p className="text-sm text-[#B3B3B3]">Discover tracks you'll love</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
