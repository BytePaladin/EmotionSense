import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { EMOTION_COLORS } from '../../utils/emotionColors';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function EmotionBarChart({ stats }) {
  if (!stats) return null;
  const emotions = Object.keys(EMOTION_COLORS);
  const percentages = emotions.map(e => stats[`${e}_percentage`] || 0);
  const labels = emotions.map(e => EMOTION_COLORS[e].label);
  const colors = emotions.map(e => EMOTION_COLORS[e].bg);

  const data = {
    labels,
    datasets: [{ label: 'Percentage', data: percentages, backgroundColor: colors.map(c => c + '99'), borderColor: colors, borderWidth: 1, borderRadius: 8, borderSkipped: false }]
  };

  const options = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderColor: 'rgba(99, 102, 241, 0.3)', borderWidth: 1, cornerRadius: 12, padding: 12, callbacks: { label: (ctx) => `${ctx.parsed.x.toFixed(1)}%` } }
    },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', font: { family: 'Inter' } }, max: 100 },
      y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } }
    }
  };

  return <div className="h-64"><Bar data={data} options={options} /></div>;
}
