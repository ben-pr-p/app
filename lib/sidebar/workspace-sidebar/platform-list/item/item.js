import o from 'component-dom';
import closest from 'component-closest';
import bus from 'bus';
import dragDropDom from 'drag-drop-dom';

import view from '../../../../view/mixin';

import template from './template.jade';

export default class List extends view('appendable', 'withEvents') {
  constructor (options = {}, platform) {
    options.template = template;
    options.locals = {item: platform};
    super(options);

    o('[data-id="' + platform.id + '"]').find('.active-checkbox')[0].checked = platform.active;

    this.platform = platform;

    this.onActiveClick = this.onActiveClick.bind(this);

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '.active-checkbox', this.onActiveClick);

    var ddd = dragDropDom({
      drag: '.topic',
      drop: '.droppable',
      once: true
    });

    ddd.on('drop', function (node, target) {
      var platform = o(closest(target, '.platform-item'));
      var platformId = platform.attr('data-id');

      var topic = o(node).find('div.topic');
      var topicId = topic.attr('data-id');

      var value = null;
      var opinion = topic.find('.selected');
      if (opinion.length > 0) {
        if (opinion.hasClass('yes')) value = 'positive';
        if (opinion.hasClass('abstain')) value = 'neutral';
        if (opinion.hasClass('no')) value = 'negative';
      }

      bus.emit('item:add-opinion', platformId, topicId, value);
    });

    ddd.on('enter', function (node, target) {
      o(closest(target, '.platform-item')).addClass('targeted');
    });

    ddd.on('leave', function (node, target) {
      o(closest(target, '.platform-item')).removeClass('targeted');
    });
  }

  onActiveClick () {
    bus.emit('platform-filter:active');
  }

}
