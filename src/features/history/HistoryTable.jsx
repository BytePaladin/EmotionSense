import { useNavigate } from 'react-router-dom';
import { Visibility, Delete, Image as ImageIcon, VideoFile, AccessTime } from '@mui/icons-material';
import { getEmotionLabel, getEmotionColor } from '../../utils/emotionColors';
import EmptyState from '../../components/ui/EmptyState';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, LinearProgress, Skeleton, Chip, Tooltip } from '@mui/material';

export default function HistoryTable({ history, loading, onDelete }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} variant="rounded" height={80} animation="wave" sx={{ bgcolor: 'background.paper' }} />
        ))}
      </Box>
    );
  }

  if (!history || history.length === 0) {
    return <EmptyState icon={AccessTime} title="No Upload History" message="You haven't analyzed any files yet." actionLabel="Upload Now" onAction={() => navigate('/upload')} />;
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ '& th': { borderBottom: '1px solid', borderColor: 'divider', color: 'text.secondary', fontWeight: 'semibold' } }}>
            <TableCell>File</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Dominant Emotion</TableCell>
            <TableCell>Avg. Confidence</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.2s', '&:hover .actions-group': { opacity: 1 } }}>
              <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.file_type.startsWith('image/') ? <ImageIcon color="primary" /> : <VideoFile color="secondary" />}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 200 }} title={item.file_name}>{item.file_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{(item.file_size / (1024 * 1024)).toFixed(2)} MB</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">{new Date(item.upload_time).toLocaleDateString()}</Typography>
                <Typography variant="caption" color="text.disabled">{new Date(item.upload_time).toLocaleTimeString()}</Typography>
              </TableCell>
              <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Chip 
                  label={getEmotionLabel(item.dominant_emotion)} 
                  size="small" 
                  sx={{ 
                    bgcolor: `${getEmotionColor(item.dominant_emotion)}20`, 
                    color: getEmotionColor(item.dominant_emotion), 
                    border: '1px solid', 
                    borderColor: `${getEmotionColor(item.dominant_emotion)}50`, 
                    fontWeight: 'medium' 
                  }} 
                />
              </TableCell>
              <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress variant="determinate" value={item.average_confidence} sx={{ width: 80, height: 8, borderRadius: 4, bgcolor: 'background.paper', '& .MuiLinearProgress-bar': { bgcolor: 'info.main' } }} />
                  <Typography variant="caption" color="text.secondary">{item.average_confidence}%</Typography>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box className="actions-group" sx={{ opacity: 0, transition: 'opacity 0.2s', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="View Analysis">
                    <IconButton size="small" onClick={() => navigate(`/analysis/${item.id}`)} color="primary">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => onDelete(item.id)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
