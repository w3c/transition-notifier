"use strict";
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const config     = require('./lib/config.js');
const monitor    = require("./lib/monitor.js");

let transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
});

let MAILING_LIST, SENDER_EMAIL;

if (config.env == 'production') {
  MAILING_LIST = "public-review-announce@w3.org";
  SENDER_EMAIL = "sysbot+notifier@w3.org";
} else {
  MAILING_LIST = "plh@w3.org";
  SENDER_EMAIL = "plh@w3.org";
}

const bodyTemplate = handlebars.compile("{{ title }}\n\n{{ href }}{{ recChanges }}{{ feedbackDate }}\n\nPublished by{{ deliverer }}\n\nAbstract\n\n{{ abstract }}\n\nStatus of the Document\n\n{{ sotd }}"
          + "\n\n-- \nThis report was automatically generated using https://github.com/w3c/transition-notifier");

          // format a Date, "Aug 21, 2019"
function formatDate(date) {
  // date is a date object
  const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  return date.toLocaleDateString('en-US', options);
}

function notifyWideReview(spec) {
  monitor.log("[Email] Notification: " + spec.uri);
  let status = spec.status;
  if (spec._links["predecessor-version"] === undefined) {
    status = "First Public Working Draft";
  }
  let context = {
    title: spec.title,
    date: formatDate(new Date(spec.date)),
    href: spec.uri,
    status: status,
    sotd: spec.sotd,
    abstract: spec.abstract,
    deliverer: "unknown",
    feedbackDate: (spec['implementation-feedback-due'] === undefined) ?
      "" : "\n\nfeedback due by: " + formatDate(new Date(spec['implementation-feedback-due'])),
    recChanges:  (spec.status !== "Recommendation") ?
      "" : "\n\nThis Recommendation contains proposed substantive chances (corrections and/or additions).",
    timestamp: Date.now()
  };
  if (spec.deliverers) {
    let text = "";
    spec.deliverers.forEach(d => {
      text += `\n ${d.name}`;
    })
    context.deliverer = text;
  }
  if (spec.sotd.indexOf("wide review") !== -1) {
    context.cfwd = " (Call for Wide Review)";
  } else {
    context.cfwd = "";
  }

  let mailOptions = {
    from: "Notifier <" + SENDER_EMAIL + ">",
    to: MAILING_LIST,
    subject: context.status+": "+context.title+context.cfwd,
    text: bodyTemplate(context)
  };
  if (!config.debug) {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        sendError(error); // notify plh
        return monitor.error(error);
      }
      monitor.log(`Message sent: ${info.messageId}`);
    });
  } else {
    monitor.log(`in DEBUG mode. Not sending messages`);
  }

}

function sendError(error) {
  // if things go wrong, please call the maintainer
  let mailOptions = {
    from: "Notifier <" + SENDER_EMAIL + ">",
    to: "plh@w3.org",
    subject: "We've got an error on transition-notifier",
    text: "You might want to look at " + JSON.stringify(error)
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return monitor.error(JSON.stringify(error));
    }
    monitor.log('Error message sent: %s', info.messageId);
  });

}

module.exports = {
  notifyWideReview: notifyWideReview,
  sendError: sendError
};
