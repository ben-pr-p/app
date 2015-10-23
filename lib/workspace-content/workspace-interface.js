import o from 'component-dom';
import bus from 'bus';
import platformStore from '../platform-store/platform-store';

import template from './template.jade';
import emptyTemplate from './empty-message.jade';
import View from '../view/view.js';
import urlBuilder from '../url-builder/url-builder';

import PlatformVenn from '../PlatformVenn'


export default class Workspace extends View {
  constructor() {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });

    this.filterActivePlatforms = this.filterActivePlatforms.bind(this);
    this.refreshDiagram = this.refreshDiagram.bind(this);
    this.initializeDiagram = this.initializeDiagram.bind(this);
    this.onwindowresize = this.onwindowresize.bind();

    this.platforms = platforms;
    this.activePlatforms = [];

    this.pv = new PlatformVenn(options = {
      platforms: platforms,
      activePlatforms: this.activePlatforms,
    });

    this.chart = venn.VennDiagram()
      .fontSize('16px');

    this.div = null;
    this.DataHelp = null;
  }

  switchOn() {
    this.refreshDiagram();
    window.onresize = this.onWindowResize(); // redraw diagram if size changes

    bus.on('platform-filter:active', this.refresh);
    bus.on('platform-store:update:all', this.refresh);
  }

  refresh (platforms = null) {
    return;
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
