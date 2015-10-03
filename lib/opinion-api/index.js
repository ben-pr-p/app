/**
 * Module dependencies.
 */

var express = require('express');
var api = require('lib/db-api');
var accepts = require('lib/accepts');
var utils = require('lib/utils');
var restrict = utils.restrict;
var staff = utils.staff;
var expose = utils.expose;
var log = require('debug')('democracyos:opinion-api');

var app = module.exports = express();

/**
 * Limit request to json format only
 */

app.use(accepts('application/json'));

app.get('/opinion/all', function (req, res) {
  log('Request /opinion/all');
  api.opinion.all(function (err, opinions) {
    if (err) return _handleError(err, req, res);

    log('Serving all tags');
    res.json(opinions.map(expose('value topicId')));
  });
});

app.get('/opinion/:id', function (req, res) {
  log('Request GET /opinion/%s', req.params.id);

  api.opinion.get(req.params.id, function (err, opinionDoc) {
    if (err) return _handleError(err, req, res);

    log('Serving tag %s', opinionDoc.id);
    var keys = [
      'value topicId'
    ].join(' ');

    res.json(expose(keys)(opinionDoc.toJSON()));
  });
});