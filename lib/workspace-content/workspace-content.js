import d3 from 'd3';
import o from 'component-dom';
import bus from 'bus';
import { dom } from '../render/render.js';

import template from './content-template.jade';
import emptyTemplate from './empty-message.jade';
import View from '../view/view.js';
import urlBuilder from '../url-builder/url-builder';
import venn from './venn.js';

import EventHelp from './event-help.js';
import DataHelp from './data-help.js';

export default class Workspace extends View {
  constructor(platforms, forum) {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });

    this.platforms = platforms;
    this.activePlatforms = [];

    this.chart = venn.VennDiagram();
    this.div = null;
    this.DataHelp = null;

    this.refreshDiagram = this.refreshDiagram.bind(this);
    this.filterActivePlatforms = this.filterActivePlatforms.bind(this);
    this.computeData = this.computeData.bind(this);
    this.initializeDiagram = this.initializeDiagram.bind(this);
  }

  switchOn() {
    this.refreshDiagram();
    window.onresize = this.initializeDiagram;
    bus.on('platform-filter:active', this.refreshDiagram);
    bus.on('platform-store:update:all', this.refreshDiagram);
  }

  refreshDiagram () {
    this.filterActivePlatforms();
    this.computeData();
    this.initializeDiagram();
  }

  computeData () {
    this.dh = new DataHelp(this.activePlatforms);
  }

  initializeDiagram() {
    if (this.dh.dataForVenn().length > 0) {
      if (o('.message-container')) o('.message-container').remove();

      // set size to size of svg container
      var vd = o('#venn-diagram')[0];
      var chartHeight = vd.offsetHeight;
      var charWidth = vd.offsetWidth;
      this.chart.height(chartHeight).width(charWidth);

      d3.select('#venn-diagram').datum(this.dh.dataForVenn()).call(this.chart);

      // initialize HoverHelp with latest DataHelp
      var eh = new EventHelp(this.dh);

      // add hover for circles
      d3.selectAll('.venn-circle').on('mouseover', eh.circleMouseover).on('mouseout', eh.circleMouseout);

      // add hover for intersections
      d3.selectAll('.venn-intersection').on('mouseover', eh.intersectionMouseover).on('mouseout', eh.intersectionMouseout);

      // add click for everything
      d3.selectAll('.venn-area').on('click', eh.onClick);

      // this.annotateSizes();
      
    } else {
      if (o('.message-container')) o('.message-container').remove();
      var vd = o('#venn-diagram');

      vd.empty();
      vd.append(dom(emptyTemplate));
    }
  }

  filterActivePlatforms () {
    this.activePlatforms = [];
    for (var i = this.platforms.length - 1; i >= 0; i--) {
      if (o('[data-id="' + this.platforms[i].id + '"]').find('.active').val()) {
        this.activePlatforms.push(this.platforms[i]);
      }
    }

  }

  // annotateSizes () {
  //   d3.selectAll('g')
  //     .select("text")
  //     .append("tspan")
  //     .text(function(d) { return d.size + " items"; })
  //     .attr("x", function() { return d3.select(this.parentNode).attr("x"); })
  //     .attr("dy", "1.5em")
  //     .style("fill", "#666")
  //     .style("font-size", "13px");
  // }
}

