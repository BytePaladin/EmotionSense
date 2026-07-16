import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import { PageLoader } from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
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
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="!pl-0 hover:!bg-transparent text-dark-400 hover:text-primary-400"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <AnalysisResult data={data} />
    </div>
  );
}
