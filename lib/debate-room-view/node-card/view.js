import view from '../../view/mixin';
import template from './template.jade';
import render from '../../render/render.js';
import o from 'component-dom';
import closest from 'component-closest';
import NodeEdit from './node-edit/view.js';

export default class NodeCard extends view('appendable', 'emptyable', 'withEvents') {
  constructor (options) {
    options.template = template;
    super(options);

    this.node = options.locals.node;
    this.edgesTo = options.edgesTo;
    this.addNode = options.addNode;

    this.onanyclick = this.onanyclick.bind(this);
    this.onreplyclick = this.onreplyclick.bind(this);
    this.onoptionclick = this.onoptionclick.bind(this);

    this.card = o(this.el).find('.node-card');
  }

  switchOn () {
    this.bind('click', '[data-reply-name]', this.onoptionclick);
    this.bind('click', '.node-reply', this.onreplyclick);
    this.bind('click', '.node-box', this.onanyclick);
  }

  onanyclick (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    if (closest(ev.target, '.node-reply', true) 
      || closest(ev.target, '.reply-options-container', true)
      || closest(ev.target, '.reply-form-container', true) ) return;

    this.card.find('.node-body-container').toggleClass('selected');
  }

  onreplyclick (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    // render reply options
    this.card.find('.reply-options-container').toggleClass('hide');
  }

  onoptionclick (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    // mark the current one as chosen
    this.card.find('[data-reply-name]').removeClass('chosen');
    o(closest(ev.target, '[data-reply-name]', true)).addClass('chosen');

    // get the edge type
    var edgeType = o(closest(ev.target, '[data-reply-name]', true)).attr('data-reply-name')

    // render the new comment block
    var replyContainer = this.card.find('.reply-form-container');
    replyContainer.empty();

    var nodeEdit = new NodeEdit({
      container: replyContainer[0],
      locals: {
        node: {},
        edge: edgeType
      },

      onCancelReply: () => {
        this.card.find('[data-reply-name]').removeClass('chosen');
      },

      onAddNode: (data) => {
        data.edge = {
          target: this.node.id,
          type: edgeType
        };
        this.addNode(data);
        nodeEdit.oncancel();
        this.card.find('.reply-options-container').toggleClass('hide');
      }

    });
  }
}
