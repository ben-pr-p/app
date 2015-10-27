var minMargins = 10;

function calculateAngles(edges, replies, priorityFn) {
  var byEdge = {};

  Object.keys(edges).forEach(e => {
    var matches = replies.filter(reply.type == e);

    if (matches.length > 0)
      byEdge[e] = matches;

    byEdge[e].sort(priorityFn);
  });

  var offset = 0;
  var sign = 1;
  Object.keys(byEdge).forEach(e => {
    byEdge[e].angle = e.angle + (offset * sign);

    offset += minMargins;
    sign *= -1;
  });
}

function calculateCoordinate(starting, distance, angle) {
  var hypotenuse = distance;
  var opposite = hypotenuse * Math.cos(angle);
  var adjacent = hypotenuse * Math.sin(angle);

  if ((opposite / adjacent) != Math.tan(angle)) {
    console.log('It seems as if trigonometry is a lie.');
  }

  return [starting[0] + adjacent, starting[1] + opposite];
}
