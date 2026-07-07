import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import GeneralContext from "./GeneralContext";

import "./BuyActionWindow.css";


const BuyActionWindow = ({ stock }) => {


    const [stockQuantity, setStockQuantity] = useState(1);


    const [stockPrice, setStockPrice] = useState(
        stock?.price || 0
    );



    const generalContext = useContext(GeneralContext);



    const handleBuyClick = async () => {


        try {


            await axios.post(

                "http://localhost:3002/newOrder",

                {

                    name: stock.name,

                    qty: Number(stockQuantity),

                    price: Number(stockPrice),

                    mode: "BUY"

                }

            );



            alert("Stock Bought Successfully");


            generalContext.closeBuyWindow();



        }

        catch (err) {


            console.log(

                "BUY ERROR",

                err.response?.data || err.message

            );


        }



    };




    return (

        <div className="container" id="buy-window">


            <div className="regular-order">


                <h3>

                    {stock?.name}

                </h3>


                <div className="inputs">


                    <fieldset>

                        <legend>
                            Qty.
                        </legend>


                        <input

                            type="number"

                            value={stockQuantity}

                            onChange={(e) =>
                                setStockQuantity(e.target.value)
                            }

                        />


                    </fieldset>



                    <fieldset>

                        <legend>
                            Price
                        </legend>


                        <input

                            type="number"

                            value={stockPrice}

                            onChange={(e) =>
                                setStockPrice(e.target.value)
                            }

                        />


                    </fieldset>


                </div>


            </div>



            <div className="buttons">


                <span>
                    Margin required ₹140.65
                </span>


                <div>


                    <Link

                        className="btn btn-blue"

                        onClick={handleBuyClick}

                    >

                        Buy

                    </Link>



                    <Link

                        className="btn btn-grey"

                        onClick={
                            generalContext.closeBuyWindow
                        }

                    >

                        Cancel

                    </Link>



                </div>


            </div>


        </div>


    );


};


export default BuyActionWindow;