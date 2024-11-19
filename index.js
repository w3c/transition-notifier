/* eslint-env node */

"use strict";

const t0 = Date.now();

import fs from 'fs/promises';
import express from "express";
import compression from "compression";
import path from "path";
import * as loop from "./loop.js";
import config from "./lib/config.js";
import * as monitor from './lib/monitor.js';

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
  fs.readFile(path.resolve(config.basedir, "./docs/index.html")).then(data => {
    res.set('Content-Type', 'text/html')
    res.send(data);

  }).catch(() => res.status(500).send("contact Starman. He is orbiting somewhere in space in his car."))
  .then(() => next());

});

app.get("/doc/nudge", function (req, res, next) {
  fs.readFile(path.resolve(config.basedir, "./docs/nudge.html")).then(data => {
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

// check that our default options are properly setup, or abort
const missing = config.checkOptions("host", "port", "env");
if (missing) {
  console.error("Improper configuration. Not Starting");
  for (const opt of missing) {
    console.error(`${opt} config option missing`);
  }
  process.abort();
}

/* eslint-disable no-console */
app.listen(config.port, () => {
  console.log(`Express server ${config.host} listening on port ${config.port} in ${config.env} mode`);
  console.log("App started in", (Date.now() - t0) + "ms.");
  if (!config.debug && config.env != "production") {
    console.warn("WARNING: 'export NODE_ENV=production' is missing");
    console.warn("See http://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production");
  }
});

loop.start();
