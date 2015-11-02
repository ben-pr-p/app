import d3 from 'd3';
import view from '../view/mixin';
import config from '../config/config.js';
import template from './template.jade';
import Argument from './argument/argument.js';
import layout from './layout/layout';
import drStore from '../debate-room-store/debate-room-store.js';

/**
 * Ok Here's what I'm doing with coordinates.
 *
 * Coordinates will be stored with the center as [0, 0], and can be negative or positive in any direction
 * for any distance, even going far off of the screen
 * 
 * layout.transformCoordinatesToSvg will transform the absolute coordinates to the corresponding position
 * in the svg element
 *
 * layout.transformCoordinatesToScreen will transform the absolute coordinates to the corresponding
 * position on the client's screen
 */

export default class DebateRoom extends view('appendable', 'withEvents') {
  constructor (options) {
    options.template = template;
    super(options);

    layout.setSizes();
    this.type = options.type;
    this.item = options.item;
    this.renderedComments = {};
  }

  initialize () {
    drStore
    .ensureDebate(this.type, this.item.id)
    .then(debate => {
      this.debate = debate;

      drStore
      .getDebateType(debate.debateType)
      .then(debateType => {

        this.debateType = debateType;
        this.edges = {};

        this.debateType.linkTypes.forEach(lt => {
          this.edges[lt.name] = lt;
        });

        this.draw(this.debate);
      });
    });
  }

  draw (arg) {
    if (!arg.coordinates) {
      arg.coordinates = [0, 0];
    }

    var edgesFrom = this.debateType.linkTypes.filter(e => {
      var matches = e.from.filter(t => t.name == arg.type);
      return matches.length > 0;
    });

    this.drawArg(arg, 0, edgesFrom);

    // var angles = layout.calculateAngles(this.edges, arg.replies, priorityFunction);

    // arg.children.forEach(link => {
    //   var distance = distanceToReply(arg, reply);
    //   var angle = angles[reply.id];

    //   reply.coordinates = layout.calculateCoordinate(parentCoordinates, distance, angle);

    //   drawLine(parentCoordinates, replyCoordinates, this.edges[reply.type].color);
    //   draw(reply);
    // });
  }

  drawLine (from, to, color) {
    // TO DO
    
  }

  drawArg (arg, level, edgesFrom) {
    var a = new Argument(arg);
    a.render(arg.coordinates, level, edgesFrom);
  }

  navigateTo (id) {
    // TO DO
  }
}
