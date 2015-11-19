import o from 'component-dom';
import bus from 'bus';
import platformStore from '../platform-store/platform-store';
import urlBuilder from '../url-builder/url-builder';
import template from './template.jade';
import View from '../view/view.js';
import PlatformVenn from './venn-diagram/venn-diagram.js';
import PlatformTree from './tree/tree.js';

export default class WorkspaceInterface extends View {
  constructor(platforms, topics, forum) {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });

    this.refresh = this.refresh.bind(this);
    this.initialize = this.initialize.bind(this);
    this.onwindowresize = this.onwindowresize.bind(this);

    this.options = {
      platforms: platforms,
      topics: topics,
      forum: forum,
      container: '#diagram-container'
    };

    this.diagram = null;
  }

  switchOn() { 
    this.diagram = new PlatformTree(this.options);

    window.onresize = this.diagram.onwindowresize;

    bus.on('platform-filter:active', this.refresh);
    bus.on('platform-store:update:all', this.refresh);

    this.initialize();
  }

  initialize () {
    this.diagram.initialize();
  }

  onwindowresize () {
    this.diagram.onwindowresize();
  }

  refresh (platforms = null) {
    this.diagram.refresh();
  }
}
