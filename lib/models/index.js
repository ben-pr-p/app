var db = require('democracyos-db');
var config = require('lib/config');

/*
 *  Module dependencies
 */

var exports = module.exports = function(app) {

  // Initialize data models
  var connection = db.getDefaultConnection();

  require('./topic')(connection);
  require('./platform')(connection);
  require('./platform-tree')(connection);
  exports.Tag = require('./tag')(connection);
  exports.Comment = require('./comment')(connection);
  exports.Forum = require('./forum')(connection);
  exports.Feed = require('./feed')(connection);
  require('./token')(connection);
  require('./whitelist')(connection);

  // Treat User model as per configuration
  var usersDb = connection;

  // If a separate database is configured, create a dedicated connection
  var usingSeparateUsersDb = !!(config.mongoUsersUrl && (config.mongoUsersUrl != config.mongoUrl));
  if (usingSeparateUsersDb) {
    usersDb = db.createConnection(config.mongoUsersUrl);
  }

  exports.User = require('./user')(usersDb);

  // Perform primary connection
  db.connect(config.mongoUrl);
}
