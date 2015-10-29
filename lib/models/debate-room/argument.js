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
  , log = require('debug')('democracyos:argument-model');

var LinkSchema = new Schema({
    type: { type: String, required: true } 
  , from: { type: ObjectId, ref: 'Argument' }
  , to: { type: ObjectId, ref: 'Argument' }
});

var ArgumentSchema = new Schema({
    debateType: { type: ObjectId, ref: 'DebateType' }
  , type: { type: String, required: true }
  , text: { type: String, default: '' }
  , parents: [LinkSchema]
  , children: [LinkSchema]
  , author: { type: ObjectId, ref: 'User' }
  , createdAt:  { type: Date, default: Date.now }
  , editedAt:   { type: Date }
  , reference: { type: ObjectId }
  , referenceType: { type: String, enum: ['topic', 'platform'] }
});

ArgumentSchema.methods.addParent = function (link, cb) {
  this.parents.push(link);
  this.save(cb);
}

ArgumentSchema.methods.addChild = function (link, cb) {
  this.children.push(link);
  this.save(cb);
}

module.exports = function initialize(conn) {
  return conn.model('Argument', ArgumentSchema);
};

