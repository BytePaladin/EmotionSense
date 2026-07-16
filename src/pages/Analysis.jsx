import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { Box, Button } from '@mui/material';
import AnalysisResult from '../features/analysis/AnalysisResult';

export default function Analysis() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await api.get(`/analysis/${id}`);
        setData(res.data.data);
      } catch (error) {
        toast.error('Failed to load analysis details');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id, navigate, toast]);

  if (loading) return <PageLoader />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Button 
        variant="text" 
        onClick={() => navigate(-1)} 
        sx={{ color: '#94a3b8', '&:hover': { color: '#6366f1', backgroundColor: 'transparent' }, alignSelf: 'flex-start', pl: 0 }}
        startIcon={<ArrowBackIcon />}
      >
        Back
      </Button>
      <AnalysisResult data={data} />
    </Box>
  );
}
