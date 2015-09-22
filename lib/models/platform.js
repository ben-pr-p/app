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
  , topicID: { type: String, required: true }
  , createdAt: { type: Date, default: Date.now }
  , democracy: { type: ObjectId, ref: 'Deployment' }
});

var Opinion = mongoose.model('Opinion', OpinionSchema);

/**
 * Platform Schema
 */
var PlatformSchema = new Schema({
    author: { type: String }
  , authorUrl: { type: String, validate: validators.isURL({ skipEmpty: true }) }
  , opinions: [Opinion]
  , global: { type: Boolean, required: true }
  , officialTitle: { type: String, required: true }
  , mediaTitle: { type: String, required: true }
  , forum: { type: ObjectId, ref: 'Forum', required: false }
  , tag: { type: ObjectId, ref: 'Tag', required: true }
  , body: { type: String }
  , createdAt: { type: Date, default: Date.now }
  , publishedAt: { type: Date }
  , links: [LinkSchema]
});

PlatformSchema.set('toJSON', { getters: true });

module.exports = function initialize(conn) {
  return conn.model('Platform', PlatformSchema);
};
