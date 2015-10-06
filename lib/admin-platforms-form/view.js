/**
 * Module dependencies.
 */

import linkTemplate from './link.jade';
import closest from 'component-closest';
import confirm from 'democracyos-confirmation';
import Datepicker from 'democracyos-datepicker';
import FormView from '../form-view/form-view.js';
import debug from 'debug';
import o from 'component-dom';
import page from 'page';
import { dom as render } from '../render/render.js';
import request from '../request/request.js';
import t from 't-component';
import template from './template.jade';
import moment from 'moment';
import Richtext from '../richtext/richtext.js';
import Toggle from 'democracyos-toggle';
import * as serializer from '../proposal/body-serializer';
import platformStore from '../platform-store/platform-store';

const log = debug('democracyos:admin-platforms-form');

/**
 * Expose PlatformForm
 */

module.exports = PlatformForm;

/**
 * Creates a platform edit view
 */
let created = false;

export default class PlatformForm extends FormView {

  constructor(platform, forum, tags) {
    super();
    this.setLocals(platform, forum, tags);
    super(template, this.locals);

    if (tags.length == 0) return;

    if (created) {
      this.messages([t('admin-platforms-form.message.onsuccess')]);
      created = false;
    }

    this.pubButton = this.find('a.make-public');
    this.privButton = this.find('a.make-private');

    var body = this.find('textarea[name=body]');
    new Richtext(body);
    this.renderToggles();
  }

  /**
   * Set locals for template
   */

  setLocals(platform, forum, tags) {
    if (platform) {
      this.action = '/api/platform/' + platform.id;
      this.title = 'admin-platforms-form.title.edit';
    } else {
      this.action = '/api/platform/create';
      this.title = 'admin-platforms-form.title.create';
    }

    this.platform = platform;
    this.tags = tags;
    this.forum = forum;
    this.forumAdminUrl = ':forum/admin'.replace(':forum', forum ? `/${forum.name}` : '');

    this.locals = {
      form: { title: this.title, action: this.action },
      platform: this.platform || {},
      tags: this.tags,
      moment: moment,
      forum
    };
  }

  /**
   * Turn on event bindings
   */

  switchOn() {
    this.bind('click', 'a.add-link', this.bound('onaddlinkclick'));
    this.bind('click', 'a.remove-link', this.bound('onremovelinkclick'));
    this.bind('click', 'a.save', this.bound('onsaveclick'));
    this.bind('click', 'a.make-public', this.bound('onmakepublicclick'));
    this.bind('click', 'a.make-private', this.bound('onmakeprivateclick'));
    this.bind('click', 'a.delete-platform', this.bound('ondeleteplatformclick'));
    this.on('success', this.onsuccess);
  }

  /**
   * Handle `error` event with
   * logging and display
   *
   * @param {String} error
   * @api private
   */

  onsuccess(res) {
    log('Platform successfully saved');
    if (this.platform) {
      platformStore.unset(this.platform.id).parse(res.body).then(platform => {
        platformStore.set(platform.id, platform);
      });
    }

    created = true;
    var content = o('#content')[0];
    content.scrollTop = 0;
    // Forcefully re-render the form
    page(this.forumAdminUrl + '/platforms/' + res.body.id);
  }


  onaddlinkclick(ev) {
    ev.preventDefault();

    var id = this.platform ? this.platform.id : null;
    if (id != null) return this.addLink();

    // if no platform, reveal message forbidden
    o('.add-link-forbidden', this.el).removeClass('hide');
  }

  addLink() {
    var links = o('.platform-links', this.el);

    request
    .post(this.action + '/link')
    .end(function (err, res) {
      if (err || !res.ok) return log('Found error %o', err || res.error);
      var link = render(linkTemplate, {
        link: res.body
      });
      links.append(o(link));
    });
  }

  onremovelinkclick(ev) {
    ev.preventDefault();

    var link = closest(ev.target, '[data-link]', true);
    var id = link ? link.getAttribute('data-link') : null;
    if (null == id) return false;

    confirm(t('admin-platforms-form.link.confirmation.title'), t('admin-platforms-form.delete-platform.confirmation.body'))
    .cancel(t('admin-platforms-form.clause.confirmation.cancel'))
    .ok(t('admin-platforms-form.clause.confirmation.ok'))
    .modal()
    .closable()
    .effect('slide')
    .show(onconfirm.bind(this));

    function onconfirm(ok) {
      if (ok) return this.removeLink(id);
    }
  }

  onsaveclick(ev) {
    ev.preventDefault();
    this.find('form input[type=submit]')[0].click();
  }

  removeLink(id) {
    var link = o('[data-link="' + id + '"]', this.el);

    request
    .del(this.action + '/link')
    .send({ link: id })
    .end(function (err, res) {
      if (err || !res.ok) return log('Found error %o', err || res.error);
      link[0].remove();
    });
  }

  postserialize(data) {
    data = data || {};

    var links = {};
    var linksregexp = /^links\[([a-z0-9]*)\]\[([^\]]*)\]/;

    for (var key in data) {
      var isLink = linksregexp.test(key)
        && data.hasOwnProperty(key);

      if (isLink) {
        var parsed = linksregexp.exec(key);
        var id = parsed[1];
        var prop = parsed[2];
        var value = data[key];
        links[id] = links[id] || {};
        links[id][prop] = value;
        delete data[key];
      }
    }

    var linksids = Object.keys(links);
    var linksret = [];

    linksids.forEach(function(id) {
      links[id].id = id;
      linksret.push(links[id]);
    });

    data.links = linksret;

    data.global = data.global || false;
    data.author = data.platformAuthor;

    return data;
  }

  ondeleteplatformclick(ev) {
    ev.preventDefault();

    const _t = s => t(`admin-platforms-form.delete-platform.confirmation.${s}`);

    const onconfirmdelete = (ok) => {
      if (!ok) return;

      platformStore.destroy(this.platform.id)
        .then(() => { page(this.forumAdminUrl); })
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

  renderToggles() {
    var toggle = new Toggle();
    toggle.label('Yes', 'No');
    toggle.name('global');
    toggle.value(this.platform == undefined || this.platform.global === undefined ? true : !!this.platform.global);
    this.find('.global-toggle').append(toggle.el);
  }

}
