import view from '../view/mixin';
import d3 from 'd3';
import commentStore from '../comment-store/comment-store';

export default class Comment {
  constructor(comment) {
    this.comment = comment;
  }

  render (coordinates, size) {
    // TO DO
    if (/* I am already rendered */) {
      this.update(coordinates, size);
      return /*something*/;
    }

    // RENDER ME FOR THE FIRST TIME
  }

  update (coordinates, size) {
    // D3 SHIT
  }

}