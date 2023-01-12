const Formatters = require('./formatters');
const _ = require('./helper');
const I18N = require('./I18N');

const Normalize = {

  fields(fields) {
    let parts = ['extensions', 'metadata', 'links', 'assets'];
    for (let part of parts) {
      for(let key in fields[part]) {
        fields[part][key] = Normalize.field(fields[part][key], fields[part], fields);
      }
    }
    return fields;
  },

  field(spec, fields = {}, allFields = {}) {
    // If just a string label is given, make a normal object with a label from it
    if (typeof spec === 'string') {
      return {
        label: spec
      };
    }
    // Resolve alias
    if (typeof spec.alias === 'string') {
      // As we don't know whether the alias has been resolved so far, resolve it here, too.
      let aliasedSpec = fields[spec.alias] || allFields.metadata[spec.alias];
      if (!aliasedSpec) {
        throw new Error('Alias is invalid: ' + spec.alias);
      }
      return Object.assign(spec, Normalize.field(aliasedSpec, fields, allFields));
    }

    // Add formatting callback as `formatter`
    if (typeof spec.format === 'string') {
      spec.formatter = Formatters[`format${spec.format}`];
    }

    // Normalize items
    if (_.isObject(spec.items)) {
    let itemOrder = [];
      for(let key in spec.items) {
        spec.items[key] = Normalize.field(spec.items[key], fields, allFields);
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
            return _.t(i1.label).localeCompare(_.t(i2.label), I18N.locales);
          }
        })
        .map(item => item.key);
    }

    // Normalize properties
    if (_.isObject(spec.properties)) {
      for(let key in spec.properties) {
        spec.properties[key] = Normalize.field(spec.properties[key], fields, allFields);
      }
    }

    return spec;
  }

};

module.exports = Normalize;