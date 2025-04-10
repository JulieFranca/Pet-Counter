import React, { useEffect, useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Paper,
  Button,
  Grid,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { petApi } from '@/services/api';
import { Pet } from '@/types';

const PetDetails: React.FC = () => {
  const [pet, setPet] = useState<Pet | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPet = async () => {
      try {
        if (id) {
          const data = await petApi.getPetById(parseInt(id));
          setPet(data);
        }
      } catch (error) {
        console.error('Erro ao carregar pet:', error);
      }
    };

    fetchPet();
  }, [id]);

  if (!pet) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/pets')}
        sx={{ mb: 3 }}
      >
        Voltar
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Avatar
                src={pet.photo}
                sx={{ width: 200, height: 200, mb: 2 }}
              />
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/pets/${pet.id}/edit`)}
              >
                Editar
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {pet.name}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {pet.age} anos
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {pet.bio}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PetDetails; 