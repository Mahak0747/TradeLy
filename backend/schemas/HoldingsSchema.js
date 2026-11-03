const mongoose = require("mongoose");
const { Schema } = mongoose;

const HoldingsSchema = new Schema({
    name: {
        type: String,
        required: true
    },

    qty: {
        type: Number,
        required: true
    },

    avg: {
        type: Number,
        required: true
    },

    price: {
        type: Number,
        default: 0
    },

    net: {
        type: String,
        default: "0%"
    },

    day: {
        type: String,
        default: "0%"
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
});

module.exports = { HoldingsSchema };