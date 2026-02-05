# 🌌 OpenGradient

> **The Decentralized AI Intelligence Layer on Base 🔵**
> *Building the Future of AI on Blockchain, Simplified.*

![OpenGradient Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Network](https://img.shields.io/badge/Network-Base_L2-0052FF)

**OpenGradient** is a comprehensive ecosystem of decentralized AI products designed to bridge the gap between complex blockchain technology and user-friendly intelligence. We provide a suite of tools that empower users with institutional-grade analytics, social AI twins, and autonomous agents.

---

## 🌐 OpenGradient Ecosystem

Our platform features three core pillars:

*   **🧠 MemSync AI:** The "Second Brain" for your AI agents. Connects agents to a decentralized knowledge base to remember, learn, and share insights securely on-chain.
*   **⚡ BitQuant:** Institutional-grade analytics. Real-time forensics, risk analysis, and market intelligence for the Base network.
*   **👥 Twin.fun:** Social AI Agents. Create and customize AI twins that interact and grow with your community.

> **Live Ecosystem Demo:** [OpenGradient Community](https://opengradient-community.vercel.app/)

---

## 🤖 Terminal AI (Warden Bot)

**Terminal AI** is the autonomous engine powering the OpenGradient forensic capabilities. Built for the **Warden Agent Hub**, it cuts through market noise to provide real-time forensics, risk analysis, and trading insights.

**Key Capabilities:**
*   **Forensics:** Real-time contract scanning and risk analysis.
*   **Charting:** Live ASCII charts for market tracking.
*   **Execution:** Optimized for Base L2 speed and cost.

> **Access Terminal:** `/terminal` (Local) or via the Warden Protocol interface.

Designed for the **OpenGradient** ecosystem, this agent represents the next generation of "vibe coding" — robust, secure, and incredibly fast.

---

## ✨ Visual Intelligence & Forensics

Unlike simple chatbots, this tool doesn't just read prices; it analyzes on-chain behavior in real-time.

*   **🛡️ Security First:** Instant `Risk Analysis` scans contracts for honeypots and rug pulls before you trade.
*   **🐋 Whale Watch:** Live monitoring of large transactions (>$500). See what the "smart money" is doing in real-time.
*   **📈 Live Terminal Charts:** Generate instant ASCII price charts for **ETH, BTC, SOL** and any **Base Token** directly in the command line.
*   **⚡ Speed:** Optimized for the Base L2 network — cheap gas, fast data, instant insights.
*   **🌉 Onboarding:** Direct access to the best bridges (Relay, Jumper, deBridge) to get funds onto Base in seconds.

---

## 🚀 Features & Commands

Interact with the agent using natural language or these specific commands:

| Feature | Command / Trigger | Description |
| :--- | :--- | :--- |
| **🔥 Market Trends** | `Trend` / `Hot` | Shows top trending tokens on Base live. |
| **📈 Live Charts** | `Chart <token>` | **Real-Time:** ASCII price charts (e.g., `Chart ETH`, `Chart BRETT`). |
| **🚀 Top Gainers** | `Gainers` / `Top` | Lists the biggest 24h movers. |
| **🛡️ Risk Scanner** | `Risk <token>` | Performs a security audit (Honeypot, liquidity, verified contract). |
| **🐋 Whale Watch** | `Whale <token>` | **Killer Feature:** Tracks live large buy/sell orders (>$500). |
| **💰 Portfolio** | `DeBank <address>` | Full multi-chain wallet analysis via DeBank. |
| **⛽ Gas Station** | `Gas` | Real-time Base gas fees & swap cost estimates. |
| **🌾 Yield Search** | `Yield` | Finds the best APY farming pools on Base. |
| **🌐 Warden Info** | `Menu` | Official Warden Protocol resources (Discord, Link3). |

---

## 🛠️ Tech Stack

Built strictly adhering to the **Warden Protocol** standards for the Agent Developer Incentive Program.

*   **Orchestration:** [LangGraph](https://langchain-ai.github.io/langgraph/) (Stateful, multi-turn agent logic)
*   **Blockchain SDK:** `@wardenprotocol/warden-agent-kit-core`
*   **LLM Integration:** `@wardenprotocol/warden-langchain`
*   **Frontend:** Next.js 16 + Tailwind CSS 4 (Terminal UI)
*   **Network:** Base (EVM)

---

## ⚡ Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Warden Agent Wallet Private Key (EVM)
*   OpenAI API Key

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ogeth777/OpenGradient.git
    cd OpenGradient
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    OPENAI_API_KEY=sk-your-key-here
    PRIVATE_KEY=0x... (Your Agent's Wallet Private Key)
    ```

4.  **Run the Agent**
    ```bash
    npm run dev
    ```

---

## 🔮 Roadmap

*   **Autonomous Swaps:** Agent-driven trading execution.
*   **Multi-Chain Support:** Expanding forensics to Arbitrum and Solana.
*   **Automated Alerts:** Push notifications for whale movements.
*   **OpenGradient Integration:** Advanced decentralized compute for risk modeling.

---

## 📄 License

MIT License. Built for the Warden Protocol Community.
