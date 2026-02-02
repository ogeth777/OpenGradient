import 'dotenv/config';
import { processAgentRequest } from './agent';

async function test() {
    console.log("=== Testing Trend ===");
    const trendRes = await processAgentRequest("Trend");
    console.log(trendRes);

    console.log("\n=== Testing Gainers ===");
    const gainersRes = await processAgentRequest("Gainers");
    console.log(gainersRes);

    console.log("\n=== Testing Yield ===");
    const yieldRes = await processAgentRequest("Yield");
    console.log(yieldRes);
}

test();
