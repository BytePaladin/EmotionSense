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
  Stack,
  Tooltip
} from '@mui/material';
import {
  Videocam,
  Stop,
  PlayArrow,
  RecordVoiceOver as CoachIcon,
  AutoAwesome as SparkleIcon,
  TouchApp as TouchAppIcon,
  CheckCircle as CheckCircleIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import api from '../api/axios';
import CoachFeedbackOverlay from '../components/coach/CoachFeedbackOverlay';
import CoachScoreModal from '../components/coach/CoachScoreModal';
import { EMOTION_COLORS, getEmotionLabel, getEmotionEmoji } from '../utils/emotionColors';
import { getEmotionOnnxSession, classifyFaceCrop } from '../utils/onnxInference';

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
  const correctionsBufferRef = useRef([]);
  const smoothBoxesRef = useRef({});
  const trackedFacesRef = useRef([]);
  const nextFaceIdRef = useRef(1);
  const faceDetectorRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const latestEmotionsRef = useRef({});

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Real-time Live Emotion State
  const [currentLiveEmotion, setCurrentLiveEmotion] = useState(null);
  const [currentLiveConfidence, setCurrentLiveConfidence] = useState(null);
  const [lastOverriddenEmotion, setLastOverriddenEmotion] = useState(null);

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
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
        );
        const [detector] = await Promise.all([
          FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5
          }),
          getEmotionOnnxSession()
        ]);
        faceDetectorRef.current = detector;
        setIsModelsLoaded(true);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load AI models. Please ensure internet access.');
      }
    };
    loadModels();

    return () => {
      stopCamera();
      if (faceDetectorRef.current) {
        faceDetectorRef.current.close();
      }
    };
  }, []);

  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
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

  const isProcessingFrameRef = useRef(false);

  const startDetectionLoop = (video, canvas, startTime) => {
    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = displaySize.width;
    tempCanvas.height = displaySize.height;

    // Fast 60 FPS Render Loop (No API calls, just drawing)
    const drawLoop = () => {
      if (!video || video.paused || video.ended) {
        animationFrameIdRef.current = requestAnimationFrame(drawLoop);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (faceDetectorRef.current) {
        const startTimeMs = performance.now();
        const results = faceDetectorRef.current.detectForVideo(video, startTimeMs);
        
        if (results.detections && results.detections.length > 0) {
          const scaleX = displaySize.width / video.videoWidth;
          const scaleY = displaySize.height / video.videoHeight;
          
          results.detections.forEach(faceDet => {
            const box = faceDet.boundingBox;
            const fx = Math.max(0, Math.floor(box.originX * scaleX));
            const fy = Math.max(0, Math.floor(box.originY * scaleY));
            const fw = Math.min(Math.floor(box.width * scaleX), displaySize.width - fx);
            const fh = Math.min(Math.floor(box.height * scaleY), displaySize.height - fy);
            
            const padX = Math.floor(fw * 0.25);
            const padY = Math.floor(fh * 0.25);
            const fxP = Math.max(0, fx - padX);
            const fyP = Math.max(0, fy - padY);
            const fwP = Math.min(displaySize.width - fxP, fw + 2 * padX);
            const fhP = Math.min(displaySize.height - fyP, fh + 2 * padY);
            
            ctx.strokeStyle = '#00E676';
            ctx.lineWidth = 3;
            ctx.strokeRect(fx, fy, fw, fh);
            
            let bestMatch = null;
            let minDistance = Infinity;
            const cx = fxP + fwP / 2;
            const cy = fyP + fhP / 2;
            
            Object.keys(latestEmotionsRef.current).forEach(faceId => {
              const prevDet = latestEmotionsRef.current[faceId];
              if (!prevDet || !prevDet.box) return;
              const pCx = prevDet.box.x + prevDet.box.w / 2;
              const pCy = prevDet.box.y + prevDet.box.h / 2;
              const dist = Math.sqrt(Math.pow(cx - pCx, 2) + Math.pow(cy - pCy, 2));
              if (dist < minDistance && dist < displaySize.width / 2) {
                minDistance = dist;
                bestMatch = prevDet;
              }
            });
            
            if (bestMatch) {
              ctx.fillStyle = '#00E676';
              ctx.font = 'bold 16px Roboto, sans-serif';
              const label = `${bestMatch.emotion.toUpperCase()} (${Math.round((bestMatch.confidence || 0.9) * 100)}%)`;
              ctx.fillText(label, fx, Math.max(fy - 10, 20));
            }
          });
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(drawLoop);
    };
    
    // Start continuous fast rendering loop
    drawLoop();

    // Client-Side ML Inference Loop: 1 detection per second (1000ms) with zero server overhead
    detectionIntervalRef.current = setInterval(async () => {
      if (!video || video.paused || video.ended || isProcessingFrameRef.current) return;
      isProcessingFrameRef.current = true;

      try {
        if (!faceDetectorRef.current) {
          isProcessingFrameRef.current = false;
          return;
        }

        const startTimeMs = performance.now();
        const results = faceDetectorRef.current.detectForVideo(video, startTimeMs);

        if (results.detections && results.detections.length > 0) {
          const detections = [];
          const timestamp = Number(((Date.now() - startTime) / 1000.0).toFixed(2));
          const faceBoxes = [];

          const scaleX = displaySize.width / video.videoWidth;
          const scaleY = displaySize.height / video.videoHeight;

          for (let idx = 0; idx < results.detections.length; idx++) {
            const faceDet = results.detections[idx];
            const box = faceDet.boundingBox;
            
            const fx = Math.max(0, Math.floor(box.originX * scaleX));
            const fy = Math.max(0, Math.floor(box.originY * scaleY));
            const fw = Math.min(Math.floor(box.width * scaleX), displaySize.width - fx);
            const fh = Math.min(Math.floor(box.height * scaleY), displaySize.height - fy);

            // Context expansion margin (25% padding)
            const padX = Math.floor(fw * 0.25);
            const padY = Math.floor(fh * 0.25);
            const fxP = Math.max(0, fx - padX);
            const fyP = Math.max(0, fy - padY);
            const fwP = Math.min(displaySize.width - fxP, fw + 2 * padX);
            const fhP = Math.min(displaySize.height - fyP, fh + 2 * padY);

            if (fwP > 10 && fhP > 10) {
              faceBoxes.push({
                x: fx,
                y: fy,
                w: fw,
                h: fh,
                cropX: fxP,
                cropY: fyP,
                cropW: fwP,
                cropH: fhP
              });
            }
          }

          if (faceBoxes.length > 0) {
            const currentTrackedFaces = [];
            
            faceBoxes.forEach((box, i) => {
              const cx = box.x + box.w / 2;
              const cy = box.y + box.h / 2;
              
              let matchedId = null;
              let minDistance = Infinity;
              let matchedTrackIdx = -1;
              
              trackedFacesRef.current.forEach((tracked, tIdx) => {
                const dist = Math.sqrt(Math.pow(cx - tracked.cx, 2) + Math.pow(cy - tracked.cy, 2));
                if (dist < minDistance && dist < displaySize.width / 2) {
                  minDistance = dist;
                  matchedId = tracked.id;
                  matchedTrackIdx = tIdx;
                }
              });
              
              if (matchedId !== null) {
                trackedFacesRef.current.splice(matchedTrackIdx, 1);
                currentTrackedFaces.push({ id: matchedId, cx, cy });
                faceBoxes[i].face_id = matchedId;
              } else {
                const newId = nextFaceIdRef.current++;
                currentTrackedFaces.push({ id: newId, cx, cy });
                faceBoxes[i].face_id = newId;
              }
            });
            
            trackedFacesRef.current = currentTrackedFaces;

            // Run Client-Side ONNX inference for each detected face crop
            for (let i = 0; i < faceBoxes.length; i++) {
              const b = faceBoxes[i];
              try {
                const emotionRes = await classifyFaceCrop(video, b.cropX, b.cropY, b.cropW, b.cropH);
                const newDet = {
                  timestamp,
                  emotion: emotionRes.dominantEmotion || 'neutral',
                  confidence: emotionRes.confidence || 0.9,
                  face_id: b.face_id,
                  box: { x: b.x, y: b.y, w: b.w, h: b.h }
                };
                detections.push(newDet);
                latestEmotionsRef.current[b.face_id] = newDet;
              } catch (onnxErr) {
                console.error('[Client-Side ONNX Inference Error]:', onnxErr);
              }
            }
          }

          if (detections.length > 0) {
            const topDet = detections[0];
            setCurrentLiveEmotion(topDet.emotion);
            setCurrentLiveConfidence(topDet.confidence);

            if (detectionsRef.current.length < 500 * detections.length) {
              detections.forEach(det => {
                detectionsRef.current.push({
                  timestamp,
                  emotion: det.emotion,
                  confidence: det.confidence,
                  face_id: det.face_id,
                  box_x: det.box.x,
                  box_y: det.box.y,
                  box_w: det.box.w,
                  box_h: det.box.h
                });
              });
              setDetectionCount(detectionsRef.current.length);
              if (isCoachMode && Math.floor(detectionsRef.current.length / detections.length) % 3 === 0) {
                const primaryDetections = detectionsRef.current.filter(d => (d.face_id || 1) === 1);
                evaluateCoachFeedback(primaryDetections);
              }
            }
          }
        } else {
          // Full frame client-side fallback
          try {
            const emotionRes = await classifyFaceCrop(video, 0, 0, displaySize.width, displaySize.height);
            setCurrentLiveEmotion(emotionRes.dominantEmotion || 'neutral');
            setCurrentLiveConfidence(emotionRes.confidence || 0.9);
          } catch (e) {
            console.error('[Client-Side Fallback Error]:', e);
          }
        }
      } catch (err) {
        console.error('Detection loop iteration error:', err);
      } finally {
        isProcessingFrameRef.current = false;
      }
    }, 1000);
  };
  const handleOverrideEmotion = (targetEmotion) => {
    if (!isSessionActive) return;

    const predicted = currentLiveEmotion || 'neutral';
    const currentTime = detectionsRef.current.length > 0
      ? detectionsRef.current[detectionsRef.current.length - 1].timestamp
      : 0;

    // 1. Buffer for backend model feedback sync
    correctionsBufferRef.current.push({
      timestamp: currentTime,
      predicted_emotion: predicted,
      corrected_emotion: targetEmotion
    });

    // 2. Overwrite latest detections in memory
    const overrideEntry = {
      timestamp: currentTime,
      emotion: targetEmotion,
      confidence: 1.0
    };

    if (detectionsRef.current.length > 0) {
      detectionsRef.current[detectionsRef.current.length - 1] = overrideEntry;
      if (detectionsRef.current.length > 1) {
        detectionsRef.current[detectionsRef.current.length - 2].emotion = targetEmotion;
      }
    } else {
      detectionsRef.current.push(overrideEntry);
    }

    // 3. Update live state
    setCurrentLiveEmotion(targetEmotion);
    setCurrentLiveConfidence(1.0);
    setLastOverriddenEmotion(targetEmotion);

    // 4. Adapt Coach Mode HUD immediately if active
    if (isCoachMode && detectionsRef.current.length > 0) {
      evaluateCoachFeedback(detectionsRef.current);
    }

    // 5. User feedback notification
    const cfg = EMOTION_COLORS[targetEmotion];
    toast.success(`Corrected to ${cfg?.emoji || ''} ${cfg?.label || targetEmotion} (Ground Truth recorded)`);
  };

  const handleStartSession = async () => {
    setError('');
    detectionsRef.current = [];
    correctionsBufferRef.current = [];
    setDetectionCount(0);
    setCurrentLiveEmotion(null);
    setCurrentLiveConfidence(null);
    setLastOverriddenEmotion(null);

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
      const primaryDetections = capturedDetections.filter(d => (d.face_id || 1) === 1);
      const total = primaryDetections.length > 0 ? primaryDetections.length : 1;
      const happy = primaryDetections.filter((d) => d.emotion === 'happy').length;
      const neutral = primaryDetections.filter((d) => d.emotion === 'neutral').length;
      const tension = primaryDetections.filter((d) => ['angry', 'fear', 'disgust', 'sad'].includes(d.emotion)).length;
      const avgConf = Math.round((primaryDetections.reduce((s, d) => s + d.confidence, 0) / total) * 100);

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

      // Background sync all buffered live corrections to /api/v1/feedback
      if (newFileId && correctionsBufferRef.current.length > 0) {
        const buffered = [...correctionsBufferRef.current];
        Promise.allSettled(
          buffered.map((c) =>
            api.post('/feedback', {
              file_id: newFileId,
              frame_timestamp: c.timestamp,
              predicted_emotion: c.predicted_emotion,
              corrected_emotion: c.corrected_emotion,
              comments: 'Live camera session quick-correction'
            })
          )
        ).catch((e) => console.warn('Background feedback sync warning:', e));
      }

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
                mb: 2
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
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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

            {/* LIVE REAL-TIME EMOTION QUICK-CORRECTION DOCKED BAR */}
            {isSessionActive && (
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 640,
                  mb: 3,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(99, 102, 241, 0.04)',
                  border: '1px solid',
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Live AI Classification:
                    </Typography>
                    {currentLiveEmotion ? (
                      <Chip
                        icon={<span>{getEmotionEmoji(currentLiveEmotion)}</span>}
                        label={`${getEmotionLabel(currentLiveEmotion)} (${Math.round((currentLiveConfidence || 0) * 100)}%)`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: EMOTION_COLORS[currentLiveEmotion]?.light || 'action.selected',
                          color: EMOTION_COLORS[currentLiveEmotion]?.bg || 'text.primary',
                          border: `1px solid ${EMOTION_COLORS[currentLiveEmotion]?.bg || 'divider'}`
                        }}
                      />
                    ) : (
                      <Chip label="Tracking face..." size="small" variant="outlined" />
                    )}
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'primary.main',
                      fontWeight: 700
                    }}
                  >
                    <TouchAppIcon sx={{ fontSize: 15 }} />
                    Wrong emotion? Tap your actual feeling below:
                  </Typography>
                </Box>

                {/* 7 Emotion Correction Chips */}
                <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
                  {Object.keys(EMOTION_COLORS).map((emoKey) => {
                    const colorCfg = EMOTION_COLORS[emoKey];
                    const isCurrentAI = currentLiveEmotion === emoKey;
                    const isJustOverridden = lastOverriddenEmotion === emoKey;

                    return (
                      <Tooltip key={emoKey} title={`Override current detection to ${colorCfg.label}`}>
                        <Chip
                          clickable
                          onClick={() => handleOverrideEmotion(emoKey)}
                          icon={<span>{colorCfg.emoji}</span>}
                          label={colorCfg.label}
                          variant={isCurrentAI || isJustOverridden ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: isCurrentAI || isJustOverridden ? 700 : 500,
                            fontSize: '0.8125rem',
                            py: 1.8,
                            px: 0.8,
                            borderRadius: 2,
                            borderColor: isCurrentAI ? colorCfg.bg : 'divider',
                            bgcolor: isCurrentAI
                              ? `${colorCfg.bg}25`
                              : isJustOverridden
                              ? colorCfg.bg
                              : 'transparent',
                            color: isJustOverridden ? '#ffffff' : isCurrentAI ? colorCfg.bg : 'text.primary',
                            borderWidth: isCurrentAI ? '2px' : '1px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              bgcolor: `${colorCfg.bg}30`,
                              borderColor: colorCfg.bg,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px ${colorCfg.bg}30`
                            }
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Stack>
              </Box>
            )}

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
