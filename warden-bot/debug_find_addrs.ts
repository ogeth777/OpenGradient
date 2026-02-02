import axios from 'axios';

const symbols = ["ELSA", "RIVER", "CYS", "CLAWNCH", "LINK", "WMTX", "ZEN", "VIRTUAL", "BNKR", "CAKE", "VVV"];

async function findAddresses() {
    for (const sym of symbols) {
        try {
            const res = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${sym}`);
            const pairs = res.data.pairs || [];
            const basePair = pairs.find((p: any) => p.chainId === 'base' && p.baseToken.symbol.toUpperCase() === sym);
            
            if (basePair) {
                console.log(`${sym}: ${basePair.baseToken.address}`);
            } else {
                console.log(`${sym}: Not found on Base`);
            }
        } catch (e) {
            console.log(`${sym}: Error`);
        }
    }
}

findAddresses();
