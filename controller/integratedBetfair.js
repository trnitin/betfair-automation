import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import { connect } from "../db/mongo.js";

const appKey = "DsGV2EVu8pDQHvVs";

async function getSessionTokenFromFile() {
  const filePath = path.join(process.cwd(), "BetfairAuth.json");
  const fileContents = await fs.readFile(filePath, "utf-8");
  const { sessionToken } = JSON.parse(fileContents);
  if (!sessionToken) throw new Error("No session token found in BetfairAuth.json");
  return sessionToken;
}

export async function integratedBetfairOrder({ marketId, selectionId, side, sizeTotal }) {
  const sessionToken = await getSessionTokenFromFile();
  const placeOrderUrl = "https://api.betfair.com/exchange/betting/rest/v1.0/placeOrders/";

  const orderBody = {
    marketId,
    instructions: [
      {
        selectionId,
        side: side === 0 ? "LAY" : "BACK",
        orderType: "LIMIT",
        limitOrder: {
          size: sizeTotal / 100,
          price: 500,
          persistenceType: "LAPSE",
        },
      },
    ],
    customerRef: `lotus-${Date.now()}`,
  };

  const orderResponse = await fetch(placeOrderUrl, {
    method: "POST",
    headers: {
      "X-Application": appKey,
      "X-Authentication": sessionToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(orderBody),
  });

  const orderText = await orderResponse.text();
  if (!orderResponse.ok) throw new Error(orderText);
  return JSON.parse(orderText);
}


export async function saveOrUpdateBets(bets) {
  const db = await connect();
  const betsCol = db.collection("bets");
  for (const bet of bets) {
    await betsCol.updateOne({ apolloBetId: bet.apolloBetId }, { $set: bet }, { upsert: true });
  }
}
