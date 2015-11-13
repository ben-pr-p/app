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

    this.onanyclick = this.onanyclick.bind(this);
    this.onreplyclick = this.onreplyclick.bind(this);
    this.onoptionclick = this.onoptionclick.bind(this);
    this.onmouseover = this.onmouseover.bind(this);
    this.onmouseout = this.onmouseout.bind(this);

    this.card = o(this.el).find('.node-card');
  }

  switchOn () {
    this.bind('click', '[data-reply-name]', this.onoptionclick);
    this.bind('click', '.node-reply', this.onreplyclick);
    this.bind('click', '.node-box', this.onanyclick);
    this.bind('mouseover', '.node-box', this.onmouseover);
    this.bind('mouseout', '.node-box', this.onmouseout);
  }

  onanyclick (ev) {
    // ev.stopPropagation();
    if (ev.defaultPrevented) return;
    if (!this.card.find('.node-body-container').hasClass('selected')) this.zoomToMe();

    if (this.card.find('.node-body-container').hasClass('clicked')) {
      this.card.find('.node-body-container').removeClass('selected').removeClass('clicked');
      return;
    }

    if (this.card.find('.node-body-container').hasClass('selected')) {
      this.card.find('.node-body-container').addClass('clicked');
    }
    
  }

  onreplyclick (ev) {
    ev.preventDefault();
    // render reply options
    if (this.card.find('.reply-options-container').hasClass('hide')) this.zoomToMe();
    this.card.find('.reply-options-container').toggleClass('hide');
    this.tick();
  }

  onoptionclick (ev) {
    ev.preventDefault();
    // mark the current one as chosen
    this.card.find('[data-reply-name]').removeClass('chosen');
    o(closest(ev.target, '[data-reply-name]', true)).addClass('chosen');

    // get the edge type
    var edgeType = o(closest(ev.target, '[data-reply-name]', true)).attr('data-reply-name')

    // render the new comment block if not already there
    if (!this.nodeEdit) {
      var replyContainer = this.card.find('.reply-form-container');
      replyContainer.empty();

      this.nodeEdit = new NodeEdit({
        container: replyContainer[0],
        locals: {
          node: {}
        }
      });
    }

    this.nodeEdit.onCancelReply = () => {
      this.card.find('[data-reply-name]').removeClass('chosen');
      this.nodeEdit = null;
      this.tick();
    };

    this.nodeEdit.onAddNode = (data) => {
      data.edge = {
        target: this.node.id,
        type: edgeType
      };
      this.addNode(data);
      this.nodeEdit.oncancel();
      this.card.find('.reply-options-container').toggleClass('hide');
    };
    // adjust positions
    this.tick();
  }

  onmouseover (ev) {
    o(ev.delegateTarget).find('.node-body-container').addClass('selected');
  }

  onmouseout (ev) {
    if (!o(ev.delegateTarget).find('.node-body-container').hasClass('clicked'))
      o(ev.delegateTarget).find('.node-body-container').removeClass('selected');
  }
}
