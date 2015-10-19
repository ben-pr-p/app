/**
 * Extend module's NODE_PATH
 * HACK: temporary solution
 */

require('node-path')(module);

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var PlatformTree = mongoose.model('PlatformTree');
var utils = require('lib/utils');
var log = require('debug')('democracyos:db-api:platform-tree');
var platformApi = require('./platform');
var async = require('async');
var pluck = utils.pluck;


/**
 * [opinions description]
 * @param  {[type]}   id [description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
exports.opinions = function (id, fn) {
  get(id, function (err, pt) {
    if (err) return fn(err);

    return opinionsHelper(pt, fn);
  });
}

/**
 * [create description]
 * @param  {[type]}   list [description]
 * @param  {Function} fn     [description]
 * @return {[type]}          [description]
 */
exports.create = function create(list, fn) {
  var t = tree(list);

  var pt = new PlatformTree(t);
  pt.save(onsave);

  function onsave(err, pt) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    log('Successfully created platform tree %s', pt.id);
    return fn(null, pt);
  };
}

/**
 * [get description]
 * @param  {[type]}   id [description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
exports.get = function get(id, fn) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    log('ObjectId %s is not valid - casting...', id);
    id = mongoose.Types.ObjectId(id);
  }

  var query = { _id: id };

  log('Looking for platform tree %s', id);
  PlatformTree
  .findOne(query)
  .exec(function(err, platformTree) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    if (!platformTree) {
      log('Platform tree not found');
      return fn(null);
    }

    log('Delivering platform tree %s', platformTree.id);
    fn(null, platformTree);
  });
}

/**
 * [update description]
 * @param  {[type]}   id     [description]
 * @param  {[type]}   string [description]
 * @param  {Function} fn     [description]
 * @return {[type]}          [description]
 */
exports.update = function update(id, list, fn) {
  exports.get(id, (err, pt) => {
    if (err) return fn(err);

    if (!pt) {
      return exports.create(list, onsave);
    }

    var t = tree(list);
    pt.set(t);
    pt.save(onsave);

    function onsave (err, pt) {
      if (err) return log('Found error %s', err), fn(err);
      log('Updated platform tree %s', pt.id);
      fn(null, pt);
    };
  });
}

/**
 * [opinionsHelper description]
 * @param  {[type]}   pt [description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
function opinionsHelper(pt, fn) {
  if (pt.data && !pt.op) {
    log('At root platform %s - getting opinions', pt.id);
    return platformApi.opinions(pt.data, fn);
  }

  async.parallel([opinions(pt.left), opinions(pt.right)], (err, results) => {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    if (!results) {
      log('Results not found'); 
      return fn(null);
    }

    if (results.length != 2) {
      log('2 results not fetched - results were: %s', results);
      return fn(null);
    }

    var a = results[0], b = results[1];

    switch (pt.op) {
      case '-':
        log('At minus op %s: returning %s - %s', pt.id, pt.left, pt.right);
        return fn(null, a.setMinus(b));

      case '+':
        log('At plus op %s: returning %s + %s', pt.id, pt.left, pt.right);
        return fn(null, a.concat(b));

      case '∩':
        log('At intersection op %s: return %s ∩ %s', pt.id, pt.left, pt.right);
        return fn(null, a.setMinus(b.setMinus(a)));

      default:
        log('Unrecognized op %s at %s: returning null', pt.op, pt.id);
        return fn(null);
    }

  });
}

/**
 * [setMinus description]
 * @param {[type]} other [description]
 */
Array.prototype.setMinus = function (other) {
  return this.filter(o1 => {
    var matches = other.filter(o2 => {
      return ((o1.topicId == o2.topicId) && (o1.value == o2.value));
    });
    return (matches.length > 0)
  });
}

/**
 * [tree description]
 * @param  {[type]} l [description]
 * @return {[type]}   [description]
 */
function tree(l) {
  var t = {};

  if (l.length == 1) {
    t.data = l[0];
    return t;
  }

  if ((l[0] == '(') && (l[l.length - 1] == ')')) {
    if (l.filter(c => (c == '(')).length == 1) {
      l = l.slice(1, l.length - 1);
    }
  }

  var leftEndIdx = getLeftEl(l);
  t.left = tree(l.slice(0, leftEndIdx));
  t.op = l[leftEndIdx];
  t.right = tree(l.slice(leftEndIdx + 1));

  return t;
}

/**
 * [getLeftEl description]
 * @param  {[type]} l [description]
 * @return {[type]}   [description]
 */
function getLeftEl(l) {
  var idx = 1;
  var pDepth = (l[0] == '(') ? 1 : 0;

  while (pDepth != 0) {
    switch (l[idx]) {
      case '(':
        pDepth += 1;
      case ')':
        pDepth -= 1;
      default:
        idx += 1;
    }
  }
  return idx;
}
