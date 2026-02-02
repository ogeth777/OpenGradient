import axios from 'axios';

async function checkDexScreener() {
    try {
        console.log("Fetching DexScreener Top Boosts...");
        const response = await axios.get("https://api.dexscreener.com/token-boosts/top/v1");
        const allBoosts = response.data;
        
        // Filter for Base chain
        const baseTokens = allBoosts.filter((t: any) => t.chainId === 'base');
        
        console.log(`Found ${baseTokens.length} Base tokens.`);
        if (baseTokens.length > 0) {
            console.log("Sample Token:", JSON.stringify(baseTokens[0], null, 2));
            
            // We need 1h change. Boosts endpoint might not have it.
            // If not, we can fetch detailed data for these tokens.
            const addresses = baseTokens.slice(0, 5).map((t: any) => t.tokenAddress).join(',');
            console.log("Fetching details for:", addresses);
            
            const details = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`);
            if (details.data.pairs) {
                 console.log("Detailed Data Sample:", JSON.stringify(details.data.pairs[0], null, 2));
            }
        }
    } catch (e: any) {
        console.error(e.message);
    }
}

checkDexScreener();
