const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fetch = require("node-fetch");
const monitor = require("./lib/monitor.js");
const utils = require("./lib/utils.js");

function norm(str) {
  if (!str) return "";
  str = "" + str;
  return str.normalize().trim().replace(/^\s+/, "")
    .replace(/\s+$/, "")
    .replace(/\s+/g, " ")
    .replace(/&#x27;/g, "'").replace(/&amp;/, "&");
}

function toText(child) {
  function extractParagraphText(node) {
    switch(node.nodeName) {
    case "DIV":
    case "SECTION":
    case "UL":
      let output = "\n";
      node.childNodes.forEach(e =>  output += extractParagraphText(e));
      return output;
    case "P":
    case "H2":
    case "H3":
    case "H4":
        return "\n\n" + norm(node.textContent);
    case "LI":
        return "\n  * " + norm(node.textContent);
    case "STYLE":
    case "SCRIPT":
        return "";
    case "SPAN":
    case "A":
    case "EM":
    case "STRONG":
    case "#text":
        return " " + norm(node.textContent);
    case "#comment":
      return "";
    default:
        console.error("Unknown node name " + node.nodeName);
        return " " + norm(node.textContent);
    }
  }
  return extractParagraphText(child).trim();
}

function getSiblings(element) {
  let siblings = [];
  do {
    if (element.nodeName === "H2" || element.nodeName === "NAV") {
      return siblings;
    }
    siblings.push(element);
    element = element.nextElementSibling;
  } while (element !== null);
  return siblings;
}

function getSection(document, titleRegExp) {
  let startH2,
      div = document.createElement("div");

  document.querySelectorAll("h2").forEach(h2 => {
    if (titleRegExp.test(h2.textContent)) {
      startH2 = h2;
    }
  })
  if (!startH2) {
    monitor.error(`Can't find ${titleRegExp}`);
    return div;
  }

  let siblings = getSiblings(startH2.nextElementSibling);
  siblings.forEach(e => div.appendChild(e));
  return div;
}

function getAbstract(doc) {
  let abstract = doc.querySelector("div[data-fill-with=abstract]");
  let children = [];
  if (!abstract) {
    abstract = doc.querySelector("section#abstract");
  }
  if (abstract) {
    let title = abstract.querySelector("h2");
    if (title) {
      title.parentNode.removeChild(title);
    }
    return abstract;
  } else {
    return getSection(doc, /^Abstract$/);
  }
}

function getSOTD(doc) {
  let sotd = doc.querySelector("div[data-fill-with=status]");
  let children = [];
  if (!sotd) {
    sotd = doc.querySelector("section#sotd");
  }
  if (sotd) {
    let title = sotd.querySelector("h2");
    if (title) {
      title.parentNode.removeChild(title);
    }
    return sotd;
  } else {
    return getSection(doc, /^Status [Oo]f [Tt]his [Dd]ocument$/);
  }
}

async function loadSpecification(s) {
  const spec = await utils.fetchW3C(s.href);
  if (spec._links.deliverers) {
    spec.deliverers = await utils.fetchW3C(spec._links.deliverers.href);
  }
  if (spec._links["predecessor-version"]) {
    spec.predecessor = await utils.fetchW3C(spec._links["predecessor-version"].href);
  }

  return fetch(spec.uri).then(res => res.text().then(data => new JSDOM(data).window.document)
    .then(document => {
    let title = norm(document.querySelector("title").textContent);
    let proposedCorrections = document.querySelector(".proposed.correction");
    let proposedAdditions = document.querySelector(".proposed.addition");
    if (title !== spec.title) {
      monitor.warn(`Title mismatch: "${spec.title}" !== "${title}"`)
    }
    spec.abstract = toText(getAbstract(document));
    spec.sotd = toText(getSOTD(document));

    spec.proposedAdditions = !!proposedAdditions;
    spec.proposedCorrections = !!proposedCorrections;
    return spec;
  }));
}

module.exports = loadSpecification;
