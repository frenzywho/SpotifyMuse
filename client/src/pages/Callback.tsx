import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

const Callback = () => {
  const [location, navigate] = useLocation();
  const { refreshUser } = useAuth();
  
  useEffect(() => {
    async function handleCallback() {
      try {
        // The callback from Spotify will be handled by the server
        // We just need to refresh the user data
        await refreshUser();
        navigate("/");
      } catch (error) {
        console.error("Authentication callback failed:", error);
        navigate("/login?error=authentication_failed");
      }
    }
    
    handleCallback();
  }, [navigate, refreshUser]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white">
      <div className="text-center">
        <div className="mb-4">
          <i className="fa-brands fa-spotify text-[#1DB954] text-5xl"></i>
        </div>
        <h1 className="text-2xl font-bold mb-2">Authenticating with Spotify...</h1>
        <p className="text-[#B3B3B3]">Please wait while we complete the process.</p>
      </div>
    </div>
  );
};

export default Callback;
