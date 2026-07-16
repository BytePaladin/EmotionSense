import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Box } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function ConfidenceTrend({ detections }) {
  if (!detections || detections.length === 0) return null;

  const labels = detections.map(d => `${d.timestamp.toFixed(1)}s`);
  const confidences = detections.map(d => (d.confidence * 100).toFixed(1));

  const data = {
    labels,
    datasets: [{
      label: 'Confidence %', data: confidences, borderColor: '#06b6d4',
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: canvasCtx, chartArea } = chart;
        if (!chartArea) return 'rgba(6, 182, 212, 0.1)';
        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
        return gradient;
      },
      pointBackgroundColor: '#06b6d4', pointBorderColor: '#0e7490', pointRadius: 4, pointHoverRadius: 6, tension: 0.4, fill: true
    }]
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'background.paper', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderColor: 'rgba(6, 182, 212, 0.3)', borderWidth: 1, cornerRadius: 12, padding: 12, callbacks: { label: (ctx) => `Confidence: ${ctx.parsed.y}%` } }
    },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: 'text.secondary', font: { family: 'Inter' } }, title: { display: true, text: 'Time', color: '#64748b', font: { family: 'Inter' } } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: 'text.secondary', font: { family: 'Inter' } }, min: 0, max: 100, title: { display: true, text: 'Confidence %', color: '#64748b', font: { family: 'Inter' } } }
    }
  };

  return <Box sx={{ height: 256 }}><Line data={data} options={options} /></Box>;
}
