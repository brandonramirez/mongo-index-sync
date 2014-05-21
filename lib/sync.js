var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var Server = mongodb.Server;

var _ = require('underscore');
var extend = require('extend');
var async = require('async');

var collectIndexDetailsFromDatabase = require('./collectIndexDetailsFromDatabase');
var collectIndexDetailsFromFile = require('./collectIndexDetailsFromFile');
var indexUpdater = require('./indexUpdater');

var DEFAULT_INDEX_OPTIONS = {
  sparse: false,
  unique: false
}

module.exports = function (options) {
  // set default options
  options.host = options.host || '127.0.0.1';
  options.port = options.port || 27017;
  options.drop = options.drop || false;
  options.dry  = options.dry  || false;

  return function (callback) {
    new MongoClient(new Server(options.host, options.port)).open(function (err, mongoClient) {
      if (err) {
        callback(err);
        if (mongoClient != null) {
          mongoClient.close();
        }
        return;
      }

      var db = mongoClient.db(options.database);
      if (options.username && options.password) {
        db.authenticate(options.username, options.password, function (err) {
          if (err) {
            callback(err);
            db.close();
            mongoClient.close();
            return;
          }

          afterConnect(db, options.file, options.drop, options.dry, function (err) {
            mongoClient.close();
            callback(err);
          });
        });
      }
      else {
        afterConnect(db, options.file, options.drop, options.dry, function (err) {
          mongoClient.close();
          callback(err);
        });
      }
    });
  };
};

function afterConnect(db, file, drop, dry, callback) {
  collectIndexDetailsFromDatabase(db, function (err, indexesFromDatabase) {
    if (err) {
      callback(err);
      return;
    }

    collectIndexDetailsFromFile(file, function (err, indexesFromFile) {
      if (err) {
        callback(err);
        return;
      }

      var collections = _.union(Object.keys(indexesFromDatabase), Object.keys(indexesFromFile));
      var newIndexes = {};
      var obsoleteIndexes = {};
      var updatedIndexes = {};

      collections.forEach(function (collection) {
        console.log('Collection: ' + collection);
        console.log('--------------------------------------------------------------------');
        newIndexes[collection] = indexDiff(indexesFromFile[collection], indexesFromDatabase[collection]);
        obsoleteIndexes[collection] = indexDiff(indexesFromDatabase[collection], indexesFromFile[collection]);
        updatedIndexes[collection] = findUpdatedIndexes(indexesFromFile[collection], indexesFromDatabase[collection]);

        console.log('New indexes: ');
        newIndexes[collection].forEach(displayIndex);

        console.log('Updated indexes: ' );
        updatedIndexes[collection].forEach(displayIndex);

        console.log('Obsolete indexes: ');
        obsoleteIndexes[collection].forEach(displayIndex);

        console.log('');
      });

      if (!dry) {
        async.eachSeries(collections, function (collection, callback) {
          console.log('Creating new indexes on ' + collection + '...');

          async.eachSeries(newIndexes[collection], function (index, callback) {
            indexUpdater.createIndex(db, index, collection, callback);
          }, function (err) {
            if (err) {
              callback(err);
              return;
            }

            console.log('Updating existing indexes on ' + collection + '...');
            async.eachSeries(updatedIndexes[collection], function (index, callback) {
              indexUpdater.updateIndex(db, index, collection, callback);
            }, function (err) {
              if (err) {
                callback(err);
                return;
              }

              if (drop) {
                console.log('Dropping obsolete indexes on ' + collection + '...');
                async.eachSeries(obsoleteIndexes[collection], function (index, callback) {
                  indexUpdater.dropIndex(db, index, collection, callback);
                }, callback);
              }
              else {
                callback();
              }
            });
          });
        }, callback);
      }
      else {
        callback();
      }
    });
  });
}

/**
 * Generic function for comparing 2 sets of indexes.  The result will be A-B, that is, everything in A that is *not* in B.
 */
function indexDiff(a, b) {
  return _.reject(a, function (indexFromA) {
    return containsEquivalentIndex(b, indexFromA);
  });
}

function findUpdatedIndexes(a, b) {
  return commonIndexes(a, b).filter(function (baseline) {
    var comparison = findEquivalentIndex(b, baseline);
    return !_.isEqual(extend({}, baseline.options, DEFAULT_INDEX_OPTIONS), extend({}, comparison.options, DEFAULT_INDEX_OPTIONS)) ||
           !_.isEqual(baseline.fields, comparison.fields);
  });
}

/**
 * Given two collections of unequal (in terms of object equality (===)), find which indexes are common to both sets and
 * are considered equivalent
 */
function commonIndexes(a, b) {
  return _.filter(a, function (indexFromA) {
    return containsEquivalentIndex(b, indexFromA);
  });
}

function containsEquivalentIndex(indexes, desiredIndex) {
  return findEquivalentIndex(indexes, desiredIndex) != null;
}

function findEquivalentIndex(indexes, desiredIndex) {
  return _.find(indexes, function (possibleMatch) {
    return isSameIndex(desiredIndex, possibleMatch);
  });
}

/**
 * Predicate to compare two index objects and determine if they are equivalent in
 * terms of identity.  Identity is defined as having the same name or no name, but the same set of index fields.
 *
 * This function intentionally does not compare the index options (like unique or sparse).  We use this function
 * to find new indexes, obsolete indexes and common (intersection) indexes.  We then compare the common indexes
 * for non-identity changes and then become the "updated indexes" which we need to drop and re-create.
 */
function isSameIndex(a, b) {
  if (a.options.name && a.options.name === b.options.name) {
    return true;
  }
  if (_.isEqual(a.fields, b.fields)) {
    return true;
  }
  return false;
}

function displayIndex(index) {
  if (index.options.name) {
    console.log('  ' + index.options.name);
  }
  else {
    console.log('  ' + JSON.stringify(index.fields));
  }
}