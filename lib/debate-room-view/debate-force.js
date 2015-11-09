import d3 from 'd3';
import debateroomStore from '../debate-room-store/debate-room-store.js';
import nodeStore from '../debate-room-store/node-store.js';
import edgeStore from '../debate-room-store/edge-store.js';
import render from '../render/render';
import NodeCard from './node-card/view.js';
import debug from 'debug';

const log = debug('democracyos:admin-topics-form');
 
/**
 * TO DO:
 *   - zoom
 *   - arrows space correctly
 *   - custom forces / positioning
 *   - text labels
 *   - make author show up even on node creation
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
      'mousedown', 'mousemove', 'mouseup', 'keydown', 'keyup', 'resetMouseVars',                  // global event handlers
      'onnodemousedown', 'onnodemouseup', 'onnodemouseout', 'onnodemouseover',                    // node events
      'renderNode', 'createNode', 'removeTempNode', 'edgesForNode', 'deleteNode',                 // node functions
      'onedgemousedown', 'deleteEdge'                                                             // edge events
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

    this.svg
      .on('mousedown', this.mousedown)
      .on('mousemove', this.mousemove)
      .on('mouseup', this.mouseup);

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
        return 200 * scalingFactor(d.target.depth, 5);
      })
      .charge(-500)
      .gravity(0)
      .on('tick', this.tick);

    // define arrows
    this.svg
      .append('svg:defs')
      .append('svg:marker')
        .attr('id', 'start-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 4)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M10,-5L0,0L10,5');

    // define dragLine
    this.dragLine = this.svg
      .append('svg:path')
        .attr('class', 'edge dragline hidden')
        .attr('d', 'M0,0L0,0');

    // for keeping track of what is currently selected, etc.
    var statusVars = ['selectedNode', 'selectedEdge', 'mousedownEdge', 'mousedownNode', 'mouseupNode'];
    statusVars.forEach(st => {
      this[st] = null;
    });
    this.lastKeyDown = -1;

    // these two are a big deal
    this.path = this.svg.append('svg:g').selectAll('path');
    this.fo = this.svg.append('svg:g').selectAll('g');
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
      let deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 17 : 12,
        targetPadding = d.right ? 17 : 12,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
      return `M${sourceX},${sourceY}L${targetX},${targetY}`;
    });

    // move nodes
    this.fo.attr('transform', function (d) {
      let div = d3.select(this).select('.node-box').node();

      // apply custom forces
      let k = ev.alpha * 6;
      let edgeFrom = self.edgesFromNode(d)[0];

      if (edgeFrom) {
        let angle = self.schema.angle(edgeFrom.type)
        d.x += Math.cos(angle/180*Math.PI) * k;
        d.y += Math.sin(angle/180*Math.PI) * k;
      }

      // find place
      let x = d.x - scalingFactor(d.depth, 5) * (div.offsetWidth / 2);
      let y = d.y - scalingFactor(d.depth, 5) * (div.offsetHeight / 2);

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
    // ------- EDGES: UPDATE, ENTER, EXIT -------
    // ------------------------------------------
    this.path = this.path.data(this.edges);

    // UPDATE
    this.path
      .classed('selected', (d) => d === this.selectedEdge )
      .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '' )
      .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

    // ENTER
    this.path.enter()
      .append('svg:path')
        .attr('class', 'edge')
        .classed('selected', (d) => d === this.selectedEdge )
        .style('stroke', (d) => this.schema.color(d.type) )
        .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '' )
        .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
        .on('mousedown', function (d) {
          self.onedgemousedown(this, d);
        });

    // EXIT
    this.path.exit().remove();

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
      .attr('transform', (d) => {
        return `scale(${scalingFactor(d.depth, 5)})`;
      })
      .attr('height', setheight)
      .attr('width', setwidth)
      .on('mouseover', function (d) {
        self.onnodemouseover(this, d);
      })
      .on('mouseout', function (d) {
        self.onnodemouseout(this, d);
      })
      .on('mousedown', function (d) {
        d3.event.stopPropagation();
        self.onnodemousedown(this, d);
      })
      .on('mouseup', function (d) {
        self.onnodemouseup(this, d);
      }).call(this.force.drag);

    // EXIT
    this.fo.exit().remove();

    // set the graph in motion
    this.force.start();
  }

  /**
   * --------------------------------------------------------------------------
   * ----------------------------- GLOBAL EVENTS ------------------------------
   * --------------------------------------------------------------------------
   */

  /**
   * Called when svg's mousedown (click not on node or edge)
   * If not control key: create a new node (only in this.nodes)
   *   (actual db interaction will happen in this.fo.enter ... createNode)
   */
  mousedown () {
    this.svg.classed('active', true);

    if (d3.event.ctrlKey || this.mousedownNode || this.mousedownEdge) return;

    if (this.nodes.filter(n => n.id == 'new').length > 0) return;

    // insert new node at this point
    var point = d3.mouse(this.svg.node());

    var node = {
      id: 'new',
      reflexive: false,
      type: 'basic'
    };

    node.x = point[0];
    node.y = point[1];
    this.nodes.push(node);

    this.restart();
  }

  /**
   * Called whenever the mouse is moved
   * If a mouse was previously down on a node:
   *   move the dragline to the position
   */
  mousemove () {
    if (!this.mousedownNode) return;
    // update drag line
    this.dragLine.attr('d', `M${this.mousedownNode.x},${this.mousedownNode.y}L${d3.mouse(this.svg.node())[0]},${d3.mouse(this.svg.node())[1]}`);
    this.restart();
  }

  /**
   * Called whenever the mouse is picked up
   * If there's no mousedown node (node's mouseup has already been called):
   *   remove the dragline
   */
  mouseup () {
    if (this.mousedownNode) {
      // hide drag line
      this.dragLine
        .classed('hidden', true)
        .style('marker-end', '');
    }

    this.svg.classed('active', false);

    // clear mouse event vars
    this.resetMouseVars();
  }

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

  resetMouseVars () {
    this.mousedownNode = null;
    this.mouseupNode = null;
    this.mousedownEdge = null;
  }

  /**
   * --------------------------------------------------------------------------
   * ----------------------------- EDGE FUNCTIONS -----------------------------
   * --------------------------------------------------------------------------
   */
  
  createEdge (edge) {
    edge['right'] = true;
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
      .then(edge => {
        log('Successfully deleted edge %s', edge.id);
      })
      .catch(err => {
        // maybe put it back
        log(err);
      })
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

    options.addNode = (data) => {
      this.createNodeWithEdge(data.node, data.edge);
    }

    var el = new NodeCard(options);
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
      .then(body => {
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

  onnodemouseup (node, d) {
    if (!this.mousedownNode) return;

    // needed by FF
    this.dragLine
      .classed('hidden', true)
      .style('marker-end', '');

    // check for drag-to-self
    this.mouseupNode = d;
    if (this.mouseupNode === this.mousedownNode) {
      this.resetMouseVars();
      return;
    }

    // unenlarge target node
    d3.select(node).attr('transform', '');

    // add edge to graph
    var source = this.mousedownNode.id;
    var target = this.mouseupNode.id;
    var direction = 'right';

    var edge = this.edges.filter( l => (l.source === source && l.target === target))[0];

    if (edge) {
      // return this.restart();
    } else {
      edge = {
        source: source,
        target: target,
        left: false,
        right: false
      };

      edge[direction] = true;
      edge.referenceType = this.type;
      edge.reference = this.item.id;
      if (!edge.type) edge.type = 'basic';

      this.edges.push(edge);

      edgeStore
        .create(edge)
        .then(body => {
          this.edges.splice(this.edges.indexOf(edge), 1);
          this.edges.push(body);
          this.restart();
        })
        .catch(err => {
          alert(err);
        });
    }

    // select new edge
    this.selectedEdge = edge;
    this.selectedNode = null;
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
}

function setheight () {
  var nodeCard = d3.select(this).select('.node-card').node();
  var nodeBox = d3.select(this).select('.node-box');
  var height = nodeCard.offsetHeight ;
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

function scalingFactor (depth, r) {
  return 1 - (depth / r);
}
