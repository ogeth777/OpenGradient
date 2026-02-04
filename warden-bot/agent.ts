import "dotenv/config";
import { terminal_chart, terminal_battle, terminal_trending, terminal_yield, terminal_risk, terminal_portfolio, terminal_top_gainers, terminal_quote, terminal_swap, execute_swap, terminal_balance, terminal_wallet_status, terminal_gas, terminal_whale_watch, terminal_bridge, terminal_airdrops, terminal_gem_hunter, fetchTopGainers, fetchTrendingTokens, checkEthBalance, fetchTokenBalance, fetchAgentWallet } from "./tools";

// Export the processing function for API usage
export async function processAgentRequest(userPrompt: string, userAddress?: string, history: any[] = []) {
  // 0. Immediate Interception for UI Commands
  if (userPrompt === "START_RISK_ANALYSIS") {
      return "Let's get the ball rolling. Which token on Base are you looking at? I need the token's name or symbol to fetch its metadata.";
  }

  const lowerPrompt = userPrompt.toLowerCase().trim();

  // 0.1 Greeting / Menu Interception
          const greetings = ["hello", "hi", "hey", "start", "menu", "help", "commands", "привет", "меню"];
          if (lowerPrompt.startsWith("whale")) {
      const token = lowerPrompt.replace("whale", "").trim();
      if (!token) return "⚠️ Please specify a token. Example: `Whale TOSHI`";
      
      try {
          const rawResult = await terminal_whale_watch.invoke({ token });
          const data = JSON.parse(rawResult);
          
          if (data.error) return `❌ ${data.error}`;
          if (data.whales.length === 0) return `🐋 **Whale Watch: ${data.token}**\n\n*No large transactions (> $500) detected in the last ${data.block_range} blocks.*`;

          let output = `🐋 **Whale Watch: ${data.token}**\n`;
          output += `💎 Price: $${data.price.toFixed(6)}\n`;
          output += `🔍 Scanned Last ${data.block_range} Blocks (~1.5 mins)\n\n`;

          data.whales.forEach((w: any, i: number) => {
              const emoji = w.usd > 5000 ? "🚨" : "👀";
              output += `${emoji} **$${w.usd.toFixed(2)}** (${w.amount.toFixed(0)} ${data.token})\n`;
              output += `   From: \`${w.from.slice(0,6)}...${w.from.slice(-4)}\`\n`;
              output += `   To:   \`${w.to.slice(0,6)}...${w.to.slice(-4)}\`\n`;
              output += `   🔗 [Tx](https://basescan.org/tx/${w.hash})\n\n`;
          });

          return output;
      } catch (e: any) {
          return `Error watching whales: ${e.message}`;
      }
  }

  if (lowerPrompt === "gem" || lowerPrompt.includes("gem hunter")) {
      const chain = lowerPrompt.includes("solana") ? "solana" : "base";
      try {
          const rawResult = await terminal_gem_hunter.invoke({ chain });
          const data = JSON.parse(rawResult);

          if (data.error) return `❌ ${data.error}`;

          let output = `💎 **HIDDEN GEM HUNTER (${chain.toUpperCase()})**\n`;
          output += `*Criteria: Market Cap < $5M, Volume > $5k, High Momentum*\n\n`;

          data.tokens.forEach((t: any, i: number) => {
              const mcap = t.market_cap ? (t.market_cap / 1000).toFixed(1) + "k" : "N/A";
              const vol = t.volume_24h ? (t.volume_24h / 1000).toFixed(1) + "k" : "N/A";
              const changeEmoji = t.change_24h >= 0 ? "🟢" : "🔴";
              
              output += `**${i+1}. ${t.name}** ($${t.symbol})\n`;
              output += `   💵 Price: $${t.price} | 🧢 MC: $${mcap}\n`;
              output += `   📊 Vol: $${vol} | ${changeEmoji} 24h: ${t.change_24h}%\n`;
              output += `   🔗 [DexScreener](${t.url})\n\n`;
          });

          return output;
      } catch (e: any) {
          return `Error fetching gems: ${e.message}`;
      }
  }

  if (lowerPrompt.startsWith("chart") || lowerPrompt.startsWith("graph")) {
      const token = lowerPrompt.replace("chart", "").replace("graph", "").trim();
      if (!token) return "⚠️ Please specify a token. Example: `Chart ETH` or `Chart 0x...`";
      
      try {
          const result = await terminal_chart.invoke({ token });
          return result;
      } catch (e: any) {
          return `Error generating chart: ${e.message}`;
      }
  }

  if (lowerPrompt.startsWith("battle") || lowerPrompt.startsWith("vs")) {
      const parts = lowerPrompt.replace("battle", "").replace("vs", " ").split(" ").filter(p => p.trim() !== "");
      if (parts.length < 2) return "⚠️ Please specify two tokens. Example: `Battle ETH vs BTC`";
      
      try {
          const result = await terminal_battle.invoke({ tokenA: parts[0], tokenB: parts[1] });
          return result;
      } catch (e: any) {
          return `Error in battle: ${e.message}`;
      }
  }

  if (greetings.includes(lowerPrompt)) {
              return `**🤖 TERMINAL AI (Official Warden Agent)**

**🔥 MARKET ANALYSIS**
- **Trend**: Top trending tokens on Base
- **Gainers**: Top 24h gainers
- **Risk [token]**: Security scan (Honeypot/Rug check)
- **Whale [token]**: Live large transaction tracking 🐋
- **Yield**: Best farming pools on Base
- **Gem**: Find hidden gems (Low Cap/High Volume) 💎
- **Chart [token]**: ASCII Price Chart (24h) 📈
   *(Try: Chart ETH, Chart BTC, Chart SOL)*
- **Battle [A] [B]**: Compare two tokens ⚔️
- **Gas**: Real-time network gas price & swap cost

**🌉 CROSS-CHAIN**
- **Bridge**: Top bridges (Relay, Jumper, deBridge)

**🎁 AIRDROPS**
- **Airdrops**: Potential Airdrops Dashboard

**💰 WALLET TRACKER**
- **DeBank [address]**: Track any EVM portfolio (Assets, DeFi, History)

**🌐 WARDEN PROTOCOL**
- [Official Website](https://wardenprotocol.org/)
- [Discord Community](https://discord.com/invite/wardenprotocol)
- [Link3 Profile](https://link3.to/wardenprotocol)

*Type a command to proceed.*`;
          }

  // 0.2 Command Interception (Direct Tool Execution for Speed & Reliability)
  if (lowerPrompt.includes("trend") || lowerPrompt.includes("hot")) {
     const chain = lowerPrompt.includes("solana") ? "solana" : "base";
     const rawResult = await fetchTrendingTokens(chain);
     
     if ('error' in rawResult && rawResult.error) return rawResult.error;

     const textList = rawResult.tokens.map((t: any, i: number) => {
        const change1h = t.change_1h !== undefined ? t.change_1h : 0;
        const changeEmoji1h = change1h >= 0 ? "🟢" : "🔴";
        const change24h = t.change_24h !== undefined ? t.change_24h : 0;
        const changeEmoji24h = change24h >= 0 ? "🟢" : "🔴";

        // Use minimalist format but with requested data points
        const price = typeof t.price === 'number' ? t.price.toFixed(6) : t.price;
        const mcap = typeof t.market_cap === 'number' ? (t.market_cap / 1000000).toFixed(2) + "M" : t.market_cap;
        
        return `**${i+1}. ${t.name}** \`${t.address}\` (Symbol: ${t.symbol})\n` +
               `   💵 Price: $${price} | 💎 MC: $${mcap}\n` +
               `   🕒 1h: ${changeEmoji1h} **${change1h.toFixed(2)}%** | 📅 24h: ${changeEmoji24h} **${change24h.toFixed(2)}%**`;
     }).join("\n\n");

     const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
     return `🔥 **TRENDING ON BASE (Live)**\n*Last Update: ${time}*\n\n${textList}`;
  }

  if (lowerPrompt.includes("gainers") || lowerPrompt.includes("top") || lowerPrompt.includes("grew")) {
      const chain = lowerPrompt.includes("solana") ? "solana" : "base";
      const rawResult = await fetchTopGainers(chain);
      if ('error' in rawResult && rawResult.error) return rawResult.error;

      const textList = rawResult.tokens.map((t: any, i: number) => {
         const changeEmoji = t.price_change_percentage_24h >= 0 ? "🟢" : "🔴";
         const price = typeof t.current_price === 'number' ? t.current_price.toFixed(6) : t.current_price;
         const mcap = typeof t.market_cap === 'number' ? (t.market_cap / 1000000).toFixed(2) + "M" : t.market_cap;
         
         return `**${i+1}. ${t.name}** ($${t.symbol})\n` +
                `   ${changeEmoji} **${t.price_change_percentage_24h.toFixed(2)}%**  |  💵 $${price}  |  💎 MC: $${mcap}\n` +
                `   🔗 [Trade](${t.trade_url}) | 📊 [CoinGecko](${t.link}) | 🛡️ [Scan](${t.security_url})`;
      }).join("\n\n");

      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
      return `🚀 **TOP GAINERS (24h) ON ${chain ? chain.toUpperCase() : 'BASE'}**\n*Last Update: ${time}*\n\n${textList}`;
  }

  if (lowerPrompt.includes("gas") || lowerPrompt.includes("fees") || lowerPrompt.includes("gwei")) {
     const chain = lowerPrompt.includes("solana") ? "solana" : "base";
     try {
         const rawResult = await terminal_gas.invoke({ chain });
         const data = JSON.parse(rawResult);
         
         if (data.error) return `❌ Error fetching gas: ${data.error}`;

         return `⛽ **Base Network Gas Status**\n\n` +
                `📊 Status: ${data.status}\n` +
                `🔥 Gas Price: **${data.gwei} Gwei**\n` +
                `💸 Est. Swap Cost: **${data.swap_cost_eth} ETH**\n\n` +
                `*Low gas fees make it a great time to trade!*`;
     } catch (e: any) {
         return `Error fetching gas: ${e.message}`;
     }
  }

  if (lowerPrompt.includes("yield") || lowerPrompt.includes("farming") || lowerPrompt.includes("apy")) {
     const chain = lowerPrompt.includes("solana") ? "solana" : "base";
     try {
         // Invoke tool directly to get JSON string
         const rawResult = await terminal_yield.invoke({ chain });
         
         // Parse JSON
         const data = JSON.parse(rawResult);
         
         if (Array.isArray(data)) {
            if (data.length === 0 || (data.length === 1 && data[0].pool === "")) {
                return `No yield opportunities found for ${chain}.`;
            }
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
            return `🌾 **Top Uniswap Yield Opportunities on ${chain}**\n` +
              `*Last Update: ${time}*\n` +
              `(Note: APR is estimated and may vary based on trading volume and fee tier.)\n\n` +
              data.map((p: any) => 
                `**${p.symbol}**\n` +
                `💰 APR: **${p.apy.toFixed(2)}%** | TVL: ${p.tvl.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}\n` +
                `🔗 [Open Uniswap Pool](${p.link})`
              ).join("\n\n");
         }
         return rawResult; // Return raw string if not array (e.g. error message)
     } catch (e: any) { 
         console.error("Yield command failed:", e);
         return `Error fetching yield data: ${e.message}`; 
     }
  }

  if (lowerPrompt.includes("risk") || lowerPrompt.includes("scan") || lowerPrompt.includes("audit")) {
      const words = userPrompt.trim().split(/\s+/);
      
      // improved token extraction logic
      let token = words.find(w => w.startsWith("0x") && w.length === 42); // Check for address first
      
      if (!token) {
          // If not address, look for symbol (uppercase usually, or just not the command words)
          // Filter out command words case-insensitively
          const commandWords = ["risk", "scan", "audit", "check", "security", "analysis"];
          const candidates = words.filter(w => !commandWords.includes(w.toLowerCase()));
          
          // Prefer uppercase or mixed case over purely lowercase if possible, but take first candidate
          if (candidates.length > 0) {
              token = candidates[0]; 
          } else {
              token = "BRETT"; // Default
          }
      }

      const chain = lowerPrompt.includes("solana") ? "solana" : "base";
      try {
        const rawResult = await terminal_risk.invoke({ token, chain });
        const data = JSON.parse(rawResult);
        
        if (data.error) return `❌ Error: ${data.error}`;

        if (data.risk_analysis) {
            return `🛡️ **SECURITY SCAN: ${data.token} (${data.symbol})**\n` +
                   `Risk Level: ${data.risk_analysis.level === "High" ? "🔴" : data.risk_analysis.level === "Medium" ? "🟡" : "🟢"} **${data.risk_analysis.level}** (${data.risk_analysis.score}/100)\n` +
                   `Price: $${data.current_price}\n` +
                   `Factors:\n` + data.risk_analysis.factors.map((f: string) => `• ${f}`).join("\n") + "\n\n" +
                   `🔗 [Coingecko](${data.link}) | [Trade](${data.trade_url}) | [Security](${data.security_url})`;
        }
        return rawResult;
      } catch (e: any) { 
          return `Error analyzing risk: ${e.message}`; 
      }
  }

  if (lowerPrompt === "bridge" || lowerPrompt === "relay") {
      const rawResult = await terminal_bridge.invoke({});
      const data = JSON.parse(rawResult);
      
      let output = `**${data.title}**\n\n`;
      data.links.forEach((l: any) => {
          output += `🔗 [${l.name}](${l.url})\n`;
      });
      return output;
  }

  if (lowerPrompt === "airdrop" || lowerPrompt === "airdrops") {
      return await terminal_airdrops.invoke({}) as string;
  }

  if (lowerPrompt.includes("debank") || lowerPrompt.includes("wallet") || lowerPrompt.includes("portfolio")) {
     // Check if user wants Agent's internal wallet
     if (lowerPrompt.includes("agent") || lowerPrompt === "internal wallet") {
        return await terminal_wallet_status.invoke({}) as string;
     }

     const words = userPrompt.split(" "); // Use original case for address if needed, though addresses are hex
     const addressMatch = userPrompt.match(/0x[a-fA-F0-9]{40}/);
     const address = addressMatch ? addressMatch[0] : null;
     
     if (!address) {
         return `🎒 **DeBank Portfolio Tracker**\n\n` +
                `Please provide an EVM address to track.\n` +
                `Usage: \`DeBank 0x...\` or \`Wallet 0x...\`\n\n` +
                `*Tip: You can paste any user's address to see their net worth, assets, and DeFi positions.*`;
     }
     
     return `🎒 **DeBank Portfolio Tracker**\n\n` +
            `👤 Address: \`${address}\`\n` +
            `🔗 [**Open DeBank Profile**](https://debank.com/profile/${address})\n\n` +
            `*Click the link above to view full portfolio analytics.*`;
  }

  if (lowerPrompt.includes("balance")) {
     const words = lowerPrompt.split(" ");
     const addressMatch = userPrompt.match(/0x[a-fA-F0-9]{40}/);
     const address = addressMatch ? addressMatch[0] : undefined;
     const token = words.find(w => w.toUpperCase() === w && w.length >= 2 && !["BALANCE", "CHECK"].includes(w.toUpperCase())) || "ETH";
     
     if (!address) {
         return "Please provide a wallet address to check balance. Usage: `Balance [address] [token]`";
     }
     
     return await terminal_balance.invoke({ token, address }) as string;
  }

  try {
    const { WardenAgentKit } = await import("@wardenprotocol/warden-agent-kit-core");
    const { WardenToolkit } = await import("@wardenprotocol/warden-langchain");
    const { createReactAgent } = await import("@langchain/langgraph/prebuilt");
    const { ChatOpenAI } = await import("@langchain/openai");

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("PRIVATE_KEY not found in environment variables");
        return "**SYSTEM ERROR: WALLET NOT CONFIGURED.**\n\nAccess denied. Please contact administrator to configure the Agent Wallet (PRIVATE_KEY).";
    }

    const config = { privateKeyOrAccount: privateKey as `0x${string}` };
    const agentKit = new WardenAgentKit(config);
    const wardenToolkit = new WardenToolkit(agentKit);
    const tools = [
      ...wardenToolkit.getTools(),
      terminal_trending,
      terminal_yield,
      terminal_risk,
      terminal_portfolio,
      terminal_top_gainers,
      terminal_balance,
      terminal_gas,
      terminal_whale_watch,
      terminal_bridge,
      terminal_airdrops,
      terminal_gem_hunter,
      terminal_chart
    ];

            const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });
    const agent = createReactAgent({ llm, tools: tools as any });

    const systemMessage = {
              role: "system",
              content: `You are a Trae-built Warden Custom Swap Agent for Base chain swaps via Uniswap API.
NEVER output JSON, XML, <SWAP_TX>, structured tags or raw data in chat messages. Always respond in plain, friendly text.

**CRITICAL: DISPLAYING LINKS**
When tools return data with links (e.g., 'link', 'trade_url', 'security_url'), you MUST include them in your response.
- Use Markdown format: [Link Text](url)
- For Tokens: Include [Chart/View](link) and [Trade](trade_url) if available.
- For Pools: Include [Open Pool](link).
- For Risk: Include [View on CoinGecko](link).
- NEVER strip these links. They are essential for the user.

IMPORTANT: You are an "Autonomous Agent" with your own internal wallet.
- You CANNOT access the user's wallet (MetaMask) directly due to platform security.
- You CAN only trade funds that are in your own internal wallet.
- If user wants to swap, check YOUR internal wallet balance (use 'get_agent_wallet').
- If balance is low, tell the user: "I need funds to trade. Please deposit ETH to my address: [your_address]"

When user asks for swap:
1. Check 'get_agent_wallet' to see if YOU have funds.
2. If funds ok, Parse amount, tokenIn, tokenOut.
3. Say: "Setting up efficient swap of [amount] [tokenIn] for [tokenOut] on Base... Optimal routing!"
4. Call 'uniswap_quote' tool to get the rate/details.
5. Reply with text preview: 
   "Selling: [amount] [tokenIn]
    Receiving: ~[est output] [tokenOut]
    Gas: ~$0.XX
    Rate: 1 [tokenIn] ≈ [rate] [tokenOut]
    Chain: Base
    
    Do you want to proceed? Reply APPROVE to confirm or REJECT to cancel."

6. If user says APPROVE:
   - Call 'execute_swap' tool.
   - Show success summary from the tool output.

7. If user says REJECT:
   - Say "Swap cancelled."

No structured output — Warden UI will not trigger from text, so we use this text-based confirmation flow.`
            };

    // Prepare messages including history if available
    const messages: any[] = [systemMessage];
    
    if (history.length > 0) {
        // Normalize history
        const normalizedHistory = history.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        }));
        messages.push(...normalizedHistory);
    }
    
    // Add current user prompt (ensure it's not duplicated if history already contains it)
    const lastHistoryMsg = history.length > 0 ? history[history.length - 1] : null;
    if (!lastHistoryMsg || lastHistoryMsg.content !== userPrompt) {
        messages.push({ role: "user", content: userPrompt });
    }

    try {
      const result = await agent.invoke({
        messages: messages,
      });
      return result.messages[result.messages.length - 1].content;
    } catch (invokeError: any) {
      console.error("Agent invocation failed:", invokeError);
      // Fallback Logic
      if (invokeError.message.includes("429") || invokeError.message.includes("Quota")) {
        const lowerPrompt = userPrompt.toLowerCase();
        
        if (lowerPrompt.includes("top gainers") || lowerPrompt.includes("grew") || lowerPrompt.includes("increase")) {
           const chain = lowerPrompt.includes("base") ? "base" : lowerPrompt.includes("solana") ? "solana" : undefined;
           const rawResult = await fetchTopGainers(chain);
           
           if ('error' in rawResult && rawResult.error) return rawResult.error;

           const textList = rawResult.tokens.map((t: any, i: number) => {
              const changeEmoji = t.price_change_percentage_24h >= 0 ? "🟢" : "🔴";
              const price = typeof t.current_price === 'number' ? t.current_price.toFixed(6) : t.current_price;
              const mcap = typeof t.market_cap === 'number' ? (t.market_cap / 1000000).toFixed(2) + "M" : t.market_cap;
              
              return `**${i+1}. ${t.name}** ($${t.symbol})\n` +
                     `   ${changeEmoji} **${t.price_change_percentage_24h.toFixed(2)}%**  |  💵 $${price}  |  💎 MC: $${mcap}\n` +
                     `   🔗 [Trade](${t.trade_url}) | 📊 [CoinGecko](${t.link}) | 🛡️ [Scan](${t.security_url})`;
           }).join("\n\n");

           const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
           return `🚀 **TOP GAINERS (24h) ON ${chain ? chain.toUpperCase() : 'BASE'}**\n*Last Update: ${time}*\n\n${textList}`;
        }
        else if (lowerPrompt.includes("yield") || lowerPrompt.includes("farming") || lowerPrompt.includes("apy")) {
           const chain = lowerPrompt.includes("solana") ? "solana" : "base";
           const rawResult = await terminal_yield.invoke({ chain }) as string;
           try {
             const data = JSON.parse(rawResult);
             if (Array.isArray(data)) {
                if (data.length === 0 || (data.length === 1 && data[0].pool === "")) {
                    return `No yield opportunities found for ${chain}.`;
                }
                const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
                return `🌾 **Top Uniswap Yield Opportunities on ${chain}**\n` + 
                  `*Last Update: ${time}*\n\n` +
                  data.map((p: any) => 
                    `**${p.symbol}**\n` +
                    `💰 APR: **${p.apy.toFixed(2)}%** | TVL: ${p.tvl.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}\n` +
                    `🔗 [Open Uniswap Pool](${p.link})`
                  ).join("\n\n");
             }
             return rawResult;
           } catch { return rawResult; }
        } 
        else if (lowerPrompt.includes("trending") || lowerPrompt.includes("hot")) {
           const chain = lowerPrompt.includes("solana") ? "solana" : "base";
           const rawResult = await fetchTrendingTokens(chain);
           
           if ('error' in rawResult && rawResult.error) return rawResult.error;

           const textList = rawResult.tokens.map((t: any, i: number) => {
              const changeEmoji = t.change_24h >= 0 ? "🟢" : "🔴";
              const price = typeof t.price === 'number' ? t.price.toFixed(6) : t.price;
              const mcap = typeof t.market_cap === 'number' ? (t.market_cap / 1000000).toFixed(2) + "M" : t.market_cap;
              
              return `**${i+1}. ${t.name}** ($${t.symbol})\n` +
                     `   ${changeEmoji} **${t.change_24h.toFixed(2)}%**  |  💵 $${price}  |  💎 MC: $${mcap}\n` +
                     `   🔗 [Trade on Uniswap](${t.swap_link}) | 📊 [GeckoTerminal](${t.link})`;
           }).join("\n\n");

           const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
           return `🔥 **HOT ON BASE (Real-Time)**\n*Last Update: ${time}*\n\n${textList}`;
        }
        else if (lowerPrompt.includes("risk") || lowerPrompt.includes("audit") || lowerPrompt.includes("safe") || lowerPrompt.includes("security")) {
           const words = userPrompt.split(" ");
           const token = words.find(w => w === w.toUpperCase() && w.length > 2 && w !== "RISK") || "BRETT";
           const chain = lowerPrompt.includes("solana") ? "solana" : "base";
           const rawResult = await terminal_risk.invoke({ token, chain }) as string;
           try {
             const data = JSON.parse(rawResult);
             if (data.risk_analysis) {
                 return `🛡️ **SECURITY SCAN: ${data.token} (${data.symbol})**\n` +
                        `Risk Level: ${data.risk_analysis.level === "High" ? "🔴" : data.risk_analysis.level === "Medium" ? "🟡" : "🟢"} **${data.risk_analysis.level}** (${data.risk_analysis.score}/100)\n` +
                        `Price: $${data.current_price}\n` +
                        `Factors:\n` + data.risk_analysis.factors.map((f: string) => `• ${f}`).join("\n") + "\n\n" +
                        `🔗 [Coingecko](${data.link}) | [Trade](${data.trade_url}) | [Security](${data.security_url})`;
             }
             return rawResult;
           } catch { return rawResult; }
        }
        else if (lowerPrompt.includes("balance")) {
             // Fallback for Balance
             const words = lowerPrompt.split(" ");
             // Try to find address (0x...)
             const addressMatch = userPrompt.match(/0x[a-fA-F0-9]{40}/);
             const address = addressMatch ? addressMatch[0] : undefined;
             
             // Try to find token symbol (e.g. ETH, USDC) - heuristic: 3-5 uppercase letters, or words that are not 'balance'
             // This is tricky in fallback. Default to ETH if only address provided.
             let token = "ETH";
             const potentialTokens = words.filter(w => w !== "balance" && !w.startsWith("0x") && w.length < 6);
             if (potentialTokens.length > 0) token = potentialTokens[0].toUpperCase();

             if (!address) return "To check balance, please provide a wallet address. Usage: 'Balance [address] [optional: token]'";

             try {
                 const result = await fetchTokenBalance(token, address);
                 if (result.error) return `Error checking balance: ${result.error}`;

                 return `💰 **Wallet Balance**\n` +
                        `👛 Address: \`${address}\`\n` +
                        `🪙 Token: **${token}**\n` +
                        `💵 Balance: **${parseFloat(result.balance || "0").toFixed(4)}**`;
             } catch (e: any) {
                 return `Error checking balance: ${e.message}`;
             }
        }
        else if (lowerPrompt.includes("swap") || lowerPrompt.includes("buy") || lowerPrompt.includes("sell") || lowerPrompt === "approve") {
           // Swap Fallback (Stateless/One-Shot)
           if (lowerPrompt === "approve") {
               // Try to recover swap details from history
               const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant' || m.role === 'ai');
               if (lastAssistantMsg) {
                   const content = lastAssistantMsg.content;
                   // Parse: Selling: 0.001 ETH ... Receiving: ~2.3 USDC
                   const sellMatch = content.match(/Selling:\s*(\d+\.?\d*)\s*([a-zA-Z0-9]+)/i);
                   const buyMatch = content.match(/Receiving:\s*~?([\d\.]+)\s*([a-zA-Z0-9]+)/i);

                   if (sellMatch && buyMatch) {
                       const amount = sellMatch[1];
                       const tokenIn = sellMatch[2];
                       const tokenOut = buyMatch[2]; // Group 2 is token symbol

                       try {
                           return await execute_swap.invoke({
                               tokenIn,
                               tokenOut,
                               amount,
                               chain: "base"
                           });
                       } catch (e: any) {
                           return `Error executing swap: ${e.message}`;
                       }
                   }
               }
               return "I couldn't find a pending swap quote to approve in our recent history. Please request the swap again (e.g., 'Swap 0.001 ETH for USDC').";
           }

           // Regex for: "Swap 0.001 ETH for USDC"
           const match = lowerPrompt.match(/(?:swap|buy|sell)\s+(\d+\.?\d*)\s+([a-zA-Z0-9]+)\s+(?:for|to)\s+([a-zA-Z0-9]+)/i);
           if (match) {
               const [_, amount, tokenIn, tokenOut] = match;
               try {
                   const quote = await terminal_swap.invoke({ 
                       tokenIn: tokenIn.toUpperCase(), 
                       tokenOut: tokenOut.toUpperCase(), 
                       amount: amount, 
                       chain: "base" 
                   });
                   // Return the quote text + Explicit Instruction for next step
                   return quote + "\n\n(System Note: Reply 'APPROVE' to execute transaction on-chain.)";
               } catch (e: any) {
                   return `Error fetching quote: ${e.message}`;
               }
           }
           return "To swap, please use the format: 'Swap 0.001 ETH for USDC'";
        }
        else if (lowerPrompt.includes("wallet") || lowerPrompt.includes("agent funds")) {
             const result = await fetchAgentWallet();
             if (result.error) return result.error;

             return `🤖 **Agent Internal Wallet**\n` +
                    `Address: ${result.address}\n` +
                    `Balance: ${parseFloat(result.balance_eth || "0").toFixed(4)} ETH\n` +
                    `Network: ${result.network}\n\n` +
                    `To fund this agent, send ETH (Base) to the address above.`;
        }
        else {
           // Portfolio logic check (matches keyword or address)
           const addressMatch = userPrompt.match(/0x[a-fA-F0-9]{40}/);
           const hasPortfolioKeyword = lowerPrompt.includes("portfolio");

           if (hasPortfolioKeyword) {
               // Explicit Portfolio Request
               const address = addressMatch ? addressMatch[0] : undefined;
               
               if (!address) return "To view portfolio, please provide a wallet address. Usage: 'Portfolio [address]'";

               const chain = lowerPrompt.includes("solana") ? "solana" : "base";
               
               const input: any = { chain, address };
              
               const rawResult = await terminal_portfolio.invoke(input) as string;
               try {
                   const data = JSON.parse(rawResult);
                   if (data.debank_link) {
                       return `📊 **Portfolio Analysis**\n` +
                              `👛 Address: \`${address}\`\n` +
                              `🔗 [View on DeBank](${data.debank_link})`;
                   }
                   return rawResult;
               } catch { return rawResult; }
           } 
           else if (addressMatch) {
               // Ambiguous Address Input - Try Token Risk ONLY (as per user request)
               const address = addressMatch[0];
               const chain = lowerPrompt.includes("solana") ? "solana" : "base";

               // 1. Try Token Risk Analysis
               try {
                   const riskResult = await terminal_risk.invoke({ token: address, chain }) as string;
                   const riskData = JSON.parse(riskResult);
                   
                   if (!riskData.error && riskData.risk_analysis) {
                       return `**RISK ANALYSIS: ${riskData.token} (${riskData.symbol})**\n` +
                              `Risk Level: ${riskData.risk_analysis.level} (${riskData.risk_analysis.score}/100)\n` +
                              `Price: ${riskData.current_price}\n` +
                              `Factors:\n` + riskData.risk_analysis.factors.map((f: string) => `- ${f}`).join("\n") + "\n\n" +
                              `[View on CoinGecko](${riskData.link})`;
                   } else {
                       // Token not found
                       return "Could not find token data for this address. Ensure this is a valid token contract address on Base. If you wanted to analyze a portfolio, please add the word 'portfolio' to your request.";
                   }
               } catch (e) {
                   return "Error analyzing token. Please check the address.";
               }
           }
        }
        return "I apologize, I couldn't process that request. Try asking about 'yields', 'trending tokens', 'risk analysis', or 'portfolio'.";
      }
      throw invokeError;
    }
  } catch (error: any) {
    console.error("Critical Agent Error:", error);
    return `**CRITICAL SYSTEM FAILURE**
    
Error accessing neural core: ${error.message || "Unknown Error"}

*Diagnostics:*
- Check PRIVATE_KEY configuration
- Check OpenAI API Quota
- Check Network Connectivity`;
  }
}

// CLI Execution Support
if (import.meta.url === `file://${process.argv[1]}`) {
  const prompt = process.argv[2] || "What are the trending tokens on Base?";
  processAgentRequest(prompt).then(console.log).catch(console.error);
}
