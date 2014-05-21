#!/usr/bin/env node

var path = require('path');

var sync = require('../lib/sync');

var opts = require('nomnom')
  .script('mongo-index-sync')
  .option('file', {
    abbr: 'f',
    help: 'Path to file which contains db.collection.ensureIndex calls',
    required: true
  })
  .option('host', {
    abbr: 'h',
    help: 'Hostname or IP address of MongoDB',
    default: 'localhost'
  })
  .option('port', {
    abbr: 'p',
    help: 'TCP port number MongoDB is listening on',
    default: 27017
  })
  .option('database', {
    abbr: 'd',
    help: 'Which database to sync indexes',
    required: true
  })
  .option('username', {
    abbr: 'u',
    help: 'Username to authenticate as to MongoDB'
  })
  .option('password', {
    abbr: 'P',
    help: 'Password for the authentication user'
  })
  .option('drop', {
    flag: true,
    help: 'Whether to drop indexes in the live database which do not exist in the file (default is to not drop).',
    default: false
  })
  .option('dry', {
    flag: true,
    help: 'Only describe what changes would be made without actually applying them',
    default: false
  })
  .parse();

sync({
  file: path.resolve(opts.file),
  host: opts.host,
  port: opts.port,
  database: opts.database,
  username: opts.username,
  password: opts.password,
  drop: opts.drop,
  dry: opts.dry
})(function (error) {
  if (error) {
    // nomnom uses exit code 1 for usage errors, so we use 2 for runtime errors.
    process.exit(2);
    console.log(error);
  }
  else {
    console.log('Finished syncing.');
  }
});
