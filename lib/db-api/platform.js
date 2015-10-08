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
var tagApi = require('./tag');
var pluck = utils.pluck;

exports.all = function (params, fn) {
  log('Looking for all platforms');

  var query = { deletedAt: null };

  if (params.forum) query.forum = params.forum;

  Platform
  .find(query)
  .populate('opinions')
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
}

exports.get = function get(id, fn) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    log('ObjectId %s is not valid', id);
    return fn(null);
  }

  var query = { _id: id, deletedAt: null };

  log('Looking for platform %s', id);
  Platform
  .findOne(query)
  .populate('opinions')
  .exec(function(err, platform) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    if (!platform) {
      log('Platform not found');
      return fn(null);
    }

    log('Delivering platform %s', platform.id);
    fn(null, platform);
  });
};

exports.create = function create(data, fn) {
  log('Creating new platform %j', data);

  var platform = new Platform(data);
  platform.save(onsave);

  function onsave(err) {
    if (err) return fn(err);
    log('Saved platform %s', platform.id);
    fn(null, platform);
  }

  return this;
};


exports.update = function update(id, data, fn) {
  log('Updating platform %s with %j', id, data);

  // get platform
  exports.get(id, onget);

  function onget(err, platform) {
    if (err) {
      log('Found error %s', err.message);
      return fn(err);
    }

    var links = data.links || [];
    delete data.links;

    links.forEach(function(link) {
      var l = platform.links.id(link.id);
      l.set(link);
    });

    // update and save platform document with data
    platform.set(data);
    platform.save(onupdate);
  }

  function onupdate(err, platform) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }
    log('Saved platform %s', platform.id);

    return fn(null, platform);
  }

  return this;
};

exports.opine = function opine(platformId, topicId, value, fn) {
  var query = { _id: platformId, deletedAt: null };

  log('Proceeding to add opinion %s on topic %s to platform %s', value, topicId, platformId);

  Platform
  .findOne(query)
  .exec(function (err, platform) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    doOpine(platform, topicId, value, fn);
  });
}

function doOpine(platform, topicId, value, cb) {
  platform.opine({topicId: topicId, value: value}, function (err, platform) {
    if (err) {
      log('Found error %s', err);
      return cb(err);
    }

    log('Added opinion %s on topic %s for platform %s', value, topicId, platform.id);
    cb(null, platform);
  });
}

exports.removeOpinion = function removeOpinion(platformId, topicId, fn) {
  var query = { _id: platformId, deletedAt: null };

  log('Proceeding to remove opinions with topicId %s on platform %s', topicId, platformId);

  Platform
  .findOne(query)
  .exec(function (err, platform) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    platform.unopine(topicId, function (err, platform) {
      if (err) {
        log('Found error %s', err);
        return fn(err);
      }

      log('Removed opinion with topicId %s from platform %s', topicId, platformId);
      return fn(null, platform);
    });
  });
}
