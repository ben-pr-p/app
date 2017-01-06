import o from 'component-dom';
import closest from 'component-closest';
import bus from 'bus';
import urlBuilder from '../url-builder/url-builder';
import template from './template.jade';
import View from '../view/view.js';
// import PlatformVenn from './venn-diagram/venn-diagram.js';
import PlatformTree from './tree/tree.js';

export default class WorkspaceInterface extends View {
  constructor(platforms, topics, forum) {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });

    this.refresh = this.refresh.bind(this);
    this.initialize = this.initialize.bind(this);
    this.onwindowresize = this.onwindowresize.bind(this);
    this.oninterfaceclick = this.oninterfaceclick.bind(this);
    this.select = this.select.bind(this);

    function makeOptions (container) {
      return {
        platforms: platforms,
        topics: topics,
        forum: forum,
        container: container
      };
    }

    this.diagrams = {
      tree:  new PlatformTree(makeOptions('#tree-container'))
      // venn: new PlatformVenn(makeOptions('#venn-container'))
    };

    this.diagram = null;
  }

  switchOn() {
    this.select();

    window.onresize = this.onwindowresize;

    bus.on('platform-filter:active:done', this.refresh);
    bus.on('platform-store:update:all', this.refresh);

    o('.workspace-nav .nav-button').on('click', this.oninterfaceclick);

    this.initialize();
  }

  initialize () {
    for (var n in this.diagrams) {
      this.diagrams[n].initialize();
    }
  }

  onwindowresize () {
    this.diagram.onwindowresize();
  }

  refresh (platforms = null) {
    this.diagram.refresh(platforms);
  }

  select (name = 'tree') {
    for (var n in this.diagrams) {
      this.diagrams[n].container.addClass('hide');
    }

    o('.workspace-nav .nav-button').removeClass('active');
    o(`.${name}-button`).addClass('active');
    this.diagram = this.diagrams[name];
    this.diagram.container.removeClass('hide');
  }

  oninterfaceclick (ev) {
    var div = closest(ev.target, '.nav-button', true);
    this.select(div.classList[1].split('-')[0]);
  }
}
