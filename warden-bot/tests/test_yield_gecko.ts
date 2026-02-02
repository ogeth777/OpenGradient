
import 'dotenv/config';
import { fetchYieldOpportunities } from '../tools';
import * as fs from 'fs';

const LOG_FILE = 'test_yield_gecko.txt';
fs.writeFileSync(LOG_FILE, "=== Testing Yield with GeckoTerminal ===\n");

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + "\n");
}

async function test() {
    log("Fetching Yield for Base...");
    try {
        const pools = await fetchYieldOpportunities("base");
        log(`Found ${pools.length} pools.`);
        pools.forEach((p: any, i: number) => {
            log(`${i+1}. ${p.symbol} - APY: ${p.apy.toFixed(2)}% - TVL: $${p.tvl.toFixed(0)}`);
            log(`   Link: ${p.link}`);
        });
    } catch (e: any) {
        log("Error: " + e.message);
    }
}

test();
