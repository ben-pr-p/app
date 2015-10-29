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

var argListKeys = [
  'id mediaTitle officialTitle directOpinions extendedOpinions tag body forum',
  'createdAt publishedAt participants platformTree',
  'deletedAt global author authorUrl'
].join(' ');

function exposeArg(argDoc) {
  var arg = argDoc.toJSON();

  return expose(argListKeys)(arg);
}

var debateListKeys = [
  'id mediaTitle officialTitle directOpinions extendedOpinions tag body forum',
  'createdAt publishedAt participants platformTree',
  'deletedAt global author authorUrl'
].join(' ');

function exposeDebate(debateDoc) {
  var debate = debateDoc.toJSON();

  return expose(debateListKeys)(debate)
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

// function onlyForumAdmins(req, res, next) {
//   if (!req.user) _handleError(new Error('Unauthorized.'), req, res);

//   if (config.multiForum) {
//     if (req.forum.isAdmin(req.user)) return next();
//     return _handleError(new Error('Unauthorized.'), req, res);
//   }

//   if (req.user.staff) return next();
//   return _handleError(new Error('Unauthorized.'), req, res);
// }

/**
 * API Starts here
 */

app.get('/debateroom/create', findForum, function(req, res, next) {
  if (!req.query.type) {
    log("Request didn't include `type` parameter");
    return res.error(400);
  } 
  if (!req.query.id) {
    log("Request didn't include `id` parameter");
    return res.error(400);
  }

  log('Request /debateroom/create for %s %s', req.query.type, req.query.id);
  var typeApi = req.params.type == 'topic' ? api.topic : api.platform;
  typeApi.get(req.query.id (err, item) => {
    if (err) return _handleError(err, req, res);

    api.debateroom.createDebate({type: req.query.type, item: item}, (err, debateDoc) => {
      if (err) return _handleError(err, req, res);

      res.json(exposeDebate(debateDoc));
    });
  });
});

app.get('/debateroom/:id', findForum, function(req, res, next) {
  log('Request /debateroom/:id for %s %s', req.params.id);

  api.debateroom.getDebate({type: req.params.type, id: req.params.id}, function(err, debateDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving debate %j', pluck(debate, 'id'));
    res.json(exposeDebate(debateDoc));
  });
});


app.get('/argument/:id', function (req, res) {
  log('Request GET /argument/%s', req.params.id);

  api.debateroom.get(req.params.id, function (err, argDoc) {
    if (err) return _handleError(err, req, res);
    if (!argDoc) return res.send(404);

    log('Serving argument %s', argDoc);
    res.json(exposeArg(argDoc));
  });
});


app.post('/argument/create', restrict, hasAccess, function (req, res) {
  log('Request /argument/create %j', req.body);

  req.body.forum = req.forum;
  api.debateroom.addArgument(req.body, function (err, argDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving argument %s', argDoc.id);
    res.json(exposearg(argDoc));
  });
});


app.post('/argument/:id', restrict, hasAccess, function (req, res) {
  log('Request POST /argument/%s', req.params.id);

  api.debateroom.update(req.params.id, req.body, function (err, argDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving argument %s', argDoc.id);
    res.json(exposearg(argDoc));
  });
});


function _handleError (err, req, res) {
  log("Error found: %s", err);
  var error = err;
  if (err.errors && err.errors.text) error = err.errors.text;
  if (error.type) error = error.type;

  res.json(400, { error: error });
}
