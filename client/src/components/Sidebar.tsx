import { Link, useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const isActive = (path: string) => {
    return location === path;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="hidden md:flex md:w-64 bg-[#121212] border-r border-gray-800 flex-shrink-0 flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <i className="fa-brands fa-spotify text-[#1DB954] text-3xl"></i>
          <h1 className="text-2xl font-bold text-white">SpotGen</h1>
        </div>
        <p className="text-[#B3B3B3] text-xs mt-1">Smart Playlist Generator</p>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-4">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#282828] border-0 text-white placeholder:text-gray-400 focus-visible:ring-[#1DB954]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Button 
            type="submit" 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-transparent"
          >
            <i className="fa-solid fa-arrow-right"></i>
          </Button>
        </form>
      </div>

      <nav className="mt-2 overflow-y-auto custom-scrollbar">
        <div className="px-4 py-2 text-xs uppercase tracking-wider text-[#B3B3B3]">Discover</div>
        <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
             onClick={() => navigate('/')}>
          <i className={`fa-solid fa-compass mr-3 ${isActive('/') ? 'text-[#1DB954]' : ''}`}></i>
          <span>Home</span>
        </div>
        
        <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/search') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
             onClick={() => navigate('/search')}>
          <i className={`fa-solid fa-search mr-3 ${isActive('/search') ? 'text-[#1DB954]' : ''}`}></i>
          <span>Search</span>
        </div>
        
        <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/create-playlist/genre') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
             onClick={() => navigate('/create-playlist/genre')}>
          <i className={`fa-solid fa-music mr-3 ${isActive('/create-playlist/genre') ? 'text-[#1DB954]' : ''}`}></i>
          <span>Genre Generator</span>
        </div>
        
        <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/create-playlist/mood') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
             onClick={() => navigate('/create-playlist/mood')}>
          <i className={`fa-solid fa-face-smile mr-3 ${isActive('/create-playlist/mood') ? 'text-[#1DB954]' : ''}`}></i>
          <span>Mood Generator</span>
        </div>
        
        <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/genre-explorer') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
             onClick={() => navigate('/genre-explorer')}>
          <i className={`fa-solid fa-globe mr-3 ${isActive('/genre-explorer') ? 'text-[#1DB954]' : ''}`}></i>
          <span>Genre Explorer</span>
        </div>
        
        <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/artist-explorer') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
             onClick={() => navigate('/artist-explorer')}>
          <i className={`fa-solid fa-user-group mr-3 ${isActive('/artist-explorer') ? 'text-[#1DB954]' : ''}`}></i>
          <span>Artist Explorer</span>
        </div>
        
        <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/must-listen') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
             onClick={() => navigate('/must-listen')}>
          <i className={`fa-solid fa-gem mr-3 ${isActive('/must-listen') ? 'text-[#1DB954]' : ''}`}></i>
          <span>Must-Listen</span>
        </div>
        
        <div className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/replay-generator') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
             onClick={() => navigate('/replay-generator')}>
          <i className={`fa-solid fa-clock-rotate-left mr-3 ${isActive('/replay-generator') ? 'text-[#1DB954]' : ''}`}></i>
          <span>Replay Generator</span>
        </div>

        <div className="px-4 py-2 mt-4 text-xs uppercase tracking-wider text-[#B3B3B3]">Library</div>
        <div className="flex items-center px-6 py-3 text-[#B3B3B3] hover:text-white cursor-pointer">
          <i className="fa-solid fa-heart mr-3"></i>
          <span>Saved Playlists</span>
        </div>
        <div className="flex items-center px-6 py-3 text-[#B3B3B3] hover:text-white cursor-pointer">
          <i className="fa-solid fa-history mr-3"></i>
          <span>Recent Playlists</span>
        </div>
      </nav>

      <div className="mt-auto p-6">
        <div className="flex items-center text-[#B3B3B3] hover:text-white cursor-pointer"
             onClick={() => navigate('/settings')}>
          <i className="fa-solid fa-gear mr-2"></i>
          <span>Settings</span>
        </div>
        <div className="flex items-center mt-4 bg-[#282828] rounded-full p-2">
          <img 
            src={user?.imageUrl || "https://i.pravatar.cc/150?img=32"} 
            className="w-8 h-8 rounded-full object-cover" 
            alt="User profile"
          />
          <span className="ml-2 text-sm truncate">{user?.displayName || 'User'}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
