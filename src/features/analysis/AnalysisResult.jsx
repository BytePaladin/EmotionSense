import { Activity, Clock, ShieldCheck, Zap } from 'lucide-react';
import Card from '../../components/ui/Card';
import EmotionPieChart from '../../components/charts/EmotionPieChart';
import EmotionTimeline from '../../components/charts/EmotionTimeline';
import ConfidenceTrend from '../../components/charts/ConfidenceTrend';
import { getEmotionLabel, getEmotionColor, getEmotionEmoji } from '../../utils/emotionColors';

export default function AnalysisResult({ data }) {
  if (!data) return null;
  const { file, detections } = data;
  const dominantColor = getEmotionColor(file.dominant_emotion);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="flex flex-col md:flex-row gap-8 items-center border-l-4" style={{ borderLeftColor: dominantColor }}>
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800 border border-dark-700">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dominantColor }} />
            <span className="text-sm font-medium text-dark-200">Analysis Complete</span>
          </div>
          <h2 className="text-3xl font-bold text-dark-100">{file.file_name}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-dark-400">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {new Date(file.upload_time).toLocaleString()}</span>
            <span className="flex items-center gap-1 border-l border-dark-700 pl-4"><Activity className="w-4 h-4"/> {file.total_detections} frames analyzed</span>
          </div>
        </div>
        <div className="w-full md:w-auto flex items-center justify-between gap-8 p-6 bg-dark-800/50 rounded-2xl border border-dark-700/50">
          <div className="text-center">
            <p className="text-dark-400 text-sm mb-1">Dominant</p>
            <p className="text-2xl font-bold" style={{ color: dominantColor }}>
              {getEmotionEmoji(file.dominant_emotion)} {getEmotionLabel(file.dominant_emotion)}
            </p>
          </div>
          <div className="w-px h-12 bg-dark-700" />
          <div className="text-center">
            <p className="text-dark-400 text-sm mb-1">Confidence</p>
            <p className="text-2xl font-bold text-cyan-400">{file.average_confidence}%</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-semibold text-dark-100 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-primary-500 rounded-full"/>Distribution</h3>
          <div className="flex-1 flex items-center justify-center"><EmotionPieChart stats={file} /></div>
        </Card>
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-dark-100 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-purple-500 rounded-full"/>Emotion Timeline</h3>
            <EmotionTimeline detections={detections} />
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-dark-800 to-dark-900">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><ShieldCheck className="w-6 h-6"/></div>
                <div>
                  <p className="text-dark-400 text-sm">Stability Score</p>
                  <div className="flex items-end gap-2 mt-1">
                    <h4 className="text-3xl font-bold text-dark-100">{file.stability_score}</h4>
                    <span className="text-sm text-dark-500 mb-1">/ 100</span>
                  </div>
                  <p className="text-xs text-dark-500 mt-2">Measures emotion consistency over time.</p>
                </div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-dark-800 to-dark-900">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-500/10 rounded-xl text-primary-400"><Zap className="w-6 h-6"/></div>
                <div className="w-full">
                  <p className="text-dark-400 text-sm flex justify-between">Processing Status <span className="text-primary-400">Complete</span></p>
                  <div className="w-full h-2 bg-dark-700 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-primary-500 w-full" />
                  </div>
                  <p className="text-xs text-dark-500 mt-2">Analyzed {file.file_size > 1048576 ? (file.file_size/1048576).toFixed(1) + ' MB' : (file.file_size/1024).toFixed(0) + ' KB'} in {(detections.length * 0.15).toFixed(1)}s</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <Card>
         <h3 className="text-lg font-semibold text-dark-100 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-cyan-500 rounded-full"/>Confidence Trend</h3>
         <ConfidenceTrend detections={detections} />
      </Card>
    </div>
  );
}
