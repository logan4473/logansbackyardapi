const mongoose = require("mongoose");

const user = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  mobile : { type: Number },
  cart : [{ type: String }],
  hash : { type: String },
  salt : { type: String },
  prevOrders : [{
    productId : {type: String},
    address : {type: String}
  }]
});

module.exports = mongoose.model("users", user);
