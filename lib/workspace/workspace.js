/**
 * Module dependencies.
 */

import bus from 'bus';
import page from 'page';
import o from 'component-dom';
import closest from 'component-closest';
import dragula from 'dragula';

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

  var topicContainer = document.querySelector('#sidebar-workspace-topic-list');
  var platformItems = document.querySelectorAll('.platform-item');
  var containers = [topicContainer].concat(Array.prototype.slice.call(platformItems));

  var drake = dragula(containers, {
    accepts: (el, target, source, sibling) => {
      var t = o(target);
      return (t.hasClass('platform-item'));
    },
    moves: (el, source, handle, sibling) => {
      return handle.className === 'drag-handle';
    },
    revertOnSpill: true,
    copy: true
  });

  /**
   * Workspace sidebar dragging behavior
   */

  // Make the platform item hover when a topic item will be dropped on it
  drake.on('shadow', (el, container, source) => {
    var c = o(container);
    if (c.hasClass('platform-item')) {
      c.addClass('targeted');
    }
  });

  // Remove targeted class
  drake.on('out', (el, container, source) => {
    o('.platform-item').removeClass('targeted');
  });

  // Drop stuff
  drake.on('drop', (el, target, source, sibling) => {
    var t = o(target); var e = o(el);

    var platformId = t.attr('data-id');
    var topicId = e.attr('data-id');

    var value = null;
    var opinion = e.find('.selected');
    if (opinion.length > 0) {
      if (opinion.hasClass('yes')) value = 'positive';
      if (opinion.hasClass('abstain')) value = 'neutral';
      if (opinion.hasClass('no')) value = 'negative';
    }

    bus.emit('item:add-opinion', platformId, topicId, value);
  });

  /**
   * Handle bus emit's from workspace-interface
   */

  // Handle add opinion
  bus.on('item:add-opinion', (platformId, topicId, value) => {
    platformStore.findOne(platformId).then( cachedPlatform => {
      topicStore.findOne(topicId).then( cachedTopic => {
        if (value) platformStore.opine(platformId, topicId, value).then( item => {
            sidebar.active.platformList.makeActive(platformId);
          }).catch(err => {
            alert(err);
          });
      });
    });
  });

  // Handle remove opinion
  bus.on('item:remove-opinion', (platformId, topicId) => {
    platformStore.findOne(platformId).then( cachedPlatform => {
      topicStore.findOne(topicId).then( cachedTopic => {
        platformStore.remove(platformId, topicId).then( item => {
            sidebar.active.platformList.makeActive(platformId);
          }).catch(err => {
            alert(err);  
          });
      });
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

