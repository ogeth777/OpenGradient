
import { 
  getYieldOpportunitiesTool,
  getTrendingTokensTool,
  evaluateTokenRiskTool 
} from "./tools.js";

async function main() {
  console.log("=== Testing Tools Directly (Bypassing AI) ===\n");
  
  // 1. Test Yield
  try {
    console.log("--- Testing Yield Opportunities (Base) ---");
    const yieldResult = await getYieldOpportunitiesTool.invoke({ chain: "base" });
    console.log(yieldResult);
  } catch (error) {
    console.error("Yield Tool failed:", error);
  }

  // 2. Test Trending
  try {
    console.log("\n--- Testing Trending Tokens ---");
    const trendingResult = await getTrendingTokensTool.invoke({ chain: "base" });
    console.log(trendingResult);
  } catch (error) {
    console.error("Trending Tool failed:", error);
  }

  // 3. Test Risk Evaluation
  try {
    console.log("\n--- Testing Token Risk (BRETT on Base) ---");
    const riskResult = await evaluateTokenRiskTool.invoke({ token: "BRETT", chain: "base" });
    console.log(riskResult);
  } catch (error) {
    console.error("Risk Tool failed:", error);
  }
}

main();
