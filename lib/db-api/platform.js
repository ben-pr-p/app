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
var topicApi = require('./topic');
var ptApi = require('./platform-tree');
var pluck = utils.pluck;
var async = require('async');

exports.all = function (params, fn) {
  log('Looking for all platforms');

  var query = { deletedAt: null };

  if (params.forum) query.forum = params.forum;

  Platform
  .find(query)
  .populate('opinions platformTree')
  .exec(function (err, platforms) {
    if (err) {
      log('Found error %j', err);
      return fn(err);
    }

    log('Delivering platforms %j', pluck(platforms, 'id'));
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
  .populate('opinions platformTree')
  .exec(function(err, platform) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    if (!platform) {
      log('Platform not found');
      return fn(null);
    }

    if (!platform.platformTree) {
      platform.extendedOpinions = platform.directOpinions;
      return fn(null, platform);
    }

    ptApi.opinions(platform.platformTree.id, (err, opinions) => {
      platform.extendedOpinions = platform.directOpinions.concat(opinions.removeConflicts(platform.directOpinions));
      fn(null, platform);
    });

  });
};

exports.directOpinions = function directOpinions(id, fn) {
  Platform
  .findOne({ _id: id, deletedAt: null })
  .populate('directOpinions')
  .exec(function(err, platform) {
    if (err) return fn(err);
    if (!platform) return fn(null);
    log('Delivering opinions for platform %s', id);
    return fn(null, platform.directOpinions);
  });
}

exports.extendedOpinions = function extendedOpinions(id, fn) {
  Platform
  .findOne({ _id: id, deletedAt: null })
  .populate('directOpinions platformTree')
  .exec(function(err, platform) {
    if (err) return fn(err);
    if (!platform) return fn(null);

    ptApi.opinions(platform.platformTree.id, (err, opinions) => {
      if (err) return fn(err);
      if (!platform) return fn(null);

      var extendedOpinions = platform.directOpinions.concat(opinions.removeConflicts(platform.directOpinions));
      fn(null, extendedOpinions);
    });
  });
}

exports.create = function create(data, fn) {
  ptApi.create(data.platformTree, (err, pt) => {
    log('Creating new platform %j', data);
    data.platformTree = pt.id;

    var platform = new Platform(data);
    platform.save(onsave);

    function onsave(err) {
      if (err) return fn(err);
      log('Saved platform %s', platform.id);
      fn(null, platform);
    }

    return this;
  });
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

    ptApi.update(platform.platformTree.id, data.platformTree, (err, pt) => {
      if (err) return fn(err);

      data.platformTree = pt.id;

      // update and save platform document with data
      platform.set(data);
      platform.save(onupdate);
    });
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

exports.vote = function vote(platformId, user, fn) {
  var query = { _id: platformId, deletedAt: null };

  log('Proceeding to vote on all opinions for platform %s from user %s', platformId, user.id);
  Platform
  .findOne(query)
  .exec(function (err, platform) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    platform.vote(user, (err, platform) => {
      if (err) {
        log('Found error %s', err);
        return fn(err);
      }
      
      doVote(platform, user, fn);
    });
  });
}

function doVote(platform, user, cb) {
  exports.extendedOpinions(platform.id, (err, opinions) => {
    Promise
    .all(opinions.map( o => {
      return new Promise((resolve, reject) => {
        var params = {
          user: user,
          value: o.value,
          platform: platform.id
        };

        topicApi.vote(o.topicId, params, function (err, topic) {
          if (err) return reject(err);
          resolve(topic);
        });
      });
    }))
    .then(topics => {
      log('Successfully voted on topics %j', pluck(topics, 'id'));
      fn(null, topics);
    });
  });
}

exports.unvote = function unvote(platformId, user, fn) {
  var query = { _id: platformId, deletedAt: null };

  log('Proceeding to remove platform votes from all opinions from platform %s by user %s', platformId, user.id);
  Platform
  .findOne(query)
  .exec(function (err, platform) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    platform.unvote(user, (err, platform) => {
      if (err) {
        log('Found error %s', err);
        return fn(err);
      }

      doUnvote(platform, user, fn);
    });
  });
}

function doUnvote(platform, user, cb) {
  exports.extendedOpinions(platform.id, (err, opinions) => {
    Promise
    .all(opinions.map( o => {
      return new Promise((resolve, reject) => {
        topicApi.unvoteplatform(o.topicId, user, platform.id, function (err, topic) {
          if (err) return reject(err);
          resolve(topic);
        });
      });
    }))
    .then(topics => {
      log('Successfully removed platform votes from topics %j', pluck(topics, 'id'));
      cb(null, platform);
    });
  });
}

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

/**
 * [setMinus description]
 * @param {[type]} other [description]
 */
Array.prototype.removeConflicts = function (other) {
  return this.filter(o1 => {
    var matches = other.filter(o2 => {
      return (o1.topicId == o2.topicId);
    });
    return (matches.length == 0)
  });
}
