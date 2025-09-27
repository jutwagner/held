'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function MigratePage() {
  const [status, setStatus] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/migrate-csv');
      const data = await response.json();
      
      if (data.needsMigration) {
        setStatus(`✅ Ready to migrate ${data.csvEntries} entries from CSV to Firestore`);
      } else if (data.hasFirestoreData) {
        setStatus('✅ Migration already completed - Firestore has data');
      } else {
        setStatus('❌ No CSV data found to migrate');
      }
    } catch (error) {
      setStatus(`❌ Error checking status: ${error}`);
    }
  };

  const runMigration = async () => {
    setIsRunning(true);
    setStatus('🚀 Starting migration...');
    setProgress(null);

    try {
      let startIndex = 0;
      const batchSize = 50;
      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalErrors = 0;

      while (true) {
        const response = await fetch('/api/migrate-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startIndex, batchSize })
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Migration failed');
        }

        const batch = data.batch;
        totalProcessed += batch.processed;
        totalSuccess += batch.successCount;
        totalErrors += batch.errorCount;

        setProgress({
          processed: totalProcessed,
          success: totalSuccess,
          errors: totalErrors,
          isComplete: batch.isComplete,
          totalEntries: batch.totalEntries
        });

        setStatus(`📊 Processed ${totalProcessed}/${batch.totalEntries} entries (${totalSuccess} success, ${totalErrors} errors)`);

        if (batch.isComplete) {
          setStatus(`🎉 Migration complete! ${totalSuccess} entries migrated successfully, ${totalErrors} errors`);
          break;
        }

        startIndex = batch.nextIndex;
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      setStatus(`❌ Migration failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="held-container py-8">

        {/*}
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-serif font-medium mb-8">CSV to Firestore Migration</h1>
          
          <div className="held-card p-8 space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-4">Migration Status</h2>
              <Button onClick={checkStatus} disabled={isRunning} className="mb-4">
                Check Status
              </Button>
              <p className="text-sm text-gray-600">{status}</p>
            </div>

            {progress && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Progress</h3>
                <div className="space-y-2 text-sm">
                  <div>Processed: {progress.processed} / {progress.totalEntries}</div>
                  <div>Success: {progress.success}</div>
                  <div>Errors: {progress.errors}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.processed / progress.totalEntries) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-medium mb-4">Run Migration</h2>
              <Button 
                onClick={runMigration} 
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? 'Migrating...' : 'Start Migration'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                This will migrate your CSV data to Firestore in batches of 50 entries.
              </p>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  );
}
