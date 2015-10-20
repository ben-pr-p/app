import d3 from 'd3';
import page from 'page';
import bus from 'bus';
import dom from 'component-dom';
import closest from 'component-closest';

import platformStore from '../../platform-store/platform-store.js';
import render from '../../render/render.js';
import view from '../../view/mixin';
import template from './template.jade';
import optionTemplate from './option.jade';

class Tooltip extends view('appendable', 'emptyable', 'withEvents') {
  constructor (options = {}) {
    options.locals = {
      opinions: options.opinions,
      singleSet: options.singleSet,
      platformTree: options.platformTree
    };

    options.template = template;
    super(options);

    if (options.platformTree) this.renderPlatformTree(options.platformTree);

    this.onTopicClick = this.onTopicClick.bind(this);
    this.onTopicDelete = this.onTopicDelete.bind(this);

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '.topic-link', this.onTopicClick);
    this.bind('click', '.remove-opinion', this.onTopicDelete);
  }

  onTopicClick (e) {
    var link = dom(closest(e.target, '[data-url]')).attr('data-url');
    this.empty(); // must manually hide tooltip or else it stays when page(link) is called
    page(link);
  }

  onTopicDelete (e) {
    var div = dom(closest(e.target, '[data-url]'));
    div.addClass('hide');

    var platformId = dom(this.options.container).attr('sets');

    var topicId = div.attr('data-url').split('/')[2];
    bus.emit('item:remove-opinion', platformId, topicId);
  }

  renderPlatformTree (platformTree) {
    var container = dom('.platform-tree-container');
    platformTree.forEach(opt => {
      if (~['–', '+', '(', ')', '∩'].indexOf(opt)) {
        container.append(render(optionTemplate, {
          opt: {mediaTitle: opt}
        }));
      }
      else if (opt) {
        platformStore.findOne(opt).then( opt => {
          container.append(render(optionTemplate, {
            opt: opt
          }));
        });
      }
    });
  }
}

export default Tooltip;
