import bus from 'bus';
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

    this.onExpandClick = this.onExpandClick.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);

    this.searchBox = o('input.platform-search');

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '[data-expand-button]', this.onExpandClick);
    this.bind('keyup', 'input.platform-search', this.onSearchChange);
  }

  onExpandClick (e) {
    e.preventDefault();
    o('.platform').toggleClass('hide');
    o(e.delegateTarget).toggleClass('collapsed');
  }

  onSearchChange (e) {
    e.preventDefault();
    platformFilter.setFilter({search: this.searchBox.val()});
  }
}
