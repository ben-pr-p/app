import Store from '../store/store';
import request from '../request/request';
import config from '../config/config';
import forumStore from '../forum-store/forum-store';
import urlBuilder from '../url-builder/url-builder';

class DebateRoomStore extends Store {
  constructor() {
    super();
  }

  name () {
    return 'debateroom';
  }

  parse (argument) {
    return Promise.resolve(argument);
  }

}

export default new DebateRoomStore;
