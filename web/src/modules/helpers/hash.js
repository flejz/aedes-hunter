'use strict';

module.exports = {

  // Merge two different objects (i.e. associative arrays), copying
  // attributes from obj2 into obj1 when the specified attribute is
  // not present in obj1.
  //
  // Any value already present in obj1 WILL NOT be overrided by the
  // value in obj2 of the same key.
  //
  // This functions is intened to use when one needs to specify
  // default parameters for an `options` object that could possibly
  // be overrided.
  //
  // Ex.:
  //   obj1 {
  //     firstValue: 1,
  //     secondValue: 2
  //   }
  //   obj2 {
  //     secondValue:3,
  //     thirdValue: 3
  //   }
  //
  //   `merge(obj1, obj2)`:
  //   {
  //     firstValue: 1,
  //     secondValue: 2,
  //     thirdValue: 3
  //   }

  merge: function(obj1, obj2) {

    if (obj1 === 'undefined' || obj2 === 'undefined') {
      throw new Error('You must suply two objects for the merge function');
    }

    let obj1Clone = JSON.parse(JSON.stringify(obj1));

    for (let property in obj2) {
      if (!obj1Clone.hasOwnProperty(property)) {
        obj1Clone[property] = obj2[property];
      }
    }
    return obj1Clone;
  }
};
