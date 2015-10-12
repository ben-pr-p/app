import ToggleParent from 'democracyos-toggle-parent';
import view from '../../../view/mixin';
import template from './template.jade';
import platformFilter from '../../../platform-filter/platform-filter';

export default class Filter extends view('appendable', 'removeable', 'withEvents') {
  constructor (options) {
    options.template = template;
    options.locals = options.filter;
    super(options);

    this.filter = this.options.filter;

    this.switchOn();
  }

  switchOn () {
  }

}
