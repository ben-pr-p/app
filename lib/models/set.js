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
var log = require('debug')('democracyos:models:set');
var xss = require('lib/richtext').xssFilter({ video: true, image: true, link: true });

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var TopicSchema = mongoose.model('')

/**
 * Topic Opinion Schema
 */

var Opinion = new Schema({
    value: { type: String, enum: ['positive', 'negative', 'neutral'], required: true }
  , topicID: { type: String, required: true }
  , createdAt: { type: Date, default: Date.now }
  , democracy: { type: ObjectId, ref: 'Deployment' }
});

/**
 * Set Schema
 */
var Set = new Schema({
    author: { type: ObjectId, ref: 'User', required: true }
  , opinions: [Opinion]
});


module.exports = function initialize(conn) {
  return conn.model('Topic', TopicSchema);
};
