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

  vote (id) {
    if (!this.item.get(id)) {
      return Promise.reject(new Error('Cannot vote not fetched item.'));
    }

    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(id)}/vote`)
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(item => {
            this.set(id, item);
            resolve(item);
          });
        });
    });

    return promise;
  }

  opine (platformId, topicId, value) {
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

  remove (platformId, topicId) {
    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(platformId)}/remove`)
        .send({platformId: platformId, topicId: topicId})
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(item => {
            this.set(platformId, item);
            resolve(item);
          });
        });
    });
  }
}

export default new platformStore;
