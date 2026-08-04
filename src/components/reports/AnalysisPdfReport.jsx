import React, { forwardRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EMOTION_COLORS, getEmotionLabel, getEmotionColor, getEmotionEmoji } from '../../utils/emotionColors';
import { formatFullDateTimeGMT6 } from '../../utils/dateUtils';

export const exportAnalysisToPdf = async (element, fileName = 'EmotionSense_Analysis_Report.pdf') => {
  if (!element) return false;
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let position = 0;
    let heightLeft = pdfHeight;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    const cleanName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(cleanName);
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return false;
  }
};

const AnalysisPdfReport = forwardRef(({ data, user }, ref) => {
  if (!data || !data.file) return null;
  const { file, detections = [] } = data;
  const dominantColor = getEmotionColor(file.dominant_emotion);
  const nowDhaka = formatFullDateTimeGMT6(new Date().toISOString());

  const emotionsList = [
    { key: 'happy', label: 'Happy', pct: file.happy_percentage || 0, color: EMOTION_COLORS.happy.bg },
    { key: 'neutral', label: 'Neutral', pct: file.neutral_percentage || 0, color: EMOTION_COLORS.neutral.bg },
    { key: 'surprised', label: 'Surprised', pct: file.surprised_percentage || 0, color: EMOTION_COLORS.surprised.bg },
    { key: 'sad', label: 'Sad', pct: file.sad_percentage || 0, color: EMOTION_COLORS.sad.bg },
    { key: 'fear', label: 'Fear', pct: file.fear_percentage || 0, color: EMOTION_COLORS.fear.bg },
    { key: 'disgust', label: 'Disgust', pct: file.disgust_percentage || 0, color: EMOTION_COLORS.disgust.bg },
    { key: 'angry', label: 'Angry', pct: file.angry_percentage || 0, color: EMOTION_COLORS.angry.bg }
  ];

  // Dynamic AI observations
  const observations = [];
  if (file.dominant_emotion === 'happy') {
    observations.push('High positive emotional presence observed. Expressions reflect warmth, enthusiasm, and openness.');
  } else if (file.dominant_emotion === 'neutral') {
    observations.push('Maintained a balanced, composed, and objective facial baseline throughout the majority of the session.');
  } else if (file.dominant_emotion === 'sad' || file.dominant_emotion === 'fear') {
    observations.push('Subtle signs of tension or apprehension detected during segments of the analysis.');
  } else if (file.dominant_emotion === 'angry' || file.dominant_emotion === 'disgust') {
    observations.push('Elevated furrowed or skeptical facial expressions detected during specific evaluation intervals.');
  }

  if (file.stability_score >= 80) {
    observations.push(`Exceptional emotional stability (${file.stability_score}/100) — consistent and controlled facial engagement with minimal erratic shifts.`);
  } else if (file.stability_score >= 50) {
    observations.push(`Moderate emotional variability (${file.stability_score}/100) — natural conversational expressiveness with dynamic shifts.`);
  } else {
    observations.push(`High expression volatility (${file.stability_score}/100) — frequent rapid changes between emotional states.`);
  }

  observations.push(`Overall model confidence averaged ${file.average_confidence}% across ${file.total_detections || detections.length} sampled frames.`);

  return (
    <div
      ref={ref}
      style={{
        width: '800px',
        padding: '40px',
        backgroundColor: '#ffffff',
        color: '#111827',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#1e1b4b' }}>
              EmotionSense <span style={{ color: '#6366f1', fontSize: '18px', fontWeight: '600' }}>AI Evaluation Report</span>
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 20px', fontSize: '12px', color: '#6b7280' }}>
            CSE327 Automated Facial Expression Recognition & Behavioral Telemetry
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OFFICIAL AUDIT REPORT</div>
          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>Generated: {nowDhaka}</div>
        </div>
      </div>

      {/* Metadata Section */}
      <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px 20px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#6b7280', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Target Media</span>
            <strong style={{ color: '#111827', wordBreak: 'break-all' }}>{file.file_name}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Analyzed Timestamp</span>
            <span style={{ color: '#111827' }}>{formatFullDateTimeGMT6(file.upload_time)}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Format / Type</span>
            <span style={{ color: '#111827', textTransform: 'capitalize' }}>
              {file.file_type === 'live_session' || file.file_type === 'live_camera' ? 'Live Camera Feed' : file.file_type === 'coach_session' ? 'Interview Coach Rehearsal' : (file.file_type || 'Media File')}
            </span>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', border: `2px solid ${dominantColor}`, borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Dominant Emotion</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: dominantColor, marginTop: '4px' }}>
            {getEmotionEmoji(file.dominant_emotion)} {getEmotionLabel(file.dominant_emotion)}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Avg Confidence</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
            {file.average_confidence}%
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Stability Score</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            {file.stability_score}<span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 'normal' }}>/100</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Frames Evaluated</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#6366f1', marginTop: '4px' }}>
            {file.total_detections || detections.length}
          </div>
        </div>
      </div>

      {/* Emotion Breakdown Table */}
      <div style={{ marginBottom: '24px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
          Emotion Spectrum Distribution (%)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {emotionsList.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '100px', fontSize: '13px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{getEmotionEmoji(item.key)}</span>
                <span>{item.label}</span>
              </div>
              <div style={{ flex: 1, backgroundColor: '#f3f4f6', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(item.pct, 100)}%`,
                    backgroundColor: item.color,
                    height: '100%',
                    borderRadius: '7px'
                  }}
                />
              </div>
              <div style={{ width: '55px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                {item.pct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Observations & Summary Notes */}
      <div style={{ marginBottom: '24px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>🤖</span>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#4338ca' }}>
            AI Observations & Behavioral Analysis
          </h3>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#374151', fontSize: '13px', lineHeight: '1.5' }}>
          {observations.map((obs, idx) => (
            <li key={idx}><strong>Point {idx + 1}:</strong> {obs}</li>
          ))}
        </ul>
      </div>

      {/* Verification Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#9ca3af' }}>
        <div>EmotionSense Cognitive Intelligence Suite • Department of Computer Science & Engineering</div>
        <div>System Verified • Safe for Course Submission</div>
      </div>
    </div>
  );
});

export default AnalysisPdfReport;
