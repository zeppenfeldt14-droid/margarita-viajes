import React, { useState, useEffect } from 'react';

interface HotelCardProps {
  image?: string; // Mantener para fallback
  photos?: string[];
  title: string;
  price?: string;
  plan?: string;
  onQuote?: () => void;
  className?: string;
}

export const HotelCard: React.FC<HotelCardProps> = ({ image, photos = [], title, price, plan, onQuote, className = "" }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const displayPhotos = photos.length > 0 ? photos : (image ? [image] : ['https://via.placeholder.com/800']);

  useEffect(() => {
    if (displayPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % displayPhotos.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [displayPhotos.length]);

  return (
    <div className={`bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex flex-col group hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 cursor-pointer shrink-0 w-[280px] md:w-auto ${className}`} onClick={onQuote}>
      <div className="h-64 rounded-t-[1.5rem] rounded-b-lg overflow-hidden mb-4 relative">
        <img 
          src={displayPhotos[currentImg]} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        {displayPhotos.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {displayPhotos.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white w-3' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>
      <div className="px-2 pb-2 flex-grow flex flex-col">
        <h3 className="text-xl font-black text-[#0B132B] italic tracking-tight uppercase">{title}</h3>
        {price && (
          <div className="flex items-center justify-between mb-6">
            <span className="text-orange-500 font-bold text-sm">{price}</span>
            {plan && <span className="bg-orange-50 text-orange-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-orange-100/50">{plan}</span>}
          </div>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onQuote?.(); }}
          className="mt-auto w-full bg-[#0B132B] hover:bg-orange-500 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-colors"
        >
          Cotizar
        </button>
      </div>
    </div>
  );
};

export const FullDayCard: React.FC<HotelCardProps> = ({ image, photos = [], title, price, onQuote, className = "" }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const displayPhotos = photos.length > 0 ? photos : (image ? [image] : ['https://via.placeholder.com/800']);

  useEffect(() => {
    if (displayPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % displayPhotos.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [displayPhotos.length]);

  return (
    <div 
      className={`group relative h-[400px] rounded-[2rem] overflow-hidden shadow-md cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 shrink-0 w-[280px] md:w-auto ${className}`} 
      onClick={onQuote}
    >
      <img 
        src={displayPhotos[currentImg]} 
        alt={title} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-transparent opacity-90"></div>
      <div className="absolute bottom-0 w-full p-6 flex flex-col">
        <h3 className="text-2xl font-black text-white italic tracking-tight uppercase mb-1">{title}</h3>
        {price && (
          <span className="text-white font-bold text-sm flex items-center gap-1 mb-4">
            {price} <span className="text-xs font-normal opacity-70"> / persona</span>
          </span>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onQuote?.(); }}
          className="w-full bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-[#0B132B] border border-white/50 font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all"
        >
          Cotizar
        </button>
      </div>
      {displayPhotos.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-1">
          {displayPhotos.map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full transition-all ${i === currentImg ? 'bg-white h-4' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
};
