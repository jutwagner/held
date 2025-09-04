# Blockchain Anchoring Integration

## Overview

Held now supports on-chain Passport anchoring using the Polygon mainnet and the HeldAnchors smart contract. This feature allows users to create immutable, verifiable records of their Passport data on the blockchain.

## Features

- **Automatic Hashing**: Core Passport data is automatically hashed using keccak256
- **Polygon Integration**: Anchoring occurs on Polygon mainnet for low-cost transactions
- **Version Control**: Each update creates a new version with incremented version numbers
- **Verification**: Anyone can verify Passport authenticity by checking the blockchain
- **Held+ Exclusive**: Blockchain anchoring is a premium feature for Held+ subscribers

## Smart Contract

**Contract Address**: `0x2E9e8b1E508064415dbADFd2d27D65Ccb3CE5c18` (Polygon mainnet)

**ABI**: Available in `src/lib/blockchain-services.ts`

### Functions

- `anchor(passportId, digest, algo, uri, version)` - Anchor a Passport on-chain
- `Anchored` event - Emitted when anchoring is successful

## Technical Implementation

### 1. Data Hashing

Passport data is deterministically hashed using the following fields:
- ID, title, maker, year, category, condition
- Serial number, acquisition date, origin
- Provenance chain, condition history
- Associated documents, provenance notes

The hash is generated using keccak256 and stored as the `digest` field.

### 2. Blockchain Integration

- **Provider**: Polygon mainnet RPC endpoint
- **Library**: ethers.js v5.7.2
- **Transaction Handling**: Automatic transaction confirmation and error handling

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

1. Users can opt-in to blockchain anchoring during object creation
2. A checkbox appears in the "Provenance" step for Held+ users
3. Anchoring is initialized but not executed until explicitly requested

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

1. **Private Key Management**: Users must connect their own wallet (Metamask, etc.)
2. **Transaction Signing**: All blockchain transactions require user approval
3. **Data Privacy**: Only hashes are stored on-chain, not raw data
4. **Access Control**: Anchoring is restricted to Held+ subscribers

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
POLYGON_RPC_URL=https://polygon-rpc.com
HELD_ANCHORS_CONTRACT=0x2E9e8b1E508064415dbADFd2d27D65Ccb3CE5c18
```

## Support

For technical support or questions about blockchain anchoring:

1. Check the console for error messages
2. Verify Polygon network connectivity
3. Ensure wallet is connected and has sufficient MATIC
4. Contact the development team for assistance
