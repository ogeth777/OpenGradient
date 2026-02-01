
const axios = require('axios');

async function testKyber() {
  try {
    const url = "https://aggregator-api.kyberswap.com/base/api/v1/routes?tokenIn=0x4200000000000000000000000000000000000006&tokenOut=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&amountIn=1000000000000000";
    console.log("Fetching:", url);
    const res = await axios.get(url);
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(res.data, null, 2).substring(0, 500));
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.log("Response data:", error.response.data);
    }
  }
}

testKyber();
