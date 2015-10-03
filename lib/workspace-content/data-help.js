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
        size: (intersection(overlaps[j].map( idx => { return this.platforms[idx].opinions } )).length)
      });
    }

    return data;
  }

  opinionsFrom(arrayOfPlatforms) {
    var platIdxs = arrayOfPlatforms.map(pId => {
      return this.platforms.filter((plat, idx) => {
        if (plat.id == pId)
          return idx;
      })[0]
    });

    return intersection(overlaps[j].map( idx => { return this.platforms[idx].opinions } ));
  }
  
}

/**
 * SIMPLE ARRAY MANIUPLATION FUNCTIONS
 */

var intersection = function (arrays) {
  return arrays[0].filter( element => {

    for (var i = arrays.length - 1; i >= 1; i--) {
      if (arrays[i].indexOf(element) == -1) return false;
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
