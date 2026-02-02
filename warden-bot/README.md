# 🤖 TERMINAL AI (Warden Agent)

**Terminal AI** is a powerful, autonomous trading agent built on the **Warden Protocol**. It provides real-time market analysis, security scans, yield farming opportunities, and portfolio tracking on **Base** and **Solana** networks.

Designed for the **Bitquant** style interface, Terminal AI brings institutional-grade data directly to your chat.

## ✨ Features

### 🔥 Market Analysis
- **Trend**: Get the top trending tokens on Base (real-time data from DexScreener).
  - *Command:* `Trend`
- **Gainers**: View top 24h gainers with direct trade links.
  - *Command:* `Gainers`
- **Risk Analysis**: Perform instant security audits on any token (Honeypot check, Rug pull risk).
  - *Command:* `Risk [token_address_or_symbol]`
- **Yield Farming**: Discover the best APR pools on Uniswap (Base).
  - *Command:* `Yield`

### 💰 Portfolio & Tools
- **DeBank Tracker**: Track net worth and assets for any EVM address.
  - *Command:* `DeBank [address]`
- **Bridge**: Access the official Base bridge (Relay) instantly.
  - *Command:* `Bridge`
- **Swap**: (Beta) Text-based swap execution via Agent's internal wallet.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Warden Protocol Agent Kit
- OpenAI API Key
- Private Key (for Agent Wallet)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ogeth777/TERMINALAI.git
   cd TERMINALAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=sk-...
   PRIVATE_KEY=0x...
   ```

### Running the Agent
```bash
npm start
```

## 🛠️ Tech Stack
- **Framework**: [Warden Agent Kit](https://github.com/warden-protocol/warden-agent-kit)
- **Language**: TypeScript
- **AI**: OpenAI GPT-4o
- **Data Providers**: DexScreener, CoinGecko, Uniswap, Relay

## 📂 Project Structure
- `agent.ts`: Main agent logic and command routing.
- `tools.ts`: Tool definitions and API integrations.
- `tests/`: Verification scripts.
- `scripts/`: Debugging and utility scripts.

## 🛡️ Safety & Quality
- **Clean Code**: Modular tool architecture.
- **Secure**: Private keys are managed via environment variables.
- **Audited**: Risk analysis tools integrated for user safety.

---
*Built with ❤️ on Warden Protocol*
