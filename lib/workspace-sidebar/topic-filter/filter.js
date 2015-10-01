import ToggleParent from 'democracyos-toggle-parent';
// import Dropdown from '../../dropdown/dropdown.js';
import view from '../../view/mixin';
import template from './template.jade';
import topicFilter from '../../topic-filter/topic-filter';
import o from 'component-dom';
import bus from 'bus';
import { dom } from '../../render/render.js';
import tagTemplate from './tag-item.jade';

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

    this.searchBox = o('input.search');

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '[data-tag-name]', this.onTagFilterClick);
    this.bind('click', '[data-expand-button]', this.onExpandClick);
    this.bind('keyup', 'input.search', this.onSearchChange);

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

    debugger;
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
      if (this.tags.filter(tag => {return (tag.hash == null)}).length == 0) this.tags.push({name: 'All tags', hash: null});
    }

    if (this.tags) {
      var list = o('.topic-tag-dropdown-list')
      list.empty();
      for (var i = this.tags.length - 1; i >= 0; i--) {
        var newTag = dom(tagTemplate, {
          tag: this.tags[i]
        });
        list.append(newTag);
      }
    }
  }
}
