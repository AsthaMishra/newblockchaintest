const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();
const abi = require("./abi/basicnft.json");

const apikey = `${process.env.ALCHEMY_GOERLI}${process.env.ALCHEMY_KEY}`;
const provider = new ethers.providers.WebSocketProvider(apikey);
const contractAddress = "0x4c0dBCEB2F3298AF0aCB0c69cdccd465347f7101"; //"0x4c0dBCEB2F3298AF0aCB0c69cdccd465347f7101"; // address of the smart contract
const contract = new ethers.Contract(contractAddress, abi, provider);

async function main() {
  provider.on("debug", (data) => {
    console.log("data ", data);
  });

  contract.on("Transfer", (from, to, tokenId, event) => {
    console.log(
      `${event} token if ${tokenId}  txn hash ${event.data.transactionHash}`
    );

    let info = {
      from: from,
      to: to,
      tokenId: tokenId,
      data: event,
    };
    console.log(JSON.stringify(info, null, 4));
    GetTotalCost(event.data.transactionHash);
    getDetailsOfToken(contract, tokenId);
    //getMetaDataOfToken();

    //   if (
    //     event.returnValues.from != "0x0000000000000000000000000000000000000000"
    //   )
    //     checkForMaliciousAdd(event.returnValues.from);

    //   if (event.returnValues.to != "0x0000000000000000000000000000000000000000")
    //     checkForMaliciousAddressOnBitCoinAbuseList(event.returnValues.to);
  });
}

async function GetTotalCost(txnHash) {
  const transactionReciept = await provider.getTransactionReceipt(txnHash);

  console.log("=====================================");
  console.log("Reciept ", transactionReciept);
  const { gasUsed, effectiveGasPrice } = transactionReciept;
  console.log(
    "total transaction cost ",
    transactionReciept.gasUsed,
    " effectiveGasPrice ",
    transactionReciept.effectiveGasPrice
  );
  const gasCost = gasUsed * effectiveGasPrice;

  const etherValue = ethers.utils.formatEther(gasCost);

  console.log("total transaction cost ", etherValue, "eth");
}

async function getDetailsOfToken(contract, tokenId) {
  const tokenURI = await contract.tokenURI(tokenId);
  console.log("tokenURI ", tokenURI);

  const ownerOfTokenId = await contract.ownerOf(tokenId);
  console.log("ownerOfTokenId ", ownerOfTokenId);

  const nftCounter = await contract.getCounter();
  console.log("nftPrice ", nftCounter);
}

async function getMetaDataOfToken() {
  // Replace with the wallet address you want to query:

  console.log("fetch metadata =============");
  const tokenAddr = contractAddress;

  var data = JSON.stringify({
    jsonrpc: "2.0",
    method: "alchemy_getTokenMetadata",
    params: [`${tokenAddr}`],
    id: 42,
  });

  var config = {
    method: "post",
    url: apikey,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data.result, null, 2));
    })
    .catch(function (error) {
      console.log(error);
    });
}

//check for malicious addresses on etherium abuse list
async function checkForMaliciousAdd(addTockeck) {
  const address = addTockeck; // The address to check

  var config = {
    method: "get",
    url: `https://api.abuseipdb.com/api/v2/check?ethereumAddress=${address}&maxAgeInDays=90`,
    headers: {
      Key: apikey, // Replace with your API key
      Accept: "application/json",
    },
  };

  axios(config)
    .then((response) => response.json()) // Parse the response as JSON
    .then((data) => {
      if (data.data.abuseConfidenceScore > 0) {
        console.log(`${address} has been flagged as potentially abusive.`);
        console.log(
          `Abuse confidence score: ${data.data.abuseConfidenceScore}`
        );
      } else {
        console.log(`${address} is not currently flagged as abusive.`);
      }
    })
    .catch((error) => console.error(error));
}

//check for malicious addresses on bitcoin abuse list
async function checkForMaliciousAddressOnBitCoinAbuseList(addTockeck) {
  const address = addTockeck; // The address to check

  var config = {
    method: "get",
    url: `https://www.bitcoinabuse.com/api/reports/check?address=${address}`,
    headers: {
      Key: apikey, // Replace with your API key
      Accept: "application/json",
    },
  };

  axios(config)
    .then((response) => response.json()) // Parse the response as JSON
    .then((data) => {
      if (data.data.abuseConfidenceScore > 0) {
        console.log(`${address} has been flagged as potentially abusive.`);
        console.log(
          `Abuse confidence score: ${data.data.abuseConfidenceScore}`
        );
      } else {
        console.log(`${address} is not currently flagged as abusive.`);
      }
    })
    .catch((error) => console.error(error.message));
}

main()
  .then(() => {
    console.log("done");
  })
  .catch((error) => {
    console.log(error);
  });
