import React from 'react';
import Image from 'next/image';

interface AnatomyImageProps {
  gender: 'male' | 'female';
  viewType: 'anterior' | 'posterior';
  onMuscleSelect: (muscleId: string) => void;
  activeMuscle: string | null;
}

// Hotspots mapping using percentage coordinates over the real images
const HOTSPOTS = {
  anterior: [
    { id: 'chest', label: 'Peitoral', top: 30, left: 50 },
    { id: 'front-deltoids', label: 'Ombro Esquerdo', top: 27, left: 33 },
    { id: 'front-deltoids', label: 'Ombro Direito', top: 27, left: 67 },
    { id: 'biceps', label: 'Bíceps Esq.', top: 37, left: 28 },
    { id: 'biceps', label: 'Bíceps Dir.', top: 37, left: 72 },
    { id: 'abs', label: 'Abdômen', top: 43, left: 50 },
    { id: 'obliques', label: 'Oblíquos Esq.', top: 45, left: 40 },
    { id: 'obliques', label: 'Oblíquos Dir.', top: 45, left: 60 },
    { id: 'forearm', label: 'Antebraço Esq.', top: 50, left: 18 },
    { id: 'forearm', label: 'Antebraço Dir.', top: 50, left: 82 },
    { id: 'quadriceps', label: 'Quadríceps Esq.', top: 65, left: 40 },
    { id: 'quadriceps', label: 'Quadríceps Dir.', top: 65, left: 60 },
    { id: 'calves', label: 'Panturrilha Esq.', top: 85, left: 40 },
    { id: 'calves', label: 'Panturrilha Dir.', top: 85, left: 60 },
  ],
  posterior: [
    { id: 'trapezius', label: 'Trapézio', top: 22, left: 50 },
    { id: 'back-deltoids', label: 'Ombro Post. Esq.', top: 28, left: 33 },
    { id: 'back-deltoids', label: 'Ombro Post. Dir.', top: 28, left: 67 },
    { id: 'upper-back', label: 'Costas/Dorsais', top: 35, left: 50 },
    { id: 'triceps', label: 'Tríceps Esq.', top: 38, left: 25 },
    { id: 'triceps', label: 'Tríceps Dir.', top: 38, left: 75 },
    { id: 'lower-back', label: 'Lombar', top: 48, left: 50 },
    { id: 'gluteal', label: 'Glúteo Esq.', top: 55, left: 42 },
    { id: 'gluteal', label: 'Glúteo Dir.', top: 55, left: 58 },
    { id: 'hamstring', label: 'Posterior Coxa Esq.', top: 68, left: 40 },
    { id: 'hamstring', label: 'Posterior Coxa Dir.', top: 68, left: 60 },
    { id: 'calves', label: 'Panturrilha Esq.', top: 85, left: 42 },
    { id: 'calves', label: 'Panturrilha Dir.', top: 85, left: 58 },
  ]
};

export default function AnatomyImage({ gender, viewType, onMuscleSelect, activeMuscle }: AnatomyImageProps) {
  const imageUrl = gender === 'male' ? '/anatomy-male.jpg' : '/anatomy-female.jpg';
  // Use a type assertion to tell TypeScript that viewType is a valid key
  const currentHotspots = HOTSPOTS[viewType as keyof typeof HOTSPOTS] || [];

  return (
    <div className="relative w-full max-w-[280px] aspect-[1/2] mx-auto rounded-lg overflow-hidden bg-black flex items-center justify-center border border-border/30">
      <Image 
        src={imageUrl} 
        alt="Anatomia" 
        fill 
        className="object-contain" 
        style={{ filter: viewType === 'posterior' ? 'brightness(0.6) sepia(0.2)' : 'none' }} 
      />
      
      {/* Overlay hotspots */}
      {currentHotspots.map((spot, index) => {
        const isActive = activeMuscle === spot.id;
        return (
          <button
            key={`${spot.id}-${index}`}
            onClick={() => onMuscleSelect(spot.id)}
            className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 transition-all duration-300 z-10 
              ${isActive 
                ? 'bg-blue-500 border-white scale-125 shadow-[0_0_15px_rgba(59,130,246,0.8)]' 
                : 'bg-blue-500/40 border-blue-200/50 hover:bg-blue-500/80 hover:scale-110'
              }
            `}
            style={{ top: `${spot.top}%`, left: `${spot.left}%` }}
            title={spot.label}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></span>
            )}
          </button>
        );
      })}

      {/* Label for current view */}
      {viewType === 'posterior' && (
        <div className="absolute top-4 right-4 bg-black/70 text-white text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider font-bold">
          Costas
        </div>
      )}
    </div>
  );
}
