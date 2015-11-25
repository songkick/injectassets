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
    pattern: '%base%',
    extensions: ['js', 'css'],
    encoding: 'utf-8',
};

commander
  .version(pkg.version)
  .option('-s, --source <path to template>', 'template file path')
  .option('-o, --output <path>', 'result output path')
  .option('-e, --extensions <comma separated>', 'comma separated list of extensions to inject')
  .option('-d, --dir <assets folder>', 'injected assets directory')
  .option('-p, --pattern <string>', 'use this pattern to generate paths')
  .option('-w, --watch', 'run on every source file change')
  .option('-E, --encoding <string>', 'read/write encoding')

commander.parse(process.argv);

var options = Object.keys(DEFAULTS).reduce(function(options, key){
  options[key] = commander[key] || DEFAULTS[key];
  return options;
}, {});

if (!Array.isArray(options.extensions)) {
  options.extensions = options.extensions.split(',');
}

var run = insertassets.bind(null, options);

if (options.watch) {
  var assetsGlob = path.join(
    options.dir,
    '*.@(' + options.extensions.join('|') + ')'
  );

  chokidar.watch(assetsGlob, {
    ignoreInitial: true
  }).on('all', run);
}

run();
