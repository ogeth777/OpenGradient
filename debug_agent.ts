import "dotenv/config";
import { processAgentRequest } from "./warden-bot/agent";
import fs from "fs";

async function run() {
  const log = (msg: string) => {
    console.log(msg);
    try {
        fs.appendFileSync("debug_output.txt", msg + "\n");
    } catch (e) {}
  };

  try {
      fs.writeFileSync("debug_output.txt", "Starting full agent test...\n");
  } catch (e) {}

  log("Testing Agent with 'Swap 10 USDC for ETH'...");
  try {
    const response = await processAgentRequest("Swap 10 USDC for ETH");
    log("--- RESPONSE START ---");
    log(response);
    log("--- RESPONSE END ---");
  } catch (error: any) {
    log("Error: " + error.message);
    if (error.stack) log(error.stack);
  }
}

run();
