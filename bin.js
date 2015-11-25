#!/usr/bin/env node

var commander = require('commander');
var chokidar = require('chokidar');
var insertassets = require('./index');
var path = require('path');

var pkg = require(path.join(__dirname, 'package.json'));

var DEFAULTS = {
    source: null,
    output: null,
    dir: './',
    watch: false,
    pattern: '{dir}/{base}',
    encoding: 'utf-8',
    referenceGlobs: null,
    inlineGlobs: null,
};

function splitGlobs(globString) {
  return globString.split(';');
}

commander
  .version(pkg.version)
  .option('-s, --source <path to template>', 'template file path, default: stdin')
  .option('-o, --output <path>', 'result output path, default: stdout')
  .option('-g, --reference-globs <globs...>', 'globs for files to be inject as references', splitGlobs)
  .option('-G, --inline-globs <globs...>', 'globs for files to be inlined', splitGlobs)
  .option('-d, --dir <assets folder>', 'injected assets directory, default: "./"')
  .option('-p, --pattern <string>', 'use this pattern to generate paths, default {dir}/{base}')
  .option('-w, --watch', 'run on every source file change')
  .option('-e, --encoding <string>', 'read/write encoding, encoding "utf-8"')

commander.parse(process.argv);

var options = Object.keys(DEFAULTS).reduce(function(options, key){
  options[key] = commander[key] || DEFAULTS[key];
  return options;
}, {});

var run = insertassets.bind(null, options);

if (options.watch) {

  function prefixGlobWithDir(glob){
    return path.join(options.dir, glob);
  };

  var watchedGlobs = []
    .concat(options.referenceGlobs)
    .concat(options.inlineGlobs)
    .map(prefixGlobWithDir);

  chokidar.watch(watchedGlobs, {
    ignoreInitial: true
  }).on('all', run);
}

run();
