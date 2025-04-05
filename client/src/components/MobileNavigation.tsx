import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

const MobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
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
          <div className="flex items-center space-x-2">
            <i className="fa-brands fa-spotify text-[#1DB954] text-2xl"></i>
            <h1 className="text-xl font-bold text-white">SpotGen</h1>
          </div>
          <div>
            <img 
              src={user?.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=32&ixid=MnwxfDB8MXxyYW5kb218MHx8fHx8fHx8MTY4MDYyOTcyOA&ixlib=rb-4.0.3&q=80&w=32"} 
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
            <Link href="/">
              <a className={`flex items-center px-6 py-3 ${isActive('/') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}>
                <i className={`fa-solid fa-compass mr-3 ${isActive('/') ? 'text-[#1DB954]' : ''}`}></i>
                <span>Home</span>
              </a>
            </Link>
            <Link href="/genre-explorer">
              <a className={`flex items-center px-6 py-3 ${isActive('/genre-explorer') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}>
                <i className={`fa-solid fa-music mr-3 ${isActive('/genre-explorer') ? 'text-[#1DB954]' : ''}`}></i>
                <span>Genre Explorer</span>
              </a>
            </Link>
            <Link href="/artist-explorer">
              <a className={`flex items-center px-6 py-3 ${isActive('/artist-explorer') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}>
                <i className={`fa-solid fa-user-group mr-3 ${isActive('/artist-explorer') ? 'text-[#1DB954]' : ''}`}></i>
                <span>Artist Explorer</span>
              </a>
            </Link>
            <Link href="/mood-creator">
              <a className={`flex items-center px-6 py-3 ${isActive('/mood-creator') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}>
                <i className={`fa-solid fa-face-smile mr-3 ${isActive('/mood-creator') ? 'text-[#1DB954]' : ''}`}></i>
                <span>Mood Creator</span>
              </a>
            </Link>
            <Link href="/must-listen">
              <a className={`flex items-center px-6 py-3 ${isActive('/must-listen') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}>
                <i className={`fa-solid fa-gem mr-3 ${isActive('/must-listen') ? 'text-[#1DB954]' : ''}`}></i>
                <span>Must-Listen</span>
              </a>
            </Link>
            <Link href="/replay-generator">
              <a className={`flex items-center px-6 py-3 ${isActive('/replay-generator') ? 'text-white bg-[#282828]' : 'text-[#B3B3B3] hover:text-white'}`}>
                <i className={`fa-solid fa-clock-rotate-left mr-3 ${isActive('/replay-generator') ? 'text-[#1DB954]' : ''}`}></i>
                <span>Replay Generator</span>
              </a>
            </Link>

            <div className="px-4 py-2 mt-4 text-xs uppercase tracking-wider text-[#B3B3B3]">Library</div>
            <a href="#" className="flex items-center px-6 py-3 text-[#B3B3B3] hover:text-white">
              <i className="fa-solid fa-heart mr-3"></i>
              <span>Saved Playlists</span>
            </a>
            <a href="#" className="flex items-center px-6 py-3 text-[#B3B3B3] hover:text-white">
              <i className="fa-solid fa-history mr-3"></i>
              <span>Recent Playlists</span>
            </a>
          </nav>
        </div>
      </div>
      
      {/* Mobile player bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#282828] border-t border-gray-800 p-3 flex items-center z-20">
        <img 
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=40&ixid=MnwxfDB8MXxyYW5kb218MHx8bXVzaWMgc3RyZWFtaW5nIGludGVyZmFjZXx8fHx8fDE2OTA4NDQ1NTA&ixlib=rb-4.0.3&q=80&w=40" 
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
