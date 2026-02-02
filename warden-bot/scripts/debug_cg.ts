import axios from 'axios';

async function checkCoinGeckoTrending() {
    try {
        console.log("Fetching CoinGecko Trending...");
        const response = await axios.get("https://api.coingecko.com/api/v3/search/trending");
        const coins = response.data.coins;
        
        console.log("Top 10 Trending on CoinGecko:");
        coins.forEach((c: any, i: number) => {
            console.log(`${i+1}. ${c.item.name} (${c.item.symbol})`);
        });

        const targetTokens = ["ELSA", "RIVER", "CYS", "CLAWNCH", "LINK", "WMTX", "ZEN", "VIRTUAL", "BNKR", "CAKE", "VVV"];
        const found = coins.filter((c: any) => targetTokens.includes(c.item.symbol.toUpperCase()));
        console.log("Matches with user list:", found.map((c: any) => c.item.name));

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

checkCoinGeckoTrending();
