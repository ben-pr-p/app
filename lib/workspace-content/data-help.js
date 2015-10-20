export default class DataHelp {
  constructor(platforms, backups) {
    this.backups = backups;
    this.platforms = platforms;
  }

  /**
   * Formats data according to the number of opinions in each platform and the number that overlap
   * If there are 0 opinions, sets it to 0.9. This 0.9 is caught in event help
   * It is 0.9 so that it looks similar to 1 (just a little smaller) but is still distinguishable from 1 when adding sublables
   * @return {Array of Objects} [each object has {Array} sets, {Number} size, and if only 1 set then {String} label]
   */
  dataForVenn() {
    var data = [];
    var keys = [];

    for (var i = this.platforms.length - 1; i >= 0; i--) {
      keys.push(i);

      var size = this.platforms[i].extendedOpinions.length;
      if (size == 0) size = 0.5;

      data.push({
        sets: [this.platforms[i].id],
        label: this.platforms[i].mediaTitle,
        size: size
      });
    }

    var overlaps = combinations(keys);

    for (var j = overlaps.length - 1; j >= 0; j--) {
      data.push({
        sets: overlaps[j].map( idx => { return this.platforms[idx].id } ),
        size: (intersection(overlaps[j].map( idx => { return this.platforms[idx].extendedOpinions } ), ['topicId', 'value']).length)
      });
    }
    return data;
  }

  /**
   * Returns opinions that are in all of the platforms with platIds in arrayOfPlatIds
   * @param  {Array} arrayOfPlatIds [array of plat ids]
   * @return {Array}                [array of opinions]
   */
  opinionsFrom(arrayOfPlatIds) {
    var plats = arrayOfPlatIds.map(pId => {

      let matches = this.platforms.filter((plat, idx) => {
        return (plat.id == pId);
      });

      return matches[0];
    });

    if (arrayOfPlatIds.length == 1) {
      var directOpinions = intersection(plats.map( p => {
        return p.directOpinions;
      }), ['topicId', 'value']);
      return [directOpinions, plats[0].platformTree];
    }

    var extendedOpinions = intersection(plats.map( p => {
      return p.extendedOpinions;
    }), ['topicId', 'value']);
    return [extendedOpinions, null];
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

      // el wasn't in array[i], shouldn't be in result
      if (matches.length == 0) return false;;
    }
    return true;
  });
}

/**
 * Taken from here: https://gist.github.com/axelpale/3118596 by ben-pr-p on October 6, 2015
 *
 * Copyright 2012 Akseli Palén.
 * Created 2012-07-15.
 * Licensed under the MIT license.
 * 
 * <license>
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
