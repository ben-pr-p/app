import Store from '../store/store';
import request from '../request/request';
import config from '../config/config';
import forumStore from '../forum-store/forum-store';
import urlBuilder from '../url-builder/url-builder';

const voteOptions = ['negative', 'positive', 'neutral'];

class platformStore extends Store {
  name () {
    return 'platform';
  }

  parse (platform) {
    if (config.multiForum && !topic.forum) {
      return Promise.reject(new Error(`Platform ${platform.id} needs a forum.`));
    }

    let findForum = config.multiForum ? forumStore.findOne(topic.forum) : Promise.resolve();
    return findForum.then(forum => {
      platform.url = urlBuilder.platform(platform, forum);
      return platform;
    });
  }
}

export default new platformStore;
