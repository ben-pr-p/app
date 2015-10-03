import debug from 'debug';
import page from 'page';
import opinionStore from '../opinion-store/opinion-store';

const log = debug('democracyos:opinion-middlewares');

export function findAllOpinions(ctx, next) {
  opinionStore
    .findAll()
    .then(opinions => {
      ctx.opinions = opinions;
      next();
    })
    .catch(err => {
      const message = 'Unable to load opinions for forum ' + ctx.params.forum.name;
      return log(message);
    })
}

/**
 * Load specific tag from context params
 */

export function findOpinion(ctx, next) {
  opinionStore
    .findOne(ctx.params.id)
    .then(opinion => {
      ctx.opinion = opinion;
      return next();
    })
    .catch(err => {
      const message = 'Unable to load opinion for ' + ctx.params.id;
      return log(message);
    });
}