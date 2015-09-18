import template from './sidebar-template.jade';
import View from '../view/view';
import request from '../request/request';
import urlBuilder from '../url-builder/url-builder';

import debug from 'debug';
const log = debug('democracyos:workspace-siderbar')

export default class Sidebar extends View {
  constructor(forum) {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });

    this.onNewPlatformClick = this.onNewPlatformClick.bind(this);

    this.switchOn();
  }

  switchOn() {
    this.bind('click', '[data-new-platform]', this.onNewPlatformClick);
  }

  onNewPlatformClick (e) {
    log(e);
    log('Creating new platform');
    request
    .post('/api/platform/create')
    .end(function (err, res) {
      if (err || !res.ok) {
        log('Failed to create platform: error %s', err);
      }

      log('Successfully created platform %j', res.body)
    })
  }

}
