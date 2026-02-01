
import "dotenv/config";
import { WardenAgentKit } from "@wardenprotocol/warden-agent-kit-core";
import { WardenToolkit } from "@wardenprotocol/warden-langchain";

async function main() {
    try {
        const privateKey = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
        const config = { privateKeyOrAccount: privateKey as `0x${string}` };
        const agentKit = new WardenAgentKit(config);
        const wardenToolkit = new WardenToolkit(agentKit);
        const tools = wardenToolkit.getTools();
        
        console.log("Available Tools:");
        tools.forEach(t => {
            console.log(`- ${t.name}: ${t.description}`);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
