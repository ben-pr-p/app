import dom from 'component-dom';
import view from '../../../view/mixin';
import template from './template.jade';

export default class NodeEdit extends view('appendable', 'emptyable', 'withEvents') {
  constructor (options) {
    options.template = template;
    super(options);

    this.node = options.locals.node;
    this.onsubmit = this.onsubmit.bind(this);
    this.oncancel = this.oncancel.bind(this);
    this.resize = this.resize.bind(this);
    this.onkeydown = this.onkeydown.bind(this);
  }

  /**
   * Switch on events
   *
   * @api public
   */
  switchOn () {
    this.bind('click', '.btn-cancel', this.oncancel);
    this.bind('click', '.btn.form-submit', this.onsubmit);

    ['keyup', 'change', 'cut', 'paste'].forEach(event => {
      this.bind(event, 'textarea.node-edit-body', this.resize);
    });

    this.bind('keydown', 'textarea.node-edit-body', this.onkeydown);

    this.bind('click', 'textarea.node-edit-body', (ev) => {
      ev.preventDefault();
    });
  }

  /**
   * Put a node
   *
   * @param {Object} data
   * @api public
   */
  onsubmit (ev) {
    ev.preventDefault();
    this.node.body = dom(this.el).find('.node-edit-body').val();
    this.submit({node: this.node}); // defined by NodeView
  }

  /**
   * On cancel editing a node
   *
   * @param {Object} data
   * @api public
   */
  oncancel (ev) {
    dom(this.el).remove();
    this.cancel(); // defined by NodeView
  }

  resize (ev) {
    var el = dom(this.el).find('textarea.node-edit-body')[0];
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  onkeydown (ev) {
    if (ev.keyCode == 13) {
      if (ev.shiftKey) {
        dom(this.el).find('.node-edit-body').val(dom(this.el).find('.node-edit-body').val() + '\n');
        return;
      }
      dom(this.el).find('.form-submit')[0].click();
    }
  }

}
