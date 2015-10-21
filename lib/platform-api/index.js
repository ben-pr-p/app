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
var log = require('debug')('democracyos:platform');
var config = require('lib/config');
var utils = require('lib/utils');
var notifier = require('lib/notifications').notifier;
var hasAccess = require('lib/is-owner').hasAccess;

var app = module.exports = express();

/**
 * Limit request to json format only
 */

app.use(accepts('application/json'));

var platformListKeys = [
  'id mediaTitle officialTitle directOpinions extendedOpinions tag body forum',
  'createdAt publishedAt participants platformTree',
  'deletedAt global author authorUrl'
].join(' ');

function exposePlatform(platformDoc, user, keys) {
  if (!keys) keys = platformListKeys;

  var platform = platformDoc.toJSON();

  return expose(keys)(platform);
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
 * API Starts here
 */

app.get('/platform/all', findForum, function(req, res, next) {
  if (req.query.draft) {
    onlyForumAdmins(req, res, next);
  } else {
    next();
  }
}, function (req, res) {
  log('Request /platform/all');

  api.platform.all({forum: req.forum}, function(err, platforms) {
    if (err) return _handleError(err, req, res);

    log('Serving platforms %j', pluck(platforms, 'id'));

    res.json(platforms.map(function(platformDoc){
      return exposePlatform(platformDoc, req.user);
    }));

  });
});


app.get('/platform/:id', function (req, res) {
  log('Request GET /platform/%s', req.params.id);

  api.platform.get(req.params.id, function (err, platform) {
    if (err) return _handleError(err, req, res);
    if (!platform) return res.send(404);

    log('Serving platform %s', platform.id);
    res.json(exposePlatform(platform, req.user));
  });
});

app.get('/platform/:id/opinions', function (req, res) {
  log('Request GET /platform/%s/opinions', req.params.id);

  api.platform.opinions(req.params.id, function (err, opinions) {
    if (err) return _handleError(err, req, res);
    if (!opinions) return res.send(404);

    log('Serving platform opinions %s', opinions);
    res.json(opinions);
  });
});

app.post('/platform/create', restrict, hasAccess, function (req, res) {
  log('Request /platform/create %j', req.body);

  req.body.forum = req.forum;
  api.platform.create(req.body, function (err, platform) {
    if (err) {
      log('Found error %j', err);
      res.send(err);
    }

    res.json(exposePlatform(platform, req.user));
  });
});


app.post('/platform/:id', restrict, hasAccess, function (req, res) {
  log('Request POST /platform/%s', req.params.id);

  api.platform.update(req.params.id, req.body, function (err, platform) {
    if (err) return _handleError(err, req, res);
    log('Serving platform %s', platform.id);
    res.json(exposePlatform(platform, req.user));
  });
});


app.post('/platform/:id/vote', restrict, hasAccess, function (req, res) {
  log('Request POST /platform/%s/vote', req.params.id);

  api.platform.vote(req.params.id, req.user, function (err, platform) {
    if (err) return _handleError(err, req, res);
    log('Voted – serving platform %s', platform.id);
    res.json(exposePlatform(platform, req.user));
  });
});


app.post('/platform/:id/unvote', restrict, hasAccess, function (req, res) {
  log('Request POST /platform/%s/unvote', req.params.id);

  api.platform.unvote(req.params.id, req.user, function (err, platform) {
    if (err) return _handleError(err, req, res);
    log('Unvoted – serving platform %s', platform.id);
    res.json(exposePlatform(platform, req.user));
  });
});


app.post('/platform/:id/remove', restrict, hasAccess, function (req, res) {
  log('Request POST /platform/%s/remove', req.param('platformId'));

  api.platform.removeOpinion(req.param('platformId'), req.param('topicId'), function (err, platform) {
    if (err) return _handleError(err, req, res);
    log('Opinion removed – serving platform %s', platform.id);
    
    api.platform.get(req.params.id, function (err, platform) {
      if (err) return _handleError(err, req, res);
      if (!platform) return res.send(404);

      log('Serving platform %s', platform.id);
      res.json(exposePlatform(platform, req.user));
    });
  });
});


app.post('/platform/:id/link', restrict, hasAccess, function (req, res) {
  log('Request POST /platform/%s/link', req.params.id);

  var link = req.body.link;
  api.platform.get(req.params.id, function (err, platformDoc) {
    if (err) return _handleError(err, req, res);

    var linkDoc = link && link.id
      ? platformDoc.links.id(link.id)
      : platformDoc.links.create();

    linkDoc.update(link);
    if (linkDoc.isNew) platformDoc.links.push(linkDoc);

    platformDoc.save(function (err, saved) {
      if (err) return _handleError(err, req, res);

      res.json(200, expose('id text url')(linkDoc));
    });
  });
});


app.delete('/platform/:id/link', restrict, hasAccess, function (req, res) {
  log('Request DELETE /platform/%s/link', req.params.id);

  var link = req.body.link;
  api.platform.get(req.params.id, function (err, platformDoc) {
    if (err) return _handleError(err, req, res);

    platformDoc.links.remove(link);
    log('removed link %s from platform %s', link, platformDoc.id);

    platformDoc.save(function (err, saved) {
      if (err) return _handleError(err, req, res);

      res.json(200);
    });
  });
});


app.delete('/platform/:id', restrict, hasAccess, function (req, res) {
  log('Request DEL /platform/%s', req.params.id);

  api.platform.get(req.params.id, function (err, platformDoc) {
    if (err) return _handleError(err, req, res);

    platformDoc.deletedAt = new Date;
    platformDoc.save(function (err, saved) {
      if (err) return _handleError(err, req, res);
      log('deleted platform %s', platformDoc.id);
      res.json(200);
    });
  });
});

app.post('/platform/:id/opine', restrict, function (req, res) {
  log('Request /platform/%s/opine', req.param('platformId'));

  var platformId = req.param('platformId');
  var topicId = req.param('topicId');
  var value = req.param('value');

  api.platform.opine(platformId, topicId, value, function (err, platform) {
      if (err) return _handleError(err, req, res);

      api.platform.get(req.params.id, function (err, platform) {
        if (err) return _handleError(err, req, res);
        if (!platform) return res.send(404);

        log('Serving platform %s', platform.id);
        res.json(exposePlatform(platform, req.user));
      });
    }
  );
});

function _handleError (err, req, res) {
  log("Error found: %s", err);
  var error = err;
  if (err.errors && err.errors.text) error = err.errors.text;
  if (error.type) error = error.type;

  res.json(400, { error: error });
}
