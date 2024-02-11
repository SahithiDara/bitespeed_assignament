require('./database');
const express = require("express")
const app = express()
const routes = require('./routes');
const cors = require('cors');
var bodyParser = require('body-parser')

app.use(cors());
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.send("Hello Bitespeed team!")
})

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Express listening on port :${port}`)
})

app.use('/', routes);