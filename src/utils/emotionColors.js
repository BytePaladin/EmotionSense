export const EMOTION_COLORS = {
  happy: { bg: '#10b981', light: 'rgba(16, 185, 129, 0.15)', label: 'Happy', emoji: '😊' },
  sad: { bg: '#3b82f6', light: 'rgba(59, 130, 246, 0.15)', label: 'Sad', emoji: '😢' },
  angry: { bg: '#b91c1c', light: 'rgba(185, 28, 28, 0.15)', label: 'Angry', emoji: '😠' },
  fear: { bg: '#a855f7', light: 'rgba(168, 85, 247, 0.15)', label: 'Fear', emoji: '😨' },
  disgust: { bg: '#f97316', light: 'rgba(249, 115, 22, 0.15)', label: 'Disgust', emoji: '🤢' },
  surprised: { bg: '#eab308', light: 'rgba(234, 179, 8, 0.15)', label: 'Surprised', emoji: '😮' },
  neutral: { bg: '#6b7280', light: 'rgba(107, 114, 128, 0.15)', label: 'Neutral', emoji: '😐' }
};

export const getEmotionColor = (emotion) => {
  return EMOTION_COLORS[emotion?.toLowerCase()]?.bg || '#6b7280';
};

export const getEmotionLabel = (emotion) => {
  return EMOTION_COLORS[emotion?.toLowerCase()]?.label || 'Unknown';
};

export const getEmotionEmoji = (emotion) => {
  return EMOTION_COLORS[emotion?.toLowerCase()]?.emoji || '❓';
};

export const getAllEmotionBgColors = () => {
  return Object.values(EMOTION_COLORS).map(c => c.bg);
};

export const getAllEmotionLabels = () => {
  return Object.values(EMOTION_COLORS).map(c => c.label);
};
