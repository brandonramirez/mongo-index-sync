var vows = require('vows');
var assert = require('assert');

var collectIndexDetailsFromFile = require('../lib/collectIndexDetailsFromFile.js');

var suite = vows.describe('reading index javascript file');

suite.addBatch({
  'test1.txt': {
    topic: function () {
      collectIndexDetailsFromFile(__dirname + '/test1.txt', this.callback);
    },
    'contains a collection': function (collections) {
      assert.isArray(collections.organizations);
    },
    'collection contains a single index': function (collections) {
      assert.lengthOf(collections.organizations, 1);
    },
    'index name': function (collections) {
      assert.equal(collections.organizations[0].options.name, 'domains');
    },
    'contains field': function (collections) {
      assert.equal(collections.organizations[0].fields.domains, 1);
    }
  },

  'test2.txt': {
    topic: function () {
      collectIndexDetailsFromFile(__dirname + '/test2.txt', this.callback);
    },
    'contains a collection': function (collections) {
      assert.isArray(collections.organizations);
    },
    'collection contains two indexes': function (collections) {
      assert.lengthOf(collections.organizations, 2);
    },
    'index names': function (collections) {
      assert.equal(collections.organizations[0].options.name, 'domains');
      assert.equal(collections.organizations[1].options.name, 'fieldA_B');
    },
    'contains correct fields': function (collections) {
      assert.equal(collections.organizations[0].fields.domains, 1);
      assert.equal(collections.organizations[1].fields.fieldA, -1);
      assert.equal(collections.organizations[1].fields.fieldB, 1);
    },

    'test3.txt': {
      topic: function () {
        collectIndexDetailsFromFile(__dirname + '/test3.txt', this.callback);
      },
      'contains appropriate collection': function (collections) {
        assert.isArray(collections.collection1);
        assert.isArray(collections.collection2);
      },
      'collections contains two indexes': function (collections) {
        assert.lengthOf(collections.collection1, 2);
        assert.lengthOf(collections.collection2, 1);
      },
      'index names': function (collections) {
        assert.equal(collections.collection1[0].options.name, 'field_A_B_C');
        assert.equal(collections.collection1[1].options.name, 'unique_B_Z');
      },
      'is unique': function (collections) {
        assert.isUndefined(collections.collection1[0].options.unique);
        assert.isTrue(collections.collection1[1].options.unique);
      },
      'contains correct fields': function (collections) {
        assert.equal(collections.collection1[0].fields.fieldA, 1);
        assert.equal(collections.collection1[0].fields.fieldB, -1);
        assert.equal(collections.collection1[0].fields.fieldC, 1);
        assert.equal(collections.collection1[1].fields.fieldB, 1);
        assert.equal(collections.collection1[1].fields.fieldZ, 1);
        assert.equal(collections.collection2[0].fields.lastChangeDate, -1);
      }
    }
  }
});

suite.export(module);
 