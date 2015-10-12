import o from 'component-dom';
import closest from 'component-closest';
import Chart from 'chart.js';
import t from 't-component';
import debug from 'debug';
import user from '../user/user';
import platformStore from '../platform-store/platform-store';
import request from '../request/request';
import View from '../view/view';
import { dom } from '../render/render';
import template from './template.jade';
import positive from './vote-positive.jade';

let log = debug('democracyos:platform-options');

export default class PlatformOptions extends View {

  /**
   * Platform Options view
   *
   * @param {Array} platforms list of platforms
   * @param {Object} selected platform object
   * @return {PlatformOptions} `PlatformOptions` instance.
   * @api public
   */

  constructor (platform, reference) {
    super(template, { platform: platform, reference: reference });
    this.platform = platform;

    this.buttonsBox = this.find('.vote-box .vote-options');
  }

  switchOn() {
    this.bind('click', '.vote-box .direct-vote .vote-option', 'vote');
    this.bind('click', '.vote-box .meta-data .change-vote', 'changevote');

    this.on('vote', this.onvote.bind(this));
    this.on('voting', this.onvoting.bind(this));
    this.on('voteerror', this.onvoteerror.bind(this));
  }

  /**
   * Vote for option
   *
   * @param {Object} ev event
   * @api private
   */

  vote (ev) {
    let value;
    let id = this.platform.id;

    ev.preventDefault();

    let target = ev.delegateTarget || closest(ev.target, '[data-platform]');
    if (o(target).hasClass('vote-yes')) {
      value = 'positive';
    }

    if (user.id) {
      log('casting vote %s for %s', value, id);
      this.emit('voting', value);

      platformStore.vote(id).then(() => {
        this.emit('platform:vote');
      }).catch(err => {
        this.emit('voteerror', value);
        log('Failed cast %s for %s with error: %j', value, id, err);
      });
    } else {
      this.find('.platform-options p.text-mute').removeClass('hide');
    }
  }

  onvoting (value) {
    this.find('#voting-error').addClass('hide');
    this.find('.vote-options').addClass('hide');
    this.find('a.meta-item').addClass('hide');

    let el;

    this.unvote();

    el = dom(positive);

    var meta = this.find('.meta-data');

    meta.find('.alert').remove();

    //TODO: clear this of array handling when `dom` supports `insertBefore`
    meta[0].insertBefore(el, meta[0].firstChild);
  }

  onvoteerror (value) {
    this.find('.change-vote').addClass('hide');
    this.find('.vote-options').removeClass('hide');
    this.find('#voting-error').removeClass('hide');

    this.find('.meta-data').find('.alert').remove();
  }

  onvote (value) {
    this.find('.change-vote').removeClass('hide');

    var cast = this.find('.votes-cast em');

    cast.html(t(t('platform-options.votes-cast', { num: census.length || "0" })));
    this.track('vote platform');
  }

  track (event) {
    analytics.track(event, {
      platform: this.platform.id
    });
  }

  unvote () {
    if (~this.platform.participants.indexOf(user.id))
      this.platform.participants.splice(this.platform.participants.indexOf(user.id), 1);
  }

  /**
   * Change vote
   *
   * @param {Object} ev event
   * @api private
   */

  changevote (ev) {
    ev.preventDefault();

    this.buttonsBox.toggleClass('hide');
  }

  post (path, payload, fn) {
    request
    .post(path)
    .send(payload)
    .end(fn);
  }

}
