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
var log = require('debug')('democracyos:models:node');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var NodeSchema = new Schema({
    debateType: { type: ObjectId, ref: 'DebateType' }
  , type: { type: String, required: true }
  , body: { type: String, default: '', required: true }
  , author: { type: ObjectId, ref: 'User', required: true }
  , createdAt:  { type: Date, default: Date.now() }
  , editedAt:   { type: Date }
  , reference: { type: ObjectId, required: true }
  , referenceType: { type: String, enum: ['topic', 'platform'], required: true }
});

NodeSchema.set('toJSON', { getters: true });

module.exports = function initialize(conn) {
  return conn.model('Node', NodeSchema);
};
