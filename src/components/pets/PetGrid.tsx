import React from 'react';
import { Pet } from '@/types';
import { DEFAULT_PET_IMAGE } from '@/constants';
import { Trash2 } from "lucide-react";

interface PetGridProps {
  pets: Pet[];
  onPetClick?: (pet: Pet) => void;
  onDeleteClick?: (petId: number) => void;
  showActions?: boolean;
}

const PetGrid: React.FC<PetGridProps> = ({
  pets,
  onPetClick,
  onDeleteClick,
  showActions = true
}) => {
  const [imageErrors, setImageErrors] = React.useState<{[key: number]: boolean}>({});

  const handleImageError = (petId: number) => {
    setImageErrors(prev => ({
      ...prev,
      [petId]: true
    }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <div
          key={pet.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onPetClick?.(pet)}
        >
          <div className="flex justify-center p-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              <img
                src={imageErrors[pet.id] ? DEFAULT_PET_IMAGE : (pet.photo || DEFAULT_PET_IMAGE)}
                alt={pet.name}
                className="w-full h-full object-cover"
                onError={() => handleImageError(pet.id)}
              />
            </div>
          </div>
          <div className="p-4 text-center">
            <h3 className="font-medium text-lg mb-1">{pet.name}</h3>
            {pet.age && <p className="text-gray-600">{pet.age} anos</p>}
            {showActions && onDeleteClick && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(pet.id);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PetGrid; 