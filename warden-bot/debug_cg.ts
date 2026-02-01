import axios from 'axios';

async function checkDetails() {
  try {
    const id = "usd-coin";
    console.log(`Fetching details for ${id}...`);
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`
    );
    console.log("Platforms:", response.data.platforms);
    console.log("Detail Platforms:", response.data.detail_platforms);
  } catch (e) {
    console.error(e);
  }
}

checkDetails();