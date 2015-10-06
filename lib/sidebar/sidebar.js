import workspaceSidebar from './workspace-sidebar/sidebar';
import topicSidebar from './topic-sidebar/sidebar';

class Sidebar {
  constructor () {
    this.active = null;
    this.sidebars = {
      'workspace': workspaceSidebar,
      'topic': topicSidebar
    }

    var methods = 
      ['select', 'render', 'refresh', 'refreshList', 'refreshFilter', 'refreshTopicList', 
      'refreshTopicFilter', 'refreshPlatformList', 'refreshPlatformFilter'];

    function noop() {
      return null;
    }
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

const sidebar = new Sidebar();
export default sidebar;

var methods = {
  'topic': ['select', 'render', 'refresh', 'refreshList', 'refreshFilter'],
  'workspace': ['refresh', 'refreshPlatformSection', 'refreshTopicSection', 'refreshTopicList', 'refreshTopicFilter', 'refreshPlatformList', 'refreshPlatformFilter']
}
