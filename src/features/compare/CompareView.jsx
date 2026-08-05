import { useState } from 'react';
import {
  Box,
  Card as MuiCard,
  Grid,
  Typography,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CompareArrows,
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  Psychology,
  Shield,
  AutoAwesome,
  CheckCircle,
  Flag as FlagIcon,
  VideoFile,
  Image as ImageIcon,
  RecordVoiceOver as CoachIcon,
  Videocam as VideocamIcon
} from '@mui/icons-material';
import { EMOTION_COLORS, getEmotionLabel, getEmotionColor, getEmotionEmoji } from '../../utils/emotionColors';
import { formatFullDateTimeGMT6, formatDateGMT6 } from '../../utils/dateUtils';
import GroupedEmotionBarChart from '../../components/charts/GroupedEmotionBarChart';

const getFileIcon = (fileType) => {
  if (fileType === 'coach_session') return <CoachIcon sx={{ color: '#6366f1' }} />;
  if (fileType === 'live_session') return <VideocamIcon sx={{ color: '#ec4899' }} />;
  if (fileType && fileType.startsWith('image/')) return <ImageIcon color="primary" />;
  return <VideoFile color="secondary" />;
};

export default function CompareView({
  sessionA,
  sessionB,
  allSessions = [],
  onSelectA,
  onSelectB,
  onSwap
}) {
  if (!sessionA || !sessionB) return null;

  const fileA = sessionA.file;
  const fileB = sessionB.file;

  // Delta computations
  const stabA = fileA.stability_score || 0;
  const stabB = fileB.stability_score || 0;
  const stabDiff = Number((stabB - stabA).toFixed(1));

  const confA = fileA.average_confidence || 0;
  const confB = fileB.average_confidence || 0;
  const confDiff = Number((confB - confA).toFixed(1));

  const stressA = (fileA.fear_percentage || 0) + (fileA.angry_percentage || 0) + (fileA.disgust_percentage || 0);
  const stressB = (fileB.fear_percentage || 0) + (fileB.angry_percentage || 0) + (fileB.disgust_percentage || 0);
  const stressDiff = Number((stressB - stressA).toFixed(1));

  const compA = (fileA.neutral_percentage || 0) + (fileA.happy_percentage || 0);
  const compB = (fileB.neutral_percentage || 0) + (fileB.happy_percentage || 0);
  const compDiff = Number((compB - compA).toFixed(1));

  const emotions = Object.keys(EMOTION_COLORS);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. TOP SESSION SELECTOR BAR */}
      <MuiCard
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.05)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Session A Dropdown */}
          <Grid item xs={12} md={5}>
            <Box sx={{ p: 2, borderRadius: 2.5, border: '1.5px solid #6366f130', bgcolor: 'rgba(99, 102, 241, 0.03)' }}>
              <Typography variant="caption" fontWeight="bold" color="primary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Baseline Session (A)
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <Select
                  value={fileA.id}
                  onChange={(e) => onSelectA(e.target.value)}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  {allSessions.map((s) => (
                    <MenuItem key={s.id} value={s.id} disabled={s.id === fileB.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon(s.file_type)}
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {s.file_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({formatDateGMT6(s.upload_time)})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1} alignItems="center" mt={1.5}>
                <Chip
                  icon={<span>{getEmotionEmoji(fileA.dominant_emotion)}</span>}
                  label={`Dominant: ${getEmotionLabel(fileA.dominant_emotion)}`}
                  size="small"
                  sx={{ bgcolor: `${getEmotionColor(fileA.dominant_emotion)}20`, color: getEmotionColor(fileA.dominant_emotion), fontWeight: 700 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatFullDateTimeGMT6(fileA.upload_time)}
                </Typography>
              </Stack>
            </Box>
          </Grid>

          {/* Swap Button */}
          <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
            <Tooltip title="Swap Baseline & Comparison Sessions">
              <Button
                variant="outlined"
                onClick={onSwap}
                startIcon={<SwapHoriz />}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  px: 2,
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.08)' }
                }}
              >
                Swap
              </Button>
            </Tooltip>
          </Grid>

          {/* Session B Dropdown */}
          <Grid item xs={12} md={5}>
            <Box sx={{ p: 2, borderRadius: 2.5, border: '1.5px solid #8b5cf630', bgcolor: 'rgba(139, 92, 246, 0.03)' }}>
              <Typography variant="caption" fontWeight="bold" sx={{ color: '#8b5cf6', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Comparison Target (B)
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <Select
                  value={fileB.id}
                  onChange={(e) => onSelectB(e.target.value)}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  {allSessions.map((s) => (
                    <MenuItem key={s.id} value={s.id} disabled={s.id === fileA.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon(s.file_type)}
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {s.file_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({formatDateGMT6(s.upload_time)})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1} alignItems="center" mt={1.5}>
                <Chip
                  icon={<span>{getEmotionEmoji(fileB.dominant_emotion)}</span>}
                  label={`Dominant: ${getEmotionLabel(fileB.dominant_emotion)}`}
                  size="small"
                  sx={{ bgcolor: `${getEmotionColor(fileB.dominant_emotion)}20`, color: getEmotionColor(fileB.dominant_emotion), fontWeight: 700 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatFullDateTimeGMT6(fileB.upload_time)}
                </Typography>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </MuiCard>

      {/* 2. EXECUTIVE DELTA KPI SCORECARD */}
      <Grid container spacing={2}>
        {/* Stability Score Delta */}
        <Grid item xs={12} sm={6} md={3}>
          <MuiCard sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              Emotional Stability
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {stabB}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (was {stabA}%)
              </Typography>
            </Box>
            <Chip
              icon={stabDiff >= 0 ? <TrendingUp /> : <TrendingDown />}
              label={`${stabDiff >= 0 ? '+' : ''}${stabDiff}%`}
              size="small"
              sx={{
                bgcolor: stabDiff >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: stabDiff >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 700
              }}
            />
          </MuiCard>
        </Grid>

        {/* Composure / Calm Growth */}
        <Grid item xs={12} sm={6} md={3}>
          <MuiCard sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              Composure & Positivity
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {compB.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (was {compA.toFixed(1)}%)
              </Typography>
            </Box>
            <Chip
              icon={compDiff >= 0 ? <TrendingUp /> : <TrendingDown />}
              label={`${compDiff >= 0 ? '+' : ''}${compDiff}%`}
              size="small"
              sx={{
                bgcolor: compDiff >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: compDiff >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 700
              }}
            />
          </MuiCard>
        </Grid>

        {/* Stress & Anxiety Reduction */}
        <Grid item xs={12} sm={6} md={3}>
          <MuiCard sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              Micro-Stress Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {stressB.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (was {stressA.toFixed(1)}%)
              </Typography>
            </Box>
            <Chip
              icon={stressDiff <= 0 ? <TrendingDown /> : <TrendingUp />}
              label={`${stressDiff <= 0 ? '' : '+'}${stressDiff}%`}
              size="small"
              sx={{
                bgcolor: stressDiff <= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: stressDiff <= 0 ? '#10b981' : '#ef4444',
                fontWeight: 700
              }}
            />
          </MuiCard>
        </Grid>

        {/* Average AI Confidence */}
        <Grid item xs={12} sm={6} md={3}>
          <MuiCard sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              Detection Confidence
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {confB}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (was {confA}%)
              </Typography>
            </Box>
            <Chip
              icon={confDiff >= 0 ? <TrendingUp /> : <TrendingDown />}
              label={`${confDiff >= 0 ? '+' : ''}${confDiff}%`}
              size="small"
              sx={{
                bgcolor: confDiff >= 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: confDiff >= 0 ? '#6366f1' : '#ef4444',
                fontWeight: 700
              }}
            />
          </MuiCard>
        </Grid>
      </Grid>

      {/* 3. GROUPED EMOTION DISTRIBUTION BAR CHART */}
      <MuiCard sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Side-by-Side Emotion Breakdown
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Comparative percentage distribution across all 7 recognized emotions.
        </Typography>
        <GroupedEmotionBarChart
          statsA={fileA}
          statsB={fileB}
          titleA={`Session A (${fileA.file_name})`}
          titleB={`Session B (${fileB.file_name})`}
        />
      </MuiCard>

      {/* 4. METRIC BREAKDOWN TABLE */}
      <MuiCard sx={{ p: 0, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Detailed Metrics Comparison
          </Typography>
        </Box>

        <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight="bold" color="text.secondary">Metric / Attribute</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight="bold" color="primary">Session A ({fileA.file_name})</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight="bold" sx={{ color: '#8b5cf6' }}>Session B ({fileB.file_name})</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight="bold" color="text.secondary">Variance / Shift</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Emotion rows */}
              {emotions.map((e) => {
                const valA = Number(fileA[`${e}_percentage`] || 0);
                const valB = Number(fileB[`${e}_percentage`] || 0);
                const diff = Number((valB - valA).toFixed(1));
                const color = getEmotionColor(e);

                return (
                  <TableRow key={e} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getEmotionEmoji(e)}</span>
                        <Typography variant="body2" fontWeight="semibold">
                          {getEmotionLabel(e)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {valA.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {valB.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${diff >= 0 ? '+' : ''}${diff}%`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor: diff === 0 ? 'action.hover' : diff > 0 ? `${color}20` : 'rgba(107, 114, 128, 0.15)',
                          color: diff === 0 ? 'text.secondary' : color
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Total Detections & Corrections */}
              <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell><Typography variant="body2" fontWeight="bold">Total Detections Captured</Typography></TableCell>
                <TableCell><Typography variant="body2">{fileA.total_detections || 0}</Typography></TableCell>
                <TableCell><Typography variant="body2">{fileB.total_detections || 0}</Typography></TableCell>
                <TableCell align="right">
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    {(fileB.total_detections || 0) - (fileA.total_detections || 0)}
                  </Typography>
                </TableCell>
              </TableRow>

              <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell><Typography variant="body2" fontWeight="bold">Ground-Truth User Feedback</Typography></TableCell>
                <TableCell><Typography variant="body2">{sessionA.feedback?.length || 0} corrections</Typography></TableCell>
                <TableCell><Typography variant="body2">{sessionB.feedback?.length || 0} corrections</Typography></TableCell>
                <TableCell align="right">
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    {(sessionB.feedback?.length || 0) - (sessionA.feedback?.length || 0)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </MuiCard>

      {/* 5. AI COACHING EVALUATION & TAKEAWAYS */}
      <MuiCard
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'rgba(99, 102, 241, 0.15)',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AutoAwesome fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Automated Evaluation Summary (CSE 327 SE Telemetry)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Comparative progress analysis generated from session metrics
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
          {stabDiff >= 0 ? (
            <>
              <strong>Positive Growth Observed:</strong> Emotional stability score increased by <strong>+{stabDiff}%</strong> from Session A to Session B.
            </>
          ) : (
            <>
              <strong>Increased Fluctuations Observed:</strong> Emotional stability score decreased by <strong>{stabDiff}%</strong> in Session B.
            </>
          )}
          {stressDiff < 0 && (
            <> Micro-stress triggers (fear, anger, disgust) dropped by <strong>{Math.abs(stressDiff)}%</strong>.</>
          )}
          {compDiff > 0 && (
            <> Composure and positive engagement improved by <strong>+{compDiff}%</strong>.</>
          )}
        </Typography>
      </MuiCard>
    </Box>
  );
}
