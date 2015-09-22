import bus from 'bus';
import equals from 'mout/object/equals';

import template from './template.jade';
import view from '../view/mixin';
import request from '../request/request';
import urlBuilder from '../url-builder/url-builder';

import PlatformList from './platform-list/list';
import PlatformFilterView from './platform-filter/filter';

import debug from 'debug';
const log = debug('democracyos:workspace-siderbar');

class Sidebar extends view('appendable') {
  constructor (options = {}) {
    options.template = template;
    super(options);

    this.refresh = this.refresh.bind(this);

    this.refresh();
    this.switchOn();
  }

  switchOn() {
    bus.on('platform-filter:update', this.refresh);
  }

  refresh (platforms) {
    this.refreshPlatformList(platforms);
    this.refreshPlatformFilter({});
  }

  refreshPlatformList (platforms) {
    if (!this.platformList) {
      this.platformList = new PlatformList({
        container: this.el.querySelector('[data-sidebar-platform-list]')
      });
    }

    this.platformList.reset(platforms);
  }

  refreshPlatformFilter (filter) {
    if (this.filterView) {
      if (equals(this.filterView.options.locals, filter)) return;
      this.filterView.remove();
    }
    if (filter) {
      this.filterView = new PlatformFilterView({
        container: this.el.querySelector('[data-sidebar-platform-filter]'),
        filter: filter
      });
    }
  }

}

const sidebar = new Sidebar({
  container: document.querySelector('aside.nav-proposal')
});

export default sidebar;

