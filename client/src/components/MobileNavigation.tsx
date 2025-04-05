import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

const MobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  
  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);
  
  const isActive = (path: string) => {
    return location === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#121212] z-30 border-b border-gray-800">
        <div className="flex justify-between items-center p-4">
          <button onClick={toggleMenu} className="text-white">
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          <div className="flex items-center space-x-2" onClick={() => navigate('/')}>
            <i className="fa-brands fa-spotify text-[#1DB954] text-2xl"></i>
            <h1 className="text-xl font-bold text-white">SpotGen</h1>
          </div>
          <div>
            <img 
              src={user?.imageUrl || "https://i.pravatar.cc/150?img=32"} 
              className="w-8 h-8 rounded-full object-cover" 
              alt="User profile"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 mobile-menu ${isMenuOpen ? 'open' : 'closed'}`}
        style={{ pointerEvents: isMenuOpen ? 'auto' : 'none' }}
      >
        <div className="w-64 bg-[#121212] h-full overflow-y-auto custom-scrollbar" style={{ pointerEvents: 'auto' }}>
          <div className="p-6 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <i className="fa-brands fa-spotify text-[#1DB954] text-2xl"></i>
              <h1 className="text-xl font-bold text-white">SpotGen</h1>
            </div>
            <button onClick={toggleMenu} className="text-white">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <nav className="mt-2">
            <div className="px-4 py-2 text-xs uppercase tracking-wider text-[#B3B3B3]">Discover</div>
            <div 
              className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
              onClick={() => navigate('/')}
            >
              <i className={`fa-solid fa-compass mr-3 ${isActive('/') ? 'text-[#1DB954]' : ''}`}></i>
              <span>Home</span>
            </div>
            
            <div 
              className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/search') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
              onClick={() => navigate('/search')}
            >
              <i className={`fa-solid fa-search mr-3 ${isActive('/search') ? 'text-[#1DB954]' : ''}`}></i>
              <span>Search</span>
            </div>
            
            <div 
              className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/create-playlist/genre') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
              onClick={() => navigate('/create-playlist/genre')}
            >
              <i className={`fa-solid fa-music mr-3 ${isActive('/create-playlist/genre') ? 'text-[#1DB954]' : ''}`}></i>
              <span>Genre Generator</span>
            </div>
            
            <div 
              className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/create-playlist/mood') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
              onClick={() => navigate('/create-playlist/mood')}
            >
              <i className={`fa-solid fa-face-smile mr-3 ${isActive('/create-playlist/mood') ? 'text-[#1DB954]' : ''}`}></i>
              <span>Mood Generator</span>
            </div>
            
            <div 
              className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/genre-explorer') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
              onClick={() => navigate('/genre-explorer')}
            >
              <i className={`fa-solid fa-globe mr-3 ${isActive('/genre-explorer') ? 'text-[#1DB954]' : ''}`}></i>
              <span>Genre Explorer</span>
            </div>
            
            <div 
              className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/artist-explorer') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
              onClick={() => navigate('/artist-explorer')}
            >
              <i className={`fa-solid fa-user-group mr-3 ${isActive('/artist-explorer') ? 'text-[#1DB954]' : ''}`}></i>
              <span>Artist Explorer</span>
            </div>
            
            <div 
              className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/must-listen') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
              onClick={() => navigate('/must-listen')}
            >
              <i className={`fa-solid fa-gem mr-3 ${isActive('/must-listen') ? 'text-[#1DB954]' : ''}`}></i>
              <span>Must-Listen</span>
            </div>
            
            <div 
              className={`flex items-center px-6 py-3 cursor-pointer ${isActive('/replay-generator') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}
              onClick={() => navigate('/replay-generator')}
            >
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
        </div>
      </div>
      
      {/* Mobile player bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#282828] border-t border-gray-800 p-3 flex items-center z-20">
        <img 
          src="https://i.pravatar.cc/150?img=55" 
          className="w-10 h-10 rounded" 
          alt="Now playing"
        />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium truncate">Connect to Spotify</p>
          <p className="text-xs text-[#B3B3B3] truncate">to play music</p>
        </div>
        <div className="flex items-center">
          <button className="mx-2 text-white">
            <i className="fa-solid fa-backward-step"></i>
          </button>
          <button className="mx-2 bg-white rounded-full w-8 h-8 flex items-center justify-center">
            <i className="fa-solid fa-play text-[#121212] text-sm"></i>
          </button>
          <button className="mx-2 text-white">
            <i className="fa-solid fa-forward-step"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
