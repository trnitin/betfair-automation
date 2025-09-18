import { MongoClient } from "mongodb";

const url = "mongodb+srv://nitin:nitin@cluster0.kbnly1e.mongodb.net/";
const dbName = "lotus";

let client;

export async function connect() {
  if (!client) {
    client = new MongoClient(url,{ serverSelectionTimeoutMS: 10000});
    await client.connect();
    console.log("✅ Connected to MongoDB");
  }
  return client.db(dbName);
}
