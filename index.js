"use strict";

const fs = require('fs');
const lexer = require("node-c-lexer");
const _ = require('lodash');

// const hashRegex = /^From (\S*)/;
// const authorRegex = /^From:\s?([^<].*[^>])?\s+(<(.*)>)?/;
const fileNameRegex = /^diff --git "?a\/(.*)"?\s*"?b\/(.*)"?/;
const fileLinesRegex = /^@@ -([0-9]*),?\S* \+([0-9]*),?/;
const similarityIndexRegex = /^similarity index /;
// const addedFileModeRegex = /^new file mode /;
// const deletedFileModeRegex = /^deleted file mode /;

function displayTimer(startTime, text) {
  const stopTime = process.hrtime(startTime);
  process.stderr.write(`${text}: ${(stopTime[0] * 1e9 + stopTime[1]) / 1e6}ms\n`);
}

function lexerArrayRemoveProps(lexerArray) {
  for (var lexerObj of lexerArray) {
    delete lexerObj.children;
    delete lexerObj.col;
    delete lexerObj.parent;
    delete lexerObj.row;
  }

  return lexerArray;
}

function processGitPatch(patch) {
  if (typeof patch !== 'string') return null;

  var startTime = process.hrtime();
  const lines = patch.split('\n');
  lines.pop();
  const numLines = lines.length;
  displayTimer(startTime, "newlinesplit");
  /*const hashLine = lines.shift();
  if (!hashLine)  return null;

  const match1 = hashLine.match(hashRegex);
  if (!match1) return null;

  const hash = match1[1];
  const authorLine = lines.shift();
  if (!authorLine) return null;

  const match2 = authorLine.match(authorRegex);
  if (!match2)  return null;

  const authorName = match2[1], authorEmail = match2[3];
  const dateLine = lines.shift();
  if (!dateLine) return null;

  const _a = dateLine.split('Date: '), date = _a[1];
  const messageLine = lines.shift();
  if (!messageLine) return null;

  const _b = messageLine.split('Subject: '), message = _b[1];

  const parsedPatch = {
    hash: hash,
    authorName: authorName,
    authorEmail: authorEmail,
    date: date,
    message: message,
    files: []
  };*/

  startTime = process.hrtime();
  const splitByFiles = splitIntoParts(lines, 'diff --git');
  const numFiles = splitByFiles.length;
  displayTimer(startTime, "filesplit");

  startTime = process.hrtime();
  var numFilesProcessed = 0;
  var numHunksProcessed = 0;
  var numFilesOmitted = 0;
  var numHunksOmitted = 0;
  var numLinesProcessed = 0;
  var lastPrintLength = 0;
  var outputHasContent = false;
  var numTokensA = 0;
  var numTokensB = 0;

  for (const fileLines of splitByFiles) {
    const numLinesInFile = fileLines.length;
    const fileNameLine = fileLines.shift();
    if (!fileNameLine) return;

    const match3 = fileNameLine.match(fileNameRegex);
    if (!match3) return;

    const metaLine = fileLines.shift();
    if (!metaLine) return;

    const fileNameA = fileLines.shift();
    const fileNameB = fileLines.shift();

    const fileData = {
      added: false,
      deleted: false,
      beforeName: match3[1].trim(),
      afterName: match3[2].trim(),
      lines: []
    };

    // parsedPatch.files.push(fileData);

    // if (addedFileModeRegex.test(metaLine)) fileData.added = true;
    // if (deletedFileModeRegex.test(metaLine)) fileData.deleted = true;
    if (similarityIndexRegex.test(metaLine)) return;

    const splitByHunk = splitIntoParts(fileLines, '@@ ');
    var numKeptHunksInFile = splitByHunk.length;
    var keptHunksStorage = [];

    for (const hunkLines of splitByHunk) {
      const hunkHeaderLine = hunkLines.shift();
      if (!hunkHeaderLine) return;

      const match4 = hunkHeaderLine.match(fileLinesRegex);
      if (!match4) return;

      var nA = parseInt(match4[1]);
      var nB = parseInt(match4[2]);
      var mergedA = "";
      var mergedB = "";

      for (const line of hunkLines) {
        nA++; nB++;
        if (line.startsWith('-- ')) return;

        if (line.startsWith('+')) {
          nA--;
          const lineContent = line.substr(1);
          // fileData.lines.push({ added: true, lineNumber: nB, line: lineContent });
          mergedB += `${lineContent}\n`;
        } else if (line.startsWith('-')) {
          nB--;
          const lineContent = line.substr(1);
          // fileData.lines.push({ added: false, lineNumber: nA, line: lineContent });
          mergedA += `${lineContent}\n`;
        }/* else {
          fileData.lines.push({ lineNumber: nA, line });
        }*/
      }

      const mergedATokens = lexerArrayRemoveProps(lexer.lexUnit.tokenize(mergedA));
      const mergedBTokens = lexerArrayRemoveProps(lexer.lexUnit.tokenize(mergedB));
      numTokensA += mergedATokens.length;
      numTokensB += mergedBTokens.length;
      const tokensEqual = _.isEqual(mergedATokens, mergedBTokens);
      if (tokensEqual) {
        numHunksOmitted++;
        numKeptHunksInFile--;
      } else {
        keptHunksStorage.push(hunkHeaderLine);
        keptHunksStorage = _.concat(keptHunksStorage, ...hunkLines);
      }

      numHunksProcessed++;
    }

    if (!numKeptHunksInFile) {
      numFilesOmitted++;
    } else { // ouput kept files
      console.log(fileNameLine);
      console.log(metaLine);
      console.log(fileNameA);
      console.log(fileNameB);
      console.log(keptHunksStorage.join('\n'));
      outputHasContent = true;
    }

    numFilesProcessed++;
    numLinesProcessed += numLinesInFile;

    const stopTime = process.hrtime(startTime);
    const spaces = new Array(lastPrintLength).fill(' ');
    process.stderr.write(`\r${spaces.join('')}`);
    var printStr = `\r`;
    printStr += `lines: ${numLinesProcessed}/${numLines} `;
    printStr += `files: ${numFilesOmitted}/${numFilesProcessed}/${numFiles} `;
    printStr += `hunks: ${numHunksOmitted}/${numHunksProcessed} `;
    printStr += `tokens: ${numTokensA}|${numTokensB} `;
    printStr += `time: ${Math.floor((stopTime[0] * 1e9 + stopTime[1]) / 1e9)}s ${Math.floor(numLinesProcessed / numLines * 1e2)}%`;
    process.stderr.write(printStr);
    lastPrintLength = printStr.length;
  }

  if (outputHasContent) {
    console.log('');
  }

  // return parsedPatch;
}

function splitIntoParts(lines, separator) {
  const parts = [];
  var currentPart;

  for (const line of lines) {
    if (line.startsWith(separator)) {
      if (currentPart) parts.push(currentPart);
      currentPart = [line];
    } else if (currentPart) {
      currentPart.push(line);
    }
  }

  if (currentPart) parts.push(currentPart);

  return parts;
}

if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}

fs.readFile(process.argv[2], 'utf8', function(err, data) {
  if (!err) {
    processGitPatch(data);
  }
});
