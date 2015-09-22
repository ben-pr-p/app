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

  ensureTag(data, function(err, platform) {
    if (err) {
      log('Found error from platform creation: %s', err.message);
      return fn(err);
    }
    createPlatform(platform, fn);
  });

  return this;
};

function ensureTag(data, fn) {
  tagApi.searchOne(data.hash, function(err, tags) {
    if (err) {
      log('Found error %s', err.message)
      return fn(err);
    }

    if (!tags.length) {
      if (!data.tag) return fn(new Error('No tag provided'));
      tagApi.create(data.tag, afterCreate);
    } else {
      fn(null, data);
    }
  });

  function afterCreate(err, tag) {
    if (err) {
      log('Found error from tag creation: %s', err.message);
      return fn(err);
    }
    data.tag = tag;
    fn(null, data);
  }
}

function createPlatform(data, fn) {
  var platform = new Platform(data);
  platform.save(onsave);

  function onsave(err) {
    if (err) return fn(err);
    log('Saved platform %s', platform.id);
    fn(null, platform);
  }
}

exports.update = function update(id, data, fn) {
  log('Updating platform %s with %j', id, data);

  // look for tag for nesting reference
  log('Looking for tag %s in database.', data.tag);

  tagApi.searchOne(data.tag, function (err, tag) {
    if (err) {
      log('Found error %s', err.message);
      return fn(err);
    }

    // now set `data.tag` to `tag`'s document _id
    data.tag = tag;

    // get platform
    exports.get(id, onget);
  });

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
