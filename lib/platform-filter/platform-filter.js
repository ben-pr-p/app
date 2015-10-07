import bus from 'bus';
import o from 'component-dom';
import clone from 'mout/lang/clone';
import sorts from './sorts';

import Storage from '../storage/storage';

const storage = new Storage;

class Platform {
  constructor () {
    this.set = this.set.bind(this);
    this.refresh = this.refresh.bind(this);

    this.sorts = sorts;
    this.items = [];
    this.filteredItems = [];

    this._filter = {
      search: storage.get('topic-store-search') || null,
      sort: storage.get('topic-store-sort') || 'alphabetical'
    };

    bus.on('platform-store:update:all', this.set);
    bus.on('platform-filter:active', this.refresh);
  }

  clear (trigger = true) {
    this.items = [];
    this.filteredItems = [];

    if (trigger) {
      bus.emit('platform-filter:update', this.filteredItems, this.getFilter());
    }
  }

  refresh () {
    this.set(this.items);
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
    // find active platforms
    var actives = [];

    items.forEach( i => {
      var div = o('[data-id="' + i.id + '"]');
      if ((div.length != 0) && (div.find('.active-checkbox').val())) {
        i.active = true;
        actives.push(i);
      } else {
        i.active = false;
      }
    });

    // don't filter them (take them out of items to be filtered)
    items = items.filter( i => {
      return actives.indexOf(i) < 0;
    });

    // filter them
    items = items.filter(item => {
      // hide items that don't match the search keyword
      if (this._filter.search) {
        if (this._filter.search != '') {
          if (item.mediaTitle.toLowerCase().indexOf(this._filter.search.toLowerCase()) < 0) {
            return false;
          }
        }
      }
      // search is only filter for now
      return true;
    });

    // sort actives
    actives = actives.sort(this.getCurrentSort().sort);

    // sort items
    items = items.sort(this.getCurrentSort().sort);

    // conjoin and return
    return actives.concat(items);
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
      filter: clone(this._filter),
      sorts: this.sorts,
      search: this._filter.search,
      currentSort: this.getCurrentSort()
    };
  }

  getCurrentSort () {
    return this.sorts[this._filter.sort];
  }
}

export default new Platform;
