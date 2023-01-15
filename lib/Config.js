'use strict';

const vm = require('node:vm');
const path = require('node:path');
const {
  TT,
  TNT,
} = require('./Lexer');
const { readObjectFromFile } = require('./File');

// var tokenComparatorScript; // = new vm.Script('a.subtype.includes(TNT.FLOAT) && b.subtype.includes(TNT.FLOAT) ? a.value == b.value : a.str == b.str');

var config = {
  map: [],
  equals: [],
};
module.exports.config = config;

function initConfig() {
  return new Promise(async (resolve, reject) => {
    var lastDir, dir = process.cwd();
    const base = ".tokendiff";
    while (dir !== lastDir) {
      const filePath = path.format({ dir, base });
      try {
        config = await readObjectFromFile(filePath);
        module.exports.config = config;
        break;
      } catch(err) {
      }
      lastDir = dir;
      dir = path.format({ dir, base: '..' });
      dir = path.normalize(dir);
    }
    for (const mapRec of config.map) {
      mapRec.script = new vm.Script(mapRec.func);
    }
    for (const equalsRec of config.equals) {
      equalsRec.script = new vm.Script(equalsRec.func);
    }
    resolve(config);
  });
}
module.exports.initConfig = initConfig;

function tokenCompare(b) {
  if (this.type != b.type)
    return false;
  const eqs = config.equals.filter(e => e.type == this.type);
  if (!eqs.length)
    return this.str == b.str;

  const equals = eqs[0];
  const context = {
    TT,
    TNT,
    a: this,
    b,
  };

  vm.createContext(context);
  const res = equals.script.runInContext(context);
  return res;
}

function setupTokenComparator(token) {
  token.equals = tokenCompare;
  const maps = config.map.filter(e => e.source == token.type);
  if (maps.length) {
    const map = maps[0];
    const context = {
      TT,
      TNT,
      e: token,
    };

    vm.createContext(context);
    const res = map.script.runInContext(context);
    if (res)
      token.type = map.target;
  }
}
module.exports.setupTokenComparator = setupTokenComparator;

function setupTokensComparator(tokens) {
  for (const token of tokens)
    setupTokenComparator(token);
}
module.exports.setupTokensComparator = setupTokensComparator;

function isTokenTypeCustomized(type) {
  const eqs = config.equals.filter(e => e.type == type);
  return eqs.length > 0;
}
module.exports.isTokenTypeCustomized = isTokenTypeCustomized;
