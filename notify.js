"use strict";

const { notifyWideReview } = require("./notify-wide-review");
const monitor = require("./lib/monitor.js");

function notify(spec) {
  if (spec.status === "Note"
     || spec.status === "Draft Note"
     || spec.status === "Draft Registry"
     || spec.status === "Registry"
     || spec.status === "Working Draft"
     || spec.status === "Candidate Recommendation Draft"
     || spec.status === "Candidate Recommendation Snapshot"
     || spec.status === "Candidate Registry Draft"
     || spec.status === "Candidate Registry Snapshot"
     || spec.status === "Candidate Recommendation"
     || (spec.status === "Recommendation"
         && (spec.proposedAdditions || spec.proposedCorrections))) {
    if (spec.status === "Candidate Recommendation Snapshot"
        || spec.status === "Candidate Registry Snapshot"
        || (spec.status === "Recommendation" && spec.proposedCorrections)
        || spec._links["predecessor-version"] === undefined
        || spec.sotd.indexOf("wide review") !== -1) {
      notifyWideReview(spec);
    } else {
      // else ignore
      monitor.log(`${spec.uri} isn't up for wide review`);
    }
  } else if (spec.status === "Proposed Recommendation"
    || spec.status === "Recommendation") {
      monitor.log(`${spec.uri} is too late for wide review`);
  } else {
    // better safe than sorry
    notifyWideReview(spec);
  }
}

module.exports = notify;
