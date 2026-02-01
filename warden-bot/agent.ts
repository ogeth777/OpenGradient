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
      content: `You are My Swap Agent in Warden chat. When user asks to swap ANY tokens on Base:
1. Parse amount, tokenIn, tokenOut.
2. Check ETH balance for gas (User must have > 0.0005 ETH).
3. Call Uniswap/Aggregator quote API internally (via terminal_swap).
4. Reply with preview message: "Setting up efficient swap of X TOKEN for Y... Optimal routing!"
5. Then trigger approval flow: show details (selling, receiving, gas, rate, chain Base) and wait for user Approve/Reject.
6. On Approve — execute via Warden wallet.
7. On success — show summary with tx hash and Basescan link.

Always require explicit approval for security.

Key rules:
- User can say ANY swap: "Swap 100 BRETT for AERO", "Buy 5000 TOSHI with USDC", "Поменяй весь мой DEGEN на ETH", "Sell MIGGLES to USDT", "Swap 0.05 ETH for SKI" etc.
- Extract: amount (number / "all" / "max" / "всё" / "половину"), input token (symbol/name/address), output token.
- Supported: ANY ERC-20 on Base — resolve symbols to addresses automatically via Uniswap token list or known ones.
- "SWAP ALL" Logic: If user says "Swap all" or "max":
  1. Call terminal_balance(tokenIn, userAddress) to get the exact balance.
  2. If tokenIn is ETH: use 99% of balance (leave ~0.001 ETH for gas).
  3. If tokenIn is ERC20: use 100% of balance (gas is paid in ETH).
  4. Pass the calculated amount to terminal_swap.
- Safety:
  - Check input token balance — if insufficient → "У тебя только X TOKEN, не хватает."
  - For large swaps (> $500 equiv) → ask "Подтверди свап ~$XXX? YES/NO"

Response style: Professional, efficient. Start chat: "Ready to swap tokens on Base. What's your trade?"`
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
