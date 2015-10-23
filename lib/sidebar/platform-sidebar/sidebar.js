import bus from 'bus';
import o from 'component-dom';
import platformFilter from '../../platform-filter/platform-filter';
import view from '../../view/mixin';
import template from './template.jade';
import List from './list/list';
import FilterView from './filter/filter';

class Sidebar extends view('appendable') {
  constructor (options = {}) {
    options.template = template;
    super(options);

    this.refresh = this.refresh.bind(this);

    this.refresh();
  }

  switchOn () {
    bus.on('platform-filter:update', this.refresh);
  }

  switchOff () {
    bus.off('platform-filter:update', this.refresh);
  }

  refresh (items, filter) {
    this.refreshList(items);
    this.refreshFilter(filter);
  }

  refreshList (items) {
    if (!this.list) {
      this.list = new List({
        container: this.el.querySelector('[data-sidebar-list]')
      });
    }

    this.list.reset(items);
  }

  refreshFilter (filter) {
    if (filter) {
      if (!this.filterView) {
        this.filterView = new FilterView({
          container: this.el.querySelector('[data-sidebar-filter]'),
          filter: filter
        });
      }
    } else {
      platformFilter.setFilter({sort: 'alphabetical'});
    }
  }

  select (id) {
    this.list.select(id);
  }

  hide () {
    o('#platform-sidebar').addClass('hide');
  }

  show () {
    o('#platform-sidebar').removeClass('hide');
  }
}

export default Sidebar;
