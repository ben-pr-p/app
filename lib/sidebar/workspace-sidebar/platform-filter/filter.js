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

    this.onplatformexpandclick = this.onplatformexpandclick.bind(this);
    this.onplatformsearchchange = this.onplatformsearchchange.bind(this);

    this.searchBox = o('input.platform-search');

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '[data-platform-expand-button]', this.onplatformexpandclick);
    this.bind('keyup', 'input.platform-search', this.onplatformsearchchange);
  }

  onplatformexpandclick (e) {
    e.preventDefault();
    o('.platform').toggleClass('hide');
    o(e.delegateTarget).toggleClass('collapsed');
  }

  onplatformsearchchange (e) {
    e.preventDefault();
    platformFilter.setFilter({search: this.searchBox.val()});
  }
}
