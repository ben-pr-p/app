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
    if (config.multiForum && !platform.forum) {
      return Promise.reject(new Error(`Platform ${platform.id} needs a forum.`));
    }

    let findForum = config.multiForum ? forumStore.findOne(platform.forum) : Promise.resolve();
    return findForum.then(forum => {
      platform.url = urlBuilder.platform(platform, forum);
      return platform;
    });
  }

  opine (platformId, topicId, value) {
    if (!this.item.get(platformId)) {
      return Promise.reject(new Error('Cannot add opinion to not fetched item.'));
    }

    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(platformId)}/opine`)
        .send({platformId: platformId, topicId: topicId, value: value})
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(item => {
            this.set(platformId, item);
            resolve(item);
          });
        });
    });

    return promise;
  }
}

export default new platformStore;
