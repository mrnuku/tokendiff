'use strict';

const path = require('node:path');
const {
  patienceDiff,
  patienceDiffPlus,
} = require('./PatienceDiff');
const {
  Splitter,
  Myers,
  formats,
  changed,
} = require('./MyersDiff');
const {
  getFileStat,
} = require('./File');
const {
  isEmptyStream,
  hasOnlyOneNewlineStream,
} = require('./Stream');

const settings = {
  mergeDistance: 10,
  peekDistanceEnd: 3,
  peekDistanceStart: 3,
};
module.exports.settings = settings;

const constants = {
  NNEMarker: '\\ No newline at end of file\n',
  emptyRemNL: '@@ -1 +0,0 @@\n-\n',
  emptyAddNL: '@@ -0,0 +1 @@\n+\n',
};
module.exports.constants = constants;

function emitTokenDiff(diffMD, tokensA, tokensB, outputStream) {
  for (var i = 0; i < tokensA.length; i++) {
    const tokenA = tokensA[i];
    const patchLineFilter = diffMD.filter(e => e.lhs.at == i);
    const patchLine = patchLineFilter.length ? patchLineFilter[0] : null;
    if (patchLine) {
      for (var j = patchLine.rhs.at; j < patchLine.rhs.at + patchLine.rhs.length; j++) {
        const tokenB = tokensB[j];
        outputStream.write(`${tokenB.whitespace.str}${tokenB.str}`);
      }
      i += patchLine.lhs.length > 1 ? patchLine.lhs.length - 1 : 0;
    }
    if (!patchLine || patchLine.lhs.length === 0) {
      outputStream.write(`${tokenA.whitespace.str}${tokenA.str}`);
    }
  }
}
module.exports.emitTokenDiff = emitTokenDiff;

function emitPatchLines(prefix, lines, start, length, outputStream) {
  for (var i = start; i < start + length; i++) {
    outputStream.write(`${prefix}${lines[i]}\n`);
  }
}
module.exports.emitPatchLines = emitPatchLines;

function mergeHunks(diffMD) {
  const hunks = [];
  for (var i = 0; i < diffMD.length; i++) {
    const baseRec = diffMD[i];
    const hunk = [baseRec];
    for (var j = i + 1; j < diffMD.length; j++) {
      const nextRec = diffMD[j];
      const prevRec = hunk[hunk.length - 1];
      if (nextRec.lhs.at - (prevRec.lhs.at + prevRec.lhs.length) <= settings.mergeDistance) {
        hunk.push(nextRec);
        i++;
      }
    }
    hunks.push(hunk);
  }
  return hunks;
}
module.exports.mergeHunks = mergeHunks;

function handleSpecialEOFCases(linesA, linesC, hunk) {
  const lastLinesBeginAt = hunk[hunk.length - 1].lhs.at + hunk[hunk.length - 1].lhs.length;
  var lastLinesPeekNum = Math.min(linesA.length - lastLinesBeginAt, settings.peekDistanceEnd);
  var needsNNEMarker = false, needsInsertNNEMarker = false, newNumLinesCorrection = 0;
  if (lastLinesBeginAt + lastLinesPeekNum == linesA.length) {
    if (!linesA[lastLinesBeginAt + lastLinesPeekNum - 1].length) {
      lastLinesPeekNum--; // omit last line from patch if empty
      if (lastLinesPeekNum < 0) // case when the new line count is less but the old is ok with peekNum -1
        newNumLinesCorrection = -lastLinesPeekNum;
    } else {
      needsNNEMarker = true;
      if (!lastLinesPeekNum && linesC[linesC.length - 1].length > 0)
        needsInsertNNEMarker = true; // emit a newline before the insert
    }
  }
  return {
    lastLinesBeginAt,
    lastLinesPeekNum,
    needsNNEMarker,
    needsInsertNNEMarker,
    newNumLinesCorrection,
  };
}
module.exports.handleSpecialEOFCases = handleSpecialEOFCases;

function handleSpecialEmptyNewlineCases(linesA, linesC, outputStream) {
  if (isEmptyStream(linesA) && hasOnlyOneNewlineStream(linesC)) {
    outputStream.write(constants.emptyAddNL);
    return true;
  }
  if (isEmptyStream(linesC) && hasOnlyOneNewlineStream(linesA)) {
    outputStream.write(constants.emptyRemNL);
    return true;
  }
  return false;
}
module.exports.handleSpecialEmptyNewlineCases = handleSpecialEmptyNewlineCases;

function emitLineDiff(diffMD, linesA, linesC, outputStream) {
  if (handleSpecialEmptyNewlineCases(linesA, linesC, outputStream))
    return;
  const hunks = mergeHunks(diffMD);
  for (const hunk of hunks) {
    const firstLinesBeginAt = Math.max(hunk[0].lhs.at - settings.peekDistanceStart, 0);
    const firstLinesPeekNum = Math.min(hunk[0].lhs.at, settings.peekDistanceStart);
    const {
      lastLinesBeginAt,
      lastLinesPeekNum,
      needsNNEMarker,
      needsInsertNNEMarker,
      newNumLinesCorrection,
    } = handleSpecialEOFCases(linesA, linesC, hunk);
    const numLines = (lastLinesBeginAt + lastLinesPeekNum) - firstLinesBeginAt;
    const newFirstLineAt = Math.max(hunk[0].rhs.at - settings.peekDistanceStart, 0);
    const deletedLines = hunk.map(e => e.lhs.length).reduce((a, b) => a + b, 0);
    const newNumLines = hunk.map(e => e.rhs.length).reduce((a, b) => a + b, numLines + newNumLinesCorrection) - deletedLines;
    outputStream.write(`@@ -${firstLinesBeginAt + 1},${numLines} +${newFirstLineAt + 1},${newNumLines} @@\n`);
    emitPatchLines(' ', linesA, firstLinesBeginAt, firstLinesPeekNum, outputStream);
    for (var i = 0; i < hunk.length; i++) {
      const part = hunk[i];
      emitPatchLines('-', linesA, part.lhs.at, part.lhs.length, outputStream);
      if (needsInsertNNEMarker && i + 1 == hunk.length)
        outputStream.write(constants.NNEMarker);
      emitPatchLines('+', linesC, part.rhs.at, part.rhs.length, outputStream);
      if (i + 1 < hunk.length) {
        const nextPart = hunk[i + 1];
        emitPatchLines(' ', linesA, part.lhs.at + part.lhs.length, nextPart.lhs.at - (part.lhs.at + part.lhs.length), outputStream);
      }
    }
    emitPatchLines(' ', linesA, lastLinesBeginAt, lastLinesPeekNum, outputStream);
    if (needsNNEMarker)
      outputStream.write(constants.NNEMarker);
  }
}
module.exports.emitLineDiff = emitLineDiff;

function emitGitUnifiedPatch(linesA, linesC, params, outputStream) {
  return new Promise(async (resolve, reject) => {
    const diffMD = Myers.diff(linesA, linesC, {compare: 'chars'});
    outputStream.write(`diff --git a/${params.filename} b/${params.filename}\n`);
    outputStream.write(`index ${params.indexA.substring(0, 7)}..${params.indexA.slice(-7)} ${params.modA}\n`);
    outputStream.write(`--- a/${params.filename}\n`);
    outputStream.write(`+++ b/${params.filename}\n`);
    emitLineDiff(diffMD, linesA, linesC, outputStream);
    return resolve();
  });
}
module.exports.emitGitUnifiedPatch = emitGitUnifiedPatch;

function emitDiffUnifiedPatch(linesA, linesC, params, outputStream) {
  return new Promise(async (resolve, reject) => {
    const diffMD = Myers.diff(linesA, linesC, {compare: 'chars'});
    const statA = await getFileStat(params.filenameA);
    const statB = await getFileStat(params.filenameB);
    const filenameA = path.sep == '\\' && params.filenameA.indexOf(path.sep) != -1 ? `"${params.filenameA}"` : params.filenameA;
    const filenameB = path.sep == '\\' && params.filenameB.indexOf(path.sep) != -1 ? `"${params.filenameB}"` : params.filenameB;
    outputStream.write(`--- ${filenameA}\t${statA.mtime.toISOString()}\n`);
    outputStream.write(`+++ ${filenameB}\t${statB.mtime.toISOString()}\n`);
    emitLineDiff(diffMD, linesA, linesC, outputStream);
    return resolve();
  });
}
module.exports.emitDiffUnifiedPatch = emitDiffUnifiedPatch;
