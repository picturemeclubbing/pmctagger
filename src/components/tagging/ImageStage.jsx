// File: /src/components/tagging/ImageStage.jsx
// Purpose: Container for image display with tag overlay positioning
// Connects To: TaggingPage, SocialTagger

import React, { useRef, useEffect, useState } from "react";

function ImageStage({ imageUrl, children }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-gray-900">
      <div ref={containerRef} className="relative max-w-full max-h-full">
        <img
          src={imageUrl}
          alt="Tagging canvas"
          className="max-w-full max-h-[70vh] w-auto h-auto object-contain select-none"
          draggable={false}
        />

        {/* Tag Overlay Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {React.cloneElement(children, { stageDimensions: dimensions })}
        </div>
      </div>
    </div>
  );
}

export default ImageStage;
