import bus from 'bus';
import equals from 'mout/object/equals';
import o from 'component-dom';
import dragula from 'dragula';
import template from './template.jade';
import view from '../../view/mixin';
import topicFilter from '../../topic-filter/topic-filter';
import platformFilter from '../../platform-filter/platform-filter';
import PlatformList from './platform-list/list';
import PlatformFilterView from './platform-filter/filter';
import TopicFilterView from './topic-filter/filter';
import TopicList from './topic-list/list';
import topicStore from '../../topic-store/topic-store.js';
import platformStore from '../../platform-store/platform-store.js';

class Sidebar extends view('appendable') {
  constructor (options = {}) {
    options.template = template;
    super(options);

    this.refresh = this.refresh.bind(this);

    this.refresh();
  }

  switchOn() {
    bus.on('platform-filter:update', this.refreshPlatformSection.bind(this));
    bus.on('topic-filter:update', this.refreshTopicSection.bind(this));
  }

  switchOff() {
    bus.off('platform-filter:update', this.refreshPlatformSection.bind(this));
    bus.off('topic-filter:update', this.refreshTopicSection.bind(this));
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
      if (!this.topicFilterView) {
        this.topicFilterView = new TopicFilterView({
          container: this.el.querySelector('[data-sidebar-topic-filter]'),
          filter: filter
        });
      }
    } else {
      topicFilter.setFilter({sort: 'alphabetical'});
    }
  }

  refreshPlatformList (platforms) {
    if (!this.platformList) {
      this.platformList = new PlatformList({
        container: this.el.querySelector('[data-sidebar-platform-list]')
      });
    }

    this.platformList.reset(platforms);
    this.setDragging();
  }

  refreshPlatformFilter (filter) {
    if (filter) {
      if (!this.platformFilterView) {
        this.platformFilterView = new PlatformFilterView({
          container: this.el.querySelector('[data-sidebar-platform-filter]'),
          filter: filter
        });
      }
    } else {
      platformFilter.setFilter({sort: 'alphabetical'});
    }
  }

  /**
 * [setDragging description]
 * @return {[type]} [description]
 */
  setDragging () {
    var topicContainer = document.querySelector('#sidebar-workspace-topic-list');
    var platformItems = document.querySelectorAll('.platform-item');
    var containers = [topicContainer].concat(Array.prototype.slice.call(platformItems));

    var drake = dragula(containers, {
      accepts: (el, target, source, sibling) => {
        var t = o(target);
        return (t.hasClass('platform-item'));
      },
      moves: (el, source, handle, sibling) => {
        return handle.className === 'drag-handle';
      },
      revertOnSpill: true,
      copy: true
    });

    // Make the platform item show when a topic item will be dropped on it
    // THIS IS BROKEN FOR SOME REASON
    drake.on('shadow', (el, container, source) => {
      var c = o(container);
      if (c.hasClass('platform-item')) {
        c.addClass('targeted');
      }
    });

    // Remove targeted class
    drake.on('out', (el, container, source) => {
      o('.platform-item').removeClass('targeted');
    });

    // Drop stuff
    drake.on('drop', (el, target, source, sibling) => {
      var t = o(target); var e = o(el);

      var platformId = t.attr('data-id');
      var topicId = e.attr('data-id');

      var value = null;
      var opinion = e.find('.selected');
      if (opinion.length > 0) {
        if (opinion.hasClass('yes')) value = 'positive';
        if (opinion.hasClass('abstain')) value = 'neutral';
        if (opinion.hasClass('no')) value = 'negative';
      }

      platformStore.findOne(platformId).then( cachedPlatform => {
        topicStore.findOne(topicId).then( cachedTopic => {
          if (value) platformStore.opine(platformId, topicId, value).then( item => {
              this.platformList.makeActive(platformId);
            }).catch(err => {
              alert(err);
            });
        });
      });
    });
  }

  hide () {
    o('#workspace-sidebar').addClass('hide');
  }

  show () {
    o('#workspace-sidebar').removeClass('hide');
  }
}

export default Sidebar;
