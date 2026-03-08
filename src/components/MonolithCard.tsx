import monolithCard from "@/assets/monolith-card.jpg";

interface MonolithCardProps {
  className?: string;
}

const MonolithCard = ({ className = "" }: MonolithCardProps) => {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: '1050/600' }}>
      {/* Background Image */}
      <img
        src={monolithCard}
        alt="Black obsidian monolith business card"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      
      {/* Text Overlay - Positioned for business card layout */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-8">
          {/* Main Slogan */}
          <p className="text-base md:text-lg font-serif tracking-wider leading-relaxed mb-4"
             style={{ 
               color: '#c8826e',
               textShadow: '0 0 15px rgba(200, 130, 110, 0.4)'
             }}>
            秩序是昂貴的驚喜
          </p>
          <p className="text-base md:text-lg font-serif tracking-wider leading-relaxed mb-6"
             style={{ 
               color: '#c8826e',
               textShadow: '0 0 15px rgba(200, 130, 110, 0.4)'
             }}>
            熵增是免費的宿命
          </p>
          
          {/* Brand Name */}
          <p className="text-xs md:text-sm tracking-[0.25em] uppercase mb-1"
             style={{ 
               color: 'rgba(200, 130, 110, 0.8)',
             }}>
            Buoyancis
          </p>
          <p className="text-[10px] md:text-xs tracking-wider"
             style={{ 
               color: 'rgba(200, 130, 110, 0.5)',
             }}>
            布扬玺斯
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonolithCard;
