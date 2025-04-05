import React from 'react';

interface PlaylistCardProps {
  id: string;
  name: string;
  imageUrl: string;
  totalTracks: number;
  duration: number;
}

const PlaylistCard = ({ id, name, imageUrl, totalTracks, duration }: PlaylistCardProps) => {
  const handlePlay = () => {
    window.open(`https://open.spotify.com/playlist/${id}`, '_blank');
  };

  return (
    <div className="playlist-card bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-300 ease">
      <div className="relative mb-4">
        <img 
          src={imageUrl || `https://source.unsplash.com/random/300x300/?music+playlist`} 
          className="w-full aspect-square rounded-md shadow-md object-cover" 
          alt={name}
        />
        <button 
          onClick={handlePlay}
          className="absolute bottom-2 right-2 bg-[#1DB954] rounded-full w-10 h-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-lg hover:scale-105"
        >
          <i className="fa-solid fa-play text-black"></i>
        </button>
      </div>
      <h3 className="font-bold text-sm mb-1 truncate">{name}</h3>
      <p className="text-xs text-[#B3B3B3] truncate">
        {totalTracks} tracks • {duration} min
      </p>
    </div>
  );
};

export default PlaylistCard;
