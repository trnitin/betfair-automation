// const fetcher = require('../helper/fetcher')
// const fs = require('fs').promises
// const read = require('../helper/fileHelper');
// const fss = require('fs');
// const path = require('path');
// const puppeteer = require('puppeteer');
import puppeteer from 'puppeteer';
import fs from 'fs/promises'; 


export const integratedBetfairLogin = async (req, res) => {
    try {
        const username = "u3613129050@gmail.com"; // replace
        const password = "bet365@123"; // replace

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        page.setDefaultTimeout(60000); // increase timeout globally (slow VPN)
        page.setDefaultNavigationTimeout(60000);

        await page.goto("https://www.betfair.com/exchange/plus/", {
            waitUntil: "domcontentloaded", // faster + less likely to hang
        });
        // await page.goto("https://www.betfair.com/exchange/plus/", { waitUntil: "networkidle2" });

        // Function to continuously dismiss banner if it appears
        const dismissBanner = async () => {
            const banner = await page.$("#onetrust-banner-sdk, #onetrust-button-group-parent");
            if (banner) {
                console.log("Cookie banner detected — dismissing...");
                const btn = await page.$("#onetrust-reject-all-handler");
                if (btn) {
                    await page.evaluate((b) => b.click(), btn);
                    //   await page.waitForTimeout(500); // wait for banner to disappear
                    await new Promise(resolve => setTimeout(resolve, 100));
                    console.log("Banner dismissed.");
                }
            }
        };

        // Wait for username input & repeatedly check for banner
        await page.waitForSelector("#ssc-liu", { timeout: 20000 });
        await dismissBanner();

        // Type username char-by-char, checking banner in between
        for (const char of username) {
            await page.type("#ssc-liu", char, { delay: 100 });
            await dismissBanner();
        }

        // Type password char-by-char, checking banner in between
        for (const char of password) {
            await page.type("#ssc-lipw", char, { delay: 100 });
            await dismissBanner();
        }

        // Ensure login button is visible and clickable
        const loginButton = await page.$("#ssc-lis");
        if (!loginButton) throw new Error("Login button not found");
        await page.evaluate((btn) => btn.scrollIntoView({ block: "center" }), loginButton);

        // Retry clicking login button if necessary
        let clicked = false;
        for (let i = 0; i < 3; i++) {
            try {
                await page.evaluate((btn) => btn.click(), loginButton);
                clicked = true;
                break;
            } catch {
                console.log("Retrying login click...");
                // await page.waitForTimeout(500);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        if (!clicked) throw new Error("Failed to click login button");
        // await new Promise(resolve => setTimeout(resolve, 1000));
        // // Wait for navigation
        // await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 50000 });
        // await new Promise(resolve => setTimeout(resolve, 500));
        //  await dismissBanner();
        try {
            await Promise.race([
                page.waitForSelector("#ssc-myacc", { timeout: 25000 }).catch(() => null),
                page.waitForSelector(".ssc-logout", { timeout: 25000 }).catch(() => null),
            ]);
            console.log("✅ Login successful (post-login element found).");
        } catch {
            console.warn("⚠️ Could not detect post-login element, continuing anyway...");
        }

        await dismissBanner(); // cleanup again if needed

        // Extract ssoid cookie
        const cookies = await page.cookies();
        await dismissBanner();
        const ssoidCookie = cookies.find((c) => c.name === "ssoid");
        await dismissBanner();
        const sessionToken = ssoidCookie?.value;

        await browser.close();

        if (!sessionToken) throw new Error("Failed to retrieve ssoid from cookies");

        await fs.writeFile("BetfairAuth.json", JSON.stringify({ sessionToken }, null, 2), "utf-8");
        console.log("Session token saved to auth.json");

        res.send({
            message: "Session token retrieved successfully",
            sessionToken,
        });
    } catch (err) {
        console.error("Puppeteer login error:", err.message);
        res.status(500).send("Failed to get session token");
    }
};