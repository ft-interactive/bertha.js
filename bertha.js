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
		params: {
			exp: 'forever'
		}
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

		if (!opts.cache) {
			delete params['exp'];
		}

		plugin = knownPlugins[opts.plugin];
		url = plugin.url.call(plugin, opts);
		params = plugin.params.call(plugin, opts);

		var xhr = createRequest(url, params, !!opts.cache);

		if (opts.processOptionsSheet) {
			xhr.pipe(preProcessOptions);
		}
		return xhr;
	};

	var convertOptsSheet =  function convertOptsSheet(sheet) {
		
		if (!sheet) return {};

		var newSheet = {};

		$.each(sheet, function (i, n) {
			if (!n || !n.name) return;
			newSheet[n.name] = n.value;
		});

		return newSheet;
	};

	var preProcessOptions = function preProcessOptions(data) {
		if (data && data.options) {
			data.options = convertOptsSheet(data.options);
		}

		return data;
	};
	
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

		return  ['http:/', opts.server, opts.command, opts.channel, opts.plugin, opts.id].join('/') + (sheets ? '/' + sheets : '');
	};

	
	var basicParams = function basicParams(opts) {
		return opts.params || null;
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

	// best practice jQuery JSON with JSONP fallback implementation
	var createRequest = function createRequest(url, queryParams, cache) {
		var opts = {
			type: 'GET',
			dataType: 'json',
			cache: !!cache,
			data: queryParams,
			url: url
		};

		if (($.browser.msie && $.browser.version < 9) || !$.support.cors) {
			opts.dataType = 'jsonp';
			opts.global = false;
			opts.jsonpCallback = Bertha.defaults.callbackName;
			opts.timeout = 9000;
		}

		return $.ajax(opts);
	};

})(this, jQuery);