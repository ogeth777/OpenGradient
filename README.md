# Terminal Ai

NEXUS AI TERMINAL is an advanced crypto AI agent built on the **Warden Protocol**, designed to provide real-time market insights, token analysis, and yield farming opportunities on Base and Solana networks.

## 🚀 Tech Stack

- **Agent Framework:** [LangGraph](https://langchain-ai.github.io/langgraph/) (via `@langchain/langgraph`)
- **Blockchain Integration:** [Warden Agent Kit](https://docs.wardenprotocol.org/) (`@wardenprotocol/warden-agent-kit-core`)
- **LLM Orchestration:** [LangChain](https://js.langchain.com/) (`@wardenprotocol/warden-langchain`)
- **Frontend:** Next.js 15 + React 19
- **Styling:** Tailwind CSS 4 + Framer Motion (Cyberpunk/Terminal Theme)
- **Data Sources:** CoinGecko, GeckoTerminal, DefiLlama

## ✨ Key Features

- **🤖 Autonomous Market Analysis:** Uses LangGraph to orchestrate complex reasoning about market trends.
- **📈 Real-Time Data:** Fetches live prices, trending tokens, and top gainers via custom tools.
- **🛡️ Risk Analysis:** Evaluates token safety using on-chain data and audit reports.
- **🌾 Yield Discovery:** Finds the best APY farming opportunities across supported chains.
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

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

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
