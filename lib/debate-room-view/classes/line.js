import view from '../view/mixin';
import d3 from 'd3';
import commentStore from '../comment-store/comment-store';

export default class Line {
  constructor(line) {
    this.line = line;
  }

  render (from, to, color) {
    // TO DO
    if (/* I am already rendered */) {
      this.update(coordinates, size);
      return /*something*/;
    }

    // RENDER ME FOR THE FIRST TIME
  }

  update (from, to, color) {
    // D3 SHIT
  }

}