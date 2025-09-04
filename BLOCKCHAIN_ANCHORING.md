# Blockchain Anchoring Integration

## Overview

Held now supports on-chain Passport anchoring using the Polygon mainnet and the HeldAnchors smart contract. This feature allows users to create immutable, verifiable records of their Passport data on the blockchain.

## Features

- **Automatic Basic Anchoring**: Core Passport fields (id, created, label, type) are auto-hashed and anchored for all users
- **Polygon Integration**: Anchoring occurs on Polygon mainnet for low-cost transactions
- **Version Control**: Each update creates a new version with incremented version numbers
- **Verification**: Anyone can verify Passport authenticity by checking the blockchain
- **Held+ Premium**: Held+ unlocks richer metadata anchoring (attachments, history, images) and anchor updates/transfer

## Smart Contract

**Contract Address**: `0x2E9e8b1E508064415dbADFd2d27D65Ccb3CE5c18` (Polygon mainnet)

**ABI**: Available in `src/lib/blockchain-services.ts`

### Functions

- `anchor(passportId, digest, algo, uri, version)` - Anchor a Passport on-chain
- `Anchored` event - Emitted when anchoring is successful

## Technical Implementation

### 1. Data Hashing

- **Basic (all users)**: hash of core public fields `{ id, created, label, type }`
- **Premium (Held+)**: hash of full Passport + premium data (attachments, history, images, etc.)

All hashes are keccak256 of a stable JSON encoding and are stored on-chain as `digest`.

### 2. Blockchain Integration

- **Provider**: Polygon mainnet RPC endpoint
- **Library**: ethers.js v5.7.2
- **Server Signing**: Transactions are signed server-side via Next.js API route (`/api/anchor`)
- **Client**: Client calls the API; PRIVATE_KEY never reaches the browser

### 3. Database Schema

The `HeldObject` type now includes an `anchoring` field:

```typescript
anchoring?: {
  isAnchored: boolean;
  txHash?: string;
  blockNumber?: number;
  digest?: string;
  version: number;
  anchoredAt?: Date;
  uri?: string;
}
```

## User Experience

### Creating Objects

1. Every new Passport auto-anchors basic core fields on creation (server-side)
2. UI shows an “Anchored on Polygon” badge
3. Upgrade prompts encourage Held+ to unlock richer on-chain provenance

### Editing Objects

1. Users can enable/disable blockchain anchoring
2. Each update increments the version number
3. New anchors are created for each version

### Passport View

1. Blockchain anchoring status is displayed prominently
2. Users can verify anchoring status on-chain
3. Links to Polygon block explorer for transaction details
4. Held+ users can anchor or update anchors directly

## API Endpoints

### POST /api/update-anchoring

Updates an object's anchoring data in Firestore.

**Request Body**:
```json
{
  "objectId": "string",
  "anchoring": {
    "isAnchored": true,
    "txHash": "string",
    "blockNumber": number,
    "digest": "string",
    "version": number,
    "anchoredAt": "ISO date string",
    "uri": "string"
  }
}
```

## Security Considerations

1. **Private Key Management**: PRIVATE_KEY is stored server-side only; never exposed to clients
2. **Server-Side Signing**: The `/api/anchor` route signs and submits transactions
3. **Data Privacy**: Only hashes are stored on-chain, not raw data
4. **Access Control**: Premium anchoring (full data, updates/transfers) is Held+-only

## Future Enhancements

1. **Batch Anchoring**: Anchor multiple Passports in a single transaction
2. **Gas Optimization**: Implement gas estimation and optimization
3. **Multi-chain Support**: Support for additional blockchains
4. **Automated Updates**: Automatic anchoring on data changes
5. **Verification Tools**: Enhanced verification and dispute resolution

## Troubleshooting

### Common Issues

1. **Transaction Failures**: Check Polygon network connectivity and gas fees
2. **Hash Mismatches**: Ensure Passport data hasn't changed since anchoring
3. **Version Conflicts**: Verify version numbers are sequential
4. **RPC Errors**: Check Polygon RPC endpoint availability

### Debug Information

- Transaction hashes are logged for debugging
- Block numbers provide blockchain confirmation
- Digest values can be verified independently
- All errors include detailed error messages

## Development

### Local Testing

1. Use Polygon Mumbai testnet for development
2. Update contract address in `blockchain-services.ts`
3. Test with test wallets and test MATIC

### Environment Variables

```bash
# Add to .env.local for production
POLYGON_RPC=https://polygon-rpc.com
PRIVATE_KEY=your_server_side_wallet_private_key
# Optional override
# POLYGON_RPC_URL=https://polygon-rpc.com
# HELD_ANCHORS_CONTRACT=0x2E9e8b1E508064415dbADFd2d27D65Ccb3CE5c18
```

## Support

For technical support or questions about blockchain anchoring:

1. Check the console for error messages
2. Verify Polygon network connectivity
3. Ensure wallet is connected and has sufficient MATIC
4. Contact the development team for assistance
