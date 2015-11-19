import d3 from 'd3';
import Diagram from '../diagram.js';

const sld = 200;

const topicBuffer = 100;

export default class PlatformTree extends Diagram {
  constructor(options = {}) {
    super(options);

    ['refresh', 'filterActivePlatforms', 'initialize', 'onwindowresize', 'makeEdges', 'tick'].forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  switchOn() {
    // TO DO: any events    
  }

  /**
   * [initialize description]
   * @return {[type]} [description]
   */
  initialize() {
    this.svg = d3.select(this.options.container).append('svg');

    this.nodes = this.platforms.concat(this.topics);
    this.edges = this.makeEdges();

    this.force = d3.layout.force()
      .nodes(this.nodes)
      .links(this.edges)
      .size( [this.svg.node().offsetWidth, this.svg.node().offsetHeight] )
      .linkDistance(sld)
      .linkStrength(1)
      .charge(-500)
      .gravity(0.10)
      .on('tick', this.tick);

    // TO DO: add zooming, dragging, controls if any, update intervals
    
    this.circles = this.svg.append('svg:g').selectAll('g');
    this.path = this.svg.append('svg:g').selectAll('path');

    this.refresh();
  }

  /**
   * [refresh description]
   * @param  {[type]} platforms [description]
   * @param  {[type]} topics    [description]
   * @return {[type]}           [description]
   */
  refresh (platforms = null, topics = null) {
    if (platforms) this.platforms = platforms;
    if (topics) this.topics = topics;

    // ------------------------------------------
    // ------- NODES: UPDATE, ENTER, EXIT -------
    // ------------------------------------------
    this.circles = this.circles.data(this.nodes, (d) => {
      return d.id;
    });

    // UPDATE (nothing yet!)
    
    // ENTER
    this.circles.enter().append('svg:g')
      .append('svg:circle')
        .attr('r', (d) => d.type == 'topic' ? 12 : 30);
      // TO DO: aesthetics
    
    // EXIT
    this.circles.exit().remove();

    // ------------------------------------------
    // ------- NODES: UPDATE, ENTER, EXIT -------
    // ------------------------------------------
    this.path = this.path.data(this.edges);

    // UPDATE (nothing yet!)

    // ENTER
    this.path.enter()
      .append('svg:path')
        .attr('stroke-width', 4)
        .attr('stroke', (d) => {
          return {
            'positive': 'green',
            'neutral': 'grey',
            'negative': 'red'
          }[d.value];
        });
      // TO DO: stroke width, classes, etc.
    
    // EXIT
    this.path.exit().remove();

    this.force.start();
  }

  /**
   * [tick description]
   * @param  {[type]} ev [description]
   * @return {[type]}    [description]
   */
  tick (ev) {
    // TO DO: apply constraints / custom forces (make topics go down, platforms float up, all edges pointing downwards)
    
    // pin topics to bottom
    this.force.nodes().forEach((n) => {
      if (n.type != 'topic') return;

      n.y = this.svg.node().offsetHeight - topicBuffer;
    });
    
    // move edges
    this.path.attr('d', (d) => {
      return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
    });

    // move nodes
    this.circles.attr('transform', (d) => {
      return `translate(${d.x}, ${d.y})`;
    });

  }

  onwindowresize () {
    this.initialize();
  }

  makeEdges () {
    var edges = [];
    this.platforms.forEach(p => {
      p.directOpinions.forEach(o => {

        edges.push({
          source: this.getNode({type: 'platform', id: p.id}),
          target: this.getNode({type: 'topic', id: o.topicId}),
          value: o.value
        });

      });

      // TO DO: platform tree stuff
    });
    return edges;
  }

  getNode (query) {
    return this.nodes.filter(n => {
      for (var key in query) {
        if (n[key] != query[key]) return false;
      }
      return true;
    })[0];
  }

}

