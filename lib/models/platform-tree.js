var mongoose = require('mongoose');
var validators = require('mongoose-validators');
var log = require('debug')('democracyos:models:platform-tree');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var PlatformTreeSchema = new Schema({
  string: { type: String, required: false },
  op: { type: String, enum: ['+', '-', '∩', 'nop'], default: 'nop' },
  data: {type: String, default: null, required: false },
  left: Schema.Types.Mixed,
  right: Schema.Types.Mixed
});


PlatformTreeSchema.set('toJSON', { getters: true });

module.exports = function initialize(conn) {
  return conn.model('PlatformTree', PlatformTreeSchema);
};
