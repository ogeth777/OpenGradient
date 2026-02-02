# Terminal Ai

**TERMINAL AI** is an advanced crypto AI agent built on the **Warden Protocol**, designed to provide real-time market insights, on-chain forensics, and token analysis on the **Base** network.

## 🚀 Tech Stack

- **Agent Framework:** [LangGraph](https://langchain-ai.github.io/langgraph/) (via `@langchain/langgraph`)
- **Blockchain Integration:** [Warden Agent Kit](https://docs.wardenprotocol.org/) (`@wardenprotocol/warden-agent-kit-core`)
- **LLM Orchestration:** [LangChain](https://js.langchain.com/) (`@wardenprotocol/warden-langchain`)
- **Data Sources:** CoinGecko, DexScreener, DefiLlama

## ✨ Key Features

- **🤖 Autonomous Market Analysis:** Uses LangGraph to orchestrate complex reasoning about market trends.
- **📈 Real-Time Data:** Fetches live prices, trending tokens, and top gainers via custom tools.
- **🛡️ Risk Analysis:** Evaluates token safety using on-chain data and audit reports.
- **🐋 Whale Watch (Forensics):** Live tracking of large on-chain transactions (>$500) for any token on Base.
- **⛽ Gas Station:** Real-time Base network gas prices and swap cost estimation.
- **🌾 Yield Discovery:** Finds the best APY farming opportunities.
- **🌉 Cross-Chain Bridge:** Integrated official Relay bridge for fast onboarding to Base.
- **💬 Natural Language Interface:** Chat with the blockchain in plain English (or Russian).

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd opengradient
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=sk-...
   PRIVATE_KEY=0x... (Your Warden Agent Wallet Private Key)
   ```

4. **Run the Agent:**
   ```bash
   npm run dev
   ```

## 🧩 Agent Architecture

The agent is initialized in `warden-bot/agent.ts` using `createReactAgent` from LangGraph. It utilizes the Warden Toolkit to interact with the blockchain and a set of custom tools (`tools.ts`) for external data fetching.

```typescript
// Core Agent Setup
const agentKit = new WardenAgentKit(config);
const wardenToolkit = new WardenToolkit(agentKit);
const tools = [...wardenToolkit.getTools(), ...customTools];
const agent = createReactAgent({ llm, tools });
```

## 📄 License

MIT
