import view from '../view/mixin';
import config from '../config/config.js';
import template from './template.jade';

export default class ProposalArticle extends view('appendable') {

  /**
   * Creates a new platform-article view
   * from platforms object.
   *
   * @param {Object} platform platform's object data
   * @return {ProposalArticle} `ProposalArticle` instance.
   * @api public
   */

  constructor (options = {}) {
    options.template = template;
    options.locals = {
      platform: options.platform
    };
    super(options);

    // let participants = new Participants(platform.participants || []);
    // participants.appendTo(this.find('.participants')[0]);
    // participants.fetch();

    // Enable side-comments
  }

  /**
   * Turn on event handlers on this view
   */

  switchOn () {
    // this.bind('click', 'a.read-more', 'showclauses');
  }

  showclauses (ev) {
    ev.preventDefault();

    // this.find('.clauses .clause.hide').removeClass('hide');
    // this.unbind('click', 'a.read-more', 'showclauses');
    // this.find('a.read-more').remove();
  }
}
