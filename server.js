import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

/* ----------------------------------------
   LOG EVERY REQUEST (helps us debug)
----------------------------------------- */
app.use((req, res, next) => {
  console.log(`📡 Request → ${req.method} ${req.url}`);
  next();
});

/* ----------------------------------------
   SPARKLINE (Yahoo Chart API)
----------------------------------------- */
app.get("/spark", async (req, res) => {
  try {
    const symbol = req.query.symbol;
    if (!symbol) return res.status(400).json({ error: "Symbol required" });

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=7d&interval=1d`;

    const r = await fetch(url);
    const json = await r.json();

    const result = json.chart?.result?.[0];
    if (!result) return res.json([]);

    const closes = result.indicators.quote[0].close;
    res.json(closes);
  } catch (err) {
    console.error("Sparkline Error:", err);
    res.status(500).json({ error: "Sparkline fetch failed" });
  }
});

/* ----------------------------------------
   NEWS (Reddit WSB)
----------------------------------------- */
app.get("/news", async (req, res) => {
  try {
    const r = await fetch("https://www.reddit.com/r/wallstreetbets/hot.json?limit=20");
    const json = await r.json();

    if (!json?.data?.children) return res.json([]);

    const articles = json.data.children.map(post => ({
      title: post.data.title,
      url: "https://reddit.com" + post.data.permalink,
      source: "r/" + post.data.subreddit,
      publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
      description: post.data.selftext || "",
      ups: post.data.ups,
    }));

    res.json(articles);
  } catch (err) {
    console.error("News error:", err);
    res.status(500).json({ error: "News fetch failed" });
  }
});

/* ----------------------------------------
   YAHOO FINANCE — TOP GAINERS
----------------------------------------- */
app.get("/gainers", async (req, res) => {
  try {
    const url =
      "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=10";

    const r = await fetch(url);
    const json = await r.json();

    const quotes = json.finance?.result?.[0]?.quotes;
    if (!quotes) return res.json([]);

    const data = quotes.map(q => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
      pct: q.regularMarketChangePercent,
    }));

    res.json(data);
  } catch (err) {
    console.error("Gainers error:", err);
    res.status(500).json({ error: "Failed to fetch gainers" });
  }
});

/* ----------------------------------------
   YAHOO FINANCE — TOP LOSERS
----------------------------------------- */
app.get("/losers", async (req, res) => {
  try {
    const url =
      "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_losers&count=10";

    const r = await fetch(url);
    const json = await r.json();

    const quotes = json.finance?.result?.[0]?.quotes;
    if (!quotes) return res.json([]);

    const data = quotes.map(q => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
      pct: q.regularMarketChangePercent,
    }));

    res.json(data);
  } catch (err) {
    console.error("Losers error:", err);
    res.status(500).json({ error: "Failed to fetch losers" });
  }
});

/* ----------------------------------------
   START SERVER
----------------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
