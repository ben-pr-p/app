import dom from 'component-dom';
import page from 'page';
import ToggleParent from 'democracyos-toggle-parent';
import t from 't-component';

import config from '../config/config.js';
import view from '../view/mixin';
import template from './template.jade';
import WorkspaceSidebar from './workspace-sidebar/sidebar';
import TopicSidebar from './topic-sidebar/sidebar';
import PlatformSidebar from './platform-sidebar/sidebar';

var methods = {
  'topic': ['select', 'render', 'refresh', 'refreshList', 'refreshFilter'],
  'platform': ['select', 'render', 'refresh', 'refreshList', 'refreshFilter'],
  'workspace': ['refresh', 'refreshPlatformSection', 'refreshTopicSection', 'refreshTopicList', 'refreshTopicFilter', 'refreshPlatformList', 'refreshPlatformFilter']
};

var urls = {
  'topic': '/',
  'workspace': '/workspace',
  'platform': '/platforms'
};

class Sidebar extends view('appendable', 'withEvents') {
  constructor (options = {}) {
    options.template = template;
    options.locals = {
      sidebars: Object.keys(methods),
      current: null
    };

    super(options);

    this.onSidebarClick = this.onSidebarClick.bind(this);

    this.active = null;

    var initialOptions = {
      container: document.querySelector('.sidebar-container')
    };

    this.sidebars = {
      'workspace': new WorkspaceSidebar(initialOptions),
      'topic': new TopicSidebar(initialOptions),
      'platform': new PlatformSidebar(initialOptions)
    };

  }

  switchOn () {
    var dropdownBtn = document.querySelector('[data-sidebar-main-btn]');
    this.sidebarDropdown = new ToggleParent(dropdownBtn);

    this.bind('click', '[data-sidebar-name]', this.onSidebarClick);
  }

  onSidebarClick (e) {
    e.preventDefault();
    let el = e.delegateTarget;
    var selection = el.getAttribute('data-sidebar-name');

    this.sidebarDropdown.hide();
    dom('.current-sidebar').text(selection);

    page(urls[selection]);
  }

  show (sidebar = 'topic') {
    for (var s in this.sidebars) {
      if (this.sidebars.hasOwnProperty(s)) {
        this.sidebars[s].hide();
      }
    }

    this.sidebars[sidebar].show();
    this.active = this.sidebars[sidebar];

    methods[sidebar].forEach( m => {
      this[m] = this.active[m].bind(this.active);
    });
    dom('.current-sidebar').text(sidebar);
  }
}

var sidebar = null;

if (config.platforms) {
  sidebar = new Sidebar({
    container: document.querySelector('aside.nav-proposal')
  });
} else {
  sidebar = new TopicSidebar({
    container: document.querySelector('aside.nav-proposal')
  });
}

export default sidebar;

