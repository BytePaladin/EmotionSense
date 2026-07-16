import UploadArea from '../features/upload/UploadArea';

export default function Upload() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-dark-100">Upload Media</h2>
        <p className="text-dark-400">Upload images or videos for advanced emotional analysis.</p>
      </div>
      <UploadArea />
    </div>
  );
}
