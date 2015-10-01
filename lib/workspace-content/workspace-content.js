import d3 from 'd3';
import o from 'component-dom';
import bus from 'bus';

import template from './content-template.jade';
import View from '../view/view.js';
import urlBuilder from '../url-builder/url-builder';
import venn from './venn.js';
import combinations from './combinations.js';

export default class Workspace extends View {
  constructor(platforms, forum) {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });

    this.platforms = platforms;
    this.activePlatforms = [];

    this.chart = venn.VennDiagram();
    this.div = null;
    this.data = [];

    this.refreshDiagram = this.refreshDiagram.bind(this);
    this.filterActivePlatforms = this.filterActivePlatforms.bind(this);
    this.computeData = this.computeData.bind(this);
    this.initializeDiagram = this.initializeDiagram.bind(this);
  }

  switchOn() {
    this.refreshDiagram();
    window.onresize = this.initializeDiagram;
    bus.on('platform-filter:active', this.refreshDiagram);
  }

  refreshDiagram () {
    this.filterActivePlatforms();
    this.computeData();
    this.initializeDiagram();
  }

  computeData () {
    this.data = formatData(this.activePlatforms);
  }

  initializeDiagram() {
    if (this.data.length > 0) {
      // set size to size of svg container
      var vd = o('#venn-diagram')[0];
      var chartHeight = vd.offsetHeight;
      var charWidth = vd.offsetWidth;
      this.chart.height(chartHeight).width(charWidth);

      d3.select('#venn-diagram').datum(this.data).call(this.chart);

      // add hover for circles
      d3.selectAll('.venn-circle').on('mouseover', circleMouseover).on('mouseout', circleMouseout);

      // add hover for intersections
      d3.selectAll('.venn-intersection').on('mouseover', intersectionMouseover).on('mouseout', intersectionMouseout);

      // d3.selectAll("g").transition("venn").each("end", annotateSizes).duration(0);
      debugger;
      this.annotateSizes();
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

  annotateSizes () {
    d3.selectAll('g')
      .select("text")
      .append("tspan")
      .text(function(d) { return d.size + " items"; })
      .attr("x", function() { return d3.select(this.parentNode).attr("x"); })
      .attr("dy", "1.5em")
      .style("fill", "#666")
      .style("font-size", "13px");
  }

}

var formatData = function (platforms) {
  var data = [];
  var keys = [];

  for (var i = platforms.length - 1; i >= 0; i--) {
    keys.push(i);

    data.push({
      sets: [platforms[i].id],
      label: platforms[i].mediaTitle,
      size: (platforms[i].opinions.length + 1)
    });
  }

  var overlaps = combinations(keys);

  for (var j = overlaps.length - 1; j >= 0; j--) {
    data.push({
      sets: overlaps[j].map( idx => { return platforms[idx].id } ),
      size: (intersection(overlaps[j].map( idx => { return platforms[idx].opinions } )).length)
    });
  }

  return data;
}

var intersection = function (arrays) {
  return arrays[0].filter( element => {

    for (var i = arrays.length - 1; i >= 1; i--) {
      if (arrays[i].indexOf(element) == -1) return false;
    }
    return true;

  });
}

var circleMouseover = function (d, i) {
  venn.sortAreas(d3.select('#venn-diagram'), d); 

  var g = d3.select(this);
  var circle = d3.select(g[0][0].children[0]);
  var text = d3.select(g[0][0].children[1]);

  var fillColor = circle.style('fill');
  circle.attr('stroke', fillColor);
  circle.transition().style('stroke-width', 4).style('fill-opacity', .4);
  text.transition().style('font-weight', 'bold');
}

var circleMouseout = function (d, i) {
  var g = d3.select(this);
  var circle = d3.select(g[0][0].children[0]);
  var text = d3.select(g[0][0].children[1]);

  circle.transition().attr('stroke', 'none').style('fill-opacity', .25);
  text.transition().style('font-weight', 'normal');
}

var intersectionMouseover = function (d, i) {
  venn.sortAreas(d3.select('#venn-diagram'), d); 

  var g = d3.select(this);
  var section = d3.select(g[0][0].children[0]);
  var text = d3.select(g[0][0].children[1]);

  var fillColor = section.style('fill');
  section.attr('stroke', fillColor);
  section.transition().style('fill-opacity', .15);
  text.transition().style('font-weight', 'bold');
}

var intersectionMouseout = function (d, i) {
  var g = d3.select(this);
  var section = d3.select(g[0][0].children[0]);
  var text = d3.select(g[0][0].children[1]);

  section.transition().attr('stroke', 'none').style('fill-opacity', 0);
  text.transition().style('font-weight', 'normal');
}
