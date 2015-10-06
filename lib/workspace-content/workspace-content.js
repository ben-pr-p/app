import d3 from 'd3';
import o from 'component-dom';
import bus from 'bus';
import venn from 'venn.js';
import { dom } from '../render/render.js';

import template from './content-template.jade';
import emptyTemplate from './empty-message.jade';
import View from '../view/view.js';
import urlBuilder from '../url-builder/url-builder';

import EventHelp from './event-help.js';
import DataHelp from './data-help.js';


export default class Workspace extends View {
  constructor(platforms, forum) {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });

    this.platforms = platforms;
    this.activePlatforms = [];

    this.chart = venn.VennDiagram()
      .fontSize('16px');

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

  refreshDiagram (platforms = null) {
    if (platforms) this.platforms = platforms;
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

      // give the data to the div
      this.div = d3.select('#venn-diagram');
      this.div.datum(this.dh.dataForVenn());

      // initialize it
      var layout = this.chart(this.div);

      // initialize HoverHelp with latest DataHelp
      var eh = new EventHelp(this.dh);

      // add the sublabels
      this.annotateSizes(layout);

      // add hover for circles and intersections
      d3.selectAll('.venn-area').on('mouseover', eh.mouseover).on('mouseout', eh.mouseout);

      // add click for everything
      d3.selectAll('.venn-area').on('click', eh.onClick);
      
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

  annotateSizes (layout) {
    // have to use the Canadian spelling because of Mr.BenFred
    var textCentres = layout.textCentres;

    // add new sublabels (growing from middle)
    layout.enter
        .append("text")
        .attr("class", "sublabel")
        .text(function(d) { 
          if (d.size == 0.9) return "0 opinions"; 
          else return (d.size) + ' opinions'; }) // 0.9 is the marker for 0
        .style("fill", "#666")
        .style("font-size", "0px")
        .attr("text-anchor", "middle")
        .attr("dy", "0")
        .attr("x", this.chart.width() /2)
        .attr("y", this.chart.height() /2);
    
    // move existing
    layout.update
        .select(".sublabel")
        .style("font-size", "10px")
        .attr("dy", "18")
        .attr("x", function(d) {
            return Math.floor(textCentres[d.sets].x);
        })
        .attr("y", function(d) {
            return Math.floor(textCentres[d.sets].y);
        });

    // remove old (shrinking to middle)
    layout.exit
        .select(".sublabel")
        .attr("x", this.chart.width() /2)
        .attr("y", this.chart.height() /2)
        .style("font-size", "0px");

    return layout;
  }

}

