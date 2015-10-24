import d3 from 'd3';
import venn from 'venn.js';
import EventHelp from './event-help.js';
import DataHelp from './data-help.js';
import Diagram from '../diagram.js';

export default class PlatformVenn extends Diagram {
  constructor(options = {}) {
    super(options);

    this.chart = venn.VennDiagram().fontSize('16px');

    this.dh = null;

    this.refresh = this.refresh.bind(this);
    this.filterActivePlatforms = this.filterActivePlatforms.bind(this);
    this.processdata = this.processdata.bind(this);
    this.initialize = this.initialize.bind(this);
  }

  switchOn() {
    this.refresh();
  }

  refresh (platforms = null) {
    if (platforms) this.platforms = platforms;
    Promise
    .all(this.platforms.map(p => this.getPlatform(p.id)))
    .then(platforms => {
      this.platforms = platforms;
      this.filterActivePlatforms();
      this.initialize();
    });
  }

  /**
   * Initialize this.dh
   */
  processdata () {
    this.dh = new DataHelp(this.activePlatforms);
  }

  /**
   * Draw the diagram – does not redraw it when called, just updates it
   * Requires instances variables:
   *  {DataHelp}    this.dh
   *  {VennDiagram} this.chart
   */
  initialize() {
    if (this.activePlatforms.length == 0) {
      this.showEmptyMessage();
      return;
    }

    this.hideEmptyMessage();
    this.processdata();
    // set size to size of the container
    this.chart.height(this.height()).width(this.width());

    // give the data to the div
    this.div = d3.select(this.options.container);
    this.div.datum(this.dh.dataForVenn());

    // initialize it
    var layout = this.chart(this.div);

    // initialize EventHelp with latest DataHelp
    var eh = new EventHelp(this, this.dh, this.height(), this.width());

    // add the sublabels
    this.annotateSizes(layout);

    // hide useless circles
    this.hideUselessCircles();

    // add hover for circles and intersections
    d3.selectAll('.venn-area').on('mouseover', eh.mouseover).on('mouseout', eh.mouseout);

    // add click for everything
    d3.selectAll('.venn-area').on('click', eh.onclick);
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
        .append('text')
        .attr('class', 'sublabel')
        .text(function(d) { 
          if (d.size == 0.5) return '0 opinions'; 
          else return (d.size) + ' opinions'; }) // 0.9 is the marker for 0
        .style('fill', '#666')
        .style('font-size', '0px')
        .attr('text-anchor', 'middle')
        .attr('dy', '0')
        .attr('x', this.chart.width() /2)
        .attr('y', this.chart.height() /2);
    
    // move existing
    layout.update
        .select('.sublabel')
        .text(function(d) { 
          if (d.size == 0.5) return '0 opinions'; 
          else return (d.size) + ' opinions'; }) // 0.9 is the marker for 0
        .style('font-size', '10px')
        .attr('dy', '18')
        .attr('x', function(d) {
            return Math.floor(textCentres[d.sets].x);
        })
        .attr('y', function(d) {
            return Math.floor(textCentres[d.sets].y);
        });

    // remove old (shrinking to middle)
    layout.exit
        .select('.sublabel')
        .attr('x', this.chart.width() /2)
        .attr('y', this.chart.height() /2)
        .style('font-size', '0px');

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
