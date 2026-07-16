import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import HistoryTable from '../features/history/HistoryTable';
import Card from '../components/ui/Card';
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-dark-100">Upload History</h2>
        <p className="text-dark-400">Review your past media analyses.</p>
      </div>
      <Card className="p-0 overflow-hidden border-dark-700/50">
        <div className="p-1">
          <HistoryTable history={history} loading={loading} onDelete={(id) => setDeleteModal({ isOpen: true, fileId: id })} />
        </div>
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-dark-700/50 flex justify-between items-center bg-dark-900/30">
            <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="px-3 py-1 bg-dark-800 text-dark-300 rounded hover:text-white disabled:opacity-50">Previous</button>
            <span className="text-dark-400 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
            <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="px-3 py-1 bg-dark-800 text-dark-300 rounded hover:text-white disabled:opacity-50">Next</button>
          </div>
        )}
      </Card>
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, fileId: null })} onConfirm={handleDelete} title="Delete Record" message="Are you sure you want to delete this analysis record? This action cannot be undone." confirmText="Delete" confirmVariant="danger" />
    </div>
  );
}
