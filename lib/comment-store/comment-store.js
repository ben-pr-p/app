import Store from '../store/store';
import request from '../request/request';
import config from '../config/config';
import forumStore from '../forum-store/forum-store';
import urlBuilder from '../url-builder/url-builder';

class CommentStore extends Store {
  name () {
    if (!this.type)
      return 'topic/comment';
    else
      return `${this.type}/comment`;
  }

  parse (comment) {
    if (config.multiForum && !comment.forum) {
      return Promise.reject(new Error(`C ${comment.id} needs a forum.`));
    }

    let findForum = config.multiForum ? forumStore.findOne(comment.forum) : Promise.resolve();
    return findForum.then(forum => {
      comment.url = urlBuilder.comment(comment, forum);
      return comment;
    });
  }

  setType (type) {
    this.type = type;
  }

}

export default new CommentStore;
