import { Link } from 'wouter';

interface ArtistCardProps {
  title: string;
  description: string;
  imageUrl: string;
  gradientColors: string;
  link: string;
}

const ArtistCard = ({ title, description, imageUrl, gradientColors, link }: ArtistCardProps) => {
  return (
    <div className={`bg-gradient-to-r ${gradientColors} bg-opacity-40 rounded-lg p-5 flex items-center`}>
      <img 
        src={imageUrl} 
        className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-white shadow-lg object-cover" 
        alt={title}
      />
      <div className="ml-4">
        <h3 className="font-bold text-xl">{title}</h3>
        <p className="text-white text-opacity-90 text-sm md:text-base mb-2">{description}</p>
        <Link href={link}>
          <a className="bg-white text-black text-sm rounded-full px-4 py-1.5 font-medium hover:bg-opacity-90 inline-block">
            Create Playlist
          </a>
        </Link>
      </div>
    </div>
  );
};

export default ArtistCard;
