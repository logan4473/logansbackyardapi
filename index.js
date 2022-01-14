require('dotenv').config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 4000;
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const secretKey = process.env.Enc;

mongoose.connect(process.env.DB);

const product = require("./database/Schema/product");

const user = require("./database/Schema/user");

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Backend is active");
});

app.get("/api/products", (req, res) => {
  product.find().then((products) => {
    res.json(products);
  });
});

app.get("/api/product/:id", (req, res) => {
  product.findOne({ _id: req.params.id }).then((prod) => {
    res.json(prod);
  });
});

app.get("/api/products/query", (req, res) => {
  req.query.search
    ? product
        .find({ $text: { $search: req.query.search } })
        .then((products) => {
          res.json(products);
        })
    : product.find(req.query).then((products) => {
        res.json(products);
      });
});

app.get("/api/products/category/:category", (req, res) => {
  product.find({ Category: req.params.category }).then((products) => {
    res.json(products);
  });
});

app.post("/api/login", (req, res) => {
  user
    .findOne({ mobile: req.body.mobile })
    .then((user) => {
      user
        ? bcrypt.compare(req.body.password, user.hash, (error, result) => {
            error
              ? res.send(error)
              : result
              ? jwt.sign({ user }, secretKey, (error, token) => {
                  error ? res.sendStatus(500) : res.send(token);
                })
              : res.sendStatus(403);
          })
        : res.sendStatus(404);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.post("/api/signup", (req, res) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(req.body.password, salt);

  req.body.salt = salt;
  req.body.hash = hash;
  delete req.body.password;

  user
    .create(req.body)
    .then((user) => {
      jwt.sign({ user }, secretKey, (error, token) => {
        error ? res.sendStatus(500) : res.send(token);
      });
    })
    .catch((err) => {
      res.send(err.message);
    });
});

app.post("/api/verify",(req,res)=>{
  jwt.verify(req.body.token,secretKey,(err,data)=>{
    err?res.sendStatus(500):res.send(data.user);
  });
});

app.post("/api/cart", (req, res) => {
  product
    .find({ _id: { $in: req.body.array } })
    .then((products) => {
      res.json(products);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.post("/api/cart/update", (req, res) => {
  if (!req.body.array) {
    req.body.array = [];
  }

  user
    .findOneAndUpdate({ _id: req.body.userid }, { $set: { cart: req.body.array } },{new:true},(err,user)=>{
      err?res.send(500):jwt.sign({ user }, secretKey, (error, token) => {
        error ? res.sendStatus(500) : res.send(token);
      });
    });
});


app.post("/api/payment",(req,res)=>{

  const qty =  parseInt(req.body.qty);
  const address = req.body.address;
  jwt.verify(req.body.token,secretKey,(err,data)=>{
    if(err)res.sendStatus(403);
    const userid = data.user._id;
    const cart = data.user.cart;
    if(cart.includes(req.body.productid)){
      cart.splice(cart.findIndex(i=>(i===req.body.productid)),1);
    }
    product.findOneAndUpdate(
      {_id: req.body.productid , Stock : {$gte:qty}},
      {$inc : {Stock : -1*qty}},
      (err,prod)=>{
        err?res.sendStatus(404):prod?user.findOneAndUpdate({_id:userid},{$push : {prevOrders:{ productId : prod._id, address: address}},$set : {cart : cart}},{new:true},(err,user)=>{
          err?res.sendStatus(401):jwt.sign({user},secretKey,(err,token)=>{
            err?res.sendStatus(402):res.send(token);
          });
        }):
        res.send("Out of Stock");
    });
  });

  

});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
