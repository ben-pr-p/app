/**
 * Module dependencies.
 */

import bus from 'bus';
import page from 'page';
import o from 'component-dom';

import locker from '../browser-lock/locker';
import config from '../config/config.js';
import user from '../user/user.js';
import { dom as render } from '../render/render.js';
import title from '../title/title.js';
import topicStore from '../topic-store/topic-store.js';

import forumRouter from '../forum-router/forum-router';
import { findForum } from '../forum-middlewares/forum-middlewares';
import { findTopics } from '../topic-middlewares/topic-middlewares';
import { findAllTags } from '../tag-middlewares/tag-middlewares';
import { findPlatforms } from '../platform-middlewares/platform-middlewares';

import sidebar from '../workspace-sidebar/workspace-sidebar';
import Workspace from '../workspace-content/workspace-content';

page(forumRouter('/workspace'), findForum, findTopics, findPlatforms, user.required, user.hasAccessToForumAdmin, (ctx, next) => {
    const body = o(document.body);
    body.addClass('browser-page');

    // prepare wrapper and container
    const appContent = o('section.app-content');

    o('#content').empty();
    appContent.empty();

    o('#sidebar').addClass('hide');
    o('#workspace-sidebar').removeClass('hide');

    let workspace = new Workspace(ctx.platforms, ctx.forum);
    workspace.appendTo(appContent);

    locker.unlock();

    // Set page's title
    title();

    // if all good, then jump to section route handler
    next();
});