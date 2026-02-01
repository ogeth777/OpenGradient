import "dotenv/config";
import { terminal_trending, terminal_yield, terminal_risk, terminal_portfolio, terminal_top_gainers, terminal_quote, terminal_swap, terminal_balance, fetchTopGainers, fetchTrendingTokens, checkEthBalance } from "./tools";

// Export the processing function for API usage
export async function processAgentRequest(userPrompt: string, userAddress?: string) {
  // 0. Immediate Interception for UI Commands
  if (userPrompt === "START_RISK_ANALYSIS") {
      return "Let's get the ball rolling. Which token on Base are you looking at? I need the token's name or symbol to fetch its metadata.";
  }

  const lowerPrompt = userPrompt.toLowerCase().trim();

  // 0.0.1 Interactive Swap/Buy Flow - Direct Bypass
  // Check if it's a swap command to avoid LLM overhead/failure
  if (lowerPrompt.includes("swap") || lowerPrompt.includes("buy") || lowerPrompt.includes("sell") || lowerPrompt.includes("поменяй") || lowerPrompt.includes("купи") || lowerPrompt.includes("продай")) {
      
      // CRITICAL: Check ETH Balance if address is known
      if (userAddress) {
          const ethBal = await checkEthBalance(userAddress);
          if (ethBal < 0.0005) {
              return "Недостаточно ETH для газа! Пополни баланс хотя бы 0.001 ETH и попробуй снова.";
          }
      }

      const swapMatch = userPrompt.match(/swap\s+(\d+(?:\.\d+)?)\s+([a-z0-9]+)\s+(?:for|to)\s+([a-z0-9]+)/i);
      const buyMatch = userPrompt.match(/buy\s+([a-z0-9]+)\s+with\s+(\d+(?:\.\d+)?)\s+([a-z0-9]+)/i);
      // Simple regex for "Sell X for Y"
      const sellMatch = userPrompt.match(/sell\s+(\d+(?:\.\d+)?)\s+([a-z0-9]+)\s+(?:for|to)\s+([a-z0-9]+)/i);

      if (swapMatch) {
          const [_, amount, tokenIn, tokenOut] = swapMatch;
          return await terminal_swap.invoke({ tokenIn, tokenOut, amount, chain: "base" }) as string;
      }
      if (buyMatch) {
          const [_, tokenOut, amount, tokenIn] = buyMatch;
          return await terminal_swap.invoke({ tokenIn, tokenOut, amount, chain: "base" }) as string;
      }
      if (sellMatch) {
          const [_, amount, tokenIn, tokenOut] = sellMatch;
          return await terminal_swap.invoke({ tokenIn, tokenOut, amount, chain: "base" }) as string;
      }
      
      // If no regex match but contains swap/buy, fall through to LLM
      // We removed the help text block to allow LLM to handle complex queries like "Swap all my DEGEN"
  }

  // 0.1 Greeting / Menu Interception
  const greetings = ["hello", "hi", "hey", "start", "menu", "help", "commands", "привет"];
  if (greetings.includes(lowerPrompt)) {
      return `Ready to swap tokens on Base. What's your trade?`;
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
      terminal_quote,
      terminal_swap,
      terminal_balance
    ];

    const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });
    const agent = createReactAgent({ llm, tools: tools as any });

    const systemMessage = {
      role: "system",
      content: `You are a Trae-built Warden Custom Swap Agent for Base chain swaps via Uniswap API and Warden internal wallet. NEVER output raw XML like <SWAP_TX> — always use human-readable preview messages that trigger Warden/Trae UI for approval. Mimic the built-in Uniswap agent's flow: parse command, check balances, get quote, show preview summary, require approval, execute on confirm, show success details.

Core Rules:
- Parse natural language: "Swap 0.001 ETH for USDC" → extract amount, tokenIn, tokenOut.
- Always check ETH balance >0.0005 for gas; refuse if low.
- Use Uniswap API for quote (via uniswap_quote tool); prefer WETH routing.
- Output preview as JSON-structured message for UI: {type: 'swap_preview', selling: '...', receiving: '...', gasFee: '...', rate: '...', chain: 'Base', requiresApproval: true}.
- On simulated approval: Execute tx via Warden Keychain.
- If error: Friendly message, no raw tags.
- Start: "Hi! Ready to swap on Base. What to trade?"

Execution Step-by-Step:
1. Parse input.
2. Balance checks.
3. Quote with retry (3x).
4. Reply: "Setting up efficient swap of [amount] [tokenIn] for [tokenOut]... Optimal routing!"
5. Then: JSON preview for UI card.
6. Wait approval (in Trae, simulate with user reply "Approve").
7. Execute & success summary like Uniswap: "Your swap has been successfully completed! Here are the details: Swap Summary... Transaction Details... Next Steps..."

Trae Config: Use tools for uniswap_quote, balance_query. No raw TX output — only previews.`
    };

    try {
      const result = await agent.invoke({
        messages: [systemMessage, { role: "user", content: userPrompt }],
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
           
           if (rawResult.error) return rawResult.error;

           const textList = rawResult.tokens.map((t: any) => 
              `${t.name} ${t.address} ($${t.symbol}): Price $${t.current_price}`
           ).join("\n\n");

           return `Here are the top gainers in the last 24h${chain ? ` on ${chain}` : ''}:\n\n${textList}`;
        }
        else if (lowerPrompt.includes("yield") || lowerPrompt.includes("farming") || lowerPrompt.includes("apy")) {
           const chain = lowerPrompt.includes("solana") ? "solana" : "base";
           const rawResult = await terminal_yield.invoke({ chain }) as string;
           try {
             const data = JSON.parse(rawResult);
             if (Array.isArray(data)) {
                return `Here are the best yield opportunities on ${chain}:\n\n` + 
                  data.map((p: any) => 
                    `• **${p.symbol}** (${p.project})\n  APY: ${p.apy}\n  TVL: ${p.tvl}\n  [Open Pool](${p.link})`
                  ).join("\n\n");
             }
             return rawResult;
           } catch { return rawResult; }
        } 
        else if (lowerPrompt.includes("trending") || lowerPrompt.includes("hot")) {
           const chain = lowerPrompt.includes("solana") ? "solana" : "base";
           const rawResult = await fetchTrendingTokens(chain);
           
           if (rawResult.error) return rawResult.error;

           const textList = rawResult.tokens.map((t: any) => 
              `${t.name} ${t.address} ($${t.symbol}): Price $${t.current_price}`
           ).join("\n\n");

           return `Here are the trending tokens on ${chain} right now:\n\n${textList}`;
        }
        else if (lowerPrompt.includes("risk") || lowerPrompt.includes("audit") || lowerPrompt.includes("safe") || lowerPrompt.includes("security")) {
           const words = userPrompt.split(" ");
           const token = words.find(w => w === w.toUpperCase() && w.length > 2 && w !== "RISK") || "BRETT";
           const chain = lowerPrompt.includes("solana") ? "solana" : "base";
           const rawResult = await terminal_risk.invoke({ token, chain }) as string;
           try {
             const data = JSON.parse(rawResult);
             if (data.risk_analysis) {
                 return `**RISK ANALYSIS: ${data.token} (${data.symbol})**\n` +
                        `Risk Level: ${data.risk_analysis.level} (${data.risk_analysis.score}/100)\n` +
                        `Price: ${data.current_price}\n` +
                        `Factors:\n` + data.risk_analysis.factors.map((f: string) => `- ${f}`).join("\n") + "\n\n" +
                        `[View on CoinGecko](${data.link})`;
             }
             return rawResult;
           } catch { return rawResult; }
        }
        else {
           // Portfolio logic check (matches keyword or address)
           const addressMatch = userPrompt.match(/0x[a-fA-F0-9]{40}/);
           const hasPortfolioKeyword = lowerPrompt.includes("portfolio");

           if (hasPortfolioKeyword) {
               // Explicit Portfolio Request
               const address = addressMatch ? addressMatch[0] : undefined;
               const chain = lowerPrompt.includes("solana") ? "solana" : "base";
               
               const input: any = { chain };
               if (address) input.address = address;
              
               const rawResult = await terminal_portfolio.invoke(input) as string;
               try {
                   const data = JSON.parse(rawResult);
                   if (data.debank_link) {
                       return `**PORTFOLIO ANALYSIS**\n\n${data.action}\n\n[Open DeBank Profile](${data.debank_link})`;
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
