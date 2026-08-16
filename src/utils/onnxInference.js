import * as ort from 'onnxruntime-web';

// Configure ONNX Web to load WASM binaries locally
ort.env.wasm.wasmPaths = '/onnx/';
ort.env.wasm.numThreads = 1;

export const EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprised'];

let cachedSession = null;
let sessionLoadingPromise = null;

/**
 * Initializes and caches the ONNX Runtime Web session for the EfficientNet-B0 Emotion model.
 */
export async function getEmotionOnnxSession() {
  if (cachedSession) return cachedSession;
  if (sessionLoadingPromise) return sessionLoadingPromise;

  sessionLoadingPromise = (async () => {
    try {
      // NOTE: We are keeping '/models/mobilenetv2_emotion.onnx' in the folder as a backup, 
      // but actively loading the new EfficientNet model for inference.
      const session = await ort.InferenceSession.create('/models/efficientnet_b0_emotion.onnx', {
        executionProviders: ['wasm']
      });
      cachedSession = session;
      return session;
    } catch (err) {
      console.error('[ONNX Web] Failed to load efficientnet_b0_emotion.onnx:', err);
      sessionLoadingPromise = null;
      throw err;
    }
  })();

  return sessionLoadingPromise;
}

/**
 * Preprocesses an image, video frame, or canvas crop for EfficientNet ImageNet input.
 * Extracts RGB values, normalizes with ImageNet mean/std, and converts to CHW planar format.
 */
export function preprocessImageForOnnx(imageSource, sx, sy, sw, sh, targetSize = 224) {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (sx !== undefined && sy !== undefined && sw !== undefined && sh !== undefined) {
    ctx.drawImage(imageSource, sx, sy, sw, sh, 0, 0, targetSize, targetSize);
  } else {
    ctx.drawImage(imageSource, 0, 0, targetSize, targetSize);
  }

  const imgData = ctx.getImageData(0, 0, targetSize, targetSize).data;
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const numPixels = targetSize * targetSize;
  const float32Data = new Float32Array(3 * numPixels);

  for (let i = 0; i < numPixels; i++) {
    const rawR = imgData[i * 4];
    const rawG = imgData[i * 4 + 1];
    const rawB = imgData[i * 4 + 2];
    
    // CRITICAL FIX: FER-2013 is a grayscale dataset. The EfficientNet model was forced 
    // to accept 3 channels during training by duplicating the grayscale channel 3 times.
    // If we feed it full color from the webcam, the model gets confused by the color variations.
    // We must convert to grayscale first, then duplicate it across RGB.
    const gray = (0.299 * rawR + 0.587 * rawG + 0.114 * rawB) / 255.0;

    const r = (gray - mean[0]) / std[0];
    const g = (gray - mean[1]) / std[1];
    const b = (gray - mean[2]) / std[2];

    float32Data[i] = r;
    float32Data[numPixels + i] = g;
    float32Data[2 * numPixels + i] = b;
  }

  return new ort.Tensor('float32', float32Data, [1, 3, targetSize, targetSize]);
}

/**
 * Runs inference on a preprocessed ONNX Tensor and computes Softmax confidence scores.
 */
export async function predictEmotionFromTensor(tensor, session) {
  const sess = session || (await getEmotionOnnxSession());
  const feeds = {};
  feeds[sess.inputNames[0]] = tensor;

  const results = await sess.run(feeds);
  const output = results[sess.outputNames[0]];
  const logits = Array.from(output.data);

  // Softmax with numerical stability
  // Now that the grayscale bug is fixed, the model is naturally confident again.
  // We keep temperature at 1.0 (standard softmax) for realistic percentages.
  const TEMPERATURE = 1.0; 
  const maxLogit = Math.max(...logits);
  const expScores = logits.map((l) => Math.exp((l - maxLogit) / TEMPERATURE));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const probs = expScores.map((e) => e / sumExp);

  // Standard AffectNet/FER-2013 labels. (If model outputs 8, the 8th is contempt)
  const MODEL_LABELS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprised', 'neutral', 'contempt'];
  
  const allEmotionsRaw = probs.map((prob, idx) => ({
    emotion: MODEL_LABELS[idx] || 'neutral',
    confidence: prob
  }));

  // Map 'contempt' to 'neutral' as requested by the user, and ensure exact naming matches backend
  const emotionMap = {};
  EMOTIONS.forEach(e => emotionMap[e] = 0); // Initialize all 7 backend emotions to 0

  allEmotionsRaw.forEach(item => {
    let mappedName = item.emotion;
    if (mappedName === 'contempt') mappedName = 'neutral';
    if (mappedName === 'surprise') mappedName = 'surprised'; // just in case
    
    if (emotionMap.hasOwnProperty(mappedName)) {
      emotionMap[mappedName] += item.confidence;
    }
  });

  // --- Bias Correction Heuristic ---
  // FER models notoriously confuse neutral faces as sad. 
  // We apply a mathematical penalty to sad and boost to neutral to shift the decision boundary.
  emotionMap['sad'] *= 0.65;
  emotionMap['neutral'] *= 1.3;

  // Re-normalize probabilities so they sum to 1.0 again
  const totalConf = Object.values(emotionMap).reduce((acc, val) => acc + val, 0);
  Object.keys(emotionMap).forEach(key => {
    emotionMap[key] /= (totalConf || 1);
  });

  const allEmotions = Object.keys(emotionMap).map(emotion => ({
    emotion,
    confidence: Number(emotionMap[emotion].toFixed(4))
  }));

  allEmotions.sort((a, b) => b.confidence - a.confidence);

  return {
    dominantEmotion: allEmotions[0].emotion,
    confidence: allEmotions[0].confidence,
    allEmotions
  };
}

/**
 * Convenience helper to crop a face region from a video/image/canvas and classify its emotion.
 */
export async function classifyFaceCrop(imageSource, sx, sy, sw, sh) {
  const tensor = preprocessImageForOnnx(imageSource, sx, sy, sw, sh);
  return await predictEmotionFromTensor(tensor);
}
