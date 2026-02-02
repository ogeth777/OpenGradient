
import axios from 'axios';

async function checkApi() {
    try {
        const response = await axios.get("https://yields.llama.fi/pools");
        const data = response.data.data;
        // Find a Uniswap V3 pool on Base
        const pool = data.find((p: any) => p.chain === "Base" && p.project === "uniswap-v3");
        console.log("Found Pool:", JSON.stringify(pool, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkApi();
