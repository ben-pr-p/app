import d3 from 'd3';
import venn from 'venn.js';
import d3venn from 'd3-venn';
import EventHelp from './event-help.js';
import DataHelp from './data-help.js';
import Diagram from '../diagram.js';

export default class PlatformVenn extends Diagram {
  constructor(options = {}) {
    super(options);
    debugger;
    this.layout = d3.layout.venn();

    this.dh = new DataHelp(this.activePlatforms);

    // this.chart = venn.VennDiagram().fontSize('16px');

    // this.dh = null;

    // this.refresh = this.refresh.bind(this);
    // this.filterActivePlatforms = this.filterActivePlatforms.bind(this);
    // this.processdata = this.processdata.bind(this);
    // this.initialize = this.initialize.bind(this);
    // this.onwindowresize = this.onwindowresize.bind(this);
  }

  switchOn() {
    // TO DO: Any events
  }

  /**
   * Draw the diagram – does not redraw it when called, just updates it
   * Requires instances variables:
   *  {DataHelp}    this.dh
   *  {VennDiagram} this.chart
   */
  initialize() {
    // give it the nodes
    this.layout.nodes(this.dh.dataForVenn());
    // set size to size of the container
    this.layout.size([this.width(), this.height()]);

    // give the data to the div
    this.venn = d3.select(this.options.container);
    this.venn.datum(this.layout.sets().values(), d => d.__key__);

    // Define vennEnter
    var vennEnter = this.venn.enter();
    // Create the `g`
    vennEnter.append('g')
      .attr('class', d => `venn-area venn-${d.sets.length == 1 ? "circle" : "intersection"}`)
      .attr('fill', (d, i) => d.color || this.color(i));

    vennEnter.append('path')
      .attr('class', 'venn-area-path')
      .attr('d', d => d.d(1));

    vennEnter.append('circle')
      .attr('class', 'inner')
      .attr('fill', 'grey');

    vennEnter.append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em');

    this.venn.selectAll('text.label')
      .text(d => d.__key__)
      .attr('x', d => d.center.x)
      .attr('y', d => d.center.y);

    // // initialize EventHelp with latest DataHelp
    // var eh = new EventHelp(this, this.dh, this.height(), this.width());

    // // add the sublabels
    // this.annotateSizes(layout);

    // // hide useless circles
    // this.hideUselessCircles();

    // // set drag over functionality
    // this.div.on('dragover', () => {
    //   debugger;
    // })

    // // add hover for circles and intersections
    // d3.selectAll('.venn-area').on('mouseover', eh.mouseover).on('mouseout', eh.mouseout);

    // // add click for everything
    // d3.selectAll('.venn-area').on('click', eh.onclick);
  }

  refresh (platforms = null, topics = null) {
    if (platforms) this.platforms = platforms;
    if (topics) this.topics = topics;

    this.filterActivePlatforms();

    this.dh = new DataHelp(this.activePlatforms);
  }
}
