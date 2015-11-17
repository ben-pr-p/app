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

var VoteSchema = new Schema({
    caster: { type: ObjectId, ref: 'User' }
  , value: { type: String, enum:['positive', 'negative'] }
});

var NodeSchema = new Schema({
    debateType: { type: ObjectId, ref: 'DebateType' }
  , type: { type: String, required: true }
  , body: { type: String, default: '', required: true }
  , author: { type: ObjectId, ref: 'User', required: true }
  , createdAt:  { type: Date, default: Date.now() }
  , editedAt:   { type: Date }
  , reference: { type: ObjectId, required: true }
  , referenceType: { type: String, enum: ['topic', 'platform'], required: true }
  , itemImage: { type: String, required: false }
  , itemAuthor: { type: String, required: false }
  , itemTitle: { type: String, required: false }
  , votes: [VoteSchema]
});

NodeSchema.set('toJSON', { getters: true });

NodeSchema.methods.vote = function (vote, cb) {
  var toRemove = this.votes.filter(v => v.caster == vote.caster.id);

  toRemove.forEach(v => {
    log('Removing vote %j', v);
    this.votes.splice(this.votes.indexOf(v), 1);
  });

  this.votes.push(vote);
  this.save(cb);
}

module.exports = function initialize(conn) {
  return conn.model('Node', NodeSchema);
};
