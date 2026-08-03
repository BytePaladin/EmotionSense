import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Box, useTheme, Typography } from '@mui/material';
import { EMOTION_COLORS } from '../../utils/emotionColors';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function EmotionConfidenceChart({ emotionConfidence }) {
  const theme = useTheme();

  if (!emotionConfidence) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
        <Typography color="text.secondary">No emotion confidence data</Typography>
      </Box>
    );
  }

  const emotions = ['happy', 'sad', 'angry', 'fear', 'surprised', 'disgust', 'neutral'];
  const labels = emotions.map(e => EMOTION_COLORS[e]?.label || e);
  const dataValues = emotions.map(e => emotionConfidence[e]?.avg_confidence || 0);
  const backgroundColors = emotions.map(e => EMOTION_COLORS[e]?.bg || '#6366f1');

  const data = {
    labels,
    datasets: [
      {
        label: 'Average Confidence (%)',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 42
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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
          label: (ctx) => ` Confidence: ${ctx.parsed.y.toFixed(1)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: theme.palette.text.secondary,
          font: { family: 'Inter', size: 11, weight: 500 }
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: theme.palette.divider,
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { family: 'Inter', size: 11 },
          callback: (value) => `${value}%`
        }
      }
    }
  };

  return (
    <Box sx={{ height: 260 }}>
      <Bar data={data} options={options} />
    </Box>
  );
}
