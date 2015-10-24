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
import forumRouter from '../forum-router/forum-router';
import { findForum } from '../forum-middlewares/forum-middlewares';
import { findTopics } from '../topic-middlewares/topic-middlewares';
import { findAllTags } from '../tag-middlewares/tag-middlewares';
import { findPlatforms } from '../platform-middlewares/platform-middlewares';
import sidebar from '../sidebar/sidebar';
import WorkspaceInterface from '../workspace-interface/workspace-interface';

page(forumRouter('/workspace'), findAllTags, findForum, findTopics, findPlatforms, user.optional, (ctx, next) => {
  const body = o(document.body);
  body.addClass('browser-page');
  bus.emit('page:render');

  // prepare wrapper and container
  const appContent = o('section.app-content');

  o('#content').empty();
  appContent.empty();

  sidebar.setforum(ctx.forum);
  sidebar.show('workspace');
  bus.emit('tag-store:update:all', ctx.tags); // to give sidebar the tags

  let workspace = new WorkspaceInterface(ctx.platforms, ctx.forum);
  workspace.appendTo(appContent);

  locker.unlock();

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

