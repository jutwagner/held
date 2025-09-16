'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function MigrationButton() {
  const [status, setStatus] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  const testFirestore = async () => {
    try {
      setStatus('🧪 Testing Firestore connection...');
      const response = await fetch('/api/test-firestore');
      const data = await response.json();
      
      if (data.success) {
        setStatus(`✅ Firestore working! Found ${data.testData.brandsFound} brands`);
      } else {
        setStatus(`❌ Firestore test failed: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
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
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-4">CSV to Firestore Migration</h3>
      
      <div className="space-y-4">
        <div>
          <Button onClick={testFirestore} disabled={isRunning} className="mr-2">
            Test Firestore
          </Button>
          <Button 
            onClick={runMigration} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Migrating...' : 'Start Migration'}
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {status}
        </div>

        {progress && (
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium mb-2">Progress</h4>
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
      </div>
    </div>
  );
}
