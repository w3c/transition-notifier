"use strict";

const notifyWideReview = require("./notify-wide-review");

function notify(spec) {
  console.log("New document: " + spec.href);

  if (spec.status === "WD" || spec.status === "CRD") {
    if (spec.obsoletes === undefined
      || spec.sotd.indexOf("wide review") !== -1) {
      notifyWideReview(spec);
    } // else ignore
  } else if (spec.status === "PR"
    || spec.status === "REC") {
    //ignore
  } else {
    notifyWideReview(spec);
  }
}

module.exports = notify;
