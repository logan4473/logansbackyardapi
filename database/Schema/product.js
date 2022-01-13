const mongoose = require("mongoose");

const product = new mongoose.Schema({
  Name: { type: String },
  Category: { type: String },
  Price: { type: Number },
  Description: { type: String },
  Seller: { type: String },
  Stock: { type: Number },
  Rating : {type:Number}
});
product.index({'$**':'text'})
module.exports = mongoose.model("products", product);
