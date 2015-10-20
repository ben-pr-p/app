import d3 from 'd3';
import o from 'component-dom';
import bus from 'bus';
import venn from 'venn.js';
import { dom } from '../render/render.js';
import platformStore from '../platform-store/platform-store';

import template from './template.jade';
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
    window.onresize = this.initializeDiagram; // redraw diagram if size changes

    bus.on('platform-filter:active', this.refreshDiagram);
    bus.on('platform-store:update:all', this.refreshDiagram);
  }

  refreshDiagram (platforms = null) {
    if (platforms) this.platforms = platforms;
    Promise
    .all(this.platforms.map(p => platformStore.findOne(p.id)))
    .then(platforms => {
      this.platforms = platforms;
      this.filterActivePlatforms();
      this.computeData();
      this.initializeDiagram();
    });
  }

  /**
   * Initialize this.dh
   */
  computeData () {
    this.dh = new DataHelp(this.activePlatforms);
  }

  /**
   * Draw the diagram – does not redraw it when called, just updates it
   * Requires instances variables:
   *  {DataHelp}    this.dh
   *  {VennDiagram} this.chart
   */
  initializeDiagram() {
    if (this.dh.dataForVenn().length > 0) {
      if (o('.message-container')) o('.message-container').remove();

      // set size to size of svg container
      var vd = o('#venn-diagram')[0];
      var chartHeight = vd.offsetHeight;
      var chartWidth = vd.offsetWidth;

      this.chart.height(chartHeight).width(chartWidth);

      // give the data to the div
      this.div = d3.select('#venn-diagram');
      this.div.datum(this.dh.dataForVenn());

      // initialize it
      var layout = this.chart(this.div);

      // initialize HoverHelp with latest DataHelp
      var eh = new EventHelp(this.dh, chartWidth, chartHeight);

      // add the sublabels
      this.annotateSizes(layout);

      // hide useless circles
      this.hideUselessCircles();

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

  /**
   * Filter platforms according to whether or not their input checkbox in sidebar is selected
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
   * Puts the sublabel descriptions that say (x opinions) on the circles
   * See https://github.com/benfred/venn.js/issues/46 for discussion on how to implement
   * See https://github.com/benfred/venn.js/issues/48 for some previous bugs that may resurface
   */
  annotateSizes (layout) {
    // have to use the Canadian spelling because of Mr.BenFred
    var textCentres = layout.textCentres;

    // add new sublabels (growing from middle)
    layout.enter
        .append("text")
        .attr("class", "sublabel")
        .text(function(d) { 
          if (d.size == 0.5) return "0 opinions"; 
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
        .text(function(d) { 
          if (d.size == 0.5) return "0 opinions"; 
          else return (d.size) + ' opinions'; }) // 0.9 is the marker for 0
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

  hideUselessCircles () {
    var intersections = d3.selectAll('.venn-intersection');
    intersections.each(a => {
      intersections.each(b => {
        var selector = '[data-venn-sets="' + a.sets.join('_') + '"]';

        if ((a != b) && (a.sets.isSubsetOf(b.sets)) && (a.size <= b.size)) {
          d3.select(selector).classed('hide', true);
        }

      });
    });
  }

}

Array.prototype.isSubsetOf = function (array) {
  var result = true;
  this.forEach(el => {
    if (array.indexOf(el) < 0) result = false;
  });
  return result;
}
