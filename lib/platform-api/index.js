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
  'id mediaTitle officialTitle opinions tags body forum',
  'createdAt publishedAt',
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


app.post('/platform/:id/publish', restrict, hasAccess, function (req, res) {
  log('Request POST /platform/%s/publish', req.params.id);

  api.platform.get(req.params.id, function (err, platform) {
    if (err) return _handleError(err, req, res);

    platform.publishedAt = new Date;
    platform.save(function (err, saved) {
      if (err) return _handleError(err, req, res);
      log('publish platform %s at %s', platform.id, platform.publishedAt);

      var eventName = 'platform-published';

      var platformUrl = utils.buildUrl(config, { pathname: '/platform/' + platform.id });

      var data = {
        platform: { mediaTitle: platform.mediaTitle, id: platform.id },
        url: platformUrl
      };

      if (config.deploymentId) {
        data.deploymentId = config.deploymentId;
      }

      notifier.notify(eventName)
        .withData(data)
        .send(function (err) {
          if (err) {
            log('Error when sending notification for event %s', eventName);
          } else {
            log('Successfully notified publishing of platform %s', platform.id);
          }
        });
    });

    res.json(exposePlatform(platform, req.user));
  });
});


app.post('/platform/:id/unpublish', restrict, hasAccess, function (req, res) {
  log('Request POST /platform/%s/unpublish', req.params.id);

  api.platform.get(req.params.id, function (err, platformDoc) {
    if (err) return _handleError(err, req, res);

    platformDoc.publishedAt = null;
    platformDoc.save(function (err, saved) {
      if (err) return _handleError(err, req, res);
      log('unpublished platform %s', platformDoc.id);
      res.json(exposePlatform(platformDoc, req.user));
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

/**
 * COME BACK TO THIS – NEED TO THINK OF HOW VOTING IS IMPELEMENTED
 */

// app.post('/topic/:id/vote', restrict, function (req, res) {
//   log('Request /topic/%s/vote', req.param('id'));

//   api.topic
//   .vote(
//     req.param('id'),
//     req.user,
//     req.param('value'),
//     function (err, topic) {
//       if (err) return _handleError(err, req, res);

//       var eventName = 'topic-voted';

//       notifier.notify(eventName)
//         .withData( { topic: topic.id, user: req.user.id, vote: req.param('value') } )
//         .send(function (err, data) {
//           if (err) {
//             log('Error when sending notification for event %s', eventName);
//           } else {
//             log('Successfully notified voting of topic %s', topic.id);
//           }
//         });

//       res.json(exposeTopic(topic, req.user));
//     }
//   );
// });

function _handleError (err, req, res) {
  log("Error found: %s", err);
  var error = err;
  if (err.errors && err.errors.text) error = err.errors.text;
  if (error.type) error = error.type;

  res.json(400, { error: error });
}
