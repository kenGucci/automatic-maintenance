---
name: bankr
description: AI-powered crypto trading agent, wallet API, and LLM gateway via natural language. Use when the user wants to trade crypto, check portfolio balances and PnL, search tokens, transfer funds, manage NFTs, use leverage, bet on Polymarket, deploy tokens, or access LLM models through Bankr. Supports Base, Ethereum, Polygon, Solana, Unichain, World Chain, Arbitrum, and BNB Chain.
license: MIT
compatibility: opencode
metadata:
  homepage: https://bankr.bot
  chains: "base,ethereum,polygon,solana,unichain,worldchain,arbitrum,bnb"
---

# Bankr

Execute crypto trading and DeFi operations using natural language. Two integration options:

1. **Bankr CLI** (recommended) — Install `@bankr/cli` for a batteries-included terminal experience
2. **REST API** — Call `https://api.bankr.bot` directly from any language or tool

## CLI Command Reference

### Authentication
- `bankr whoami` — Show current auth info
- `bankr login email <address>` — Send OTP to email
- `bankr login email <address> --code <otp> --accept-terms --key-name "<name>" [--read-write] [--llm]` — Verify OTP and complete setup

### Wallet Operations
- `bankr wallet portfolio` — Portfolio balances across all chains
- `bankr wallet portfolio --pnl` — Include profit/loss
- `bankr wallet portfolio --nfts` — Include NFT holdings
- `bankr wallet portfolio --chain base,solana` — Filter by chain
- `bankr wallet portfolio --json` — Raw JSON output
- `bankr wallet transfer --to <recipient> --token <symbol> --amount <amount> --chain <chain>` — Transfer tokens
- `bankr wallet sign` — Sign messages/typed data/transactions
- `bankr wallet submit` — Submit raw transactions

### AI Agent Operations
- `bankr agent prompt "<text>"` — Send prompt to Bankr AI agent
- `bankr agent prompt --continue "<text>"` — Continue last conversation thread
- `bankr agent prompt --thread <id> "<text>"` — Continue specific thread
- `bankr agent status <jobId>` — Check job status
- `bankr agent cancel <jobId>` — Cancel running job

### Token Discovery
- `bankr tokens search <query>` — Search tokens
- `bankr tokens info <symbol-or-address>` — Token details

### LLM Gateway
- `bankr llm models` — List available models
- `bankr llm credits` — Check credit balance
- `bankr llm credits add <amount>` — Top up credits

## REST API

**Base URL:** `https://api.bankr.bot`
**Auth:** `X-API-Key` header

### Endpoints
- `GET /wallet/me` — Wallet info
- `GET /wallet/portfolio` — Portfolio balances
- `POST /wallet/transfer` — Transfer tokens
- `POST /wallet/sign` — Sign messages
- `POST /wallet/submit` — Submit transactions
- `POST /agent/prompt` — Submit AI prompt (async, returns jobId)
- `GET /agent/job/{jobId}` — Poll job status
- `POST /agent/job/{jobId}/cancel` — Cancel job

## Supported Chains
Base (ETH), Polygon (POL), Ethereum (ETH), Solana (SOL), Unichain (ETH), World Chain (ETH), Arbitrum (ETH), BNB Chain (BNB)

## Capabilities
- **Trading**: Token swaps, cross-chain bridges, limit orders, stop loss, DCA, TWAP
- **Portfolio**: Multi-chain balances, PnL tracking, NFT holdings
- **Market Research**: Prices, technical analysis, social sentiment, trending tokens
- **Transfers**: Send to 0x addresses, ENS names, social handles
- **NFTs**: Browse, search, buy via OpenSea, view portfolio, transfer, mint
- **Polymarket**: Search markets, place bets, view positions, redeem winnings
- **Leverage**: Hyperliquid (up to 50x), Avantis (up to 100x), stop loss/take profit
- **Token Deployment**: ERC20 on Base (Clanker), SPL on Solana (LaunchLab)
- **Automation**: Limit orders, stop loss, DCA, TWAP, scheduled commands
- **x402**: Discover, call, and deploy paid API endpoints
- **Web Browsing**: Built-in headless browser
- **Arbitrary Transactions**: Raw EVM calldata submission

## Example Prompts
- "What is my ETH balance?"
- "Buy $50 of ETH on Base"
- "Swap 0.1 ETH for USDC"
- "Bridge 100 USDC from Polygon to Base"
- "DCA $100 into ETH every week"
- "Long $100 of BTC on hyperliquid with 10x"
- "Launch a token called MOON on Solana"
- "What's the price of Bitcoin?"
- "Send 0.1 ETH to vitalik.eth"
- "Show my NFTs"

## Safety
- Wallet-level controls: pause transactions, daily/per-tx spending limits, recipient allowlists
- API-key controls: read-only mode, IP whitelisting, recipient allowlists
- Default: $500 daily limit, $500 per-tx limit, read-only API keys
