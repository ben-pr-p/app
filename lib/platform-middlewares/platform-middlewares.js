import debug from 'debug';
import config from '../config/config';
import platformStore from '../platform-store/platform-store';

const log = debug('democracyos:platform-middlewares');

/**
 * Load private platforms from specified Forum.
 * Should only be used by admin modules.
 */
export function findPrivatePlatforms(ctx, next) {
  if (config.multiForum && !ctx.forum) {
    throw new Error('First you must fetch the current forum.');
  }

  let query = { draft: true };
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
 * Load public platforms from specified Forum
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
 * Load specific platform from context params
 */

export function findPlatform(ctx, next) {
  platformStore
    .findOne(ctx.params.id)
    .then(platform => {
      ctx.platform = platform;
      next();
    })
    .catch(err => {
      if (404 !== err.status) throw err;
      log(`Unable to load platform for ${ctx.params.id}`);
    });
}
