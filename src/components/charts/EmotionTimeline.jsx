import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { EMOTION_COLORS } from '../../utils/emotionColors';
import { Box, useTheme } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const emotionToNum = { happy: 7, surprised: 6, neutral: 5, sad: 4, fear: 3, angry: 2, disgust: 1 };

export default function EmotionTimeline({ detections }) {
  const theme = useTheme();
  if (!detections || detections.length === 0) return null;

  const labels = detections.map(d => `${d.timestamp.toFixed(1)}s`);
  const dataPoints = detections.map(d => emotionToNum[d.emotion?.toLowerCase()] || 5);
  const pointColors = detections.map(d => EMOTION_COLORS[d.emotion?.toLowerCase()]?.bg || '#6b7280');

  const emotionLabels = Object.entries(emotionToNum).sort((a, b) => a[1] - b[1]).map(([e]) => EMOTION_COLORS[e]?.label || e);

  const data = {
    labels,
    datasets: [{ label: 'Emotion', data: dataPoints, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', pointBackgroundColor: pointColors, pointBorderColor: pointColors, pointRadius: 6, pointHoverRadius: 8, tension: 0.3, fill: true }]
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: theme.palette.background.paper, titleColor: theme.palette.text.primary, bodyColor: theme.palette.text.secondary, borderColor: theme.palette.divider, borderWidth: 1, cornerRadius: 12, padding: 12, callbacks: { label: (ctx) => { const det = detections[ctx.dataIndex]; return `${EMOTION_COLORS[det.emotion?.toLowerCase()]?.label || det.emotion} (${(det.confidence * 100).toFixed(0)}%)`; } } }
    },
    scales: {
      x: { grid: { color: theme.palette.divider }, ticks: { color: theme.palette.text.secondary, font: { family: 'Inter' } }, title: { display: true, text: 'Time', color: theme.palette.text.secondary, font: { family: 'Inter' } } },
      y: { grid: { color: theme.palette.divider }, ticks: { color: theme.palette.text.secondary, font: { family: 'Inter', size: 11 }, stepSize: 1, callback: (value) => emotionLabels[value - 1] || '' }, min: 0.5, max: 7.5 }
    }
  };

  return <Box sx={{ height: 256 }}><Line data={data} options={options} /></Box>;
}
