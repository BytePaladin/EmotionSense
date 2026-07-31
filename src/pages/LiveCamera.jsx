import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { Videocam, Stop, PlayArrow } from '@mui/icons-material';
import * as faceapi from '@vladmandic/face-api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../api/axios';

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
        console.error("Error loading models:", err);
        setError("Failed to load AI models. Please ensure model files are accessible in /models.");
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
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startDetectionLoop = (video, canvas, startTime) => {
    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    detectionIntervalRef.current = setInterval(async () => {
      if (!video || video.paused || video.ended) return;
      
      try {
        const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 })).withFaceExpressions();
        
        if (result && result.expressions) {
          const resizedResult = faceapi.resizeResults(result, displaySize);
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedResult);
          
          const expressions = result.expressions;
          const rawDominant = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
          const mappedEmotion = EMOTION_MAP[rawDominant] || 'neutral';
          
          const timestamp = Number(((Date.now() - startTime) / 1000.0).toFixed(2));
          const confidence = Number(expressions[rawDominant].toFixed(2));
          
          const newDetection = { timestamp, emotion: mappedEmotion, confidence };
          if (detectionsRef.current.length < 500) {
            detectionsRef.current.push(newDetection);
            setDetectionCount(detectionsRef.current.length);
          }
          
          const label = `${mappedEmotion} (${Math.round(confidence * 100)}%)`;
          const drawBox = new faceapi.draw.DrawBox(resizedResult.detection.box, { label });
          drawBox.draw(canvas);
        } else {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.error("Detection iteration error:", err);
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
          videoRef.current.play().then(() => {
            const startTime = Date.now();
            setIsSessionActive(true);
            if (canvasRef.current) {
              startDetectionLoop(videoRef.current, canvasRef.current, startTime);
            }
          }).catch(err => {
            console.error("Video play error:", err);
            setError("Failed to start video playback.");
          });
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check browser permissions.");
    }
  };

  const handleStopSession = async () => {
    stopCamera();
    setIsSessionActive(false);
    
    const capturedDetections = [...detectionsRef.current];
    
    if (capturedDetections.length === 0) {
      toast.info("No face detected during the session. Nothing to save.");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        file_metadata: {
          file_name: `Live Session - ${new Date().toLocaleString()}`,
          file_type: "live_session",
          file_size: 0
        },
        detections: capturedDetections
      };
      
      const response = await api.post('/upload-result', payload);
      
      toast.success("Live session saved successfully!");
      if (response.data?.data?.file_id) {
        navigate(`/analysis/${response.data.data.file_id}`);
      } else {
        navigate('/history');
      }
    } catch (err) {
      console.error("Failed to save session:", err);
      const detailMsg = err.response?.data?.detail || err.message || "Failed to save session data.";
      toast.error(typeof detailMsg === 'string' ? detailMsg : "Failed to save session data.");
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeIn 0.5s ease-in-out' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">Live Camera</Typography>
          <Typography variant="body2" color="text.secondary">Real-time emotional analysis from your webcam.</Typography>
        </Box>
        {isSessionActive && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
              🔴 LIVE
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detections: {detectionCount}
            </Typography>
          </Box>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 4 }}>
        {!isModelsLoaded ? (
          <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Loading AI Models...</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 640, minHeight: 480, bgcolor: 'black', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
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
              {!isSessionActive && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.5)' }}>
                  <Videocam sx={{ fontSize: 64, color: 'white', opacity: 0.5 }} />
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isSessionActive ? (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleStartSession}
                  disabled={isSaving}
                >
                  Start Live Session
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={isSaving ? <CircularProgress size={24} color="inherit" /> : <Stop />}
                  onClick={handleStopSession}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving Session..." : "Stop & Save Session"}
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

