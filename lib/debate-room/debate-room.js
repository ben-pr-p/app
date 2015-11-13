import o from 'component-dom';
import bus from 'bus';
import debug from 'debug';
import page from 'page';
import config from '../config/config';
import urlBuilder from '../url-builder/url-builder';
import forumRouter from '../forum-router/forum-router.js';
import domRender from '../render/render';

import { findPlatforms, findPlatform } from '../platform-middlewares/platform-middlewares';
import { findTopics, findTopic } from '../topic-middlewares/topic-middlewares';
import { findForum } from '../forum-middlewares/forum-middlewares';

import title from '../title/title';
import sidebar from '../sidebar/sidebar';
import debateRoomNav from '../debate-room-nav/view';
import user from '../user/user';

import locker from '../browser-lock/locker';

import DebateRoom from '../debate-room-view/view.js';

const log = debug('democracyos:debateroom');

page(forumRouter('/debateroom/topic/:id'), user.optional, findForum, findTopics, findTopic, (ctx, next) => {
  analytics.track('view topic', { topic: ctx.topic.id });
  bus.emit('page:render', ctx.topic.id);
  log(`rendering Topic ${ctx.params.id}`);

  if (!ctx.topic) {
    log('Topic %s not found', ctx.params.id);
    return next();
  }

  const appContent = o('section.app-content');

  sidebar.setforum(ctx.forum);
  sidebar.show('topic');
  sidebar.select(ctx.topic.id);

  debateRoomNav.setForum(ctx.forum);
  debateRoomNav.setItem(ctx.topic);
  debateRoomNav.setType('topic');
  debateRoomNav.select('debate');

  // Clean page's content
  o('#content').empty();
  appContent.empty();

  // Build article's content container
  // and render to section.app-content
  let dr = new DebateRoom({
    type: 'topic', 
    item: ctx.topic, 
    path: ctx.path,
    container: document.querySelector('section.app-content')
  });
  dr.initialize();

  o(document.body).addClass('browser-page');

  if (ctx.canonicalPath !== ctx.path) {
    title();
  } else {
    title(ctx.topic.mediaTitle);
  }

  log('render %s', ctx.params.id);

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

    // don't remove 'browser-page' body class
    // if we still are in a browsing topics page
    let onTopics = new RegExp(`^${urlBuilder.topic({id: ''}, ctx.forum)}`);
    if (onTopics.test(url)) return;
    o(document.body).removeClass('browser-page');
  }
});
