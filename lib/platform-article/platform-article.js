import view from '../view/mixin';
import config from '../config/config.js';
import template from './template.jade';
import opinion from './opinion.jade';
import topicStore from '../topic-store/topic-store';
import platformStore from '../platform-store/platform-store';
import optionTemplate from './option.jade';
import render from '../render/render';
import dom from 'component-dom';

export default class PlatformArticle extends view('appendable', 'withEvents') {

  /**
   * Creates a new platform-article view
   * from platforms object.
   *
   * @param {Object} platform platform's object data
   * @return {PlatformArticle} `PlatformArticle` instance.
   * @api public
   */

  constructor (options = {}) {
    options.template = template;
    options.locals = {
      platform: options.platform
    };
    super(options);

    var directOpinions = options.platform.directOpinions;

    // Render opinions
    Promise
    .all(directOpinions.map( o => topicStore.findOne(o.topicId)))
    .then( topics => {
      directOpinions.forEach( (o, idx) =>  {
        o.label = topics[idx].mediaTitle;
        o.url = topics[idx].url;
        o.topicId = topics[idx].id;
      });

      directOpinions.sort(function (a, b) {return a.label > b.label}); // default alphabetical sort
      
      var el = render(opinion, {
        opinions: directOpinions
      });
      dom('.opinions').append(el);
    });

    if (options.platform.platformTree) this.renderPlatformTree(options.platform.platformTree.string.split('|'));

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

  renderPlatformTree(platformTree) {
    var container = dom('.platform-tree-container');
    platformTree.forEach(opt => {
      if (~['–', '+', '(', ')', '∩'].indexOf(opt)) {
        container.append(render(optionTemplate, {
          opt: {mediaTitle: opt, href:'#'}
        }));
      }
      else if (opt) {
        platformStore.findOne(opt).then( opt => {
          container.append(render(optionTemplate, {
            opt: opt
          }));
        });
      }
    });
  }
}
