// File: /src/components/tagging/SocialTagger.jsx
// Purpose: Instagram-style tag placement with customer auto-linking (Phase 5.2b)
// Connects to: TagMarker.jsx, TagModeSelector.jsx, TagCanvasService.js, SessionStore, CustomerStore

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useDebug from '../../debug/useDebug';
import { getSession, updateTagsMeta } from '../../services/SessionStore';
import { getCustomerByHandle } from '../../services/CustomerStore';
import { blobToDataURL } from '../../utils/helpers';
import { generateUUID, pixelsToPct, pctToPixels } from '../../utils/helpers';
import TagMarker from './TagMarker';
import TagModeSelector from './TagModeSelector';
import { burnTagsToImage } from '../../services/TagCanvasService';

function SocialTagger() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const debug = useDebug('TAGGING');

  // Refs
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dimensionCacheRef = useRef({ width: 0, height: 0, timestamp: 0 });

  // State
  const [session, setSession] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [tags, setTags] = useState([]);
  const [tagMode, setTagMode] = useState('local'); // 'local' or 'physical'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load session and image
  useEffect(() => {
    loadSession();
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [sessionId]);

  // Track image dimensions with caching and debouncing
  const handleImageLoad = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();

      // Initialize cache on load
      dimensionCacheRef.current = {
        width: rect.width,
        height: rect.height,
        timestamp: Date.now()
      };

      setImageDimensions({ width: rect.width, height: rect.height });
      debug.log('image_dimensions_set', {
        width: rect.width,
        height: rect.height,
        cached: false
      });
    }
  };

  useEffect(() => {
    let resizeTimeout;

    const updateDimensions = () => {
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const newWidth = rect.width;
      const newHeight = rect.height;

      // Check cache - only update if dimensions actually changed
      const cached = dimensionCacheRef.current;
      const hasChanged =
        Math.abs(cached.width - newWidth) > 1 ||
        Math.abs(cached.height - newHeight) > 1;

      if (hasChanged) {
        // Update cache
        dimensionCacheRef.current = {
          width: newWidth,
          height: newHeight,
          timestamp: Date.now()
        };

        // Update state
        setImageDimensions({ width: newWidth, height: newHeight });
        debug.log('dimensions_updated', {
          width: newWidth,
          height: newHeight,
          cached: false
        });
      } else {
        debug.log('dimensions_cached', {
          width: newWidth,
          height: newHeight,
          cached: true
        });
      }
    };

    // Debounced resize handler (waits 150ms after last resize event)
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateDimensions, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [debug]);

  const loadSession = async () => {
    debug.time('load_tagging_session');
    try {
      const sessionData = await getSession(sessionId);
      if (!sessionData) throw new Error('Session not found');

      setSession(sessionData);

      // Load existing tags or initialize empty
      const existingTags = sessionData.tagsMeta || [];
      setTags(existingTags.map(tag => ({
        ...tag,
        isEditing: false
      })));

      // Convert blob to URL
      const url = await blobToDataURL(sessionData.rawImageBlob);
      setImageUrl(url);

      debug.timeEnd('load_tagging_session', { sessionId, tagCount: existingTags.length });
      setIsLoading(false);
    } catch (error) {
      debug.error('load_failed', { sessionId, error: error.message });
      setIsLoading(false);
    }
  };

  /**
   * Create a new, centered tag on the image
   */
  const handleAddTag = () => {
    const newTag = {
      id: generateUUID(),
      text: '@username',
      xPct: 50,
      yPct: 50,
      createdAt: Date.now(),
      isEditing: true, // Start in edit mode
      logoVisible: true,
      textVisible: true,
      customerId: null, // Phase 5.2b: customer link placeholder
      customerName: null
    };

    setTags(prev => [...prev, newTag]);
    debug.log('tag_created_centered', { tagId: newTag.id });
  };

  /**
   * Update tag text (live as user types)
   */
  const handleTagTextChange = (tagId, text) => {
    setTags(prev => prev.map(tag =>
      tag.id === tagId ? { ...tag, text } : tag
    ));
  };

  /**
   * Complete tag editing and attempt customer auto-link (Phase 5.2b)
   */
  const handleTagComplete = async (tagId) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;

    // Phase 5.2b: Auto-link customer by handle
    debug.time('customer_lookup');
    try {
      const customer = await getCustomerByHandle(tag.text);

      if (customer) {
        // Customer found - link it
        setTags(prev => prev.map(t =>
          t.id === tagId
            ? {
                ...t,
                isEditing: false,
                customerId: customer.id,
                customerName: customer.name
              }
            : t
        ));

        debug.timeEnd('customer_lookup', {
          tagId,
          customerId: customer.id,
          customerName: customer.name
        });
        debug.info('customer_linked', {
          tagId,
          handle: tag.text,
          customerId: customer.id,
          customerName: customer.name
        });
      } else {
        // No customer found - just complete editing
        setTags(prev => prev.map(t =>
          t.id === tagId ? { ...t, isEditing: false } : t
        ));

        debug.timeEnd('customer_lookup', { tagId, result: 'not_found' });
        debug.warn('no_customer_found', {
          tagId,
          handle: tag.text,
          suggestion: 'Add customer to CRM first'
        });
      }
    } catch (error) {
      debug.error('customer_lookup_failed', {
        tagId,
        error: error.message
      });

      // Complete editing even if lookup fails
      setTags(prev => prev.map(t =>
        t.id === tagId ? { ...t, isEditing: false } : t
      ));
    }
  };

  /**
   * Delete tag
   */
  const handleDeleteTag = (tagId) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
    debug.log('tag_deleted', { tagId });
  };

  /**
   * Update tag position (from drag)
   */
  const handleTagMove = (tagId, xPct, yPct) => {
    setTags(prev => prev.map(tag =>
      tag.id === tagId ? { ...tag, xPct, yPct } : tag
    ));
  };

  /**
   * Save tags to database (Phase 5.2b: includes customer links)
   */
  const handleSaveTags = async () => {
    debug.time('save_tags');
    setIsSaving(true);

    try {
      // Filter out empty tags and prepare for storage
      const tagsToSave = tags
        .filter(tag => tag.text.trim())
        .map(({ id, text, xPct, yPct, createdAt, customerId, customerName }) => ({
          id,
          text,
          xPct,
          yPct,
          type: 'instagram',
          createdAt,
          fontSize: 24,
          color: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          logoScale: 1.0,
          shadow: true,
          // Phase 5.2b: Persist customer link
          customerId: customerId || null,
          customerName: customerName || null
        }));

      await updateTagsMeta(sessionId, tagsToSave);

      // Log customer links for debug
      const linkedCount = tagsToSave.filter(t => t.customerId).length;
      debug.timeEnd('save_tags', {
        sessionId,
        totalTags: tagsToSave.length,
        linkedCustomers: linkedCount
      });
      debug.success('tags_saved', {
        count: tagsToSave.length,
        linkedCustomers: linkedCount
      });

      return tagsToSave;
    } catch (error) {
      debug.error('save_failed', { error: error.message });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Navigate to customer info page (Phase 6.0a Integration)
   */
  const handleContinue = async () => {
    try {
      await handleSaveTags();
      navigate(`/collect/${sessionId}`);
      debug.log('navigate_to_customer_form', { sessionId });
    } catch (error) {
      // Error already logged
    }
  };

  /**
   * Export with burned tags (physical mode)
   */
  const handleExportPhysical = async () => {
    debug.time('burn_tags');
    setIsSaving(true);

    try {
      const savedTags = await handleSaveTags();

      // Burn tags into image
      const burnedDataUrl = await burnTagsToImage(imageUrl, savedTags, imageDimensions);

      // Trigger download
      const a = document.createElement('a');
      a.href = burnedDataUrl;
      a.download = `${session.imageName}_tagged.jpg`;
      a.click();

      debug.timeEnd('burn_tags', { sessionId, tagCount: savedTags.length });
      debug.success('tags_burned', { sessionId });
    } catch (error) {
      debug.error('burn_failed', { error: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/gallery')}
            className="text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
          >
            ← Back
          </button>
          <h1 className="text-white font-semibold">🏷️ Tag Photo</h1>
          <button
            onClick={handleContinue}
            disabled={isSaving}
            className="
              px-4 py-2 bg-primary text-white rounded-lg font-medium
              hover:bg-blue-600 disabled:bg-gray-600 transition-colors
              text-sm min-h-[44px]
            "
          >
            {isSaving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Image Canvas */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
      >
        <div className="relative max-w-full max-h-full">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Tagging canvas"
            onLoad={handleImageLoad}
            className="
              max-w-full max-h-[60vh] w-auto h-auto object-contain
              select-none
            "
            draggable={false}
          />

          {/* Tag Overlays */}
          {tags.map(tag => (
            <TagMarker
              key={tag.id}
              tag={tag}
              imageDimensions={imageDimensions}
              onTextChange={(text) => handleTagTextChange(tag.id, text)}
              onComplete={() => handleTagComplete(tag.id)}
              onDelete={() => handleDeleteTag(tag.id)}
              onMove={(xPct, yPct) => handleTagMove(tag.id, xPct, yPct)}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 space-y-3">
        {/* Mode Selector */}
        <TagModeSelector
          mode={tagMode}
          onModeChange={setTagMode}
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAddTag}
            disabled={isSaving}
            className="
              flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium
              hover:bg-blue-600 disabled:bg-gray-600 transition-colors
              min-h-[52px] touch-manipulation
            "
          >
            + Add Tag
          </button>

          {tagMode === 'physical' && (
            <button
              onClick={handleExportPhysical}
              disabled={tags.length === 0 || isSaving}
              className="
                flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium
                hover:bg-green-700 disabled:bg-gray-600 transition-colors
                min-h-[52px] touch-manipulation
              "
            >
              💾 Export with Tags
            </button>
          )}
        </div>

        {/* Tag Count + Customer Link Status */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-400">
            {tags.length} tag{tags.length !== 1 ? 's' : ''} added
          </p>
          {tags.some(t => t.customerId) && (
            <p className="text-green-400 flex items-center gap-1">
              <span>👤</span>
              <span>{tags.filter(t => t.customerId).length} linked to CRM</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialTagger;
