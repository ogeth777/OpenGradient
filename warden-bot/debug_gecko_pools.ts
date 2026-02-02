
import axios from 'axios';

async function checkGeckoPools() {
    try {
        const response = await axios.get("https://api.geckoterminal.com/api/v2/networks/base/dexes/uniswap-v3-base/pools?page=1");
        const pools = response.data.data;
        if (pools.length > 0) {
            console.log("Gecko Pool Attributes:", JSON.stringify(pools[0].attributes, null, 2));
            console.log("Gecko Pool Address:", pools[0].attributes.address);
        }
    } catch (e) {
        console.error(e);
    }
}

checkGeckoPools();
