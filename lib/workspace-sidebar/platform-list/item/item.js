import o from 'component-dom';
import closest from 'component-closest';

import view from '../../../view/mixin';
import template from './template.jade';

export default class List extends view('appendable', 'withEvents') {
  constructor (options = {}, platform) {
    options.template = template;
    options.locals = {item: platform};
    super(options);

    this.platform = platform;
    this.switchOn();
  }

  switchOn () {
  }

}
