import { connect } from "../db/mongo.js";
import { integratedBetfairOrder } from "../controller/integratedBetfair.js";

export async function pollBetfair() {
    console.log("trying")
  try {
    const db = await connect();
    const betsCol = db.collection("bets");
    // const unplacedBets = await betsCol.find({ betfairPlaced: false }).toArray();
     const unplacedBets = await betsCol.find({ betfairPlaced: { $ne: true } }).toArray();

    for (const bet of unplacedBets) {
      try {
        const result = await integratedBetfairOrder(bet);
        await betsCol.updateOne(
          { apolloBetId: bet.apolloBetId },
          { $set: { betfairPlaced: true, success: result?.status === "SUCCESS" } }
        );
      } catch (err) {
        console.error(`❌ Betfair API failed for ${bet.apolloBetId}:`, err.message);
        await betsCol.updateOne({ apolloBetId: bet.apolloBetId }, { $set: { betfairPlaced: true, success: false } });
      }
    }
  } catch (err) {
    console.error("Worker error (Betfair):", err);
  }
}

export function startBetfairWorker() {
  setInterval(pollBetfair, 10000);
}
