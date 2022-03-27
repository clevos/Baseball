const express = require('express')
const routes = require('./routes')
const path = require("path")
const app = express()

var dir = path.join(__dirname, 'public');
app.use(express.static(dir));

app.use(`/`, routes)

app.set('view engine', 'pug');

app.listen(3000, function () {
    console.log('listening on port', 3000);
});
