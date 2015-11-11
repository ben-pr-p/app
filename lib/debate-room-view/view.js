import d3 from 'd3';
import view from '../view/mixin';
import config from '../config/config.js';
import template from './template.jade';
import debateroomStore from '../debate-room-store/debate-room-store.js';
import nodeStore from '../debate-room-store/node-store.js';
import edgeStore from '../debate-room-store/edge-store.js';
import topicStore from '../topic-store/topic-store.js';
import platformStore from '../platform-store/platform-store.js';
import DebateForce from './debate-force.js';
import Schema from './schema.js';
import debug from 'debug';

const log = debug('democracyos:admin-topics-form');

export default class DebateRoom extends view('appendable', 'withEvents') {
  constructor (options) {
    options.template = template;
    super(options);

    this.type = options.type;
    this.item = options.item;
  }

  initialize () {
    debateroomStore
      .findAll({type: this.type, id: this.item.id})
      .then(debate => {
        // add the item as root node if there are none
        if (debate.nodes.length == 0) {
          var itemStore = (this.type == 'topic') ? topicStore : platformStore;
          itemStore
            .findOne(this.item.id)
            .then(item => {

              var node = {
                body: (this.type == 'topic') ? item.clauses.map(c => c.markup).join(' ') : item.body,
                type: 'root',
                itemTitle: item.title,
                reference: item.id,
                referenceType: this.type,
                itemAuthor: item.author,
                itemImage: item.tag.image
              };

              nodeStore
                .create(node)
                .then(body => {
                  debate.nodes.push(body);

                  this.debateForce = new DebateForce({
                    debate: debate, 
                    schema: new Schema(debate.debateType),
                    type: this.type,
                    item: this.item
                  });

                  this.debateForce.launch();     
                  
                })
                .catch(err => {
                  log(err);
                })

            })
            .catch(err => {
              log(err);
            })
        } else {
          this.debateForce = new DebateForce({
            debate: debate, 
            schema: new Schema(debate.debateType),
            type: this.type,
            item: this.item
          });

          this.debateForce.launch();
        }
      });
  }
}
