import arrayEquals from 'mout/array/equals';
import bus from 'bus';
import objectEquals from 'mout/object/equals';
import o from 'component-dom';

import view from '../../../view/mixin';
import { domRender } from '../../../render/render';

import template from './template.jade';
import ItemView from './item/item';

export default class List extends view('appendable', 'emptyable') {
  constructor (options = {}) {
    options.template = template;
    super(options);

    this.items = [];
    this.selected = null;

  }

  empty () {
    super.empty();
    this.items = [];
    return this;
  }

  reset (items = []) {
    let sameItems = arrayEquals(this.items, items, (a, b) => a.id === b.id);
    if (sameItems) {
      this.items = this.items.map((oldItem, i) => {
        let newItem = items[i];
        if (objectEquals(oldItem, newItem)) return oldItem;
        let oldEl = this.el.querySelector(`[data-id="${oldItem.id}"]`);
        this.renderItem(newItem);
        this.el.removeChild(oldEl);
        return newItem;
      });
    } else {
      this.empty();
      this.add(items);
    }
  }

  add (items) {
    if (!items) return;
    if (Array.isArray(items)) {
      if (!items.length) return;
      let fragment = document.createDocumentFragment();
      items.forEach(item => {
        this.items.push(item);
        this.renderItem(item);
      });
      this.el.appendChild(fragment);
    } else {
      this.items.push(items);
      requestAnimationFrame(() => {
        this.renderItem(items);
      });
    }
  }

  renderItem (item) {
    return new ItemView({
      container: document.querySelector('#sidebar-workspace-platform-list')
    }, item);
  }

  makeActive (id = null) {
    if (id) {
      let el = o(`[data-id="${id}"]`);
      let checkbox = el.find('input');
      checkbox.val(true);
      bus.emit('platform-filter:active');
    }

  }
}
