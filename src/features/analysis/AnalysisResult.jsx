import { useState, useRef } from 'react';
import { ShowChart, AccessTime, Verified, Bolt, PictureAsPdf as PdfIcon, Flag as FlagIcon } from '@mui/icons-material';
import EmotionPieChart from '../../components/charts/EmotionPieChart';
import EmotionTimeline from '../../components/charts/EmotionTimeline';
import ConfidenceTrend from '../../components/charts/ConfidenceTrend';
import { getEmotionLabel, getEmotionColor, getEmotionEmoji } from '../../utils/emotionColors';
import { formatFullDateTimeGMT6 } from '../../utils/dateUtils';
import { Box, Card as MuiCard, Typography, Grid, Stack, Divider, LinearProgress, Button, CircularProgress } from '@mui/material';
import AnalysisPdfReport, { exportAnalysisToPdf } from '../../components/reports/AnalysisPdfReport';
import FeedbackModal from '../../components/feedback/FeedbackModal';
import toast from 'react-hot-toast';

export default function AnalysisResult({ data }) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const pdfReportRef = useRef(null);

  if (!data) return null;
  const { file, detections } = data;
  const dominantColor = getEmotionColor(file.dominant_emotion);

  const handleExportPdf = async () => {
    if (!pdfReportRef.current) return;
    setExportingPdf(true);
    const toastId = toast.loading('Generating executive PDF report...');
    try {
      const fileName = `EmotionSense_${file.file_name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`;
      const success = await exportAnalysisToPdf(pdfReportRef.current, fileName);
      if (success) {
        toast.success('PDF report exported successfully!', { id: toastId });
      } else {
        toast.error('Failed to generate PDF report', { id: toastId });
      }
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Error generating PDF report', { id: toastId });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Off-screen Printable Template for High-DPI Capture */}
      <Box sx={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -100 }}>
        <AnalysisPdfReport ref={pdfReportRef} data={data} />
      </Box>

      {/* Misclassification Feedback Dialog */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        fileId={file.id}
        initialPredicted={file.dominant_emotion || 'neutral'}
      />

      <MuiCard sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: { xs: 'stretch', md: 'center' }, p: 3, borderLeft: '4px solid', borderLeftColor: dominantColor, borderRadius: 3 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 4, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dominantColor, animation: 'pulse 2s infinite' }} />
              <Typography variant="caption" fontWeight="medium" color="text.secondary">Analysis Complete</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                startIcon={<FlagIcon />}
                onClick={() => setFeedbackOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8125rem' }}
              >
                Flag Misclassification
              </Button>
              <Button
                variant="contained"
                size="small"
                disabled={exportingPdf}
                startIcon={exportingPdf ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
                onClick={handleExportPdf}
                sx={{
                  bgcolor: '#6366f1',
                  '&:hover': { bgcolor: '#4f46e5' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 'bold'
                }}
              >
                {exportingPdf ? 'Exporting...' : 'Export PDF'}
              </Button>
            </Stack>
          </Stack>
          
          <Typography variant="h4" fontWeight="bold">{file.file_name}</Typography>
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center" color="text.secondary">
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AccessTime fontSize="small"/> {formatFullDateTimeGMT6(file.upload_time)}</Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ShowChart fontSize="small"/> {file.total_detections} frames analyzed</Typography>
          </Stack>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'auto' }, display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 }, bgcolor: 'action.hover', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" mb={0.5}>Dominant</Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: dominantColor }}>
              {getEmotionEmoji(file.dominant_emotion)} {getEmotionLabel(file.dominant_emotion)}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ height: 48, alignSelf: 'center' }} />
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" mb={0.5}>Confidence</Typography>
            <Typography variant="h5" fontWeight="bold" color="info.main">{file.average_confidence}%</Typography>
          </Box>
        </Box>
      </MuiCard>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <MuiCard sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={3}>
              <Typography variant="h6" fontWeight="semibold">Distribution</Typography>
            </Stack>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmotionPieChart stats={file} /></Box>
          </MuiCard>
        </Grid>
        
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <MuiCard sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={3}>
                <Typography variant="h6" fontWeight="semibold">Emotion Timeline</Typography>
              </Stack>
              <EmotionTimeline detections={detections} />
            </MuiCard>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <MuiCard sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)' }}>
                  <Stack direction="row" alignItems="center" gap={2} sx={{ width: '100%' }}>
                    <Box sx={{ width: 48, height: 48, flexShrink: 0, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
                      <Verified fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">Stability Score</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                        <Typography variant="h4" fontWeight="bold">{file.stability_score}</Typography>
                        <Typography variant="body2" color="text.disabled">/ 100</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Measures emotion consistency over time.</Typography>
                    </Box>
                  </Stack>
                </MuiCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <MuiCard sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)' }}>
                  <Stack direction="row" alignItems="center" gap={2} sx={{ width: '100%' }}>
                    <Box sx={{ width: 48, height: 48, flexShrink: 0, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
                      <Bolt fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Processing Status</Typography>
                        <Typography variant="body2" color="primary.main" fontWeight="semibold">Complete</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 4 }} />
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>Analyzed {file.file_size > 1048576 ? (file.file_size/1048576).toFixed(1) + ' MB' : (file.file_size/1024).toFixed(0) + ' KB'} in {(detections.length * 0.15).toFixed(1)}s</Typography>
                    </Box>
                  </Stack>
                </MuiCard>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
      
      <MuiCard sx={{ p: 3, borderRadius: 3 }}>
         <Stack direction="row" alignItems="center" gap={1} mb={3}>
           <Typography variant="h6" fontWeight="semibold">Confidence Trend</Typography>
         </Stack>
         <ConfidenceTrend detections={detections} />
      </MuiCard>
    </Box>
  );
}
