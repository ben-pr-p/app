/**
 * Extend module's NODE_PATH
 * HACK: temporary solution
 */

require('node-path')(module);

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Platform = mongoose.model('Platform');
var utils = require('lib/utils');
var log = require('debug')('democracyos:db-api:platform');
var pluck = utils.pluck;

exports.all = function (params, fn) {
  log('Looking for all platforms');

  var query = { deletedAt: null };

  if (params.forum) query.forum = params.forum;

  Platform
  .find(query)
  .select('id mediaTitle author opinions')
  .exec(function (err, platforms) {
    if (err) {
      log('Found error %j', err);
      return fn(err);
    }

    log('Delivering platforms %j', pluck(platforms, 'id'));
    // log(fn)
    fn(null, platforms);
  });

  return this;
};

exports.create = function (data, fn) {
  var platform = new Platform(data);
  platform.save(onsave);

  function onsave(err) {
    if (err) return fn(err);
    log('Successfully saved platform %s', platform.id);
    return fn(null, platform);
  }
}
