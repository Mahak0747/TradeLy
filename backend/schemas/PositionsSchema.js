const mongoose = require("mongoose");
const { Schema } = mongoose;

const PositionsSchema = new Schema({
    product: {
        type: String,
        default: "CNC"
    },

    name: String,

    qty: Number,

    avg: Number,

    price: Number,

    net: String,

    day: String,

    isLoss: Boolean,

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

module.exports = { PositionsSchema };