/**
 * Module dependencies.
 */

import linkTemplate from './link.jade';
import closest from 'component-closest';
import confirm from 'democracyos-confirmation';
import debug from 'debug';
import o from 'component-dom';
import page from 'page';
import t from 't-component';
import moment from 'moment';
import Datepicker from 'democracyos-datepicker';
import Toggle from 'democracyos-toggle';
import dragula from 'dragula';
import FormView from '../form-view/form-view.js';
import { dom as render } from '../render/render.js';
import request from '../request/request.js';
import template from './template.jade';
import Richtext from '../richtext/richtext.js';
import * as serializer from '../proposal/body-serializer';
import platformStore from '../platform-store/platform-store';
import optionTemplate from './option.jade';

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

  constructor(platform, forum) {
    super();
    this.setLocals(platform, forum);
    super(template, this.locals);

    if (created) {
      this.messages([t('admin-platforms-form.message.onsuccess')]);
      created = false;
    }

    this.pubButton = this.find('a.make-public');
    this.privButton = this.find('a.make-private');

    var body = this.find('textarea[name=body]');
    new Richtext(body);

    this.renderToggles();

    this.acceptsFunction = this.acceptsFunction.bind(this);

    this.renderSelecting();
  }

  /**
   * Set locals for template
   */

  setLocals(platform, forum) {
    if (platform) {
      this.action = '/api/platform/' + platform.id;
      this.title = 'admin-platforms-form.title.edit';
    } else {
      this.action = '/api/platform/create';
      this.title = 'admin-platforms-form.title.create';
    }

    this.platform = platform;
    this.forum = forum;
    this.forumAdminUrl = ':forum/admin'.replace(':forum', forum ? `/${forum.name}` : '');

    this.locals = {
      form: { title: this.title, action: this.action },
      platform: this.platform || {},
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

    data.platformTree = data.platformTree.split('|')
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

  renderSelecting() {
    platformStore.findAll().then(platforms => {
      var options = platforms.slice(0);

      var container = o('#platform-options-container');
      if (this.platform) options = options.filter(opt => opt.id != this.platform.id);
      options.forEach(opt => {
        container.append(render(optionTemplate, {
          opt: opt
        }));
      });

      // recreate current tree
      var currentTree = o('[name="platformTree"]').val().split('|');
      var platformSelect = o('#platformTree');
      currentTree.forEach(opt => {
        if (~['–', '+', '(', ')', '∩'].indexOf(opt)) {
          platformSelect.append(render(optionTemplate, {
            opt: {id: opt, mediaTitle: opt}
          }));
        }
        else if (opt) {
          var tempOpt = render(optionTemplate, {
            opt: {id: opt, mediaTitle: opt}
          });
          platformSelect.append(tempOpt);

          platformStore.findOne(opt).then( opt => {
            platformSelect.find('[value="' + opt.id + '"]').find('.platform-title').text(opt.mediaTitle);
          });
        }
      });

      this.platforms = platforms;
      this.initializeDragging();
    });
  }

  initializeDragging() {
    var operations = document.getElementById('platform-operations-container');
    var options = document.getElementById('platform-options-container');
    var platformSelect = document.getElementById('platformTree');

    var drake = dragula([operations, options, platformSelect], {
      copy: (el, source) => {
        return (source === operations || source === options);
      },
      accepts: (el, source) => {
        return this.acceptsFunction(el, source);
      },
      removeOnSpill: (el, source) => {
        return (source === platformSelect);
      }
    });

    drake.on('drop', this.refreshHiddenInput);
    drake.on('remove', this.refreshHiddenInput);
  }

  acceptsFunction (el, target) {
    var operations = document.getElementById('platform-operations-container');
    var options = document.getElementById('platform-options-container');
    var platformSelect = document.getElementById('platformTree');

    var val = o(el).attr('value');
    if (~['–', '+', '(', ')', '∩'].indexOf(val)) {
      return (target !== operations || target !== options);
    }

    var p = this.platforms.filter(p => {
      return p.id == val;
    })[0];

    var good = true;
    if (p.platformTree) {
      good = (p.platformTree.string.indexOf(this.platform.id) < 0);
    }

    if (good) return (target !== operations || target !== options);

    alert(t('admin-platforms-form.warning.infinite-loop' + p.mediaTitle));
    return false;
  }

  refreshHiddenInput(el) {
    var hiddeninput = o('[name="platformTree"]');
    var options = o('#platformTree').find('.option');
    hiddeninput.val(options.map(opt => o(opt).attr('value')).join('|'));
  }
}
