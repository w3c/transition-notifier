import fs from 'fs/promises';
import loadSpecification from "./spec.js";
import notify from "./notify.js";
import W3C_TR from "./w3c_tr.js";
import * as monitor from "./lib/monitor.js";
import config from "./lib/config.js";
import { sendError } from "./lib/email.js";

let SpecManager = function (bibrefs) {
  function filterSpecref(entries) {
    let specs = [];
    let key, entry;
    // we filter out lots of useless references
    for (key in entries) {
      entry = entries[key];
      if (entry.href !== undefined &&
        entry.status !== "Group Note" && entry.status !== "Retired" &&
        entry.status !== "Proposed Recommendation" &&
        entry.status !== undefined) {
        specs.push(entry);
      }
    }
    return specs;
  }

  this.entries = filterSpecref(bibrefs);
};

SpecManager.prototype.hasSpec = function (href) {
  return this.entries.find(s => s.href === href);
};

const SPEC_LIST_FILE = (config.debug)? "./specref.json" : "/home/node/specref.json";
let w3c_specs = null;

function fetchBibrefs() {
  return W3C_TR().then(function (entries) {
    let end;
    if (config.debug) {
      end = entries;
    } else {
      end = fs.writeFile(SPEC_LIST_FILE, JSON.stringify(entries, null, " ")).then(() => entries);
    }
    return end;
  });
}

function notifier(spec) {
  loadSpecification(spec).then(function (s) {
    notify(s);
  }).catch(function (err) {
    monitor.error("Failure to notify");
    monitor.error(err);
  });

  return;
}

function init() {
  // we're booting the notifier by reusing the previous entries or fetching new
  // ones if needed
  return fs.readFile(SPEC_LIST_FILE).then(JSON.parse)
    .catch(function (err) {
    return fetchBibrefs();
  }).then(function (bibrefs) {
    w3c_specs = new SpecManager(bibrefs); // if undefined, this will throw
    return w3c_specs;
  });
}

function loop() {
  let start;
  if (config.debug) {
    start = fs.readFile("specref-v2.json").then(JSON.parse);
  } else {
    start = fetchBibrefs()
  }
  start
  .then(bibrefs => new SpecManager(bibrefs))
  .then(function (specs) {
    // those are new entries
    monitor.log(`Fetched ${specs.entries.length} entries`);
    // let's find out how many are new entries
    let new_specs = [];
    specs.entries.forEach(function (spec) {
      if (!w3c_specs.hasSpec(spec.href)) {
        new_specs.push(spec);
      }
    });
    w3c_specs = specs;
    return new_specs;
  }).then(function (specs) {
    // ok, we notify now
    if (specs.length > 15) {
      // this is suspicious...
      monitor.error(`TOO MANY (${specs.length}) NOTIFICATIONS. IGNORING.`);
      sendError(`TOO MANY (${specs.length}) NOTIFICATIONS.`)
    } else {
      specs.forEach(function (spec) {
        notifier(spec);
      });
    }
    return specs;
  }).then(function (specs) {
    // not really needed
    return fs.writeFile("entries.json", JSON.stringify(specs, null, " "));
  }).catch(function (err) {
    if (err.status !== "same") {
      monitor.error(err);
      monitor.error(err.stack);
      sendError(err)
    }
  });

  setTimeout(loop, config.loop_interval * 60000); // min->ms
}

export
const nudge = loop;

export
function start() {
  init().then(function () {
    loop();
  }).catch(function (err) {
    monitor.error("Error during initialization");
    monitor.error(err);
  }).then(function () {
    if (w3c_specs && w3c_specs.entries) {
      monitor.log(`Initialized ${w3c_specs.entries.length} entries`);
    } else {
      monitor.error("No specifications found");
    }
  });
}

