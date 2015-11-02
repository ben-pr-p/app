import d3 from 'd3';

var minMargins = 10;

class Layout {
  constructor() {
    // this.setSizes();
  }

  setSizes () {
    this.bcr = d3.select('svg').node().getBoundingClientRect();
  }

  coordinatesToSvg (coordinates) {
    var svgCenter = [this.bcr.width / 2, this.bcr.height / 2];
    var adjusted = [svgCenter[0] + coordinates[0], svgCenter[1] + coordinates[1]];
    return adjusted;
  }

  calculateCoordinates (starting, distance, angle) {
    var hypotenuse = distance;
    var opposite = hypotenuse * Math.cos(toRadians(angle));
    var adjacent = hypotenuse * Math.sin(toRadians(angle));

    return [starting[0] + opposite, starting[1] + adjacent];
  }

  calculateAngles (edges, replies, priorityFn) {
    var byEdge = {};

    Object.keys(edges).forEach(e => {
      var matches = replies.filter(reply.type == e);

      if (matches.length > 0)
        byEdge[e] = matches;

      byEdge[e].sort(priorityFn);
    });

    var offset = 10;
    var sign = 1;
    Object.keys(byEdge).forEach(e => {
      byEdge[e].angle = e.angle + (offset * sign);

      if (sign < 1) offset += minMargins;
      sign *= -1;
    });
  }

}

export default new Layout();

function toRadians (angle) {
  return angle * (Math.PI / 180);
}
