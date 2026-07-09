const mongoose = require("mongoose");
const { FundsSchema } = require("../schemas/FundsSchema");

const FundsModel = mongoose.model("Fund", FundsSchema);

module.exports = { FundsModel };