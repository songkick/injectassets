var child_process = require('child_process');
var path = require('path');
var fs = require('fs');
var tap = require('tap');
var rimraf = require('rimraf');

function cleanDist() {
  rimraf.sync(path.join(__dirname, 'test/dist/*.html'));
}

function copyFile(srcPath, destPath){
  return fs.writeFileSync(path.join(__dirname, destPath), getContent(srcPath));
}

function getContent(filePath) {
  return fs.readFileSync(path.join(__dirname, filePath)).toString();
}

var expectations = [
  'noGlob',
  'referenceAll',
  'inlineAll',
  'bothInlineAndReference',
  'specifyDir',
  'withPattern',
].reduce(function(expectations, file){
    expectations[file] = getContent('test/expectations/' + file + '.html');
    return expectations;
  }, {});

tap.test('CLI', function(test){
  test.plan(8);

  test.test('No options', function(test){
    test.plan(2);
    child_process.execFile('./bin.js', [
      '-s', 'test/src/index.html'
    ], function(error, stdout, stderr){
      test.equal('', stderr);
      test.equal(expectations.noGlob, stdout);
    });
  });

  test.test('-o, --output', function(test){
    test.plan(3);
    cleanDist();
    child_process.execFile('./bin.js', [
      '-s', 'test/src/index.html',
      '-o', 'test/dist/index.html',
    ], function(error, stdout, stderr){
      test.equal('', stderr);
      test.equal('', stdout);

      var output = getContent('test/dist/index.html');
      cleanDist();
      test.equal(output, expectations.noGlob);
    });
  });

  test.test('-g, --reference-globs', function(test){
    test.plan(2);
    child_process.execFile('./bin.js', [
      '-s', 'test/src/index.html',
      '-g', 'test/dist/**/*.{css,js}',
    ], function(error, stdout, stderr){
      test.equal('', stderr);
      test.equal(expectations.referenceAll, stdout);
    });
  });

  test.test('-G, --inline-globs', function(test){
    test.plan(2);
    child_process.execFile('./bin.js', [
      '-s', 'test/src/index.html',
      '-G', 'test/dist/**/*.{css,js}',
    ], function(error, stdout, stderr){
      test.equal('', stderr);
      test.equal(expectations.inlineAll, stdout);
    });
  });

  test.test('Using both -g and -G', function(test){
    test.plan(2);
    child_process.execFile('./bin.js', [
      '-s', 'test/src/index.html',
      '-g', 'test/dist/**/referenced*.{css,js}',
      '-G', 'test/dist/**/inlined*.{css,js}',
    ], function(error, stdout, stderr){
      test.equal('', stderr);
      test.equal(expectations.bothInlineAndReference, stdout);
    });
  });

  test.test('-d, --dir', function(test){
    test.plan(2);
    child_process.execFile('./bin.js', [
      '-s', 'test/src/index.html',
      '-g', '**/referenced*.{css,js}',
      '-d', 'test/dist'
    ], function(error, stdout, stderr){
      test.equal('', stderr);
      test.equal(expectations.specifyDir, stdout);
    });
  });

  test.test('-p, --pattern', function(test){
    test.plan(2);
    child_process.execFile('./bin.js', [
      '-s', 'test/src/index.html',
      '-g', '**/referenced*.{css,js}',
      '-p', 'file{ext}.{name}'
    ], function(error, stdout, stderr){
      test.equal('', stderr);
      test.equal(expectations.withPattern, stdout);
    });
  });

  test.test('-s same as -o', function(test){
    test.plan(3);
    cleanDist();
    copyFile('test/src/index.html','test/dist/index.html');
    child_process.execFile('./bin.js', [
      '-s', 'test/dist/index.html',
      '-o', 'test/dist/index.html'
    ], function(error, stdout, stderr){
      test.equal('', stderr);
      test.equal('', stdout);

      var output = getContent('test/dist/index.html');
      cleanDist();
      test.equal(output, expectations.noGlob);
    });
  });
});
