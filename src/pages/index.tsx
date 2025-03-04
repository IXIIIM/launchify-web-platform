import React from 'react';
import { useRouter } from 'next/router';
import { BrowserRouter } from 'react-router-dom';
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  Stack, 
  Card, 
  CardContent,
  Grid,
  Paper
} from '@mui/material';

// Wrapper component that doesn't use react-router hooks
const HomePageContent: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 4,
        bgcolor: 'grey.50'
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={4} sx={{ textAlign: 'center' }}>
          <Typography variant="h2" component="h1" color="primary">
            Welcome to Launchify
          </Typography>
          
          <Typography variant="h5" color="text.secondary">
            The comprehensive web platform connecting entrepreneurs with funding opportunities
          </Typography>
          
          <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
            <Stack spacing={3}>
              <Typography variant="body1">
                Launchify helps entrepreneurs showcase their ideas and connect with potential funders,
                while providing powerful analytics and management tools.
              </Typography>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                justifyContent="center"
                sx={{ pt: 2 }}
              >
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={() => onNavigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="contained" 
                  color="success" 
                  size="large"
                  onClick={() => onNavigate('/admin')}
                >
                  Admin Portal
                </Button>
              </Stack>
            </Stack>
          </Paper>
          
          <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">Analytics</Typography>
                  <Button 
                    variant="text" 
                    onClick={() => onNavigate('/analytics')}
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">Matches</Typography>
                  <Button 
                    variant="text" 
                    onClick={() => onNavigate('/matches')}
                  >
                    View Matches
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">Profile</Typography>
                  <Button 
                    variant="text" 
                    onClick={() => onNavigate('/profile')}
                  >
                    My Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 6 }}>
        © {new Date().getFullYear()} Launchify Web Platform. All rights reserved.
      </Typography>
    </Box>
  );
};

// Next.js page component
const HomePage: React.FC = () => {
  const router = useRouter();
  
  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return <HomePageContent onNavigate={handleNavigate} />;
};

export default HomePage; 