var mustache = require('mustache');
var fs = require('fs');
var glob = require('glob');
var path = require('path');


// function createPathsContainer(extensions) {
//     return extensions.reduce(function(container, extension) {
//         container[extension] = [];
//         return container;
//     }, {});
// }
//
// function build(options) {
//     glob(options.watch, function (er, files) {
//         var paths = files
//             .map(path.parse)
//             .reduce(function(paths, parsed){
//                 var ext = parsed.ext.slice(1);
//                 if (paths[ext]) {
//                     var path = options.prefix + parsed.base;
//                     paths[ext].push(path);
//                 }
//                 return paths;
//             }, createPathsContainer(watchedExtensions));
//
//         var source = path.join(options.src);
//         var dist = path.join(options.dist);
//         var template = fs.readFileSync(source, 'utf8');
//
//         var rendered = mustache.render(template, paths);
//
//         fs.writeFileSync(dist, rendered, 'utf-8');
//     });
// }
//
// build(options);

function readTemplate(options) {
  return new Promise(function(resolve, reject){
    try {


      var sourceChunks = [];
      var sourceStream;

      if (options.source) {
        sourceStream = fs.createReadStream(options.source, {
          autoclose: true,
          encoding: options.encoding
        });
      } else {
        process.stdin.setEncoding(options.encoding);
        sourceStream = process.stdin;
      }

      sourceStream.on('readable', function() {
        var chunk = sourceStream.read();
        if (chunk) {
          sourceChunks.push(chunk);
        }
      });

      sourceStream.on('end', function() {
        var template = sourceChunks.join();
        resolve(template);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function pushInExtensionArray(container, fileDescription) {
  var extension = extensionFromDescription(fileDescription);
  container[extension] = container[extension] || [];
  container[extension].push(fileDescription);
  return container;
}

function extensionFromDescription(fileDescription) {
  return fileDescription.ext.slice(1);
}

function listFiles(options) {

  function extensionIsInjected(fileDescription) {
    var extension = extensionFromDescription(fileDescription);
    return options.extensions.indexOf(extension) > -1;
  }

  return new Promise(function(resolve, reject) {
    var assetsGlob = path.join(
      options.dir,
      '*.@(' + options.extensions.join('|') + ')'
    );

    glob(assetsGlob, function (err, paths) {
      if (err) {
        reject(err);
      } else {
        resolve(paths);
      }
    });
  }).then(function(paths) {
    return paths.map(path.parse)
      .filter(extensionIsInjected)
      .reduce(pushInExtensionArray, {})
  });
}

function createOutputStream(options) {
  if (options.output) {
    return Promise.resolve(fs.createWriteStream(options.output, {
      encoding: options.encoding,
      flags: 'w',
    }));
  } else {
    // process.stdout.setEncoding(options.encoding);
    return Promise.resolve(process.stdout);
  }
}

var fileDescRegExps = ['root', 'base', 'name', 'ext', 'dir'].map(function(key){
  return {
    reg: new RegExp('%' + key + '%', 'g'),
    key: key
  };
});

function formatToPath(options) {
  return function formatToPath(fileDesc) {
    return fileDescRegExps.reduce(function(path, fileDescRegExp) {
      var key = fileDescRegExp.key;
      var reg = fileDescRegExp.reg;
      var value = fileDesc[key];
      return path.replace(reg, value);
    }, options.pattern);
  }
}

function formatPaths(options) {
  return function formatPaths(fileDescByExtensions) {
    return Object.keys(fileDescByExtensions).reduce(function(pathsByExtension, extension){
      pathsByExtension[extension] = fileDescByExtensions[extension].map(formatToPath(options));
      return pathsByExtension;
    }, {});
  };
}

function render(options) {
  return Promise.all([
    readTemplate(options),
    listFiles(options)
      .then(formatPaths(options)),
  ]).then(function(results) {
    var template = results[0];
    var pathsByExtension = results[1];
    return mustache.render(template, pathsByExtension);
  });
}

function writeToStream(writeStream, content) {
  return new Promise(function(resolve, reject){
    var method = writeStream === process.stdout ? 'write' : 'end';
    writeStream[method](content, resolve);
  });
}

module.exports = function inseertassets(options) {
  return Promise.all([
    render(options),
    createOutputStream(options)
  ])
  .then(function(results) {
    var rendered = results[0];
    var writeStream = results[1];
    return writeToStream(writeStream, rendered);
  }).catch(function(err) {
    console.error(err);
  });

}
