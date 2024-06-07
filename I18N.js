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
		timeZone: "UTC",
		timeZoneName: "short"
	}
};

const I18N = {

	locales: [],
	collator: new Intl.Collator(),
	dateFormatter: new Intl.DateTimeFormat(),
	dateTimeFormatter: new Intl.DateTimeFormat(),
	numberFormatter: new Intl.NumberFormat(),
	translate: null, // function(value: string, vars: array|object = null) : string

	setLocales(locales, dateFormatterOptions = {}, dateTimeFormatterOptions = {}, numberFormatterOptions = {}, collatorOptions = {}) {
		this.locales = locales;

		collatorOptions = Object.assign({}, this.collatorOptions, collatorOptions);
		this.collator = new Intl.Collator(locales, collatorOptions);

		dateFormatterOptions = Object.assign({}, this.dateFormatterOptions, dateFormatterOptions);
		this.dateFormatter = new Intl.DateTimeFormat(locales, dateFormatterOptions);

		dateTimeFormatterOptions = Object.assign({}, this.dateTimeFormatterOptions, dateTimeFormatterOptions);
		this.dateTimeFormatter = new Intl.DateTimeFormat(locales, dateTimeFormatterOptions);

		numberFormatterOptions = Object.assign({}, this.numberFormatterOptions, numberFormatterOptions);
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