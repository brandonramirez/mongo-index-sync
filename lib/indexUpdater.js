module.exports = {
  createIndex: function (db, index, collection, callback) {
    db.collection(collection).ensureIndex(index.fields, index.options, callback);
  },
  updateIndex: function (db, index, collection, callback) {
    this.dropIndex(db, index, collection, function () {
      this.createIndex(db, index, collection, callback);
    }.bind(this));
  },
  dropIndex: function (db, index, collection, callback) {
    db.collection(collection).dropIndex(index.options.name, callback);
  }
};