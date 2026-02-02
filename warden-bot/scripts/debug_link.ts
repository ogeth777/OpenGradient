import axios from 'axios';

async function findLink() {
    try {
        const res = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=Chainlink`);
        const pairs = res.data.pairs || [];
        const basePair = pairs.find((p: any) => p.chainId === 'base' && p.baseToken.symbol === 'LINK');
        if (basePair) {
            console.log("LINK:", basePair.baseToken.address);
        }
    } catch (e) {
        console.error(e);
    }
}
findLink();
