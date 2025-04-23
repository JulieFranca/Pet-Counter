import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { petApi } from '@/services/api';
import { Pet } from '@/types';

const PetForm: React.FC = () => {
  const [pet, setPet] = useState<Partial<Pet>>({
    name: '',
    age: 0,
    bio: '',
    photo: '',
    owner: localStorage.getItem('userId') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPet = async () => {
      if (id) {
        try {
          const data = await petApi.getPetById(parseInt(id));
          setPet(data);
        } catch (error) {
          console.error('Erro ao carregar pet:', error);
          setError('Erro ao carregar pet');
        }
      }
    };

    fetchPet();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!pet.owner) {
        throw new Error('Usuário não identificado');
      }

      if (id) {
        await petApi.updatePet(parseInt(id), pet);
      } else {
        await petApi.createPet(pet as Omit<Pet, 'id'>);
      }
      navigate('/pets');
    } catch (err) {
      console.error('Erro ao salvar pet:', err);
      setError('Erro ao salvar pet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          {id ? 'Editar Pet' : 'Cadastrar Pet'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nome"
            value={pet.name}
            onChange={(e) => setPet({ ...pet, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Idade"
            type="number"
            value={pet.age}
            onChange={(e) => setPet({ ...pet, age: parseInt(e.target.value) })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Foto (URL)"
            value={pet.photo}
            onChange={(e) => setPet({ ...pet, photo: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Biografia"
            multiline
            rows={4}
            value={pet.bio}
            onChange={(e) => setPet({ ...pet, bio: e.target.value })}
            margin="normal"
            required
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/pets')}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Salvar'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default PetForm; 