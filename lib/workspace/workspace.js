/**
 * Module dependencies.
 */

import bus from 'bus';
import page from 'page';
import o from 'component-dom';
import closest from 'component-closest';

import locker from '../browser-lock/locker';
import config from '../config/config.js';
import user from '../user/user.js';
import { dom as render } from '../render/render.js';
import title from '../title/title.js';
import topicStore from '../topic-store/topic-store.js';
import platformStore from '../platform-store/platform-store.js';

import forumRouter from '../forum-router/forum-router';
import { findForum } from '../forum-middlewares/forum-middlewares';
import { findTopics } from '../topic-middlewares/topic-middlewares';
import { findAllTags } from '../tag-middlewares/tag-middlewares';
import { findPlatforms } from '../platform-middlewares/platform-middlewares';

import sidebar from '../sidebar/sidebar';
import Workspace from '../workspace-content/workspace-content';

page(forumRouter('/workspace'), findAllTags, findForum, findTopics, findPlatforms, user.optional, (ctx, next) => {
  const body = o(document.body);
  body.addClass('browser-page');
  bus.emit('page:render');

  // prepare wrapper and container
  const appContent = o('section.app-content');

  o('#content').empty();
  appContent.empty();

  sidebar.show('workspace');
  bus.emit('tag-store:update:all', ctx.tags); // to give sidebar the tags

  let workspace = new Workspace(ctx.platforms, ctx.forum);
  workspace.appendTo(appContent);

  locker.unlock();

  // where else should i define this?
  bus.on('item:add-opinion', (platformId, topicId, value) => {
    platformStore.findOne(platformId).then( cachedPlatform => {
      topicStore.findOne(topicId).then( cachedTopic => {
        if (value) platformStore
          .opine(platformId, topicId, value)
          .then( item => {

            sidebar.active.platformList.makeActive(platformId);
          });
      });
    });
  });

  // this too?
  bus.on('item:remove-opinion', (platformId, topicId) => {
    platformStore.findOne(platformId).then( cachedPlatform => {
      topicStore.findOne(topicId).then( cachedTopic => {
        platformStore.remove(platformId, topicId);
      })
    });
  });

  // Set page's title
  title();

  bus.once('page:change', pagechange);
  function pagechange(url) {
    // restore page's original title
    title();

    // lock article's section
    locker.lock();

    // hide it from user
    appContent.addClass('hide');

    // once render, unlock and show
    bus.once('page:render', function() {
      locker.unlock();
      appContent.removeClass('hide');
    });

    // check if loading to same page
    // and if not, scroll to top
    if (url !== ctx.path) o('section#browser').scrollTop = 0;

    o(document.body).removeClass('browser-page');
  }

  // if all good, then jump to section route handler
  next();
});

