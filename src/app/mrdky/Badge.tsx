import { useEffect, useRef } from 'react';

interface BadgeProps {
  badges?: string[];
}

export function Badge({ badges = [] }: BadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || badges.length <= 3) return;

    const totalWidth = container.scrollWidth / 2; // Divide by 2 since we duplicate
    const duration = totalWidth * 50; // Adjust speed as needed

    const keyframes = `
      @keyframes infiniteSlide {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.innerHTML = keyframes;
    document.head.appendChild(styleElement);
    
    container.style.animation = `infiniteSlide ${duration}ms linear infinite`;

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [badges]);

  // For 3 or fewer badges, display them statically
  if (badges.length <= 3) {
    return (
      <div className="flex">
        {badges.map((badge, index) => (
          <div key={index} className="w-8 h-8 flex items-center justify-center">
            <img src={badge} alt="Achievement badge" className="w-6 h-6 object-contain" />
          </div>
        ))}
      </div>
    );
  }

  // For more than 3 badges, create infinite scroll
  return (
    <div className="relative w-24 h-8 overflow-hidden" aria-label="User badges">
      <div 
        ref={containerRef}
        className="absolute inset-0 flex whitespace-nowrap"
      >
        {[...badges, ...badges].map((badge, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
          >
            <img 
              src={badge} 
              alt="Achievement badge" 
              className="w-6 h-6 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
