const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

const IG_USERNAME = process.env.IG_USERNAME || 'sheshopdummy';
const IG_PASSWORD = process.env.IG_PASSWORD || 'sheshop@123';

async function setupBrowser() {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
            executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        return { browser, page };
    } catch (error) {
        console.error("Error setting up the browser:", error);
        throw error;
    }
}

async function loginToInstagram(page) {
    try {
        await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[name="username"]', { visible: true });
        await page.type('input[name="username"]', IG_USERNAME, { delay: 100 });
        await page.type('input[name="password"]', IG_PASSWORD, { delay: 100 });
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log("✅ Logged in successfully.");
    } catch (error) {
        console.error("❌ Error logging in to Instagram:", error);
        throw error;
    }
}

async function extractLastMessage(page, threadUrl) {
    try {
        await page.goto(threadUrl, { waitUntil: 'networkidle2' });

        // Handle popups (e.g., "Turn on notifications")
        await page.waitForSelector('button[type="button"]', { visible: true, timeout: 5000 }).then(async () => {
            const popupButton = await page.$('button[type="button"]');
            if (popupButton) await popupButton.click();
        }).catch(() => {});

        // Wait for messages to load
        await page.waitForSelector('div[role="row"]', { visible: true, timeout: 15000 });

        // Scroll to load more messages
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);
        }

        // Extract the last message
        const lastMessage = await page.evaluate(() => {
            const messages = document.querySelectorAll('div[role="row"] div[dir="auto"]');
            return messages.length ? messages[messages.length - 1].innerText.trim() : "No messages found";
        });

        // Save the last message to a JSON file
        const messageData = { threadUrl, lastMessage };
        fs.writeFileSync('last_message.json', JSON.stringify(messageData, null, 2));

        console.log("✅ Last message saved:", messageData);
    } catch (error) {
        console.error(`❌ Error extracting last message from ${threadUrl}:`, error);
    }
}

(async () => {
    const threadUrl = "https://www.instagram.com/direct/t/17843396633837186/"; // Replace with your DM thread URL
    const { browser, page } = await setupBrowser();
    await loginToInstagram(page);
    await extractLastMessage(page, threadUrl);
    await browser.close();
})();