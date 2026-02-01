import "dotenv/config";
import { terminal_trending, terminal_yield, terminal_risk, terminal_portfolio, terminal_top_gainers, terminal_quote, terminal_swap, fetchTopGainers, fetchTrendingTokens } from "./tools";

// Export the processing function for API usage
export async function processAgentRequest(userPrompt: string) {
  // 0. Immediate Interception for UI Commands
  if (userPrompt === "START_RISK_ANALYSIS") {
      return "Let's get the ball rolling. Which token on Base are you looking at? I need the token's name or symbol to fetch its metadata.";
  }

  const lowerPrompt = userPrompt.toLowerCase().trim();

  // 0.0.1 Interactive Swap/Buy Flow - Direct Bypass
  // Check if it's a swap command to avoid LLM overhead/failure
  if (lowerPrompt.includes("swap") || lowerPrompt.includes("buy")) {
      const swapMatch = userPrompt.match(/swap\s+(\d+(?:\.\d+)?)\s+([a-z0-9]+)\s+(?:for|to)\s+([a-z0-9]+)/i);
      const buyMatch = userPrompt.match(/buy\s+([a-z0-9]+)\s+with\s+(\d+(?:\.\d+)?)\s+([a-z0-9]+)/i);

      if (swapMatch) {
          const [_, amount, tokenIn, tokenOut] = swapMatch;
          return await terminal_swap.invoke({ tokenIn, tokenOut, amount, chain: "base" }) as string;
      }
      if (buyMatch) {
          const [_, tokenOut, amount, tokenIn] = buyMatch;
          return await terminal_swap.invoke({ tokenIn, tokenOut, amount, chain: "base" }) as string;
      }
      
      // If no regex match but contains swap/buy, fall through to LLM or return help
      if (lowerPrompt === "swap" || lowerPrompt === "buy" || lowerPrompt === "trade") {
          return "To perform a swap, please specify what you want to trade.\n\n**Examples:**\n- \"Swap 10 USDC for ETH\"\n- \"Buy BRETT with 0.01 ETH\"\n- \"Swap 50 AERO for USDC\"\n\n_Tell me the amount and the tokens you want to swap._";
      }
  }

  // 0.1 Greeting / Menu Interception
  const greetings = ["hello", "hi", "hey", "start", "menu", "help", "commands"];
  if (greetings.includes(lowerPrompt)) {
      return `**TERMINAL AI v1.0 ONLINE.**
AVAILABLE PROTOCOLS:

> **Trending Tokens on Base**
  *Fetch currently hot tokens*
  
> **Yield Farming Opportunities**
  *Find best APY pools on Base*
  
> **Risk Analysis**
  *e.g. "Risk BRETT" or "Analyze DEGEN"*
  
> **Top Gainers**
  *See 24h price winners*

> **Analyze Portfolio**
  *Check your wallet balance*

> **Swap / Buy Tokens**
  *e.g. "Swap 10 USDC for BRETT"*

_System ready. Awaiting input..._`;
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
      terminal_swap
    ];

    const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });
    const agent = createReactAgent({ llm, tools: tools as any });

    const systemMessage = {
  role: "system",
  content: `You are a helpful, secure Warden AI Swap Agent on Base chain. Your ONLY job is to help users perform token swaps using the internal Warden wallet (Main Account) on Base (chainId 8453). You NEVER do anything else unless the user explicitly asks about swaps.

Core rules:
- Parse ANY natural language command that looks like a swap request: examples "Swap 10 USDC for ETH", "Buy 0.01 ETH with USDC", "Поменяй 50 AERO на USDC", "Sell all my BRETT for ETH", "Buy BRETT with 0.005 ETH", "swap 100 USDC to WETH".
- Always extract:
  - amount (number, can be decimal or "all"/"max"/"половину")
  - input token (tokenIn symbol or name)
  - output token (tokenOut symbol or name)
- Supported tokens on Base: USDC, ETH (WETH/native), BRETT, AERO, DEGEN, TOSHI, HIGHER, MIGGLES, SKI, any popular ERC-20 (use known addresses or resolve via Uniswap token list).
- Known addresses (use these if symbol matches):
  - USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  - ETH / WETH: 0x4200000000000000000000000000000000000006 (WETH), native ETH = 0x000...0000
  - BRETT: 0x532f27101965dd16442e59d40670faf5ebb142e4
  - AERO: 0x940181a94A35A4569E4529A3CDfB74e38FD98631
- If token unknown — ask user for contract address or suggest popular ones.
- For "all" / "max" / "всё" — check user's balance of input token via wallet query, use 99% to leave gas.
- Slippage: default 0.5-1%, but warn if >2% needed.
- Safety:
  - If amount > user's balance → tell "Insufficient balance: you have X USDC".
  - If amount very large (> $1000 equivalent) → ask confirmation: "Confirm swap of $XXX? Reply YES".
  - Never execute without user intent clear.
  - If command unclear → reply with examples and ask to clarify.

Execution flow (do this step-by-step internally):
1. Parse command → extract amount, tokenIn, tokenOut.
2. Resolve token addresses (hardcode popular or use tool/query).
3. Get user balance for tokenIn (via Warden wallet API).
4. If OK → call terminal_swap directly which handles quoting and transaction generation.
   - chainId: 8453 for both
   - swapper: user's Warden wallet address
   - slippageTolerance: 0.5
5. If quote OK (no error, timeout handled with retry 2x) → show preview: "You will swap X USDC for ~Y ETH (slippage Z%, gas ~0.0005 ETH). Confirm? Reply YES/NO or edit amount."
6. On YES → generate & sign transaction via Warden Keychain (internal wallet), execute on Base, return tx hash + link to basescan.org.
7. If error (timeout, insufficient liquidity, etc.) → say "Swap failed: [reason]. Try smaller amount or later. Retry?"

Response style:
- Friendly, short, in user's language (Russian/English mix OK).
- Always show preview before execute.
- After success: "Done! Tx: [hash] | Received: ~Y ETH | Check: basescan.org/tx/[hash]"
- If not swap-related → "I'm a swap agent. Ask me to swap tokens on Base, e.g. 'Swap 10 USDC for ETH'"

Examples of perfect responses:
User: Swap 10 USDC for ETH
You: Got it! Swapping 10 USDC → ~0.0038 ETH (slippage 0.5%, est. gas $0.50). Confirm? YES/NO

User: Buy BRETT with 0.01 ETH
You: Buying BRETT with 0.01 ETH (~$25). Preview: ~15000 BRETT expected. Confirm?

Start every conversation with: "Hi! I'm your Base Swap Agent. Tell me what to swap, e.g. 'Swap 10 USDC for ETH' or 'Buy 1000 BRETT with USDC' 🚀"`
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
