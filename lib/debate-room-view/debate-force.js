import d3 from 'd3';
// import debateroomStore from '../debate-room-store/debate-room-store.js';
import nodeStore from '../debate-room-store/node-store.js';
import edgeStore from '../debate-room-store/edge-store.js';
import NodeCard from './node-card/view.js';
import debug from 'debug';
const log = debug('democracyos:admin-topics-form');

/**
 * TO DO:
 *   - make author show up even on node creation
 *   - initialize comments to good place
 *   - see how it looks with lots of comments
 *   - hot keys
 *   - make node types
 *   - finish search
 */

export default class DebateForce {
  constructor (options) {
    this.svg = d3.select('svg').attr('oncontextmenu', 'return false;');

    // get debate data
    this.nodes = options.debate.nodes; this.edges = options.debate.edges;

    // get schema data
    this.schema = options.schema;

    // get context data
    this.type = options.type;
    this.item = options.item;

    // it's just a little easier because it's so many functions
    var tobind = [
      'launch', 'initialize', 'tick', 'restart',                                                  // the meat
      'keydown', 'keyup',                                                                         // global event handlers
      'onnodemouseout', 'onnodemouseover',                                                        // node events
      'renderNode', 'createNode', 'removeTempNode', 'edgesForNode', 'deleteNode',                 // node functions
      'onedgemousedown', 'deleteEdge',                                                            // edge events
      'zoomed'
    ];

    tobind.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  /**
   * Called once at the beginning
   *   – gets the ball rolling
   *   - binds events to the svg and window
   * Requires this.svg be set
   */
  launch () {
    this.initialize();

    // d3.select(window)
    //   .on('keydown', this.keydown)
    //   .on('keyup', this.keyup);

    this.restart();
  }

  /**
   * Called once at the beginning
   *   – defines force, arrows, the dragline, and statusVars
   *   - initializes the path and foreign objects
   *  Requires this.svg be set
   */
  initialize () {
    // define force
    this.force = d3.layout.force()
      .nodes(this.nodes)
      .links(this.edges)
      .size( [this.svg.node().offsetWidth, this.svg.node().offsetHeight] )
      .linkDistance((d) => {
        return 200 * this.scaleDepth(d.target.depth);
      })
      .charge(-500)
      .gravity(0)
      .on('tick', this.tick);

    this.zoom = d3.behavior.zoom()
      .scaleExtent([.25, 15])
      .on('zoom', this.zoomed);

    // define arrows
    this.svg
      .append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('stroke-width', 1);

    this.svg.call(this.zoom);

    this.drag = this.force.drag()
      .on('dragstart', () => d3.event.sourceEvent.stopPropagation())
      .on('dragend', () => d3.event.sourceEvent.stopPropagation());

    // for keeping track of what is currently selected, etc.
    var statusVars = ['selectedNode', 'selectedEdge', 'mousedownEdge', 'mousedownNode', 'mouseupNode'];
    statusVars.forEach(st => {
      this[st] = null;
    });
    this.lastKeyDown = -1;

    // these two are a big deal
    this.path = this.svg.append('svg:g').selectAll('path');
    this.fo = this.svg.append('svg:g').selectAll('g');

    this.controls = d3.select('.controls')
      .style('left', this.svg.node().getBoundingClientRect().left + 20)
      .style('top', this.svg.node().getBoundingClientRect().top - 10);

    this.controls.select('.center-button')
      .on('click', () => {
        this.zoom.scale(1);
        this.zoom.translate([0, 0]);
        this.svg.selectAll('svg > g')
          .transition()
            .delay(0)
            .duration(250)
            .attr('transform', `translate(${this.zoom.translate()})scale(${this.zoom.scale()})`);
      })
  }

  /**
   * Called on each tick
   *   – applies custom forces
   *   - moves the edges and nodes to where they should be
   *  Requires this.svg, this.force, this.path and this.fo
   */
  tick (ev) {
    var self = this;
    // apply custom forces
    this.force.nodes().forEach((d) => {
      var edge = this.edges.filter(e => e.source == d)[0];
      // node's with no parents go to the center
      if (!edge) {
        d.x = this.svg.node().offsetWidth / 2;
        d.y = this.svg.node().offsetHeight / 2;
      }
    });

    // move edges
    this.path.attr('d', (d) => {
      let sourceX = d.source.x;
      let sourceY = d.source.y;

      let targetBox = d3.select(`[data-node-id="${d.target.id}"]`).node();

      let lineOrigin = {
        x: d.source.x,
        y: d.source.y
      };

      let rect = {
        x: d.target.x,
        y: d.target.y,
        w: d.target.depth ? this.scaleDepth(d.target.depth) * targetBox.offsetWidth : targetBox.offsetWidth,
        h: d.target.depth ? this.scaleDepth(d.target.depth) * targetBox.offsetHeight : targetBox.offsetHeight
      };

      let m = calcMovement(lineOrigin, rect);

      let targetX = d.target.x + m.dx;
      if (targetX > rect.x + rect.w / 2) targetX = rect.x + rect.w / 2;
      if (targetX < rect.x - rect.w / 2) targetX = rect.x - rect.w / 2;

      let targetY = d.target.y + m.dy;
      return `M${sourceX},${sourceY}L${targetX},${targetY}`;
    });

    // move nodes
    this.fo.attr('transform', function (d) {
      let div = d3.select(this).select('.node-box').node();

      // apply custom forces
      let k = ev.alpha * 15;
      let edgeFrom = self.edgesFromNode(d)[0];

      if (edgeFrom) {
        let angle = self.schema.angle(edgeFrom.type);
        d.x += Math.cos(angle / 180 * Math.PI) * k;
        d.y += Math.sin(angle / 180 * Math.PI) * k;
      }

      // find place
      let x = d.x - self.scaleDepth(d.depth) * (div.offsetWidth / 2);
      let y = d.y - self.scaleDepth(d.depth) * (div.offsetHeight / 2);

      return `translate(${x}, ${y})`;
    });
  }

  /**
   * Called each time there is a change to the data
   *   – formats the data
   *   - defines UPDATE, ENTER, and EXIT for this.path and this.fo
   *     - includes binding events on ENTER
   *  Requires this.svg, this.force, this.path, this.fo, this.edges, this.nodes
   */
  restart () {
    // replace ids with references to actual nodes
    this.edges.forEach(e => {
      if (typeof e.source == 'string') e.source = this.getNodeById(e.source);
      if (typeof e.target == 'string') e.target = this.getNodeById(e.target);
    });

    // set depth's on the nodes
    this.setDepths();

    // ------------------------------------------
    // ------- NODES: UPDATE, ENTER, EXIT -------
    // ------------------------------------------
    this.fo = this.fo.data(this.nodes, (d) => d.id );

    // UPDATE
    var self = this;
    this.fo.selectAll('foreignObject')
      .classed('reflexive', (d) => d.reflexive);

    // ENTER
    var g = this.fo.enter().append('svg:g');
    g.append('svg:foreignObject')
        .each(function (d) {
          self.renderNode(this, d);
        })
        .attr('height', setheight)
        .attr('width', setwidth)
        .on('mouseover', function (d) {
          self.onnodemouseover(this, d);
        })
        .on('mouseout', function (d) {
          self.onnodemouseout(this, d);
        }).attr('transform', (d) => {
          return `scale(${this.scaleDepth(d.depth)})`;
        });

    g.call(this.drag);

    // EXIT
    this.fo.exit().remove();

    // ------------------------------------------
    // ------- EDGES: UPDATE, ENTER, EXIT -------
    // ------------------------------------------
    this.path = this.path.data(this.edges);

    // UPDATE
    this.path
      .classed('selected', (d) => d === this.selectedEdge )
      .style('marker-end', 'url(#end-arrow)');

    // ENTER
    this.path.enter()
      .append('svg:path')
        .attr('class', 'edge')
        .classed('selected', (d) => d === this.selectedEdge )
        .style('stroke', (d) => this.schema.color(d.type) )
        .style('stroke-width', (d) => `${4 * this.scaleDepth(d.target.depth, 5)}px`)
        .style('marker-end', 'url(#end-arrow)')
        .on('mousedown', function (d) {
          self.onedgemousedown(this, d);
        });

    // EXIT
    this.path.exit().remove();

    // set the graph in motion
    this.force.start();
  }

  /**
   * --------------------------------------------------------------------------
   * ----------------------------- GLOBAL EVENTS ------------------------------
   * --------------------------------------------------------------------------
   */

  /**
   * Some complicated shit that will soon get more complicated
   */
  keydown () {
    d3.event.preventDefault();

    if (this.lastKeyDown !== -1) return;
    this.lastKeyDown = d3.event.keyCode;

    // ctrl
    if (d3.event.keyCode === 17) {
      this.svg.classed('ctrl', true);
    }

    if (!this.selectedNode && !this.selectedEdge) return;

    switch (d3.event.keyCode) {
      case 8: // backspace
      case 46: // delete
        if (this.selectedNode) {
          this.deleteNode(this.selectedNode);
        } else if (this.selectedEdge) {
          this.deleteEdge(this.selectedEdge);
        }
        this.selectedEdge = null;
        this.selectedNode = null;
        this.restart();
        break;
    }
  }

  /**
   * Same
   */
  keyup () {
    this.lastKeyDown = -1;

    // ctrl
    if (d3.event.keyCode === 17) {
      this.fo
        .on('mousedown.drag', null)
        .on('touchstart.drag', null);
      this.svg.classed('ctrl', false);
    }
  }

  /**
   * --------------------------------------------------------------------------
   * ----------------------------- EDGE FUNCTIONS -----------------------------
   * --------------------------------------------------------------------------
   */

  createEdge (edge) {
    edge.referenceType = this.type;
    edge.reference = this.item.id;
    if (!edge.type) edge.type = 'basic';

    edgeStore
      .create(edge)
      .then(body => {
        this.edges.push(body);
        this.restart();
      })
      .catch(err => {
        alert(err);
      });
  }

  deleteEdge (edge) {
    this.edges.splice(this.edges.indexOf(this.selectedEdge), 1);
    edgeStore
      .destroy(edge.id)
      .then(e => {
        log('Successfully deleted edge %s', e.id);
      })
      .catch(err => {
        // maybe put it back
        log(err);
      });
  }

  onedgemousedown (edge, d) {
    if (d3.event.ctrlKey) return;

    // select edge
    this.mousedownEdge = d;
    if (this.mousedownEdge === this.selectedEdge) {
      this.selectedEdge = null;
    } else {
      this.selectedEdge = this.mousedownEdge;
    }
    this.selectedNode = null;
    this.restart();
  }

  /**
   * --------------------------------------------------------------------------
   * ----------------------------- NODE FUNCTIONS -----------------------------
   * --------------------------------------------------------------------------
   */

  renderNode (node, d) {
    var options = {
      container: node,
      locals: {
        node: d
      }
    };

    options.locals.edgesTo = this.schema.edgesTo(node.type || 'basic');
    options.tick = this.tick;

    options.addNode = (data) => {
      this.createNodeWithEdge(data.node, data.edge);
    };

    new NodeCard(options);
  }

  createNodeWithEdge (node, edge) {
    node.referenceType = this.type;
    node.reference = this.item.id;
    if (!node.type) node.type = 'basic';

    this.restart();

    nodeStore
      .create(node)
      .then(body => {
        this.nodes.push(body);

        edge.source = body.id;
        this.createEdge(edge);
      })
      .catch(err => {
        log(err);
      });
  }

  createNode (data) {
    data.referenceType = this.type;
    data.reference = this.item.id;
    if (!data.type) data.type = 'basic';

    this.restart();

    nodeStore
      .create(data)
      .then(body => {
        this.nodes.push(body);
        this.restart();
      })
      .catch(err => {
        log(err);
      });
  }

  removeTempNode (node) {
    this.nodes.splice(this.nodes.indexOf(node), 1);
    this.restart();
  }

  deleteNode (node) {
    this.nodes.splice(this.nodes.indexOf(node), 1);
    var toSplice = this.edgesForNode(node);
    nodeStore
      .destroy(node.id)
      .then(() => {
        log('Successfully deleted node %s', node.id);
        toSplice.forEach(edge => {
          this.deleteEdge(edge);
        });
      })
      .err(err => {
        // maybe put the node back in?
        log(err);
      });
  }

  onnodemousedown (node, d) {
    if (d3.event.ctrlKey) return;

    // select node
    this.mousedownNode = d;
    if (this.mousedownNode === this.selectedNode) {
      this.selectedNode = null;
    } else {
      this.selectedNode = this.mousedownNode;
    }
    this.selectedEdge = null;

    // reposition drag line if and only if node has attribute `drag-from`
    // if (d3.select(node).select('.node-card').attr('chosen-name')) {
    //   this.dragLine
    //     .style('marker-end', 'url(#end-arrow)')
    //     .classed('hidden', false)
    //     .attr('d', `M${this.mousedownNode.x},${this.mousedownNode.y}L${this.mousedownNode.x},${this.mousedownNode.y}`);
    // }

    this.restart();
  }

  onnodemouseover (node, d) {
    if (!this.mousedownNode || d === this.mousedownNode) return;
    // enlarge target node
  }

  onnodemouseout (node, d) {
    if (!this.mousedownNode || d === this.mousedownNode) return;
    // unenlarge target node
  }

  edgesForNode (node) {
    var toSplice = this.edges.filter( l => (l.source === node || l.target === node) );
    return toSplice;
  }

  edgesToNode (node) {
    var edges = this.edges.filter(l => (l.target === node));
    return edges;
  }

  edgesFromNode (node) {
    var edges = this.edges.filter(l => (l.source === node));
    return edges;
  }

  getNodeById (id) {
    return this.nodes.filter(n => n.id == id)[0];
  }


  setDepths () {
    // INEFFICIENT - SHOULD BE REWRITTEN
    // set root to 0
    var r = this.nodes.filter(n => n.type == 'root')[0];
    r.depth = 0;

    while (this.nodes.filter(n => n.depth == null).length > 0) {
      var nodesCovered = this.nodes.filter(n => n.depth != null);

      nodesCovered.forEach(n => {

        var es = this.edgesToNode(n);
        es.forEach(e => {
          if (!e.source.depth) {
            e.source.depth = e.target.depth + 1;
          }
        });

      });

    }
  }

  zoomed () {
    this.svg.selectAll('svg > g').attr('transform', `translate(${d3.event.translate})scale(${d3.event.scale})`);
  }

  scaleDepth (depth) {
    if (!this.scale) {
      var extent = d3.extent(this.nodes.map(n => n.depth));
      extent[1] += 1;
      this.scale = d3.scale.linear()
        .domain(extent)
        .range([1, 0]);
    }
    return this.scale(depth);
  }
}

function setheight () {
  var nodeCard = d3.select(this).select('.node-card').node();
  var nodeBox = d3.select(this).select('.node-box');
  var height = nodeCard.offsetHeight;
  nodeBox.style(`height: ${height}`);
  return height;
}

function setwidth () {
  var nodeCard = d3.select(this).select('.node-card').node();
  var nodeBox = d3.select(this).select('.node-box');
  var width = nodeCard.offsetWidth;
  nodeBox.style(`width: ${width}`);
  return width;
}

function calcMovement(lineOrigin, rect) {
  var slope = (rect.y - lineOrigin.y) / (rect.x - lineOrigin.x);

  var hsw = slope * rect.w / 2;
  var hsh = ( rect.h / 2 ) / slope;

  var hh = rect.h / 2;
  var hw = rect.w / 2;

  if (-hh <= hsw && hsw <= hh) {
    // line intersects
    if (rect.x < lineOrigin.x) {
      //right edge;
      return {dx: hw, dy: (-1) * slope * hh};
    } else if (rect.x > lineOrigin.x) {
      //left edge
      return {dx: (-1) * hw, dy: (-1) * slope * hh};
    }
  }
  if ( -hw <= hsh && hsh <= hw) {
    if (rect.y < lineOrigin.y) {
      //top edge
      return {dx: hw / slope, dy: hh };
    } else if (rect.y > lineOrigin.y) {
      // bottom edge
      return {dx: (-1) * hw / slope, dy: (-1) * hh};
    }
  }
}
