import { Upload, Activity, Clock, Smile } from 'lucide-react';
import Card from '../../components/ui/Card';
import EmotionPieChart from '../../components/charts/EmotionPieChart';
import EmotionBarChart from '../../components/charts/EmotionBarChart';
import { getEmotionLabel, getEmotionColor, getEmotionEmoji } from '../../utils/emotionColors';
import EmptyState from '../../components/ui/EmptyState';

const StatCard = ({ title, value, icon: Icon, colorClass, gradient }) => (
  <Card gradient={gradient} className="flex items-center gap-4 group">
    <div className={`p-4 rounded-xl ${colorClass} transition-transform duration-300 group-hover:scale-110`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-dark-400 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-dark-100 mt-1">{value}</p>
    </div>
  </Card>
);

export default function DashboardOverview({ stats }) {
  if (!stats || stats.total_uploads === 0) {
    return <EmptyState icon={Activity} title="No Analytics Data" message="Upload a file to start generating emotional intelligence insights." />;
  }

  const dominantEmotionStr = stats.dominant_emotion || 'neutral';
  const dominantColor = getEmotionColor(dominantEmotionStr);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Uploads" value={stats.total_uploads} icon={Upload} colorClass="bg-gradient-to-br from-primary-500 to-primary-600" />
        <StatCard title="Dominant Emotion" value={`${getEmotionLabel(dominantEmotionStr)} ${getEmotionEmoji(dominantEmotionStr)}`} icon={Smile} colorClass="" gradient={false} />
        <StatCard title="Total Detections" value={stats.total_detections} icon={Activity} colorClass="bg-gradient-to-br from-purple-500 to-purple-600" />
        <StatCard title="Avg. Confidence" value={`${stats.average_confidence}%`} icon={Clock} colorClass="bg-gradient-to-br from-cyan-500 to-cyan-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-semibold text-dark-100 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-primary-500 rounded-full"/>Overall Distribution</h3>
          <div className="flex-1 flex items-center justify-center">
            <EmotionPieChart stats={stats.emotion_distribution} />
          </div>
        </Card>
        <Card className="lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-semibold text-dark-100 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-purple-500 rounded-full"/>Emotion Breakdown</h3>
          <div className="flex-1">
            <EmotionBarChart stats={stats.emotion_distribution} />
          </div>
        </Card>
      </div>
    </div>
  );
}
