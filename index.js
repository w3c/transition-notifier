/* eslint-env node */

"use strict";

const t0 = Date.now();

const express = require("express");
const compression = require("compression");
const path = require("path");
const task = require("./loop.js");
const config = require("./lib/config.js");
const monitor = require('./lib/monitor.js');

const app = express();

app.set('x-powered-by', false);
app.set('strict routing', true);
app.enable('trust proxy');

monitor.setName("Transition notifier");
monitor.install(app, config);

app.use(compression());

app.use("/doc", express.static(path.resolve(__dirname, "docs")));

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

task();
