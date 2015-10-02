import bus from 'bus';
import clone from 'mout/lang/clone';

import Storage from '../storage/storage';

const storage = new Storage;

class Platform {
  constructor () {
    this.set = this.set.bind(this);

    this.items = [];
    this.filteredItems = [];

    this._filter = {
      search: storage.get('topic-store-search') || null
    };

    bus.on('platform-store:update:all', this.set);
  }

  clear (trigger = true) {
    this.items = [];
    this.filteredItems = [];

    if (trigger) {
      bus.emit('platform-filter:update', this.filteredItems, this.getFilter());
    }
  }

  set (items) {
    this.clear(false);
    this.items = items;
    this.filteredItems = this.filter(this.items);
    let filteredItems = this.get();
    bus.emit('platform-filter:update', filteredItems, this.getFilter());
    return filteredItems;
  }

  get (index) {
    if ('number' === typeof index) return this.filteredItems[index];
    return this.filteredItems.splice(0);
  }

  filter (items) {
    return items.filter(item => {
      // hide items that don't match the search keyword
      if (this._filter.search) {
        if (this._filter.search != '') {
          if (item.mediaTitle.toLowerCase().indexOf(this._filter.search.toLowerCase()) < 0) {
            return false;
          }
        }
      }
      // Don't filter for now
      return true;
    });
  }

  setFilter (filter = {}) {
    Object.keys(filter).forEach(key => {
      if (undefined === this._filter[key]) return;
      let value = filter[key];
      if (this._filter[key] !== value) {
        setTimeout(() => {
          storage.set(`platform-store-${key}`, filter[key]);
        }, 0);
        this._filter[key] = filter[key];
      }
    });
    this.set(this.items);
    return this;
  }

  getFilter () {
    return {
      filter: clone(this._filter)
    };
  }
}

export default new Platform;
