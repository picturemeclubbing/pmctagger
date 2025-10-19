import React from 'react';
import { useParams } from 'react-router-dom';

function SharePage() {
  const { sessionId } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          📤 Share Page
        </h1>

        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Share Interface - Coming in Phase 4
          </h2>
          <p className="text-gray-500 mb-4">
            Session ID: <code className="bg-white px-2 py-1 rounded">{sessionId}</code>
          </p>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold mb-2">Phase 4 will include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Share tagged or untagged versions</li>
            <li>Copy event comments</li>
            <li>Send to customer modal</li>
            <li>Watermark application</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SharePage;
