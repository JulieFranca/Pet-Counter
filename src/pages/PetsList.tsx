import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';
import { petApi } from '@/services/api';
import { Pet } from '@/types';

const PetsList: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const data = await petApi.getPets();
        setPets(data);
      } catch (error) {
        console.error('Erro ao carregar pets:', error);
      }
    };

    fetchPets();
  }, []);

  const getGridSize = () => {
    if (isMobile) return 4;
    return 3;
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4">Meus Pets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/pets/new')}
        >
          Adicionar Pet
        </Button>
      </Box>

      {pets.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Você ainda não tem pets cadastrados
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/pets/new')}
            size="large"
          >
            Cadastrar Primeiro Pet
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {pets.map((pet) => (
            <Grid item xs={getGridSize()} key={pet.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    transition: 'transform 0.2s',
                  },
                }}
                onClick={() => navigate(`/pets/${pet.id}`)}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Avatar
                    src={pet.photo}
                    sx={{ width: 100, height: 100, mb: 2 }}
                  />
                  <Typography variant="h6">{pet.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default PetsList; 