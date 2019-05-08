// Layer viewer library code

/*jslint browser: true, white: true, single: true, for: true */
/*global $, jQuery, L, autocomplete, Cookies, vex, GeoJSON, alert, console, window */

var layerviewer = (function ($) {
	
	'use strict';
	
	// Settings defaults
	var _settings = {
		
		// API
		apiBaseUrl: 'API_BASE_URL',
		apiKey: 'YOUR_API_KEY',
		
		// Initial lat/lon/zoom of map and tile layer
		defaultLocation: {
			latitude: 54.661,
			longitude: 1.263,
			zoom: 6
		},
		maxBounds: null,	// Or [W,S,E,N]
		defaultTileLayer: 'mapnik',
		
		// Application baseUrl
		baseUrl: '/',
		
		// Default layers ticked
		defaultLayers: [],
		
		// Geocoder API URL; re-use of settings values represented as placeholders {%apiBaseUrl}, {%apiKey}, {%autocompleteBbox}, are supported
		geocoderApiUrl: '{%apiBaseUrl}/v2/geocoder?key={%apiKey}&bounded=1&bbox={%autocompleteBbox}',
		
		// BBOX for autocomplete results biasing
		autocompleteBbox: '-6.6577,49.9370,1.7797,57.6924',
		
		// Feedback API URL; re-use of settings values represented as placeholders {%apiBaseUrl}, {%apiKey}, are supported
		feedbackApiUrl: '{%apiBaseUrl}/v2/feedback.add?key={%apiKey}',
		
		// Enable/disabled drawing feature
		enableDrawing: true,
		
		// Map scale
		enableScale: false,
		
		// First-run welcome message
		firstRunMessageHtml: false,
		
		// Google API key for Street View images
		gmapApiKey: 'YOUR_API_KEY',
		
		// Sending zoom as default for all layers
		sendZoom: false,
		
		// Explicit styling as default for all layers
		style: {},
		
		// Enable hover for all (line-based) layers
		hover: true,
		
		// Default icon and size
		iconUrl: null,
		iconSize: null,
		
		// Tileserver URLs, each as [path, options, label]
		tileUrls: {
			opencyclemap: [
				'https://{s}.tile.cyclestreets.net/opencyclemap/{z}/{x}/{y}@2x.png',
				{maxZoom: 21, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors; <a href="https://www.thunderforest.com/">Thunderforest</a>'},
				'OpenCycleMap'
			],
			mapnik: [
				'https://{s}.tile.cyclestreets.net/mapnik/{z}/{x}/{y}.png',
				{maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'},
				'OpenStreetMap style'
			],
			osopendata: [
				'https://{s}.tile.cyclestreets.net/osopendata/{z}/{x}/{y}.png',
				{maxZoom: 19, attribution: 'Contains Ordnance Survey data &copy; Crown copyright and database right 2010'},
				'OS Open Data'
			],
			bartholomew: [
				'https://{s}.tile.cyclestreets.net/bartholomew/{z}/{x}/{y}@2x.png',
				{maxZoom: 15, attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>'},
				'NLS - Bartholomew Half Inch, 1897-1907'
			],
			os6inch: [
				'https://{s}.tile.cyclestreets.net/os6inch/{z}/{x}/{y}@2x.png',
				{maxZoom: 15, attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>'},
				'NLS - OS 6-inch County Series 1888-1913'
			]
			/*
			,
			os1to25k1stseries: [
				'https://{s}.tile.cyclestreets.net/os1to25k1stseries/{z}/{x}/{-y}@2x.png',
				{maxZoom: 16, attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>'},
				'NLS - OS 1:25,000 Provisional / First Series 1937-1961',
			],
			os1inch7thseries: [
				'https://{s}.tile.cyclestreets.net/os1inch7thseries/{z}/{x}/{y}@2x.png',
				{maxZoom: 16, attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>'},
				'NLS - OS 1-inch 7th Series 1955-1961'
			]
			*/
		},
		
		// Popup pages, defined as content div ID
		pages: [
			// 'about'
		],
		
		// Region switcher, with areas defined as a GeoJSON file
		regionsFile: false,
		regionsField: false,
		
		// Initial view of all regions; will use regionsFile
		initialRegionsView: false,
		initialRegionsViewRemovalZoom: 10,	// or false to keep it
		
		// Whether to show layer errors in a (non-modal) corner dialog, rather than as a modal popup
		errorNonModalDialog: false,
		
		// Beta switch
		enableBetaSwitch: false,
		
		// Password protection, as an SHA-256 hash
		password: false
	};
	
	// Layer definitions, which should be overriden by being supplied as an argument by the calling application
	var _layerConfig = {
		
		/* Example, showing all available options:
		layerid: {
			
			// Path or full URL to the API endpoint
			apiCall: '/path/to/api',
			
			// API key specific to this layer's API call
			apiKey: false,
			
			// Fixed parameters required by this API
			apiFixedParameters: {
				key: 'value',
				foo: 'bar'
			},
			
			// Name and description
			name: '',
			description: '',
			
			// Explicit data type (assumed to be JSON), e.g. XML
			dataType: false,
			
			// Callback for data conversion just after receiving the data
			convertData: function (data) {return somefunction (data);}
			
			// Minimum zoom required for this layer
			minZoom: false,
			
			// Show a message if the zoom level is below this level (i.e. too zoomed out)
			fullZoom: 17,
			fullZoomMessage: 'Customised string',
			
			// If the layer requires that query fields are prefixed with a namespace, prefix each fieldname
			parameterNamespace: 'field:',
			
			// Whether to send zoom= to the API end, which is useful for some APIs
			sendZoom: true,
			
			// Specific icon to use for all markers in this layer
			iconUrl: '/images/icon.svg',
			iconSize: [38, 42],
			
			// Field in GeoJSON data where the icon value can be looked up
			iconField: 'type',
			
			// Icon lookups, based on the iconField
			icons: {
				foo: '/images/foo.svg',
				bar: '/images/bar.svg',
				qux: '/images/qux.svg'
			},
			
			// Order of marker appearance, in order from least to most important
			markerImportance: ['foo', 'bar', 'qux'],
			
			// Explicit styling
			style: {
				weight: 5
			},
			
			// If drawing lines, the field that contains the value used to determine the colour, and the colour stops for this, as an array of pairs of upper limit value and colour
			lineColourField: 'value',
			lineColourStops: [
				[200, '#ff0000'],
				[50, '#e27474'],
				[0, '#61fa61']
			],
			
			// Similarly, line width
			lineWidthField: 'width',
			lineWidthStops: [
				[250, 10],
				[100, 5],
				[0, 1],
			],
			
			// Enable hover for this layer (for line-based layers)
			hover: true,
			
			// Legend, either array of values (as same format as lineColourStops), or boolean true to use lineColourStops if that exists
			legend: true,
			
			// Polygon style; currently supported values are 'grid' (blue boxes with dashed lines, intended for tessellating data), 'green', 'red'
			polygonStyle: 'grid',
			
			// Code for popups; placeholders can be used to reference data in the GeoJSON; if using sublayerParameter, this is specified as a hashmap
			popupHtml:
				+ '<p>Reference: <strong>{properties.id}</strong></p>'
				+ '<p>Date and time: {properties.datetime}</p>',
			
			// Formatter for popup fields when using auto-table creation
			popupFormatters: {
				myField: function (value, feature) {return string;},
				...
			}
			
			// Make lookups (Popups / line colour stops) dependent on the value of a specified request parameter
			sublayerParameter: false,
			
			// Labels for auto-popups
			popupLabels: {},
			
			// Field that contains a follow-on API URL where more details of the feature can be requested
			detailsOverlay: 'apiUrl',
			
			// Overlay code, as per popupHtml, but for the follow-on overlay data
			overlayHtml: '<p>{properties.caption}</p>',
			
			// Retrieval strategy - 'bbox' (default) sends w,s,e,n; 'polygon' sends as sw.lat,sw.lng:se.lat,se.lng:ne.lat,ne.lng:nw.lat,nw.lng:sw.lat,sw.lng
			retrievalStrategy: 'bbox',
			
			// Boundary parameter name (most likely to be useful in polygon retrievalStrategy mode), defaulting to 'boundary'
			apiBoundaryField: 'boundary',
			
			// If reformatting the boundary in the response is needed, unpacking strategy; only 'latlon-comma-colons' is supported
			apiBoundaryFormat: 'latlon-comma-colons',
			
			// Flat JSON mode, for when GeoJSON is not available, specifying the location of the location fields within a flat structure
			flatJson: ['location.latitude', 'location.longitude'],
			
			// Heatmap mode, implementing Leaflet.heat
			heatmap: false,
			
			// Tile layer mode, which adds a bitmap tile overlay
			tileLayer: []	// Format as per _settings.tileUrls
		},
		
		// More layers
		
		*/
	};
	
	
	// Internal class properties
	var _map = null;
	var _layers = {};	// Layer status registry
	var _currentDataLayer = {};
	var _tileOverlayLayers = {};
	var _heatmapOverlayLayers = {};
	var _virginFormState = {};
	var _parameters = {};
	var _xhrRequests = {};
	var _requestCache = {};
	var _title = false;
	var _embedMode = false;
	var _message = null;
	var _betaMode = false;
	
	
	return {
		
	// Public functions
		
		// Main function
		initialise: function (config, layerConfig)
		{
			// Merge the configuration into the settings
			$.each (_settings, function (setting, value) {
				if (config.hasOwnProperty(setting)) {
					_settings[setting] = config[setting];
				}
			});
			
			// Enable general page handlers
			if (_settings.pages) {
				$.each (_settings.pages, function (index, contentDivId) {
					layerviewer.pageDialog (contentDivId);
				});
			}
			
			// Require password if enabled
			if (_settings.password) {
				if (!layerviewer.passwordProtection ()) {
					return false;
				}
			}
			
			// Obtain the layers
			_layerConfig = layerConfig;
			
			// Parse the URL
			var urlParameters = layerviewer.parseUrl ();
			
			// Show intial regions view if required
			if (_settings.initialRegionsView && _settings.regionsFile) {
				if (!urlParameters.defaultLocation) {
					
					// Load the GeoJSON file
					$.ajax({
						url: _settings.regionsFile,
						dataType: (layerviewer.browserSupportsCors () ? 'json' : 'jsonp'),		// Fall back to JSON-P for IE9
						error: function (jqXHR, error, exception) {
							vex.dialog.alert ('Error: could not load regions list file.');
						},
						success: function (data, textStatus, jqXHR) {
							var regionsOverlay = L.geoJson(data, {
								
								onEachFeature: function (feature, layer) {
									
									// Add the region name as the popup content, if enabled
									if (_settings.regionsField) {
										var regionName = feature.properties[_settings.regionsField];
										regionName = layerviewer.htmlspecialchars (layerviewer.ucfirst (regionName));
										layer.bindPopup (regionName, {className: 'autowidth'});
									}
									
									// Add mouseover hover
									layer.on('mouseover', function (eventn) {
										this.openPopup();
									});
									layer.on('mouseout', function (event) {
										this.closePopup();
									});
									
									// Zoom to area and remove layer when clicked
									layer.on('click', function (event) {
										_map.fitBounds(layer.getBounds());
										_map.removeLayer (regionsOverlay);
									})
								}
								
							}).addTo(_map);
							
							// Create a handler to remove the overlay automatically when zoomed in (but not explicitly clicked through)
							if (_settings.initialRegionsViewRemovalZoom) {
								_map.on ('zoomend', function (e) {
									var currentZoom = _map.getZoom ();
									if (currentZoom >= _settings.initialRegionsViewRemovalZoom) {	// Roughly size of a UK County
										_map.removeLayer (regionsOverlay);
									}
								});
							}
						}
					});
				}
			}
			
			// Set the initial location and tile layer
			var defaultLocation = (urlParameters.defaultLocation || _settings.defaultLocation);
			var defaultTileLayer = (urlParameters.defaultTileLayer || _settings.defaultTileLayer);
			
			// Create the map
			layerviewer.createMap (defaultLocation, defaultTileLayer);
			
			// Hide unwanted UI elements in embed mode if required
			layerviewer.embedMode ();
			
			// If HTML5 History state is provided, use that to select the sections
			var initialLayersPopstate = false;
			/* Doesn't work yet, as is asyncronous - need to restructure the initialisation
			$(window).on('popstate', function (e) {
				var popstate = e.originalEvent.state;
				if (popstate !== null) {
					initialLayersPopstate = popstate;
				}
			});
			*/
			
			// If cookie state is provided, use that to select the sections
			var state = Cookies.getJSON('state');
			var initialLayersCookies = [];
			if (state) {
				$.each (state, function (layerId, parameters) {
					if (_layerConfig[layerId]) {
						initialLayersCookies.push (layerId);
					}
				});
			}
			
			// Determine layers to use, checking for data in order of precedence
			var initialLayers = initialLayersPopstate || (urlParameters.sections.length ? urlParameters.sections : false) || (initialLayersCookies.length ? initialLayersCookies : false) || _settings.defaultLayers;
			
			// Load the tabs
			layerviewer.loadTabs (initialLayers);
			
			// Create mobile navigation
			layerviewer.createMobileNavigation ();
			
			// Populate dynamic form controls
			layerviewer.populateDynamicFormControls ();
			
			// Add slider value display support
			layerviewer.sliderValueDisplayHandler ();
			
			// Set form values specified in the URL
			layerviewer.setFormValues (urlParameters.formParameters);
			
			// Add tooltip support
			layerviewer.tooltips ();
			
			// Set dialog style
			vex.defaultOptions.className = 'vex-theme-plain';
			
			// Register a more details dialog box handler, giving a link to more information
			layerviewer.moreDetails ();
			
			// Show first-run welcome message if the user is new to the site
			layerviewer.welcomeFirstRun ();
			
			// Create the legend for the current field, and update on changes
			layerviewer.createLegend ();
			
			// Create a beta switch if required
			layerviewer.createBetaSwitch ();
			
			// Create a message area, and provide methods to manipulate it
			layerviewer.messageArea ();
			
			// Region switcher
			layerviewer.regionSwitcher ();
			
			// Enable feedback handler
			layerviewer.feedbackHandler ();
			
			// Determine the enabled layers
			layerviewer.determineLayerStatus ();
			
			// Determine the initial form state as specified in the fixed HTML, for all layers
			$.each (_layers, function (layerId, layerEnabled) {
				_virginFormState[layerId] = layerviewer.parseFormValues (layerId);
			});
			
			// Load the data, and add map interactions and form interactions
			$.each (_layers, function (layerId, layerEnabled) {
				if (layerEnabled) {
					layerviewer.enableLayer (layerId);
				}
			});
			
			// Toggle map data layers on/off when checkboxes changed
			$('nav #selector input[type="checkbox"]').change (function() {
				var layerId = this.id.replace('show_', '');
				if (this.checked) {
					_layers[layerId] = true;
					layerviewer.enableLayer (layerId);
				} else {
					_layers[layerId] = false;
					if (_xhrRequests[layerId]) {
						_xhrRequests[layerId].abort();
					}
					layerviewer.removeLayer (layerId, false);
					layerviewer.clearLegend ();
					layerviewer.setStateCookie ();	// Update to catch deletion of cache entry
				}
			});
		},
		
		
		// Password protection; this is intended to provide a simple, basic level of protection only
		passwordProtection: function ()
		{
			// Obtain the cookie if present
			var cookieName = 'login';
			var value = Cookies.get(cookieName);
			
			// Validate if value supplied from cookie
			if (value) {
				if (layerviewer.validatePassword (value)) {
					return true;
				}
			}
			
			// Get the home page HTML and overwrite the content
			var html = $('#home').html();
			html = '<div id="protection">' + html + '</div>';
			$('main').html (html);
			
			// Add a password form
			$('#protection').append ('<p id="loginprompt">If you have been given a login password, please enter it below.</p>');
			var form = $('<form id="password" method="post"></form>');
			form.append('<input name="password" type="password" required="required" placeholder="Password" size="20" autofocus="autofocus" />');
			form.append('<input type="submit" value="Submit" />');
			$('#protection').append (form);
			
			// If the form is submitted, validate the value
			$('#password').submit (function(event) {
				
				// Prevent page reload
				event.preventDefault();
				
				// Obtain the value and validate the password
				var values = $(this).serializeArray ();
				var password = values[0].value;
				if (layerviewer.validatePassword (password)) {
					
					// Set the cookie, storing the (low-security) entered value
					Cookies.set(cookieName, password, {expires: 7});
					
					// Reload the page and end
					location.reload ();
				} else {
					
					// Show message
					var message = 'The password you gave is not correct. Please check and try again.';
					vex.dialog.alert ({message: message, showCloseButton: true, className: 'vex vex-theme-plain'});
					
					// Reset the form content
					$('#password')[0].reset();
				}
			});
			
			// Not validated
			return false;
		},
		
		
		// Helper function to validate the password
		validatePassword: function (value)
		{
			// Hash the value
			var shaObj = new jsSHA ('SHA-256', 'TEXT');
			shaObj.update (value);
			var hash = shaObj.getHash ('HEX');
			
			// Compare against the correct password hash
			if (hash === _settings.password) {
				return true;
			}
			
			// Failure
			return false;
		},
		
		
		// Function to parse the URL
		parseUrl: function ()
		{
			// Start a list of parameters
			var urlParameters = {};
			
			// Split the path by slash; see: https://stackoverflow.com/a/8086637
			var pathComponents = window.location.pathname.split('/').slice(1);
			if (pathComponents) {
				
				// Obtain the sections and form parameters from the URL
				var formParameters = layerviewer.urlSlugToFormParameters (pathComponents[0]);
				
				// Obtain the section(s), checking against the available sections in the settings
				urlParameters.sections = [];
				if (formParameters) {
					$.each (formParameters, function (layerId, parameters) {
						if (_layerConfig[layerId]) {
							urlParameters.sections.push (layerId);
						}
					});
				}
				
				// Register the form parameters
				urlParameters.formParameters = formParameters;
				
				// Obtain embed mode if present
				if (pathComponents[1]) {
					if (pathComponents[1] == 'embed') {
						_embedMode = true;
					}
				}
			}
			
			// Obtain query string parameters, which are used for presetting form values
			urlParameters.queryString = layerviewer.parseQueryString ();
			
			// Get the location from the URL
			urlParameters.defaultLocation = null;
			urlParameters.defaultTileLayer = null;
			if (window.location.hash) {
				var hashParts = window.location.hash.match (/^#([0-9]{1,2})\/([-.0-9]+)\/([-.0-9]+)\/([a-z0-9]+)$/);	// E.g. #17/51.51137/-0.10498/opencyclemap
				if (hashParts) {
					urlParameters.defaultLocation = {
						latitude: hashParts[2],
						longitude: hashParts[3],
						zoom: hashParts[1]
					}
					urlParameters.defaultTileLayer = hashParts[4];
				}
			}
			
			// Return the parameters
			return urlParameters;
		},
		
		
		// Function to parse the query string into key/value pairs
		parseQueryString: function ()
		{
			// See: https://stackoverflow.com/a/8649003/180733
			if (!location.search.length) {return {};}
			var queryString = location.search.substring(1);
			var parameters = layerviewer.deparam (queryString);
			return parameters;
		},
		
		
		// Function to support embed mode, which disables various UI elements
		embedMode: function ()
		{
			// End if not enabled
			if (!_embedMode) {return;}
			
			// If the site is being iframed, force target of each link to parent
			var inIframe = layerviewer.inIframe ();
			if (inIframe) {
				$('a').attr('target', '_parent');
			}
			
			// Add CSS
			$('body').addClass('embed');
		},
		
		
		// Helper function to determine if the site is being iframed; see: https://stackoverflow.com/a/326076/180733
		inIframe: function () {
			try {
				return window.self !== window.top;
			} catch (e) {
				return true;
			}
		},
		
		
		// Function to load the tabs
		loadTabs: function (defaultLayers)
		{
			// Set each default layer and add background
			$.each (defaultLayers, function (index, layerId) {
				
				// Add background highlight to this tab
				$('nav li.' + layerId).addClass('selected');
				
				// Enable checkbox
				$('nav input#show_' + layerId).click();
			});
			
			// Enable tabbing of main menu
			$('nav').tabs();
			
			// If a default tab is defined (or several, in which case use the first), switch to its contents (controls); see: https://stackoverflow.com/a/7916955/180733
			if (defaultLayers[0]) {
				var index = $('nav li.' + defaultLayers[0]).index();
				$('nav').tabs('option', 'active', index);
			}
			
			// Handle selection/deselection of section checkboxes
			$('nav #selector input').change (function() {
				
				// Add background highlight to this tab
				$(this).parent('li').toggleClass('selected', this.checked);
				
				// Update the URL using HTML5 History pushState
				layerviewer.determineLayerStatus ();
				layerviewer.updateUrl ();
				
				// If enabling, switch to its tab contents (controls)
				if (this.checked) {
					var index = $(this).parent().index();
					$('nav').tabs('option', 'active', index);
				}
			});
			
			// Allow double-clicking of each menu item (surrounding each checkbox) as implicit selection of its checkbox
			$('nav #selector li a').dblclick(function() {
				$(this).parent().find('input').click();
			});
			
			// Allow any form change within a layer as implicit selection of its checkbox
			$('form#data .filters :input').change (function () {
				layerviewer.formChangeImplicitCheckbox (this);
			});
			$('form#data #sections div :text, form#data #sections div input[type="search"]').on ('input', function() {
				layerviewer.formChangeImplicitCheckbox (this);
                        });
		},
		
		
		// Function for handlers of implicit selection of checkbox on form change
		formChangeImplicitCheckbox: function (changedInputPath)
		{
			var layerId = $(changedInputPath).closest('#sections > div').attr('id');	// Assumes #sections contains layer DIVs directly
			if ($('nav input#show_' + layerId).prop ('checked') != true) {
				$('nav input#show_' + layerId).click();
			}
		},
		
		
		// Create mobile navigation
		createMobileNavigation: function ()
		{
			// Add hamburger menu
			$('body').append ('<div id="nav-mobile"></div>');
			
			// Toggle visibility clickable
			$('#nav-mobile').click(function () {
				if ($('nav').is(':visible')) {
					$('nav').hide ('slide', {direction: 'right'}, 250);
				} else {
					$('nav').animate ({width:'toggle'}, 250);
				}
			});
			
			// Enable implicit click/touch on map as close menu
			if ($('#nav-mobile').is(':visible')) {
				if (!$('nav').is(':visible')) {
					$('.map').click(function () {
						$('nav').hide ('slide', {direction: 'right'}, 250);
					});
				};
			};
			
			// Enable closing menu on slide right
			if ($('#nav-mobile').is(':visible')) {
				$('nav').on('swiperight', function () {
					$('nav').hide ('slide', {direction: 'right'}, 250);
				});
			};
		},
		
		
		// Function to update the URL, to provide persistency when a link is circulated
		// Format is /<baseUrl>/<layerId1>:<param1key>=<param1value>&[...],<layerId2>[...]/#<mapHashWithStyle>
		updateUrl: function ()
		{
			// End if not supported, e.g. IE9
			if (!history.pushState) {return;}
			
			// Obtain the URL slug
			var urlSlug = layerviewer.formParametersToUrlSlug ();
			
			// Construct the URL
			var url = _settings.baseUrl;	// Absolute URL
			url += urlSlug;
			url += window.location.hash;
			
			// Construct the page title, based on the enabled layers
			var title = layerviewer.pageTitle ();
			
			// Push the URL state
			history.pushState (urlSlug, title, url);
			document.title = title;		// Workaround for poor browser support; see: https://stackoverflow.com/questions/13955520/
		},
		
		
		// Function to convert form parameters to a URL slug
		formParametersToUrlSlug: function ()
		{
			// Copy (clone) the parameter state for the purposes of determining the URL
			var urlParameters = $.extend (true, {}, _parameters);	// See: https://stackoverflow.com/a/12690181/180733
			
			// Define system-wide parameters that are not layer-specific
			var genericParameters = ['bbox', 'boundary'];
			
			// Filter for enabled layers
			var enabledLayers = [];
			var component;
			$.each (_layers, function (layerId, isEnabled) {
				if (isEnabled) {
					
					// Start with the layer ID
					component = layerId;
					
					// Deal with parameters for each layer
					if (urlParameters[layerId]) {
						
						// Omit generic parameters which the API will automatically receive
						$.each (genericParameters, function (index, parameter) {
							if (urlParameters[layerId].hasOwnProperty (parameter)) {
								delete urlParameters[layerId][parameter];
							}
						});
						
						// Omit parameters whose value matches the virgin form state, to keep the URL as short as possible
						$.each (_virginFormState[layerId], function (parameter, virginValue) {
							if (urlParameters[layerId].hasOwnProperty (parameter) && (urlParameters[layerId][parameter] == virginValue)) {
								delete urlParameters[layerId][parameter];
							} else {
								urlParameters[layerId][parameter] = '';		// Deal with scenario of e.g. checkbox ticked by default, and unticked, thus not being the default but not being present in the form parameter list
							}
						});
						
						// If there are now parameters remaining, add these to this layer's component
						if (!$.isEmptyObject (urlParameters[layerId])) {
							component += ':' + $.param (urlParameters[layerId]);
						}
					}
					
					// Register the component
					enabledLayers.push (component);
				}
			});
			
			// Construct the URL slug, joining by comma
			var urlSlug = enabledLayers.join(',') + (enabledLayers.length ? '/' : '');
			
			// Return the URL slug
			return urlSlug;
		},
		
		
		// Function to convert a URL to form parameters; this is the reverse of formParametersToUrlSlug()
		urlSlugToFormParameters: function (urlSlug)
		{
			// Return empty array if empty string
			if (!urlSlug) {return {};}
			
			// Split by comma
			var components = urlSlug.split (',');
			
			// Split each component by optional colon, then unpack the encoded string
			var layers = {};
			$.each (components, function (index, component) {
				var layerDetails = component.split (':', 2);
				var layerId = layerDetails[0];
				var parameters = (layerDetails[1] ? layerviewer.deparam (layerDetails[1]) : {});
				layers[layerId] = parameters;
			});
			
			// Return the result
			return layers;
		},
		
		
		// Reverse of $.param(); see: https://stackoverflow.com/a/26849194/180733
		deparam: function (string)
		{
			return string.split('&').reduce(function (params, param) {
				var paramSplit = param.split('=').map(function (value) {
					return decodeURIComponent(value.replace('+', ' '));
				});
				params[paramSplit[0]] = paramSplit[1];
				return params;
			}, {});
		},
		
		
		// Function to construct the browser page title
		pageTitle: function ()
		{
			if (!_title) {_title = document.title;}		// Obtain and cache the original page title
			var title = _title;
			var layerTitles = [];
			$.each (_layers, function (layerId, isEnabled) {
				if (isEnabled) {
					layerTitles.push (layerviewer.layerNameFromId (layerId).toLowerCase());
				}
			});
			if (layerTitles) {
				title += ': ' + layerTitles.join(', ');
			}
			
			// Return the title
			return title;
		},
		
		
		// Function to get the layer name from its ID
		layerNameFromId: function (layerId)
		{
			return $('#selector li.' + layerId + ' a').text();
		},
		
		
		// Function to populate dynamic form controls
		populateDynamicFormControls: function ()
		{
			// Support for "data-monthly-since" (e.g. = '2013-07') macro which populates a select with an option list of each month, grouped by optgroup years
			var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			$('select[data-monthly-since]').val(function() {	// See: https://stackoverflow.com/a/16086337
				var since = $(this).data('monthly-since');
				since = since.split('-');
				var sinceYear = since[0];
				var sinceMonth = since[1];
				var html = '';
				var yearToday = new Date().getFullYear();
				var monthToday = new Date().getMonth() + 1;	// Index from 1
				var year;
				var month;
				var month1Indexed;
				for (year = yearToday; year >= sinceYear; year--) {	// See: https://stackoverflow.com/a/26511699
					html += '<optgroup label="' + year + '">';
					for (month = months.length - 1; month >= 0; month--) {	// Loop through backwards reliably; see: https://stackoverflow.com/a/4956313
						month1Indexed = month + 1;
						if ((year == yearToday) && (month1Indexed >= monthToday)) {continue;}	// Skip months not yet completed
						var monthPadded = (month1Indexed < 10 ? '0' : '') + month1Indexed;	// Pad zeroes and cast as string
						html += '<option value="' + year + '-' + monthPadded + '">' + months[month] + ' ' + year + '</option>';
						if ((year == sinceYear) && (monthPadded == sinceMonth)) {break;}	// End at last year and since month
					}
					html += '</optgroup>';
				}
				$(this).append(html);
			});
			
			// Support for "data-yearly-since-unixtime" macro which populates a select with an option list of each year, expressed as Unixtime
			$('select[data-yearly-since-unixtime]').val(function() {
				var sinceYear = $(this).data('yearly-since-unixtime');
				var yearToday = new Date().getFullYear();
				var html = '';
				var year;
				var unixtime;
				for (year = yearToday; year >= sinceYear; year--) {	// See: https://stackoverflow.com/a/26511699
					unixtime = parseInt((new Date(year + '.01.01').getTime() / 1000).toFixed(0));	// https://stackoverflow.com/a/28683720/180733
					html += '<option value="' + unixtime + '">' + year + '</option>';
				}
				$(this).append(html);
			});
		},
		
		
		// Slider value display handler, to show the current slider value
		sliderValueDisplayHandler: function ()
		{
			// For each slider, show the input's value (at start, and on change), in the associated paragraph tag
			var sliderDivs = $('form#data .slider');
			$.each (sliderDivs, function (index, sliderDiv) {
				var datalistLabel = $('datalist option[value="' + $('input', sliderDiv).val() + '"]', sliderDiv).text();
				$('p', sliderDiv).text (datalistLabel);
				$('input', sliderDiv).on ('change', function (event) {
					var datalistLabel = $('datalist option[value="' + event.target.value + '"]', sliderDiv).text();
					$('p', sliderDiv).text (datalistLabel);
				});
			});
		},
		
		
		// Function to set form values specified in the URL
		setFormValues: function (formParameters)
		{
			// Set form values, where they exist
			var elementPath;
			$.each (formParameters, function (layerId, values) {
				if (_layerConfig[layerId]) {	// Validate against layer registry
					$.each (values, function (inputName, value) {
						elementPath = '#sections #' + layerId + ' :input[name="' + inputName + '"]';
						if ($(elementPath).length) {
							$(elementPath).val(value);
						}
					});
				}
			});
		},
		
		
		// Function to add tooltips, using the title value
		tooltips: function ()
		{
			// Use jQuery tooltips; see: https://jqueryui.com/tooltip/
			$('nav').tooltip ({
				track: true
			});
		},
		
		
		// Handler for a more details popup layer
		moreDetails: function ()
		{
			// End if no definitions present
			if ($('#aboutfields').length == 0) {return;}
			
			// Create popup when link clicked on
			$('.moredetails').click (function (e) {
				
				// Obtain the field
				var field = $(this).attr('data-field');
				
				// Obtain the content; see: https://stackoverflow.com/a/14744011/180733 and https://stackoverflow.com/a/25183183/180733
				var dialogBoxContentHtml = $('#aboutfields').find('h3.' + field).nextUntil('h3').addBack().map(function() {
					return this.outerHTML;
				}).get().join('');
				if (!dialogBoxContentHtml) {
					dialogBoxContentHtml = '<p><em>Sorry, no further details for this field available yet.</em></p>';
				}
				
				// Wrap in a div
				dialogBoxContentHtml = '<div id="moredetailsboxcontent">' + dialogBoxContentHtml + '</div>';
				
				// Create the dialog box
				layerviewer.dialogBox ('#moredetails', field, dialogBoxContentHtml);
				
				// Prevent link
				e.preventDefault ();
			});
		},
		
		
		// Dialog box
		dialogBox: function (triggerElement, name, html)
		{
			vex.dialog.buttons.YES.text = 'Close';
			vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain wider'});
		},
		
		
		// Function to show a welcome message on first run
		welcomeFirstRun: function ()
		{
			// End if no welcome message
			if (!_settings.firstRunMessageHtml) {return;}
			
			// End if cookie already set
			var name = 'welcome';
			if (Cookies.get(name)) {return;}
			
			// Set the cookie
			Cookies.set(name, '1', {expires: 14});
			
			// Show the dialog
			vex.dialog.alert ({unsafeMessage: _settings.firstRunMessageHtml});
		},
		
		
		// Function to create and update the legend
		createLegend: function ()
		{
			// Affix the legend
			var legend = L.control({position: 'bottomleft'});
			
			// Define its contents
			legend.onAdd = function () {
				return L.DomUtil.create ('div', 'info legend');
			};
			
			// Add to the map
			legend.addTo (_map);
			
			// Hide initially
			layerviewer.clearLegend ();
		},
		
		
		// Function to set the legend contents
		setLegend: function (layerId, sublayerIntervals, sublayerLineColourStops)
		{
			// Determine the intervalsand line colour stops for the current layer
			var intervals = _layerConfig[layerId].intervals;
			var lineColourStops = _layerConfig[layerId].lineColourStops;
			
			// In sublayer mode, do not display unless a sublayer is specified
			if (_layerConfig[layerId].sublayerParameter) {
				
				// If sublayer support is enabled, end if no sublayer specified, clearing the legend if present
				if (!sublayerIntervals) {
					layerviewer.clearLegend ();
					return;
				}
				
				// Allocate sublayer intervals and line colour stops
				intervals = sublayerIntervals;
				lineColourStops = sublayerLineColourStops;
			}
			
			// End if intervals not required for this layer
			if (!intervals) {return;}
			
			// If intervals is bool true, and lineColourStops is defined, use these as the intervals
			if ((intervals === true) && lineColourStops) {
				intervals = lineColourStops;
			}
			
			// If intervals is 'range', and lineColourStops is defined, generate range labels from these
			if ((intervals == 'range') && lineColourStops) {
				intervals = [];
				var label;
				var colour;
				var value;
				$.each (lineColourStops, function (index, interval) {
					colour = interval[1];
					value = interval[0];
					if (index == 0) {
						label = value + '+';
					} else {
						label = value + '-' + lineColourStops[index - 1][0];
					}
					intervals.push ([label, colour]);
				});
			}
			
			// Create the labels
			var labels = [];
			$.each (intervals, function (index, interval) {
				labels.push (['<i style="background: ' + interval[1] + '"></i>', layerviewer.htmlspecialchars (layerviewer.ucfirst (interval[0]))]);
			});
			
			// Compile the labels table
			var labelsTable = '<table>';
			$.each (labels, function (index, label) {
				labelsTable += '<tr><td>' + label[0] + '</td><td>' + label[1] + '</td></tr>';
			});
			labelsTable += '</table>';
			
			// Compile the HTML
			var html = '';
			if (_layerConfig[layerId].name) {
				html += '<h4>' + layerviewer.htmlspecialchars (_layerConfig[layerId].name) + '</h4>';
			}
			if (_layerConfig[layerId].description) {
				html += '<p>' + layerviewer.htmlspecialchars (_layerConfig[layerId].description) + '</p>';
			}
			html += labelsTable;
			
			// Set the HTML
			$('.legend').show ();
			$('.legend').html (html);
		},
		
		
		// Function to clear the legend
		clearLegend: function ()
		{
			$('.legend').hide ();
			$('.legend').html ('');
		},
		
		
		// Function to create a beta switch
		createBetaSwitch: function ()
		{
			// End if not required
			if (!_settings.enableBetaSwitch) {return;}
			
			// Affix the control
			var betaSwitch = L.control({position: 'bottomright'});
			
			// Determine the label
			var label = (_settings.enableBetaSwitch === true ? 'Beta' : _settings.enableBetaSwitch);
			
			// Define the HTML
			var html = '<form id="beta"><input type="checkbox" id="betabutton" name="betabutton" value="true" /><label for="betabutton"> ' + label + '</label></form>';
			
			// Add the content
			betaSwitch.onAdd = function () {
				this._betaSwitchContents = L.DomUtil.create ('div', 'info betaswitch');
				this._betaSwitchContents.innerHTML = html;
				return this._betaSwitchContents;
			};
			
			// Add to the map
			betaSwitch.addTo (_map);
		},
		
		
		// Function to create a message area, and provide methods to manipulate it
		messageArea: function ()
		{
			// Create the control
			_message = L.control({position:'bottomleft'});
			
			// Define its contents
			_message.onAdd = function () {
			    this._div = L.DomUtil.create('div', 'message');
			    return this._div;
			};
			
			// Register a method to set and show the message
			_message.show = function (html) {
				this._div.innerHTML = '<p>' + html + '</p>';
				$('.message').show ();
			};
			
			// Register a method to blank the message area
			_message.hide = function () {
				this._div.innerHTML = '';
				$('.message').hide ();
			}
			
			// Add to the map
			_message.addTo(_map);
		},
		
		
		// Function to determine the layer status
		determineLayerStatus: function ()
		{
			// Initialise the registry
			$.each (_layerConfig, function (layerId, parameters) {
				_layers[layerId] = false;
			});
			
			// Create a list of the enabled layers
			$('nav #selector input:checked').map (function () {
				var layerId = this.id.replace('show_', '');
				_layers[layerId] = true;
			});
		},
		
		
		// Create the map
		createMap: function (defaultLocation, defaultTileLayer)
		{
			// Add the tile layers
			var tileLayers = [];		// Background tile layers
			var baseLayers = {};		// Labels
			var baseLayersById = {};	// Layers, by id
			var layer;
			var name;
			$.each (_settings.tileUrls, function (tileLayerId, tileLayerAttributes) {
				layer = L.tileLayer(tileLayerAttributes[0], tileLayerAttributes[1]);
				tileLayers.push (layer);
				name = tileLayerAttributes[2];
				baseLayers[name] = layer;
				baseLayersById[tileLayerId] = layer;
			});
			
			// Create the map in the "map" div, set the view to a given place and zoom
			_map = L.map('map', {
				center: [defaultLocation.latitude, defaultLocation.longitude],
				zoom: defaultLocation.zoom,
				maxBounds: (_settings.maxBounds ? [[_settings.maxBounds[1], _settings.maxBounds[0]], [_settings.maxBounds[3], _settings.maxBounds[2]]] : null),	// [[S,W],[N,E]]
				layers: baseLayersById[defaultTileLayer]	// Documentation suggests tileLayers is all that is needed, but that shows all together
			});
			
			// Add the base (background) layer switcher
			L.control.layers(baseLayers, null).addTo(_map);
			
			// Add geocoder control
			layerviewer.geocoder ();
			
			// Add drawing support if enabled
			if (_settings.enableDrawing) {
				layerviewer.drawing ('#geometry', true, '');
			}
			
			// Add hash support
			// #!# Note that this causes a map move, causing a second data request
			new L.Hash (_map, baseLayersById);
			
			// Add geolocation control
			_map.addControl(L.control.locate({
				icon: 'fa fa-location-arrow',
				locateOptions: {maxZoom: 17}
			}));
			
			// Add map scale if required
			if (_settings.enableScale) {
				L.control.scale({maxWidth: 300, position: 'bottomright'}).addTo(_map);
			}
		},
		
		
		// Wrapper function to add a geocoder control
		geocoder: function ()
		{
			// Geocoder URL; re-use of settings values is supported, represented as placeholders {%apiBaseUrl}, {%apiKey}, {%autocompleteBbox}
			var geocoderApiUrl = layerviewer.settingsPlaceholderSubstitution (_settings.geocoderApiUrl, ['apiBaseUrl', 'apiKey', 'autocompleteBbox']);
			
			// Attach the autocomplete library behaviour to the location control
			autocomplete.addTo ('#geocoder input', {
				sourceUrl: geocoderApiUrl,
				select: function (event, ui) {
					var bbox = ui.item.feature.properties.bbox.split(',');
					_map.fitBounds([ [bbox[1], bbox[0]], [bbox[3], bbox[2]] ]);
					event.preventDefault();
				}
			});
		},
		
		
		// Helper function to implement settings placeholder substitution in a string
		settingsPlaceholderSubstitution: function (string, supportedPlaceholders)
		{
			// Substitute each placeholder
			var placeholder;
			$.each(supportedPlaceholders, function (index, field) {
				placeholder = '{%' + field + '}';
				string = string.replace(placeholder, _settings[field]);
			});
			
			// Return the modified string
			return string;
		},
		
		
		// Function to enable a data layer
		enableLayer: function (layerId)
		{
			// If the layer is not available, give a dialog
			if ($('#selector li.' + layerId).hasClass('unavailable')) {
				vex.dialog.alert ('Sorry, the ' + $('#selector li.' + layerId + ' a').text().toLowerCase() + ' layer is not available yet.');
				$('nav li.' + layerId + ' input').prop('checked', false);
				return;
			}
			
			// Get the form parameters on load
			_parameters[layerId] = layerviewer.parseFormValues (layerId);
			
			// Register a dialog box handler for showing additional details if required
			if (_layerConfig[layerId].detailsOverlay) {
				layerviewer.detailsOverlayHandler ('#details', layerId);
			}
			
			// Set the legend
			layerviewer.setLegend (layerId, false, false);
			
			// Fetch the data
			layerviewer.getData (layerId, _parameters[layerId]);
			
			// Register to refresh data on map move
			if (!_layerConfig[layerId].static) {	// Unless marked as static, i.e. no change based on map location
				_map.on ('moveend', function (e) {
					layerviewer.getData (layerId, _parameters[layerId]);
				});
			}
			
			// Register to show/hide message based on zoom level
			if (_layerConfig[layerId].fullZoom) {
				layerviewer.fullZoomMessage (layerId);
				_map.on ('zoomend', function (e) {
					layerviewer.fullZoomMessage (layerId);
				});
			}
			
			// Reload the data for this layer, using a rescan of the form parameters for the layer, when any change is made
			var rescanPath = 'form#data #' + layerId + ' :input';
			if (_settings.enableDrawing) {
				rescanPath += ', form#data #drawing :input';
			}
			$(rescanPath).change (function () {
				_parameters[layerId] = layerviewer.parseFormValues (layerId);
				layerviewer.updateUrl ();
				layerviewer.getData (layerId, _parameters[layerId]);
			});
			$('form#data #' + layerId + ' :text, form#data #' + layerId + ' input[type="search"]').on ('input', function() {	// Also include text input changes as-you-type; see: https://gist.github.com/brandonaaskov/1596867
				_parameters[layerId] = layerviewer.parseFormValues (layerId);
				layerviewer.updateUrl ();
				layerviewer.getData (layerId, _parameters[layerId]);
			});
			
			// Register to reload on beta change
			if (_settings.enableBetaSwitch) {
				$('html').on('change', '#beta :checkbox', function () {
					_betaMode = (this.checked);
					layerviewer.getData (layerId, _parameters[layerId]);
				});
			}
		},
		
		
		// Function to create a zoom message for a layer
		fullZoomMessage: function (layerId)
		{
			// Show or hide the message
			if (_map.getZoom () < _layerConfig[layerId].fullZoom) {
				if (_layerConfig[layerId].fullZoomMessage) {
					var message = _layerConfig[layerId].fullZoomMessage;
				} else {
					var message = 'Zoom in to show all ' + layerviewer.layerNameFromId (layerId).toLowerCase() + ' markers - only a selection are shown due to the volume.';
				}
				_message.show (message);
				$('nav #selector li.' + layerId + ' p.total').hide();
			} else {
				_message.hide ();
				$('nav #selector li.' + layerId + ' p.total').show();
			}
		},
		
		
		// Function to parse the form values, returning the minimal required set of key/value pairs
		parseFormValues: function (layerId)
		{
			// Start a list of parameters that have a value
			var parameters = {};
			
			// Define the delimiter used for combining groups
			var delimiter = ',';	// Should match the delimiter defined by the API
			
			// Loop through list of inputs (e.g. checkboxes, select, etc.) for the selected layer
			var processing = {};
			var processingStrategy;
			$('form#data #' + layerId + ' :input').each(function() {
				
				// Determine the input type
				var tagName = this.tagName.toLowerCase();	// Examples: 'input', 'select'
				var type = $(this).prop('type');			// Examples: 'text', 'checkbox', 'select-one'
				
				// Obtain the element name and value
				var name = $(this).attr('name');
				var value = $(this).val();
				
				// For checkboxes, degroup them by creating/adding a value that is checked, split by the delimiter
				if (tagName == 'input' && type == 'checkbox') {
					if (this.checked) {
						
						// Get name of this checkbox, stripping any trailing grouping indicator '[]' (e.g. values for 'foo[]' are registered to 'foo')
						name = name.replace(/\[\]$/g, '');
						
						// Determine if there is a post-processing instruction
						processingStrategy = $(this).parent().attr('data-processing');
						if (processingStrategy) {
							processing[name] = processingStrategy;
						}
						
						// Register the value
						if (processingStrategy && (processingStrategy == 'array')) {
							if (!parameters.hasOwnProperty('name')) {parameters[name] = [];}	// Initialise if required
							parameters[name].push (value);
						} else if (parameters[name]) {
							parameters[name] += delimiter + value; // Add value
						} else {
							parameters[name] = value; // Set value
						}
					}
					return;	// Continue to next input
				}
				
				// For range, look for an associated datalist and look up the data values in that
				if (tagName == 'input' && type == 'range') {
					if (this.list) {
						var datalistValue = $('option[value="' + value + '"]', this.list).attr('data-value');
						if (datalistValue) {
							parameters[name] = datalistValue;
							return;	// Continue to next input
						}
					}
				}
				
				// For all other input types, if there is a value, register it
				if (value.length > 0) {
					parameters[name] = value;	// Set value
					return;	// Continue to next input
				}
			});
			
			// Handle processing when enabled
			$.each(processing, function (name, processingStrategy) {
				
				// Array strategy: convert values list to '["value1", "value2", ...]'
				if (processingStrategy == 'array') {
					parameters[name] = '["' + parameters[name].join('", "') + '"]';
				}
			});
			
			// If the layer requires that query fields are prefixed with a namespace, prefix each fieldname
			if (_layerConfig[layerId].parameterNamespace) {
				var parametersNamespaced = {};
				$.each(parameters, function (field, value) {
					field = _layerConfig[layerId].parameterNamespace + field;
					parametersNamespaced[field] = value;
				});
				parameters = parametersNamespaced;
			}
			
			// Add in boundary data if drawn; this will override bbox (added later)
			if (_settings.enableDrawing) {
				var boundary = $('form#data #drawing :input').val();
				if (boundary) {
					parameters.boundary = boundary;
				}
			}
			
			// Return the parameters
			return parameters;
		},
		
		
		// Function to manipulate the map based on form interactions
		getData: function (layerId, parameters)
		{
			// End if the layer has been disabled (as the event handler from _map.on('moveend', ...) may still be firing)
			if (!_layers[layerId]) {return;}
			
			// If a minimum zoom is specified, end if the zoom is too low
			if (_layerConfig[layerId].minZoom) {
				if (_map.getZoom () < _layerConfig[layerId].minZoom) {return;}
			}
			
			// If the layer is a tile layer rather than an API call, add it and end
			if (_layerConfig[layerId].tileLayer) {
				var tileUrl = _layerConfig[layerId].tileLayer[0];
				var tileOptions = _layerConfig[layerId].tileLayer[1];
				
				// Substitute placeholder values, e.g. style switcher
				if (parameters) {
					var placeholder;
					$.each(parameters, function (field, value) {
						placeholder = '{%' + field + '}';
						tileUrl = tileUrl.replace(placeholder, value);
					});
				}
				
				// Force redraw if already present, e.g. with different style options
				if (_tileOverlayLayers[layerId]) {
					_map.removeLayer(_tileOverlayLayers[layerId]);
				}
				
				// Add to the map
				_tileOverlayLayers[layerId] = L.tileLayer(tileUrl, tileOptions);
				_map.addLayer(_tileOverlayLayers[layerId]);
				
				// No further action, e.g. API calls
				return;
			}
			
			// Start API data parameters
			var apiData = {};
			
			// Add the key, unless disabled
			var sendApiKey = (_layerConfig[layerId].hasOwnProperty('apiKey') ? _layerConfig[layerId].apiKey : true);
			if (sendApiKey) {
				apiData.key = _settings.apiKey;
			}
			
			// Add fixed parameters if present
			if (_layerConfig[layerId].apiFixedParameters) {
				$.each(_layerConfig[layerId].apiFixedParameters, function (field, value) {
					apiData[field] = value;
				});
			}
			
			// If required for this layer, reformat a drawn boundary, leaving it unchanged for other layers
			if (parameters.boundary) {
				if (_layerConfig[layerId].hasOwnProperty('apiBoundaryFormat')) {
					parameters.boundary = layerviewer.reformatBoundary (parameters.boundary, _layerConfig[layerId].apiBoundaryFormat);
				}
			}
			
			// Determine which retrieval strategy is needed - bbox (default) or lat/lon
			var retrievalStrategy = _layerConfig[layerId].retrievalStrategy || 'bbox';
			
			// Unless a boundary is drawn in, supply a bbox or lat/lon
			if (!parameters.boundary) {
				
				// For bbox, get the bbox, and reduce the co-ordinate accuracy to avoid over-long URLs
				if (retrievalStrategy == 'bbox') {
					parameters.bbox = _map.getBounds().toBBoxString();
					parameters.bbox = layerviewer.reduceBboxAccuracy (parameters.bbox);
				}
				
				// For poly, convert map extents to a boundary listing
				if (retrievalStrategy == 'polygon') {	// As lat1,lon1:lat2,lon2:...
					var sw = _map.getBounds().getSouthWest();
					var se = _map.getBounds().getSouthEast();
					var ne = _map.getBounds().getNorthEast();
					var nw = _map.getBounds().getNorthWest();
					parameters.boundary = sw.lat + ',' + sw.lng + ':' + se.lat + ',' + se.lng + ':' + ne.lat + ',' + ne.lng + ':' + nw.lat + ',' + nw.lng + ':' + sw.lat + ',' + sw.lng;
				}
			}
			
			// If required, rename the boundary field, as some APIs use a different fieldname to 'boundary'
			if (parameters.boundary) {
				if (_layerConfig[layerId].apiBoundaryField) {
					var apiBoundaryField = _layerConfig[layerId].apiBoundaryField;
					parameters[apiBoundaryField] = parameters.boundary;
					delete parameters.boundary;
				}
			}
			
			// Send zoom if required
			var sendZoom = layerviewer.glocalVariable ('sendZoom', layerId);
			if (sendZoom) {
				apiData.zoom = _map.getZoom ();
			}
			
			// Add in the parameters from the form
			$.each(parameters, function (field, value) {
				apiData[field] = value;
			});
			
			// Add beta flag if enabled
			if (_betaMode) {
				apiData['beta'] = 1;
			}
			
			// If no change (e.g. map move while boundary set, and no other changes), avoid re-requesting data
			var requestSerialised = $.param(apiData);
			if (_requestCache[layerId]) {
				if (requestSerialised == _requestCache[layerId]) {
					return;
				}
			}
			_requestCache[layerId] = requestSerialised;     // Update cache
			
			// Set/update a cookie containing the full request state
			layerviewer.setStateCookie ();
			
			// Determine the API URL to use
			var apiUrl = _layerConfig[layerId].apiCall;
			if (! (/https?:\/\//).test (apiUrl)) {
				apiUrl = _settings.apiBaseUrl + apiUrl;
			}
			
			// If an outstanding layer request is still active, cancel it
			if (_xhrRequests[layerId] != null) {
				_xhrRequests[layerId].abort();
				_xhrRequests[layerId] = null;
			}
			
			// Start data loading spinner for this layer
			$('#selector li.' + layerId + ' img.loading').show();
			
			// Fetch data
			_xhrRequests[layerId] = $.ajax({
				url: apiUrl,
				dataType: (_layerConfig[layerId].dataType ? _layerConfig[layerId].dataType : (layerviewer.browserSupportsCors () ? 'json' : 'jsonp')),		// Fall back to JSON-P for IE9
				crossDomain: true,	// Needed for IE<=9; see: https://stackoverflow.com/a/12644252/180733
				data: apiData,
				error: function (jqXHR, error, exception) {
					
					// Deregister from the request registry
					_xhrRequests[layerId] = null;
					
					// Stop data loading spinner for this layer
					$('#selector li.' + layerId + ' img.loading').hide();
					
					/* Commented out as can be obtrusive if an API endpoint is slow/down
					// Catch cases of being unable to access the server, e.g. no internet access; avoids "Unexpected token u in JSON at position 0" errors
					if (jqXHR.status == 0) {
						vex.dialog.alert ('Error: Could not contact the server; perhaps your internet connection is not working?');
						return;
					}
					*/
					
					// Show error, unless deliberately aborted
					if (jqXHR.statusText != 'abort') {
						var data = $.parseJSON(jqXHR.responseText);
						vex.dialog.alert ('Error: ' + data.error);
					}
				},
				success: function (data, textStatus, jqXHR) {
					
					// Deregister from the request registry
					_xhrRequests[layerId] = null;
					
					// Stop data loading spinner for this layer
					$('#selector li.' + layerId + ' img.loading').hide();
					
					// Determine error handling UI mode
					var errorNonModalDialog = layerviewer.glocalVariable ('errorNonModalDialog', layerId);
					
					// Show API-level error if one occured
					// #!# This is done here because the API still returns Status code 200
					if (data.error) {
						layerviewer.removeLayer (layerId, false);
						var errorMessage = (_layerConfig[layerId].name ? _layerConfig[layerId].name : layerId) + ' layer: ' + data.error;
						if (errorNonModalDialog) {
							_message.show (errorMessage);
						} else {
							vex.dialog.alert (errorMessage);
						}
						return {};
					} else {
						if (errorNonModalDialog) {
							_message.hide ();
						}
					}
					
					// Return the data successfully
					return layerviewer.showCurrentData (layerId, data, apiData, requestSerialised);
				}
			});
		},
		
		
		// Function to determine the value of a variable settable globally and/or locally
		glocalVariable: function (variableName, layerId)
		{
			// Default to global value
			var value = _settings[variableName];
			
			// Layer-specific setting can override global
			if (_layerConfig[layerId].hasOwnProperty(variableName)) {
				value = _layerConfig[layerId][variableName];
			}
			
			// Return the value
			return value;
		},
		
		
		// Details dialog box handler
		detailsOverlayHandler: function (triggerElement, layerId)
		{
			// Register a handler; note that the HTML in bindPopup doesn't exist yet, so $(triggerElement) can't be used; instead, this listens for click events on the map element which will bubble up from the tooltip, once it's created and someone clicks on it; see: https://stackoverflow.com/questions/13698975/
			$('#map').on('click', triggerElement, function (e) {
				
				// Load the data, using the specified data-id attribute set in the popup HTML dynamically
				var apiUrl = $(this).attr('data-url') + '&key=' + _settings.apiKey;
				$.get(apiUrl, function (data) {
					
					// Access the data
					var feature = data.features[0];
					
					// Render the data into the overlay template
					var template = (_layerConfig[layerId].overlayHtml ? _layerConfig[layerId].overlayHtml : false);
					var html = layerviewer.renderDetails (template, feature, false, layerId);
					
					// Create the dialog box and its contents
					var divId = layerId + 'details';
					html = '<div id="' + divId + '">' + html + '</div>';
					vex.dialog.buttons.YES.text = 'Close';
					vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain wider'});
				});
				
				e.preventDefault ();
			});
		},
		
		
		// Helper function to enable fallback to JSON-P for older browsers like IE9; see: https://stackoverflow.com/a/1641582
		browserSupportsCors: function ()
		{
			return ('withCredentials' in new XMLHttpRequest ());
		},
		
		
		// Function to reduce co-ordinate accuracy of a bbox string
		reduceBboxAccuracy: function (bbox)
		{
			// Split by comma
			var coordinates = bbox.split(',');
			
			// Reduce accuracy of each coordinate
			coordinates = layerviewer.reduceCoordinateAccuracy (coordinates);
			
			// Recombine
			bbox = coordinates.join(',');
			
			// Return the string
			return bbox;
		},
		
		
		// Function to reduce co-ordinate accuracy to avoid pointlessly long URLs
		reduceCoordinateAccuracy: function (coordinates)
		{
			// Set 0.1m accuracy; see: https://en.wikipedia.org/wiki/Decimal_degrees
			var accuracy = 6;
			
			// Reduce each value
			var i;
			for (i = 0; i < coordinates.length; i++) {
				coordinates[i] = parseFloat(coordinates[i]).toFixed(accuracy);
			}
			
			// Return the modified set
			return coordinates;
		},
		
		
		// Function to reformat the boundary data for a specific layer
		reformatBoundary: function (boundary, format)
		{
			// For latlon-comma-colons format, order as lat,lon pairs, separated by colons
			if (format == 'latlon-comma-colons') {
				var boundaryUnpacked = JSON.parse(boundary);
				var boundaryPoints = [];
				var i;
				for (i = 0; i < boundaryUnpacked.length; i++) {
					boundaryPoints[i] = boundaryUnpacked[i][1] + ',' + boundaryUnpacked[i][0];	// lat,lon
				}
				boundary = boundaryPoints.join(':');
				return boundary;
			}
		},
		
		
		// Function to set/update a cookie containing the full request state
		setStateCookie: function ()
		{
			Cookies.set ('state', _requestCache, {expires: 14});
		},
		
		
		// Function to construct the popup/overlay content
		renderDetails: function (template, feature, layer, layerId)
		{
			// Use a template if this has been defined in the layer config
			var html;
			if (template) {
				
				// Define a path parser, so that the template can define properties.foo which would obtain feature.properties.foo; see: https://stackoverflow.com/a/22129960
				Object.resolve = function(path, obj) {
					return path.split('.').reduce(function(prev, curr) {
						return (prev ? prev[curr] : undefined);
					}, obj || self);
				};
				
				// Convert Street View macro
				if (template.indexOf ('{%streetview}') >= 0) {
					template = template.replace ('{%streetview}', layerviewer.streetViewTemplate (feature));
				}
				
				// Convert OSM edit link macro
				if (template.indexOf ('{%osmeditlink}') >= 0) {
					if (layer) {	// Layer is not always supported by callers of this function
						var bounds = layer.getBounds();
						var centrePoint = bounds.getCenter();
						var zoom = _map.getBoundsZoom (bounds) - 1;	// -1 to zoom out a level
						var osmEditUrl = 'https://www.openstreetmap.org/edit#map=' + zoom + '/' + centrePoint.lat + '/' + centrePoint.lng;
						template = template.replace ('{%osmeditlink}', '<a class="edit" target="_blank" href="' + osmEditUrl + '">Edit in OSM</a>');
					}
				}
				
				// If any property is null, show '?' instead
				$.each (feature.properties, function (key, value) {
					if (value === null) {
						feature.properties[key] = '<span class="unknown">?</span>';
					}
				});
				
				// Replace template placeholders; see: https://stackoverflow.com/a/378000
				html = template.replace (/\{[^{}]+\}/g, function(path){
					return Object.resolve ( path.replace(/[{}]+/g, '') , feature);
				});
				
				// Support 'yearstable' macro, which generates a table of fields for each year, with parameters: first year, last year, fieldslist split by semicolon, labels for each field split by semicolon
				var matches = html.match (/\[macro:yearstable\((.+), (.+), (.+), (.+)\)\]/);
				if (matches) {
					html = html.replace (matches[0], layerviewer.macroYearstable (matches, feature));
				}
				
			// Otherwise, create a simple key/value pair HTML table dynamically
			} else {
				
				html = '<table>';
				var fieldLabel;
				$.each (feature.properties, function (key, value) {
					
					// Skip if value is an array/object
					if ($.type (value) === 'array')  {return; /* i.e. continue */}
					if ($.type (value) === 'object') {return; /* i.e. continue */}
					
					// Key
					fieldLabel = key;
					if (_layerConfig[layerId].popupLabels) {
						if (_layerConfig[layerId].popupLabels[key]) {
							fieldLabel = _layerConfig[layerId].popupLabels[key];
						}
					}
					
					// Value
					if (key == 'thumbnailUrl') {
						if (feature.properties.hasPhoto) {
							html += '<p><img src="' + value + '" /></p>';
						}
					}
					if (value === null) {
						value = '[null]';
					}
					if (typeof value == 'string') {
						value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
					}
					
					// Apply number_format (if numeric)
					value = layerviewer.number_format (value);
					
					// If a callback formatter, use that instead, ignoring other changes
					if (_layerConfig[layerId].popupFormatters) {
						if (_layerConfig[layerId].popupFormatters[key]) {
							value = _layerConfig[layerId].popupFormatters[key] (feature.properties[key], feature);
						}
					}
					
					// Compile the HTML
					html += '<tr><td>' + fieldLabel + ':</td><td><strong>' + value + '</strong></td></tr>';
				});
				html += '</table>';
			}
			
			// Return the content
			return html;
		},
		
		
		// Street View container template
		streetViewTemplate: function (feature)
		{
			// Determine the lon/lat values
			var longitude;
			var latitude;
			switch (feature.geometry.type) {
				case 'Point':
					longitude = feature.geometry.coordinates[0];
					latitude = feature.geometry.coordinates[1];
					break;
				case 'LineString':	// Take the centre-point
					longitude = ((feature.geometry.coordinates[0][0] + feature.geometry.coordinates[1][0]) / 2);
					latitude = ((feature.geometry.coordinates[0][1] + feature.geometry.coordinates[1][1]) / 2);
					break;
				default:
					// Geometry type not yet supported
			}
			
			// Assemble and return the HTML
			return '<iframe id="streetview" src="/streetview.html?latitude=' + latitude + '&longitude=' + longitude + '">Street View loading &hellip;</div>';
		},
		
		
		// Helper function to process a macro
		macroYearstable: function (matches, feature)
		{
			// Extract the matches
			var minYear = matches[1];
			var maxYear = matches[2];
			var fields = matches[3].split (';');
			var labels = matches[4].split (';');
			
			// Create a year range
			var years = layerviewer.range (parseInt(minYear), parseInt(maxYear));
			
			// Build the table, starting with the headings, representing the years
			var html = '<table>';
			html += '<tr>';
			html += '<th>Year:</th>';
			$.each (fields, function (fieldIndex, field) {
				html += '<th>' + labels[fieldIndex] + '</th>';
			});
			html += '</tr>';
			
			// Index the fields by field then year index
			var fieldsByYear = [];
			$.each (fields, function (fieldIndex, field) {
				fieldsByYear[field] = feature.properties[field].split(',');
			});
			
			// Add each field's data row
			$.each (years, function (yearIndex, year) {
				html += '<tr>';
				html += '<td><strong>' + year + ':</strong></td>';
				$.each (fields, function (fieldIndex, field) {
					var value = fieldsByYear[field][yearIndex];
					html += '<td>' + (layerviewer.isNumeric (value) ? Number(value).toLocaleString() : value) + '</td>';
				});
				html += '</tr>';
			});
			html += '</table>';
			
			// Return the table HTML
			return html;
		},
		
		
		// Helper function to create a number range; see: https://stackoverflow.com/a/3746752
		range: function (start, end)
		{
			if (start > end) {return [];}	// Prevent accidental infinite iteration
			var range = [];
			for (var i = start; i <= end; i++) {
				range.push(i);
			}
			return range;
		},
		
		
		// Helper function to check if a value is numeric; see: https://stackoverflow.com/a/9716515
		isNumeric: function (value)
		{
			return !isNaN (parseFloat (value)) && isFinite (value);
		},
		
		
		// Function to show the data for a layer
		showCurrentData: function (layerId, data, requestData, requestSerialised)
		{
			// If a heatmap, divert to this
			if (_layerConfig[layerId].heatmap) {
				layerviewer.heatmap(layerId, data);
				return;
			}
			
			// If this layer already exists, remove it so that it can be redrawn
			layerviewer.removeLayer (layerId, true);
			
			// Determine the field in the feature.properties data that specifies the icon to use
			var iconField = _layerConfig[layerId].iconField;
			
			// Convert using a callback if required
			if (_layerConfig[layerId].convertData) {
				data = _layerConfig[layerId].convertData (data);
				//console.log(data);
			}
			
			// Convert from flat JSON to GeoJSON if required
			if (_layerConfig[layerId].flatJson) {
				data = GeoJSON.parse(data, {Point: _layerConfig[layerId].flatJson});
				//console.log(data);
			}
			
			// If marker importance is defined, define the zIndex offset values for each marker type, to be based on the iconField
			if (_layerConfig[layerId].markerImportance) {
				var markerZindexOffsets = [];
				$.each (_layerConfig[layerId].markerImportance, function (index, iconFieldValue) {
					markerZindexOffsets[iconFieldValue] = 1000 + (100 * index);	// See: http://leafletjs.com/reference-1.2.0.html#marker-zindexoffset
				});
			}
			
			// Determine the parameters
			var popupHtml = layerviewer.sublayerableConfig ('popupHtml', layerId, requestData);
			var lineColourField = layerviewer.sublayerableConfig ('lineColourField', layerId, requestData);
			var lineColourStops = layerviewer.sublayerableConfig ('lineColourStops', layerId, requestData);
			var intervals = layerviewer.sublayerableConfig ('intervals', layerId, requestData);
			
			// Set the legend
			layerviewer.setLegend (layerId, intervals, lineColourStops);
			
			// Define the data layer
			var totalItems = 0;
			_currentDataLayer[layerId] = L.geoJson(data, {
				
				// Set icon type
				pointToLayer: function (feature, latlng) {
					
					// Determine whether to use a local fixed icon, a local icon set, or an icon field in the data
					var iconUrl = _settings.iconUrl;
					if (_layerConfig[layerId].iconUrl) {
						iconUrl = _layerConfig[layerId].iconUrl;
					} else if (_layerConfig[layerId].icons) {
						iconUrl = _layerConfig[layerId].icons[feature.properties[iconField]];
					} else {
						iconUrl = feature.properties[iconField];
					}
					
					// Determine icon size
					var iconSize = _settings.iconSize;
					if (_layerConfig[layerId].iconSize) {
						iconSize = _layerConfig[layerId].iconSize;
					}
					
					// Compile marker properties
					var markerProperties = {};
					if (iconUrl) {
						markerProperties = {
							// Icon properties as per: http://leafletjs.com/reference.html#icon and http://leafletjs.com/examples/custom-icons/
							icon: L.icon({
								iconUrl: iconUrl,
								iconSize: iconSize
							})
						};
					}
					
					// Construct the icon
					var icon = L.marker (latlng, markerProperties);
					
					// Set the icon zIndexOffset if required
					if (_layerConfig[layerId].markerImportance) {
						var fieldValue = feature.properties[iconField];
						icon.setZIndexOffset (markerZindexOffsets[fieldValue]);
					}
					
					// Return the icon
					return icon;
				},
				
				// Set popup
				onEachFeature: function (feature, layer) {
					totalItems++;
					
					// Determine the popup content
					var popupContent = layerviewer.renderDetails (popupHtml, feature, layer, layerId);
					layer.bindPopup(popupContent, {autoPan: false, className: layerId});
					
					// Add hover style if enabled
					if (layer instanceof L.Path) {		// Do not apply to markers; see: https://stackoverflow.com/a/30852790/180733
						if (_settings.hover || _layerConfig[layerId].hover) {
							layer.on('mouseover', function () {
								this.setStyle ({
									weight: 12
								});
							});
							layer.on('mouseout', function () {
								_currentDataLayer[layerId].resetStyle(this);
							});
						}
					}
				},
				
				// Rendering style
				style: function (feature) {
					var styles = {};
					
					// Start from global style if supplied
					if (_settings.style) {
						styles = _settings.style;
					}
					
					// Start from default layer style if supplied
					if (_layerConfig[layerId].style) {
						styles = _layerConfig[layerId].style;
					}
					
					// Set polygon style if required
					if (_layerConfig[layerId].polygonStyle) {
						switch (_layerConfig[layerId].polygonStyle) {
							
							// Blue boxes with dashed lines, intended for data that is likely to tessellate, e.g. adjacent box grid
							case 'grid':
								styles.fillColor = (feature.properties.hasOwnProperty('colour') ? feature.properties.colour : '#03f');
								styles.weight = 1;
								styles.dashArray = [5, 5];
								break;
							
							// Green
							case 'green':
								styles.color = 'green';
								styles.fillColor = '#090';
								break;
							
							// Red
							case 'red':
								styles.color = 'red';
								styles.fillColor = 'red';
								break;
						}
					}
					
					// Set line colour if required
					if (lineColourField && lineColourStops) {
						styles.color = layerviewer.lookupStyleValue (feature.properties[lineColourField], lineColourStops);
					}
					
					// Set line width if required
					if (_layerConfig[layerId].lineWidthField && _layerConfig[layerId].lineWidthStops) {
						styles.weight = layerviewer.lookupStyleValue (feature.properties[_layerConfig[layerId].lineWidthField], _layerConfig[layerId].lineWidthStops);
					}
					
					// Use supplied colour if present
					if (feature.properties.hasOwnProperty('color')) {
						styles.color = feature.properties.color;
					}
					
					// Return the styles that have been defined, if any
					return styles;
				}
			});
			
			// Update the total count
			$('nav #selector li.' + layerId + ' p.total').html(totalItems);
			
			// Enable/update CSV/GeoJSON export link(s), if there are items, and show the count
			if (totalItems) {
				if ( $('#sections #' + layerId + ' div.export a').length == 0) {	// i.e. currently unlinked
					var exportUrlCsv = (_layerConfig[layerId].apiCall.match (/^https?:\/\//) ? '' : _settings.apiBaseUrl) + _layerConfig[layerId].apiCall + '?' + requestSerialised + '&format=csv';
					var exportUrlGeojson = (_layerConfig[layerId].apiCall.match (/^https?:\/\//) ? '' : _settings.apiBaseUrl) + _layerConfig[layerId].apiCall.replace(/.json$/, '.geojson') + '?' + requestSerialised;
					$('#sections #' + layerId + ' div.export p').append(' <span>(' + totalItems + ')</span>');
					$('#sections #' + layerId + ' div.export .csv').wrap('<a href="' + exportUrlCsv + '"></a>');
					$('#sections #' + layerId + ' div.export .geojson').wrap('<a href="' + exportUrlGeojson + '"></a>');
					$('#sections #' + layerId + ' div.export p').addClass('enabled');
				}
			}
			
			// Add to the map
			_currentDataLayer[layerId].addTo(_map);
		},
		
		
		// Function to obtain a value from a sublayerable configuration parameter
		sublayerableConfig: function (field, layerId, requestData)
		{
			var value = false;
			if (_layerConfig[layerId][field]) {
				
				// If enabled, select settings dependent on the value of a parameter in the request
				if (_layerConfig[layerId].sublayerParameter) {
					if (requestData[_layerConfig[layerId].sublayerParameter]) {
						var sublayerValue = requestData[_layerConfig[layerId].sublayerParameter];
						
						// Allocate the values
						value = _layerConfig[layerId][field][sublayerValue];
					}
				} else {
					value = _layerConfig[layerId][field];
				}
			}
			
			// Return the value
			return value;
		},
		
		
		// Assign style from lookup table
		lookupStyleValue: function (value, lookupTable)
		{
			// Loop through each style stop until found
			var styleStop;
			for (var i = 0; i < lookupTable.length; i++) {
				styleStop = lookupTable[i];
				if (typeof lookupTable[0][0] === 'string') {	// Fixed string values
					if (value == styleStop[0]) {
						return styleStop[1];
					}
				} else {					// Range values
					if (value >= styleStop[0]) {
						return styleStop[1];
					}
				}
			}
			
			// Fallback to final colour in the list
			return styleStop[1];
		},
		
		
		// Heatmap; see: https://github.com/Leaflet/Leaflet.heat
		heatmap: function (layerId, data)
		{
			// Parse the address points
			var points = data.map(function (point) {
				return [ point[0], point[1] ];
			});
			
			// Redraw if required
			if (_heatmapOverlayLayers[layerId]) {
				_map.removeLayer(_heatmapOverlayLayers[layerId]);
			}
			
			// Create the heatmap
			_heatmapOverlayLayers[layerId] = L.heatLayer(points);
			
			// Add to map
			_heatmapOverlayLayers[layerId].addTo(_map);
		},
		
		
		// Function to remove a layer
		removeLayer: function (layerId, temporaryRedrawing)
		{
			// If the layer is a tile layer rather than an API call, remove it and end
			if (_layerConfig[layerId].tileLayer) {
				if (_tileOverlayLayers[layerId]) {
					_map.removeLayer(_tileOverlayLayers[layerId]);
				}
				
				// No further action, e.g. API calls
				return;
			}
			
			// If the layer is a heatmap layer rather than an API call, remove it and end
			if (_layerConfig[layerId].heatmap) {
				if (_heatmapOverlayLayers[layerId]) {
					_map.removeLayer(_heatmapOverlayLayers[layerId]);
				}
			}
			
			// Remove the layer, checking first to ensure it exists
			if (_currentDataLayer[layerId]) {
				_map.removeLayer (_currentDataLayer[layerId]);
			}
			
			// Remove the total count
			$('nav #selector li.' + layerId + ' p.total').html('');
			
			// Remove/reset the export link, and its count
			if ($('#sections #' + layerId + ' div.export p a').length) {	// i.e. currently linked
				$('#sections #' + layerId + ' div.export p a').contents().unwrap();
				$('#sections #' + layerId + ' div.export p').removeClass('enabled');
				$('#sections #' + layerId + ' div.export span').remove();
			}
			
			// Reset cache entry
			if (!temporaryRedrawing) {
				delete _requestCache[layerId];
			}
		},
		
		
		// Drawing functionality, wrapping Leaflet.draw
		drawing: function (targetField, fragmentOnly, defaultValueString)
		{
			// Options for polygon drawing
			var polygon_options = {
				showArea: false,
				shapeOptions: {
					stroke: true,
					color: 'blue',
					weight: 4,
					opacity: 0.5,
					fill: true,
					fillColor: null, //same as color by default
					fillOpacity: 0.2,
					clickable: true
				}
			};
			
			// Create a map drawing layer
			var drawnItems = new L.FeatureGroup();
			
			// Add default value if supplied; currently only polygon type supplied
			if (defaultValueString) {
				
				// Convert the string to an array of L.latLng(lat,lon) values
				var polygonPoints = JSON.parse(defaultValueString);
				var defaultPolygon = [];
				if (polygonPoints) {
					var i;
					var point;
					for (i = 0; i < polygonPoints.length; i++) {
						point = polygonPoints[i];
						defaultPolygon.push (L.latLng(point[1], point[0]));
					}
				}
				
				// Create the polygon and style it
				var defaultPolygonFeature = L.polygon(defaultPolygon, polygon_options.shapeOptions);
				
				// Create the layer and add the polygon to the layer
				var defaultLayer = new L.layerGroup();
				defaultLayer.addLayer(defaultPolygonFeature);
				
				// Add the layer to the drawing canvas
				drawnItems.addLayer(defaultLayer);
			}
			
			// Add the drawing layer to the map
			_map.addLayer(drawnItems);
			
			// Enable the polygon drawing when the button is clicked
			var drawControl = new L.Draw.Polygon(_map, polygon_options);
			$('.draw.area').click(function() {
				drawControl.enable();
				
				// Allow only a single polygon at present
				// #!# Remove this when the server-side allows multiple polygons
				drawnItems.clearLayers();
			});
			
			// Handle created polygons
			_map.on('draw:created', function (e) {
				var layer = e.layer;
				drawnItems.addLayer(layer);
				
				// Convert to GeoJSON value
				var geojsonValue = drawnItems.toGeoJSON();
				
				// Reduce coordinate accuracy to 6dp (c. 1m) to avoid over-long URLs
				// #!# Ideally this would be native within Leaflet.draw: https://github.com/Leaflet/Leaflet.draw/issues/581
				var coordinates = geojsonValue.features[0].geometry.coordinates[0];
				var accuracy = 6;	// Decimal points; gives 0.1m accuracy; see: https://en.wikipedia.org/wiki/Decimal_degrees
				var i;
				var j;
				for (i = 0; i < coordinates.length; i++) {
					for (j = 0; j < coordinates[i].length; j++) {
						coordinates[i][j] = +coordinates[i][j].toFixed(accuracy);
					}
				}
				geojsonValue.features[0].geometry.coordinates[0] = coordinates;
				
				// If required, send only the coordinates fragment
				if (fragmentOnly) {
					geojsonValue = coordinates;
				}
				
				// Send to receiving input form
				$(targetField).val(JSON.stringify(geojsonValue));
				
				// Trigger jQuery change event, so that .change() behaves as expected for the hidden field; see: https://stackoverflow.com/a/8965804
				// #!# Note that this fires twice for some reason - see notes to the answer in the above URL
				$(targetField).trigger('change');
			});
			
			// Cancel button clears drawn polygon and clears the form value
			$('.edit-clear').click(function() {
				drawnItems.clearLayers();
				$(targetField).val('');
			
				// Trigger jQuery change event, so that .change() behaves as expected for the hidden field; see: https://stackoverflow.com/a/8965804
				$(targetField).trigger('change');
			});
			
			// Undo button
			$('.edit-undo').click(function() {
				drawnItems.revertLayers();
			});
		},
		
		
		// Region switcher
		regionSwitcher: function ()
		{
			// End if not enabled
			if (!_settings.regionsFile) {return;}
			
			// End if not enabled
			if (!_settings.regionsField) {return;}
			
			// Load the GeoJSON file
			$.ajax({
				url: _settings.regionsFile,
				dataType: (layerviewer.browserSupportsCors () ? 'json' : 'jsonp'),		// Fall back to JSON-P for IE9
				error: function (jqXHR, error, exception) {
					vex.dialog.alert ('Error: could not load regions list file.');
				},
				success: function (data, textStatus, jqXHR) {
					
					// Parse the areas to centre-points
					var regions = layerviewer.regionsToList (data);
					
					// Order list
					var names = [];
					$.each (regions, function (name, bounds) {
						names.push (name);
					});
					names.sort();
					
					// Create a droplist
					var html = '<select>';
					html += '<option value="">Move to area:</option>';
					$.each (names, function (index, name) {
						html += '<option value="' + layerviewer.htmlspecialchars (name) + '">' + layerviewer.htmlspecialchars (layerviewer.ucfirst (name)) + '</option>';
					});
					html += '</select>';
					
					// Add to the map
					var regionswitcher = L.control({position: 'topright'});
					regionswitcher.onAdd = function () {
						return L.DomUtil.create ('div', 'regionswitcher');
					}
					regionswitcher.addTo(_map);
					$('.regionswitcher').html (html);
					
					// Add a handler
					$('.regionswitcher select').change (function () {
						if (this.value) {
							var selectedRegion = this.value;
							_map.fitBounds (regions[selectedRegion]);
						}
						
						// #!# IE bug workaround: need to move the focus to something else, otherwise change works first time but not after that
						if (navigator.appVersion.indexOf('Trident/') !== -1) {
							$('.regionswitcher select').focus();
						}
					});
				}
			});
		},
		
		
		/* private */ regionsToList: function (data)
		{
			// Start a list of regions
			var regions = {};
			
			// Ensure basic GeoJSON structure
			if (!data.type) {return regions;}
			if (data.type != 'FeatureCollection') {return regions;}
			if (!data.features) {return regions;}
			
			// Parse each feature for name and location
			var name;
			var bounds;
			var geojson = L.geoJSON(data, {
				onEachFeature: function (feature, layer) {
					
					// Get the name, or skip if not present
					if (!feature.properties[_settings.regionsField]) {return false;}
					name = feature.properties[_settings.regionsField];
					
					// Get location; see: https://gis.stackexchange.com/a/167425/58752
					bounds = layer.getBounds();
					
					// Register function
					regions[name] = bounds;
				}
			});
			
			// Return the list
			return regions;
		},
		
		
		// Function to make data entity-safe
		htmlspecialchars: function (string)
		{
			if (typeof string !== 'string') {return string;}
			return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		},
		
		
		// Function to make first character upper-case; see: https://stackoverflow.com/a/1026087/180733
		ucfirst: function (string)
		{
			if (typeof string !== 'string') {return string;}
			return string.charAt(0).toUpperCase() + string.slice(1);
		},
		
		
		// Feedback box and handler
		feedbackHandler: function ()
		{
			// Obtain the HTML from the page
			var html = $('#feedback').html();
			
			$('a.feedback').click (function (e) {
				html = '<div id="feedbackbox">' + html + '</div>';
				vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain feedback'});
				
				// Create the form handler, which submits to the API
				$('#feedbackbox form').submit (function(event) {	// #feedbackbox form used as #feedbackform doesn't seem to exist in the DOM properly in this context
					var resultHtml;
					
					// Feedback URL; re-use of settings values is supported, represented as placeholders {%apiBaseUrl}, {%apiKey}
					var feedbackApiUrl = layerviewer.settingsPlaceholderSubstitution (_settings.feedbackApiUrl, ['apiBaseUrl', 'apiKey']);
					
					var form = $(this);
					$.ajax({
						url: feedbackApiUrl,
						type: form.attr('method'),
						data: form.serialize()
					}).done (function (result) {
						
						// Detect API error
						if ('error' in result) {
							resultHtml = "<p class=\"error\">Sorry, an error occured. The API said: <em>" + result.error + '</em></p>';
							$('#feedbackbox').replaceWith (resultHtml);
						
						// Normal result; NB result.id is the feedback number
						} else {
							resultHtml  = '<p class="success">&#10004; Thank you for submitting feedback.</p>';
							resultHtml += '<p>We read all submissions and endeavour to respond to all feedback.</p>';
							$('#feedbackbox').replaceWith (resultHtml);
						}
						
					}).fail (function (failure) {
						resultHtml = '<p>There was a problem contacting the server; please try again later. The failure was: <em>' + failure.responseText + '</em>.</p>';
						$('#feedbackbox').replaceWith (resultHtml);
					});
					
					// Prevent normal submit
					event.preventDefault();
				});
				
				// Prevent following link to contact page
				return false;
			});
		},
		
		
		// Page dialog handler
		pageDialog: function (contentDivId)
		{
			// Read in the HTML
			var html = $('#' + contentDivId).html();
			
			// Create the handler to launch a dialog box
			$('a[href="#' + contentDivId + '"]').click (function (event) {
				vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain page'});
				return false;
			});
		},
		
		
		// Number formatting; see: http://phpjs.org/functions/number_format/
		number_format: function (number, decimals, dec_point, thousands_sep)
		{
			// End if not actually numeric
			if (number == null || !isFinite (number)) {
				return number;
			}
			
			// Strip all characters but numerical ones
			number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
			var n = !isFinite(+number) ? 0 : +number;
			var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
			var sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep;
			var dec = (typeof dec_point === 'undefined') ? '.' : dec_point;
			var s = '';
			var toFixedFix = function (n, prec) {
				var k = Math.pow(10, prec);
				return '' + Math.round(n * k) / k;
			};
			// Fix for IE parseFloat(0.55).toFixed(0) = 0;
			s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
			if (s[0].length > 3) {
				s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
			}
			if ((s[1] || '').length < prec) {
				s[1] = s[1] || '';
				s[1] += new Array(prec - s[1].length + 1).join('0');
			}
			return s.join(dec);
		}
	};
	
} (jQuery));

