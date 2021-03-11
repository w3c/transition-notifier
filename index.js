/* eslint-env node */

"use strict";

const t0 = Date.now();

const fs = require('fs/promises');
const express = require("express");
const compression = require("compression");
const path = require("path");
const loop = require("./loop.js");
const config = require("./lib/config.js");
const monitor = require('./lib/monitor.js');

const app = express();

app.set('x-powered-by', false);
app.set('strict routing', true);
app.enable('trust proxy');

monitor.setName("Transition notifier");
monitor.install(app, config);

app.use(compression());

app.post("/nudge", function (req, res, next) {
  try {
    loop.nudge();
    res.status(200).send("<p>Nudged</p>");
  } catch (error) {
    monitor.error(error);
    res.status(500).send("mayday");
  }
  next();
  return;
});

app.get("/doc", function (req, res, next) {
  fs.readFile(path.resolve(__dirname, "./docs/index.html")).then(data => {
    res.set('Content-Type', 'text/html')
    res.send(data);

  }).catch(() => res.status(500).send("contact Starman. He is orbiting somewhere in space in his car."))
  .then(() => next());

});

app.get("/doc/nudge", function (req, res, next) {
  fs.readFile(path.resolve(__dirname, "./docs/nudge.html")).then(data => {
    res.set('Content-Type', 'text/html');
    res.send(data);

  }).catch(() => res.status(500).send("contact Starman. He is orbiting somewhere in space in his car."))
  .then(() => next());

});

if (!config.debug) {
  process.on('unhandledRejection', error => {
    console.log("-----------------------------");
    console.log('unhandledRejection', error.message);
    console.log(error);
    console.log("-----------------------------");
  });
}

if (!config.checkOptions("host", "port", "env")) {
  console.error("Improper configuration. Not Starting");
  return;
}

app.listen(config.port, () => {
  console.log(`Server started in ${Date.now() - t0}ms at http://${config.host}:${config.port}/`);
  if (!config.debug && config.env != "production") {
    console.warn("WARNING: 'export NODE_ENV=production' is missing");
    console.warn("See http://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production");
  }
});

loop.start();
