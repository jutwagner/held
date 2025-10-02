# Blockchain Anchoring Setup Guide

This guide will help you set up blockchain anchoring for your Held platform, allowing users to anchor their passport data on the Polygon blockchain.

## Prerequisites

1. **Polygon Wallet**: You need a wallet with MATIC tokens for gas fees
2. **Environment Access**: Ability to set environment variables on your server
3. **Polygon Network Access**: Ensure your server can reach Polygon RPC endpoints

## Step 1: Create a Polygon Wallet

### Option A: Generate a New Wallet (Recommended for Production)

1. Use a secure method to generate a new Ethereum-compatible private key
2. **IMPORTANT**: This wallet will be used server-side only - never expose the private key
3. Ensure the wallet has some MATIC tokens for gas fees (recommended: at least 10-20 MATIC)

### Option B: Use an Existing Wallet

1. Export the private key from your existing wallet
2. Ensure it has sufficient MATIC for gas fees
3. **WARNING**: Only use a wallet you control and trust

## Step 2: Set Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Required: Your wallet's private key (64-character hex string starting with 0x)
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Required: Polygon RPC endpoint (choose one from the list below)
POLYGON_RPC=https://polygon.llamarpc.com

# Optional: Alternative RPC endpoints (comma-separated)
POLYGON_RPC_URL=https://polygon.llamarpc.com,https://polygon.rpc.blxrbdn.com

# Optional: Vendor RPC keys for higher reliability
ALCHEMY_API_KEY=your_alchemy_key_here
INFURA_PROJECT_ID=your_infura_project_id_here

# Optional: Admin token for additional security
ANCHOR_ADMIN_TOKEN=your_random_admin_token_here
```

## Step 3: Test Your Configuration

1. Restart your development server
2. Try to anchor a passport
3. Check the console for any error messages
4. Verify the transaction appears on [Polygonscan](https://polygonscan.com)

## Reliable RPC Endpoints

The system automatically tests multiple RPC endpoints. Here are the most reliable ones:

### Free Public Endpoints
- `https://polygon.llamarpc.com` (Recommended)
- `https://polygon.rpc.blxrbdn.com`
- `https://polygon.meowrpc.com`
- `https://rpc-mainnet.maticvigil.com`
- `https://polygon-rpc.com`
- `https://rpc.ankr.com/polygon`

### Premium Endpoints (Require API Keys)
- `https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY` (Alchemy)
- `https://polygon-mainnet.infura.io/v3/YOUR_KEY` (Infura)

## Troubleshooting

### Common Issues

#### 1. "PRIVATE_KEY not configured"
- Ensure `.env.local` file exists and contains `PRIVATE_KEY`
- Verify the private key format (64 hex chars, starts with 0x)
- Restart your server after adding environment variables

#### 2. "No working Polygon RPC endpoint found"
- Check your internet connection
- Try setting a specific RPC endpoint in `POLYGON_RPC`
- Consider using premium RPC services (Alchemy, Infura)

#### 3. "Insufficient MATIC for gas fees"
- Ensure your wallet has MATIC tokens
- Current gas fees are typically 0.001-0.01 MATIC per transaction
- Recommended: Keep at least 10-20 MATIC in the wallet

#### 4. "Invalid PRIVATE_KEY format"
- Private key must be exactly 64 hexadecimal characters
- Must start with `0x`
- Example: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

### Debug Steps

1. **Check Environment Variables**:
   ```bash
   # In your terminal
   echo $PRIVATE_KEY
   echo $POLYGON_RPC
   ```

2. **Verify RPC Connectivity**:
   ```bash
   # Test if you can reach Polygon RPC
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     https://polygon.llamarpc.com
   ```

3. **Check Server Logs**:
   - Look for `[polygon-provider]` and `[API/anchor]` log messages
   - These will show which RPC endpoints are being tried

## Security Considerations

1. **Private Key Security**:
   - Never commit `.env.local` to version control
   - Use environment variables in production
   - Consider using a hardware security module (HSM) for production

2. **Network Security**:
   - Ensure your server is secure
   - Use HTTPS in production
   - Consider rate limiting on the anchor API

3. **Gas Fee Management**:
   - Monitor wallet balance regularly
   - Set up alerts for low balance
   - Consider implementing gas price optimization

## Production Deployment

1. **Environment Variables**: Set environment variables on your production server
2. **RPC Reliability**: Use premium RPC services (Alchemy, Infura) for production
3. **Monitoring**: Set up monitoring for transaction success rates
4. **Backup**: Have backup RPC endpoints configured

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review server logs for error messages
3. Verify your environment configuration
4. Test with a simple transaction first
5. Contact support with specific error messages

## Example Configuration

Here's a complete `.env.local` example:

```bash
# Blockchain Configuration
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
POLYGON_RPC=https://polygon.llamarpc.com
ANCHOR_ADMIN_TOKEN=your_random_token_here

# Optional Premium RPC
ALCHEMY_API_KEY=your_alchemy_key
INFURA_PROJECT_ID=your_infura_id
```

Remember to replace the placeholder values with your actual configuration!









