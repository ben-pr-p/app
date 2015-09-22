import bus from 'bus';
import clone from 'mout/lang/clone';

import Storage from '../storage/storage';

const storage = new Storage;

class Platform {
  constructor () {
    this.set = this.set.bind(this);

    this.platforms = [];

    bus.on('platform-store:update:all', this.set);
  }

  clear (trigger = true) {
    this.platforms = [];
    this.filteredPlatforms = [];

    if (trigger) {
      bus.emit('platform-filter:update', this.filteredPlatforms);
    }
  }

  set (platforms) {
    this.clear(false);
    this.platforms = platforms;
    this.filteredPlatforms = this.filter(this.platforms);
    let filteredPlatforms = this.get();
    bus.emit('platform-filter:update', filteredPlatforms);
    return filteredPlatforms;
  }

  get (index) {
    if ('number' === typeof index) return this.filteredPlatforms[index];
    return this.filteredPlatforms.splice(0);
  }

  filter (platforms) {
    return platforms.filter(item => {
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
          storage.set(`topic-store-${key}`, filter[key]);
        }, 0);
        this._filter[key] = filter[key];
      }
    });
    return this;
  }

  getFilter () {
    return {
      filter: clone(this._filter)
    };
  }
}

export default new Platform;
