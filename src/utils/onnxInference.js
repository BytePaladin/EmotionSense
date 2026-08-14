import * as ort from 'onnxruntime-web';

// Configure ONNX Web to load WASM binaries locally
ort.env.wasm.wasmPaths = '/onnx/';
ort.env.wasm.numThreads = 1;

export const EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprised', 'neutral'];

let cachedSession = null;
let sessionLoadingPromise = null;

/**
 * Initializes and caches the ONNX Runtime Web session for the 9MB MobileNetV2 Emotion model.
 */
export async function getEmotionOnnxSession() {
  if (cachedSession) return cachedSession;
  if (sessionLoadingPromise) return sessionLoadingPromise;

  sessionLoadingPromise = (async () => {
    try {
      const session = await ort.InferenceSession.create('/models/mobilenetv2_emotion.onnx', {
        executionProviders: ['wasm']
      });
      cachedSession = session;
      return session;
    } catch (err) {
      console.error('[ONNX Web] Failed to load mobilenetv2_emotion.onnx:', err);
      sessionLoadingPromise = null;
      throw err;
    }
  })();

  return sessionLoadingPromise;
}

/**
 * Preprocesses an image, video frame, or canvas crop for MobileNetV2 ImageNet input.
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
    const r = (imgData[i * 4] / 255.0 - mean[0]) / std[0];
    const g = (imgData[i * 4 + 1] / 255.0 - mean[1]) / std[1];
    const b = (imgData[i * 4 + 2] / 255.0 - mean[2]) / std[2];

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
  const maxLogit = Math.max(...logits);
  const expScores = logits.map((l) => Math.exp(l - maxLogit));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const probs = expScores.map((e) => e / sumExp);

  let maxIdx = 0;
  let maxScore = -1;

  const allEmotions = EMOTIONS.map((emotion, idx) => {
    const score = probs[idx];
    if (score > maxScore) {
      maxScore = score;
      maxIdx = idx;
    }
    return { emotion, confidence: Number(score.toFixed(4)) };
  });

  allEmotions.sort((a, b) => b.confidence - a.confidence);

  return {
    dominantEmotion: EMOTIONS[maxIdx],
    confidence: Number(maxScore.toFixed(4)),
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
