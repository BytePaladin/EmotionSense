import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { Videocam, Stop, Save, PlayArrow } from '@mui/icons-material';
import * as faceapi from '@vladmandic/face-api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../api/axios';

export default function LiveCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [detections, setDetections] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  
  const detectionIntervalRef = useRef(null);

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
        setError("Failed to load AI models. Please ensure they exist in public/models.");
      }
    };
    loadModels();
    
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const handleStartSession = async () => {
    await startCamera();
    setDetections([]);
    setStartTime(Date.now());
    setIsSessionActive(true);
  };

  const handleVideoPlay = () => {
    if (!isSessionActive || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    detectionIntervalRef.current = setInterval(async () => {
      if (!video || video.paused || video.ended) return;
      
      const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
      
      if (result) {
        // Draw bounding box
        const resizedResult = faceapi.resizeResults(result, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedResult);
        
        // Find dominant emotion
        const expressions = result.expressions;
        const dominant = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
        
        const timestamp = (Date.now() - startTime) / 1000.0;
        
        setDetections(prev => [...prev, {
          timestamp: Number(timestamp.toFixed(2)),
          emotion: dominant,
          confidence: Number(expressions[dominant].toFixed(2))
        }]);
        
        // Draw label
        const drawBox = new faceapi.draw.DrawBox(resizedResult.detection.box, { label: `${dominant} (${Math.round(expressions[dominant]*100)}%)` });
        drawBox.draw(canvas);
      } else {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 500); // 2 FPS for storing to DB, can be lower/higher depending on needs
  };

  const handleStopSession = async () => {
    stopCamera();
    setIsSessionActive(false);
    
    if (detections.length === 0) {
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
        detections: detections
      };
      
      const response = await api.post('/upload-result', payload);
      
      toast.success("Live session saved successfully!");
      navigate(`/analysis/${response.data.data.file_id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save session data.");
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
              Detections: {detections.length}
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
                autoPlay
                muted
                onPlay={handleVideoPlay}
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
