import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { EMOTION_COLORS } from '../../utils/emotionColors';
import { Box, useTheme } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function EmotionPieChart({ stats }) {
  const theme = useTheme();
  if (!stats) return null;
  const emotions = Object.keys(EMOTION_COLORS);
  const percentages = emotions.map(e => stats[`${e}_percentage`] || 0);
  const labels = emotions.map(e => EMOTION_COLORS[e].label);
  const colors = emotions.map(e => EMOTION_COLORS[e].bg);

  const data = {
    labels,
    datasets: [{ data: percentages, backgroundColor: colors, borderColor: theme.palette.background.paper, borderWidth: 3, hoverOffset: 8 }]
  };

  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { color: theme.palette.text.primary, font: { family: 'Inter', size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 8 } },
      tooltip: { backgroundColor: theme.palette.background.paper, titleColor: theme.palette.text.primary, bodyColor: theme.palette.text.secondary, borderColor: theme.palette.divider, borderWidth: 1, cornerRadius: 12, padding: 12, callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } }
    }
  };

  return <Box sx={{ height: 256 }}><Doughnut data={data} options={options} /></Box>;
}
