/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var log = require('debug')('democracyos:db-api:debate-room');
var utils = require('lib/utils');
var pluck = utils.pluck;
var async = require('async');
var defaultDebate = require('./default.js');

var DebateType = mongoose.model('DebateType');
var Node = mongoose.model('Node');
var Edge = mongoose.model('Edge');

/**
 * [getDebate description]
 * @param  {[type]}   options [description]
 * @param  {Function} fn      [description]
 * @return {[type]}           [description]
 */
exports.getDebate = function (options, fn) {
  exports.searchNodes(options, (err, nodes) => {
    if (err) return fn(err);

    exports.searchEdges(options, (err, edges) => {
      if (err) return fn(err);

      var debate = {
        nodes: nodes || [],
        edges: edges || []
      }
      var debateTypeQuery = nodes[0] || {};

      exports.ensureDebateType(debateTypeQuery, (err, debateType) => {
        if (err) return fn(err);

        debate.debateType = debateType;
        fn(null, debate);
      });
    });
  });
}

/**
 * [searchNodes description]
 * @param  {[type]}   options [description]
 * @param  {Function} fn      [description]
 * @return {[type]}           [description]
 */
exports.searchNodes = function (options, fn) {
  var query = options;

  Node
  .find(query)
  .populate('author')
  .exec((err, nodes) => {
    if (err) return fn(err);

    if (!nodes) {
      log('Nodes not found for %s %s', options.type, options.id);
      return fn(null);
    }

    log('Got nodes %j', pluck(nodes, 'id'));
    fn(null, nodes);
  });
}

/**
 * [getNode description]
 * @param  {[type]}   id [description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
exports.getNode = function (id, fn) {
  Node
  .findOne({ _id: id })
  .populate('author')
  .exec((err, node) => {
    if (err) return fn(err);

    if (!node) {
      log('Node with id %s not found', id);
      return fn(null);
    }

    fn(null, node);
  });
}

/**
 * [createNode description]
 * @param  {[type]}   data [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */
exports.createNode = function (data, fn) {
  exports.ensureDebateType(data, (err, debateType) => {
    if (err) return fn(err);

    data.debateType = debateType.id;

    var node = new Node(data);
    node.save((err) => {
      if (err) {
        log('Error creating node: %s', err);
        return fn(err);
      }

      log('Created node %j', node);
      return fn(null, node);
    });
  });
}

/**
 * [updateNode description]
 * @param  {[type]}   id   [description]
 * @param  {[type]}   data [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */
exports.updateNode = function (id, data, fn) {
  exports.getNode(id, (err, node) => {
    if (err) return fn(err);

    node.editedAt = new Date();

    node.set(data);
    node.save((err) => {
      if (err) {
        log('Error updating node: %s', err);
        return fn(err);
      }

      log('Updated node: %s', id);
      return fn(null, node);
    });
  });
}

/**
 * [searchEdges description]
 * @param  {[type]}   options [description]
 * @param  {Function} fn      [description]
 * @return {[type]}           [description]
 */
exports.searchEdges = function (options, fn) {
  var query = options;

  Edge
  .find(query)
  .exec((err, edges) => {
    if (err) return fn(err);

    if (!edges) {
      log('Edges not found for %s %s', options.type, options.id);
      return fn(null);
    }

    log('Got edges %j', pluck(edges, 'id'));
    fn(null, edges);
  });
}

/**
 * [getEdge description]
 * @param  {[type]}   id [description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
exports.getEdge = function (id, fn) {
  Edge
  .findOne({ _id: id })
  .exec((err, edge) => {
    if (err) return fn(err);

    if (!edge) {
      log('Edge with id %s not found', id);
      return fn(null);
    }

    fn(null, edge);
  });
}

/**
 * [createEdge description]
 * @param  {[type]}   data [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */
exports.createEdge = function (data, fn) {
  exports.ensureDebateType(data, (err, debateType) => {
    if (err) return fn(err);

    data.debateType = debateType.id;

    var edge = new Edge(data);
    edge.save((err) => {
      if (err) {
        log('Error creating edge: %s', err);
        return fn(err);
      }

      log('Created edge %j', edge);
      return fn(null, edge);
    });
  });
}

/**
 * [updateEdge description]
 * @param  {[type]}   id   [description]
 * @param  {[type]}   data [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */
exports.updateEdge = function (id, data, fn) {
  exports.getEdge(id, (err, edge) => {
    if (err) return fn(err);

    edge.set(data);
    edge.save((err) => {
      if (err) {
        log('Error updating edge: %s', err);
        return fn(err);
      }

      log('Updated edge: %s', id);
      return fn(null, edge);
    });
  });
}

/**
 * [removeEdge description]
 * @param  {[type]}   id [description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
exports.removeEdge = function (id, fn) {
  exports.getEdge(id, (err, edge) => {
    if (err) return fn(err);

    edge.remove(err => {
      if (err) return fn(err);

      log('Deleted edge %s', id);
      return fn(null);
    })
  });
}

/**
 * [removeNode description]
 * @param  {[type]}   id [description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
exports.removeNode = function (id, fn) {
  exports.getNode(id, (err, node) => {
    if (err) return fn(err);

    node.remove(err => {
      if (err) return fn(err);

      log('Deleted node %s', id);
      return fn(null);
    })
  });
}

/**
 * [ensureDebateType description]
 * @param  {[type]}   data [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */
exports.ensureDebateType = function (data, fn) {
  log('Checking for debate type %s', data.debateType);
  DebateType
  .findOne({ _id: data.debateType })
  .exec((err, debateTypeDoc) => {
    if (err) return fn(err);

    if (!debateTypeDoc) {
      log('Debate type not found – creating new with default settings');
      var debateType = new DebateType(defaultDebate);
      return debateType.save((err) => {
        if (err) return fn(err);

        log('Delivering default debate type');
        return fn(null, debateType)
      });
    }

    log('Devliering debate type %s', debateTypeDoc.id);
    return fn(null, debateTypeDoc);
  });
}
