/**
 * Module dependencies.
 */

var express = require('express');
var mongoose = require('mongoose');
var api = require('lib/db-api');
var utils = require('lib/utils');
var accepts = require('lib/accepts');
var restrict = utils.restrict;
var pluck = utils.pluck;
var expose = utils.expose;
var log = require('debug')('democracyos:debate-room');
var config = require('lib/config');
var utils = require('lib/utils');

var app = module.exports = express();

/**
 * Limit request to json format only
 */

app.use(accepts('application/json'));

/**
 * [exposeNode description]
 * @param  {[type]} nodeDoc [description]
 * @return {[type]}         [description]
 */
function exposeNode(nodeDoc) {
  var nodeListKeys = [
    'id type body title author',
    'createdAt editedAt',
    'debateType reference referenceType',
    'itemImage itemAuthor itemTitle'
  ].join(' ');

  var node = nodeDoc.toJSON();
  return expose(nodeListKeys)(nodeDoc);
}

/**
 * [exposeEdge description]
 * @param  {[type]} edgeDoc [description]
 * @return {[type]}         [description]
 */
function exposeEdge(edgeDoc) {
  var edgeListKeys = [
    'id type text author',
    'createdAt editedAt',
    'source target',
    'debateType'
  ].join(' ');

  var edge = edgeDoc.toJSON();
  return expose(edgeListKeys)(edgeDoc);
}

/**
 * [exposeDebateType description]
 * @param  {[type]} debateTypeDoc [description]
 * @return {[type]}               [description]
 */
function exposeDebateType(debateTypeDoc) {
  var debateTypeListKeys = [
    'id name nodeTypes edgeTypes'
  ].join(' ');

  var debateType = debateTypeDoc.toJSON();
  return expose(debateTypeListKeys)(debateType);
}

function findForum(req, res, next) {
  if (!config.multiForum) return next();

  if (!mongoose.Types.ObjectId.isValid(req.query.forum)) {
    return _handleError('Must define a valid \'forum\' param.', req, res);
  }

  api.forum.findById(req.query.forum, function(err, forum){
    if (err) return _handleError(err, req, res);
    if (!forum) return _handleError(new Error('Forum not found.'), req, res);

    req.forum = forum;
    next();
  });
}

function onlyForumAdmins(req, res, next) {
  if (!req.user) _handleError(new Error('Unauthorized.'), req, res);

  if (config.multiForum) {
    if (req.forum.isAdmin(req.user)) return next();
    return _handleError(new Error('Unauthorized.'), req, res);
  }

  if (req.user.staff) return next();
  return _handleError(new Error('Unauthorized.'), req, res);
}

/**
 * ---------------------------------------------------------------------------
 * ----------------------------- API Starts here -----------------------------
 * ---------------------------------------------------------------------------
 */

/**
 * 
 */
app.get('/debateroom/all', findForum, function(req, res, next) {
  if (!req.query.type) {
    log("Request didn't include `type` parameter");
    return res.send(400);
  } 
  if (!req.query.id) {
    log("Request didn't include `id` parameter");
    return res.send(400);
  }
  log('Request /debateroom/all for %s %s', req.query.type, req.query.id);

  api.debateroom.getDebate({reference: req.query.id, referenceType: req.query.type}, (err, debateDoc) => {
    if (err) return _handleError(err, req, res);

    log('Serving debate for %s %s', req.query.type, req.query.id);
    res.json(debateDoc);
  });
});

/**
 * 
 */
app.get('/node/:id', findForum, function(req, res, next) {
  log('Request GET /node/%s', req.params.id);

  api.debateroom.getNode(req.params.id, function(err, nodeDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving node %j', nodeDoc.id);
    res.json(exposeNode(nodeDoc));
  });
});

/**
 * 
 */
app.post('/node/create', restrict, function (req, res) {
  log('Request POST /node/create %j', req.body);

  req.body.forum = req.forum;
  req.body.author = req.user;
  api.debateroom.createNode(req.body, function (err, nodeDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving node %s', nodeDoc.id);
    res.json(exposeNode(nodeDoc));
  });
});

/**
 * 
 */
app.post('/node/:id', restrict, function (req, res) {
  log('Request POST /node/%s', req.params.id);

  api.debateroom.updateNode(req.params.id, req.body, function (err, nodeDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving node %s', nodeDoc.id);
    res.json(exposeNode(nodeDoc));
  });
});

/**
 * 
 */
app.get('/edge/:id', findForum, function(req, res, next) {
  log('Request GET /edge/%s', req.params.id);

  api.debateroom.getEdge(req.params.id, function(err, edgeDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving edge %j', edgeDoc.id);
    res.json(exposeEdge(edgeDoc));
  });
});

/**
 * 
 */
app.post('/edge/create', restrict, function (req, res) {
  log('Request POST /edge/create %j', req.body);

  req.body.forum = req.forum;
  api.debateroom.createEdge(req.body, function (err, edgeDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving edge %s', edgeDoc.id);
    res.json(exposeEdge(edgeDoc));
  });
});

/**
 * 
 */
app.post('/edge/:id', restrict, function (req, res) {
  log('Request POST /edge/%s', req.params.id);

  api.debateroom.updateEdge(req.params.id, req.body, function (err, edgeDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving edge %s', edgeDoc.id);
    res.json(exposeEdge(edgeDoc));
  });
});


/**
 * 
 */
app.delete('/edge/:id', restrict, function (req, res) {
  log('Request DELETE /edge/%s', req.params.id);

  api.debateroom.removeEdge(req.params.id, function (err, nothing) {
    if (err) return _handleError(err, req, res);

    log('Deleted edge %s', req.params.id);
    res.send(200);
  });
});


/**
 * 
 */
app.get('/type/:id', restrict, function (req, res) {
  log('Request GET /type/%s', req.params.id);

  api.debateroom.ensureDebateType({debateTypeId: req.params.id}, (err, debateTypeDoc) => {
    if (err) return _handleError(err, req, res);

    log('Serving debate type %s', debateTypeDoc.id);
    res.json(exposeDebateType(debateTypeDoc));
  });
});


function _handleError (err, req, res) {
  log("Error found: %s", err);
  var error = err;
  if (err.errors && err.errors.text) error = err.errors.text;
  if (error.type) error = error.type;

  res.json(400, { error: error });
}
