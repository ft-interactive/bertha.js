(function (window, $) {

	'use strict';

	var Bertha = window.Bertha = window.Bertha || {};


	Bertha.defaults = Bertha.defaults || {};

	Bertha.defaults.callbackName = 'bertha_callback';
	
	Bertha.defaults.spreadsheet = {
		server: 'spottiswood.herokuapp.com',
		plugin: 'gss',
		command: 'view',
		channel: 'publish',
		params: {}
	};

	
	Bertha.getSpreadsheet = function getSpreadsheet(opts) {
		opts = $.extend(true, {}, Bertha.defaults.spreadsheet, opts);

		var params = opts.params,
			plugin,
			url;

		if (!opts.id) {
			throw new Error('No Spreadsheet ID specified.');
		}

		if (!knownPlugins.hasOwnProperty(opts.plugin)) {
			throw new Error('Unknown Plugin.');
		}

		plugin = knownPlugins[opts.plugin];
		url = plugin.url.call(plugin, opts);
		params = plugin.params.call(plugin, opts);

		var xhr = createRequest(url, params, true);

		if (opts.processOptionsSheet) {
			xhr.pipe(preProcessOptions);
		}
		return xhr;
	};

	var convertOptsSheet =  function convertOptsSheet(sheet) {
		var newSheet = {};
		sheet.forEach(function (n) {
			this[n.name] = n.value;
		}, newSheet);
		return newSheet;
	};

	var preProcessOptions = function preProcessOptions(data) {
		if (data && data.options) {
			data.options = convertOptsSheet(data.options);
		}

		return data;
	}
	
	var basicUrl = function basicUrl(opts) {

		var sheets;

		if (opts.sheets && opts.sheets.length) {
			sheets = $.type(opts.sheets) === 'array' ? opts.sheets.join(',') : opts.sheets;
		} else if (opts.sheet) {
			sheets = opts.sheet;
		}

		// this.sheets === false means no sheet names required for the plugin
		if (this.sheets && !sheets) {
			throw new Error('No Worksheet specified');
		}

		return  ['http://', opts.server, opts.command, opts.channel, opts.plugin, opts.id].join('/') + (sheets ? '/' + sheets : '');
	};

	
	var basicParams = function basicParams(/*opts*/) {
		var params = {};
		return params;
	};

	
	var knownPlugins = {
		'gss': {
			sheets: true,
			url: basicUrl,
			params: basicParams
		},
		'profile': {
			sheets: false,
			url: basicUrl,
			params: basicParams
		}
	};

	// best practice jQuery JSONP implementation
	var createRequest = function createRequest(url, queryParams, cache) {
		return $.ajax({
			cache: !!cache,
			data: queryParams,
			dataType: 'jsonp',
			global: false,
			jsonpCallback: Bertha.defaults.callbackName,
			timeout: 9000,
			type: 'GET',
			url: url
		});
	};

})(this, jQuery);