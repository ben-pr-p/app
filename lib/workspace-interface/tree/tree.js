import d3 from 'd3';
import Diagram from '../diagram.js';
import render from '../../render/render.js';
import hoverTemplate from './hover.jade';

/**
 * TO DO:
 * 
 */

const sld = 200;
const topicBuffer = 100;

const topicRadius = 12;
const platformRadius = 30;

const colorMap = {
  'positive': '#a4cb53',
  'neutral': '#666',
  'negative': '#d95e59'
}

const color = d3.scale.category20();

export default class PlatformTree extends Diagram {
  constructor(options = {}) {
    super(options);

    ['refresh', 'filterActivePlatforms', 'initialize', 'onwindowresize', 'makeEdges', 'tick',
    'getNode', 'onNodeMouseDown', 'onNodeMouseUp', 'onMouseMove', 'onMouseUp', 'onNodeMouseOver',
    'onNodeMouseOut', 'onOptionMouseOver', 'onOptionClick', 'onTipMouseOut', 'onEdgeClick', 'onRemoveClick'].forEach(method => {
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
    var self = this;

    this.svg = d3.select(this.options.container).append('svg');
    this.svg
      .on('mousemove', function () {
        self.onMouseMove(this);
      })
      .on('mouseup', function () {
        self.onMouseUp(this);
      });

    this.nodes = this.activePlatforms.concat(this.topics);
    this.edges = this.makeEdges();

    // define the force layout
    this.force = d3.layout.force()
      .nodes(this.nodes)
      .links(this.edges)
      .size( [this.svg.node().offsetWidth, this.svg.node().offsetHeight] )
      .linkDistance(sld)
      .linkStrength(1)
      .charge(-500)
      .gravity(0.10)
      .on('tick', this.tick);

    // define the dragline
    this.dragLine = this.svg.append('svg:path')
      .attr('class', 'hidden')
      .attr('stroke', '#000')
      .attr('stroke-width', 4)
      .attr('d', 'M0,0L0,0');

    // define the tooltip
    this.tip = d3.select('#diagram-container').append('div')
      .classed('hide', true)
      .classed('tip-container', true)
      .html(render(hoverTemplate));

    // and its events
    this.tip.selectAll('a')
      .on('mouseover', function () {
        self.onOptionMouseOver(this);
      })
      .on('click', function () {
        self.onOptionClick(this);
      });

    this.tip.select('.remove-opinion').on('click', function () {
      self.onRemoveClick(this);
    });

    this.tip.on('mouseout', function () {
      self.onTipMouseOut(this);
    })

    // define the arrow
    this.svg.append('svg:defs')
      .append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-4.5L9,0L0,4.5')
        .attr('fill', '#000');

    // TO DO: add zooming, dragging, controls if any, update intervals
    this.path = this.svg.append('svg:g').selectAll('path');    
    this.circles = this.svg.append('svg:g').selectAll('g');

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

    this.filterActivePlatforms();

    var newNodes = this.activePlatforms.concat(this.topics);
    newNodes.forEach(newNode => {
      let oldNode = this.getNode({id: newNode.id});
      if (oldNode) {
        oldNode = newNode;
      } else {
        this.nodes.push(newNode);
      }
    });

    // remove old nodes
    this.nodes.filter(n => this.getNode({id: n.id}, newNodes) == null).forEach(toDelete => {
      this.nodes.splice(this.nodes.indexOf(toDelete, 1));
    });

    var newEdges = this.makeEdges();
    newEdges.forEach(newEdge => {
      let oldEdge = this.getEdge({source: newEdge.source.id, target: newEdge.target.id});
      if (oldEdge) {
        oldEdge = newEdge;
      } else {
        this.edges.push(newEdge);
      }
    });

    // remove old edges
    this.edges.filter(e => this.getEdge({source: e.source, target: e.target}, newEdges) == null).forEach(toDelete => {
      this.edges.splice(this.edges.indexOf(toDelete, 1));
    });

    var self = this;

    // ------------------------------------------
    // ------- NODES: UPDATE, ENTER, EXIT -------
    // ------------------------------------------
    self.circles = self.circles.data(self.nodes, (d) => {
      return d.id;
    });

    // UPDATE (nothing yet!)
    
    // ENTER
    var g = self.circles.enter().append('svg:g')
    g.append('svg:circle')
      .attr('data-id', d=> d.id)
      .attr('r', d => d.type == 'topic' ? topicRadius : platformRadius)
      .attr('fill', (d, i) => d.color || color(i))
      .attr('stroke', (d, i) => d.color || color(i))
      .attr('stroke-width', 2)
      .attr('fill-opacity', 0.6)
      .on('mouseover', function (d) {
        self.onNodeMouseOver(this, d);
      })
      .on('mouseout', function (d) {
        self.onNodeMouseOut(this, d);
      })
      .on('mousedown', function (d) {
        self.onNodeMouseDown(this, d);
      })
      .on('mouseup', function (d) {
        self.onNodeMouseUp(this, d);
      });

    g.append('svg:text')
      .text(d => d.mediaTitle)
      .attr('transform', (d) => {
        if (d.type == 'topic')
          return `translate(${(-1) * topicRadius / 2}, ${topicRadius * 2 + 5})`;

        return `translate(${platformRadius + 5}, ${0})`;
      });
      // TO DO: aesthetics
    
    // EXIT
    self.circles.exit().remove();

    // ------------------------------------------
    // ------- NODES: UPDATE, ENTER, EXIT -------
    // ------------------------------------------
    self.path = self.path.data(self.edges);

    // UPDATE (nothing yet!)

    // ENTER
    self.path.enter()
      .append('svg:path')
        .attr('data-id', d => `${d.source.id}-${d.target.id}`)
        .attr('stroke-width', 4)
        .attr('stroke', d => colorMap[d.value])
        .style('marker-end', 'url(#end-arrow)')
        .on('click', function (d) {
          self.onEdgeClick(this, d);
        });
      // TO DO: stroke width, classes, etc.
    
    // EXIT
    self.path.exit().remove();

    self.force.start();
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
      var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = platformRadius,
        targetPadding = topicRadius + 5,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
      return `M${sourceX},${sourceY}L${targetX},${targetY}`;
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
    this.activePlatforms.forEach(p => {
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

  getNode (query, nodes = this.nodes) {
    return nodes.filter(n => {
      for (var key in query) {
        if (n[key] != query[key]) return false;
      }
      return true;
    })[0];
  }

  getEdge (query, edges = this.edges) {
    return edges.filter(e => {
      for (var key in query) {
        if (e[key] != query[key]) return false;
      }
      return true;
    })[0];
  }

  onNodeMouseOver (node, d) {
    if (this.startPlatform && (this.startPlatform != d) && (d.type == 'topic')) {
      // initialize hover with the vote options
      var box = this.tip.node();

      this.tip
        .classed('hide', false)
        .style('left', d.x - (box.offsetWidth / 2)).style('top', d.y + (box.offsetHeight / 2));

      this.tip.select('.remove-opinion').classed('hide', true);
      this.tip.select('.opinion-option-container').style('width', '80px');

      this.endTopic = d;

      if (this.selectedEdge) return;

      var existingEdge = this.getEdge({source: this.startPlatform, target: this.endTopic});
      if (existingEdge) {
        this.dragLine.classed('hidden', true);
        this.onEdgeClick(null, existingEdge);
      }
    }
  }

  onNodeMouseOut (node, d) {
    // this.tip.classed('hide', true);
  }

  onNodeMouseDown (node, d) {
    if (d.type == 'topic') return;
    this.selectedEdge = null;
    this.endTopic = null;

    this.startPlatform = d;

    this.dragLine
      .classed('hidden', false)
      .attr('stroke', '#000')
      .attr('d', `M${d.x},${d.y}L${d.x},${d.y}`);
  }

  onNodeMouseUp (node, d) {

  }

  onMouseMove (container) {
    if (!this.startPlatform) return;

    var c = d3.mouse(container);
    this.dragLine.attr('d', `M${this.startPlatform.x},${this.startPlatform.y}L${c[0]},${c[1]}`);
  }

  onMouseUp (container) {
    if (!this.startPlatform) return;

    if (this.startPlatform && !d3.event.defaultPrevented) {
      this.dragLine
        .classed('hidden', true)
        .attr('d', 'M0,0L0,0');

      this.startPlatform = null;
      this.endTopic = null;
      this.selectedEdge = null;
      this.tip.classed('hide', true);
    }
  }

  onOptionMouseOver (option) {
    var opt = d3.select(option);
    var color = '#000';

    if (opt.classed('yes')) color = colorMap.positive;
    if (opt.classed('abstain')) color = colorMap.neutral;
    if (opt.classed('no')) color = colorMap.negative;

    if (!this.selectedEdge)
      this.dragLine.attr('stroke', color);

    if (this.selectedEdge) {
      let id = `${this.selectedEdge.source.id}-${this.selectedEdge.target.id}`;
      d3.select(`[data-id="${id}"]`).attr('stroke', color);
    }
  }

  onTipMouseOut (option) {
    if (!this.selectedEdge)
      this.dragLine.attr('stroke', '#000');

    if (this.selectedEdge) {
      let id = `${this.selectedEdge.source.id}-${this.selectedEdge.target.id}`;
      d3.select(`[data-id="${id}"]`).attr('stroke', colorMap[this.selectedEdge.value]);
    }
  }

  onOptionClick (option) {
    var opt = d3.select(option);
    var value = null;

    if (opt.classed('yes')) value = 'positive';
    if (opt.classed('abstain')) value = 'neutral';
    if (opt.classed('no')) value = 'negative';

    this.addOpinion(this.startPlatform.id, this.endTopic.id, value);
  }

  onEdgeClick (edge, d) {
    d3.event.preventDefault();

    if (this.selectedEdge === d) {
      ['selectedEdge', 'startPlatform', 'endTopic'].forEach(m => this[m] = null);
      this.tip.classed('hide', true);
      return;
    }

    this.selectedEdge = d;
    this.startPlatform = d.source;
    this.onNodeMouseOver(null, d.target);
    this.tip.select('.remove-opinion').classed('hide', false);
    this.tip.select('.opinion-option-container').style('width', '100px');
  }

  onRemoveClick (option) {
    this.removeOpinion(this.startPlatform.id, this.endTopic.id);
  }

}

