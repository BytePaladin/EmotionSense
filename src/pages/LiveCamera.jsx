import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Chip,
  Stack
} from '@mui/material';
import {
  Videocam,
  Stop,
  PlayArrow,
  RecordVoiceOver as CoachIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';
import * as faceapi from '@vladmandic/face-api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import api from '../api/axios';
import CoachFeedbackOverlay from '../components/coach/CoachFeedbackOverlay';
import CoachScoreModal from '../components/coach/CoachScoreModal';

const EMOTION_MAP = {
  neutral: 'neutral',
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  fearful: 'fear',
  disgusted: 'disgust',
  surprised: 'surprised'
};

export default function LiveCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const detectionsRef = useRef([]);

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Coach Mode State
  const [isCoachMode, setIsCoachMode] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState({
    type: 'calm',
    message: 'Maintain steady eye contact and open facial expression.'
  });
  const [coachMetrics, setCoachMetrics] = useState({
    composureScore: 92,
    warmthScore: 85,
    confidenceScore: 88
  });
  const [coachScoreModalOpen, setCoachScoreModalOpen] = useState(false);
  const [completedCoachData, setCompletedCoachData] = useState(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        setIsModelsLoaded(true);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load AI models. Please ensure model files are accessible in /models.');
      }
    };
    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const evaluateCoachFeedback = (detections) => {
    if (detections.length === 0) return;
    const window = detections.slice(-6);
    const dominantInWindow = window.map((d) => d.emotion);

    const happyCount = dominantInWindow.filter((e) => e === 'happy').length;
    const tensionCount = dominantInWindow.filter((e) => ['angry', 'fear', 'disgust', 'sad'].includes(e)).length;
    const neutralCount = dominantInWindow.filter((e) => e === 'neutral').length;

    const avgConf = Math.round(
      (window.reduce((sum, d) => sum + d.confidence, 0) / window.length) * 100
    );

    let comp = Math.max(50, 100 - tensionCount * 12);
    let warmth = Math.min(100, 50 + happyCount * 15 + neutralCount * 5);

    setCoachMetrics({
      composureScore: comp,
      warmthScore: warmth,
      confidenceScore: avgConf || 88
    });

    if (tensionCount >= 2) {
      setCoachFeedback({
        type: 'tension',
        message: 'Facial tension detected — relax your brow, unclench your jaw, and breathe.'
      });
    } else if (happyCount >= 2) {
      setCoachFeedback({
        type: 'smile',
        message: 'Warm, positive expression! Perfect for establishing rapport.'
      });
    } else if (neutralCount >= 3) {
      setCoachFeedback({
        type: 'calm',
        message: 'Poised and attentive. Try adding a slight friendly smile when greeting.'
      });
    } else {
      setCoachFeedback({
        type: 'focus',
        message: 'Good eye alignment. Maintain a confident, open posture.'
      });
    }
  };

  const startDetectionLoop = (video, canvas, startTime) => {
    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    detectionIntervalRef.current = setInterval(async () => {
      if (!video || video.paused || video.ended) return;

      try {
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
          .withFaceExpressions();

        if (result && result.expressions) {
          const resizedResult = faceapi.resizeResults(result, displaySize);
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedResult);

          const expressions = result.expressions;
          const rawDominant = Object.keys(expressions).reduce((a, b) =>
            expressions[a] > expressions[b] ? a : b
          );
          const mappedEmotion = EMOTION_MAP[rawDominant] || 'neutral';

          const timestamp = Number(((Date.now() - startTime) / 1000.0).toFixed(2));
          const confidence = Number(expressions[rawDominant].toFixed(2));

          const newDetection = { timestamp, emotion: mappedEmotion, confidence };
          if (detectionsRef.current.length < 500) {
            detectionsRef.current.push(newDetection);
            setDetectionCount(detectionsRef.current.length);
            if (isCoachMode && detectionsRef.current.length % 3 === 0) {
              evaluateCoachFeedback(detectionsRef.current);
            }
          }

          const label = `${mappedEmotion} (${Math.round(confidence * 100)}%)`;
          const drawBox = new faceapi.draw.DrawBox(resizedResult.detection.box, { label });
          drawBox.draw(canvas);
        } else {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.error('Detection iteration error:', err);
      }
    }, 500);
  };

  const handleStartSession = async () => {
    setError('');
    detectionsRef.current = [];
    setDetectionCount(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => {
              const startTime = Date.now();
              setIsSessionActive(true);
              if (canvasRef.current) {
                startDetectionLoop(videoRef.current, canvasRef.current, startTime);
              }
            })
            .catch((err) => {
              console.error('Video play error:', err);
              setError('Failed to start video playback.');
            });
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check browser permissions.');
    }
  };

  const handleStopSession = async () => {
    stopCamera();
    setIsSessionActive(false);

    const capturedDetections = [...detectionsRef.current];

    if (capturedDetections.length === 0) {
      toast.info('No face detected during the session. Nothing to save.');
      return;
    }

    setIsSaving(true);

    // Compute Coach Metrics if in Coach Mode
    let coachDataToSave = null;
    if (isCoachMode) {
      const total = capturedDetections.length;
      const happy = capturedDetections.filter((d) => d.emotion === 'happy').length;
      const neutral = capturedDetections.filter((d) => d.emotion === 'neutral').length;
      const tension = capturedDetections.filter((d) => ['angry', 'fear', 'disgust', 'sad'].includes(d.emotion)).length;
      const avgConf = Math.round((capturedDetections.reduce((s, d) => s + d.confidence, 0) / total) * 100);

      const compScore = Math.max(55, Math.min(100, Math.round(100 - (tension / total) * 120)));
      const warmScore = Math.max(50, Math.min(100, Math.round((happy / total) * 100 * 2.5 + (neutral / total) * 50)));
      const readiness = Math.round(compScore * 0.4 + warmScore * 0.35 + avgConf * 0.25);

      const strengths = [];
      const improvements = [];

      if (compScore >= 80) strengths.push('Maintained strong facial composure and minimal erratic fluctuations.');
      if (warmScore >= 75) strengths.push('Exhibited welcoming facial warmth that builds rapid rapport.');
      if (avgConf >= 85) strengths.push('Consistently framed with clear facial presence.');

      if (tension > total * 0.2) improvements.push('Occasional brow tension detected — practice conscious facial relaxation.');
      if (happy < total * 0.1) improvements.push('Incorporate natural conversational smiles during key introductory points.');
      if (improvements.length === 0) improvements.push('Maintain this high standard of communicative poise!');

      coachDataToSave = {
        readinessScore: readiness,
        composureScore: compScore,
        warmthScore: warmScore,
        confidenceScore: avgConf,
        strengths,
        improvements
      };
      setCompletedCoachData(coachDataToSave);
    }

    try {
      const payload = {
        file_metadata: {
          file_name: isCoachMode
            ? `Interview Coach Rehearsal - ${new Date().toLocaleString()}`
            : `Live Session - ${new Date().toLocaleString()}`,
          file_type: isCoachMode ? 'coach_session' : 'live_session',
          file_size: 0
        },
        detections: capturedDetections
      };

      const response = await api.post('/upload-result', payload);
      const newFileId = response.data?.data?.file_id;
      setSavedAnalysisId(newFileId);

      toast.success(isCoachMode ? 'Coach rehearsal debrief ready!' : 'Live session saved successfully!');

      if (isCoachMode) {
        setCoachScoreModalOpen(true);
      } else if (newFileId) {
        navigate(`/analysis/${newFileId}`);
      } else {
        navigate('/history');
      }
    } catch (err) {
      console.error('Failed to save session:', err);
      const detailMsg = err.response?.data?.detail || err.message || 'Failed to save session data.';
      toast.error(typeof detailMsg === 'string' ? detailMsg : 'Failed to save session data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeIn 0.5s ease-in-out' }}>
      {/* Post-Session Interview Readiness Modal */}
      <CoachScoreModal
        open={coachScoreModalOpen}
        onClose={() => {
          setCoachScoreModalOpen(false);
          if (savedAnalysisId) navigate(`/analysis/${savedAnalysisId}`);
        }}
        coachData={completedCoachData}
        analysisId={savedAnalysisId}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
              Live Camera
            </Typography>
            {isCoachMode && (
              <Chip
                icon={<SparkleIcon sx={{ fontSize: 14 }} />}
                label="Coach Mode Active"
                size="small"
                sx={{
                  bgcolor: '#6366f1',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {isCoachMode
              ? 'Real-time AI behavioral telemetry & interview composure coaching.'
              : 'Real-time emotional analysis from your webcam.'}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Coach Mode Switch */}
          <FormControlLabel
            control={
              <Switch
                checked={isCoachMode}
                onChange={(e) => setIsCoachMode(e.target.checked)}
                color="primary"
                disabled={isSessionActive}
              />
            }
            label={
              <Typography variant="body2" fontWeight="semibold" color={isCoachMode ? 'primary.main' : 'text.secondary'}>
                🎙️ Interview Coach Mode
              </Typography>
            }
            sx={{ m: 0 }}
          />

          {isSessionActive && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                🔴 LIVE
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detections: {detectionCount}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: isCoachMode ? '2px solid' : '1px solid',
          borderColor: isCoachMode ? '#6366f1' : 'divider',
          transition: 'all 0.3s ease'
        }}
      >
        {!isModelsLoaded ? (
          <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Loading AI Models...</Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 640,
                aspectRatio: { xs: '4/3', md: '4/3' },
                minHeight: { xs: 240, sm: 360, md: 480 },
                bgcolor: 'black',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 3
              }}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />

              {/* Coach Mode HUD Feedback Overlay */}
              <CoachFeedbackOverlay
                feedback={coachFeedback}
                metrics={coachMetrics}
                isVisible={isSessionActive && isCoachMode}
              />

              {!isSessionActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    gap: 1.5
                  }}
                >
                  <Videocam sx={{ fontSize: 64, color: 'white', opacity: 0.5 }} />
                  {isCoachMode && (
                    <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9, textAlign: 'center', px: 2 }}>
                      Ready for Interview Practice. Click "Start Coach Rehearsal" below.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isSessionActive ? (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={isCoachMode ? <CoachIcon /> : <PlayArrow />}
                  onClick={handleStartSession}
                  disabled={isSaving}
                  sx={{
                    bgcolor: isCoachMode ? '#6366f1' : undefined,
                    '&:hover': isCoachMode ? { bgcolor: '#4f46e5' } : undefined,
                    px: 3,
                    py: 1.2,
                    borderRadius: 2.5,
                    fontWeight: 'bold'
                  }}
                >
                  {isCoachMode ? 'Start Coach Rehearsal' : 'Start Live Session'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={isSaving ? <CircularProgress size={24} color="inherit" /> : <Stop />}
                  onClick={handleStopSession}
                  disabled={isSaving}
                  sx={{ px: 3, py: 1.2, borderRadius: 2.5, fontWeight: 'bold' }}
                >
                  {isSaving ? 'Saving Session...' : isCoachMode ? 'Stop & Review Readiness' : 'Stop & Save Session'}
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
