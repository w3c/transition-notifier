"use strict";
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');


let transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
});

let MAILING_LIST, SENDER_EMAIL;

if (process.env.NODE_ENV == 'production') {
  MAILING_LIST = "public-review-announce@w3.org";
  SENDER_EMAIL = "sysbot+notifier@w3.org";
} else {
  MAILING_LIST = "plh@w3.org";
  SENDER_EMAIL = "plh@w3.org";
}

const bodyTemplate = handlebars.compile("{{ title }}\n\n{{ href }}{{ feedbackDate }}\n\nAbstract\n\n{{ abstract }}\n\nStatus of the Document\n\n{{ sotd }}");

function notifyWideReview(spec) {
  console.log("[Email] Notification: " + spec.href);
  let status = spec.status;
  if (spec.obsoletes === undefined) {
    status = "FPWD";
  }
  let context = {
    title: spec.title,
    date: spec.date,
    href: spec.href,
    status: status,
    sotd: spec.sotd,
    abstract: spec.abstract,
    feedbackDate: (spec.feedbackDate === undefined) ?
      "" : "\n\nfeedback due by: " + spec.feedbackDate,
    timestamp: Date.now()
  };
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

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      sendError(error); // notify plh
      return console.error(error);
    }
    console.log('Message sent: %s', info.messageId);
  });

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
        return console.error(JSON.stringify(error));
    }
    console.log('Error message sent: %s', info.messageId);
  });

}

module.exports = notifyWideReview;
