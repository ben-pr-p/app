import debug from 'debug';
import config from '../config/config';
import debateroomStore from '../debate-room-store/debate-room-store';
import nodeStore from '../debate-room-store/node-store';
import topicStore from '../topic-store/topic-store.js';
import platformStore from '../platform-store/platform-store.js';
const log = debug('democracyos:debate-room-middlewares');

export function findDebate(ctx, next) {
  if (config.multiForum && !ctx.forum) {
    throw new Error('First you must fetch the current forum.');
  }

  var query = {};

  if (ctx.platform) {
    query.type = 'platform';
    query.id = ctx.platform.id;
  }

  if (ctx.topic) {
    query.type = 'topic';
    query.id = ctx.topic.id;
  }

  if (config.multiForum) {
    query.forum = ctx.forum.id;
  }

  debateroomStore
  .findAll(query)
  .then(debate => {
    // add the item as root node if there are none
    if (debate.nodes.length == 0) {
      var itemStore = (query.type == 'topic') ? topicStore : platformStore;
      itemStore
        .findOne(query.id)
        .then(item => {

          var node = {
            body: (query.type == 'topic') ? item.clauses.map(c => c.markup).join(' ') : item.body,
            type: 'root',
            itemTitle: item.title,
            reference: item.id,
            referenceType: query.type,
            itemAuthor: item.author,
            itemImage: item.tag.image,
            forum: query.forum
          };

          nodeStore
            .create(node)
            .then(body => {
              debate.nodes.push(body);

              debate.reference = query.id;
              debate.referenceType = query.type;
              debate.forum = query.forum;
              ctx.debate = debate;
              next();   
              
            })
            .catch(err => {
              log(err);
            })

        })
        .catch(err => {
          log(err);
        });

    } else {
      debate.reference = query.id;
      debate.referenceType = query.type;
      debate.forum = query.forum;
      ctx.debate = debate;
      next();
    }
  });
}
