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

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , log = require('debug')('democracyos:comment-model');

var ArgumentTypeSchema = new Schema({
    name: { type: String, required: true }
});

var LinkTypeSchema = new Schema({
    name: { type: String, required: true }
  , color: { type: String, required: true }
  , angle: { type: Number, required: true }
  , from: [ArgumentTypeSchema]
  , to: [ArgumentTypeSchema]
});

var DebateTypeSchema = new Schema({
    name: { type: String, required: true }
  , argumentTypes: [ArgumentTypeSchema]
  , linkTypes: [LinkTypeSchema]
});

DebateTypeSchema.methods.checkAdd = function (parentType, linkType, childType) {
  var link = this.linkTypes.filter(l => l.name == linkType)[0];
  if ((link.from.filter(a => a.name == parentType).length > 0) && (link.to.filter(a => a.name == childType).length > 0) {
    return true;
  }
  return false;
}

module.exports = function initialize(conn) {
  return conn.model('DebateType', DebateTypeSchema);
};

