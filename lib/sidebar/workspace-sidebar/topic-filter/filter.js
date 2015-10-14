import ToggleParent from 'democracyos-toggle-parent';
import view from '../../../view/mixin';
import template from './template.jade';
import topicFilter from '../../../topic-filter/topic-filter';
import o from 'component-dom';
import bus from 'bus';
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

    this.onTagFilterClick = this.onTagFilterClick.bind(this);
    this.onExpandClick = this.onExpandClick.bind(this);
    this.recieveTags = this.recieveTags.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);

    this.searchBox = o('input.topic-search');

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '[data-tag-name]', this.onTagFilterClick);
    this.bind('click', '[data-expand-button]', this.onExpandClick);
    this.bind('keyup', 'input.topic-search', this.onSearchChange);

    bus.on('tag-store:update:all', this.recieveTags);

    var dropdownBtn = this.el.querySelector('[data-tag-filter-btn]');
    this.filterDropdown = new ToggleParent(dropdownBtn);
  }

  onTagFilterClick (e) {
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

  onExpandClick (e) {
    e.preventDefault();
    o('.topic').toggleClass('hide');
    o(e.delegateTarget).toggleClass('collapsed');
  }

  onSearchChange (e) {
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
