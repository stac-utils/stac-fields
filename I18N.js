const I18N = {

	locales: [],
	translate: null, // function(value: string, vars: array|object = null) : string

	format(value, vars = null) {
		if (vars) {
			for(let key in vars) {
				value = value.replaceAll(`{${key}}`, vars[key]);
			}
		}
		return value;
	}

};

module.exports = I18N;