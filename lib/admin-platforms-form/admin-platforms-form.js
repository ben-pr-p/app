/**
 * Module dependencies.
 */

import bus from 'bus';
import page from 'page';
import PlatformForm from './view';
import reqeust from '../request/request.js';

import forumRouter from '../forum-router/forum-router';
import platformStore from '../platform-store/platform-store';
import { findPlatform } from '../platform-middlewares/platform-middlewares';
import { findAllTags } from '../tag-middlewares/tag-middlewares';


page(forumRouter('/admin/platforms/create'), ctx => {
  ctx.sidebar.set('platforms');
  // render new platform form
  let form = new PlatformForm(null, ctx.forum);
  form.replace('.admin-content');
  form.once('success', function() {
    platformStore.findAll();
  });
});

page(forumRouter('/admin/platforms/:id'), findPlatform, ctx => {
  // force section for edit
  // as part of list
  ctx.sidebar.set('platforms');

  // render platform form for edition
  let form = new PlatformForm(ctx.platform, ctx.forum);
  form.replace('.admin-content');
  form.on('success', function() {
    platformStore.findAll();
  });
});

