import Store from '../store/store';

class OpinionStore extends Store {
  name () {
    return 'opinion';
  }
}

export default new OpinionStore;
