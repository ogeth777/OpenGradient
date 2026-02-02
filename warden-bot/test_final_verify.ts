import 'dotenv/config';
import { fetchTrendingTokens, fetchTokenRisk } from './tools';
import * as fs from 'fs';

const LOG_FILE = 'test_final_verify.txt';
fs.writeFileSync(LOG_FILE, "=== Final Verification ===\n");

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + "\n");
}

async function test() {
    log("1. Testing Trend (Expect 10 tokens)...");
    const trend = await fetchTrendingTokens("base");
    log(`Trend Count: ${trend.tokens.length}`);
    log("Trend Result: " + JSON.stringify(trend.tokens.map((t: any) => t.name), null, 2));

    log("\n2. Testing Risk for 0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196...");
    const risk = await fetchTokenRisk("0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196", "base");
    log("Risk Result: " + JSON.stringify(risk, null, 2));
}

test();
