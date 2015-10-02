import bus from 'bus';
import equals from 'mout/object/equals';
import o from 'component-dom';
import dragDropDom from 'drag-drop-dom';

import template from './template.jade';
import view from '../view/mixin';
import request from '../request/request';
import urlBuilder from '../url-builder/url-builder';

import topicFilter from '../topic-filter/topic-filter';
import platformFilter from '../platform-filter/platform-filter';

import PlatformList from './platform-list/list';
import PlatformFilterView from './platform-filter/filter';

import TopicFilterView from './topic-filter/filter';
import TopicList from './topic-list/list';

import debug from 'debug';
const log = debug('democracyos:workspace-siderbar');
// TO DO: GET POLYFILL FOR USING FLEXBOX IN ALL BROWSERS

class Sidebar extends view('appendable') {
  constructor (options = {}) {
    options.template = template;
    super(options);

    this.refresh = this.refresh.bind(this);

    this.refresh();
    this.switchOn();
  }

  switchOn() {
    bus.on('platform-filter:update', this.refreshPlatformSection.bind(this));
    bus.on('topic-filter:update', this.refreshTopicSection.bind(this));
  }

  refresh (topics, topicFilterState, platforms, platformFilterState) {
    this.refreshTopicSection(topics, topicFilterState);
    this.refreshPlatformSection(platforms, platformFilterState);
  }

  refreshPlatformSection (platforms, platformFilterState) {
    this.refreshPlatformList(platforms);
    this.refreshPlatformFilter(platformFilterState);
  }

  refreshTopicSection (topics, topicFilterState) {
    this.refreshTopicList(topics);
    this.refreshTopicFilter(topicFilterState);
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
    if (filter) {
      filter['sort'] = 'alphabetical';
      if (!this.platformFilterView) {
        this.platformFilterView = new PlatformFilterView({
          container: this.el.querySelector('[data-sidebar-platform-filter]'),
          filter: filter
        });
      }
    } else {
      platformFilter.setFilter();
    }
  }

  refreshTopicList (topics) {
    if (!this.topicList) {
      this.topicList = new TopicList({
        container: this.el.querySelector('[data-sidebar-topic-list]')
      });
    }

    this.topicList.reset(topics);
  }

  refreshTopicFilter (filter) {
    if (filter) {
      filter['sort'] = 'alphabetical';
      if (!this.topicFilterView) {
        this.topicFilterView = new TopicFilterView({
          container: this.el.querySelector('[data-sidebar-topic-filter]'),
          filter: filter
        });
      }
    } else {
      topicFilter.setFilter();
    }
  }
}

const sidebar = new Sidebar({
  container: document.querySelector('aside.nav-proposal')
});

export default Sidebar;
