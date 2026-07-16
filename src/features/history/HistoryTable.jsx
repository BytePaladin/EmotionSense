import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, FileImage, FileVideo } from 'lucide-react';
import Button from '../../components/ui/Button';
import { getEmotionLabel, getEmotionColor } from '../../utils/emotionColors';
import EmptyState from '../../components/ui/EmptyState';
import { Clock } from 'lucide-react';

export default function HistoryTable({ history, loading, onDelete }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-dark-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return <EmptyState icon={Clock} title="No Upload History" message="You haven't analyzed any files yet." actionLabel="Upload Now" onAction={() => navigate('/upload')} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-dark-700/50">
            <th className="pb-4 pt-2 px-4 font-semibold text-dark-300">File</th>
            <th className="pb-4 pt-2 px-4 font-semibold text-dark-300">Date</th>
            <th className="pb-4 pt-2 px-4 font-semibold text-dark-300">Dominant Emotion</th>
            <th className="pb-4 pt-2 px-4 font-semibold text-dark-300">Avg. Confidence</th>
            <th className="pb-4 pt-2 px-4 font-semibold text-dark-300 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700/30">
          {history.map((item) => (
            <tr key={item.id} className="hover:bg-dark-800/30 transition-colors group">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
                    {item.file_type.startsWith('image/') ? <FileImage className="w-5 h-5 text-primary-400" /> : <FileVideo className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-dark-100 truncate max-w-[200px]" title={item.file_name}>{item.file_name}</p>
                    <p className="text-xs text-dark-400">{(item.file_size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-dark-300 text-sm">
                {new Date(item.upload_time).toLocaleDateString()} <br/>
                <span className="text-xs text-dark-500">{new Date(item.upload_time).toLocaleTimeString()}</span>
              </td>
              <td className="py-4 px-4">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: `${getEmotionColor(item.dominant_emotion)}20`, color: getEmotionColor(item.dominant_emotion), borderColor: `${getEmotionColor(item.dominant_emotion)}50` }}>
                  {getEmotionLabel(item.dominant_emotion)}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-full max-w-[80px] h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${item.average_confidence}%` }} />
                  </div>
                  <span className="text-xs text-dark-300">{item.average_confidence}%</span>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/analysis/${item.id}`)} className="h-8 w-8 !p-0"><Eye className="w-4 h-4 text-primary-400" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-8 w-8 !p-0 hover:!bg-red-500/10"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
