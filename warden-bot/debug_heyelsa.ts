import axios from 'axios';

async function findHeyElsa() {
    try {
        console.log("Searching for HeyElsa on DexScreener...");
        const dexRes = await axios.get("https://api.dexscreener.com/latest/dex/search?q=HeyElsa");
        if (dexRes.data.pairs && dexRes.data.pairs.length > 0) {
            const basePair = dexRes.data.pairs.find((p: any) => p.chainId === 'base');
            if (basePair) {
                console.log("Found on DexScreener (Base):", basePair.baseToken.name, basePair.pairAddress);
                console.log("Volume h1:", basePair.volume.h1);
                console.log("Change h1:", basePair.priceChange.h1);
            } else {
                console.log("Found on DexScreener but not Base:", dexRes.data.pairs[0].chainId);
            }
        } else {
            console.log("Not found on DexScreener.");
        }

        console.log("\nChecking GeckoTerminal Base Trending Pools...");
        const geckoRes = await axios.get("https://api.geckoterminal.com/api/v2/networks/base/trending_pools?page=1");
        const pools = geckoRes.data.data;
        const elsaPool = pools.find((p: any) => p.attributes.name.toLowerCase().includes("elsa"));
        if (elsaPool) {
            console.log("Found on GeckoTerminal Trending:", elsaPool.attributes.name);
            console.log("Attributes:", JSON.stringify(elsaPool.attributes, null, 2));
        } else {
            console.log("Not found on GeckoTerminal Trending (Top 20).");
            console.log("Top 3 Gecko Trending:", pools.slice(0, 3).map((p:any) => p.attributes.name));
        }

    } catch (e: any) {
        console.error(e.message);
    }
}

findHeyElsa();
