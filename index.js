var mustache = require('mustache');
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var extend = require('node.extend');

// The only state in this app. As STDIN is a read-once
// stream, we must cache it in order to be able to
// re-run the command many times (use case: watch flag)
var stdinCache = null;

function readStream(stream) {
  return new Promise(function(resolve, reject){
    var content = '';
    stream.on('readable', function() {
      var chunk = stream.read();
      if (chunk) {
        content += chunk;
      }
    });

    stream.on('end', function() {
      resolve(content);
    });

    stream.on('error', reject);
  });
}

function readTemplate(options) {
  var stream;

  if (stdinCache) {
    return Promise.resolve(stdinCache);
  }

  if (options.source) {
    stream = fs.createReadStream(options.source, {
      autoclose: true,
      encoding: options.encoding
    });
  } else {
    process.stdin.setEncoding(options.encoding);
    stream = process.stdin;
  }

  return readStream(stream).then(function(template){
    if (!options.source) { // only save it in stdin mode
      stdinCache = template;
    }
    return template;
  });
}

function pushInExtensionArray(container, fileDescription) {
  var extension = fileDescription.ext.slice(1);
  container[extension] = container[extension] || [];
  container[extension].push(fileDescription);
  return container;
}

function listSingleGlob(globString) {
  return new Promise(function(resolve, reject) {
    glob(globString, function (err, paths) {
      if (err) {
        reject(err);
      } else {
        resolve(paths);
      }
    });
  });
}


function prefixPathWith(dir) {
  return function(glob) {
    return path.join(dir, glob);
  };
}

function listFiles(globs, fromDir) {
  return Promise.all(globs
      .map(prefixPathWith(fromDir))
      .map(listSingleGlob))
    .then(function(results){
      return results.reduce(function(allPaths, paths){
        return allPaths.concat(paths);
      });
    });
}

function sortByExtensions(paths) {
  return paths
    .map(path.parse)
    .reduce(pushInExtensionArray, {});
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

var fileDescRegExps = Object.keys(path.parse('')).map(function(key){
  return {
    reg: new RegExp('{' + key + '}', 'g'),
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
  };
}

function formatPaths(options) {
  return function formatPaths(fileDescByExtensions) {
    return Object.keys(fileDescByExtensions).reduce(function(pathsByExtension, extension){
      pathsByExtension[extension] = fileDescByExtensions[extension].map(formatToPath(options));
      return pathsByExtension;
    }, {});
  };
}

function getFileContent(options, path) {
  var stream = fs.createReadStream(path, {
    autoclose: true,
    encoding: options.encoding
  });

  return readStream(stream).then(function(content){
    return {
      content: content,
      path: path,
    };
  });
}

function getInlinedFilesContents(options) {
  if (!options.inlineGlobs) {
    return {};
  }

  return listFiles(options.inlineGlobs, options.dir)
    .then(function(paths){
      return Promise.all(paths.map(getFileContent.bind(null, options)));
    })
    .then(function(pathsAndContents){
      return pathsAndContents.reduce(function(contentsByExtension, pathAndContent){
        var filePath = pathAndContent.path;
        var content = pathAndContent.content;
        var extension = path.extname(filePath).slice(1);
        var key = 'inline_' + extension;

        contentsByExtension[key] = contentsByExtension[key] || [];
        contentsByExtension[key].push(content);

        return contentsByExtension;
      }, {});
    });
}

function fromDirectory(directory) {
    return function(paths){
      return paths.map(path.relative.bind(path, directory));
    };
}

function getReferencesPaths(options) {
  if (!options.referenceGlobs) {
    return {};
  }
  return listFiles(options.referenceGlobs, options.dir)
    .then(fromDirectory(options.dir))
    .then(sortByExtensions)
    .then(formatPaths(options));
}

function render(options) {
  return Promise.all([
    // Read the template
    readTemplate(options),
    getReferencesPaths(options),
    getInlinedFilesContents(options),
  ]).then(function(results) {
    var template = results[0];
    var pathsByExtension = results[1];
    var contentsByExtension = results[2];
    var locales = extend({}, pathsByExtension, contentsByExtension);
    return mustache.render(template, locales);
  });
}

function writeToStream(writeStream, content) {
  return new Promise(function(resolve, reject){
    var method = writeStream === process.stdout ? 'write' : 'end';
    writeStream[method](content, resolve);
  });
}

module.exports = function inseertassets(options) {
  var promise;
  if(options.source && options.source === options.output){
    promise = render(options)
      .then(function(source){
        return createOutputStream(options).then(function(output){
          return [source, output];
        });
      });
  }else{
    promise = Promise.all([
      render(options),
      createOutputStream(options)
    ]);
  }
  return promise
    .then(function(results) {
      var rendered = results[0];
      var writeStream = results[1];
      return writeToStream(writeStream, rendered);
    })
    .catch(function(err) {
      console.error(err.stack);
      process.exit(1);
    });

};
