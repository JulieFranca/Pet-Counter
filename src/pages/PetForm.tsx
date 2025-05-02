import React, { useState, useRef } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { addPet, updatePet } from "@/lib/pets";
import imageCompression from "browser-image-compression";
import { PetFormProps } from '@/types';
import { X, Image as ImageIcon } from "lucide-react";
import { DEFAULT_PET_IMAGE, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, PET_IMAGES_DIR } from '@/constants';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 500;
const MAX_AGE = 30;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB após compressão
const MAX_IMAGE_WIDTH = 800; // Largura máxima da imagem
const MAX_IMAGE_HEIGHT = 800; // Altura máxima da imagem

const PetForm: React.FC<PetFormProps> = ({ onClose, onSuccess, ownerId }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>(DEFAULT_PET_IMAGE);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const storage = getStorage();
    const storageRef = ref(storage, `pet-images/${user.uid}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

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
      maxSizeMB: 1,
      maxWidthOrHeight: Math.max(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT),
      useWebWorker: true,
      fileType: file.type as string,
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
        resolve(canvas.toDataURL(img.src.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', 0.8));
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
        setPhoto(compressedFile);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        setError('Erro ao processar imagem. O pet será salvo sem imagem.');
        setPhoto(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem');
      console.error('Erro ao processar imagem:', err);
      setPhoto(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'age') {
      // Permite apenas números ou campo vazio
      if (value === '' || /^\d+$/.test(value)) {
        setAge(value === '' ? '' : value);
      }
    } else {
      if (id === 'name') {
        setName(value);
      } else if (id === 'bio') {
        setBio(value);
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validação do nome
    if (!name.trim()) {
      errors.name = 'O nome do pet é obrigatório';
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.name = 'O nome deve ter no máximo 50 caracteres';
    } else if (!/^[a-zA-ZÀ-ÿ\s]*$/.test(name)) {
      errors.name = 'O nome deve conter apenas letras e espaços';
    }

    // Validação da idade
    if (age !== '' && (age !== '' && (parseInt(age) < 0 || parseInt(age) > MAX_AGE))) {
      errors.age = `Idade deve estar entre 0 e ${MAX_AGE} anos`;
    }

    // Validação da bio
    if (bio && bio.length > MAX_BIO_LENGTH) {
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
      if (!user) throw new Error('Usuário não autenticado');
      
      let photoUrl = '';
      if (photo) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(photo, options);
        photoUrl = await uploadImage(compressedFile);
      }

      const petData = {
        name,
        age: parseInt(age),
        bio,
        photo: photoUrl,
        ownerId: ownerId || user.uid
      };

      await addPet(petData);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao adicionar pet. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Cadastrar Pet</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            maxLength={MAX_NAME_LENGTH}
            placeholder="Nome do pet"
          />
          <span className="text-xs text-gray-500">{name.length}/{MAX_NAME_LENGTH}</span>
          {error.includes('name') && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Idade (anos)</label>
          <input
            type="number"
            id="age"
            name="age"
            value={age}
            onChange={handleInputChange}
            min="0"
            max={MAX_AGE}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Idade do pet"
          />
          {error.includes('age') && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biografia</label>
          <textarea
            id="bio"
            name="bio"
            value={bio}
            onChange={handleInputChange}
            rows={3}
            maxLength={MAX_BIO_LENGTH}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Conte um pouco sobre seu pet..."
          />
          <span className="text-xs text-gray-500">{bio.length}/{MAX_BIO_LENGTH}</span>
          {error.includes('bio') && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
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
            {loading ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
        </form>
    </div>
  );
};

export default PetForm; 