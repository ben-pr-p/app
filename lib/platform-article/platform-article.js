import view from '../view/mixin';
import config from '../config/config.js';
import template from './template.jade';
import opinion from './opinion.jade';
import topicStore from '../topic-store/topic-store';
import render from '../render/render';
import dom from 'component-dom';

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

    var opinions = options.platform.opinions;

    // Render opinions
    Promise
    .all(opinions.map( o => topicStore.findOne(o.topicId)))
    .then( topics => {
        opinions.forEach( (o, idx) =>  {
          o.label = topics[idx].mediaTitle;
          o.url = topics[idx].url;
          o.topicId = topics[idx].id;
        });

        opinions.sort(function (a, b) {return a.label > b.label}); // default alphabetical sort
        
        var el = render(opinion, {
          opinions: opinions
        });
        dom('.opinions').append(el);
    });

    // Enable side-comments – TO DO
  }

  /**
   * Turn on event handlers on this view
   */

  switchOn () {
    this.bind('click', 'a.read-more', 'showclauses');
  }

  showclauses (ev) {
    ev.preventDefault();

    // this.find('.clauses .clause.hide').removeClass('hide');
    // this.unbind('click', 'a.read-more', 'showclauses');
    // this.find('a.read-more').remove();
  }
}
