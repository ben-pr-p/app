import o from 'component-dom';
import { dom } from '../render/render.js';
import platformStore from '../platform-store/platform-store';
import topicStore from '../topic-store/topic-store.js';
import emptyTemplate from './empty-message.jade';
import sidebar from '../sidebar/sidebar';
import debug from 'debug';
const log = debug('democracyos:diagram-core');


export default class Diagram {
  constructor(options) {
    this.platforms = options.platforms.map(p => {
      p.type = 'platform';
      return p;
    });

    this.topics = options.topics.map(t => {
      t.type = 'topic';
      return t;
    });
    
    this.container = o(options.container);
    this.activePlatforms = [];
    this.filterActivePlatforms();

    this.options = options;
    this.color = d3.scale.category20();

    this.switchOn();
  }

  /**
   * Fetches a platform with id `id`
   * 
   * @param  {ObjectId} id  [platformId]
   * @return {Promise}      [Promise to get platform] can use promise 
   *                        .then(function(platform) { ... })
   *                          and 
   *                        .catch(function(error) { ... })
   */
  getPlatform (id) {
    return platformStore.findOne(id);
  }

  /**
   * Fetches a topic with id `id`
   * 
   * @param  {ObjectId} id  [topicId]
   * @return {Promise}      [Promise to get topic] can use promise 
   *                        .then(function(platform) { ... })
   *                          and 
   *                        .catch(function(error) { ... })
   */
  getTopic (id) {
    return topicStore.findOne(id);
  }

  /**
   * Adds an opinion with value `value` on topic `topicId` to platform `platformId`
   * 
   * @param {ObjectId} platformId [platformId]
   * @param {ObjectId} topicId    [topicId]
   * @param {String}   value      ['positive', 'negative', or 'neutral']
   */
  addOpinion (platformId, topicId, value) {
    platformStore.findOne(platformId).then( cachedPlatform => {
      topicStore.findOne(topicId).then( cachedTopic => {
        if (value) platformStore.opine(platformId, topicId, value).then( item => {
            sidebar.active.platformList.makeActive(platformId);
          }).catch(err => {
            log(err);
          });
      });
    });
  }

  /**
   * Removes all opinions on topic `topicId` from platform `platformId`
   * 
   * @param {ObjectId} platformId [platformId]
   * @param {ObjectId} topicId    [topicId]
   */
  removeOpinion (platformId, topicId) {
    platformStore.findOne(platformId).then( cachedPlatform => {
      topicStore.findOne(topicId).then( cachedTopic => {
        platformStore.remove(platformId, topicId).then( item => {
            sidebar.active.platformList.makeActive(platformId);
          }).catch(err => {
            log(err);  
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
      var div = o('div[data-id="' + p.id + '"]');
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
