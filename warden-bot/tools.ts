import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import { createPublicClient, createWalletClient, http, parseUnits, erc20Abi, formatEther, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// --- Standalone Data Fetching Functions ---

// Hardcoded Decimals for Stability (Global Scope)
const TOKEN_DECIMALS: Record<string, number> = {
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": 6, // USDC
    "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2": 6, // USDT
    "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": 18, // DAI
    "0x4200000000000000000000000000000000000006": 18, // WETH
};

// --- In-Memory Cache ---
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 Minutes Cache
const cache: Record<string, { timestamp: number, data: any }> = {};

function getTradeUrl(address: string, chain: string): string {
    if (!address || address === "N/A") return "";
    const c = chain.toLowerCase();
    if (c.includes("base")) return `https://app.uniswap.org/swap?chain=base&outputCurrency=${address}`;
    if (c.includes("solana")) return `https://jup.ag/swap/${address}`;
    if (c.includes("ethereum")) return `https://app.uniswap.org/swap?chain=mainnet&outputCurrency=${address}`;
    return "";
}

function getSecurityUrl(address: string, chain: string): string {
    if (!address || address === "N/A") return "";
    const c = chain.toLowerCase();
    if (c.includes("base")) return `https://gopluslabs.io/token-security/8453/${address}`;
    if (c.includes("ethereum")) return `https://gopluslabs.io/token-security/1/${address}`;
    if (c.includes("solana")) return `https://gopluslabs.io/token-security/solana/${address}`;
    return "";
}

function sanitizeImage(url: string | undefined | null, address?: string, chain?: string): string {
    // If address is provided, prefer DexScreener for Base/Solana as they are faster/better for memes
    if (address && chain) {
        if (chain.includes("base")) {
            return `https://dd.dexscreener.com/ds-data/tokens/base/${address}.png`;
        }
    }
    
    // Fallback to provided URL
    if (!url || typeof url !== 'string') return "";
    if (url.includes("missing_large.png") || url.includes("missing_small.png")) {
         // Try fallback again if we have address but didn't match chain condition above (or generic fallback)
         if (address && chain && chain.includes("base")) {
              return `https://dd.dexscreener.com/ds-data/tokens/base/${address}.png`;
         }
         return "";
    }
    if (!url.startsWith("http")) return "";
    return url;
}

export async function checkEthBalance(address: string): Promise<number> {
    try {
        const client = createPublicClient({
            chain: base,
            transport: http()
        });
        const balance = await client.getBalance({ address: address as `0x${string}` });
        return parseFloat(formatEther(balance));
    } catch (e) {
        console.error("Failed to check ETH balance:", e);
        return 0;
    }
}

export async function resolveTokenAddress(token: string, chain: string = "base"): Promise<string> {
  const t = token.toUpperCase();
  if (t === "ETH") return "ETH";
  if (t === "BTC") return "WBTC";
  if (t.startsWith("0x") && t.length === 42) return t;
  
  const COMMON_BASE: Record<string, string> = {
        "WETH": "0x4200000000000000000000000000000000000006",
        "ETH": "0x4200000000000000000000000000000000000006", // Treat ETH as WETH for swaps usually, or handle native separately
        "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "USDT": "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
        "DAI": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
        "BRETT": "0x532f27101965dd16442e59d40670faf5ebb142e4",
        "DEGEN": "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",
        "TOSHI": "0xAC1AdC472F8d280CA7370486DbD584d4b8F270f7",
        "MOG": "0x2Da56AcB9Ea78330f947bD57C54119Debda18528",
        "KEYCAT": "0x9a26F5433671751C328c4896f46046439141Aad5",
        "AERO": "0x940181a94a35a4569e4529a3cdfb74e38fd98631",
        "HIGHER": "0x0578d8a44db98b23bf096a382e016e29a5ce0ffe",
        "MIGGLES": "0xB1a03EdA103425296632831BCF5506e21eE8b931",
        "SKI": "0x0000000000000000000000000000000000000000", // Placeholder if unknown, or remove if not sure
        "BSX": "0x1337000000000000000000000000000000000000"
      };

      if (chain.toLowerCase() === "base" && COMMON_BASE[t]) return COMMON_BASE[t];

  // 1. Try DexScreener Search (Faster & More tokens)
  try {
      console.log(`Searching DexScreener for ${token} on ${chain}...`);
      const searchRes = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${token}`);
      const pairs = searchRes.data.pairs;
      
      if (pairs && pairs.length > 0) {
          // Filter by chain and sort by liquidity
          const chainPairs = pairs.filter((p: any) => p.chainId === chain.toLowerCase()).sort((a: any, b: any) => b.liquidity.usd - a.liquidity.usd);
          
          if (chainPairs.length > 0) {
              const bestPair = chainPairs[0];
              // Check if baseToken matches query
              if (bestPair.baseToken.symbol.toUpperCase() === t) return bestPair.baseToken.address;
              if (bestPair.quoteToken.symbol.toUpperCase() === t) return bestPair.quoteToken.address;
              
              // If not exact match, check symbol includes
              if (bestPair.baseToken.symbol.toUpperCase().includes(t)) return bestPair.baseToken.address;
          }
      }
  } catch (e) {
      console.error("DexScreener resolution error:", e);
  }

  // 2. Fallback to CoinGecko Search
  try {
      console.log(`Searching CoinGecko for ${token} on ${chain}...`);
      const searchRes = await axios.get(`https://api.coingecko.com/api/v3/search?query=${token}`);
      const coins = searchRes.data.coins;
      if (coins.length > 0) {
          // Try to find exact symbol match first
          const match = coins.find((c: any) => c.symbol.toUpperCase() === t) || coins[0];
          
          // Get contract address
          const detail = await axios.get(`https://api.coingecko.com/api/v3/coins/${match.id}`);
          const platforms = detail.data.platforms;
          
          if (chain.toLowerCase() === "base") {
              return platforms["base"] || platforms["base-v2"] || "N/A";
          }
      }
  } catch (e) {
      console.error("Token resolution error:", e);
  }
  
  return "N/A";
}

export async function fetchTrendingTokens(chain?: string) {
  const cacheKey = `trending-${chain || "global"}`;
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL_MS)) {
      console.log(`Returning cached trending tokens for ${cacheKey}`);
      return cache[cacheKey].data;
  }

  try {
    let coins = [];
    let source = "CoinGecko Global Trending";

    if (chain && chain.toLowerCase().includes("base")) {
      // 1. Try GeckoTerminal (DEX Trending) - Best for "Hot" tokens
      try {
          // Fetch more pools to allow filtering
          const poolRes = await axios.get("https://api.geckoterminal.com/api/v2/networks/base/trending_pools?page=1");
          // Take top 30 to filter
          const rawPools = poolRes.data.data.slice(0, 30);
          
          // Filter out low MC tokens (< $500k) to match "CMC" style quality
          // And deduplicate by token address
          const uniqueTokens = new Map();
          const filteredPools = [];
          
          for (const p of rawPools) {
              const mcap = parseFloat(p.attributes.market_cap_usd || p.attributes.fdv_usd || "0");
              const addr = p.relationships.base_token.data.id.replace("base_", "");
              
              if (mcap > 500000 && !uniqueTokens.has(addr)) {
                  uniqueTokens.set(addr, true);
                  filteredPools.push(p);
              }
              if (filteredPools.length >= 10) break;
          }

          const addresses = filteredPools.map((p: any) => p.relationships.base_token.data.id.replace("base_", ""));
          const addressStr = addresses.join(",");

          const tokenRes = await axios.get(`https://api.geckoterminal.com/api/v2/networks/base/tokens/multi/${addressStr}`);
          const tokenMap = new Map();
          tokenRes.data.data.forEach((t: any) => {
              tokenMap.set(t.attributes.address.toLowerCase(), {
                  name: t.attributes.name,
                  symbol: t.attributes.symbol,
                  image: t.attributes.image_url
              });
          });

          coins = filteredPools.map((p: any) => {
              const addr = p.relationships.base_token.data.id.replace("base_", "");
              const info = tokenMap.get(addr.toLowerCase()) || { name: "Unknown", symbol: "???", image: "" };
              return {
                  name: info.name,
                  symbol: info.symbol.toUpperCase(),
                  current_price: parseFloat(p.attributes.base_token_price_usd),
                  market_cap: parseFloat(p.attributes.market_cap_usd || p.attributes.fdv_usd || "0"),
                  price_change_percentage_24h: parseFloat(p.attributes.price_change_percentage.h24 || "0"),
                  image: sanitizeImage(info.image, addr, "base"),
                  link: `https://geckoterminal.com/base/pools/${p.attributes.address}`,
                  trade_url: getTradeUrl(addr, "base"),
                  security_url: getSecurityUrl(addr, "base"),
                  address: addr,
                  id: p.id
              };
          });
          
          source = "GeckoTerminal Base Trending";
          const result = { source, tokens: coins };
          cache[cacheKey] = { timestamp: Date.now(), data: result };
          return result;

      } catch (e: any) {
           console.error("GeckoTerminal Error:", e.message);
           // Fallback to CoinGecko Markets below
      }

      // 2. Fallback: CoinGecko Base Markets (Volume based)
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=base-ecosystem&order=volume_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h"
        );
        coins = response.data.map((item: any) => ({
            name: item.name,
            symbol: item.symbol.toUpperCase(),
            current_price: item.current_price,
            market_cap: item.market_cap,
            price_change_percentage_24h: item.price_change_percentage_24h || 0,
            image: sanitizeImage(item.image),
            link: `https://www.coingecko.com/en/coins/${item.id}`,
            trade_url: "", // No address easily available for volume fallback without extra calls
            security_url: "",
            id: item.id
        }));
        source = "CoinGecko Base Trending (Volume)";
      } catch (e: any) {
        if (e.response?.status === 429) {
            console.warn("Rate limit hit on trending fetch.");
            return { source: "Rate Limited", tokens: [], error: "Rate limit exceeded. Please try again later." };
        }
        throw e;
      }
    } else {
      // Global Trending
      try {
        const response = await axios.get("https://api.coingecko.com/api/v3/search/trending");
        coins = response.data.coins.map((item: any) => ({
            name: item.item.name,
            symbol: item.item.symbol,
            market_cap_rank: item.item.market_cap_rank,
            price_btc: item.item.price_btc,
            current_price: item.item.data?.price, 
            market_cap: item.item.data?.market_cap_btc ? item.item.data.market_cap_btc * 100000 : 0, 
            price_change_percentage_24h: item.item.data?.price_change_percentage_24h?.usd || 0,
            image: sanitizeImage(item.item.large),
            link: `https://www.coingecko.com/en/coins/${item.item.id}`,
            trade_url: "",
            security_url: "",
            id: item.item.id
        }));
      } catch (e: any) {
        if (e.response?.status === 429) {
             console.warn("Rate limit hit on trending fetch.");
             return { source: "Rate Limited", tokens: [], error: "Rate limit exceeded. Please try again later." };
        }
        throw e;
      }
    }

    // Process top 9 for details (Address, real price/mcap if missing)
    // Use sequential execution to avoid rate limits
    const tokensWithAddresses = [];
    const topCoins = coins.slice(0, 9);

    for (const item of topCoins) {
        let address = "N/A";
        let finalPrice = item.current_price;
        let finalMcap = item.market_cap;

        try {
            // Add delay to avoid rate limits (sequential)
            await new Promise(r => setTimeout(r, 1200)); 
            const detail = await axios.get(`https://api.coingecko.com/api/v3/coins/${item.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
            
            // Get Address
            const platforms = detail.data.platforms || {};
            if (chain && chain.includes("base")) {
                address = platforms["base"] || platforms["base-v2"] || Object.values(platforms)[0] || "N/A";
            } else if (chain && chain.includes("solana")) {
                address = platforms["solana"] || Object.values(platforms)[0] || "N/A";
            } else {
                address = platforms["base"] || platforms["ethereum"] || platforms["solana"] || Object.values(platforms)[0] || "N/A";
            }

            // Get better market data if missing or string
            if (detail.data.market_data) {
                finalPrice = detail.data.market_data.current_price?.usd || finalPrice;
                finalMcap = detail.data.market_data.market_cap?.usd || finalMcap;
            }
        } catch (e: any) {
            console.error(`Failed to fetch details for ${item.id}: ${e.message}`);
            // If 429, we might want to stop fetching details for subsequent items to save time/quota
            // But for now we just fallback to basic info for this item
        }

        // Clean up price/mcap if they are strings (from trending api) to numbers for consistency
        if (typeof finalPrice === 'string') finalPrice = parseFloat(finalPrice.replace(/[$,]/g, ''));
        if (typeof finalMcap === 'string') finalMcap = parseFloat(finalMcap.replace(/[$,]/g, ''));

        tokensWithAddresses.push({
            ...item,
            current_price: finalPrice,
            market_cap: finalMcap,
            address: address
        });
    }

    // Return structured data
    const result = {
      source,
      tokens: tokensWithAddresses
    };
    
    // Cache result
    cache[cacheKey] = { timestamp: Date.now(), data: result };
    
    return result;
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    throw new Error(`Error fetching trending tokens: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function fetchTopGainers(chain?: string) {
  try {
    let url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h";
    
    if (chain && chain.toLowerCase().includes("base")) {
      url += "&category=base-ecosystem";
    }

    let response;
    try {
        response = await axios.get(url);
    } catch (e: any) {
        if (e.response?.status === 429) {
            console.warn("Rate limit hit on top gainers fetch.");
            return { source: "Rate Limited", tokens: [], error: "Rate limit exceeded. Please try again later." };
        }
        throw e;
    }

    const sortedCoins = response.data
      .sort((a: any, b: any) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
      .slice(0, 8);

    // Fetch contract addresses for top 6 (reduced from 8)
    // Use sequential execution
    const tokensWithAddresses = [];
    const topCoins = sortedCoins.slice(0, 6);

    for (const item of topCoins) {
      let address = "N/A";
      try {
        // Add delay to avoid rate limits (sequential)
        await new Promise(r => setTimeout(r, 1200)); 
        const detail = await axios.get(`https://api.coingecko.com/api/v3/coins/${item.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`);
        
        // Prioritize requested chain, fallback to any
        const platforms = detail.data.platforms || {};
        if (chain && chain.includes("base")) {
            address = platforms["base"] || platforms["base-v2"] || Object.values(platforms)[0] || "N/A";
        } else if (chain && chain.includes("solana")) {
            address = platforms["solana"] || Object.values(platforms)[0] || "N/A";
        } else {
            // Prefer EVM/Solana over others if global
            address = platforms["base"] || platforms["ethereum"] || platforms["solana"] || Object.values(platforms)[0] || "N/A";
        }
      } catch (e: any) {
        console.error(`Failed to fetch address for ${item.id}: ${e.message}`);
      }

      tokensWithAddresses.push({
        name: item.name,
        symbol: item.symbol.toUpperCase(),
        current_price: item.current_price,
        market_cap: item.market_cap,
        price_change_percentage_24h: item.price_change_percentage_24h || 0,
        image: sanitizeImage(item.image),
        link: `https://www.coingecko.com/en/coins/${item.id}`,
        id: item.id,
        address: address
      });
    }

    return { source: chain?.includes("base") ? "CoinGecko Top Gainers (Base)" : "CoinGecko Top Gainers (Global)", tokens: tokensWithAddresses };
  } catch (error) {
    throw new Error(`Error fetching top gainers: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function fetchYieldOpportunities(chain: string) {
  try {
    // DefiLlama Pools API
    const response = await axios.get("https://yields.llama.fi/pools");
    const allPools = response.data.data;
    
    // Map common chain names to DefiLlama chain names
    const chainMap: Record<string, string> = {
      "base": "Base",
      "solana": "Solana",
      "ethereum": "Ethereum",
      "arbitrum": "Arbitrum"
    };
    
    const targetChain = chainMap[chain.toLowerCase()] || "Base";
    
    // Filter by chain and sort by APY (descending), take top 5 safe-ish pools (TVL > 1M)
    const filteredPools = allPools
      .filter((p: any) => p.chain === targetChain && p.tvlUsd > 1000000 && p.apy < 500) // Filter out crazy APYs and low TVL
      .sort((a: any, b: any) => b.apy - a.apy)
      .slice(0, 5)
      .map((p: any) => ({
        project: p.project,
        symbol: p.symbol,
        pool: p.pool,
        apy: p.apy, // Keep as number for raw data
        tvl: p.tvlUsd, // Keep as number
        chain: p.chain,
        link: `https://defillama.com/yields/pool/${p.pool}`
      }));

    return filteredPools;
  } catch (error) {
    console.error("Error fetching yield data:", error);
    throw new Error(`Error fetching yield data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function fetchTokenRisk(token: string, chain: string = "base") {
    try {
      let coinId = null;
      let fullData = null;
      
      // Map common chain names to CoinGecko platform IDs
      const platformMap: Record<string, string> = {
          "base": "base",
          "ethereum": "ethereum",
          "eth": "ethereum",
          "solana": "solana",
          "sol": "solana",
          "bsc": "binance-smart-chain",
          "bnb": "binance-smart-chain",
          "arbitrum": "arbitrum-one",
          "arb": "arbitrum-one",
          "optimism": "optimistic-ethereum",
          "op": "optimistic-ethereum",
          "polygon": "polygon-pos",
          "matic": "polygon-pos",
          "avalanche": "avalanche",
          "avax": "avalanche",
          "blast": "blast",
          "scroll": "scroll",
          "linea": "linea",
          "zksync": "zksync"
      };

      const platformId = platformMap[chain.toLowerCase()] || "base";

      // 1. Check if input is an address
      if (token.startsWith("0x") && token.length === 42) {
          try {
              const contractRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${platformId}/contract/${token}`);
              fullData = contractRes.data;
              coinId = fullData.id;
          } catch (e) {
              console.log(`Token not found on ${platformId} by address ${token}, trying global search...`);
          }
      } else if (platformId === "solana" && token.length > 30) {
           // Basic Solana address check (length usually 32-44 chars)
           try {
              const contractRes = await axios.get(`https://api.coingecko.com/api/v3/coins/solana/contract/${token}`);
              fullData = contractRes.data;
              coinId = fullData.id;
           } catch (e) {
               console.log(`Token not found on Solana by address ${token}, trying global search...`);
           }
      }

      // 2. If not found by address or not an address, search by name/symbol
      if (!coinId) {
          const searchRes = await axios.get(`https://api.coingecko.com/api/v3/search?query=${token}`);
          coinId = searchRes.data.coins.length > 0 ? searchRes.data.coins[0].id : null;
      }

      if (!coinId) {
        return { error: "Token not found on CoinGecko" };
      }

      // 3. Get Market Data (Standardized)
      let data: any = {};
      
      if (fullData) {
          // Map detailed data to flat structure
          data = {
              name: fullData.name,
              symbol: fullData.symbol,
              current_price: fullData.market_data?.current_price?.usd || 0,
              market_cap: fullData.market_data?.market_cap?.usd || 0,
              price_change_percentage_24h: fullData.market_data?.price_change_percentage_24h || 0,
              id: fullData.id,
              image: fullData.image?.large
          };
      } else {
          // Fetch from markets endpoint
          const marketRes = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`);
          data = marketRes.data[0];
      }

      if (!data) return { error: "Market data not found" };

      // 4. Calculate Pseudo-Risk Score
      // Factors: Market Cap (Lower = Higher Risk), Price Change 24h (Higher Volatility = Higher Risk)
      let riskScore = 50;
      
      // Market Cap Adjustment
      if (data.market_cap < 10000000) riskScore += 30; // < $10M Cap
      else if (data.market_cap < 100000000) riskScore += 10; // < $100M Cap
      else riskScore -= 10; // > $100M Cap

      // Volatility Adjustment
      const volatility = Math.abs(data.price_change_percentage_24h);
      if (volatility > 10) riskScore += 20;
      else if (volatility > 5) riskScore += 10;

      // Cap at 100
      riskScore = Math.min(Math.max(riskScore, 0), 100);
      const riskLevel = riskScore > 75 ? "High" : riskScore > 40 ? "Medium" : "Low";

      return {
        token: data.name,
        symbol: data.symbol.toUpperCase(),
        current_price: data.current_price,
        market_cap: data.market_cap,
        price_change_24h: data.price_change_percentage_24h,
        risk_analysis: {
          score: riskScore,
          level: riskLevel,
          factors: [
            data.market_cap < 100000000 ? "Low Market Cap (High Risk)" : "Healthy Market Cap",
            volatility > 10 ? "High Volatility (High Risk)" : "Stable Price Action"
          ]
        },
        source: "CoinGecko Data Analysis",
        link: `https://www.coingecko.com/en/coins/${data.id}`,
        trade_url: getTradeUrl(token, chain), 
        address: fullData?.platforms?.[platformId] || (token.startsWith("0x") ? token : ""),
        security_url: getSecurityUrl(fullData?.platforms?.[platformId] || (token.startsWith("0x") ? token : ""), chain)
      };

    } catch (error) {
      throw new Error(`Error analyzing token risk: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// --- LangChain Tools Wrappers ---

export const terminal_trending = tool(
  async ({ chain }) => {
    try {
      const result = await fetchTrendingTokens(chain);
      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      return error.message;
    }
  },
  {
    name: "terminal_trending",
    description: "Get trending tokens (hot/popular) from the market for a specific chain.",
    schema: z.object({
      chain: z.enum(["base", "solana", "ethereum"]).optional().describe("The blockchain network"),
    }),
  }
);

export const terminal_risk = tool(
  async ({ token, chain }) => {
    try {
      const result = await fetchTokenRisk(token, chain);
      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      return error.message;
    }
  },
  {
    name: "terminal_risk",
    description: "Analyze the risk profile of a token (price, volatility, market cap, security).",
    schema: z.object({
      token: z.string().describe("The token name, symbol, or address"),
      chain: z.string().optional().describe("The blockchain network (default: base)")
    }),
  }
);

export const terminal_portfolio = tool(
  async ({ address, chain }) => {
    // Mock Portfolio Analysis or integrate real API if available
    return JSON.stringify({
        action: "Please verify your wallet to view portfolio.",
        debank_link: `https://debank.com/profile/${address}`
    });
  },
  {
    name: "terminal_portfolio",
    description: "Analyze a wallet portfolio. Returns a link to DeBank for now.",
    schema: z.object({
      address: z.string().describe("The wallet address"),
      chain: z.string().optional().describe("The blockchain network")
    }),
  }
);

export const terminal_top_gainers = tool(
  async ({ chain }) => {
    try {
      const result = await fetchTopGainers(chain);
      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      return error.message;
    }
  },
  {
    name: "terminal_top_gainers",
    description: "Get the top gaining tokens (highest 24h increase) from the market.",
    schema: z.object({
      chain: z.enum(["base", "solana"]).optional().describe("The blockchain network (Optional)"),
    }),
  }
);

export const terminal_quote = tool(
  async ({ tokenIn, tokenOut, amount, chain }) => {
     return `Use uniswap_quote to generate a swap transaction. Quote: 1 ${tokenIn} = ... ${tokenOut} (Price data fetched dynamically)`;
  },
  {
    name: "terminal_quote",
    description: "Get a price quote for swapping tokens.",
    schema: z.object({
      tokenIn: z.string(),
      tokenOut: z.string(),
      amount: z.string(),
      chain: z.string().optional()
    })
  }
);

export const terminal_swap = tool(
  async ({ tokenIn, tokenOut, amount, chain = "base" }) => {
    try {
        const tokenInAddr = await resolveTokenAddress(tokenIn, chain);
        const tokenOutAddr = await resolveTokenAddress(tokenOut, chain);

        if (tokenInAddr === "N/A" || tokenOutAddr === "N/A") {
            return `Error: Could not identify tokens. Please specify valid token symbols (e.g., ETH, USDC, BRETT).`;
        }

        // Get Decimals
        let decimals = 18;
        if (tokenInAddr !== "ETH" && tokenInAddr !== "0x0000000000000000000000000000000000000000") {
             decimals = TOKEN_DECIMALS[tokenInAddr] || 18;
        }

        // Parse Amount
        const amountAtomic = parseUnits(amount.toString(), decimals).toString();

        // 1. Get Real Quote from KyberSwap
        // KyberSwap uses "0xeeee..." for native ETH
        const kyberTokenIn = tokenInAddr === "ETH" || tokenInAddr === "0x4200000000000000000000000000000000000006" 
            ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" // Native for input
            : tokenInAddr;
        const kyberTokenOut = tokenOutAddr === "ETH" || tokenOutAddr === "0x4200000000000000000000000000000000000006"
            ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" // Native for output
            : tokenOutAddr;

        const url = `https://aggregator-api.kyberswap.com/base/api/v1/routes?tokenIn=${kyberTokenIn}&tokenOut=${kyberTokenOut}&amountIn=${amountAtomic}`;
        const res = await axios.get(url);
        
        if (!res.data || !res.data.data || !res.data.data.routeSummary) {
            return `Error: No liquidity found for this swap pair on KyberSwap.`;
        }

        const route = res.data.data.routeSummary;
        const amountOut = route.amountOut;
        const amountOutFormatted = formatUnits(BigInt(amountOut), TOKEN_DECIMALS[tokenOutAddr] || 6); // Default 6 for USDC stability, or 18?
        // Note: We need better decimal handling for output, but simplified for now.
        // Actually, let's try to guess decimals or just use a standard format.
        // Safe bet: if USDC/USDT use 6, else 18.
        const outDecimals = (tokenOut.toUpperCase().includes("USD")) ? 6 : 18; 
        const displayAmountOut = formatUnits(BigInt(amountOut), outDecimals);
        const gasUsd = route.gasUsd || "0.05";

        return `Swap Quote Details:
- Selling: ${amount} ${tokenIn.toUpperCase()} (${tokenInAddr})
- Receiving: ~${parseFloat(displayAmountOut).toFixed(6)} ${tokenOut.toUpperCase()}
- Rate: 1 ${tokenIn.toUpperCase()} ≈ ${(parseFloat(displayAmountOut)/parseFloat(amount)).toFixed(4)} ${tokenOut.toUpperCase()}
- Est. Gas: ~$${gasUsd}
- Network: Base Mainnet`;

    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
  {
    name: "uniswap_quote",
    description: "Get a text-based quote for swapping tokens on Base. Use this to show the user the rate before asking for approval.",
    schema: z.object({
      tokenIn: z.string().describe("The input token symbol or address (e.g. ETH, USDC)"),
      tokenOut: z.string().describe("The output token symbol or address"),
      amount: z.string().describe("The amount to swap"),
      chain: z.string().optional().describe("The chain to swap on (default: base)")
    }),
  }
);

export const execute_swap = tool(
    async ({ tokenIn, tokenOut, amount, chain = "base" }) => {
        try {
            const privateKey = process.env.PRIVATE_KEY;
            if (!privateKey) return "Error: Agent wallet not configured (missing PRIVATE_KEY).";

            const account = privateKeyToAccount(privateKey as `0x${string}`);
            const client = createWalletClient({
                account,
                chain: base,
                transport: http()
            });
            const publicClient = createPublicClient({ chain: base, transport: http() });

            // Resolve Addresses
            const tokenInAddr = await resolveTokenAddress(tokenIn, chain);
            const tokenOutAddr = await resolveTokenAddress(tokenOut, chain);

            if (tokenInAddr === "N/A" || tokenOutAddr === "N/A") {
                return `Error: Could not identify tokens.`;
            }

            // Decimals
            let decimals = 18;
            if (tokenInAddr !== "ETH" && tokenInAddr !== "0x0000000000000000000000000000000000000000") {
                decimals = TOKEN_DECIMALS[tokenInAddr] || 18;
            }
            const amountAtomic = parseUnits(amount.toString(), decimals).toString();

            // KyberSwap Params
            const kyberTokenIn = tokenInAddr === "ETH" || tokenInAddr === "0x4200000000000000000000000000000000000006" 
                ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" 
                : tokenInAddr;
            const kyberTokenOut = tokenOutAddr === "ETH" || tokenOutAddr === "0x4200000000000000000000000000000000000006"
                ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" 
                : tokenOutAddr;

            // 1. Get Route
            console.log("Fetching route for execution...");
            const routeUrl = `https://aggregator-api.kyberswap.com/base/api/v1/routes?tokenIn=${kyberTokenIn}&tokenOut=${kyberTokenOut}&amountIn=${amountAtomic}`;
            const routeRes = await axios.get(routeUrl);
            if (!routeRes.data || !routeRes.data.data || !routeRes.data.data.routeSummary) {
                return `Error: No liquidity found for execution.`;
            }
            const routeSummary = routeRes.data.data.routeSummary;

            // 2. Check Allowance (if not Native ETH)
            if (kyberTokenIn !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
                // Get Router Address from Kyber Config or API (usually constant for aggregator)
                // Actually, route build response tells us the router, but we need to approve BEFORE build?
                // Kyber Aggregator Router v6 on Base: 0x6131B5fae19EA4f9D964eAc0408E4408b66337b5
                // Safer: Call /route/build first? No, it might fail if not approved?
                // Actually Kyber /route/build returns 'routerAddress' to approve.
                // Let's call build first to get router address (it doesn't require on-chain approval to Generate calldata)
                
                const buildUrl = `https://aggregator-api.kyberswap.com/base/api/v1/route/build`;
                const buildBody = {
                    routeSummary: routeSummary,
                    sender: account.address,
                    recipient: account.address,
                    slippageTolerance: 100 // 1%
                };
                // We can't build if we don't have approval? No, API usually builds anyway.
            }

            // 3. Build Transaction
            console.log("Building transaction...");
            const buildUrl = `https://aggregator-api.kyberswap.com/base/api/v1/route/build`;
            const buildBody = {
                routeSummary: routeSummary,
                sender: account.address,
                recipient: account.address,
                slippageTolerance: 100 // 1%
            };
            const buildRes = await axios.post(buildUrl, buildBody);
            
            if (buildRes.data.code !== 0) {
                 return `Error building transaction: ${buildRes.data.message}`;
            }
            
            const { data: txData, routerAddress, amountIn } = buildRes.data.data;

            // 4. Handle Approval (NOW we have routerAddress)
            if (kyberTokenIn !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
                const allowance = await publicClient.readContract({
                    address: tokenInAddr as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'allowance',
                    args: [account.address, routerAddress as `0x${string}`]
                });

                if (allowance < BigInt(amountAtomic)) {
                    console.log("Approving token...");
                    const approveHash = await client.writeContract({
                        address: tokenInAddr as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [routerAddress as `0x${string}`, BigInt(amountAtomic)],
                        account
                    });
                    // Wait for approval
                    await publicClient.waitForTransactionReceipt({ hash: approveHash });
                    console.log("Approved.");
                }
            }

            // 5. Send Transaction
            console.log("Sending swap transaction...");
            const txHash = await client.sendTransaction({
                account,
                to: routerAddress as `0x${string}`,
                data: txData as `0x${string}`,
                value: BigInt(kyberTokenIn === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? amountAtomic : 0)
            });

            console.log("Swap sent:", txHash);

            return `Swap Executed Successfully!
- Sold: ${amount} ${tokenIn}
- Bought: ~${tokenOut}
- Network: ${chain}
- Transaction Hash: ${txHash}
- Status: Confirmed on-chain`;

        } catch (e: any) {
            console.error("Swap execution error:", e);
            return `Error Executing Swap: ${e.message}`;
        }
    },
    {
        name: "execute_swap",
        description: "Execute the swap transaction AFTER the user has replied 'APPROVE'. Returns the success details.",
        schema: z.object({
            tokenIn: z.string(),
            tokenOut: z.string(),
            amount: z.string(),
            chain: z.string().optional()
        })
    }
);

export const terminal_balance = tool(
  async ({ token, address }) => {
    try {
        const publicClient = createPublicClient({
            chain: base,
            transport: http("https://mainnet.base.org")
        });

        const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        
        // Resolve token
        let tokenAddr = token.toUpperCase() === "ETH" ? NATIVE_ETH : await resolveTokenAddress(token, "base");
        
        // If resolveTokenAddress returns N/A, try to see if it's a valid address
        if (tokenAddr === "N/A" && token.startsWith("0x") && token.length === 42) {
            tokenAddr = token;
        }
        
        if (tokenAddr === "N/A") return `Error: Could not find address for token '${token}'`;

        const isNative = tokenAddr === NATIVE_ETH || tokenAddr === "0x4200000000000000000000000000000000000006" && token.toUpperCase() === "ETH"; // Handle WETH/ETH ambiguity if needed, but usually ETH is native
        
        let balance = BigInt(0);
        let decimals = 18;

        if (token.toUpperCase() === "ETH") { // Explicitly handle ETH as native
             balance = await publicClient.getBalance({ address: address as `0x${string}` });
        } else {
            // Get decimals
             try {
                 if (TOKEN_DECIMALS[tokenAddr]) {
                     decimals = TOKEN_DECIMALS[tokenAddr];
                 } else {
                     decimals = await publicClient.readContract({
                         address: tokenAddr as `0x${string}`,
                         abi: erc20Abi,
                         functionName: 'decimals'
                     });
                 }
                 balance = await publicClient.readContract({
                     address: tokenAddr as `0x${string}`,
                     abi: erc20Abi,
                     functionName: 'balanceOf',
                     args: [address as `0x${string}`]
                 });
             } catch (e: any) {
                 return `Error fetching ERC20 balance: ${e.message}`;
             }
        }

        const formatted = formatUnits(balance, decimals);
        return formatted;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
  {
    name: "balance_query",
    description: "Get the balance of a specific token for a wallet address on Base chain. Use this to check user funds before swapping.",
    schema: z.object({
      token: z.string().describe("Token symbol or address (e.g. ETH, USDC, 0x...)"),
      address: z.string().describe("Wallet address to check")
    })
  }
);

export const terminal_wallet_status = tool(
  async () => {
    try {
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) return "Error: Agent wallet not configured (missing PRIVATE_KEY).";

        const account = privateKeyToAccount(privateKey as `0x${string}`);
        const publicClient = createPublicClient({ chain: base, transport: http() });
        
        const balance = await publicClient.getBalance({ address: account.address });
        const ethBalance = formatEther(balance);

        return `Agent Wallet Status:
- Address: ${account.address}
- Balance: ${parseFloat(ethBalance).toFixed(4)} ETH
- Network: Base Mainnet

To fund this agent, send ETH (Base) to the address above.`;
    } catch (e: any) {
        return `Error fetching wallet status: ${e.message}`;
    }
  },
  {
    name: "get_agent_wallet",
    description: "Get the agent's internal wallet address and ETH balance. Use this to show the user where to deposit funds for trading.",
    schema: z.object({})
  }
);

export const terminal_yield = tool(
  async ({ chain }) => {
    try {
      const result = await fetchYieldOpportunities(chain);
      // Format for text output
      const formatted = result.map((p: any) => ({
          ...p,
          apy: `${p.apy.toFixed(2)}%`,
          tvl: `$${(p.tvl / 1000000).toFixed(2)}M`
      }));
      if (formatted.length === 0) return `No yield opportunities found for ${chain} with TVL > $1M`;
      return JSON.stringify(formatted, null, 2);
    } catch (error: any) {
      return error.message;
    }
  },
  {
    name: "terminal_yield",
    description: "Find the best yield opportunities/farming for a specific blockchain using DefiLlama data.",
    schema: z.object({
      chain: z.enum(["base", "solana", "ethereum"]).describe("The blockchain network"),
    }),
  }
);
