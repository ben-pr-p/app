import template from './content-template.jade';
import View from '../view/view.js';
import urlBuilder from '../url-builder/url-builder';
import o from 'component-dom';

import d3 from 'd3';
import venn from './venn.js';
import combinations from './combinations.js';

export default class Workspace extends View {
  constructor(platforms, forum) {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });

    this.platforms = platforms;

    this.chart = venn.VennDiagram();
    this.data = [];

    this.initializeDiagram = this.initializeDiagram.bind(this);

  }

  switchOn() {
    this.computeData();
    this.initializeDiagram();
    window.onresize = this.initializeDiagram;
  }

  computeData () {
    this.data = formatData(this.platforms);
  }

  initializeDiagram() {
    var vd = o('#venn-diagram')[0];
    var chartHeight = vd.offsetHeight;
    var charWidth = vd.offsetWidth;

    this.chart.height(chartHeight).width(charWidth);

    d3.select('#venn-diagram').datum(this.data).call(this.chart);
    d3.selectAll('.venn-circle').on('mouseover', mouseoverFunction).on('mouseout', mouseoutFunction);
  }

}

var formatData = function (platforms) {
  var data = [];
  var keys = [];

  for (var i = platforms.length - 1; i >= 0; i--) {
    keys.push(i);

    data.push({
      sets: [i],
      label: platforms[i].mediaTitle,
      size: (platforms[i].opinions.length + 1)
    });
  }

  var overlaps = combinations(keys);

  for (var j = overlaps.length - 1; j >= 0; j--) {
    data.push({
      sets: overlaps[j],
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

var mouseoverFunction = function () {
  var g = d3.select(this);
  var circle = d3.select(g[0][0].children[0]);
  var text = d3.select(g[0][0].children[1]);

  var fillColor = circle.style('fill');
  circle.attr('stroke', fillColor);
  circle.transition().style('stroke-width', 4).style('fill-opacity', .4);
  text.transition().style('font-weight', 'bold');
}

var mouseoutFunction = function () {
  var g = d3.select(this);
  var circle = d3.select(g[0][0].children[0]);
  var text = d3.select(g[0][0].children[1]);

  circle.transition().attr('stroke', 'none').style('fill-opacity', .25);
  text.transition().style('font-weight', 'normal');
}
