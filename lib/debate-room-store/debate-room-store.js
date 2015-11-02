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

  ensureDebate (type, itemId) {
    let promise = new Promise((resolve, reject) => {
      this
      .findAll({type: type, id: itemId})
      .then(debate => {
        if (!debate) {
          this
          .createDebate(type, itemId)
          .then(debate => {
            resolve(debate);
          }).catch(err => {
            reject(err);
          });
        }

        if (debate) {
          this.set(debate.id, debate);
          resolve(debate);
        }

      }).catch(err => {
        reject(err);
      });

    });

    return promise;
  }

  createDebate (type, itemId) {
    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url('create')}`)
        .query({type: type, id: itemId})
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(debate => {
            this.set(debate.id, debate);
            resolve(debate);
          });
        });
    });

    return promise;
  }

  addArg (parentId, linkType, argData) {
    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url('argument/create')}`)
        .send({parentId: parentId, linkType: linkType, argData: argData})
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(arg => {
            this.set(arg.id, arg);
            resolve(arg);
          });
        });
    });

    return promise;
  }

  editArg (id, arg) {
    let promise = new Promise((resolve, reject) => {
      request
        .put(`${this.url('argument/' + id)}`)
        .send({comment: comment})
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

  getDebateType (id) {
    let promise = new Promise((resolve, reject) => {
      request
        .get(`${this.url('type/' + id)}`)
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(debateType => {
            this.set(debateType.id, debateType);
            resolve(debateType);
          });
        });
    });

    return promise;
  }
}

export default new DebateRoomStore;
