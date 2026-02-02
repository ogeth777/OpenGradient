
import axios from 'axios';

async function checkDexes() {
    try {
        const response = await axios.get("https://api.geckoterminal.com/api/v2/networks/base/dexes?page=1");
        const dexes = response.data.data;
        const uniswap = dexes.filter((d: any) => d.attributes.name.toLowerCase().includes("uniswap"));
        console.log("Uniswap Dexes on Base:", JSON.stringify(uniswap, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkDexes();
