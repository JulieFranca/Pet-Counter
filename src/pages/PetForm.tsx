import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_PET_IMAGE, ALLOWED_IMAGE_TYPES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { addPet, updatePet, PetData } from '@/lib/pets';
import imageCompression from 'browser-image-compression';
import { getUserById } from '@/lib/users';
import { calculateAgeInMonths, parseDate } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { Image as ImageIcon } from "lucide-react";
  

interface PetFormProps {
  onClose: () => void;
  onSuccess: () => void;
  pet?: PetData & { id?: string };
}

interface PetFormState {
  name: string;
  age: number | '';
  bio: string;
  photo: string | null;
  birthDate: string;
  adoptionDate: string;
}

const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 500;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB após compressão
const MAX_IMAGE_WIDTH = 800; // Largura máxima da imagem
const MAX_IMAGE_HEIGHT = 800; // Altura máxima da imagem

// Função utilitária para formatar data para input type="date"
function toInputDate(date: any): string {
  if (!date) return '';
  // Firestore Timestamp
  if (date.seconds && date.toDate) {
    date = date.toDate();
  }
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (d instanceof Date && !isNaN(d.getTime())) {
    return format(d, 'yyyy-MM-dd');
  }
  return '';
}

const PetForm: React.FC<PetFormProps> = ({ onClose, onSuccess, pet }) => {
  const { user } = useAuth();
  const [petState, setPetState] = useState<PetFormState>(() => ({
    name: pet?.name || '',
    age: pet?.age || '',
    bio: pet?.bio || '',
    photo: pet?.photo || DEFAULT_PET_IMAGE,
    birthDate: pet?.birthDate ? toInputDate(pet.birthDate) : '',
    adoptionDate: pet?.adoptionDate ? toInputDate(pet.adoptionDate) : '',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>(() => pet?.photo || DEFAULT_PET_IMAGE);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resetar o estado sempre que o formulário for aberto
  useEffect(() => {
    if (pet) {
      setPetState({
        name: pet.name || '',
        age: pet.age || '',
        bio: pet.bio || '',
        photo: pet.photo || DEFAULT_PET_IMAGE,
        birthDate: pet.birthDate ? toInputDate(pet.birthDate) : '',
        adoptionDate: pet.adoptionDate ? toInputDate(pet.adoptionDate) : '',
      });
      setPreviewUrl(pet.photo || DEFAULT_PET_IMAGE);
    } else {
      setPetState({
        name: '',
        age: '',
        bio: '',
        photo: DEFAULT_PET_IMAGE,
        birthDate: '',
        adoptionDate: '',
      });
      setPreviewUrl(DEFAULT_PET_IMAGE);
    }
    setLoading(false); // Resetar loading sempre que abrir o form
    setError(''); // Limpar erro ao abrir o form
  }, [pet]);

  useEffect(() => {
    const fetchOwnerName = async () => {
      if (user) {
        try {
          const userDoc = await getUserById(user.uid);
          if (userDoc) {
            setOwnerName(`${userDoc.firstName} ${userDoc.lastName}`);
          }
        } catch (error) {
          console.error('Erro ao buscar nome do dono:', error);
        }
      }
    };
    fetchOwnerName();
  }, [user]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleImageProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageProcess(file);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.8, // Reduzindo para 800KB
      maxWidthOrHeight: Math.max(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT),
      useWebWorker: true,
      fileType: file.type as string,
      initialQuality: 0.7, // Reduzindo a qualidade inicial
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Erro na compressão:', error);
      throw new Error('Erro ao comprimir imagem');
    }
  };

  const resizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular novas dimensões mantendo proporção
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_WIDTH) / width);
            width = MAX_IMAGE_WIDTH;
          } else {
            width = Math.round((width * MAX_IMAGE_HEIGHT) / height);
            height = MAX_IMAGE_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto 2D'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Reduzindo a qualidade do JPEG para 0.6
        resolve(canvas.toDataURL(img.src.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', 0.6));
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    });
  };

  const handleImageProcess = async (file: File) => {
    try {
      if (file.size > MAX_FILE_SIZE * 5) { // Checagem inicial mais permissiva
        throw new Error('Arquivo muito grande. Tamanho máximo permitido: 5MB');
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use apenas imagens JPG, PNG ou GIF');
      }

      setLoading(true);
      setUploadProgress(0);
      setError('');

      // Comprimir imagem
      setUploadProgress(20);
      const compressedFile = await compressImage(file);
      
      if (compressedFile.size > MAX_FILE_SIZE) {
        throw new Error('Imagem ainda muito grande após compressão. Por favor, use uma imagem menor.');
      }

      // Converter para base64
      const reader = new FileReader();
      reader.onloadstart = () => setUploadProgress(40);
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(40 + (e.loaded / e.total) * 30);
        }
      };

      try {
        const base64String = await new Promise<string>((resolve, reject) => {
          reader.onload = async () => {
            try {
              setUploadProgress(70);
              const base64 = reader.result as string;
              // Redimensionar se necessário
              const resizedBase64 = await resizeImage(base64);
              setUploadProgress(90);
              resolve(resizedBase64);
            } catch (e) {
              reject(e);
            }
          };
          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
          reader.readAsDataURL(compressedFile);
        });

        setUploadProgress(100);
        setPreviewUrl(base64String);
        setPetState(prev => ({ ...prev, photo: base64String }));
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        setError('Erro ao processar imagem. O pet será salvo sem imagem.');
        setPetState(prev => ({ ...prev, photo: null }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem');
      console.error('Erro ao processar imagem:', err);
      setPetState(prev => ({ ...prev, photo: null }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'age') {
      // Permite apenas números ou campo vazio
      if (value === '' || /^\d+$/.test(value)) {
        setPetState(prev => ({
          ...prev,
          [id]: value === '' ? '' : Number(value)
        }));
      }
    } else {
      setPetState(prev => ({ ...prev, [id]: value }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validação do nome
    if (!petState.name.trim()) {
      errors.name = 'O nome do pet é obrigatório';
    } else if (petState.name.length > MAX_NAME_LENGTH) {
      errors.name = 'O nome deve ter no máximo 50 caracteres';
    } else if (!/^[a-zA-ZÀ-ÿ\s]*$/.test(petState.name)) {
      errors.name = 'O nome deve conter apenas letras e espaços';
    }

    // Validação das datas
    const birthDate = parseDate(petState.birthDate);
    const adoptionDate = parseDate(petState.adoptionDate);

    if (birthDate && adoptionDate && birthDate > adoptionDate) {
      errors.dates = 'A data de nascimento não pode ser posterior à data de adoção';
    }

    // Validação da bio
    if (petState.bio && petState.bio.length > MAX_BIO_LENGTH) {
      errors.bio = 'A biografia deve ter no máximo 500 caracteres';
    }

    // Atualiza o estado de erros
    setError(Object.values(errors).join('\n') || '');
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Converter datas de string para Date
      const birthDate = petState.birthDate ? new Date(petState.birthDate) : undefined;
      const adoptionDate = petState.adoptionDate ? new Date(petState.adoptionDate) : undefined;
      const ageInMonths = birthDate 
        ? calculateAgeInMonths(birthDate, adoptionDate)
        : undefined;

      const petData = {
        name: petState.name.trim(),
        bio: petState.bio.trim(),
        photo: petState.photo || DEFAULT_PET_IMAGE,
        ownerId: user.uid,
        ...(birthDate && { birthDate }),
        ...(adoptionDate && { adoptionDate }),
        ...(ageInMonths && { ageInMonths }),
      };

      if (pet?.id) {
        await updatePet(pet.id, user.uid, petData);
      } else {
        await addPet(petData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar pet:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar pet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{pet ? 'Editar Pet' : 'Cadastrar Pet'}</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      {/* Exibir erro geral no topo do formulário */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            id="name"
            name="name"
            value={petState.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            maxLength={MAX_NAME_LENGTH}
            placeholder="Nome do pet"
          />
          <span className="text-xs text-gray-500">{petState.name.length}/{MAX_NAME_LENGTH}</span>
          {error.includes('name') && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={petState.birthDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="AAAA-MM-DD"
            />
          </div>

          <div>
            <label htmlFor="adoptionDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Adoção
            </label>
            <input
              type="date"
              id="adoptionDate"
              name="adoptionDate"
              value={petState.adoptionDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="AAAA-MM-DD"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biografia</label>
          <textarea
            id="bio"
            name="bio"
            value={petState.bio}
            onChange={handleInputChange}
            rows={3}
            maxLength={MAX_BIO_LENGTH}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Conte um pouco sobre seu pet..."
          />
          <span className="text-xs text-gray-500">{petState.bio.length}/{MAX_BIO_LENGTH}</span>
          {error.includes('bio') && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dono</label>
          <p className="text-gray-600">{ownerName}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Pet (opcional)</label>
          <div
            className={`mt-1 p-4 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${loading ? 'pointer-events-none opacity-50' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={loading}
            />
            
            {previewUrl !== DEFAULT_PET_IMAGE ? (
              <div className="relative w-32 h-32 mx-auto">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-full"
                />
                {!loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                    <p className="text-white text-sm">Clique para trocar</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Arraste uma imagem ou clique para selecionar</p>
                <p className="text-sm text-gray-500">(Opcional - Uma imagem padrão será usada se nenhuma for selecionada)</p>
              </div>
            )}

            {loading && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {uploadProgress < 100 ? 'Processando imagem...' : 'Imagem processada!'}
                </p>
              </div>
            )}
          </div>
          {error && error.includes('imagem') && (
            <p className="text-sm text-yellow-600 mt-2">
              {error}
            </p>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Salvando...' : pet ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PetForm; 