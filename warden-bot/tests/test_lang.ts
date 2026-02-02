
import { processAgentRequest } from "../agent";

async function main() {
    const prompt = "What are the trending tokens?";
    console.log(`Testing Russian response for: "${prompt}"`);
    
    try {
        const res = await processAgentRequest(prompt);
        console.log("Result:", res);
    } catch (e) {
        console.error(e);
    }
}

main();
