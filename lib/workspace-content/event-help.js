import d3 from 'd3';
import venn from 'venn.js';
import o from 'component-dom';
import closest from 'component-closest';
import page from 'page';

import topicStore from '../topic-store/topic-store.js';
import { dom } from '../render/render.js';
import template from './opinion-tooltip.jade';

export default class EventHelp {
  constructor(DataHelp) {
    this.dh = DataHelp; 
    this.onClick = this.onClick.bind(this);

    d3.selectAll('.venntooltip').remove();
    this.tooltip = d3.select('body').append('div').attr('class', 'venntooltip');
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
    if (this.tooltip.attr('sets') == d.sets.join('-')) {
      if (this.tooltip.select('.tooltip-container')[0][0] != null) {
        this.tooltip.selectAll('*').remove();
        return;
      }    
    }

    // else, add new tooltip
    var opinions = this.dh.opinionsFrom(d.sets);
    this.event = d3.event; // this survives to the inside of `then` - `d3` doesn't

    // consider adding getList method to store in the future instead of batching promises
    Promise
    .all(opinions.map( o => topicStore.findOne(o.topicId)))
    .then( topics => {

      opinions.forEach( (o, idx) =>  {
        o.label = topics[idx].mediaTitle;
        o.url = topics[idx].url;
      });

      opinions.sort(function (a, b) {return a.label > b.label}); // default alphabetical sort

      this.tooltip.html(dom(template, {
        opinions: opinions
      }).outerHTML);

      o('.topic-link').on('click', function (e) {
        var link = o(closest(e.target, '[data-url]')).attr('data-url');
        o('.tooltip-container').addClass('hide'); // must manually hide tooltip or else it stays when page(link) is called
        page(link);
      });

      this.tooltip.attr('sets', d.sets.join('-')); // necessary for the check at beginning of function

      this.tooltip.style('left', (this.event.pageX) + 'px').style('top', (this.event.pageY) + 'px'); // put it where the mouse is
    });
  }
}
