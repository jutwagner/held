'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Anchor, CheckCircle, XCircle, Loader2, Shield, Crown, Clock, Sparkles } from 'lucide-react';
import { HeldObject } from '@/types';
import {
  anchorPassport,
  verifyPassportAnchoring,
  getLatestAnchoringEvent,
  generatePassportURI,
  getPolygonExplorerURL,
  getPolygonBlockExplorerURL
} from '@/lib/blockchain-services';
import { useAuth, isHeldPlus } from '@/contexts/AuthContext';

interface BlockchainAnchoringProps {
  passport: HeldObject;
  onAnchoringUpdate?: (anchoring: HeldObject['anchoring']) => void;
}

export default function BlockchainAnchoring({ passport, onAnchoringUpdate }: BlockchainAnchoringProps) {
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isAnchored: boolean;
    txHash?: string;
    blockNumber?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestEvent, setLatestEvent] = useState<{
    digest: string;
    uri: string;
    version: number;
    txHash: string;
    blockNumber: number;
  } | null>(null);
  const [anchoringStartTime, setAnchoringStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Check if user is Held+ subscriber
  const isUserHeldPlus = isHeldPlus(user);

  useEffect(() => {
    if (passport.anchoring?.isAnchored) {
      loadLatestAnchoringEvent();
    }
  }, [passport.anchoring?.isAnchored]);

  // Timer for long-running transactions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnchoring && anchoringStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - anchoringStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAnchoring, anchoringStartTime]);

  const loadLatestAnchoringEvent = async () => {
    try {
      const event = await getLatestAnchoringEvent(passport);
      setLatestEvent(event);
    } catch (error) {
      console.error('Failed to load anchoring event:', error);
    }
  };

  const handleVerifyAnchoring = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
      // Try core verification first, then full if not found
      let result = await verifyPassportAnchoring(passport, undefined, 'core');
      if (!result.isAnchored) {
        result = await verifyPassportAnchoring(passport, undefined, 'full');
      }
      setVerificationResult(result);
      
      if (result.isAnchored) {
        loadLatestAnchoringEvent();
      }
    } catch (error) {
      setError('Failed to verify anchoring status');
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAnchorPassport = async () => {
    if (!isUserHeldPlus) {
      setError('Enhanced blockchain anchoring is a Held+ feature');
      return;
    }

    setIsAnchoring(true);
    setError(null);
    setAnchoringStartTime(new Date());
    setElapsedTime(0);
    
    try {
      // Generate URI for the Passport
      const baseURL = window.location.origin;
      const uri = generatePassportURI(passport, baseURL);
      
      // Get current version (increment if already anchored)
      const currentVersion = (passport.anchoring?.version || 0) + 1;
      
      // Anchor the Passport (premium/full data for Held+)
      const result = await anchorPassport(passport, uri, currentVersion, 'full');
      
      // Update the anchoring data
      const newAnchoring = {
        isAnchored: true,
        txHash: result.txHash,
        digest: result.digest,
        version: currentVersion,
        anchoredAt: new Date(),
        uri,
        blockNumber: (result as any).blockNumber,
      };
      
      // Persist anchoring to backend
      try {
        await fetch('/api/update-anchoring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objectId: passport.id, anchoring: newAnchoring }),
        });
      } catch (e) {
        console.warn('Failed to persist anchoring (non-blocking):', e);
      }

      // Call the callback to update the parent component
      if (onAnchoringUpdate) {
        onAnchoringUpdate(newAnchoring);
      }
      
      // Update local state
      setVerificationResult({
        isAnchored: true,
        txHash: result.txHash
      });
      
      // Load the latest event
      await loadLatestAnchoringEvent();
      
    } catch (error) {
      setError(`Failed to anchor Passport: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Anchoring error:', error);
    } finally {
      setIsAnchoring(false);
      setAnchoringStartTime(null);
      setElapsedTime(0);
    }
  };

  // Basic anchoring available to all users
  const handleAnchorBasic = async () => {
    setIsAnchoring(true);
    setError(null);
    setAnchoringStartTime(new Date());
    setElapsedTime(0);
    
    try {
      const baseURL = window.location.origin;
      const uri = generatePassportURI(passport, baseURL);
      const version = (passport.anchoring?.version || 0) + 1 || 1;
      const result = await anchorPassport(passport, uri, version, 'core');
      const newAnchoring = {
        isAnchored: true,
        txHash: result.txHash,
        digest: result.digest,
        version,
        anchoredAt: new Date(),
        uri,
        blockNumber: (result as any).blockNumber,
      };
      // Persist anchoring to backend
      try {
        await fetch('/api/update-anchoring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objectId: passport.id, anchoring: newAnchoring }),
        });
      } catch (e) {
        console.warn('Failed to persist anchoring (non-blocking):', e);
      }

      if (onAnchoringUpdate) onAnchoringUpdate(newAnchoring);
      setVerificationResult({ isAnchored: true, txHash: result.txHash });
      await loadLatestAnchoringEvent();
    } catch (error) {
      setError(`Failed to anchor basic proof: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Basic anchoring error:', error);
    } finally {
      setIsAnchoring(false);
      setAnchoringStartTime(null);
      setElapsedTime(0);
    }
  };

  const getAnchoringStatus = () => {
    if (passport.anchoring?.isAnchored) {
      return {
        status: 'anchored',
        label: 'Anchored on Polygon',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        description: 'This Passport is anchored on the Polygon blockchain'
      };
    }
    
    if (verificationResult?.isAnchored) {
      return {
        status: 'verified',
        label: 'Verified on Polygon',
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'This Passport is verified on the Polygon blockchain'
      };
    }
    
    return {
      status: 'not-anchored',
      label: 'Not Anchored',
      icon: XCircle,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'This Passport is not yet anchored on the blockchain'
    };
  };

  const status = getAnchoringStatus();
  const StatusIcon = status.icon;

  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Display */}
      {passport.anchoring?.isAnchored ? (
        <div className="border-2 border-black p-6">
          <div className="flex items-center gap-4 mb-4">
            <CheckCircle className="h-6 w-6 text-black" />
            <div>
              <h3 className="text-lg font-light text-black">Blockchain Verified</h3>
              <p className="text-sm text-gray-600">This passport is anchored on the Polygon blockchain</p>
            </div>
          </div>
          
          {latestEvent && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Transaction:</span>
                  <a
                    href={getPolygonExplorerURL(latestEvent.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-black hover:text-gray-600 border-b border-black hover:border-gray-600 pb-1 transition-colors"
                  >
                    {latestEvent.txHash.slice(0, 8)}...{latestEvent.txHash.slice(-6)}
                  </a>
                </div>
                <div>
                  <span className="text-gray-500">Block:</span>
                  <a
                    href={getPolygonBlockExplorerURL(latestEvent.blockNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-black hover:text-gray-600 border-b border-black hover:border-gray-600 pb-1 transition-colors"
                  >
                    {latestEvent.blockNumber}
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <Button
              onClick={handleVerifyAnchoring}
              disabled={isVerifying}
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white transition-colors"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Again
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-black p-6">
          <div className="flex items-center gap-4 mb-4">
            <XCircle className="h-6 w-6 text-black" />
            <div>
              <h3 className="text-lg font-light text-black">Not Yet Anchored</h3>
              <p className="text-sm text-gray-600">This passport has not been anchored on the blockchain</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Basic anchoring for all users */}
            <Button
              onClick={handleAnchorBasic}
              disabled={isAnchoring}
              className="w-full bg-black hover:bg-gray-800 text-white border-0 transition-colors"
            >
              {isAnchoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Anchoring...
                </>
              ) : (
                <>
                  <Anchor className="h-4 w-4 mr-2" />
                  Create Basic Proof
                </>
              )}
            </Button>
            
            {/* Enhanced anchoring for Held+ users */}
            {isUserHeldPlus && (
              <Button
                onClick={handleAnchorPassport}
                disabled={isAnchoring}
                variant="outline"
                className="w-full border-black text-black hover:bg-black hover:text-white transition-colors"
              >
                {isAnchoring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Anchoring...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Enhanced Anchoring
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Long-running Transaction Feedback */}
      {isAnchoring && (
        <div className="border-2 border-black p-6">
          <div className="flex items-center gap-4 mb-4">
            <Loader2 className="h-6 w-6 text-black animate-spin" />
            <div>
              <h4 className="text-lg font-light text-black">Transaction in Progress</h4>
              <p className="text-sm text-gray-600">Waiting for blockchain confirmation...</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Elapsed: {formatElapsedTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Polygon Network</span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-800">
              This process typically takes 2-5 minutes. Please don't close this page.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border-2 border-red-300 p-6">
          <div className="flex items-center gap-4 mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-600 font-medium">Error</span>
          </div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && !passport.anchoring?.isAnchored && (
        <div className="border-2 border-green-300 p-6">
          <div className="flex items-center gap-4 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-600 font-medium">Verification Complete</span>
          </div>
          <p className="text-sm text-green-600">
            Passport verification completed successfully.
          </p>
        </div>
      )}

      {/* Held+ Upsell - Only show if not anchored and user is not Held+ */}
      {!isUserHeldPlus && !passport.anchoring?.isAnchored && (
        <div className="border-2 border-black p-6">
          <div className="flex items-center gap-4 mb-4">
            <Crown className="h-6 w-6 text-black" />
            <div>
              <h3 className="text-lg font-light text-black">Enhanced Features</h3>
              <p className="text-sm text-gray-600">
                Held+ subscribers can anchor full metadata and access advanced provenance features.
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => window.location.href = '/settings/premium'}
            className="bg-black hover:bg-gray-800 text-white border-0 transition-colors"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Held+
          </Button>
        </div>
      )}
    </div>
  );
}
