/**
 * Extend module's NODE_PATH
 * HACK: temporary solution
 */

require('node-path')(module);

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('lib/utils');
var log = require('debug')('democracyos:db-api:opinion');
var pluck = utils.pluck;

var Opinion = mongoose.model('Opinion')

exports.all = function all(fn) {
  var query = {deletedAt: null};

  log('Fetching all opinions');
  Opinion
  .find(query)
  .exec(function(err, opinions) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    log('Delivering opinions %s', pluck(opinions, 'id'));
    fn(null, opinions);
  })
}

exports.get = function get(id, fn) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    log('ObjectId %s is not valid', id);
    return fn(null);
  }

  var query = { _id: id, deletedAt: null };

  log('Looking for opinion %s', id);
  Opinion
  .findOne(query)
  .exec(function(err, opinion) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    if (!opinion) {
      log('Opinion not found');
      return fn(null);
    }

    log('Delivering opinion %s', opinion.id);
    fn(null, opinion);
  });
};

exports.ensureOpinion = function search(query, fn) {
  log('Looking for opinion matching query %j', query);
  Opinion
  .findOne(query)
  .exec(function(err, opinion) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    if (!opinion) {
      createOpinion(query, fn);
    } else {
      log('Delivering opinion %s', opinion.id);
      fn(null, opinion);
    }
  });
}

function createOpinion(data, fn) {
  log('Creating new opinion %j', data);

  var opinion = new Opinion(data);
  opinion.save(onsave);

  function onsave(err) {
    if (err) return fn(err);
    log('Saved opinion %s', opinion.id);
    log('Delivering opinion %s', opinion.id);
    fn(null, opinion);
  }
}


