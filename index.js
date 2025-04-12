const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/scrape", async (req, res) => {
  const movieUrl = req.query.url;
  if (!movieUrl) return res.status(400).send("Missing ?url");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.goto(movieUrl, { waitUntil: "networkidle2" });

  // wait and try to click play
  try {
    await page.waitForSelector("button svg path[d*='M1.33398 8.00378']", { timeout: 5000 });
    await page.click("button svg path[d*='M1.33398 8.00378']");
  } catch {}

  await page.waitForTimeout(5000); // wait for m3u8 to load

  const logs = [];
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes(".m3u8")) {
      logs.push(url);
    }
  });

  await page.waitForTimeout(5000);
  await browser.close();

  if (logs.length === 0) return res.send("No m3u8 found");
  res.send({ stream: logs[0] });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
