module.exports = {
  'alphabetical': {
    name: 'alphabetical',
    label: 'sorts.alphabetical',
    sort: function (a, b) {
      // Alphabetical order
      if (a.mediaTitle < b.mediaTitle) return -1;
      if (a.mediaTitle > b.mediaTitle) return 1;
      return 0;
    }
  }
};
