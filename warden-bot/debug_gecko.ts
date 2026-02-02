
import axios from 'axios';

async function checkPoolDetails() {
    try {
        // ID from previous run
        const poolId = "b99bcdf5-1350-4269-981e-0e9b5cccb007"; 
        // Try getting the chart/details which usually contains more info?
        // Actually, DefiLlama doesn't expose the pool contract address in the main /pools endpoint usually.
        // But maybe it's in the underlying tokens? No.
        
        // Let's try another endpoint if it exists?
        // There isn't a documented endpoint to get address if it's not in /pools.
        // BUT, for Uniswap V3, the pool address is deterministic based on tokens and fee.
        // I have underlyingTokens and poolMeta (fee).
        // Maybe I can compute it? That's hard (requires factory address etc).
        
        // Wait, maybe I can use GeckoTerminal API instead?
        // GeckoTerminal has pool addresses.
        // User asked for "Top 10 on Base with best APR" from Uniswap.
        // GeckoTerminal is good for this.
        
        console.log("Checking GeckoTerminal...");
        const response = await axios.get("https://api.geckoterminal.com/api/v2/networks/base/dexes/uniswap_v3/pools?page=1&sort=h24_tx_count_desc");
        // Or sort by APY if possible? GeckoTerminal doesn't sort by APY in the public API easily?
        // Wait, looking at docs: 
        // /networks/{network}/dexes/{dex}/pools
        // default sort is h24_tx_count_desc.
        // We want APY.
        
        // Let's see what GeckoTerminal returns.
        if (response.data.data && response.data.data.length > 0) {
            console.log("GeckoTerminal Pool:", JSON.stringify(response.data.data[0], null, 2));
        }
        
    } catch (e) {
        console.error(e);
    }
}

checkPoolDetails();
