import axios from 'axios';

async function checkTrends() {
    try {
        console.log("Fetching DexScreener Top Boosts...");
        const response = await axios.get("https://api.dexscreener.com/token-boosts/top/v1");
        const allBoosts = response.data;
        
        const baseBoosts = allBoosts.filter((t: any) => t.chainId === 'base');
        console.log(`Found ${baseBoosts.length} boosted tokens on Base.`);
        
        if (baseBoosts.length > 0) {
            console.log("Top 10 Boosted on Base:");
            baseBoosts.slice(0, 10).forEach((t: any, i: number) => {
                console.log(`${i+1}. Address: ${t.tokenAddress}`);
            });

            // Fetch details for the first few to check names
            const addresses = baseBoosts.slice(0, 10).map((t: any) => t.tokenAddress).join(',');
            const details = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`);
            const pairs = details.data.pairs;
            
            // Map pairs to token addresses to get names
            const names = new Set();
            pairs.forEach((p: any) => {
                if (p.chainId === 'base') {
                    names.add(`${p.baseToken.name} (${p.baseToken.symbol})`);
                }
            });
            
            console.log("Names found in Boosts:", Array.from(names));
            
            // Check for specific user tokens
            const targetTokens = ["ELSA", "RIVER", "CYS", "CLAWNCH", "LINK", "WMTX", "ZEN", "VIRTUAL", "BNKR", "CAKE", "VVV"];
            const found = Array.from(names).filter(n => targetTokens.some(t => (n as string).includes(t) || (n as string).includes(t.toUpperCase())));
            console.log("Matches with user list:", found);
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

checkTrends();
