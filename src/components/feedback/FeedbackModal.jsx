import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Chip,
  CircularProgress,
  Stack,
  Alert
} from '@mui/material';
import {
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Feedback as FeedbackIcon
} from '@mui/icons-material';
import { EMOTION_COLORS, getEmotionLabel, getEmotionEmoji } from '../../utils/emotionColors';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function FeedbackModal({ open, onClose, fileId, initialPredicted = 'neutral', frameTimestamp = null }) {
  const [correctedEmotion, setCorrectedEmotion] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emotions = Object.keys(EMOTION_COLORS);

  const handleSubmit = async () => {
    if (!correctedEmotion) {
      toast.error('Please select the actual emotion');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        file_id: fileId,
        frame_timestamp: frameTimestamp,
        predicted_emotion: initialPredicted,
        corrected_emotion: correctedEmotion,
        comments: comments.trim()
      });
      setSubmitted(true);
      toast.success('Thank you! Feedback recorded for model evaluation.');
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCorrectedEmotion('');
    setComments('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'error.main',
            color: 'error.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.9
          }}
        >
          <FlagIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Flag AI Misclassification
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Help improve EmotionSense model accuracy & evaluation metrics
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
        {submitted ? (
          <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} sx={{ borderRadius: 2 }}>
            Feedback successfully recorded and sent to Model Evaluation dataset!
          </Alert>
        ) : (
          <>
            {/* Predicted Banner */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Model Detected Emotion:
              </Typography>
              <Chip
                icon={<span>{getEmotionEmoji(initialPredicted)}</span>}
                label={getEmotionLabel(initialPredicted)}
                sx={{
                  fontWeight: 'bold',
                  bgcolor: EMOTION_COLORS[initialPredicted.toLowerCase()]?.light || 'action.selected',
                  color: EMOTION_COLORS[initialPredicted.toLowerCase()]?.bg || 'text.primary',
                  border: '1px solid',
                  borderColor: EMOTION_COLORS[initialPredicted.toLowerCase()]?.bg || 'divider'
                }}
              />
            </Box>

            {/* Selection Grid */}
            <Box>
              <Typography variant="subtitle2" fontWeight="semibold" mb={1}>
                Select the Actual Emotion:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {emotions.map((emo) => {
                  const isSelected = correctedEmotion === emo;
                  const colorObj = EMOTION_COLORS[emo];
                  return (
                    <Chip
                      key={emo}
                      clickable
                      onClick={() => setCorrectedEmotion(emo)}
                      icon={<span>{colorObj.emoji}</span>}
                      label={colorObj.label}
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{
                        borderRadius: 2,
                        py: 2,
                        px: 1,
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 'bold' : 'medium',
                        borderColor: isSelected ? colorObj.bg : 'divider',
                        bgcolor: isSelected ? colorObj.bg : 'transparent',
                        color: isSelected ? '#ffffff' : 'text.primary',
                        '&:hover': {
                          bgcolor: isSelected ? colorObj.bg : 'action.hover'
                        }
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            {/* Optional Comments */}
            <TextField
              label="Additional Notes / Context (Optional)"
              placeholder="e.g., Lighting was dim, subtle smirk, wearing glasses..."
              multiline
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
            />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={handleClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        {!submitted && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!correctedEmotion || submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <FeedbackIcon />}
            sx={{
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#4f46e5' },
              borderRadius: 2,
              px: 3
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Correction'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
