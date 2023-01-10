'use strict';

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

function emitLineDiff(diffMD, linesA, linesC, outputStream) {
  const mergeDistance = 10;
  const peekDistanceStart = 3;
  const peekDistanceEnd = 3;
  const hunks = [];
  for (var i = 0; i < diffMD.length; i++) {
    const baseRec = diffMD[i];
    const hunk = [baseRec];
    for (var j = i + 1; j < diffMD.length; j++) {
      const nextRec = diffMD[j];
      const prevRec = hunk[hunk.length - 1];
      if (nextRec.lhs.at - (prevRec.lhs.at + prevRec.lhs.length) <= mergeDistance) {
        hunk.push(nextRec);
        i++;
      }
    }
    hunks.push(hunk);
  }
  for (const hunk of hunks) {
    const firstLinesBeginAt = Math.max(hunk[0].lhs.at - peekDistanceStart, 0);
    const firstLinesPeekNum = Math.min(hunk[0].lhs.at, peekDistanceStart);
    const lastLinesBeginAt = hunk[hunk.length - 1].lhs.at + hunk[hunk.length - 1].lhs.length;
    var lastLinesPeekNum = Math.min(linesA.length - lastLinesBeginAt, peekDistanceEnd);
    if (lastLinesPeekNum > 0 && !linesA[lastLinesBeginAt + lastLinesPeekNum - 1].length)
      lastLinesPeekNum--; // omit last line from patch if empty
    const numLines = (lastLinesBeginAt + lastLinesPeekNum) - firstLinesBeginAt;
    const newFirstLineAt = Math.max(hunk[0].rhs.at - peekDistanceStart, 0);
    const deletedLines = hunk.map(e => e.lhs.length).reduce((a, b) => a + b, 0);
    const newNumLines = hunk.map(e => e.rhs.length).reduce((a, b) => a + b, numLines) - deletedLines;
    outputStream.write(`@@ -${firstLinesBeginAt + 1},${numLines} +${newFirstLineAt + 1},${newNumLines} @@\n`);
    emitPatchLines(' ', linesA, firstLinesBeginAt, firstLinesPeekNum, outputStream);
    for (var i = 0; i < hunk.length; i++) {
      const part = hunk[i];
      emitPatchLines('-', linesA, part.lhs.at, part.lhs.length, outputStream);
      emitPatchLines('+', linesC, part.rhs.at, part.rhs.length, outputStream);
      if (i + 1 < hunk.length) {
        const nextPart = hunk[i + 1];
        emitPatchLines(' ', linesA, part.lhs.at + part.lhs.length, nextPart.lhs.at - (part.lhs.at + part.lhs.length), outputStream);
      }
    }
    emitPatchLines(' ', linesA, lastLinesBeginAt, lastLinesPeekNum, outputStream);
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
    outputStream.write(`--- a/${params.filenameA}\n`);
    outputStream.write(`+++ b/${params.filenameB}\n`);
    emitLineDiff(diffMD, linesA, linesC, outputStream);
    return resolve();
  });
}
module.exports.emitDiffUnifiedPatch = emitDiffUnifiedPatch;
