import view from '../view/mixin';
import config from '../config/config.js';
import template from './template.jade';

import commentStore from '../comment-store/comment-store';

class DebateRoom extends view('appendable', 'withEvents') {
  constructor (type, item, path) {
    this.type = type;
    this.item = item;
    this.renderedComments = {};
  }

  draw (comment) {
    if (!comment.coordinates) {
      comment.coordinates = [0, 0];
    }

    drawComment(comment, null);

    var angles = calculateAngles(edges, comment.replies, priorityFunction);

    comment.replies.forEach(reply => {
      var distance = distanceToReply(comment, reply);
      var angle = angles[reply.id];

      reply.coordinates = calculateCoordinate(parentCoordinates, distance, angle);

      drawLine(parentCoordinates, replyCoordinates, edges[reply.type].color);
      draw(reply);
    });
  }

  drawLine (from, to, color) {
    // TO DO
    
  }

  drawComment (comment, parent) {
    // use the sizeFunction
    
    if (!parent) {
      // BASE CONDITIONS – what should it look like?
    }

    if (this.renderedComments[comment.id]) {
      // GROW IT – don't draw it from scratch
    }
  }

  navigateTo (id) {
    // TO DO
  }
}

export default new DebateRoom();
