import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { EMOTION_COLORS } from '../../utils/emotionColors';
import { Box, useTheme } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function GroupedEmotionBarChart({ statsA, statsB, titleA = 'Session A', titleB = 'Session B' }) {
  const theme = useTheme();
  if (!statsA || !statsB) return null;

  const emotions = Object.keys(EMOTION_COLORS);
  const labels = emotions.map(e => `${EMOTION_COLORS[e].emoji} ${EMOTION_COLORS[e].label}`);

  const dataA = emotions.map(e => Number(statsA[`${e}_percentage`] || 0));
  const dataB = emotions.map(e => Number(statsB[`${e}_percentage`] || 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: titleA,
        data: dataA,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderColor: '#4f46e5',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      },
      {
        label: titleB,
        data: dataB,
        backgroundColor: 'rgba(139, 92, 246, 0.85)',
        borderColor: '#7c3aed',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: { family: 'Inter', weight: 'bold', size: 12 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme.palette.text.secondary, font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: theme.palette.divider },
        ticks: {
          color: theme.palette.text.secondary,
          font: { family: 'Inter' },
          callback: (value) => `${value}%`
        },
        max: 100,
        beginAtZero: true
      }
    }
  };

  return (
    <Box sx={{ height: 320, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
}
