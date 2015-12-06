import o from 'component-dom';
import closest from 'component-closest';
import bus from 'bus';
import dragula from 'dragula';

import view from '../../../../view/mixin';

import template from './template.jade';

export default class List extends view('appendable', 'withEvents') {
  constructor (options = {}, platform) {
    options.template = template;
    options.locals = {item: platform};

    super(options);

    this.platform = platform;

    this.onActiveClick = this.onActiveClick.bind(this);
  }

  switchOn () {
    this.bind('click', '.active-checkbox', this.onActiveClick);
  }

  onActiveClick () {
    bus.emit('platform-filter:active:start');
  }

}
