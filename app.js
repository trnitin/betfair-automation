import express from "express";
import BetfairLogin from "./routes/login.js";
import LoginRoutes from "./routes/login.js";
import { startBetfairWorker } from "./worker/workerBetfair.js";


const app = express();
app.use(express.json());
// app.use("/api", BetfairLogin);
app.use(LoginRoutes)

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startBetfairWorker();
});
