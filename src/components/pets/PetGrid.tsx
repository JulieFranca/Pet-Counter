import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pet } from '@/types';

const DEFAULT_PET_IMAGE = '/pictures/default-pet.svg';

interface PetGridProps {
  pets: Pet[];
  isAdmin?: boolean;
}

export default function PetGrid({ pets, isAdmin = false }: PetGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <motion.div
          key={pet.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                  <img
                    src={pet.photo || DEFAULT_PET_IMAGE}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{pet.name}</h3>
                {pet.age && (
                  <Badge variant="secondary" className="mb-2">
                    {pet.age} anos
                  </Badge>
                )}
                {pet.bio && (
                  <p className="text-gray-600 text-center">{pet.bio}</p>
                )}
                {isAdmin && (
                  <Badge className="mt-2">
                    Dono: {pet.owner}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
} 