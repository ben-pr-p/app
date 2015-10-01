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
var log = require('debug')('democracyos:models:opinion');
var xss = require('lib/richtext').xssFilter({ video: true, image: true, link: true });

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/**
 * Topic Opinion Schema
 */

var OpinionSchema = new Schema({
    value: { type: String, enum: ['positive', 'negative', 'neutral'], required: true }
  , topicId: { type: String, required: true }
  , createdAt: { type: Date, default: Date.now }
  , democracy: { type: ObjectId, ref: 'Deployment' }
});

var Opinion = mongoose.model('Opinion', OpinionSchema);

var exports = module.exports = function (conn) {
  return conn.model('Opinion', OpinionSchema);
}

exports.OpinionSchema = OpinionSchema;
