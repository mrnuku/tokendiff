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
  equal: [],
};
module.exports.config = config;

function initConfig(filename) {
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
    if (filename) {
      config.map = config.map.filter(e => e.include ? RegExp(e.include).test(filename) : true);
      config.map = config.map.filter(e => e.exclude ? !RegExp(e.exclude).test(filename) : true);
      config.equal = config.equal.filter(e => e.include ? RegExp(e.include).test(filename) : true);
      config.equal = config.equal.filter(e => e.exclude ? !RegExp(e.exclude).test(filename) : true);
    }
    for (const mapRec of config.map) {
      mapRec.scriptCondition = new vm.Script(mapRec.condition);
      mapRec.scriptApply = new vm.Script(mapRec.apply);
    }
    for (const equalRec of config.equal) {
      equalRec.scriptComparator = new vm.Script(equalRec.comparator);
    }
    resolve(config);
  });
}
module.exports.initConfig = initConfig;

function tokenCompare(b) {
  if (this.type != b.type)
    return false;
  const eqs = config.equal.filter(e => e.type == this.type);
  if (!eqs.length)
    return this.str == b.str;

  const equal = eqs[0];
  const context = {
    TT,
    TNT,
    a: this,
    b,
  };

  vm.createContext(context);
  const res = equal.scriptComparator.runInContext(context);
  return res;
}

function setupTokenComparator(token, side) {
  token.equal = tokenCompare;
  const maps = config.map.filter(e => e.type == token.type && (!e.side || e.side == 'all' || e.side == side));
  for (const map of maps) {
    const context = {
      TT,
      TNT,
      e: token,
    };

    vm.createContext(context);
    const resCondition = map.scriptCondition.runInContext(context);
    if (resCondition) {
      map.scriptApply.runInContext(context);
      break;
    }
  }
}
module.exports.setupTokenComparator = setupTokenComparator;

function setupTokensComparator(tokens, side) {
  for (const token of tokens)
    setupTokenComparator(token, side);
}
module.exports.setupTokensComparator = setupTokensComparator;

function isTokenTypeCustomized(type) {
  const eqs = config.equal.filter(e => e.type == type);
  return eqs.length > 0;
}
module.exports.isTokenTypeCustomized = isTokenTypeCustomized;
