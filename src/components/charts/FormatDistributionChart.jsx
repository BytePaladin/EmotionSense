import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Box, useTheme, Typography } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend);

const FORMAT_CONFIG = {
  live_camera: { label: 'Live Camera', color: '#6366f1' },
  image: { label: 'Image Uploads', color: '#10b981' },
  video: { label: 'Video Uploads', color: '#f59e0b' },
  other: { label: 'Other', color: '#64748b' }
};

export default function FormatDistributionChart({ formats }) {
  const theme = useTheme();

  if (!formats) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
        <Typography color="text.secondary">No format data available</Typography>
      </Box>
    );
  }

  const keys = ['live_camera', 'image', 'video'];
  if (formats.other > 0) keys.push('other');

  const total = keys.reduce((acc, k) => acc + (formats[k] || 0), 0);
  const dataValues = keys.map(k => formats[k] || 0);
  const labels = keys.map(k => FORMAT_CONFIG[k].label);
  const backgroundColors = keys.map(k => FORMAT_CONFIG[k].color);

  if (total === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
        <Typography color="text.secondary">No detections logged yet</Typography>
      </Box>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: theme.palette.background.paper,
        borderWidth: 3,
        hoverOffset: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          font: { family: 'Inter', size: 12, weight: 500 },
          padding: 14,
          usePointStyle: true,
          pointStyleWidth: 8
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
          label: (ctx) => {
            const count = ctx.parsed;
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: ${count} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Box sx={{ height: 260, position: 'relative' }}>
      <Doughnut data={data} options={options} />
    </Box>
  );
}
