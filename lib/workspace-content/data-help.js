export default class DataHelp {
  constructor(platforms) {
    this.platforms = platforms;
  }

  dataForVenn() {
    var data = [];
    var keys = [];

    for (var i = this.platforms.length - 1; i >= 0; i--) {
      keys.push(i);

      data.push({
        sets: [this.platforms[i].id],
        label: this.platforms[i].mediaTitle,
        size: (this.platforms[i].opinions.length + 1)
      });
    }

    var overlaps = combinations(keys);

    for (var j = overlaps.length - 1; j >= 0; j--) {
      data.push({
        sets: overlaps[j].map( idx => { return this.platforms[idx].id } ),
        size: (intersection(overlaps[j].map( idx => { return this.platforms[idx].opinions } ), ['topicId', 'value']).length)
      });
    }

    return data;
  }

  opinionsFrom(arrayOfPlatIds) {
    var plats = arrayOfPlatIds.map(pId => {

      let matches = this.platforms.filter((plat, idx) => {
        return (plat.id == pId);
      });

      return matches[0];
    });

    return intersection(plats.map( p => { 
      return p.opinions;
    }), ['topicId', 'value']);
  }
  
}

/**
 * ARRAY MANIUPLATION FUNCTIONS
 */

/**
 * Returns only those elements that are in all arrays
 * @param  {Array of objects} arrays  [arrays to search through]
 * @param  {Array of strings} keys    [keys objects must match on]
 * @return {Array of objects}         [array of common objects]
 */
var intersection = function (arrays, keys) {

  return arrays[0].filter( element => {
    for (var i = arrays.length - 1; i >= 1; i--) {

      // returns whether the element exists in the other array
      let matches = arrays[i].filter( candidate => {
        // return true if values of all keys match
        for (var j = keys.length - 1; j >= 0; j--) {
          if (candidate[keys[j]] != element[keys[j]]) return false;
        }
        return true;

      });

      return (matches.length != 0);
  
    }
    return true;
  });
}

var combinations = function (set) {
  var k, i, combs, k_combs;
  combs = [];
  
  // Calculate all non-empty k-combinations
  for (k = 2; k <= set.length; k++) {
    k_combs = k_combinations(set, k);
    for (i = 0; i < k_combs.length; i++) {
      combs.push(k_combs[i]);
    }
  }
  return combs;
}

var k_combinations = function (set, k) {
  var i, j, combs, head, tailcombs;
  
  if (k > set.length || k <= 0) {
    return [];
  }
  
  if (k == set.length) {
    return [set];
  }
  
  if (k == 1) {
    combs = [];
    for (i = 0; i < set.length; i++) {
      combs.push([set[i]]);
    }
    return combs;
  }
    
  combs = [];
  for (i = 0; i < set.length - k + 1; i++) {
    head = set.slice(i, i+1);
    tailcombs = k_combinations(set.slice(i + 1), k - 1);
    for (j = 0; j < tailcombs.length; j++) {
      combs.push(head.concat(tailcombs[j]));
    }
  }
  return combs;
}
