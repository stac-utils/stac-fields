const Formatters = require('./formatters');
const _ = require('./helper');

const Normalize = {

  fields(fields) {
    let parts = ['extensions', 'metadata', 'links', 'assets'];
    for (let part of parts) {
      for(let key in fields[part]) {
        fields[part][key] = Normalize.field(fields[part][key], fields[part]);
      }
    }
    return fields;
  },

  field(spec, fields = {}) {
    // If just a string label is given, make a normal object with a label from it
    if (typeof spec === 'string') {
      return {
        label: spec
      };
    }
    // Resolve alias
    if (typeof spec.alias === 'string') {
      // As we don't know whether the alias has been resolved so far, resolve it here, too.
      return Object.assign(spec, Normalize.field(fields[spec.alias], fields));
    }

    // Add formatting callback as `formatter`
    if (typeof spec.format === 'string') {
      spec.formatter = Formatters[`format${spec.format}`];
    }

    // Normalize items
    if (_.isObject(spec.items)) {
    let itemOrder = [];
      for(let key in spec.items) {
        spec.items[key] = Normalize.field(spec.items[key], fields);
        itemOrder.push(Object.assign({key}, spec.items[key]));
      }

      spec.itemOrder = itemOrder
        .sort((i1, i2) => {
          if (i1.id === true) {
            return -1;
          }
          else if (i2.id === true) {
            return 1;
          }
          else if (typeof i1.order === 'number' && typeof i2.order === 'number') {
            return i1.order - i2.order;
          }
          else {
            return i1.label.localeCompare(i2.label);
          }
        })
        .map(item => item.key);
    }

    return spec;
  }

};

module.exports = Normalize;