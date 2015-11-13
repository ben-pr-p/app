import d3 from 'd3';
import bus from 'bus';
import nodeStore from '../debate-room-store/node-store.js';
import edgeStore from '../debate-room-store/edge-store.js';
import NodeCard from './node-card/view.js';
import debug from 'debug';
const log = debug('democracyos:admin-topics-form');

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
      'launch', 'initialize', 'tick', 'restart',
      'keydown', 'keyup', 'calcIdeal',
      'renderNode', 'createNodeWithEdge', 'removeTempNode', 'edgesForNode', 'deleteNode',
      'onedgemousedown', 'deleteEdge',
      'zoomed', 'smoothZoomed', 'onsearchclick', 'onsearchchange'
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

    d3.select(window)
      .on('keydown', this.keydown)
      .on('keyup', this.keyup);

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
        return 400 * this.scaleDepthStrong(d.source.depth);
      })
      .linkStrength(1)
      .charge(-1000)
      .gravity(0)
      .on('tick', this.tick);

    this.zoom = d3.behavior.zoom()
      .scaleExtent([.25, 15])
      .center(null)
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
        .attr('fill', '#000');

    this.svg.call(this.zoom).on('dblclick.zoom', null);

    this.drag = this.force.drag()
      .on('dragstart', function () {
        d3.event.sourceEvent.stopPropagation();
      })
      .on('dragend', function () {
        d3.event.sourceEvent.preventDefault();
        d3.event.sourceEvent.stopPropagation();
      });

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
        this.smoothZoomed();
      });

    this.controls.select('.search-button')
      .on('click', this.onsearchclick)
      .on('keyup', this.onsearchchange);

    bus.on('debate:stop', () => {
      this.force.stop();
    });

  }

  /**
   * Called on each tick
   *   – applies custom forces
   *   - moves the edges and nodes to where they should be
   *  Requires this.svg, this.force, this.path and this.fo
   */
  tick (ev) {
    var self = this;
    // apply custom node based forces
    this.force.nodes().forEach((d) => {
      let edgeFrom = self.edgesFromNode(d)[0];
      // node's with no parents go to the center
      if (!edgeFrom) {
        d.x = this.svg.node().offsetWidth / 2;
        d.y = this.svg.node().offsetHeight / 2;
      }

      // apply custom forces
      let k = (ev) ? 30 * ev.alpha : 0;

      if (edgeFrom) {
        let angle = self.schema.angle(edgeFrom.type);
        d.x += Math.cos(angle / 180 * Math.PI) * k;
        d.y += Math.sin(angle / 180 * Math.PI) * k;
      }

      d.x = d.ix;
      // d.y = d.iy;
    });

    // move edges
    this.path.attr('d', (d) => {
      let sourceX = d.source.x;
      let sourceY = d.source.y;

      // adjust line for destination
      let targetBox = d3.select(`[data-node-id="${d.target.id}"]`).node();

      let lineSource = {
        x: d.source.x,
        y: d.source.y
      };

      let targetRect = {
        x: d.target.x,
        y: d.target.y,
        w: d.target.depth ? this.scaleDepthWeak(d.target.depth) * targetBox.offsetWidth : targetBox.offsetWidth,
        h: d.target.depth ? this.scaleDepthWeak(d.target.depth) * targetBox.offsetHeight : targetBox.offsetHeight
      };

      let m = calcTargetMovement(lineSource, targetRect);

      let targetX = d.target.x + m.dx;
      if (targetX > targetRect.x + targetRect.w / 2) targetX = targetRect.x + targetRect.w / 2;
      if (targetX < targetRect.x - targetRect.w / 2) targetX = targetRect.x - targetRect.w / 2;
      let targetY = d.target.y + m.dy;

      return `M${sourceX},${sourceY}L${targetX},${targetY}`;
    });

    // move nodes
    this.fo.attr('transform', function (d) {
      let div = d3.select(this).select('.node-box').node();

      // find place
      let x = d.x - self.scaleDepthWeak(d.depth) * (div.offsetWidth / 2);
      let y = d.y - self.scaleDepthWeak(d.depth) * (div.offsetHeight / 2);
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

    var r = this.nodes.filter(n => n.type == 'root')[0];
    this.calcIdeal(r);

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
        .attr('transform', (d) => {
          return `scale(${this.scaleDepthWeak(d.depth)})`;
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
        .style('opacity', 0.6)
        .style('stroke-width', (d) => `${4 * this.scaleDepthWeak(d.target.depth)}px`)
        .style('marker-end', 'url(#end-arrow)')
        .on('mousedown', function (d) {
          self.onedgemousedown(this, d);
        })
      .append('svg:text')
        .classed('selected', (d) => d === this.selectedEdge )
        .attr('text-anchor', 'middle')
        .text((d) => d.type);

    // EXIT
    this.path.exit().remove();

    this.fo.sort((a, b) => {
      if (a.depth < b.depth) return 1;
      if (a.depth > b.depth) return -1;
      return 0;
    });

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
    if (this.lastKeyDown !== -1) return;
    this.lastKeyDown = d3.event.keyCode;

    switch (d3.event.keyCode) {
      case 37: // left arrow
      case 38: // up arrow
      case 39: // right arrow
      case 40: // down arrow
    }
  }

  /**
   * Same
   */
  keyup () {
    this.lastKeyDown = -1;
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
        log(err);
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
    var el = new NodeCard(options);

    el.addNode = (data) => {
      this.createNodeWithEdge(data.node, data.edge);
    };

    el.zoomToMe = () => {
      var scale = 1 / this.scaleDepthWeak(d.depth);
      this.zoom.scale(scale);
      this.zoom.translate([this.svg.node().offsetWidth / 2 - (d.x * scale), this.svg.node().offsetHeight / 2 - (d.y * scale)]);
      this.smoothZoomed();
      d3.select(node.parentNode).moveToFront();
    };

    el.moveMeUp = () => {
      d3.select(node.parentNode).moveToFront();
    }

    el.tick = this.tick;
  }

  createNodeWithEdge (node, edge) {
    node.referenceType = this.type;
    node.reference = this.item.id;
    if (!node.type) node.type = 'basic';

    this.restart();

    nodeStore
      .create(node)
      .then(body => {

        nodeStore
          .findOne(body.id)
          .then(result => {
            this.nodes.push(result);

            edge.source = result.id;
            this.createEdge(edge);
          })
          .catch(err => {
            log(err);
          });

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
        log(err);
      });
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

  smoothZoomed () {
    this.svg.selectAll('svg > g')
      .transition()
        .delay(0)
        .duration(1000)
        .attr('transform', `translate(${this.zoom.translate()})scale(${this.zoom.scale()})`);
  }

  scaleDepthWeak (depth) {
    if (!this.weakScale) {
      var extent = d3.extent(this.nodes.map(n => n.depth));
      extent[1] += 4;
      this.weakScale = d3.scale.linear()
        .domain(extent)
        .range([1, 0]);
    }
    return this.weakScale(depth);
  }

  scaleDepthStrong (depth) {
    if (!this.strongScale) {
      var extent = d3.extent(this.nodes.map(n => n.depth));
      this.strongScale = d3.scale.pow()
        .domain(extent)
        .range([1, 0]);
    }
    return this.strongScale(depth);
  }

  onsearchclick () {
    var input = this.controls.select('.search-button').select('input');
    if (d3.select(d3.event.target).node() == input.node()) return;

    if (input.classed('hide')) {
      input.classed('hide', false);
    } else {
      input.classed('hide', true);
      input.node().value = '';
      this.onsearchchange();
    }
  }

  onsearchchange () {
    var contents = this.controls.select('.search-button').select('input').node().value;

    if (contents != '') {
      var words = contents.split(' ');

      var matches = this.fo.filter(function (d) {
        var tosearch = (`${d.body} ${(d.itemTitle || (d.itemAuthor || d.author.displayName))}`).toLowerCase();
        var good = true;
        words.forEach(w => {

          if (tosearch.indexOf(w.toLowerCase()) < 0) good = false;
        });

        return good;
      });

      this.path.style('opacity', 0.05);

      this.fo.style('opacity', 0.2);
      matches.style('opacity', 1);
      matches.select('.node-card').classed('selected', true);
    }

    if (contents == '') {
      this.path.style('opacity', 0.6);
      this.fo.style('opacity', 1);
      this.fo.select('.node-card').classed('selected', false);
    }
  }

  calcIdeal (node) {
    // apply custom node based forces
    let edgeFrom = this.edgesFromNode(node)[0];
    // node's with no parents go to the center
    if (!edgeFrom) {
      node.ix = this.svg.node().offsetWidth / 2;
      node.iy = this.svg.node().offsetHeight / 2;
    }

    // apply custom forces
    if (edgeFrom) {
      let p = edgeFrom.target;
      let angle = this.schema.angle(edgeFrom.type);

      node.ix = p.ix + Math.cos(angle / 180 * Math.PI) * 400 * this.scaleDepthWeak(node.depth);
      node.iy = p.iy + Math.sin(angle / 180 * Math.PI) * 400 * this.scaleDepthWeak(node.depth); 
      console.log(node.ix);     
    }

    this.edgesToNode(node).forEach(e => {
      this.calcIdeal(e.source);
    });
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

function calcTargetMovement(lineOrigin, rect) {
  var slope = (rect.y - lineOrigin.y) / (rect.x - lineOrigin.x);

  var hsw = slope * rect.w / 2;
  var hsh = ( rect.h / 2 ) / slope;

  var hh = rect.h / 2;
  var hw = rect.w / 2;

  if (-hh <= hsw && hsw <= hh) {
    // line intersects
    if (rect.x < lineOrigin.x) {
      //right edge;
      return {dx: hw, dy: slope * hh};
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

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};
