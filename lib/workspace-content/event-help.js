import d3 from 'd3';
import venn from './venn.js';

import { dom } from '../render/render.js';
import template from './opinion-tooltip.jade';

export default class EventHelp {
  constructor(DataHelp) {
    this.dh = DataHelp;
    this.onClick = this.onClick.bind(this);
    d3.selectAll('.venntooltip').remove();
    this.tooltip = d3.select('body').append('div').attr('class', 'venntooltip');
  }

  circleMouseover (d, i) {
    venn.sortAreas(d3.select('#venn-diagram'), d); 

    var g = d3.select(this);
    var circle = d3.select(g[0][0].children[0]);
    var text = d3.select(g[0][0].children[1]);

    var fillColor = circle.style('fill');
    circle.attr('stroke', fillColor);
    circle.transition().style('stroke-width', 4).style('fill-opacity', .4);
    text.transition().style('font-weight', 'bold');
  }

  circleMouseout (d, i) {
    var g = d3.select(this);
    var circle = d3.select(g[0][0].children[0]);
    var text = d3.select(g[0][0].children[1]);

    circle.transition().attr('stroke', 'none').style('fill-opacity', .25);
    text.transition().style('font-weight', 'normal');
  }

  intersectionMouseover (d, i) {
    venn.sortAreas(d3.select('#venn-diagram'), d); 

    var g = d3.select(this);
    var section = d3.select(g[0][0].children[0]);
    var text = d3.select(g[0][0].children[1]);

    var fillColor = section.style('fill');
    section.attr('stroke', fillColor);
    section.transition().style('fill-opacity', .15);
    text.transition().style('font-weight', 'bold');
  }

  intersectionMouseout (d, i) {
    var g = d3.select(this);
    var section = d3.select(g[0][0].children[0]);
    var text = d3.select(g[0][0].children[1]);

    section.transition().attr('stroke', 'none').style('fill-opacity', 0);
    text.transition().style('font-weight', 'normal');
  }

  onClick (d) {
    var opinions = this.dh.opinionsFrom(d.sets);

    var justForTest = dom(template, {
      opinions: opinions
    });

    this.tooltip.empty();
    this.tooltip.html(dom(template, {
      opinions: opinions
    }).outerHTML);

    this.tooltip.style('left', (d3.event.pageX) + 'px').style('top', (d3.event.pageY) + 'px');
  }
}
