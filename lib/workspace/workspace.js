/**
 * Module dependencies.
 */

import bus from 'bus';
import config from '../config/config.js';
import user from '../user/user.js';
import { dom as render } from '../render/render.js';
import title from '../title/title.js';
import topicStore from '../topic-store/topic-store.js';
import page from 'page';
import o from 'component-dom';
import forumRouter from '../forum-router/forum-router';
import { findForum } from '../forum-middlewares/forum-middlewares';
import { findTopics } from '../topic-middlewares/topic-middlewares';
import { findAllTags } from '../tag-middlewares/tag-middlewares';

import { findPlatforms } from '../platform-middlewares/platform-middlewares';
import template from './workspace-container.jade';
import Sidebar from '../workspace-sidebar/workspace-sidebar';
import Workspace from '../workspace-content/workspace-content';

page(forumRouter('/workspace'),
  findForum,
  findTopics,
  findPlatforms,
  user.required,
  user.hasAccessToForumAdmin,
  (ctx, next) => {
    let section = ctx.params.section;
    let container = render(template);

    // prepare wrapper and container
    o('#content').empty().append(container);

    // set active section on sidebar
    ctx.sidebar = new Sidebar(ctx.forum);
    ctx.sidebar.appendTo(o('.sidebar-container', container)[0]);

    ctx.workspace = new Workspace(ctx.forum);
    ctx.workspace.appendTo(o('.workspace-content', container)[0]);

    // Set page's title
    title();

    // if all good, then jump to section route handler
    next();
  }
);