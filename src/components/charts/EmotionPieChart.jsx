import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { EMOTION_COLORS } from '../../utils/emotionColors';
import { Box } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function EmotionPieChart({ stats }) {
  if (!stats) return null;
  const emotions = Object.keys(EMOTION_COLORS);
  const percentages = emotions.map(e => stats[`${e}_percentage`] || 0);
  const labels = emotions.map(e => EMOTION_COLORS[e].label);
  const colors = emotions.map(e => EMOTION_COLORS[e].bg);

  const data = {
    labels,
    datasets: [{ data: percentages, backgroundColor: colors, borderColor: 'rgba(15, 23, 42, 0.8)', borderWidth: 3, hoverOffset: 8 }]
  };

  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 8 } },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderColor: 'rgba(99, 102, 241, 0.3)', borderWidth: 1, cornerRadius: 12, padding: 12, callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } }
    }
  };

  return <Box sx={{ height: 256 }}><Doughnut data={data} options={options} /></Box>;
}
