import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileVideo, FileImage, X, Activity } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../hooks/useToast';
import { validateFile } from '../../utils/validators';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

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
    if (!file) return;
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    
    let simInterval = setInterval(() => { setProgress(p => p < 90 ? p + 5 : p); }, 200);

    try {
      const mockRes = await api.post('/mock-inference', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const detections = mockRes.data.data.detections;
      
      const saveRes = await api.post('/upload-result', {
        file_metadata: { file_name: file.name, file_type: file.type, file_size: file.size },
        detections
      });
      clearInterval(simInterval);
      setProgress(100);
      toast.success('Analysis complete!');
      setTimeout(() => navigate(`/analysis/${saveRes.data.data.file_id}`), 500);
    } catch (error) {
      clearInterval(simInterval);
      setIsProcessing(false);
      setProgress(0);
      toast.error(error.response?.data?.message || 'Processing failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {!file ? (
        <Card className={`border-2 border-dashed ${isDragging ? 'border-primary-500 bg-primary-500/5' : 'border-dark-600/50 hover:border-dark-500 hover:bg-dark-800/30'} transition-all duration-300`}>
          <div className="py-16 px-4 text-center" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 transition-transform duration-300 ${isDragging ? 'bg-primary-500/20 scale-110' : 'bg-dark-700'}`}>
              <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-primary-400' : 'text-dark-400'}`} />
            </div>
            <h3 className="text-xl font-semibold text-dark-100 mb-2">Drag & Drop your media here</h3>
            <p className="text-dark-400 text-sm max-w-md mx-auto mb-8">Support for JPG, PNG, MP4, MOV. Max file size is 20MB.</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/jpg,video/mp4,video/quicktime,video/x-msvideo" onChange={e => handleFileSelect(e.target.files[0])} />
            <Button onClick={() => fileInputRef.current?.click()} size="lg">Browse Files</Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 border border-dark-600/50">
          <div className="relative p-6">
            <button onClick={clearFile} disabled={isProcessing} className="absolute top-4 right-4 p-2 bg-dark-800/80 backdrop-blur-sm rounded-full text-dark-400 hover:text-white hover:bg-red-500 transition-all z-10"><X className="w-5 h-5" /></button>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/2 aspect-video bg-black/40 rounded-xl overflow-hidden flex items-center justify-center border border-dark-700 shadow-inner">
                {file.type.startsWith('image/') ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <video src={preview} className="w-full h-full object-cover opacity-80" controls={false} />
                )}
              </div>
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {file.type.startsWith('image/') ? <FileImage className="w-6 h-6 text-primary-400" /> : <FileVideo className="w-6 h-6 text-purple-400" />}
                    <h4 className="text-lg font-semibold text-dark-100 truncate pr-8">{file.name}</h4>
                  </div>
                  <p className="text-sm text-dark-400">{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}</p>
                </div>
                {isProcessing ? (
                  <div className="space-y-4 bg-dark-800/50 p-6 rounded-2xl border border-dark-700/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent animate-shimmer" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-primary-400 flex items-center gap-2"><Activity className="w-4 h-4 animate-pulse" /> AI Engine Running</span>
                      <span className="text-dark-300 font-mono">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-300 ease-out relative" style={{ width: `${progress}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleUpload} size="lg" className="w-full group">
                    Start Analysis <Activity className="w-5 h-5 ml-2 group-hover:animate-pulse" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
