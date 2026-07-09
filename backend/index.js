require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dns = require("dns");
const YahooFinance = require("yahoo-finance2").default;

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const yahooFinance = new YahooFinance();

const app = express();

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;


//middleware

app.use(cors());
app.use(bodyParser.json());


//routes

const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);


//authentication

const authMiddleware = require("./middleware/authMiddleware");

//models

const { HoldingsModel } = require("./model/HoldingsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { PositionsModel } = require("./model/PositionsModel");
const { FundsModel } = require("./model/FundsModel");


//market indices

app.get("/marketIndices", async (req, res) => {
    try {
        const nifty = await yahooFinance.quote("^NSEI");
        const sensex = await yahooFinance.quote("^BSESN");
        res.json({
            nifty: {
                price: nifty.regularMarketPrice,
                change: nifty.regularMarketChange,
                percent: nifty.regularMarketChangePercent
            },
            sensex: {
                price: sensex.regularMarketPrice,
                change: sensex.regularMarketChange,
                percent: sensex.regularMarketChangePercent
            }
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
});


//get orders

app.get("/orders", authMiddleware, async (req, res) => {
    try {
        const orders = await OrdersModel.find({userId: req.user.id}).sort({ createdAt: -1 });
        res.json(orders);
    } 
    catch (err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
});


//get funds

app.get("/funds", authMiddleware, async (req, res) => {
    try {
        let fund = await FundsModel.findOne({userId: req.user.id});
        if (!fund) {
            fund = await FundsModel.create({
                userId: req.user.id,
                availableMargin: 100000,
                usedMargin: 0,
                availableCash: 100000,
                openingBalance: 100000,
                payin: 0
            });
        }
        res.json(fund);
    } 
    catch (err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
});
 

//get holdings from live prices

app.get("/allHoldings", authMiddleware, async (req, res) => {
    try {
        const holdings = await HoldingsModel.find({userId: req.user.id});
        const updated = await Promise.all(
            holdings.map(async (stock) => {
                try {
                    const quote = await yahooFinance.quote(`${stock.name}.NS`);
                    const price = quote.regularMarketPrice || stock.price || 0;
                    const curValue = price * stock.qty;
                    const profit = curValue - stock.avg * stock.qty;
                    return {
                        name: stock.name,
                        qty: stock.qty,
                        avg: stock.avg,
                        price,
                        curValue,
                        profit,
                        net: `${(quote.regularMarketChangePercent || 0).toFixed(2)}%`,
                        day: `${quote.regularMarketChangePercent >= 0 ? "+" : ""}${(quote.regularMarketChangePercent || 0).toFixed(2)}%`
                    };
                } 
                catch {
                    return {
                        name: stock.name,
                        qty: stock.qty,
                        avg: stock.avg,
                        price: stock.price || 0,
                        curValue: (stock.price || 0) * stock.qty,
                        profit: ((stock.price || 0) - stock.avg) * stock.qty,
                        net: "0%",
                        day: "0%"
                    };
                }
            })
        );
        res.json(updated);
    } 
    catch (err) {
        res.status(500).json({error: err.message});
    }
});
 

//get positions

app.get("/allPositions", authMiddleware, async (req, res) => {
    try {
        const positions = await PositionsModel.find({userId: req.user.id});
        const updated = await Promise.all(
            positions.map(async (stock) => {
                try {
                    const quote = await yahooFinance.quote(`${stock.name}.NS`);
                    const price = quote.regularMarketPrice || stock.price;
                    return {
                        ...stock.toObject(),
                        price,
                        net: `${(quote.regularMarketChangePercent || 0).toFixed(2)}%`,
                        day: `${quote.regularMarketChangePercent >= 0 ? "+" : ""}${(quote.regularMarketChangePercent || 0).toFixed(2)}%`,
                        isLoss: price < stock.avg
                    };
                } 
                catch {
                    return stock;
                }
            })
        );
        res.json(updated);
    } 
    catch (err) {
        res.status(500).json({error: err.message});
    }
});
 

//place new orders

app.post("/newOrder", authMiddleware, async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body;
    if (!name || !mode) { return res.status(400).json({message: "Invalid request"});}
    if (qty <= 0) {return res.status(400).json({message: "Quantity must be greater than 0"});}
    if (price <= 0) {return res.status(400).json({message: "Price must be greater than 0"});}

    const userId = req.user.id;
    if (!name || !qty || !price || !mode) {
      return res.status(400).json({message: "Missing required fields",});
    }

    let fund = await FundsModel.findOne({ userId });
    if (!fund) {
      fund = await FundsModel.create({
        userId,
        availableMargin: 100000,
        availableCash: 100000,
        openingBalance: 100000,
        usedMargin: 0,
        payin: 0,
      });
    }
    if (mode === "BUY") {
      const cost = qty * price;
      if (fund.availableCash < cost) {
        return res.status(400).json({message: "Insufficient Balance",});
      }
      fund.availableCash -= cost;
      fund.availableMargin -= cost;
      fund.usedMargin += cost;
      await fund.save();

      let holding = await HoldingsModel.findOne({ userId, name });

      if (holding) {
        const totalQty = holding.qty + qty;
        holding.avg =(holding.avg * holding.qty + price * qty) / totalQty;
        holding.qty = totalQty;
        holding.price = price;
        await holding.save();
      } 
      else {
        await HoldingsModel.create({
          userId,
          name,
          qty,
          avg: price,
          price,
          net: "0%",
          day: "0%",
        });
      }
      let position = await PositionsModel.findOne({userId,name,});

      if (position) {
        position.qty += qty;
        position.price = price;
        await position.save();
      } 
      else {
        await PositionsModel.create({
          userId,
          product: "CNC",
          name,
          qty,
          avg: price,
          price,
          net: "0%",
          day: "0%",
          isLoss: false,
        });
      }
    }

    if (mode === "SELL") {
      const holding = await HoldingsModel.findOne({userId,name,});
      if (!holding) {
        return res.status(400).json({message: "No Holdings Found",});
      }

      if (holding.qty < qty) {
        return res.status(400).json({message: "Not enough quantity",});
      }

      holding.qty -= qty;
      if (holding.qty === 0) {
        await HoldingsModel.deleteOne({_id: holding._id,});
      } 
      else {
        await holding.save();
      }

      const position = await PositionsModel.findOne({userId,name,});

      if (position) {
        position.qty -= qty;
        if (position.qty <= 0) {
          await PositionsModel.deleteOne({_id: position._id,});
        } 
        else {
          await position.save();
        }
      }

      const amount = qty * price;
      fund.availableCash += amount;
      fund.availableMargin += amount;
      fund.usedMargin = Math.max(0,fund.usedMargin - amount);
      await fund.save();
    }
    await OrdersModel.create({
      userId,
      name,
      qty,
      price,
      mode,
      status: "COMPLETED",
    });

    res.json({success: true,message: "Order Placed Successfully",});
  } 
  catch (err) {
    console.log(err);
    res.status(500).json({error: err.message,});
  }
});


//start server

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        await mongoose.connect(uri);
        console.log("MongoDB Connected");
    } 
    catch (err) {
        console.log("MongoDB Connection Error:",err.message);
    }
});