const express = require("express");
const app = express();
const path = require("path");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cookieparser = require("cookie-parser");
app.use(cookieparser());
require("dotenv").config();

const session = require("express-session");
const oneday = 1000 * 60 * 60 * 24;
app.use(
  session({
    saveUninitialized: true,
    resave: false,
    secret: "asd3454#$%$@#324",
    cookie: { maxAge: oneday },
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname));
//app.use("/images", express.static(path.join(__dirname, "images")));
let fixprice;
let useremail;
let profile;
let Password;
let id;
let db;
let userscollection;
let collection;
let datacollection;
let ordercollection;
let homecollection;
let paymentcollection;
const PORT = process.env.PORT || 3000;
MongoClient.connect(process.env.MONGODB_URI)
  .then((client)=>{
    console.log("Connected to the database");
    db = client.db("list");
    datacollection = db.collection("store");
    userscollection = db.collection("Users");
    ordercollection = db.collection("order");
    homecollection = db.collection("homePage");
    paymentcollection = db.collection("payment");
  })
  .catch((error)=>{
    console.log("Error connecting to the database:",error);
  });
app.get("/login",(req,res)=>{
  res.sendFile(path.join(__dirname,"login.html"));
});
app.post("/log",async(req,res)=>{
  const { username, password, role } = req.body;
 // console.log(req.body.role);
  try {
    const user = await userscollection.findOne({ username, password, role });
    if (user) {
      profile = req.body.username;
      Password = req.body.password;
      useremail = user.email;
     
      if (user.role == "admin") {
        res.sendFile(path.join(__dirname, "testadmin.html"));

      } else if (user.role =='user') {
        res.sendFile(path.join(__dirname, "home.html"));
      }
    } else {
      res.sendFile(path.join(__dirname, "login.html"));
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "signUp.html"));
});

app.post("/sign", (req, res) => {
  userscollection
    .find({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      role: req.body.role,
    })
    .toArray()
    .then((data) => {
      if (data.length > 0) {
        res.status(409).send("UserName already Exists");
      } else {
        let obj = {};
        obj.username = req.body.username;
        obj.password = req.body.password;
        obj.email = req.body.email;
        obj.number = req.body.number;
        obj.role = req.body.role;
        profile = req.body.username;
        useremail = req.body.email;
        Password = req.body.password;

        //obj.img = "images/profile.jpeg";
        userscollection.insertOne(obj).then(() => {
          if (req.body.role === 'admin') {
            res.sendFile(path.join(__dirname, "testadmin.html"));
          }
          else {
            res.sendFile(path.join(__dirname, "home.html"));
          }
        });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.sendFile(path.join(__dirname, "index.html"));
  });
});

app.get("/product", (req, res) => {
  datacollection
    .find()
    .toArray()
    .then((result) => {
      res.json({ profile: profile, useremail: useremail, products: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Internal Server Error");
    });
});
app.get("/allproduct", (req, res) => {
  datacollection.find().toArray().then((result) => {
    res.json({profile:profile,useremail,useremail,products: result });
  });
});
app.get("/homeproduct", (req, res) => {
  homecollection
    .find()
    .toArray()
    .then((result) => {
      res.json({ profile: profile, useremail: useremail, products: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Internal Server Error");
    });
});

app.use(express.json());

app.post("/order", async (req, res) => {
  try {
    let obj = {
      Name: req.body.Name,
      price: req.body.price,
      img: req.body.img,
      trackingId: req.body.trackingId,
      orderdata: req.body.orderdata,
      email: req.body.email,
      quantity:1
    };

    await ordercollection.insertOne(obj);
    
    res.status(200).send("Order placed successfully!");
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete", async (req, res) => {
  try {
    let obj = {
      Name: req.body.Name,
      price: req.body.price,
      img: req.body.img,
    };

    await ordercollection.deleteOne(obj);

    res.status(200).send("Order placed successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/admindelete", async (req, res) => {
  try {
    let obj = {
      Name: req.body.Name,
      price: req.body.price,
      img: req.body.img,
    };

    await datacollection.deleteOne(obj);

    res.status(200).send("Order placed successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/adminupdate", (req, res) => {
  try {
    let obj = {};
    obj.Name = req.body.Name;
    obj.price = req.body.price;
    obj.img = req.body.img;
    datacollection.updateOne(obj);
    res.send(200).send("Update Item successfully!");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/history", (req, res) => {
  let user = useremail;
  paymentcollection.find({ email: user }).toArray().then((result) => {
    res.json(result);
  });
});
 app.get("/orderProduct", (req, res) => {
   const email = useremail;
   ordercollection
     .find({ email: email })
     .toArray()
     .then((result) => {
       fixprice = result.reduce((sum, product) => {
         return sum + parseFloat(product.price);
       }, 0);

       res.json({
         profile: profile,
         useremail: email,
         products: result,
       });
     })
     .catch((error) => {
       console.log(error);
       res.status(500).send("Internal Server Error");
     });
 });
app.get("/price", (req, res) => {
  res.json({ fixprice: fixprice });
});
app.post("/payment", (req, res) => {
  let obj = {};
  obj.username = profile;
  obj.useremail = useremail;
  obj.name = req.body.name;
  obj.email = req.body.email;
  obj.contact = req.body.contact;
  obj.address = req.body.address;
  obj.totalPrice = req.body.totalPrice;
  paymentcollection.insertOne(obj);
  
  res.json(obj);
});
app.get("/profile", async (req, res) => {
  try {
    let obj = {
      username: profile,
      password: Password,
    };
    const user = await userscollection.findOne(obj);
    //console.log(user.username);
    res.json({ Username: user.username, Email: user.email, Password: user.password });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});
app.post("/changeprofile", async (req, res) => {
  try {
    await userscollection.updateOne({ email: req.body.email },{ $set: { password: req.body.password } });
    res.status(200).send("Password changed successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/addData",async (req, res) => {
  const { Name } = req.body.Name;

  try {
    const user = await datacollection.findOne({ Name });
    if (user) {
      res.status(200).send("Already added..")
    } else {
      let obj={
        Name: req.body.Name,
        des: req.body.des,
        img: req.body.img,
        price: req.body.price,
        rating: req.body.rating,
        time: req.body.time,
        type: req.body.type,
        reviews: req.body.reviews,
      }
      datacollection.insertOne(obj).then(() => {
        res.sendFile(path.join(__dirname, "testadmin.html"));
      })
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => console.log(`Server started ${PORT}`));
