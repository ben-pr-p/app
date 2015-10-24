import o from 'component-dom';
import { dom } from '../render/render.js';
import platformStore from '../platform-store/platform-store';
import topicStore from '../topic-store/topic-store.js';
import emptyTemplate from './empty-message.jade';
import sidebar from '../sidebar/sidebar';

export default class Diagram {
  constructor(options) {
    this.platforms = options.platforms;
    this.container = o(options.container);
    this.activePlatforms = [];
    this.filterActivePlatforms();

    this.options = options;

    this.switchOn();
  }

  /**
   * [getPlatform description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  getPlatform (id) {
    return platformStore.findOne(id);
  }

  /**
   * [getTopic description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  getTopic (id) {
    return topicStore.findOne(id);
  }

  /**
   * [addOpinion description]
   * @param {[type]} platformId [description]
   * @param {[type]} topicId    [description]
   * @param {[type]} value      [description]
   */
  addOpinion (platformId, topicId, value) {
    platformStore.findOne(platformId).then( cachedPlatform => {
      topicStore.findOne(topicId).then( cachedTopic => {
        if (value) platformStore.opine(platformId, topicId, value).then( item => {
            this.platformList.makeActive(platformId);
          }).catch(err => {
            alert(err);
          });
      });
    });
  }

  /**
   * [removeOpinion description]
   * @param  {[type]} platformId [description]
   * @param  {[type]} topicId    [description]
   * @return {[type]}            [description]
   */
  removeOpinion (platformId, topicId) {
    platformStore.findOne(platformId).then( cachedPlatform => {
      topicStore.findOne(topicId).then( cachedTopic => {
        platformStore.remove(platformId, topicId).then( item => {
            sidebar.active.platformList.makeActive(platformId);
          }).catch(err => {
            alert(err);  
          });
      });
    });
  }

  /**
   * Filter platforms according to whether or not their input checkbox in sidebar is selected
   * After this is called, this.activePlatforms will be set
   */
  filterActivePlatforms () {
    this.activePlatforms = [];
    this.platforms.forEach( p => {
      var div = o('[data-id="' + p.id + '"]');
      if ((div.length != 0) && (div.find('.active-checkbox').val())) {
        this.activePlatforms.push(p);
      }
    });
  }

  /**
   * Returns the height of the binding container
   */
  height () {
    return this.container[0].offsetHeight;
  }

  /**
   * Returns the width of the bounding container
   */
  width () {
    return this.container[0].offsetWidth;
  }

  /**
   * Renders the empty message
   */
  showEmptyMessage () {
    if (this.container.find('.message-container')) this.container.find('.message-container').remove();
    this.container.empty();
    this.container.append(dom(emptyTemplate));
  }

  /**
   * Removes the empty message
   */
  hideEmptyMessage () {
    if (this.container.find('.message-container')) this.container.find('.message-container').remove();
    this.container.empty();    
  }

  /**
   * -----------------------------------------------------------------------------------
   * -----------------------------------------------------------------------------------
   * -----------------------------------------------------------------------------------
   * STARTING HERE, ALL REMAINING METHODS SHOULD BE OVERWRITTEN BY THE EXTENDING CLASSES
   * -----------------------------------------------------------------------------------
   * -----------------------------------------------------------------------------------
   * -----------------------------------------------------------------------------------
   */

  /**
   * --------------------------- OVERWRITE THIS METHOD ---------------------------
   *
   * Will be called at the end of running super(options).
   * Use it to bind event handling, or anything that needs to be run after
   * platforms have been filtered.
   */
  switchOn() {
    return;
  }

  /**
   * --------------------------- OVERWRITE THIS METHOD ---------------------------
   *
   * Will be called anytime there is a change in the data.
   * If active platforms is 
   * @param {Array} platforms – the new data
   */
  refresh (platforms = null) {
    return;
  }

  /**
   * --------------------------- OVERWRITE THIS METHOD ---------------------------
   *
   * Will be called anytime the window's size is changed.
   * this.height() and this.width() can be used to get the new dimensions.
   */
  onwindowresize () {
    return;
  }

  /**
   * --------------------------- OVERWRITE THIS METHOD ---------------------------
   *
   * Will be called whenever the diagram must be created from scratch. Either because
   * this is the first time it is being called, or you are removing the empty message.
   */
  initialize() {
    return;
  }
}
