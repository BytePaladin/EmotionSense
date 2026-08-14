import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, VideoFile, Image as ImageIcon, Close, Insights } from '@mui/icons-material';
import api from '../../api/axios';
import { useToast } from '../../hooks/useToast';
import { validateFile } from '../../utils/validators';
import { Box, Button, Typography, IconButton, LinearProgress, Card as MuiCard, Stack } from '@mui/material';

import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { getEmotionOnnxSession, classifyFaceCrop } from '../../utils/onnxInference';

export default function UploadArea() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const { isValid, errors } = validateFile(selectedFile);
    if (!isValid) {
      toast.error(errors[0]);
      return;
    }
    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true); else setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!file || !preview) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      // 1. Initialize MediaPipe & ONNX
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
      );
      const [detector] = await Promise.all([
        FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU"
          },
          runningMode: "IMAGE",
          minDetectionConfidence: 0.5
        }),
        getEmotionOnnxSession()
      ]);
      setProgress(50);

      // 2. Load preview into Image element for inference
      const img = new Image();
      img.src = preview;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const detections = [];
      const results = detector.detect(img);
      setProgress(75);

      if (results.detections && results.detections.length > 0) {
        for (let idx = 0; idx < results.detections.length; idx++) {
          const faceDet = results.detections[idx];
          const box = faceDet.boundingBox;

          const fx = Math.max(0, Math.floor(box.originX));
          const fy = Math.max(0, Math.floor(box.originY));
          const fw = Math.min(Math.floor(box.width), img.naturalWidth - fx);
          const fh = Math.min(Math.floor(box.height), img.naturalHeight - fy);

          // 25% context padding
          const padX = Math.floor(fw * 0.25);
          const padY = Math.floor(fh * 0.25);
          const fxP = Math.max(0, fx - padX);
          const fyP = Math.max(0, fy - padY);
          const fwP = Math.min(img.naturalWidth - fxP, fw + 2 * padX);
          const fhP = Math.min(img.naturalHeight - fyP, fh + 2 * padY);

          const emotionRes = await classifyFaceCrop(img, fxP, fyP, fwP, fhP);

          detections.push({
            timestamp: 0,
            emotion: emotionRes.dominantEmotion || 'neutral',
            confidence: emotionRes.confidence || 0.9,
            face_id: idx + 1,
            box_x: fx,
            box_y: fy,
            box_w: fw,
            box_h: fh
          });
        }
      } else {
        // Full image fallback
        const emotionRes = await classifyFaceCrop(img, 0, 0, img.naturalWidth, img.naturalHeight);
        detections.push({
          timestamp: 0,
          emotion: emotionRes.dominantEmotion || 'neutral',
          confidence: emotionRes.confidence || 0.9,
          face_id: 1,
          box_x: 0,
          box_y: 0,
          box_w: img.naturalWidth,
          box_h: img.naturalHeight
        });
      }

      detector.close();
      setProgress(90);

      // 3. Save result metadata to backend database
      const saveRes = await api.post('/upload-result', {
        file_metadata: { file_name: file.name, file_type: file.type, file_size: file.size },
        detections
      });

      setProgress(100);
      toast.success('Analysis complete!');
      setTimeout(() => navigate(`/analysis/${saveRes.data.data.file_id}`), 500);
    } catch (error) {
      console.error('Client-side upload analysis error:', error);
      setIsProcessing(false);
      setProgress(0);
      toast.error('Image analysis failed. Please try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {!file ? (
        <MuiCard 
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          sx={{ 
            border: '2px dashed', 
            borderColor: isDragging ? 'primary.main' : 'divider', 
            bgcolor: isDragging ? 'action.hover' : 'background.paper',
            transition: 'all 0.3s',
            p: 6,
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: 3,
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
          }}
          onClick={() => !isDragging && fileInputRef.current?.click()}
        >
          <Box sx={{ width: 80, height: 80, mx: 'auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, bgcolor: isDragging ? 'primary.light' : 'action.selected', transition: 'transform 0.3s', transform: isDragging ? 'scale(1.1)' : 'scale(1)' }}>
            <CloudUpload sx={{ fontSize: 40, color: isDragging ? 'primary.main' : 'text.secondary' }} />
          </Box>
          <Typography variant="h6" fontWeight="semibold" gutterBottom>Drag & Drop your media here</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>Support for JPG, PNG. Max file size is 20MB.</Typography>
          <input type="file" ref={fileInputRef} hidden accept="image/jpeg,image/png,image/jpg" onChange={e => handleFileSelect(e.target.files[0])} />
          <Button variant="contained" size="large" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Browse Files</Button>
        </MuiCard>
      ) : (
        <MuiCard sx={{ overflow: 'hidden', p: 0, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box sx={{ position: 'relative', p: 3 }}>
            <IconButton onClick={clearFile} disabled={isProcessing} sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' }, zIndex: 10 }}>
              <Close />
            </IconButton>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
              <Box sx={{ width: '100%', md: '50%', aspectRatio: '16/9', bgcolor: 'black', borderRadius: 2, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {file.type.startsWith('image/') ? (
                  <Box component="img" src={preview} alt="Preview" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Box component="video" src={preview} sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} controls={false} />
                )}
              </Box>
              <Box sx={{ width: '100%', md: '50%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                    {file.type.startsWith('image/') ? <ImageIcon color="primary" /> : <VideoFile color="secondary" />}
                    <Typography variant="h6" fontWeight="semibold" noWrap sx={{ pr: 4 }}>{file.name}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}</Typography>
                </Box>
                {isProcessing ? (
                  <Box sx={{ bgcolor: 'action.hover', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="body2" color="primary.main" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Insights sx={{ animation: 'pulse 2s infinite' }} /> AI Engine Running
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontFamily="monospace">{progress}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' } }} />
                  </Box>
                ) : (
                  <Button onClick={handleUpload} variant="contained" size="large" fullWidth endIcon={<Insights />}>
                    Start Analysis
                  </Button>
                )}
              </Box>
            </Stack>
          </Box>
        </MuiCard>
      )}
    </Box>
  );
}
