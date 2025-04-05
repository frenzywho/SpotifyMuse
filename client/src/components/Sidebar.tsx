import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
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

      <nav className="mt-2 overflow-y-auto custom-scrollbar">
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

      <div className="mt-auto p-6">
        <Link href="/settings">
          <a className="flex items-center text-[#B3B3B3] hover:text-white">
            <i className="fa-solid fa-gear mr-2"></i>
            <span>Settings</span>
          </a>
        </Link>
        <div className="flex items-center mt-4 bg-[#282828] rounded-full p-2">
          <img 
            src={user?.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=32&ixid=MnwxfDB8MXxyYW5kb218MHx8fHx8fHx8MTY4MDYyOTcyOA&ixlib=rb-4.0.3&q=80&w=32"} 
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
