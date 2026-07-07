const express = require("express");

const router = express.Router();

const User = require("../model/UserModel");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");


// SIGNUP

router.post("/signup", async (req, res) => {

    try {

        const {
            username,
            email,
            password
        } = req.body;


        const existingUser =
            await User.findOne({
                email
            });


        if (existingUser) {

            return res.status(400).json({
                message: "User already exists"
            });

        }


        const hashedPassword =
            await bcrypt.hash(password, 10);


        const newUser =
            new User({

                username,

                email,

                password: hashedPassword

            });


        await newUser.save();


        res.status(201).json({

            message: "Signup successful"

        });


    }
    catch (err) {

        console.log(err);

        res.status(500).json({

            error: err.message

        });

    }


});




// LOGIN

router.post("/login", async (req, res) => {

    try {


        const {
            email,
            password
        } = req.body;



        const user =
            await User.findOne({
                email
            });



        if (!user) {

            return res.status(404).json({

                message: "User not found"

            });

        }



        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );



        if (!isMatch) {

            return res.status(401).json({

                message: "Invalid password"

            });

        }



        const token =
            jwt.sign(

                {
                    id: user._id,
                    email: user.email
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }

            );



        res.json({

            message: "Login successful",

            token

        });



    }
    catch (err) {

        console.log(err);

        res.status(500).json({

            error: err.message

        });

    }


});



module.exports = router;