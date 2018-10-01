const fs = require("fs");

require("./resources/testharness.js");

const testFolder = __dirname;

function runTestFiles(files) {
  function runTest(index) {
    let testFile = files[index];
    process.nextTick(function () {
      console.log("Running tests in " + testFile + "\n");
      require(testFolder + "/" + testFile);
      if (index < (files.length -1)) {
        runTest(index+1);
      }
    })
  }
  runTest(0);
}

fs.readdir(testFolder, (err, files) => {
  let localFiles = [];
  files.forEach(file => {
    if (file !== "index.js") {
      let stat = fs.statSync(testFolder + "/" + file);
      if (stat.isFile()) {
        localFiles.push(file);
      }
    }
  });
  runTestFiles(localFiles);
})
