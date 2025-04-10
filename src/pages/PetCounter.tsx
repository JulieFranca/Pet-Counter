import React, { useState, useEffect } from 'react';

const PetCounter: React.FC = () => {
  const [petCount, setPetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPetCount = async () => {
    try {
      const response = await fetch('/api/pets');
      if (!response.ok) {
        throw new Error('Falha ao buscar informações');
      }
      const pets = await response.json();
      setPetCount(pets.length);
      setError(null);
    } catch (err) {
      console.error('Erro:', err);
      setError('Não foi possível carregar o contador de pets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetCount();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchPetCount, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-4xl font-bold text-indigo-700 mb-2">Contador de Pets</h1>
        <p className="text-gray-600 mb-10">Acompanhe em tempo real o número de pets cadastrados em nossa plataforma!</p>
        
        {loading ? (
          <div className="animate-pulse">
            <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="relative">
            <div className="text-8xl font-bold text-indigo-600 mb-2 relative">
              <span className="relative z-10">{petCount}</span>
              <div className="absolute inset-0 bg-indigo-100 rounded-full transform scale-150 -z-10"></div>
            </div>
            <p className="text-xl text-indigo-700">Pets cadastrados</p>
            
            <div className="mt-8 flex justify-center space-x-4">
              {Array.from({ length: Math.min(5, petCount) }).map((_, i) => (
                <div key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                  🐾
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-12">
          <p className="text-sm text-gray-500">
            Dados atualizados automaticamente a cada 10 segundos
          </p>
        </div>
      </div>
    </div>
  );
};

export default PetCounter; 