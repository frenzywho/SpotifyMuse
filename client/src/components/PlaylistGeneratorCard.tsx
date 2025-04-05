import { Link } from 'wouter';

interface PlaylistGeneratorCardProps {
  title: string;
  description: string;
  icon: string;
  color: 'indigo' | 'pink' | 'amber' | 'teal';
  link: string;
}

const PlaylistGeneratorCard = ({ 
  title, 
  description, 
  icon, 
  color,
  link 
}: PlaylistGeneratorCardProps) => {
  // Map color to tailwind classes
  const colorClasses = {
    indigo: 'bg-[#4F46E5]',
    pink: 'bg-[#EC4899]',
    amber: 'bg-[#F59E0B]',
    teal: 'bg-[#14B8A6]'
  };
  
  const textColorClasses = {
    indigo: 'text-[#4F46E5]',
    pink: 'text-[#EC4899]',
    amber: 'text-[#F59E0B]',
    teal: 'text-[#14B8A6]'
  };

  return (
    <div className="playlist-card bg-[#181818] rounded-lg p-5 hover:bg-[#282828]">
      <div className="flex items-start">
        <div className={`w-14 h-14 ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}>
          <i className={`fa-solid fa-${icon} text-xl`}></i>
        </div>
        <div className="ml-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-[#B3B3B3] text-sm mt-1">{description}</p>
        </div>
      </div>
      <Link href={link}>
        <a className="mt-4 w-full bg-[#1DB954] bg-opacity-20 text-[#1DB954] rounded-full py-2 font-medium hover:bg-opacity-30 block text-center">
          Get Started
        </a>
      </Link>
    </div>
  );
};

export default PlaylistGeneratorCard;
