import view from '../view/mixin';
import template from './template.jade';
import DebateForce from './debate-force.js';
import Schema from './schema.js';
import debug from 'debug';
const log = debug('democracyos:admin-topics-form');

export default class DebateRoom extends view('appendable', 'withEvents') {
  constructor (options) {
    options.template = template;
    super(options);

    this.debate = options.debate;
  }

  initialize () {
    this.debateForce = new DebateForce({
      debate: this.debate, 
      schema: new Schema(this.debate.debateType),
    });

    this.debateForce.launch();
  }
}
