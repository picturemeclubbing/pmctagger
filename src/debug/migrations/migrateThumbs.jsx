// Migration utility for backfilling thumbDataUrl on existing sessions
import { db } from '../../services/database';
import { blobToDataURL } from '../../utils/helpers';

/**
 * Migration function to backfill thumbDataUrl for existing sessions.
 * Only runs on sessions that have rawThumbBlob but no thumbDataUrl.
 */
export async function backfillThumbs() {
  const { db } = await import('../../services/database');
  const sessions = await db.photoSessions.toArray();
  let migratedCount = 0;

  for (const session of sessions) {
    if (!session.thumbDataUrl && session.rawThumbBlob) {
      try {
        const dataUrl = await blobToDataURL(session.rawThumbBlob);
        await db.photoSessions.update(session.sessionId, { thumbDataUrl: dataUrl });
        console.info('[MIGRATE] thumb backfilled', session.sessionId);
        migratedCount++;
      } catch (error) {
        console.warn('[MIGRATE] failed to backfill', session.sessionId, error.message);
      }
    }
  }

  console.info('[MIGRATE] thumb backfill complete', { total: sessions.length, migrated: migratedCount });
  return { total: sessions.length, migrated: migratedCount };
}

// Debug page component for the migration
export function MigrateThumbsDebugger() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [results, setResults] = React.useState(null);

  const handleMigrate = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const result = await backfillThumbs();
      setResults(result);
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">🔄 Backfill Thumbnails</h3>
      <p className="text-sm text-gray-600 mb-4">
        Convert existing session thumbnails to persistent DataURL format for homepage display.
        This will add thumbDataUrl field to sessions that only have blob data.
      </p>

      <button
        onClick={handleMigrate}
        disabled={isRunning}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
      >
        {isRunning ? 'Processing...' : 'Run Migration'}
      </button>

      {results && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <pre className="text-sm text-gray-800">
            {results.error ? `❌ Error: ${results.error}` : `✅ Complete: ${results.migrated} of ${results.total} sessions migrated`}
          </pre>
        </div>
      )}
    </div>
  );
}
