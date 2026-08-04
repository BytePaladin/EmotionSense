import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as StrengthsIcon,
  Lightbulb as TipIcon,
  Replay as RetryIcon,
  Visibility as ViewIcon,
  RecordVoiceOver as CoachIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function CoachScoreModal({ open, onClose, coachData, analysisId }) {
  const navigate = useNavigate();

  if (!coachData) return null;

  const {
    readinessScore = 88,
    composureScore = 90,
    warmthScore = 85,
    confidenceScore = 89,
    strengths = [],
    improvements = []
  } = coachData;

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#6366f1';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(readinessScore);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1.5,
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CoachIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Interview & Presentation Debrief
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AI-driven behavioral telemetry and speech readiness report
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
        {/* Main Score Hero Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1}>
              OVERALL READINESS RATING
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: scoreColor, mt: 0.5 }}>
              {readinessScore >= 85 ? 'Outstanding Performance' : readinessScore >= 70 ? 'Strong Engagement' : 'Developing Composure'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your expressions reflect balanced composure with consistent engagement. You communicated with poise and positive facial warmth.
            </Typography>
          </Box>

          <Box
            sx={{
              position: 'relative',
              width: 110,
              height: 110,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `6px solid ${scoreColor}`,
              boxShadow: `0 0 20px ${scoreColor}40`
            }}
          >
            <Typography variant="h3" fontWeight="900" sx={{ color: scoreColor, lineHeight: 1 }}>
              {readinessScore}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              OUT OF 100
            </Typography>
          </Box>
        </Paper>

        {/* Sub-Score Breakdown */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Composure & Poise
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ my: 0.5, color: '#10b981' }}>
                {composureScore}%
              </Typography>
              <LinearProgress variant="determinate" value={composureScore} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Warmth & Friendliness
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ my: 0.5, color: '#6366f1' }}>
                {warmthScore}%
              </Typography>
              <LinearProgress variant="determinate" value={warmthScore} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' } }} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Attention & Presence
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ my: 0.5, color: '#0284c7' }}>
                {confidenceScore}%
              </Typography>
              <LinearProgress variant="determinate" value={confidenceScore} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: '#0284c7' } }} />
            </Box>
          </Grid>
        </Grid>

        {/* Strengths & Improvement Tips */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5} color="success.main">
                <StrengthsIcon fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Key Strengths
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {strengths.length > 0 ? (
                  strengths.map((str, i) => (
                    <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <span style={{ color: '#10b981' }}>•</span> {str}
                    </Typography>
                  ))
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">• Steady eye alignment and composed facial baseline.</Typography>
                    <Typography variant="body2" color="text.secondary">• Minimal nervous fidgeting or sudden anxious shifts.</Typography>
                  </>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5} color="warning.main">
                <TipIcon fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Actionable Coach Tips
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {improvements.length > 0 ? (
                  improvements.map((imp, i) => (
                    <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <span style={{ color: '#f59e0b' }}>•</span> {imp}
                    </Typography>
                  ))
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">• Introduce natural smiles at opening & closing greetings.</Typography>
                    <Typography variant="body2" color="text.secondary">• Consciously relax facial muscles during pauses.</Typography>
                  </>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'space-between' }}>
        <Button
          onClick={onClose}
          startIcon={<RetryIcon />}
          color="inherit"
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Practice Again
        </Button>
        {analysisId && (
          <Button
            onClick={() => navigate(`/analysis/${analysisId}`)}
            variant="contained"
            startIcon={<ViewIcon />}
            sx={{
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#4f46e5' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3
            }}
          >
            View Full Analysis
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
