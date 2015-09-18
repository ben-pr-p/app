import debug from 'debug';
import config from '../config/config';
import platformStore from '../platform-store/platform-store';

const log = debug('democracyos:platform-middlewares');

/**
 * Load private topics from specified Forum.
 * Should only be used by admin modules.
 */
// export function findPrivateTopics(ctx, next) {
//   if (config.multiForum && !ctx.forum) {
//     throw new Error('First you must fetch the current forum.');
//   }

//   let query = { draft: true };
//   if (config.multiForum) query.forum = ctx.forum.id;

//   topicStore.findAll(query).then(topics => {
//     ctx.topics = topics;
//     next();
//   }).catch(err => {
//     if (404 !== err.status) throw err;
//     log(`Unable to load topics for forum ${ctx.forum.name}`);
//   });
// }

/**
 * Load public topics from specified Forum
 */
export function findPlatforms(ctx, next) {
  if (config.multiForum && !ctx.forum) {
    throw new Error('First you must fetch the current forum.');
  }

  let query = {};
  if (config.multiForum) query.forum = ctx.forum.id;

  platformStore.findAll(query).then(platforms => {
    ctx.platforms = platforms;
    next();
  }).catch(err => {
    if (404 !== err.status) throw err;
    log(`Unable to load platforms for forum ${ctx.forum.name}`);
  });
}

/**
 * Load specific topic from context params
 */

// export function findTopic(ctx, next) {
//   topicStore
//     .findOne(ctx.params.id)
//     .then(topic => {
//       ctx.topic = topic;
//       next();
//     })
//     .catch(err => {
//       if (404 !== err.status) throw err;
//       log(`Unable to load topic for ${ctx.params.id}`);
//     });
// }
