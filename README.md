mongo-index-sync
================

Update a live MongoDB database's indexes based on files in source control

This project started because of the following paragraph in the MongoDB documentation (http://docs.mongodb.org/manual/reference/method/db.collection.ensureIndex/):

> If you create an index with one set of options, and then issue the ensureIndex() method with the same index fields and different options without first dropping the index, ensureIndex() will not rebuild the existing index with the new options.

In addition to the above, some basic testing has demonstrated that, if present, the index `name` field acts as a unique identifier in place of
the combination of fields.  Therefore, if you have an index named `searchByDomain` with a single field `domainName`, re-running `ensureIndex`
with a second field `customerId` and name `searchByDomain` will do nothing.

This is probably ok for many development environments, but if you want to promote index changes from dev to test to production,
it is important to know that they will each enter the desired state regardless of what was there before.