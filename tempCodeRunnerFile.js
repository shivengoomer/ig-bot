const puppeteer = require('puppeteer');

const IG_USERNAME = 'sheshopdummy';
const IG_PASSWORD = 'sheshop@123';

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
        await page.type('input[name="username"]', IG_USERNAME, { delay: 100 });
        await page.type('input[name="password"]', IG_PASSWORD, { delay: 100 });
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log("Logged in successfully ✅");
    } catch (error) {
        console.error("Error logging in to Instagram:", error);
        throw error;
    }
}

async function getUnreadThreadIDs(page) {
    try {
        await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000); // Let messages load

        const threadIDs = await page.evaluate(() => {
            const unreadMessages = document.querySelectorAll('div[role="listitem"] div[aria-label="Unread"]');
            return Array.from(unreadMessages).map(el => {
                const parent = el.closest('a');
                return parent ? parent.getAttribute('href').split('/t/')[1].replace('/', '') : null;
            }).filter(Boolean);
        });

        return threadIDs;
    } catch (error) {
        console.error("Error getting unread messages:", error);
        return [];
    }
}

async function openAndReplyToDM(page, threadID) {
    try {
        const dmURL = `https://www.instagram.com/direct/t/${threadID}/`;
        await page.goto(dmURL, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000); // Allow chat to load

        // Send the message
        const replyMessage = "To register your product, please send the details in the format:\nname\nprice\nsize\npost url\nstock";
        await page.waitForSelector('textarea', { timeout: 5000 });
        await page.type('textarea', replyMessage, { delay: 100 });
        await page.keyboard.press('Enter');
        console.log(`Replied in thread ${threadID}`);
    } catch (error) {
        console.error(`Error replying to thread ${threadID}:`, error);
    }
}

async function listenForDMs(page) {
    console.log("Listening for unread DMs...");

    while (true) {
        try {
            const unreadThreads = await getUnreadThreadIDs(page);
            if (unreadThreads.length === 0) {
                console.log("No unread DMs found.");
            } else {
                for (const threadID of unreadThreads) {
                    await openAndReplyToDM(page, threadID);
                }
            }
            await page.waitForTimeout(10000); // Wait before checking again
        } catch (error) {
            console.error("Error in DM listener:", error);
        }
    }
}

(async () => {
    const { browser, page } = await setupBrowser();
    await loginToInstagram(page);
    listenForDMs(page);
})();
