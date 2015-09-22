import bus from 'bus';
import page from 'page';
import { findPrivatePlatforms } from '../platform-middlewares/platform-middlewares';
import PlatformsListView from './view';
import forumRouter from '../forum-router/forum-router';

page(forumRouter('/admin/platforms'), findPrivatePlatforms, ctx => {
  let currentPath = ctx.path;
  let platformList = new PlatformsListView(ctx.platforms, ctx.forum);
  platformList.replace('.admin-content');
  ctx.sidebar.set('platforms');

  const onPlatformsUpdate = () => { page(currentPath); };
  bus.once('platform-store:update:all', onPlatformsUpdate);
  bus.once('page:change', () => {
    bus.off('platform-store:update:all', onPlatformsUpdate);
  });
});
