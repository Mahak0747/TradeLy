const mongoose = require("mongoose");
const { UsersSchema } = require("../schemas/UsersSchema");

const UsersModel = mongoose.model("User", UsersSchema);

module.exports = UsersModel;