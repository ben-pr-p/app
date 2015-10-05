import d3 from 'd3';
import venn from 'venn.js';
import o from 'component-dom';

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

  mouseover (d, i) {
    venn.sortAreas(d3.select('#venn-diagram'), d); 

    var g = d3.select(this);
    var section = d3.select(g[0][0].children[0]);
    var text = d3.select(g[0][0].children[1]);

    if (d.sets.length == 1)  {
      var fillColor = section.style('fill');
      section.attr('stroke', fillColor);
      section.transition().style('stroke-width', 4).style('fill-opacity', .4);
      text.transition().style('font-weight', 'bold');
    }

    if (d.sets.length > 1) {
      var fillColor = section.style('fill');
      section.attr('stroke', fillColor);
      section.transition().style('fill-opacity', .15);
      text.transition().style('font-weight', 'bold');
    }
  }

  mouseout (d, i) {
    var g = d3.select(this);
    var section = d3.select(g[0][0].children[0]);
    var text = d3.select(g[0][0].children[1]);

    if (d.sets.length == 1) {
      section.transition().attr('stroke', 'none').style('fill-opacity', .25);
      text.transition().style('font-weight', 'normal');
    }

    if (d.sets.length > 1) {
      section.transition().attr('stroke', 'none').style('fill-opacity', 0);
      text.transition().style('font-weight', 'normal');   
    }
  }

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

      opinions.sort(function (a, b) {return a.label > b.label});

      this.tooltip.html(dom(template, {
        opinions: opinions
      }).outerHTML);

      this.tooltip.attr('sets', d.sets.join('-'));

      this.tooltip.style('left', (this.event.pageX) + 'px').style('top', (this.event.pageY) + 'px');
    });
  }
}
