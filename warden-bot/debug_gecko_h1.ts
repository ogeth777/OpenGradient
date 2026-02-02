import axios from 'axios';

async function checkGecko() {
    try {
        console.log("Fetching GeckoTerminal Base Trending...");
        const response = await axios.get("https://api.geckoterminal.com/api/v2/networks/base/trending_pools?page=1");
        const pools = response.data.data;
        
        if (pools.length > 0) {
            const p = pools[0];
            console.log("Sample Pool Attributes:", JSON.stringify(p.attributes, null, 2));
            console.log("Price Change 1h:", p.attributes.price_change_percentage?.h1);
        }
    } catch (e: any) {
        console.error(e.message);
    }
}

checkGecko();
