/**
 * Module dependencies.
 */

import debug from 'debug';
import page from 'page';
import t from 't-component';
import template from './template.jade';
import platformStore from '../platform-store/platform-store';
import List from 'democracyos-list.js';
import moment from 'moment';
import confirm from 'democracyos-confirmation';
import View from '../view/view';

const log = debug('democracyos:admin-platforms');

/**
 * Creates a list view of topics
 */

export default class PlatformsListView extends View {
  constructor(platforms, forum) {
    super(template, { platforms, moment, forum });
  }

  switchOn() {
    this.bind('click', '.btn.delete-platform', this.bound('ondeleteplatformclick'));
    this.list = new List('platforms-wrapper', { valueNames: ['platform-title', 'platform-id', 'platform-date'] });
  }

  ondeleteplatformclick(ev) {
    ev.preventDefault();
    const el = ev.target.parentElement.parentElement;
    const platformId = el.getAttribute('data-platformid');

    const _t = s => t(`admin-platforms-form.delete-platform.confirmation.${s}`);

    const onconfirmdelete = (ok) => {
      if (!ok) return;

      platformStore.destroy(platformId)
        .catch(err => { log('Found error %o', err); });
    };

    confirm(_t('title'), _t('body'))
      .cancel(_t('cancel'))
      .ok(_t('ok'))
      .modal()
      .closable()
      .effect('slide')
      .show(onconfirmdelete);
  }
}
