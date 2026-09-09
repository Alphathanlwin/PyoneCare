import { useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface PhotoUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => setError('');

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported format. Please use a JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      clearError();
      onChange(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => {
      setError('Could not read the file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    clearError();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onChange(null);
  };

  const openPicker = () => {
    clearError();
    inputRef.current?.click();
  };

  return (
    <div className="photo-upload">
      <span className="photo-upload-label">Upload a mouth photo (optional)</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="photo-upload-input"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
      />

      {value ? (
        <div className="photo-upload-preview">
          <img src={value} alt="Mouth photo preview" className="photo-upload-thumb" />
          <button type="button" className="photo-upload-remove" onClick={handleRemove}>
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`photo-upload-dropzone ${dragActive ? 'photo-upload-dropzone--active' : ''}`}
          onClick={openPicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadIcon />
          <span className="photo-upload-prompt">
            Drag & drop your mouth photo here, or <span className="photo-upload-browse">browse</span>
          </span>
          <span className="photo-upload-meta">JPEG, PNG, or WEBP · Max {MAX_SIZE_MB} MB</span>
        </button>
      )}

      {error && <div className="form-error photo-upload-error">{error}</div>}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="photo-upload-icon"
    >
      <path
        d="M12 16V4m0 0l-4 4m4-4l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default PhotoUpload;
