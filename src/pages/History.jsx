import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import HistoryTable from '../features/history/HistoryTable';
import { Box, Typography, Card, Button } from '@mui/material';
import Modal from '../components/ui/Modal';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, fileId: null });
  const toast = useToast();

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/history?page=${page}&limit=${pagination.limit}`);
      setHistory(res.data.data.history);
      setPagination(res.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(pagination.page); }, [pagination.page]);

  const handleDelete = async () => {
    try {
      await api.delete(`/uploads/${deleteModal.fileId}`);
      toast.success('Record deleted');
      fetchHistory(pagination.page);
    } catch {
      toast.error('Failed to delete record');
    } finally {
      setDeleteModal({ isOpen: false, fileId: null });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeIn 0.5s ease-in-out' }}>
      <Box>
        <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">Upload History</Typography>
        <Typography variant="body2" color="text.secondary">Review your past media analyses.</Typography>
      </Box>
      <Card sx={{ p: 0, overflow: 'hidden', borderColor: 'divider', borderWidth: 1, borderStyle: 'solid', bgcolor: 'background.paper' }}>
        <Box sx={{ p: 1 }}>
          <HistoryTable history={history} loading={loading} onDelete={(id) => setDeleteModal({ isOpen: true, fileId: id })} />
        </Box>
        {pagination.totalPages > 1 && (
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover' }}>
            <Button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>Previous</Button>
            <Typography variant="body2" color="text.secondary">Page {pagination.page} of {pagination.totalPages}</Typography>
            <Button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>Next</Button>
          </Box>
        )}
      </Card>
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, fileId: null })} onConfirm={handleDelete} title="Delete Record" message="Are you sure you want to delete this analysis record? This action cannot be undone." confirmText="Delete" confirmVariant="danger" />
    </Box>
  );
}
