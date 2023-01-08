'use strict';

/*[
  'D:\\things\\nodejs\\node.exe',
  'C:\\Users\\mrnuku\\AppData\\Roaming\\npm\\node_modules\\nulexdiff\\bin\\nulexdiff-cli.js',
  'src/Layers/xrRenderDX10/3DFluid/dx103DFluidRenderer.h',
  'C:\\msys64\\tmp/git-blob-a14192/dx103DFluidRenderer.h',
  'f3849fa387075fe10d1edfc1481b9bc5be2aa25d',
  '100644',
  'src/Layers/xrRenderDX10/3DFluid/dx103DFluidRenderer.h',
  '0000000000000000000000000000000000000000',
  '100644'
]*/

// diff --git a/src/Layers/xrAPI/stdafx.h b/src/Layers/xrAPI/stdafx.h
// index c3afe5b..a2a6319 100644

/*fs.readFile(process.argv[2], 'utf8', function(err1, data1) {
  if (err1) {
    process.stderr.write(`error reading a file: ${process.argv[2]}: ${err1}\n`);
  }
  fs.readFile(process.argv[3], 'utf8', function(err2, data2) {
    if (err2) {
      process.stderr.write(`error reading b file: ${process.argv[3]}: ${err2}\n`);
    }
  });
});*/

function compareTokens(tokensA, tokensB, linesA, linesB, outputStream) {
  return new Promise(async (resolve, reject) => {
    const diffMD = Myers.diff(tokensA, tokensB, {compare: 'chars'});
    // const diffPD = await patienceDiff(tokensA, tokensB, accessed => accessed.toString(), (a, b) => a.equals(b));
    // const diffPDP = await patienceDiffPlus(tokensA, tokensB, accessed => accessed.toString(), (a, b) => a.equals(b));
    // const patchMD = formats.GnuNormalFormat(diffMD);
    // outputStream.write(`diff ${process.argv[2]}: ${tokensA.length}/${tokensB.length}\n`);

    const stream = new PassThrough();
    const rlC = readline.createInterface({
      input: stream,
      terminal: false
    });

    const linesC = [];

    rlC.on('line', function(line) {
      linesC.push(line);
    });

    rlC.on('close', async () => {
      // linesC.push('');
      resolve([tokensA, tokensB, linesA, linesB, linesC, outputStream]);
    });

    printMyersDiff(diffMD, tokensA, tokensB, linesA, linesB, stream);
    stream.end();

    // outputStream.write(`${patchMD}\n`);
    // writeObjectToFile(diffMD, "diffMD.json");
    // writeObjectToFile(diffPD, "diffPD.json");
    // writeObjectToFile(diffPDP, "diffPDP.json");
    // writeStringToFile(patchMD, "patchMD.patch");

    // for (const rec of diffMD) { delete rec.lhs.text.whitespace; delete rec.lhs.text.token; delete rec.rhs.text.whitespace; delete rec.rhs.text.token; }
    // for (const rec of diffPD.lines) { delete rec.line.whitespace; delete rec.line.token; }
    // for (const rec of diffPDP.lines) { delete rec.line.whitespace; delete rec.line.token; }
    // const diffMDFile = await readObjectFromFile("diffMD.json");
    // const diffMDEq = _.isEqual(JSON.parse(JSON.stringify(diffMD)), diffMDFile);
    // const diffPDFile = await readObjectFromFile("diffPD.json");
    // const diffPDEq = _.isEqual(JSON.parse(JSON.stringify(diffPD)), diffPDFile);
    // const diffPDPFile = await readObjectFromFile("diffPDP.json");
    // const diffPDPEq = _.isEqual(JSON.parse(JSON.stringify(diffPDP)), diffPDPFile);
    // outputStream.write(`diffMDEq:${diffMDEq} diffPDEq:${diffPDEq} diffPDPEq:${diffPDPEq}\n`);
    // return resolve();
  });
}
