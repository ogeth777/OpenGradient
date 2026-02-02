import "dotenv/config";
import { terminal_trending, terminal_yield, terminal_risk, terminal_portfolio, terminal_top_gainers, terminal_quote, terminal_swap, execute_swap, terminal_balance, fetchTopGainers, fetchTrendingTokens, checkEthBalance } from "./tools";

// Export the processing function for API usage
export async function processAgentRequest(userPrompt: string, userAddress?: string, history: any[] = []) {
  // 0. Immediate Interception for UI Commands
  if (userPrompt === "START_RISK_ANALYSIS") {
      return "Let's get the ball rolling. Which token on Base are you looking at? I need the token's name or symbol to fetch its metadata.";
  }

  const lowerPrompt = userPrompt.toLowerCase().trim();

  // 0.1 Greeting / Menu Interception
          const greetings = ["hello", "hi", "hey", "start", "menu", "help", "commands", "привет", "меню"];
          if (greetings.includes(lowerPrompt)) {
              return `**🤖 TERMINAL AI V1.0**

**🔥 MARKET ANALYSIS**
- **Trend**: Top trending tokens on Base
- **Gainers**: Top 24h gainers
- **Risk [token]**: Security scan (Honeypot/Rug check)
- **Yield**: Best farming pools on Base

**💰 PORTFOLIO & WALLET**
- **Balance [address]**: Check token holdings
- **Wallet**: Check Agent's internal trading wallet
- **Portfolio [address]**: Detailed net worth analysis

**🔄 SMART TRADING**
- **Swap [amount] [token] for [token]**:
  - Get optimal route & quote
  - **NEW**: Generates direct Uniswap Link for you
  - *Agent Trading*: Executed if Agent has funds

*Type a command to proceed.*`;
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
              execute_swap,
              terminal_balance,
              terminal_wallet_status
            ];

            const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });
    const agent = createReactAgent({ llm, tools: tools as any });

    const systemMessage = {
              role: "system",
              content: `You are a Trae-built Warden Custom Swap Agent for Base chain swaps via Uniswap API.
NEVER output JSON, XML, <SWAP_TX>, structured tags or raw data in chat messages. Always respond in plain, friendly text.

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
