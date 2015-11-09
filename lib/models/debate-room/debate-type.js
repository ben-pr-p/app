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
var log = require('debug')('democracyos:models:topic');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var NodeTypeSchema = new Schema({
    name: { type: String, required: true }
});

var EdgeTypeSchema = new Schema({
    name: { type: String, required: true }
  , color: { type: String, required: true }
  , angle: { type: Number, required: true }
  , source: [NodeTypeSchema]
  , target: [NodeTypeSchema]
});

var DebateTypeSchema = new Schema({
    name: { type: String, required: true }
  , nodeTypes: [NodeTypeSchema]
  , edgeTypes: [EdgeTypeSchema]
});

DebateTypeSchema.set('toJSON', { getters: true });

module.exports = function initialize(conn) {
  return conn.model('DebateType', DebateTypeSchema);
};

