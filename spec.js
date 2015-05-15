var whacko = require("whacko");
var io = require("./io-promise");

function norm(str) {
  if (!str) return "";
  str = "" + str;
  return str.replace(/^\s+/, "")
    .replace(/\s+$/, "")
    .replace(/\s+/g, " ");
}

function toText(doc, child) {
  function extractParagraphText(node) {
    switch(node.name) {
    case "div":
      var output = "";
      doc(node).children().each(function () {
        output += extractParagraphText(this);
      });
      return output;
    case "p":
        return "\n\n" + norm(doc(node).text().normalize());
    case "style":
    case "script":
        return "";
    default:
        return norm(doc(node).text().normalize());
    }
  }
  return extractParagraphText(child).substring(2);
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
  return div;
}

var exporter = {};

exporter.loadSpecification = function(s) {
  return io.fetch(s.href).then(function (res) {
    return res.text().then(function (data) {
      return whacko.load(data);
    });
  }).then(function (document) {
    var spec = {};
    spec.href = s.href;
    spec.title = document("title").text();
    spec.abstract = toText(document, getSection(document, /^Abstract$/)[0]);
    spec.sotd = toText(document, getSection(document, /^Status [Oo]f [Tt]his [Dd]ocument$/)[0]);
    return spec;
  });
};

// var p = exporter.loadSpecification({status: "PR", href: "http://www.w3.org/TR/2015/WD-2dcontext-20150514/"});
// p.then(function (spec) {
//    console.log(spec.title);
//    console.log(spec.sotd);
// }).catch(function (err) {
//   console.log(err);
//   console.log(err.stack);
// });

module.exports = exporter;
