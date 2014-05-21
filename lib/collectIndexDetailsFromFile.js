var fs = require('fs');

var _ = require('underscore');

module.exports = function (file, callback) {
  fs.readFile(file, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var collections = [];

    var lines = data.toString('utf8').split(/\r?\n/).filter(function (line) {
      // filter out empty lines and comment-only lines
      return line.length > 0 && '--' !== line.substring(0, 2);
    });

    lines.forEach(function (line) {
      var match = /db\.(.+)\.ensureIndex/.exec(line);
      if (match != null) {
        collections.push(match[1]);
      }
    });

    // If there are no collections defined in the file, then short-circuit out.
    if (collections.length === 0) {
      callback(undefined, {});
      return;
    }

    var indexesByCollection = {};
    var newGlobalDbObject = {};

    _.uniq(collections).forEach(function (collection) {
      newGlobalDbObject[collection] = {
        ensureIndex: function(fields, options) {
          if (!indexesByCollection.hasOwnProperty(collection)) {
            indexesByCollection[collection] = [];
          }
          indexesByCollection[collection].push({
            fields: fields,
            options: options
          });
        }
      };
    });

    // Ordinarily, a very bad thing to mess with `globals`.  In this case, it is helpful for
    // reading in the indexes configuration file.
    var existingGlobalDbObject = global.db;
    global.db = newGlobalDbObject;
    try {
      require(file);
    }
    catch (e) {
      callback(e);
      return;
    }
    finally {
      global.db = existingGlobalDbObject;
    }
    callback(undefined, indexesByCollection);
  });
};