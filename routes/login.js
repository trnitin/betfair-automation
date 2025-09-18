import express from "express";
import { integratedBetfairLogin } from "../controller/betfairLogin.js";
const router = express.Router();

router.get("/betfairLogin",integratedBetfairLogin );

export default router;
