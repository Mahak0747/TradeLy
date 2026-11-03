const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrdersSchema = new Schema({
    name: {
        type: String,
        required: true
    },

    qty: {
        type: Number,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    mode: {
        type: String,
        enum: ["BUY", "SELL"],
        required: true
    },

    status: {
        type: String,
        default: "COMPLETED"
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

module.exports = { OrdersSchema };