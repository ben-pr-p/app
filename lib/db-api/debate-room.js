/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var DebateType = mongoose.model('DebateType');
var Argument = mongoose.model('Argument');
var log = require('debug')('democracyos:db-api:debate-room');
var utils = require('lib/utils');
var async = require('async');
var defaultDebate = require('./default.js');

exports.getDebate = function getDebate(id, fn) {
  Argument
  .findOne({ _id: id })
  .populate('debateType')
  .exec((err, arg) => {
    if (err) return fn(err);

    if (!arg) {
      log('Debate not found with id %s', id);
      return fn(null);
    }

    log('Delivering debate %s', id);
    return exports.populateArg(arg, fn);
  });
}

exports.searchDebate = function searchDebate(reference, referenceType, fn) {
  Argument
  .findOne({ reference: reference, referenceType: referenceType })
  .populate('debateType')
  .exec((err, arg) => {
    if (err) return fn(err);

    if (!arg) {
      log('Debate not found with reference to %s %s', reference, referenceType);
      return fn(null);
    }

    log('Delivering debate %s', arg.id);
    return exports.populateArg(arg, fn);
  });
}

exports.populateArg = function populateArg(argId, fn) {
  exports.get(argId, (err, arg) => {
    if (err) return fn(err);

    if (arg.children.length == 0) {
      log('At leaf – returning arg %s', arg.id);
      return fn(null, arg);
    }

    async.parallel(arg.children.map(argId => populateArg(argId)), (err, args) => {
      if (err) return fn(err);

      args.children.forEach((link, idx) => {
        link.to = args[idx];
      });

      fn(null, arg);
    });
  });
}

exports.createDebate = function createDebate(data, fn) {
  exports.ensureDebateType(data, (err, debateType) => {
    if (!data.argType) data.argType = 'basic';

    var arg = new Argument({
      text: data.item.text,
      author: data.item.author,
      reference: data.item.id,
      referenceType: data.type,
      debateType: debateType.id,
      type: data.argType,
      name: 'root'
    });

    arg.save((err) => {
      if (err) {
        log('Error creating debate: %s', err);
        return fn(err);
      }

      log('Created debate %j', arg);
      return fn(null, arg);
    });
  });
}

exports.addArgument = function addArgument(options, fn) {
  var parentId = options.parentId;
  var linkType = options.linkType;
  var argData = options.argData;

  exports.get(parentId, (err, parent) => {
    if (err) return log('Found error: %s', err), fn(err);

    DebateType
    .findOne(parent.debateType)
    .exec((err, debateType) => {
      if (err) return log('Found error: %s', err), fn(err);

      if (!debateType.checkAdd(parent.type, linkType, argData.type)) {
        log('Illegal argument add according to debate schema %s', parent.debateType);
        return fn(new Error("Illegal argument add"));
      }

      var arg = new Argument(argData);
      arg.save((err) => {
        if (err) return log('Found error: %s', err), fn(err);

        log('Created new arg %s', arg.id);

        var link = {
          type: linkType,
          from: parent.id,
          to: arg.id
        }

        parent.addChild(link, (err, parent) => {
          if (err) return fn(err);

          arg.addParent(link, (err, arg) => {
            if (err) return fn(err);

            log('Creating link %j', link);
            log('Delivering arg %s', arg.id);
            fn(null, arg);
          });
        });
      });
    });
  });
}

exports.get = function get(id, fn) {
  Argument
  .findOne({ _id: id })
  .exec((err, arg) => {
    if (err) return fn(err);

    if (!arg) {
      log('Arg with id %s not found', id);
      return fn(null);
    }

    fn(null, arg);
  });
}

exports.create = function create(data, fn) {
  var arg = new Argument(data);
  arg.save((err) => {
    if (err) {
      log('Error creating argument: %s', err);
      return fn(err);
    }

    log('Created argument %j', arg);
    return fn(null, arg);
  });
}

exports.update = function update(id, data, fn) {
  exports.get(id, (err, arg) => {
    if (err) return fn(err);

    arg.set(data);
    arg.save((err) => {
      if (err) {
        log('Error updating argument: %s', err);
        return fn(err);
      }

      log('Updated argument %s', id);
      return fn(null, arg);
    });
  });
}

exports.ensureDebateType = function ensureDebateType(data, fn) {
  log('Checking for debate type %s', data.debateTypeId);
  DebateType
  .findOne({ _id: data.debateTypeId })
  .exec((err, debateTypeDoc) => {
    if (err) return fn(err);

    if (!debateTypeDoc) {
      log('Debate type not found – creating new with default settings');
      var debateType = new DebateType(defaultDebate);
      return debateType.save((err) => {
        if (err) return fn(err);

        log('Delivering default debate type');
        return fn(null, debateType)
      });
    }

    log('Devliering debate type %s', debateTypeDoc.id);
    return fn(null, debateTypeDoc);
  });
}
