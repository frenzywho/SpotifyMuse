interface MoodSelectorProps {
  selectedMood: string;
  onSelectMood: (mood: string) => void;
}

const MoodSelector = ({ selectedMood, onSelectMood }: MoodSelectorProps) => {
  // Moods with their icons and color classes
  const moods = [
    { id: 'happy', icon: 'face-smile', color: 'indigo' },
    { id: 'chill', icon: 'bed', color: 'teal' },
    { id: 'energetic', icon: 'bolt', color: 'amber' },
    { id: 'romantic', icon: 'heart', color: 'pink' },
    { id: 'dreamy', icon: 'moon', color: 'indigo' },
    { id: 'angry', icon: 'face-angry', color: 'red' }
  ];
  
  // Map color to text color classes
  const textColorMap: Record<string, string> = {
    indigo: 'text-[#4F46E5]',
    teal: 'text-[#14B8A6]',
    amber: 'text-[#F59E0B]',
    pink: 'text-[#EC4899]',
    red: 'text-red-600'
  };
  
  // Map color to background classes for selected state
  const bgColorMap: Record<string, string> = {
    indigo: 'bg-[#4F46E5]',
    teal: 'bg-[#14B8A6]',
    amber: 'bg-[#F59E0B]',
    pink: 'bg-[#EC4899]',
    red: 'bg-red-600'
  };

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {moods.map(mood => (
        <button
          key={mood.id}
          onClick={() => onSelectMood(mood.id)}
          className={`mood-btn p-3 rounded-lg flex flex-col items-center ${
            selectedMood === mood.id
              ? `${bgColorMap[mood.color]} bg-opacity-40`
              : 'bg-[#3E3E3E] hover:bg-opacity-40 hover:' + bgColorMap[mood.color]
          }`}
        >
          <i className={`fa-solid fa-${mood.icon} text-2xl mb-2 ${selectedMood === mood.id ? 'text-white' : textColorMap[mood.color]}`}></i>
          <span className="text-xs capitalize">{mood.id}</span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;
