import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDebug from '../debug/useDebug';
import { compressImage, makeThumbnail } from '../services/ImageService';
import { saveRawVersion } from '../services/SessionStore';
import { generateSessionId, validateFile } from '../utils/helpers';
import DropzoneArea from '../components/upload/DropzoneArea';
import PreviewCard from '../components/upload/PreviewCard';

// A simple component to show while redirecting.
function RedirectingLoader() {
  return (
    <div className="p-8 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
      <h3 className="text-lg font-semibold text-gray-800">✅ Success!</h3>
      <p className="text-gray-600 mt-2">Redirecting to tagging page...</p>
    </div>
  );
}

function UploadPage() {
  const navigate = useNavigate();
  const debug = useDebug('UPLOAD');

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  // The new state machine to control the UI flow reliably.
  // Possible states: 'idle', 'processing', 'success', 'error'
  const [status, setStatus] = useState('idle');

  // State to show the user exactly what's happening.
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  // This effect handles the entire upload process automatically when a file is selected.
  useEffect(() => {
    // Do nothing if there's no file or if we're not in the initial 'idle' state.
    if (!file || status !== 'idle') return;

    const processFile = async () => {
      setStatus('processing');
      const sessionId = generateSessionId();

      try {
        setProgress(20);
        setProgressText('Compressing image...');
        debug.log('Compressing image...');
        const compressedBlob = await compressImage(file, 1920, 0.85);

        setProgress(50);
        setProgressText('Creating thumbnail...');
        debug.log('Creating thumbnail...');
        const thumbBlob = await makeThumbnail(file, 300);

        setProgress(80);
        setProgressText('Saving to session...');
        debug.log('Saving to session...');
        await saveRawVersion(sessionId, compressedBlob, thumbBlob, file.name);

        setProgress(100);
        setProgressText('Upload complete!');
        debug.success('session_created', { sessionId });

        // Setting status to 'success' will trigger the navigation effect.
        setStatus('success');
        navigate(`/tag/${sessionId}`);

      } catch (err) {
        debug.error('upload_failed', { error: err.message });
        setError(err.message || 'An unknown error occurred during upload.');
        setStatus('error');
      }
    };

    processFile();

  }, [file, status, navigate, debug]); // Reruns if a new file is selected.

  // Handles the initial file selection from the dropzone.
  const handleFileSelect = (selectedFile) => {
    // Reset everything for the new file.
    setStatus('idle');
    setError(null);
    setProgress(0);
    setProgressText('');
    setFile(null);

    const validation = validateFile(selectedFile, { maxSizeMB: 10, types: ['image/jpeg', 'image/jpg', 'image/png'] });
    if (!validation.ok) {
      setStatus('error');
      setError(validation.reason);
      return;
    }

    // Revoke old URL if it exists, before creating a new one.
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  // Clean up the temporary preview URL to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            📤 Upload Photo
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Select a photo and we'll handle the rest automatically.
          </p>
        </div>

        <div className="mt-4">
          {/* STATE 1: IDLE - No file selected yet */}
          {status === 'idle' && !file && <DropzoneArea onFileSelect={handleFileSelect} />}

          {/* STATE 2: PROCESSING - File is uploading */}
          {status === 'processing' && (
            <PreviewCard
              previewUrl={previewUrl}
              fileName={file.name}
              fileSize={file.size}
              progress={progress}
              isProcessing={true}
              // Pass the new detailed text to the preview card.
              statusText={progressText}
            />
          )}

          {/* STATE 3: SUCCESS - Upload finished, redirecting */}
          {status === 'success' && <RedirectingLoader />}

          {/* STATE 4: ERROR - Something went wrong */}
          {status === 'error' && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="font-semibold">Upload Failed</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => handleFileSelect(file)} // A way to retry
                className="mt-2 text-sm font-semibold text-red-800 hover:underline">
                Retry Upload
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
