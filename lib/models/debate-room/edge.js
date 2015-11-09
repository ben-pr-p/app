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
var log = require('debug')('democracyos:models:edge');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var EdgeSchema = new Schema({
    type: { type: String, required: true } 
  , debateType: { type: ObjectId, ref: 'DebateType' }
  , source: { type: ObjectId, ref: 'Node' }
  , target: { type: ObjectId, ref: 'Node' }
  , reference: { type: ObjectId, required: true }
  , referenceType: { type: String, enum: ['topic', 'platform'], required: true }
});

EdgeSchema.set('toJSON', { getters: true });

module.exports = function initialize(conn) {
  return conn.model('Edge', EdgeSchema);
};
