import o from 'component-dom';
import bus from 'bus';
import debug from 'debug';
import page from 'page';
import config from '../config/config';
import urlBuilder from '../url-builder/url-builder';
import forumRouter from '../forum-router/forum-router.js';
import domRender from '../render/render';

import { findPlatforms, findPlatform } from '../platform-middlewares/platform-middlewares';
import { findForum } from '../forum-middlewares/forum-middlewares';
import platformFilter from '../platform-filter/platform-filter';

import title from '../title/title';
import sidebar from '../sidebar/sidebar';
import user from '../user/user';

import Article from '../platform-article/platform-article';
import Options from '../platform-options/platform-options';
import Comments from '../comments-view/view';
import locker from '../browser-lock/locker';

import noPlatforms from './no-platforms.jade';
import createFirstPlatform from './create-first-platform.jade';

const log = debug('democracyos:platform:page');

page(forumRouter('/platforms'), user.optional, findForum, findPlatforms, (ctx, next) => {  
  const body = o(document.body);
  debugger;
  let forum = ctx.forum;
  let platform = platformFilter.filter(ctx.platforms)[0];

  sidebar.setforum(ctx.forum);
  sidebar.show('platform');

  body.addClass('browser-page');

  if (!platform) {
    let content = o('#browser .app-content');
    content.empty().append(domRender(noPlatforms));
    if (user.isAdmin(forum)) content.append(domRender(createFirstPlatform, {
      url: urlBuilder.admin(forum) + '/platforms/create'
    }));
    bus.once('page:change', () => body.removeClass('browser-page'));
    bus.emit('page:render');
    return;
  }

  title(config.multiForum ? forum.title : null);

  if (config.multiForum) {
    ctx.path = `${forum.url}platform/${platform.id}`;
  } else {
    ctx.path = `/platform/${platform.id}`;
  }

  next();
});

page(forumRouter('/platform/:id'), user.optional, findForum, findPlatforms, findPlatform, (ctx, next) => {
  analytics.track('view platform', { platform: ctx.platform.id });
  bus.emit('page:render', ctx.platform.id);
  log(`rendering Platform ${ctx.params.id}`);

  if (!ctx.platform) {
    log('Platform %s not found', ctx.params.id);
    return next();
  }

  const appContent = o('section.app-content');

  sidebar.setforum(ctx.forum);
  sidebar.show('platform');
  sidebar.select(ctx.platform.id);

  // Clean page's content
  o('#content').empty();
  appContent.empty();

  // Build article's content container
  // and render to section.app-content
  let article = new Article({
    container: appContent[0],
    platform: ctx.platform
  });

  // Build article's meta
  // and render to section.app-content
  let options = new Options(ctx.platform, ctx.path);
  options.appendTo(appContent);

  // Build article's comments, feth them
  // and render to section.app-content
  let comments = new Comments('platform', ctx.platform, ctx.path);
  comments.appendTo(appContent);
  comments.initialize();

  o(document.body).addClass('browser-page');

  if (ctx.canonicalPath !== ctx.path) {
    title();
  } else {
    title(ctx.platform.mediaTitle);
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
    // if we still are in a browsing platforms page
    let onPlatforms = new RegExp(`^${urlBuilder.platform({id: ''}, ctx.forum)}`);
    if (onPlatforms.test(url)) return;
    o(document.body).removeClass('browser-page');
  }
});
