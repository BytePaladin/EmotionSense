import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import CompareView from '../features/compare/CompareView';
import { PageLoader } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { Box, Typography, Button } from '@mui/material';
import { CompareArrows } from '@mui/icons-material';

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const baseId = searchParams.get('base');
  const targetId = searchParams.get('target');

  const [loading, setLoading] = useState(true);
  const [allHistory, setAllHistory] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const initCompare = async () => {
      setLoading(true);
      try {
        // Fetch all history for session dropdowns
        const histRes = await api.get('/history?page=1&limit=100');
        const historyList = histRes.data.data.history || [];
        setAllHistory(historyList);

        if (historyList.length < 2) {
          setLoading(false);
          return;
        }

        // Determine session A & B IDs
        let idA = baseId;
        let idB = targetId;

        if (!idA || !historyList.some((s) => s.id === idA)) {
          idA = historyList[1]?.id || historyList[0]?.id;
        }
        if (!idB || !historyList.some((s) => s.id === idB) || idB === idA) {
          idB = historyList.find((s) => s.id !== idA)?.id || historyList[0]?.id;
        }

        // Update URL search params if needed
        if (idA !== baseId || idB !== targetId) {
          setSearchParams({ base: idA, target: idB }, { replace: true });
        }

        // Fetch comparison analysis
        const compRes = await api.get(`/analysis/compare?id1=${idA}&id2=${idB}`);
        setCompareData(compRes.data.data);
      } catch (err) {
        console.error('Error loading comparison data:', err);
        const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to load comparison data';
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    initCompare();
  }, [baseId, targetId]);

  const handleSelectA = (newIdA) => {
    if (newIdA === targetId) {
      // Swap if user selected same session
      setSearchParams({ base: newIdA, target: baseId });
    } else {
      setSearchParams({ base: newIdA, target: targetId });
    }
  };

  const handleSelectB = (newIdB) => {
    if (newIdB === baseId) {
      // Swap if user selected same session
      setSearchParams({ base: targetId, target: newIdB });
    } else {
      setSearchParams({ base: baseId, target: newIdB });
    }
  };

  const handleSwap = () => {
    setSearchParams({ base: targetId, target: baseId });
  };

  if (loading) return <PageLoader />;

  if (allHistory.length < 2) {
    return (
      <EmptyState
        icon={CompareArrows}
        title="Insufficient Sessions for Comparison"
        message="You need at least 2 recorded sessions to run a side-by-side comparative analysis."
        actionLabel="Start a Session"
        onAction={() => window.location.href = '/live'}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeIn 0.5s ease-in-out' }}>
      <Box>
        <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
          Side-by-Side Session Comparison
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Compare emotional intelligence metrics, stability deltas, and progress across two sessions.
        </Typography>
      </Box>

      {compareData && (
        <CompareView
          sessionA={compareData.session_a}
          sessionB={compareData.session_b}
          allSessions={allHistory}
          onSelectA={handleSelectA}
          onSelectB={handleSelectB}
          onSwap={handleSwap}
        />
      )}
    </Box>
  );
}
