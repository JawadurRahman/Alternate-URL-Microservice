require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlparser = require('url');

const mySecret = process.env['MONGO_URI'];
const mongoose = require("mongoose");
const { Schema } = mongoose;
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true }
});


let Url = mongoose.model('url', urlSchema);

const urlCountSchema = new Schema({
  counter: { type: Number, required: true }
});
let UrlCount = mongoose.model('count', urlCountSchema);

let countUrls = UrlCount.find({ _id: "6353d79d2a59eeb0e63d0a5d" }, (err, res) => {
  //console.log("Count Urls", res[0]);
  //console.log("Count Urls", err);
});


console.log(mongoose.connection.readyState);
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.set("views", "views");
app.set("view engine", "pug");

app.post("/update", (req, res) => {
   let locals = { dbId: req.body._id, 
   urlName: req.body.name };
   res.render("hello", locals);
});

app.put("/:id", (req, res) => {
     console.log(req.body.id);
     console.log(req.body.name);
  dns.lookup(urlparser.parse(req.body.name).hostname, async (err, addresses, family) => {
    if (!addresses) {
      console.log(err);
      res.sendStatus(400);
    }
    else {
     Url.updateOne({ _id: req.params.id }, {name: req.body.name}, function(err, result) {
      if (err) {
        console.log(err);
         res.status(400).send(err);
      } 
      else if (result.n === 0) {
          res.sendStatus(404);
      } 
      else {
        res.sendStatus(204);
        //res.redirect("https://www.shorturl.agency/");
      }
    });
    }
  });
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', function(req, res) {

  dns.lookup(urlparser.parse(req.body.url).hostname, async (err, addresses, family) => {
    console.log('addresses:', addresses);
    console.log('err:', err);
    console.log('family:', family);
    if (!addresses) {
      res.json({ error: "Invalid URL" });
    } else {
      const returnObj = await Url.find({});
      const updateResult = await UrlCount.updateOne({}, { $inc: { counter: 1 } });
      const returnObj2 = await UrlCount.find({});
      //console.log("Count Urls", returnObj2[0].counter);
      const counter = returnObj2[0].counter;
      //console.log(returnObj.length.toString(36));
      //console.log(counter.toString(36));

      const url = new Url({ _id: counter.toString(36), name: req.body.url });
      url.save((e, data) => {

        //res.json({ original_url: data.name , short_url:"https://www.shorturl.agency/" + data.id });
        res.redirect("https://url-shortener.jawadurrahman.repl.co/");
      });
    }
  });
});

/*
 delcares text for the JSON object and returns it to JS
*/
app.get("/grp8Route.json", async function(request, response) {
  const clientIP = request.ip;

  // Log the IP address
  console.log(`Requester's IP address: ${clientIP}`);
  const filter = {};
  const returnObj = await Url.find(filter);
  return response.status(200).send(returnObj);
});


//api/shorturl/
app.get("/:id", (req, res) => {
  const id = req.params.id;
  //console.log(id.toLowerCase());
  Url.findById(id.toLowerCase(), (err, data) => {
    if (!data) return res.json({ error: "Invalid URL" });
    else
      res.redirect(data.name)
  });
});

app.delete("/:id", (req, res) => {
  Url.deleteOne({ _id: req.params.id }, function(err, result) {
    if (err) {
      res.status(400).send(err);
    }
    else if (result.n === 0) {
      res.sendStatus(404);
    }
    else {
      res.sendStatus(204);
    }
  });
});

app.listen(port, async function() {
  console.log(`Listening on port ${port}`);
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
 gives permissions to client side on what can be done with the code
*/
let allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
};
app.use(allowCrossDomain);

//app.listen(port);

