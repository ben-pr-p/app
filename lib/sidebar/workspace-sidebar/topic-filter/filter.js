import ToggleParent from 'democracyos-toggle-parent';
import o from 'component-dom';
import bus from 'bus';
import view from '../../../view/mixin';
import template from './template.jade';
import topicFilter from '../../../topic-filter/topic-filter';
import { dom } from '../../../render/render.js';
import tagTemplate from './tag-item.jade';

import t from 't-component';

export default class Filter extends view('appendable', 'removeable', 'withEvents') {
  constructor (options) {
    options.template = template;
    options.locals = options.filter;
    super(options);

    this.filter = this.options.filter;
    this.tags = null;

    this.ontagfilterclick = this.ontagfilterclick.bind(this);
    this.ontopicexpandclick = this.ontopicexpandclick.bind(this);
    this.recieveTags = this.recieveTags.bind(this);
    this.ontopicsearchchange = this.ontopicsearchchange.bind(this);

    this.searchBox = o('input.topic-search');

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '[data-tag-name]', this.ontagfilterclick);
    this.bind('click', '[data-topic-expand-button]', this.ontopicexpandclick);
    this.bind('keyup', 'input.topic-search', this.ontopicsearchchange);

    bus.on('tag-store:update:all', this.recieveTags);

    var dropdownBtn = this.el.querySelector('[data-tag-filter-btn]');
    this.filterDropdown = new ToggleParent(dropdownBtn);
  }

  ontagfilterclick (e) {
    e.preventDefault();
    let el = e.delegateTarget;

    let tag = {
      hash: el.getAttribute('data-tag-hash'),
      name: el.getAttribute('data-tag-name')
    };

    if (this.filter.tag) {
      if (this.filter.tag.hash === tag.hash) return;
    }

    this.filterDropdown.toggle();
    o('.current-tag').text(tag.name);

    topicFilter.setFilter({ tag: tag });
  }

  ontopicexpandclick (e) {
    e.preventDefault();
    o('.topic').toggleClass('hide');
    o(e.delegateTarget).toggleClass('collapsed');
  }

  ontopicsearchchange (e) {
    e.preventDefault();
    topicFilter.setFilter({search: this.searchBox.val()});
  }

  recieveTags (tags) {
    if (tags) {
      this.tags = tags;
    }

    if (this.tags) {
      var list = o('.topic-tag-dropdown-list')
      list.empty();

      this.tags.forEach(function (t) {
        var newTag = dom(tagTemplate, {
          tag: t
        });
        list.append(newTag);
      });

      var lastTag = dom(tagTemplate, {
        tag: {name: t('sidebar.all-tags'), hash: null}
      });
      list.append(lastTag);
    }
  }
}
