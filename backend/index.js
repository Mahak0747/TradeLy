require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);


// Routes
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");

// Authentication Middleware
const authMiddleware = require("./middleware/authMiddleware");


// Models
const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");


const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;


const app = express();


// Middlewares
app.use(cors());
app.use(bodyParser.json());


// Authentication Routes

app.use("/api/auth", authRoutes);

app.use("/api/stocks", stockRoutes);



/*
    STOCK APIs
*/


app.get("/allHoldings", async (req, res) => {


    try {


        const holdings =
            await HoldingsModel.find({});



        const updatedHoldings =
            await Promise.all(

                holdings.map(async (stock) => {


                    const quote =
                        await yahooFinance.quote(
                            `${stock.name}.NS`
                        );



                    const currentPrice =
                        quote.regularMarketPrice;



                    const curValue =
                        currentPrice * stock.qty;



                    const profit =
                        (curValue - stock.avg * stock.qty);



                    return {


                        name: stock.name,

                        qty: stock.qty,

                        avg: stock.avg,


                        price: currentPrice,


                        curValue: curValue,


                        profit: profit,


                        net:
                            quote.regularMarketChangePercent
                                ?
                                quote.regularMarketChangePercent.toFixed(2) + "%"
                                :
                                "0%",


                        day:
                            quote.regularMarketChange >= 0
                                ?
                                "UP"
                                :
                                "DOWN",


                        isLoss:
                            profit < 0



                    };


                })

            );



        res.json(updatedHoldings);



    }
    catch (err) {


        console.log(err);


        res.status(500)
            .json({

                error: err.message

            });


    }


});


app.get("/allPositions", async (req, res) => {

    try {

        let allPositions =
            await PositionsModel.find({});

        res.json(allPositions);

    }
    catch (err) {

        res.status(500)
            .json({
                error: err.message
            });

    }

});




app.post("/newOrder", async (req, res) => {


    try {


        const {
            name,
            qty,
            price,
            mode
        } = req.body;




        // 1. Save order

        const newOrder =
            new OrdersModel({

                name,
                qty,
                price,
                mode

            });


        await newOrder.save();






        // 2. Update Holdings only for BUY

        if (mode === "BUY") {



            const existingHolding =
                await HoldingsModel.findOne({
                    name: name
                });





            if (existingHolding) {



                // already holding this stock

                const totalQuantity =
                    existingHolding.qty + qty;



                const totalInvestment =
                    (existingHolding.avg * existingHolding.qty)
                    +
                    (price * qty);



                existingHolding.qty =
                    totalQuantity;



                existingHolding.avg =
                    totalInvestment / totalQuantity;



                existingHolding.price =
                    price;



                await existingHolding.save();



            }

            else {


                // first time buying this stock


                const newHolding =
                    new HoldingsModel({

                        name: name,

                        qty: qty,

                        avg: price,

                        price: price,

                        net: "0%",

                        day: "UP"


                    });



                await newHolding.save();


            }



        }




        res.json({

            message: "Order and Holding updated successfully"

        });



    }

    catch (err) {


        console.log(
            "NEW ORDER ERROR:",
            err
        );



        res.status(500)
            .json({

                error: err.message

            });


    }


});





/*
    SERVER START
*/


app.listen(PORT, async () => {


    console.log(
        `Server running on port ${PORT}`
    );


    try {

        await mongoose.connect(uri);

        console.log(
            "MongoDB connected"
        );

    }
    catch (err) {

        console.log(
            "MongoDB Error:",
            err.message
        );

    }


});