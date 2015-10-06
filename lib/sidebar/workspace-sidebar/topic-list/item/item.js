import o from 'component-dom';
import closest from 'component-closest';

import view from '../../../../view/mixin';
import template from './template.jade';

export default class List extends view('appendable', 'withEvents') {
  constructor (options = {}, topic) {
    options.template = template;
    options.locals = {item: topic};
    super(options);

    this.topic = topic;
    this.onSelect = this.onSelect.bind(this);
    this.switchOn();
  }

  switchOn () {
    this.bind('click', 'a.opinion-option', this.onSelect);
  }

  onSelect (ev) {
    ev.preventDefault();

    let target = ev.delegateTarget || closest(ev.target, '[data-id]');
    o(this.el).find('.opinion-option').removeClass('selected').addClass('unselected');

    o(target).removeClass('unselected').addClass('selected');
  }

}
