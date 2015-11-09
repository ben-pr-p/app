import dom from 'component-dom';
import view from '../../../view/mixin';
import template from './template.jade';

export default class NodeEdit extends view('appendable', 'emptyable', 'withEvents') {
  constructor (options) {
    options.template = template;
    super(options);

    this.onCancelReply = options.onCancelReply;
    this.onAddNode = options.onAddNode;
    this.onsubmit = this.onsubmit.bind(this);
    this.oncancel = this.oncancel.bind(this);
  }

  /**
   * Switch on events
   *
   * @api public
   */
  switchOn () {
    this.bind('click', '.btn-cancel', this.oncancel);
    this.bind('click', '.btn.form-submit', this.onsubmit);
  }

  /**
   * Put a node
   *
   * @param {Object} data
   * @api public
   */
  onsubmit (ev) {
    ev.preventDefault();
    var data = {
      title: dom(this.el).find('input.title').val(),
      body: dom(this.el).find('textarea').val()
    }
    this.onAddNode({node: data}); // defined by NodeView
  }

  /**
   * On cancel editing a node
   *
   * @param {Object} data
   * @api public
   */
  oncancel (ev) {
    dom(this.el).remove();
    this.onCancelReply(); // defined by NodeView
  }

}
