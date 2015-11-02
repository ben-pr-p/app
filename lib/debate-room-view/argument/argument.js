import d3 from 'd3';
import o from 'component-dom';
import render from '../../render/render.js';
import template from './template.jade';
import newReplyTemplate from './new-reply.jade';
import layout from '../layout/layout.js';

var levelMap = {
  '0': 'primary',
  '1': 'secondary',
  '2': 'tertiary'
}

export default class Argument {
  constructor(argument) {
    this.argument = argument;
  }

  render (coordinates, level, edgesFrom) {
    // if (this.argContainer) {
    //   this.update(coords, level);
    //   return /*something*/;
    // }

    var el = render(template, {
      type: levelMap[level.toString()],
      argument: this.argument
    });

    o('.debate-room-container').append(el);

    var coords = layout.coordinatesToSvg(coordinates);

    var rect = d3.select('[data-id="' + this.argument.id + '"]');
    var rectRect = rect.node().getBoundingClientRect();

    rect.style('left', `${(coords[0] - (rectRect.width / 2))}px`).style('top', `${coords[1]}px`);

    var dist = (rect.node().getBoundingClientRect().width / 2) + 30;

    edgesFrom.forEach(edge => {

      var edgeEl = render(newReplyTemplate, {
        type: edge.name,
        id: this.argument.id,
        color: edge.color
      });

      o('.debate-room-container').append(edgeEl);

      var plus = d3.select(`[data-type="${edge.name}"][data-id="${this.argument.id}"]`);
      var plusRect = plus.node().getBoundingClientRect();

      var nrCoords = layout.calculateCoordinates(coords, dist, edge.angle);
      plus.style('left', `${nrCoords[0] - 13}px`).style('top', `${nrCoords[1] + (rectRect.height / 2) - 13}px`);
    });
  }

  update (coordinates, size, edgesFrom) {
    // D3 SHIT
  }

}
