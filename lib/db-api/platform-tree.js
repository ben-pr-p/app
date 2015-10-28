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
 * Starts the recursive process of getting opinions for a given platform tree
 * 
 * @param  {[type]}   id [platform tree id]
 * @param  {Function} fn [callback, will be passed to recursive function]
 */
exports.opinions = function (id, fn) {
  exports.get(id, function (err, pt) {
    if (err) return fn(err);

    return opinionsHelper(pt, fn);
  });
}

/**
 * Creates a new platform tree
 * 
 * @param  {Array}   list    parsed syntax string, something like ["234512345134", "+", "21341234123513415"]
 *                           - should only include platformIds, +, -, (, ), or intersection symbols
 * @param  {Function} fn     callback
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
 * Returns a platform tree with id `id`
 * 
 * @param  {ObjectId} id [platform tree id]
 * @param  {Function} fn [callback]
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
    return fn(null, platformTree);
  });
}

/**
 * Updates a given platformtree 
 * 
 * @param  {ObjectId}   platformId [used to check if applying the update would cause an infinite loop]
 * @param  {ObjectId}   id         [id of the platform tree to update]
 * @param  {Array}   list          [parsed syntax string, something like ["234512345134", "+", "21341234123513415"]]
 * @param  {Function} fn           [callback]
 */
exports.update = function update(platformId, id, list, fn) {
  exports.get(id, (err, pt) => {
    if (err) return fn(err);

    if (!pt) {
      return exports.create(list, onsave);
    }

    var t = tree(list);

    checkForInfinite(platformId, t, (err, t) => {
      if (err) return fn(err);

      pt.set(t);
      pt.save(onsave);

      function onsave (err, pt) {
        if (err) return log('Found error %s', err), fn(err);
        log('Updated platform tree %s', pt.id);
        fn(null, pt);
      };
    });
  });
}

/**
 * Recursive function
 * if pt is a leaf, return it's platform's opinions (or an empty list)
 * else
 *   pt must be an op
 *   call opinions helper on its left and right children
 *   return the result of the op applied by left op right
 * 
 * @param  {Object}   pt [platform tree object]
 * @param  {Function} fn [callback]
 */
function opinionsHelper(pt, fn) {
  if (!(pt.data) || (pt.data != '' && pt.op == 'nop')) {
    if ((!pt.data) || pt.data == '') {
      log('Empty platform tree – delivering empty list');
      return fn(null, []);
    }

    log('At root platform tree %s - getting opinions', pt.id);
    return platformApi.directOpinions(pt.data, fn);
  }

  async.parallel([opinionsHelper(pt.left), opinionsHelper(pt.right)], (err, results) => {
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
        return fn(null, []);
    }

  });
}

/**
 * Recreates the total string for a given tree (including calls to children's platform trees)
 * And then returns if platformId is in that string
 * If it is, creating the platform tree would cause an inifinite loop whenever
 *   opinionsHelper is called on it in the future
 * 
 * @param  {ObjectId}   platformId
 * @param  {Object}   t             [platform tree nested objects]
 * @param  {Function} fn            [callback]
 */
function checkForInfinite (platformId, t, fn) {
  getString(t, (err, string) => {
    if (string.indexOf(platformId) > -1) {
      log('Platform tree has string %s, which contains %s. Would cause infinite loop.', string, platformId);
      var error = new Error('Infinite platform tree loop')
      return fn(error);
    }

    log('No infinite. Proceeding to update platform tree.');
    return fn(null, t);
  });
}

/**
 * Recreates the tree
 * RECURSIVE FUNCTION
 * if i am a leaf, return empty if i'm empty or the platform tree string of my data
 * else
 *   i must be an op
 *   return my left childs string + my op + my right child's string using recursive calls
 * 
 * @param  {Object}   t  [platform tree nested objects]
 * @param  {Function} fn [callback]
 */
function getString (t, fn) {
  if (!(t.data) || (t.data != '' && t.op == 'nop')) {
    if (!t.data) {
      log('Empty platform tree has no infinite.');
      return fn(null, '');
    }

    return platformApi.get(t.data, (err, platform) => {
      return fn(err, platform.platformTree.string);
    });
  }

  async.parallel([getString(t.left), getString(t.right)], (err, childstrings) => {
    if (err) return fn(err);

    var mystring = childstrings[0] + '|' + t.op + '|' + childstrings[1];
    return fn(null, mystring);
  });
}

/**
 * Calling a.setMinus(b) will return a without any of the elements in b
 * 
 * @param {Array} other [none of the elements in other will be included in the array returned]
 * @return {Array}
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
 * Parses the syntax of a list l and creates a syntax tree based on it
 * RECURSIVE FUNCTION
 * if I'm a leaf, return me
 * else
 *   I must be an op
 *   Set my op
 *   Set my left and right by making recursive calls
 * 
 * @param  {Array} l  [list parsed syntax string, something like ["234512345134", "+", "21341234123513415"]]
 * @return {Object}   [syntax tree]
 */
function tree(l) {
  log(l);
  var t = { string: l.join('|'), op: 'nop' };

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
 * Used to handle parentheses in syntax lists
 * Will continue to move through the list until it thinks it is no
 * longer inside a parentheses
 * 
 * @param  {Array} l  [same as above]
 * @return {Number}   [the index of the end of the left element]
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
