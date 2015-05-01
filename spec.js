var whacko = require("whacko");
var io = require("./io-promise");

function norm(str) {
  if (!str) return "";
  str = "" + str;
  return str.replace(/^\s+/, "")
    .replace(/\s+$/, "")
    .replace(/\s+/g, " ");
}

function extractParagraph(doc, parent) {
  if (parent.name === "div") {
    var output = "";
    doc(parent).children().each(function () {
      output += extractParagraph(doc, this);
    });
    return output;
  } else {
    return "\n\n" + norm(doc(parent).text().normalize());
  }
}

function getSection(doc, titleRegExp) {
  var startH2, endH2
    , div = doc("<div></div>");
  doc("h2").each(function () {
    var h2 = doc(this);
    if (startH2) {
      endH2 = h2;
      return false;
    }
    if (titleRegExp.test(norm(h2.text())))
      startH2 = h2;
  });
  if (!startH2 || !endH2) {
    return div;
  }
  var started = false;
  startH2.parent().children().each(function () {
    if (startH2[0] === this) {
      started = true;
      return;
    }
    if (!started) return;
    if (endH2[0] === this) return false;
    div.append(doc(this).clone());
  });
  var output = extractParagraph(doc, div[0]);
  return output.substring(2);
}

var exporter = {};

exporter.Spec = function (s) {
  this.href = s.href;
  this.status = s.status;
  this.title = s.title;
  this.document = io.fetch(this.href)
      .then(function (res) {
      return res.text().then(function (data) {
        return whacko.load(data);
      });
    });
  this.getSotd = function () {
    return this.document.then(function (doc) {
      return getSection(doc, /^Status [Oo]f [Tt]his [Dd]ocument$/);
    });
  };

  this.getAbstract = function () {
    return this.document.then(function (doc) {
      return getSection(doc, /^Abstract$/);
    });
  };
};

//var foo = new exporter.Spec({status: "PR", href: "http://www.w3.org/TR/2015/WD-credential-management-1-20150430/"});
//foo.getAbstract().then(function (text) {
//   console.log(text);
//});

module.exports = exporter;
