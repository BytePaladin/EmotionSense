import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import DashboardOverview from '../features/dashboard/DashboardOverview';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/statistics');
        setStats(res.data.data);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  if (loading) return <PageLoader />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ color: '#f8fafc' }}>
            Analytics Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Insights from all your uploaded media.
          </Typography>
        </Box>
        <Button variant="contained" sx={{ backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' } }} onClick={() => navigate('/upload')} startIcon={<AddIcon />}>
          New Analysis
        </Button>
      </Box>
      <DashboardOverview stats={stats} />
    </Box>
  );
}
