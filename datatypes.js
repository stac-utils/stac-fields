const _ = require('./helper');

const DataTypes = {

	array(arr, sort = false, unit = '') {
		return _.toList(arr, sort, v => DataTypes.format(v, unit));
	},
	
	object(obj) {
		return _.toObject(obj, v => DataTypes.format(v));
	},
	
	null(label = 'n/a') {
		return _.toNothing(label);
	},
	
	number(num, unit = '') {
		if (typeof num !== 'number') {
			num = parseFloat(num);
		}
		return _.unit(num.toLocaleString(undefined, {maximumFractionDigits: 10}), unit);
	},

	string(str, unit = '') {
		return _.unit(_.e(str).replace(/(\r\n|\r|\n){2,}/g, '<br />'), unit);
	},
	
	boolean(bool) {
		return bool ? '✔️' : '❌';
	},
	
	format(value, unit = '') {
		if (typeof value === 'boolean') {
			return DataTypes.boolean(value);
		}
		else if (typeof value === 'number') {
			return DataTypes.number(value, unit);
		}
		else if (typeof value === 'string') {
			return DataTypes.string(value, unit);
		}
		else if (Array.isArray(value)) {
			return DataTypes.array(value, unit);
		}
		else if (_.isObject(value)) {
			return DataTypes.object(value);
		}
		else {
			return DataTypes.null();
		}
	}

};

module.exports = DataTypes;