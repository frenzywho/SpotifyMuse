import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ReplayGenerator = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Replay Generator</h1>
            <p className="text-[#B3B3B3]">Revisit your favorite music from different time periods</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-r from-[#4F46E5] to-[#5D58D7] text-white border-0 overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-2">Monthly Replay</h2>
                <p className="text-sm opacity-90 mb-4">Relive your top tracks from the past month</p>
                <div className="h-40 flex items-center justify-center bg-black bg-opacity-20 rounded-lg mb-4">
                  <span className="text-white opacity-70">Coming Soon</span>
                </div>
                <button className="w-full py-2 bg-white text-[#4F46E5] rounded-full font-medium mt-2 opacity-70 cursor-not-allowed">
                  Generate Monthly Replay
                </button>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-[#EC4899] to-[#D946EF] text-white border-0 overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-2">Yearly Throwback</h2>
                <p className="text-sm opacity-90 mb-4">A compilation of your yearly favorites</p>
                <div className="h-40 flex items-center justify-center bg-black bg-opacity-20 rounded-lg mb-4">
                  <span className="text-white opacity-70">Coming Soon</span>
                </div>
                <button className="w-full py-2 bg-white text-[#EC4899] rounded-full font-medium mt-2 opacity-70 cursor-not-allowed">
                  Generate Yearly Throwback
                </button>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white border-0 overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-2">Seasonal Favorites</h2>
                <p className="text-sm opacity-90 mb-4">Tracks that defined your seasons</p>
                <div className="h-40 flex items-center justify-center bg-black bg-opacity-20 rounded-lg mb-4">
                  <span className="text-white opacity-70">Coming Soon</span>
                </div>
                <button className="w-full py-2 bg-white text-[#F59E0B] rounded-full font-medium mt-2 opacity-70 cursor-not-allowed">
                  Generate Seasonal Mix
                </button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-10 p-6 bg-[#282828] rounded-lg text-center">
            <h2 className="text-xl font-bold mb-3">Coming Soon!</h2>
            <p className="text-[#B3B3B3] mb-4">
              We're working on bringing you personalized time-based playlists to help you rediscover your favorite music from different periods.
              Stay tuned for these exciting features!
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReplayGenerator;
