import arrayEquals from 'mout/array/equals';
import objectEquals from 'mout/object/equals';
import view from '../../view/mixin';
import { domRender } from '../../render/render';
import template from './template.jade';
import itemTemplate from './item.jade';

export default class PlatformList extends view('appendable', 'emptyable') {
  constructor (options = {}) {
    options.template = template;
    super(options);

    this.platforms = [];
    this.selected = null;
  }

  empty () {
    super.empty();
    this.platforms = [];
    return this;
  }

  reset (platforms = []) {
    let samePlatforms = arrayEquals(this.platforms, platforms, (a, b) => a.id === b.id);
    if (samePlatforms) {
      this.platforms = this.platforms.map((oldItem, i) => {
        let newItem = platforms[i];
        if (objectEquals(oldItem, newItem)) return oldItem;
        let oldEl = this.el.querySelector(`[data-id="${oldItem.id}"]`);
        let newEl = this.renderItem(newItem);
        this.el.replaceChild(newEl, oldEl);
        return newItem;
      });
    } else {
      this.empty();
      this.add(platforms);
    }
  }

  add (platforms) {
    if (!platforms) return;
    if (Array.isArray(platforms)) {
      if (!platforms.length) return;
      let fragment = document.createDocumentFragment();
      platforms.forEach(platform => {
        this.platforms.push(platform);
        fragment.appendChild(this.renderItem(platform));
      });
      this.el.appendChild(fragment);
    } else {
      this.platforms.push(platforms);
      requestAnimationFrame(() => {
        this.el.appendChild(this.renderItem(platforms));
      });
    }
  }

  renderItem (platform) {
    return domRender(itemTemplate, {
      platform: platform,
      active: this.selected === platform.id
    });
  }

  select (id = null) {
    if (id === this.selected) return;

    if (this.selected) {
      let selected = this.el.querySelector(`[data-id="${this.selected}"]`);
      if (selected) selected.classList.remove('active');
    }

    if (id) {
      let el = this.el.querySelector(`[data-id="${id}"]`);
      if (el) el.classList.add('active');
    }

    this.selected = id;
  }
}
