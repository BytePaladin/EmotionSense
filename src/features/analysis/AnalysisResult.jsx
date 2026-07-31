import { ShowChart, AccessTime, Verified, Bolt } from '@mui/icons-material';
import EmotionPieChart from '../../components/charts/EmotionPieChart';
import EmotionTimeline from '../../components/charts/EmotionTimeline';
import ConfidenceTrend from '../../components/charts/ConfidenceTrend';
import { getEmotionLabel, getEmotionColor, getEmotionEmoji } from '../../utils/emotionColors';
import { formatFullDateTimeGMT6 } from '../../utils/dateUtils';
import { Box, Card as MuiCard, Typography, Grid, Stack, Divider, LinearProgress } from '@mui/material';

export default function AnalysisResult({ data }) {
  if (!data) return null;
  const { file, detections } = data;
  const dominantColor = getEmotionColor(file.dominant_emotion);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <MuiCard sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center', p: 3, borderLeft: '4px solid', borderLeftColor: dominantColor, borderRadius: 3 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 4, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', alignSelf: 'flex-start' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dominantColor, animation: 'pulse 2s infinite' }} />
            <Typography variant="caption" fontWeight="medium" color="text.secondary">Analysis Complete</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold">{file.file_name}</Typography>
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center" color="text.secondary">
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AccessTime fontSize="small"/> {formatFullDateTimeGMT6(file.upload_time)}</Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ShowChart fontSize="small"/> {file.total_detections} frames analyzed</Typography>
          </Stack>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'auto' }, display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 }, bgcolor: 'action.hover', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" mb={0.5}>Dominant</Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: dominantColor }}>
              {getEmotionEmoji(file.dominant_emotion)} {getEmotionLabel(file.dominant_emotion)}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ height: 48, alignSelf: 'center' }} />
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" mb={0.5}>Confidence</Typography>
            <Typography variant="h5" fontWeight="bold" color="info.main">{file.average_confidence}%</Typography>
          </Box>
        </Box>
      </MuiCard>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <MuiCard sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={3}>
              <Typography variant="h6" fontWeight="semibold">Distribution</Typography>
            </Stack>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmotionPieChart stats={file} /></Box>
          </MuiCard>
        </Grid>
        
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <MuiCard sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={3}>
                <Typography variant="h6" fontWeight="semibold">Emotion Timeline</Typography>
              </Stack>
              <EmotionTimeline detections={detections} />
            </MuiCard>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <MuiCard sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)' }}>
                  <Stack direction="row" alignItems="center" gap={2} sx={{ width: '100%' }}>
                    <Box sx={{ p: 1.25, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
                      <Verified fontSize="medium" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">Stability Score</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                        <Typography variant="h4" fontWeight="bold">{file.stability_score}</Typography>
                        <Typography variant="body2" color="text.disabled">/ 100</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Measures emotion consistency over time.</Typography>
                    </Box>
                  </Stack>
                </MuiCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <MuiCard sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)' }}>
                  <Stack direction="row" alignItems="center" gap={2} sx={{ width: '100%' }}>
                    <Box sx={{ p: 1.25, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
                      <Bolt fontSize="medium" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Processing Status</Typography>
                        <Typography variant="body2" color="primary.main" fontWeight="semibold">Complete</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 4 }} />
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>Analyzed {file.file_size > 1048576 ? (file.file_size/1048576).toFixed(1) + ' MB' : (file.file_size/1024).toFixed(0) + ' KB'} in {(detections.length * 0.15).toFixed(1)}s</Typography>
                    </Box>
                  </Stack>
                </MuiCard>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
      
      <MuiCard sx={{ p: 3, borderRadius: 3 }}>
         <Stack direction="row" alignItems="center" gap={1} mb={3}>
           <Typography variant="h6" fontWeight="semibold">Confidence Trend</Typography>
         </Stack>
         <ConfidenceTrend detections={detections} />
      </MuiCard>
    </Box>
  );
}
