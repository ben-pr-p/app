import o from 'component-dom';
import view from '../../../view/mixin';
import template from './template.jade';
import platformFilter from '../../../platform-filter/platform-filter';

export default class Filter extends view('appendable', 'removeable', 'withEvents') {
  constructor (options) {
    options.template = template;
    options.locals = options.filter;
    super(options);

    this.filter = this.options.filter;

    this.onSearchChange = this.onSearchChange.bind(this);
    this.searchBox = o('input.platform-sidebar-search');

    this.switchOn();
  }

  switchOn () {
    this.bind('keyup', 'input.platform-sidebar-search', this.onSearchChange);
  }

  onSearchChange (e) {
    e.preventDefault();
    platformFilter.setFilter({search: this.searchBox.val()});
  }
}
