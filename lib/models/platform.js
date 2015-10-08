/**
 * Extend module's NODE_PATH
 * HACK: temporary solution
 */

require('node-path')(module);

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var validators = require('mongoose-validators');
var log = require('debug')('democracyos:models:platform');
var xss = require('lib/richtext').xssFilter({ video: true, image: true, link: true });

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var LinkSchema = require('./topic').LinkSchema;

/**
 * Topic Opinion Schema
 */

var OpinionSchema = new Schema({
    value: { type: String, enum: ['positive', 'negative', 'neutral'], required: true }
  , topicId: { type: String, required: true }
  , createdAt: { type: Date, default: Date.now }
});

/**
 * Platform Schema
 */
var PlatformSchema = new Schema({
    author: { type: String }
  , authorUrl: { type: String, validate: validators.isURL({ skipEmpty: true }) }
  , opinions: [OpinionSchema]
  , global: { type: Boolean, required: true }
  , officialTitle: { type: String, required: true }
  , mediaTitle: { type: String, required: true }
  , forum: { type: ObjectId, ref: 'Forum', required: false }
  , body: { type: String }
  , createdAt: { type: Date, default: Date.now }
  , deletedAt: { type: Date }
  , publishedAt: { type: Date }
  , links: [LinkSchema]
});


PlatformSchema.methods.opine = function (opinion, cb) {
  log('Opinion: %j', opinion);
  this.unopine(opinion.topicId, function (err, platform) {
    if (err) {
      if ('function' === typeof cb) return cb(err);
      else throw err;
    }

    platform.opinions.push(opinion);

    if ('function' === typeof cb) platform.save(cb);
  });
}

PlatformSchema.methods.unopine = function (topicId, cb) {
  var opinions = this.opinions;

  var conflicts = opinions.filter(function(o) {
    return (o.topicId == topicId);
  });

  log(conflicts);

  if (opinions.length) conflicts.forEach(function(o) {
    var removed = opinions.id(o.id).remove();
    log('Remove vote %j', removed);
  });

  if (typeof cb == 'function') this.save(cb);
}

PlatformSchema.set('toJSON', { getters: true });

module.exports = function initialize(conn) {
  return conn.model('Platform', PlatformSchema);
};
