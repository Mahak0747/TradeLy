const User = require("../model/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// SIGNUP
exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });
        res.status(201).json({message: "Signup successful",user});
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// LOGIN
exports.login = async (req, res) => {
    try {
        const {email,password} = req.body;
        const user =await User.findOne({ email });
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        const match = await bcrypt.compare(password,user.password);
        if (!match) {
            return res.status(401).json({message: "Wrong password"});
        }
        const token = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );
        res.json({message: "Login successful",token});
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
};