import dom from 'component-dom';
import page from 'page';
import { domRender } from '../render/render';


import view from '../view/mixin';
import template from './template.jade';
import WorkspaceSidebar from './workspace-sidebar/sidebar';
import TopicSidebar from './topic-sidebar/sidebar';
import ToggleParent from 'democracyos-toggle-parent';

var methods = {
  'topic': ['select', 'render', 'refresh', 'refreshList', 'refreshFilter'],
  'workspace': ['refresh', 'refreshPlatformSection', 'refreshTopicSection', 'refreshTopicList', 'refreshTopicFilter', 'refreshPlatformList', 'refreshPlatformFilter']
}

var urls = {
  'topic': { url: '/'},
  'workspace': {url: '/workspace'}
}

class Sidebar extends view('appendable', 'withEvents') {
  constructor (options = {}) {
    options.template = template;
    options.locals = {
      sidebars: Object.keys(methods),
      current: null
    };

    super(options);
    debugger;

    this.onSidebarClick = this.onSidebarClick.bind(this);

    this.active = null;

    var initialOptions = {
      container: document.querySelector('.sidebar-container')
    };

    this.sidebars = {
      'workspace': new WorkspaceSidebar(initialOptions),
      'topic': new TopicSidebar(initialOptions)
    };

    this.switchOn();
  }

  switchOn () {
    var dropdownBtn = this.el.querySelector('[data-sidebar-main-btn]');
    this.sidebarDropdown = new ToggleParent(dropdownBtn);

    this.bind('click', '[data-sarasa]', this.onSidebarClick);
    this.bind('click', '[data-sidebar-name]', this.onSidebarClick);
  }

  onSidebarClick (e) {
    debugger;
    e.preventDefault();
    let el = e.delegateTarget;
    var selection = el.getAttribute('data-sidebar');

    this.sidebarDropdown.toggle();
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
  }
}

const sidebar = new Sidebar({
  container: document.querySelector('aside.nav-proposal')
});

export default sidebar;
