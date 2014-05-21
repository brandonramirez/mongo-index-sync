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

Installing as a library / dependency
------------------------------------

    $ npm install mongo-index-sync

Installing as a command-line program
------------------------------------

    $ [sudo] npm install -g mongo-index-sync

Sudo may be needed if you are running `npm install` as a non-root user.

Using as a library
------------------

The module itself returns a function which accepts a set of properties and returns a function that actually performs the sync.  The
final function accepts a callback function which will be invoked upon completion or as soon as an error occurs.

    var mongoIndexSync = require('mongo-index-sync')({
      file: '/path/to/indexes.js',
      host: 'localhost',
      database: 'dev_db',
      dry: true
    });

    mongoIndexSync(function (err) {
      if (err) {
        console.log('Oh no!');
      }
      else {
        console.log('Sync process completed - indexes are up to date.');
      }
    });

Options:

* file: Path to file containing index specifications
* database: Name of database on MongoDB installation to compare against the file
* host: Hostname or IP address where MongoDB can be reached (default localhost)
* port: TCP port # on which MongoDB is listening (default 27017)
* username: User with which to authenticate to MongoDB
* password: Password for the above user
* dry: True to only log differences, but not take any actions to fix them (default false)
* drop: Whether to drop indexes from the live DB which are not in the file (default false)

If username and password are not specified, no authentication attempt will be made to the database.
This matches the default configuration of MongoDB and may be useful for development, but not production.

`drop` is off by default as a convenience.  If you are experimenting with different indexes to troubleshoot
a performance problem or if you have released an index without checking it in (gasp!), we won't unintentionally
drop it.  If you trust yourself to manage your databases very strictly, then you can enable the `drop` option
to keep your databases fully in sync.

Using as a program
------------------

    $ mongo-index-sync --database dev_db --file /path/to/indexes.js --dry

Command-line usage:

    Usage: mongo-index-sync [options]

    Options:
       -f, --file       Path to file which contains db.collection.ensureIndex calls
       -h, --host       Hostname or IP address of MongoDB  [localhost]
       -p, --port       TCP port number MongoDB is listening on  [27017]
       -d, --database   Which database to sync indexes
       -u, --username   Username to authenticate as to MongoDB
       -P, --password   Password for the authentication user
       --drop           Whether to drop indexes in the live database which do not exist in the file (default is to not drop).  [false]
       --dry            Only describe what changes would be made without actually applying them  [false]
    