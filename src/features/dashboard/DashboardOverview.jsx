import { CloudUpload, ShowChart, AccessTime, SentimentSatisfied } from '@mui/icons-material';
import EmotionPieChart from '../../components/charts/EmotionPieChart';
import EmotionBarChart from '../../components/charts/EmotionBarChart';
import { getEmotionLabel, getEmotionColor, getEmotionEmoji } from '../../utils/emotionColors';
import EmptyState from '../../components/ui/EmptyState';
import { Box, Grid, Card as MuiCard, Typography, Stack } from '@mui/material';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <MuiCard sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, height: '100%', borderRadius: 3, '&:hover .stat-icon': { transform: 'scale(1.1)' } }}>
    <Box className="stat-icon" sx={{ p: 1.5, borderRadius: 2, bgcolor: color, color: 'white', display: 'flex', transition: 'transform 0.3s' }}>
      <Icon />
    </Box>
    <Box>
      <Typography variant="body2" color="text.secondary" fontWeight="medium">{title}</Typography>
      <Typography variant="h5" fontWeight="bold" mt={0.5}>{value}</Typography>
    </Box>
  </MuiCard>
);

export default function DashboardOverview({ stats }) {
  if (!stats || stats.total_uploads === 0) {
    return <EmptyState icon={ShowChart} title="No Analytics Data" message="Upload a file to start generating emotional intelligence insights." />;
  }

  const dominantEmotionStr = stats.dominant_emotion || 'neutral';
  const dominantColor = getEmotionColor(dominantEmotionStr);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard title="Total Uploads" value={stats.total_uploads} icon={CloudUpload} color="primary.main" />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard title="Dominant Emotion" value={`${getEmotionLabel(dominantEmotionStr)} ${getEmotionEmoji(dominantEmotionStr)}`} icon={SentimentSatisfied} color={dominantColor} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard title="Total Detections" value={stats.total_detections} icon={ShowChart} color="secondary.main" />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard title="Avg. Confidence" value={`${stats.average_confidence}%`} icon={AccessTime} color="info.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <MuiCard sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={3}>
              <Typography variant="h6" fontWeight="semibold">Overall Distribution</Typography>
            </Stack>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmotionPieChart stats={stats.emotion_distribution} />
            </Box>
          </MuiCard>
        </Grid>
        <Grid item xs={12} lg={8}>
          <MuiCard sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={3}>
              <Typography variant="h6" fontWeight="semibold">Emotion Breakdown</Typography>
            </Stack>
            <Box sx={{ flex: 1 }}>
              <EmotionBarChart stats={stats.emotion_distribution} />
            </Box>
          </MuiCard>
        </Grid>
      </Grid>
    </Box>
  );
}
