const mongoose = require("mongoose");
const { Schema } = mongoose;

const FundsSchema = new Schema({
    availableMargin: {
        type: Number,
        default: 100000
    },

    usedMargin: {
        type: Number,
        default: 0
    },

    availableCash: {
        type: Number,
        default: 100000
    },

    openingBalance: {
        type: Number,
        default: 100000
    },

    payin: {
        type: Number,
        default: 0
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

module.exports = { FundsSchema };