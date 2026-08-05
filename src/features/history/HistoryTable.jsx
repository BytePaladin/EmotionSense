import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Visibility,
  Delete,
  Image as ImageIcon,
  VideoFile,
  AccessTime,
  RecordVoiceOver as CoachIcon,
  Videocam as VideocamIcon,
  CompareArrows as ArrowRightIcon,
  CompareArrows as CompareIcon,
  CheckCircle as CheckCircleIcon,
  Feedback as FeedbackIcon,
  Close as CloseIcon,
  Comment as CommentIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { getEmotionLabel, getEmotionColor, getEmotionEmoji, EMOTION_COLORS } from '../../utils/emotionColors';
import EmptyState from '../../components/ui/EmptyState';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  LinearProgress,
  Skeleton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
  Card,
  Checkbox
} from '@mui/material';
import { formatDateGMT6, formatTimeGMT6, formatFullDateTimeGMT6 } from '../../utils/dateUtils';

export default function HistoryTable({ history, loading, onDelete }) {
  const navigate = useNavigate();
  const [selectedFeedbackItem, setSelectedFeedbackItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        // Keep latest 2 selected
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleLaunchCompare = () => {
    if (selectedIds.length === 2) {
      navigate(`/compare?base=${selectedIds[0]}&target=${selectedIds[1]}`);
    } else if (selectedIds.length === 1) {
      navigate(`/compare?base=${selectedIds[0]}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={80} animation="wave" sx={{ bgcolor: 'background.paper' }} />
        ))}
      </Box>
    );
  }

  if (!history || history.length === 0) {
    return (
      <EmptyState
        icon={AccessTime}
        title="No Upload History"
        message="You haven't analyzed any files yet."
        actionLabel="Upload Now"
        onAction={() => navigate('/upload')}
      />
    );
  }

  const getFileIcon = (fileType) => {
    if (fileType === 'coach_session') return <CoachIcon sx={{ color: '#6366f1' }} />;
    if (fileType === 'live_session') return <VideocamIcon sx={{ color: '#ec4899' }} />;
    if (fileType && fileType.startsWith('image/')) return <ImageIcon color="primary" />;
    return <VideoFile color="secondary" />;
  };

  return (
    <>
      {/* Floating Selection Action Bar */}
      {selectedIds.length > 0 && (
        <Box
          sx={{
            p: 1.5,
            px: 2.5,
            mb: 2,
            borderRadius: 3,
            bgcolor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid',
            borderColor: '#6366f150',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareIcon sx={{ color: '#6366f1' }} />
            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
              {selectedIds.length === 1
                ? '1 Session Selected — Select 1 more to compare side-by-side'
                : '2 Sessions Selected for Side-by-Side Comparison'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              onClick={handleLaunchCompare}
              startIcon={<CompareIcon />}
              sx={{
                bgcolor: '#6366f1',
                '&:hover': { bgcolor: '#4f46e5' },
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Compare {selectedIds.length === 2 ? 'Sessions (2)' : 'Session'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedIds([])}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Clear
            </Button>
          </Stack>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
        <Table sx={{ minWidth: 750 }}>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.8125rem'
                }
              }}
            >
              <TableCell padding="checkbox">
                <Typography variant="caption" fontWeight="bold" color="text.disabled" sx={{ pl: 1 }}>
                  Compare
                </Typography>
              </TableCell>
              <TableCell>Session / Media</TableCell>
              <TableCell>Date & Time (GMT+6)</TableCell>
              <TableCell>Dominant AI Emotion</TableCell>
              <TableCell>User Corrections</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((item) => {
              const hasFeedback = item.feedback && item.feedback.length > 0;
              const primaryFeedback = hasFeedback ? item.feedback[0] : null;
              const isSelected = selectedIds.includes(item.id);

              return (
                <TableRow
                  key={item.id}
                  selected={isSelected}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s',
                    '&:hover .actions-group': { opacity: 1 }
                  }}
                >
                  {/* Select Checkbox */}
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      size="small"
                      sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#6366f1' } }}
                    />
                  </TableCell>
                  {/* File / Session Title */}
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2.5,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {getFileIcon(item.file_type)}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          sx={{ maxWidth: { xs: 150, md: 240 } }}
                          title={item.file_name}
                        >
                          {item.file_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.file_type === 'coach_session'
                            ? '🎙️ Interview Coach Rehearsal'
                            : item.file_type === 'live_session'
                            ? '📹 Live Camera Feed'
                            : `${(item.file_size / (1024 * 1024)).toFixed(2)} MB`}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Upload Time (GMT+6) */}
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      {formatDateGMT6(item.upload_time)}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatTimeGMT6(item.upload_time)}
                    </Typography>
                  </TableCell>

                  {/* Dominant AI Emotion */}
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip
                      icon={<span>{getEmotionEmoji(item.dominant_emotion)}</span>}
                      label={getEmotionLabel(item.dominant_emotion)}
                      size="small"
                      sx={{
                        bgcolor: `${getEmotionColor(item.dominant_emotion)}20`,
                        color: getEmotionColor(item.dominant_emotion),
                        border: '1px solid',
                        borderColor: `${getEmotionColor(item.dominant_emotion)}50`,
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>

                  {/* User Corrections / Misclassifications Submitted */}
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {hasFeedback ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Tooltip title="Click to view all ground-truth corrections submitted for this session">
                          <Chip
                            clickable
                            onClick={() => setSelectedFeedbackItem(item)}
                            icon={<FeedbackIcon sx={{ fontSize: '14px !important', color: '#6366f1 !important' }} />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span>{getEmotionEmoji(primaryFeedback.predicted_emotion)}</span>
                                <ArrowRightIcon sx={{ fontSize: 13, mx: -0.2, color: 'text.secondary' }} />
                                <span>{getEmotionEmoji(primaryFeedback.corrected_emotion)}</span>
                                <Typography
                                  component="span"
                                  variant="caption"
                                  fontWeight={700}
                                  sx={{ color: getEmotionColor(primaryFeedback.corrected_emotion) }}
                                >
                                  {getEmotionLabel(primaryFeedback.corrected_emotion)}
                                </Typography>
                                {item.feedback.length > 1 && (
                                  <Chip
                                    label={`+${item.feedback.length - 1}`}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      bgcolor: '#6366f1',
                                      color: '#fff',
                                      ml: 0.5
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: '#6366f180',
                              bgcolor: 'rgba(99, 102, 241, 0.08)',
                              fontWeight: 600,
                              py: 1.8,
                              '&:hover': {
                                bgcolor: 'rgba(99, 102, 241, 0.16)',
                                borderColor: '#6366f1'
                              }
                            }}
                          />
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        — Original AI
                      </Typography>
                    )}
                  </TableCell>

                  {/* Confidence */}
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={item.average_confidence || 0}
                        sx={{
                          width: 60,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'background.paper',
                          '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" fontWeight="semibold">
                        {item.average_confidence || 0}%
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box
                      className="actions-group"
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1
                      }}
                    >
                      <Tooltip title="Compare Session">
                        <IconButton size="small" onClick={() => navigate(`/compare?base=${item.id}`)} sx={{ color: '#8b5cf6' }}>
                          <CompareIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL: Detailed View of Ground-Truth Corrections Submitted for the Session */}
      <Dialog
        open={Boolean(selectedFeedbackItem)}
        onClose={() => setSelectedFeedbackItem(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircleIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Misclassification Corrections
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted ground-truth feedback for model training
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setSelectedFeedbackItem(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedFeedbackItem && (
            <>
              {/* Session Meta Header */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {selectedFeedbackItem.file_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Analyzed on {formatFullDateTimeGMT6(selectedFeedbackItem.upload_time)}
                  </Typography>
                </Box>
                <Chip
                  label={`${selectedFeedbackItem.feedback.length} correction${
                    selectedFeedbackItem.feedback.length > 1 ? 's' : ''
                  }`}
                  size="small"
                  sx={{ bgcolor: '#6366f1', color: '#fff', fontWeight: 'bold' }}
                />
              </Box>

              {/* List of Corrections */}
              <Stack spacing={1.5}>
                {selectedFeedbackItem.feedback.map((fb, idx) => {
                  const predColor = getEmotionColor(fb.predicted_emotion);
                  const corrColor = getEmotionColor(fb.corrected_emotion);

                  return (
                    <Card
                      key={fb.id || idx}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        borderColor: 'divider',
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={`#${idx + 1}`}
                            size="small"
                            sx={{ fontWeight: 'bold', height: 20, fontSize: '0.7rem' }}
                          />
                          {fb.frame_timestamp !== null && fb.frame_timestamp !== undefined && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}
                            >
                              <TimerIcon sx={{ fontSize: 13 }} />
                              {Number(fb.frame_timestamp).toFixed(1)}s in session
                            </Typography>
                          )}
                        </Stack>

                        <Typography variant="caption" color="text.disabled">
                          {formatFullDateTimeGMT6(fb.created_at)}
                        </Typography>
                      </Box>

                      {/* Emotion Comparison */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            AI Detected:
                          </Typography>
                          <Chip
                            icon={<span>{getEmotionEmoji(fb.predicted_emotion)}</span>}
                            label={getEmotionLabel(fb.predicted_emotion)}
                            size="small"
                            sx={{
                              bgcolor: `${predColor}15`,
                              color: predColor,
                              border: `1px solid ${predColor}40`,
                              fontWeight: 700
                            }}
                          />
                        </Box>

                        <ArrowRightIcon sx={{ fontSize: 24, color: '#6366f1' }} />

                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            User Corrected:
                          </Typography>
                          <Chip
                            icon={<span>{getEmotionEmoji(fb.corrected_emotion)}</span>}
                            label={getEmotionLabel(fb.corrected_emotion)}
                            size="small"
                            sx={{
                              bgcolor: `${corrColor}25`,
                              color: corrColor,
                              border: `1.5px solid ${corrColor}`,
                              fontWeight: 700
                            }}
                          />
                        </Box>
                      </Box>

                      {/* User Notes / Comments */}
                      {fb.comments && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: 'action.hover'
                          }}
                        >
                          <CommentIcon sx={{ fontSize: 15, color: 'text.secondary', mt: 0.2 }} />
                          <Typography variant="caption" color="text.secondary">
                            <span style={{ fontWeight: 600 }}>Note:</span> {fb.comments}
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  );
                })}
              </Stack>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              const id = selectedFeedbackItem.id;
              setSelectedFeedbackItem(null);
              navigate(`/analysis/${id}`);
            }}
            sx={{
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#4f46e5' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Open Full Analysis
          </Button>
          <Button variant="outlined" onClick={() => setSelectedFeedbackItem(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
