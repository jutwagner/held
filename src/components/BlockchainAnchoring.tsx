'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Anchor, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
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

  // Check if user is Held+ subscriber
  const isUserHeldPlus = isHeldPlus(user);

  useEffect(() => {
    if (passport.anchoring?.isAnchored) {
      loadLatestAnchoringEvent();
    }
  }, [passport.anchoring?.isAnchored]);

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
      const result = await verifyPassportAnchoring(passport);
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
      setError('Blockchain anchoring is a Held+ feature');
      return;
    }

    setIsAnchoring(true);
    setError(null);
    
    try {
      // Generate URI for the Passport
      const baseURL = window.location.origin;
      const uri = generatePassportURI(passport, baseURL);
      
      // Get current version (increment if already anchored)
      const currentVersion = (passport.anchoring?.version || 0) + 1;
      
      // Anchor the Passport
      const result = await anchorPassport(passport, uri, currentVersion);
      
      // Update the anchoring data
      const newAnchoring = {
        isAnchored: true,
        txHash: result.txHash,
        digest: result.digest,
        version: currentVersion,
        anchoredAt: new Date(),
        uri
      };
      
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Blockchain Anchoring
        </CardTitle>
        <CardDescription>
          Anchor this Passport on the Polygon blockchain for immutable provenance verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            {passport.anchoring?.version && (
              <Badge variant="outline">
                Version {passport.anchoring.version}
              </Badge>
            )}
          </div>
          
          {!isUserHeldPlus && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Held+ Required
            </Badge>
          )}
        </div>

        <p className="text-sm text-gray-600">{status.description}</p>

        {/* Anchoring Details */}
        {passport.anchoring?.isAnchored && latestEvent && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Anchoring Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Transaction:</span>
                <a
                  href={getPolygonExplorerURL(latestEvent.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline flex items-center gap-1"
                >
                  View on Polygon
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <span className="text-gray-500">Block:</span>
                <a
                  href={getPolygonBlockExplorerURL(latestEvent.blockNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline flex items-center gap-1"
                >
                  #{latestEvent.blockNumber}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <span className="text-gray-500">Digest:</span>
                <span className="ml-2 font-mono text-xs">
                  {latestEvent.digest.slice(0, 10)}...{latestEvent.digest.slice(-8)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">URI:</span>
                <span className="ml-2 text-xs truncate">{latestEvent.uri}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleVerifyAnchoring}
            disabled={isVerifying}
            variant="outline"
            size="sm"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Verify Status
          </Button>

          {(!passport.anchoring?.isAnchored || passport.anchoring?.version) && (
            <Button
              onClick={handleAnchorPassport}
              disabled={isAnchoring || !isUserHeldPlus}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnchoring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Anchor className="h-4 w-4 mr-2" />
              )}
              {passport.anchoring?.isAnchored ? 'Update Anchor' : 'Anchor on Polygon'}
            </Button>
          )}
        </div>

        {/* Held+ Upsell */}
        {!isUserHeldPlus && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Upgrade to Held+</h4>
            <p className="text-sm text-purple-700 mb-3">
              Anchor your Passports on the Polygon blockchain for immutable provenance verification.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              Learn More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
