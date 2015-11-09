import Store from '../store/store';
import request from '../request/request';
import config from '../config/config';
import forumStore from '../forum-store/forum-store';
import urlBuilder from '../url-builder/url-builder';

class EdgeStore extends Store {
  constructor() {
    super();
  }

  name () {
    return 'edge';
  }

  create (edge) {
    let promise = new Promise((resolve, reject) => {
      request
        .post(this.url('create'))
        .send(edge)
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          return resolve(res.body);
        });
    });

    return promise;
  }
}

export default new EdgeStore;
