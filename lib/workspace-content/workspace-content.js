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

    o('window').on('resize', function (ev) { console.log('Caught event'); console.log(ev); } );
  }

  switchOn() {
    this.computeData();
    this.initializeDiagram();
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
  }

}

function formatData (platforms) {
  var data = [];
  var keys = [];

  for (var i = platforms.length - 1; i >= 0; i--) {
    keys.push(i);

    data.push({
      sets: [platforms[i].mediaTitle],
      size: (platforms[i].opinions.length + 1)
    });
  }

  var overlaps = combinations(keys);

  for (var j = overlaps.length - 1; j >= 0; j--) {
    data.push({
      sets: overlaps[j].map( idx => { return platforms[idx].mediaTitle } ),
      size: (intersection(overlaps[j].map( idx => { return platforms[idx].opinions } )).length)
    });
  }

  return data;
}

function intersection (arrays) {
  return arrays[0].filter( element => {

    for (var i = arrays.length - 1; i >= 1; i--) {
      if (arrays[i].indexOf(element) == -1) return false;
    }
    return true;

  });
}
