import 'dotenv/config';
import { processAgentRequest } from '../agent';

console.log("🚀 Starting verification tests...");

async function test() {
    try {
        console.log("=== Testing Trend ===");
        const trendRes = await processAgentRequest("Trend");
        console.log(trendRes);

        console.log("\n=== Testing Gainers ===");
        const gainersRes = await processAgentRequest("Gainers");
        console.log(gainersRes);

        console.log("\n=== Testing Yield ===");
        const yieldRes = await processAgentRequest("Yield");
        console.log(yieldRes);

        console.log("\n=== Testing Whale Watch ===");
        const whaleRes = await processAgentRequest("Whale TOSHI");
        console.log(whaleRes);
        
        console.log("\n✅ All tests completed!");
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}
test();
