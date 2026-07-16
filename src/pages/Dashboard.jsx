import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import DashboardOverview from '../features/dashboard/DashboardOverview';
import { PageLoader } from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { Plus } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-100">Analytics Overview</h2>
          <p className="text-dark-400">Insights from all your uploaded media.</p>
        </div>
        <Button onClick={() => navigate('/upload')}><Plus className="w-4 h-4 mr-2" />New Analysis</Button>
      </div>
      <DashboardOverview stats={stats} />
    </div>
  );
}
