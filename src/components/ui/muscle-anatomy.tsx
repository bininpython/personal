import React from 'react';

type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'abs' | 'obliques' | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'traps' | 'lower_back';

interface MuscleAnatomyProps {
  highlighted: MuscleGroup[];
  className?: string;
  frontColor?: string;
  highlightColor?: string;
}

export function MuscleAnatomy({
  highlighted = [],
  className = '',
  frontColor = 'hsl(var(--muted))',
  highlightColor = 'hsl(var(--primary))'
}: MuscleAnatomyProps) {
  
  const getFill = (muscle: MuscleGroup) => 
    highlighted.includes(muscle) ? highlightColor : frontColor;

  // We are using simplified polygonal representations of muscles for a clean, minimalist look.
  // In a full production app, this would be a highly detailed SVG.
  return (
    <div className={`flex items-center justify-center gap-8 ${className}`}>
      {/* FRONT BODY */}
      <div className="relative w-32 h-64 sm:w-40 sm:h-80">
        <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-md">
          <g id="body-front" stroke="hsl(var(--border))" strokeWidth="0.5">
            {/* Head */}
            <circle cx="50" cy="15" r="8" fill={frontColor} opacity="0.3" />
            
            {/* Traps (Front) */}
            <polygon points="45,22 55,22 65,30 35,30" fill={getFill('traps')} className="transition-colors duration-500" />
            
            {/* Shoulders */}
            <path d="M35,30 C25,30 20,40 25,50 L30,45 Z" fill={getFill('shoulders')} className="transition-colors duration-500" />
            <path d="M65,30 C75,30 80,40 75,50 L70,45 Z" fill={getFill('shoulders')} className="transition-colors duration-500" />
            
            {/* Chest */}
            <path d="M35,30 L65,30 L65,55 C65,60 50,65 50,65 C50,65 35,60 35,55 Z" fill={getFill('chest')} className="transition-colors duration-500" />
            
            {/* Abs */}
            <polygon points="40,58 60,58 55,85 45,85" fill={getFill('abs')} className="transition-colors duration-500" />
            
            {/* Obliques */}
            <polygon points="35,55 40,58 45,85 32,82" fill={getFill('obliques')} className="transition-colors duration-500" />
            <polygon points="65,55 60,58 55,85 68,82" fill={getFill('obliques')} className="transition-colors duration-500" />
            
            {/* Biceps */}
            <path d="M25,50 C20,55 20,65 25,70 L30,60 Z" fill={getFill('biceps')} className="transition-colors duration-500" />
            <path d="M75,50 C80,55 80,65 75,70 L70,60 Z" fill={getFill('biceps')} className="transition-colors duration-500" />
            
            {/* Forearms (Front) */}
            <polygon points="25,70 15,95 20,95 28,70" fill={getFill('forearms')} className="transition-colors duration-500" />
            <polygon points="75,70 85,95 80,95 72,70" fill={getFill('forearms')} className="transition-colors duration-500" />
            
            {/* Quadriceps */}
            <path d="M32,85 L48,85 L45,130 C45,135 35,135 30,130 Z" fill={getFill('quadriceps')} className="transition-colors duration-500" />
            <path d="M52,85 L68,85 L70,130 C70,135 60,135 55,130 Z" fill={getFill('quadriceps')} className="transition-colors duration-500" />
            
            {/* Calves (Front) */}
            <path d="M30,135 L45,135 L40,175 L32,175 Z" fill={getFill('calves')} opacity="0.6" className="transition-colors duration-500" />
            <path d="M55,135 L70,135 L68,175 L60,175 Z" fill={getFill('calves')} opacity="0.6" className="transition-colors duration-500" />
            
            {/* Feet */}
            <polygon points="32,175 40,175 42,185 28,185" fill={frontColor} opacity="0.3" />
            <polygon points="60,175 68,175 72,185 58,185" fill={frontColor} opacity="0.3" />
          </g>
        </svg>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          Frente
        </div>
      </div>

      {/* BACK BODY */}
      <div className="relative w-32 h-64 sm:w-40 sm:h-80">
        <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-md">
          <g id="body-back" stroke="hsl(var(--border))" strokeWidth="0.5">
            {/* Head */}
            <circle cx="50" cy="15" r="8" fill={frontColor} opacity="0.3" />
            
            {/* Traps (Back) */}
            <polygon points="45,20 55,20 70,35 50,45 30,35" fill={getFill('traps')} className="transition-colors duration-500" />
            
            {/* Shoulders (Back) */}
            <path d="M30,35 C20,35 15,45 22,50 L28,42 Z" fill={getFill('shoulders')} className="transition-colors duration-500" />
            <path d="M70,35 C80,35 85,45 78,50 L72,42 Z" fill={getFill('shoulders')} className="transition-colors duration-500" />
            
            {/* Back (Lats/Mid) */}
            <path d="M30,45 L70,45 L60,80 L40,80 Z" fill={getFill('back')} className="transition-colors duration-500" />
            
            {/* Lower Back */}
            <polygon points="40,80 60,80 55,85 45,85" fill={getFill('lower_back')} className="transition-colors duration-500" />
            
            {/* Triceps */}
            <path d="M22,50 C18,55 18,65 24,70 L28,60 Z" fill={getFill('triceps')} className="transition-colors duration-500" />
            <path d="M78,50 C82,55 82,65 76,70 L72,60 Z" fill={getFill('triceps')} className="transition-colors duration-500" />
            
            {/* Forearms (Back) */}
            <polygon points="24,70 12,95 18,95 28,70" fill={getFill('forearms')} className="transition-colors duration-500" />
            <polygon points="76,70 88,95 82,95 72,70" fill={getFill('forearms')} className="transition-colors duration-500" />
            
            {/* Glutes */}
            <path d="M32,85 L68,85 C68,95 65,100 50,100 C35,100 32,95 32,85 Z" fill={getFill('glutes')} className="transition-colors duration-500" />
            
            {/* Hamstrings */}
            <path d="M32,100 C32,110 35,130 35,130 L45,130 L45,100 Z" fill={getFill('hamstrings')} className="transition-colors duration-500" />
            <path d="M68,100 C68,110 65,130 65,130 L55,130 L55,100 Z" fill={getFill('hamstrings')} className="transition-colors duration-500" />
            
            {/* Calves */}
            <path d="M35,135 C30,145 30,155 35,170 L42,170 L45,135 Z" fill={getFill('calves')} className="transition-colors duration-500" />
            <path d="M65,135 C70,145 70,155 65,170 L58,170 L55,135 Z" fill={getFill('calves')} className="transition-colors duration-500" />
            
            {/* Feet */}
            <polygon points="35,170 42,170 40,180 32,180" fill={frontColor} opacity="0.3" />
            <polygon points="65,170 58,170 60,180 68,180" fill={frontColor} opacity="0.3" />
          </g>
        </svg>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          Costas
        </div>
      </div>
    </div>
  );
}
