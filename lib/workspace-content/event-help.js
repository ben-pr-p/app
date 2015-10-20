import d3 from 'd3';
import venn from 'venn.js';
import o from 'component-dom';
import closest from 'component-closest';
import page from 'page';

import topicStore from '../topic-store/topic-store.js';
import { dom } from '../render/render.js';
import Tooltip from './tooltip/view.js';

export default class EventHelp {
  constructor(DataHelp, width, height) {
    this.dh = DataHelp; 
    this.onClick = this.onClick.bind(this);

    this.height = height;
    this.width = width;

    // initialize the tooltip
    d3.selectAll('.venntooltip').remove();
    this.tooltipContainer = d3.select('body').append('div').attr('class', 'venntooltip');
    this.tooltip = null;
  }

  /**
   * Sort areas, increase opacity, bold font, thicker border
   * @param  {Object} d [datum given to d3 - contains sets]
   * @param  {[type]} i [not used]
   */
  mouseover (d, i) {
    venn.sortAreas(d3.select('#venn-diagram'), d); 

    var g = d3.select(this);
    var section = d3.select(g[0][0].children[0]);
    var text = d3.select(g[0][0].children[1]);

    // if i'm a single platform
    if (d.sets.length == 1)  {
      var fillColor = section.style('fill');
      section.attr('stroke', fillColor);
      section.transition().style('stroke-width', 4).style('fill-opacity', .4);
      text.transition().style('font-weight', 'bold');
    }

    // if i'm a platform intersection
    if (d.sets.length > 1) {
      var fillColor = section.style('fill'); 
      section.attr('stroke', fillColor); // consider removing this - it looks not that good
      section.transition().style('fill-opacity', .15);
      text.transition().style('font-weight', 'bold');
    }
  }

  /**
   * Decrease opacity to default, no border, normal font
   * @param  {Object} d [datum given to d3 - contains sets]
   * @param  {[type]} i [not used]
   */
  mouseout (d, i) {
    var g = d3.select(this);
    var section = d3.select(g[0][0].children[0]);
    var text = d3.select(g[0][0].children[1]);

    // if i'm a single platform
    if (d.sets.length == 1) {
      section.transition().attr('stroke', 'none').style('fill-opacity', .25);
      text.transition().style('font-weight', 'normal');
    }

    // if i'm a platform intersection
    if (d.sets.length > 1) {
      section.transition().attr('stroke', 'none').style('fill-opacity', 0);
      text.transition().style('font-weight', 'normal');   
    }
  }

  /**
   * Show opinions tooltip, remove opinions tooltip if already rendered on the circle
   * that was just clicked on. 
   * @param  {[type]} d [description]
   * @param  {[type]} i [description]
   * @return {[type]}   [description]
   */
  onClick (d, i) {
    // remove existing tooltips and leave if second click
    if (this.tooltipContainer.attr('sets') == d.sets.join('-')) {
      if (this.tooltipContainer.select('.tooltip-container')[0][0] != null) {
        this.tooltipContainer.selectAll('*').remove();
        return;
      }    
    }

    var singleSet = (d.sets.length == 1);

    // else, add new tooltip
    var result = this.dh.opinionsFrom(d.sets);
    var opinions = result[0];
    var platformTree = result[1];
    this.event = d3.event; // this survives to the inside of `then` - `d3` doesn't

    // consider adding getList method to store in the future instead of batching promises
    Promise
    .all(opinions.map( o => topicStore.findOne(o.topicId)))
    .then( topics => {

      opinions.forEach( (o, idx) =>  {
        o.label = topics[idx].mediaTitle;
        o.url = topics[idx].url;
        o.topicId = topics[idx].id;
      });

      opinions.sort(function (a, b) {return a.label > b.label}); // default alphabetical sort

      this.tooltipContainer.selectAll('*').remove();

      if (platformTree) {
        this.tooltip = new Tooltip({
          container: this.tooltipContainer[0][0],
          opinions: opinions,
          singleSet: singleSet,
          platformTree: platformTree.string.split('|')
        });
      } else {
        this.tooltip = new Tooltip({
          container: this.tooltipContainer[0][0],
          opinions: opinions,
          singleSet: singleSet,
        });
      }

      this.tooltipContainer.attr('sets', d.sets.join('-')); // necessary for the check at beginning of function

      // get its height, move it up to fit
      var h = this.tooltipContainer.node().getBoundingClientRect().height;
      var offset = (h + this.event.pageY > this.height) ? (-1) * h : 0;

      this.tooltipContainer.style('left', (this.event.pageX) + 'px').style('top', (this.event.pageY + offset) + 'px'); // put it where the mouse is
    });
  }
}
