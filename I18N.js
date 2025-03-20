const Defaults = {
	collatorOptions: {},
	numberFormatterOptions: {
		maximumFractionDigits: 10
	},
	dateFormatterOptions: {
		day: 'numeric',
		month: 'numeric',
		year: 'numeric'
	},
	dateTimeFormatterOptions: {
		day: 'numeric',
		month: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		timeZone: "UTC",
		timeZoneName: "short"
	}
};

const I18N = {

	locales: [],
	collator: new Intl.Collator([], Defaults.collatorOptions),
	dateFormatter: new Intl.DateTimeFormat([], Defaults.dateFormatterOptions),
	dateTimeFormatter: new Intl.DateTimeFormat([], Defaults.dateTimeFormatterOptions),
	numberFormatter: new Intl.NumberFormat([], Defaults.numberFormatterOptions),
	translate: null, // function(value: string, vars: array|object = null) : string

	getDefaults() {
		return Defaults;
	},

	setLocales(locales, dateFormatterOptions = {}, dateTimeFormatterOptions = {}, numberFormatterOptions = {}, collatorOptions = {}) {
		this.locales = locales;

		collatorOptions = Object.assign({}, Defaults.collatorOptions, collatorOptions);
		this.collator = new Intl.Collator(locales, collatorOptions);

		dateFormatterOptions = Object.assign({}, Defaults.dateFormatterOptions, dateFormatterOptions);
		this.dateFormatter = new Intl.DateTimeFormat(locales, dateFormatterOptions);

		dateTimeFormatterOptions = Object.assign({}, Defaults.dateTimeFormatterOptions, dateTimeFormatterOptions);
		this.dateTimeFormatter = new Intl.DateTimeFormat(locales, dateTimeFormatterOptions);

		numberFormatterOptions = Object.assign({}, Defaults.numberFormatterOptions, numberFormatterOptions);
		this.numberFormatter = new Intl.NumberFormat(locales, numberFormatterOptions);
	},

	setTranslator(fn) {
		this.translate = fn;
	},

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