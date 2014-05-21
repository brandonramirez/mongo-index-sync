var async = require('async');
var _ = require('underscore');

var IGNORE_INDEX_PROPS = [
'key',
'v',
'ns'
];

module.exports = function (db, callback) {
  db.collections(function (err, collections) {
    if (err) {
      callback(err);
      return;
    }

    var indexesByCollection = {};

    async.eachSeries(collections, function (collection, cb) {
      if (collection.collectionName === 'system.indexes') {
        cb();
        return;
      }

      // not sure if collection.collectionName is guaranteed, but it works for now.
      indexesByCollection[collection.collectionName] = [];

      collection.indexes(function (err, indexes) {
        indexes.forEach(function (index) {
          // Ignore the built-in `_id_` primary key index.
          if (index.name !== '_id_') {
            indexesByCollection[collection.collectionName].push({
              fields: index.key,
              options: _.omit(index, IGNORE_INDEX_PROPS)
            });
          }
        });
        cb(err, indexes);
      });
    }, function (err) {
      callback(err, indexesByCollection);
    });
  });
};
