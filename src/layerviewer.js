// LayerViewer library code

/*jslint browser: true, white: true, single: true, for: true, long: true, unordered: true */
/*global $, jQuery, mapboxgl, MapboxDraw, geojsonExtent, autocomplete, Cookies, vex, GeoJSON, FULLTILT, L, Papa, jsSHA, toGeoJSON, alert, console, window, history, DeviceOrientationEvent */

var layerviewer = (function ($) {
	
	'use strict';
	
	// Settings defaults
	var _settings = {
		
		// API
		apiBaseUrl: 'API_BASE_URL',
		apiKey: 'YOUR_API_KEY',
		
		// Mapbox API key
		mapboxApiKey: 'YOUR_MAPBOX_API_KEY',
		
		// Initial lat/lon/zoom of map and tile layer
		defaultLocation: {
			latitude: 54.661,
			longitude: 1.263,
			zoom: 6
		},
		maxBounds: null,	// Or [W,S,E,N]
		defaultTileLayer: 'mapnik',
		maxZoom: 20,
		
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
		
		// Enable/disable 3D terrain (Mapbox GL JS v.2.0.0+)
		enable3dTerrain: false,
		
		// Enable placenames to be above layers
		placenamesOnTop: true,
		
		// Enable/disable full screen map control
		enableFullScreen: false,
		fullScreenPosition: 'top-left',
		
		// Enable/disable drawing feature
		enableDrawing: true,
		drawingGeometryType: 'Polygon',		// Or LineString
		
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
		
		// Zoom control position
		zoomPosition: 'bottom-right',
		
		// Geolocation position, or false for no geolocation element
		geolocationPosition: 'top-right',

		// Use existing geolocation button instead of Mapbox's
		geolocationElementId: false,
		
		// Display a dot that tracks user location (usual design language on mobile)
		trackUser: true,
		
		// Whether to enable popups
		popups: true,		// NB Not yet implemented for point-based layers
		
		// Default icon and size
		iconUrl: null,
		iconSize: null,
		
		// Tileserver URLs, each as [path, options, label]
		tileUrls: {
			opencyclemap: {
				tiles: 'https://{s}.tile.cyclestreets.net/opencyclemap/{z}/{x}/{y}@2x.png',
				maxZoom: 22,
				attribution: 'Maps © <a href="https://www.thunderforest.com/">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
				tileSize: 256,		// 512 also works but 256 gives better map detail
				label: 'OpenCycleMap',
				description: 'A cycling-orientated map, highlighting cycle infrastructure, hills, bike shops and more.'
			},
			mapboxstreets: {
				vectorTiles: 'mapbox://styles/mapbox/streets-v11',
				label: 'Streets',
				description: 'A general-purpose map that emphasizes legible styling of road and transit networks.',
				placenamesLayers: ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label']
			},
			light: {
				vectorTiles: 'mapbox://styles/mapbox/light-v10',
				label: 'Light',
				description: 'A light-fade background map.',
				placenamesLayers: ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label']
			},
			night: {
				vectorTiles: 'mapbox://styles/mapbox/dark-v10',
				label: 'Night',
				description: 'A subtle, full-featured map designed to provide minimalist geographic context.',
				placenamesLayers: ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label']
			},
			satellite: {
				vectorTiles: 'mapbox://styles/mapbox/satellite-v9',
				label: 'Satellite',
				description: "A map that uses real satellite imagery to give you a bird's-eye view of your surroundings."
			},
			mapnik: {
				tiles: 'https://{s}.tile.cyclestreets.net/mapnik/{z}/{x}/{y}.png',
				maxZoom: 19,
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				tileSize: 256,
				label: 'OpenStreetMap',
				description : 'The default OpenStreetMap style, emphasising road type and surrounding buildings.'
			},
			// See: https://www.ordnancesurvey.co.uk/documents/os-open-zoomstack-vector-tile-api.pdf
			// Also later release, requiring a key, at: https://www.ordnancesurvey.co.uk/newsroom/blog/creating-your-own-vector-tiles
			osoutdoor: {
				vectorTiles: 'https://s3-eu-west-1.amazonaws.com/tiles.os.uk/styles/open-zoomstack-outdoor/style.json',
				label: 'OS outdoor',
				description: 'Display footpaths, rights of way, open access land and the vegetation on the land.',
				placenamesLayers: ['Country names', 'Capital City names', 'City names', 'Town names'],
				attribution: 'Contains Ordnance Survey data &copy; Crown copyright and database rights 2018'
			},
			osopendata: {
				tiles: 'https://{s}.tile.cyclestreets.net/osopendata/{z}/{x}/{y}.png',
				maxZoom: 19,
				attribution: 'Contains Ordnance Survey data &copy; Crown copyright and database right 2010',
				tileSize: 256,
				label: 'OS Open Data',
				description: "The OS's most detailed, street-level mapping product available, using open data sources.",
				placenamesLayers: ['Country names', 'Capital City names', 'City names', 'Town names']
			},
			bartholomew: {
				tiles: 'https://{s}.tile.cyclestreets.net/bartholomew/{z}/{x}/{y}@2x.png',
				maxZoom: 15,
				attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>',
				tileSize: 256,
				label: 'Bartholomew',
				description: "John Bartholomew's distinctive 1897 map, using colour to represent landscape relief."
			},
			os6inch: {
				tiles: 'https://{s}.tile.cyclestreets.net/os6inch/{z}/{x}/{y}@2x.png',
				maxZoom: 15,
				attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>',
				tileSize: 256,
				label: 'OS 6-inch',
				description: 'Comprehensive topographic mapping covering all of England and Wales from the 1840s.'
			}
			/* ,
			os1to25k1stseries: {
				tiles: 'https://{s}.tile.cyclestreets.net/os1to25k1stseries/{z}/{x}/{y}@2x.png',
				maxZoom: 16,
				attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>',
				tileSize: 256,
				label: 'NLS - OS 1:25,000 Provisional / First Series 1937-1961',
			},
			os1inch7thseries: {
				tiles: 'https://{s}.tile.cyclestreets.net/os1inch7thseries/{z}/{x}/{y}@2x.png',
				maxZoom: 16,
				attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>',
				tileSize: 256,
				label: 'NLS - OS 1-inch 7th Series 1955-1961'
			}
			*/
		},
		
		// Popup pages, defined as content div ID
		pages: [
			// 'about'
		],
		
		// Region switcher, with areas defined as a GeoJSON file
		regionsFile: false,
		regionsField: false,
		regionsNameField: false,
		regionsSubstitutionToken: false,
		regionsPopupFull: false, // Full contents for popup, as per a normal layer
		regionSwitcherPosition: 'top-right',
		regionSwitcherNullText: 'Move to area',
		regionSwitcherCallback: false, // Called when the region switch is detected
		regionSwitcherDefaultRegion: false, // Default region to load if no region saved in cookie
		regionSwitcherMaxZoom: false,
		regionSwitcherPermalinks: false,
		
		// Initial view of all regions; will use regionsFile
		initialRegionsView: false,
		initialRegionsViewRemovalClick: true,	// Whether the regions are removed upon click
		initialRegionsViewRemovalZoom: 10,	// or false to keep it; 10 is roughly size of a UK County
		
		// Whether to show layer errors in a (non-modal) corner dialog, rather than as a modal popup
		errorNonModalDialog: false,
		
		// Beta switch
		enableBetaSwitch: false,
		
		// Password protection, as an SHA-256 hash; can also be an array of passwords
		password: false,
		
		// Hide default LayerViewer message area and legend
		hideExtraMapControls: false,
		
		// Form rescan path
		formRescanPath: 'form#data #{layerId}',
		
		// Selector for the form selector
		selector: '#selector',
		
		// Custom data loading spinner selector for layerviewer. For layer specific spinner, should contain layerId
		dataLoadingSpinnerSelector: '#selector li.{layerId} img.loading',
		
		// Style switcher, either false to create a default Leaflet-style basic switcher, or a selector path for a div that will contain a graphical switcher
		styleSwitcherGraphical: false,
		
		// Custom panning control element
		panningControlElement: '<p><a id="panning" href="#">Panning: disabled</a></p>',
		
		// Custom panning control element insertion point (will be prepended to this element)
		panningControlInsertionElement: '#styleswitcher ul',
		
		// Determine whether to enable layerviewer's text based panning status indication
		setPanningIndicator: true,
		
		// Whether to use MapboxGL JS's default navigation controls
		useDefaultNavigationControls: true,
		
		// Whether to use MapboxGL JS's default geolocation control
		hideDefaultGeolocationControl: false,
		
		// Load Tabs class toggle, used when loading a parameterised URL. This CSS class will be added to the enabled parent li elements (i.e., 'checked', or 'selected')
		loadTabsClassToggle: 'selected',
		
		// Use jQuery tabs to tabify main menu
		useJqueryTabsRendering: true,
		
		// Rounding decimal places in popups
		popupsRoundingDP: 0,

		// Clicking "Clear line" also stops the drawing
		stopDrawingWhenClearingLine: true,
		
		// Additional layers, e.g. drawn polygons, that should be reset to be on top after layer changes
		forceTopLayers: []
	};
	
	// Layer definitions, which should be overriden by being supplied as an argument by the calling application
	// #!# These do not actually represent defaults, unlike the main config - this should be enabled
	var _layerConfig = {
		
		/* Example, showing all available options:
		layerid: {
			
			// Path or full URL to the API endpoint
			apiCall: '/path/to/api',
			
			// API key specific to this layer's API call
			apiKey: false,
			
			// Or fixed data, for GeoJSON layers
			data: false,
			
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
			convertData: function (data) {return somefunction (data);},
			
			// Whether to fit the data within the map initially upon loading, adjusting the zoom accordingly
			fitInitial: false,
			fitInitialPadding: false,	// Defaults to 20
			
			// Whether to zoom initially upon loading
			zoomInitialMin: false,
			
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
			
			// Field in GeoJSON data where the icon value can be looked up
			iconField: 'type',
			
			// Icon lookups, based on the iconField
			icons: {
				foo: '/images/foo.svg',
				bar: '/images/bar.svg',
				qux: '/images/qux.svg'
			},
			
			// Icon size, either fixed or dynamic lookup from a field in the feature properties
			iconSize: [38, 42],
			iconSizeField: false,
			iconSizes: {},
			
			// Order of marker appearance, in order from least to most important
			markerImportance: ['foo', 'bar', 'qux'],
			
			// Explicit styling
			style: {
				weight: 5
			},
			
			// If drawing lines, the field that contains the value used to determine the colour, and the colour stops for this, as an array of pairs of upper limit value and colour, or fixed colour
			lineColour: false,		// Fixed value
			lineColourField: 'value',
			lineColourStops: [
				[200, '#ff0000'],
				[50, '#e27474'],
				[0, '#61fa61']
			],
			lineColourValues: {
				'foo': '#ff0000',
				'bar': '#b2beb5'
			},
			
			// Point/Line colour from API response, e.g. 'colour' value in API
			pointColourApiField: false,
			lineColourApiField: false,
			
			// Point size
			pointSize: 8,
			
			// Line width
			lineWidth: false,		// Fixed value
			lineWidthField: 'width',
			lineWidthStops: [
				[250, 10],
				[100, 5],
				[0, 1],
			],
			lineWidthValues: {
				'foo': 5,
				'bar': 2
			},
			
			// Enable hover for this layer (for line-based layers)
			hover: true,
			
			// Legend, either array of values (as same format as polygonColourStops/lineColourStops), or boolean true to use polygonColourStops/lineColourStops if either exists (in that order of precedence)
			legend: true,
			
			// Polygon style; currently supported values are 'grid' (blue boxes with dashed lines, intended for tessellating data), 'green', 'red', 'blue'
			polygonStyle: 'grid',
			polygonColourField: false,
			polygonColourStops: [
				[200, '#ff0000'],
				[50, '#e27474'],
				[0, '#61fa61']
			],
			polygonColourValues: {
				'foo': '#ff0',
				'bar': '#b2beb5'
			},
			fillOpacity: 0.6,
			fillOutlineColor: 'rgba(0, 0, 0, 0.2)',
			
			// A secondary API call, used to get a specific ID
			apiCallId: {
				apiCall: '/path/to/secondaryApi',
				idParameter: 'id',
				apiFixedParameters: {
					key: 'value',
					foo: 'bar'			
				},
				popupAnimation: 'true',
			},
			
			// Code for popups; placeholders can be used to reference data in the GeoJSON; if using sublayerParameter, this is specified as a hashmap
			popups: true,		// NB Not yet implemented for point-based layers
			popupHtml:
				+ '<p>Reference: <strong>{properties.id}</strong></p>'
				+ '<p>Date and time: {properties.datetime}</p>',
			
			// Formatter for popup fields when using auto-table creation
			popupImagesField: false,
			popupFormatters: {
				myField: function (value, feature) {return string;},
				...
			},
			
			// Layer-specific feedback buttons
			popupFeedbackButton: false,		// or string containing button text
			locateFeedbackButton: false,	// or string containing button text
			
			// Rounding decimal places in popups
			popupsRoundingDP: 0,
			
			// Whether to enable Street View in popups (for auto-popups)
			streetview: true,
			
			// Make lookups (Popups / line colour stops) dependent on the value of a specified request parameter
			// Currently supported for: lineColourField, lineColourStops, lineWidthField, lineWidthStops, polygonColourField, polygonColourValues, popupHtml, legend
			// #!# This is currently a poor architecture; each supported config type has to be enabled deep in the execution tree, whereas this should be done as a single generic hit near the start of getData ()
			sublayerParameter: false,
			
			// Replace auto-generated keys in popup with pretty titles or descriptions
			fieldLabelsCsv: false,
			fieldLabelsCsvField: 'field',
			fieldLabelsCsvTitle: 'title',
			fieldLabelsCsvDescription: 'description',
			
			// Labels and descriptions for auto-popups
			popupLabels: {},
			popupDescriptions: {},
			
			// Field that contains a follow-on API URL where more details of the feature can be requested
			detailsOverlay: 'apiUrl',
			
			// Overlay code, as per popupHtml, but for the follow-on overlay data
			overlayHtml: '<p>{properties.caption}</p>',
			
			// Optimisation flag to state that the data is static, i.e. no change based on map location
			static: false,
			
			// Retrieval strategy - 'bbox' (default) sends w,s,e,n; 'polygon' sends as sw.lat,sw.lng:se.lat,se.lng:ne.lat,ne.lng:nw.lat,nw.lng:sw.lat,sw.lng, 'none' sends neither (i.e. static)
			retrievalStrategy: 'bbox',
			
			// Boundary parameter name (most likely to be useful in polygon retrievalStrategy mode), defaulting to 'boundary'
			apiBoundaryField: 'boundary',
			
			// If reformatting the boundary in the response is needed, unpacking strategy; only 'latlon-comma-colons' is supported
			apiBoundaryFormat: 'latlon-comma-colons',
			
			// Flat JSON mode, for when GeoJSON is not available, specifying the location of the location fields within a flat structure
			flatJson: ['location.latitude', 'location.longitude'],
			
			// Heatmap mode
			heatmap: false,
			
			// Tile layer mode, which adds a bitmap tile overlay
			tileLayer: [],	// Format as per _settings.tileUrls
			
			// Marker-setting mode, which requires a hidden input field; a default value of that field will set an initial location; uses iconUrl
			setMarker: false
		},
		
		*/
	};
	
	// Define the supported OpenGIS types; this registry is currently only used for popups
	var _opengisTypes = [
		'Point',
		'LineString',
		'Polygon'
	];
	
	// Define the geometry types and their default styles
	var _defaultStyles = {
		'Point': {
			// NB Icons, if present, are also drawn over the points
			type: 'circle',
			layout: {},		// Not applicable
			paint: {
				'circle-radius': 8,
				'circle-color': '#007cbf'
			}
		},
		'LineString': {
			type: 'line',
			layout: {
				'line-cap': 'round',
				'line-join': 'round'
			},
			paint: {
				'line-color': ['case', ['has', 'color'], ['get', 'color'], /* fallback: */ '#888'],
				'line-width': 3
			}
		},
		'Polygon': {
			type: 'fill',
			layout: {},		// Not applicable
			paint: {
				'fill-color': '#888',
				'fill-opacity': 0.4,
				'fill-outline-color': 'rgba(0,0,0,0.5)'	// See: https://github.com/mapbox/mapbox-gl-js/issues/3018#issuecomment-365767174
			}
		}
	};
	
	// Internal class properties
	var _map = null;
	var _layers = {};	// Layer status registry
	var _backgroundMapStyles = {};
	var _backgroundMapStylesManualAttributions = {};
	var _manualAttribution = null;
	var _currentBackgroundMapStyleId;
	var _backgroundStylesInternalPrefix = 'background-';
	var _markers = [];
	var _popups = [];
	var _tileOverlayLayer = false;
	var _isTouchDevice;
	var _panningEnabled = false;
	var _virginFormState = {};
	var _parameters = {};
	var _dataRefreshHandlers = {};
	var _xhrRequests = {};
	var _requestCache = {};
	var _sublayerValues = {};
	var _fitInitial = {};
	var _title = false;
	var _embedMode = false;
	var _betaMode = false;
	var _message = {};
	var _regionBounds = {};
	var _regionSwitcherDefaultRegionFromUrl = false;
	var _selectedRegion = false;
	var _locateHandlerFunction;
	var _locateHandlerMarker;
	var _miniMaps = {};			// Handle to each mini map
	var _miniMapLayers = {};	// Handle to each mini map's layer
	var _geolocate = null; // Store the geolocation element
	var _geolocationAvailable = false; // Store geolocation availability, to automatically disable location tracking if user has not selected the right permissions
	var _customPanningIndicatorAction = false; // Custom function that can be run on click action panning on and off, i.e. to control the visual state of a custom panning button
	var _customGeolocationButtonAction = false; // Custom function that can be run on click event on geolocation control, i.e. to control the visual state of a custom geolocation control
	var _drawing = {} // Object to control drawing, accessible externally to LayerViewer via registering a listener; structure defined in drawing () function
	var _draw = null; // Store the Mapbox draw object
	var _popupClickHandlers = {};
	
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
			
			// Determine if the device is a touch device
			_isTouchDevice = layerviewer.isTouchDevice ();
			
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

			// Set the initial location and tile layer
			var defaultLocation = (urlParameters.defaultLocation || _settings.defaultLocation);
			var defaultTileLayer = (urlParameters.defaultTileLayer || _settings.defaultTileLayer);
			
			// Load background map style defitions
			layerviewer.getBackgroundMapStyles ();
			
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
			var state = Cookies.getJSON ('state');
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
			
			// Determine the enabled layers
			layerviewer.determineLayerStatus ();
			
			// Determine the initial form state as specified in the fixed HTML, irrespective of URL-supplied values, for all layers
			$.each (_layers, function (layerId, layerEnabled) {
				_virginFormState[layerId] = layerviewer.parseFormValues (layerId);
			});
			
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
			
			// Show intial regions view if required
			layerviewer.initialRegionsView (urlParameters);
			
			// Enable feedback handler
			layerviewer.feedbackHandler ();
			
			// Populate each layer with popupLabels if fieldLabelsCsv is provided
			$.each (_layers, function (layerId, layerEnable) {
				layerviewer.populateFieldLabels (layerId);
			});
			
			// Load the data, and add map interactions and form interactions
			_map.on ('load', function () {		// Because layers may do addLayer(), the whole layer management must be wrapped in map load; see: https://docs.mapbox.com/help/how-mapbox-works/web-apps/#adding-layers-to-the-map
				$.each (_layers, function (layerId, layerEnabled) {
					if (layerEnabled) {
						layerviewer.enableLayer (layerId);
					}
				});
			});
			
			// If an ID is supplied in the URL, load it
			layerviewer.loadIdFromUrl (urlParameters);
			
			// Toggle map data layers on/off when checkboxes changed
			$(_settings.selector + ' input[type="checkbox"]').change (function(event) {
				layerviewer.toggleDataLayer (event.target);
			});
			
			// Enable embed dialog handler
			layerviewer.embedHandler ();
		},


		// Function to set a layer configuration after loading
		setLayerConfigParameter: function (layer, field, value)
		{
			_layerConfig[layer][field] = value;
		},


		// Function to toggle map data layers on/off when checkboxes changed
		toggleDataLayer: function (target)
		{
			// Add class to facilitate display of an icon
			var layerId = target.id.replace('show_', '');
			if (target.checked) {
				_layers[layerId] = true;
				layerviewer.enableLayer (layerId);
			} else {
				_layers[layerId] = false;
				if (_xhrRequests[layerId]) {
					_xhrRequests[layerId].abort();
				}
				layerviewer.removeLayer (layerId);
				layerviewer.clearLegend ();
			}
		},
		
		
		// Getter for map
		getMap: function ()
		{
			return _map;
		},


		// Getter for _drawingHappening object
		getDrawingStatusObject: function ()
		{
			return _drawing;
		},


		// Getter for _draw object
		getDrawObject: function ()
		{
			return _draw;
		},


		// Function to determine if the device is a touch device
		isTouchDevice: function ()
		{
			// See https://stackoverflow.com/a/13470899/180733
			return 'ontouchstart' in window || navigator.msMaxTouchPoints;		// https://stackoverflow.com/a/13470899/180733
		},


		// Password protection; this is intended to provide a simple, basic level of protection only
		passwordProtection: function ()
		{
			// Obtain the cookie if present
			var hostSuffix = window.location.hostname.toLowerCase().replace(/[^a-z]+/g, '');
			var cookieName = 'login' + hostSuffix;
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
					vex.dialog.alert ({
						message: message,
						showCloseButton: true,
						className: 'vex vex-theme-plain',
						afterClose: function () {
							$('form#password')[0].reset();	// See: https://stackoverflow.com/a/21514788/180733
							$('form#password input[type="password"]').focus();
						}
					});
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
			
			// If a string, convert to array
			if (typeof _settings.password == 'string') {
				_settings.password = [_settings.password];
			}
			
			// Compare against the correct password hash
			var matched = false;
			$.each (_settings.password, function (index, password) {
				if (hash === password) {
					matched = true;
					return false;	// break
				}
			});
			
			// Failure
			return matched;
		},
		
		
		// Function to parse the URL
		parseUrl: function ()
		{
			// Start a list of parameters
			var urlParameters = {};
			
			// Split the path by slash; see: https://stackoverflow.com/a/8086637
			var url = window.location.pathname;
			url = url.substr (_settings.baseUrl.length);	// Remove baseUrl from start
			var pathComponents = url.split ('/');
			if (pathComponents) {
				
				if (_settings.regionSwitcherPermalinks) {
					_regionSwitcherDefaultRegionFromUrl = pathComponents[0];
					pathComponents.splice (0, 1);	// Shift from start, so that the indexes below work as normal
				}
				
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
				
				// Register non-form components (i.e., Photomap popup)
				if (pathComponents[1]) {
					urlParameters.id = pathComponents[1];
				}	
				
				// Obtain embed mode if present
				// #¡# Needs to recognise whether embed is the last (but not the first) parameter
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
				var hashParts = window.location.hash.match (/^#([0-9]{1,2}.?[0-9]*)\/([-.0-9]+)\/([-.0-9]+)\/([a-z0-9]+)$/);	// E.g. #17.21/51.51137/-0.10498/opencyclemap
				if (hashParts) {
					urlParameters.defaultLocation = {
						latitude: hashParts[2],
						longitude: hashParts[3],
						zoom: hashParts[1]
					};
					urlParameters.defaultTileLayer = hashParts[4];
					
					// Remove the tile layer element, before loading the map, so that the MapboxGL hash value is as expected
					window.location.hash = window.location.hash.replace ('/' + urlParameters.defaultTileLayer, '');
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
		
		
		// Function to add an initial regions view
		initialRegionsView: function (urlParameters)
		{
			if (_settings.initialRegionsView && _settings.regionsFile) {
				if (!urlParameters.defaultLocation) {
					
					// Add the data, rendering the polygons
					_map.on ('load', function () {		// See: https://docs.mapbox.com/help/how-mapbox-works/web-apps/#adding-layers-to-the-map
						_map.addLayer ({
							id: 'regionsOverlay',
							source: {
								type: 'geojson',
								data: _settings.regionsFile,
								generateId: true	// NB See: https://github.com/mapbox/mapbox-gl-js/issues/8133
							},
							type: 'fill',
							layout: {},
							paint: {
								'fill-color': '#3388ff',
								'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.5],	// See: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
								'fill-outline-color': 'blue'
								// NB Outline line width cannot be changed: https://github.com/mapbox/mapbox-gl-js/issues/3018#issuecomment-240381965
							}
						});
					});
					
					// Set hover state; see: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
					layerviewer.hoverStateHandlers ('regionsOverlay', 'regionsOverlay');
					
					// Support popup content, if enabled
					if (_settings.regionsField) {
						
						// Create a popup, but don't add it to the map yet
						var popup = new mapboxgl.Popup ({
							closeButton: (_settings.regionsPopupFull),	// Enable close button if using full layer-style popups
							closeOnClick: false
						});
						
						// Handle popup; see: https://docs.mapbox.com/mapbox-gl-js/example/popup-on-hover/
						var eventType = (_settings.regionsPopupFull ? 'click' : 'mouseenter');
						_map.on (eventType, 'regionsOverlay', function (e) {
							_map.getCanvas().style.cursor = 'pointer';
							
							// Set the co-ordinates
							var feature = e.features[0];
							var coordinates = layerviewer.polygonCentroid (feature);
							
							// Add the region name as the popup content
							var regionName = (_settings.regionsNameField ? feature.properties[_settings.regionsNameField] : layerviewer.ucfirst (feature.properties[_settings.regionsField]));
							var popupHtml = layerviewer.htmlspecialchars (regionName);
							
							// Generate custom HTML popup, if enabled
							if (_settings.regionsPopupFull) {
								var regionsNullObjectName = '__regions';
								_layerConfig[regionsNullObjectName] = {};	// Temporarily emulate a layer using the Null Object design pattern, to ensure the popup renderer has a standard datastructure
								popupHtml = layerviewer.renderDetailsHtml (feature, false, regionsNullObjectName);
								delete _layerConfig[regionsNullObjectName];	// Remove the emulated layer
							}
							
							// Populate the popup and set its coordinates based on the feature found
							popup.setLngLat (coordinates)
								.setHTML (popupHtml)
								.addTo (_map);
						});
						if (!_settings.regionsPopupFull) {
							_map.on ('mouseleave', 'regionsOverlay', function (e) {
								_map.getCanvas().style.cursor = '';
								popup.remove ();
							});
						}
					}
					
					// Zoom to area and remove layer when clicked, unless disabled
					if (_settings.initialRegionsViewRemovalClick) {
						_map.on ('click', 'regionsOverlay', function (e) {
							var feature = e.features[0];
							_map.fitBounds (geojsonExtent (feature));
							_map.removeLayer ('regionsOverlay');
							if (_settings.regionsField) {
								popup.remove ();
							}
						});
					}
					
					// If polygons remain after initial regions view, treat a click on a different region as an implied drop-down change
					if (!_settings.initialRegionsViewRemovalClick) {
						_map.on ('click', 'regionsOverlay', function (e) {
							var feature = e.features[0];
							var switchToRegion = feature.properties[_settings.regionsField];
							if (switchToRegion != _selectedRegion) {	// Don't reload current if already loaded
								$('#regionswitcher select').val (switchToRegion);
								$('#regionswitcher select').trigger ('change');
							}
						});
					}
					
					// Create a handler to remove the overlay automatically when zoomed in (but not explicitly clicked through)
					if (_settings.initialRegionsViewRemovalZoom) {
						_map.on ('zoomend', function (e) {
							if (_map.getLayer ('regionsOverlay')) {
								var currentZoom = _map.getZoom ();
								if (currentZoom >= _settings.initialRegionsViewRemovalZoom) {
									_map.removeLayer ('regionsOverlay');
								}
							}
						});
					}
				}
			}
		},
		
		
		// Helper function to create handlers to set hover state; see: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
		hoverStateHandlers: function (layerId, sourceId)
		{
			// Create the hover state ID
			var hoveredStateId = null;
			
			// When the user moves their mouse over the state-fill layer, update the feature state for the feature under the mouse
			_map.on ('mousemove', layerId, function (e) {
				if (e.features.length > 0) {
					if (hoveredStateId !== null) {
						_map.setFeatureState ({source: sourceId, id: hoveredStateId}, {hover: false});
					}
					hoveredStateId = e.features[0].id;
					_map.setFeatureState ({source: sourceId, id: hoveredStateId}, {hover: true});
				}
			});
			 
			// When the mouse leaves the state-fill layer, update the feature state of the previously hovered feature
			_map.on ('mouseleave', layerId, function () {
				if (hoveredStateId !== null) {
					_map.setFeatureState ({source: sourceId, id: hoveredStateId}, {hover: false});
				}
				hoveredStateId = null;
			});
		},
		
		
		// Helper function to get the centre point of a ol
		// #!# Refactor out to use getCentre
		polygonCentroid: function (feature)
		{
			// Convert the feature to bbox bounds, and then get the centre of that bbox
			var bounds = geojsonExtent (feature);
			var coordinates = {
				lng: ((bounds[0] + bounds[2]) / 2),	// Average (centre) of W/E
				lat: ((bounds[1] + bounds[3]) / 2)	// Average (centre) of S/N
			};
			return coordinates;
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
				$(_settings.selector + ' li.' + layerId).addClass(_settings.loadTabsClassToggle);
				
				// Enable checkbox
				$(_settings.selector + ' input#show_' + layerId).click ();
			});
			
			// Add tabbing behaviour, if required
			if (_settings.useJqueryTabsRendering) {
				
				// Enable tabbing of main menu
				$('nav').tabs ();
				
				// If a default tab is defined (or several, in which case use the first), switch to its contents (controls); see: https://stackoverflow.com/a/7916955/180733
				if (defaultLayers[0]) {
					var index = $('nav li.' + defaultLayers[0]).index ();
					$('nav').tabs ('option', 'active', index);
				}
			}
			
			// Handle selection/deselection of section checkboxes
			$(_settings.selector + ' input').change (function () {
				
				// Add background highlight to this tab
				$(this).parent ('li').toggleClass (_settings.loadTabsClassToggle, this.checked);
				
				// Update the URL using HTML5 History pushState
				layerviewer.determineLayerStatus ();
				layerviewer.updateUrl ();
				
				if (_settings.useJqueryTabsRendering) {
					// If enabling, switch to its tab contents (controls)
					if (this.checked) {
						var index = $(this).parent ().index ();
						$('nav').tabs ('option', 'active', index);
					}
				}
			});
			
			// Allow double-clicking of each menu item (surrounding each checkbox) as implicit selection of its checkbox
			$(_settings.selector + ' li a').dblclick(function () {
				$(this).parent ().find ('input').click ();
			});
			
			// Allow any form change within a layer as implicit selection of its checkbox
			$('form#data .filters :input').click (function () {		// This uses click rather than change, so that clicking but not actually changing a dropdown is an implicit enable
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
			if ($(_settings.selector + ' input#show_' + layerId).prop ('checked') != true) {
				$(_settings.selector + ' input#show_' + layerId).click ();
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
					$('#nav-mobile').fadeTo(250, 1);
				} else {
					$('nav').animate ({width: 'toggle'}, 250);
					$('#nav-mobile').fadeTo(250, 0.5);
				}
			});
			
			// Enable implicit click/touch on map as close menu
			if ($('#nav-mobile').is(':visible')) {
				if (!$('nav').is(':visible')) {
					$('.map').click(function () {
						$('nav').hide ('slide', {direction: 'right'}, 250);
						$('#nav-mobile').fadeTo(250, 1);
					});
				}
			}
			
			// Enable closing menu on slide right
			if ($('#nav-mobile').is(':visible')) {
				$('nav').on('swiperight', function () {
					$('nav').hide ('slide', {direction: 'right'}, 250);
					$('#nav-mobile').fadeTo(250, 1);
				});
			}
		},
		
		
		// Function to update the URL, to provide persistency when a link is circulated
		// Format is /<baseUrl>/<layerId1>:<param1key>=<param1value>&[...],<layerId2>[...]/#<mapHashWithStyle>
		// If the regionSwitcherPermalinks setting is on, this appears after the baseUrl as an extra component
		updateUrl: function ()
		{
			// End if not supported, e.g. IE9
			if (!history.pushState) {return;}
			
			// Obtain the URL slug
			var urlSlug = layerviewer.formParametersToUrlSlug ();
			
			// Obtain the region component, if enabled, prefixing it to the URL slug
			if (_settings.regionSwitcherPermalinks) {
				urlSlug = _selectedRegion + '/' + urlSlug;
			}
			
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
			// Define system-wide parameters that are not layer-specific
			var genericParameters = ['bbox', 'boundary'];
			
			// Filter for enabled layers
			var enabledLayers = [];
			var urlComponent;
			var urlParameters;
			var submittedValue;
			$.each (_layers, function (layerId, isEnabled) {
				if (isEnabled) {
					
					// Start an array of URL parameters for this layer; this will remain empty if the form matches its virgin state
					urlParameters = {};
					
					// Determine the difference in the form parameters against the virgin state, to keep the URL as short as possible
					// This has to compute the difference of the virgin form state and the supplied parameters
					// This must be done in BOTH directions, as otherwise a select with a non-empty default parameter like '20' would not register a change to the empty '' first value
					// E.g. for:
					//	 Virgin form state:  {field:casualties: 'Cyclist', field:speed_limit: '20', foo: 'bar'}
					//	 URL parameters array:  {field:casualties: 'Cyclist', since: '2020-01-01', field:road_type: '2', foo: 'qux'}
					// the result should be:
					//   foo=qux,field:speed_limit=,since=2020-01-01,field:road_type=2
					
					// Firstly, where the virgin form field is present in the submitted parameters, but the submitted value is not the default, include the submitted value
					// In the example above, this applies to field 'foo'
					$.each (_virginFormState[layerId], function (field, virginValue) {
						if (_parameters.hasOwnProperty (layerId) && _parameters[layerId].hasOwnProperty (field)) {
							submittedValue = _parameters[layerId][field];
							if (submittedValue !== virginValue) {
								urlParameters[field] = submittedValue;
							}
						}
					});
					
					// Next, where the virgin form field is not present in the submitted parameters at all, it has been changed from a non-empty default to an empty string, so include the empty value
					// In the example above, this applies to field 'field:speed_limit'
					$.each (_virginFormState[layerId], function (field, virginValue) {
						if (_parameters.hasOwnProperty (layerId) && !_parameters[layerId].hasOwnProperty (field)) {
							urlParameters[field] = '';		// Present but empty
						}
					});
					
					// Lastly, looking conversely - where a submitted parameters field is not present in the virgin form fields, include the submitted value
					// In the example above, this applies to fields 'since' and 'field:road_type'
					$.each (_parameters[layerId], function (field, submittedValue) {
						if (!_virginFormState[layerId].hasOwnProperty (field)) {
							urlParameters[field] = submittedValue;
						}
					});
					
					// Strip out generic parameters which the API will automatically receive
					$.each (genericParameters, function (index, field) {
						if (urlParameters.hasOwnProperty (field)) {
							delete urlParameters[field];
						}
					});
					
					// Assemble the URL component representing this layer, combining the layer name with any parameters if present, e.g. 'collisions' or 'collisions:foo=bar,...'
					urlComponent = layerId;
					if (!$.isEmptyObject (urlParameters)) {
						urlComponent += ':' + $.param (urlParameters);
					}
					
					// Register the component
					enabledLayers.push (urlComponent);
				}
			});
			
			// Construct the URL slug, joining by comma
			var urlSlug = enabledLayers.join (',') + (enabledLayers.length ? '/' : '');
			
			//console.log ('Virgin form state: ', _virginFormState);
			//console.log ('URL parameters array: ', _parameters);
			//console.log ('Resulting URL slug: ', urlSlug);
			
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
			return $(_settings.selector + ' li.' + layerId + ' a').text();
		},
		
		
		// Function to populate dynamic form controls
		populateDynamicFormControls: function ()
		{
			// Support for "data-monthly-since" (e.g. = '2013-07') macro which populates a select with an option list of each month, grouped by optgroup years
			// #!# Also need support for data-monthly-until
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
					unixtime = parseInt((new Date(year, 1, 1).getTime() / 1000).toFixed(0));	// https://stackoverflow.com/a/28683720/180733
					html += '<option value="' + unixtime + '">' + year + '</option>';
				}
				$(this).append(html);
			});
			
			// Support for "data-yearly-range-{since|until}-sqldate" macros which populate a select with an option list of each year in a comma-separated range, expressed as SQL time
			var sqltimeMacros = {
				'yearly-range-since-sqldate': '-01-01',
				'yearly-range-until-sqldate': '-12-31'
			};
			$.each (sqltimeMacros, function (macroName, monthDateString) {
				$('select[data-' + macroName + ']').val(function() {
					var yearRange = $(this).data(macroName).split (',');
					var startYear = yearRange[0];
					var finishYear = yearRange[1];
					var html = '';
					var year;
					var sqldate;
					for (year = finishYear; year >= startYear; year--) {	// See: https://stackoverflow.com/a/26511699
						sqldate = year + monthDateString;
						html += '<option value="' + sqldate + '">' + year + '</option>';
					}
					$(this).append(html);
				});
			});
		},
		
		
		// Slider value display handler, to show the current slider value
		sliderValueDisplayHandler: function ()
		{
			// For each slider, show the input's value (at start, and on change), in the associated paragraph tag
			//var sliderDivs = $('form#data .slider');
			var sliderDivs = $('form .slider');
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
			var elementPathsTry;
			var elementWidgets;
			var valueList;
			$.each (formParameters, function (layerId, values) {
				if (_layerConfig[layerId]) {	// Validate against layer registry
					$.each (values, function (inputName, value) {
						
						// Element paths may have [] appended, e.g. for checkboxes
						elementPathsTry = [
							'#sections #' + layerId + ' :input[name="' + inputName + '"]',
							'#sections #' + layerId + ' :input[name="' + inputName + '[]' + '"]'
						];
						
						// Try each path variant
						$.each (elementPathsTry, function (index, elementPath) {
							elementWidgets = $(elementPath).length;
							if (elementWidgets) {
								
								// Handle standard singular elements
								if (elementWidgets == 1) {
									$(elementPath).val(value);
								}
								
								// Handle checkboxes, which have more than one widget each with matching name
								if (elementWidgets > 1) {
									valueList = value.split (',');
									$.each ($(elementPath), function (index, subElement) {
										if (valueList.indexOf (subElement.value) !== -1) {		// i.e. if present
											$(subElement).attr ('checked', true);
										}
									});
								}
							}
						});
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
			
			// Apply to map <abbr> titles also; this is applied on #map as the rest is late-bound
			$('#map').tooltip ({
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
			if (_settings.hideExtraMapControls) {return;}

			// Affix the legend
			layerviewer.createControl ('legend', 'bottom-left');
			
			// Hide initially
			layerviewer.clearLegend ();
		},
		
		
		// Function to set the legend contents
		// NB polygonColourStops take precedence over lineColourStops
		// #!# Currently no support for lineWidthStops
		setLegend: function (layerId)
		{
			// Determine the intervals and polygon/line colour stops for the current layer
			var intervals = _layerConfig[layerId].legend;
			var polygonColourStops = _layerConfig[layerId].polygonColourStops;
			var lineColourStops = _layerConfig[layerId].lineColourStops;
			
			// In sublayer mode, do not display unless a sublayer is specified
			if (_layerConfig[layerId].sublayerParameter) {
				
				// Determine sublayer intervals support
				var sublayerIntervals = (_layerConfig[layerId].sublayerParameter ? layerviewer.sublayerableConfig ('legend', layerId) : false);
				
				// If sublayer support is enabled, end if no sublayer specified, clearing the legend if present
				if (!sublayerIntervals) {
					layerviewer.clearLegend ();
					return;
				}
				
				// Allocate sublayer intervals and line colour stops
				// #!# No support yet for polygonColourStops in sublayer mode
				intervals = sublayerIntervals;
				lineColourStops = layerviewer.sublayerableConfig ('lineColourStops', layerId);
			}
			
			// End if intervals not required for this layer
			if (!intervals) {return;}
			
			// If intervals is bool true, and lineColourStops is defined, use these as the intervals
			if (intervals === true) {
				if (polygonColourStops) {
					intervals = polygonColourStops;
				} else if (lineColourStops) {
					intervals = lineColourStops;
				}
			}
			
			// If intervals is 'range', and polygonColourStops/lineColourStops is defined, generate range labels from these
			if ((intervals == 'range') && (polygonColourStops || lineColourStops)) {
				intervals = [];
				var label;
				var colour;
				var value;
				var stops = polygonColourStops || lineColourStops;
				$.each (stops, function (index, interval) {
					colour = interval[1];
					value = interval[0];
					if (index == 0) {
						label = value + '+';
					} else {
						label = value + '-' + stops[index - 1][0];
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
			$('#legend').show ();
			$('#legend').html (html);
		},
		
		
		// Function to clear the legend
		clearLegend: function ()
		{
			$('#legend').hide ();
			$('#legend').html ('');
		},
		
		
		// Function to create a beta switch
		createBetaSwitch: function ()
		{
			// End if not required
			if (!_settings.enableBetaSwitch) {return;}
			
			// Create the control
			layerviewer.createControl ('betaswitch', 'bottom-right', 'info');
			
			// Determine the label
			var label = (_settings.enableBetaSwitch === true ? 'Beta' : _settings.enableBetaSwitch);
			
			// Define the HTML
			var html = '<form id="beta"><input type="checkbox" id="betabutton" name="betabutton" value="true" /><label for="betabutton"> ' + label + '</label></form>';
			
			// Add the content
			$('#betaswitch').html (html);
		},
		
		
		// Function to create a message area, and provide methods to manipulate it
		messageArea: function ()
		{	
			// Create the control
			layerviewer.createControl ('message', 'bottom-left');
			$('#message').hide ();
			
			// Register a method to set and show the message
			_message.show = function (html) {
				var html = '<p>' + html + '</p>';
				$('#message').html (html);
				$('#message').show ();
			};
			
			// Register a method to blank the message area
			_message.hide = function () {
				$('#message').html ('');
				$('#message').hide ();
			};
		},
		
		
		// Function to determine the layer status
		determineLayerStatus: function ()
		{
			// Initialise the registry
			$.each (_layerConfig, function (layerId, parameters) {
				_layers[layerId] = false;
			});
			
			// Create a list of the enabled layers
			$(_settings.selector + ' input:checked').map (function () {
				var layerId = this.id.replace('show_', '');
				_layers[layerId] = true;
			});
		},
		
		
		// Create the map
		createMap: function (defaultLocation, defaultTileLayer)
		{
			// Determine the tile layer to load, setting the default but which can be overridden if a cookie was previously set
			var tileLayerId = defaultTileLayer;
			if (Cookies.get ('mapstyle')) {
				var tileLayerId = Cookies.get ('mapstyle');
			}
			
			// Create the map in the 'map' div, set the view to a given place and zoom
			mapboxgl.accessToken = _settings.mapboxApiKey;
			_map = new mapboxgl.Map ({
				container: 'map',
				style: _backgroundMapStyles[_backgroundStylesInternalPrefix + tileLayerId],
				center: [defaultLocation.longitude, defaultLocation.latitude],
				zoom: defaultLocation.zoom,
				maxZoom: _settings.maxZoom,
				maxBounds: (_settings.maxBounds ? _settings.maxBounds : null),	// [W,S,E,N]
				// #!# Hash does not include layer; ideally would be added (without prefix) to: https://github.com/mapbox/mapbox-gl-js/blob/master/src/ui/hash.js perhaps using a monkey-patch: http://me.dt.in.th/page/JavaScript-override/
				hash: true
				// boxZoom is enabled, but mapbox-gl-draw causes it to fail: https://github.com/mapbox/mapbox-gl-draw/issues/571
			});
			
			// Set manual attribution if required
			layerviewer.handleManualAttribution (tileLayerId);
			
			// Set the map background style flag
			_currentBackgroundMapStyleId = tileLayerId;
			
			// Enable zoom in/out buttons
			if (_settings.useDefaultNavigationControls) {
				_map.addControl (new mapboxgl.NavigationControl (), _settings.zoomPosition);
			}
			
			// Add buildings
			layerviewer.addBuildings ();
			
			// Enable 3D terrain, if required
			if (_settings.enable3dTerrain) {
				layerviewer.add3dTerrain ();
			}
			
			// Add full screen control, if required
			if (_settings.enableFullScreen) {
				_map.addControl (new mapboxgl.FullscreenControl (), _settings.fullScreenPosition);
			}
			
			// Add style (backround layer) switching
			layerviewer.styleSwitcher ();
			
			// Enable tilt and direction
			layerviewer.enableTilt ();
			
			// Add a geolocation control
			layerviewer.geolocation (_settings.geolocationElementId, _settings.trackUser);
			
			// Add geocoder control
			layerviewer.geocoder ();
			
			// Add drawing support if enabled
			if (_settings.enableDrawing) {
				layerviewer.drawing ('#geometry', true, '', _settings.drawingGeometryType);
			}
			
			// Add map scale if required
			if (_settings.enableScale) {
				_map.addControl(new mapboxgl.ScaleControl ({position: 'bottom-left'}));
			}
		},
		
		
		// Function to handle attribution manually where required
		// Where a vector style is not a mapbox://... type, its URL will not be sufficient to set the attribution, so an attribution value must be set in the layer specification
		// This function when called always clears any existing attribution and then sets a customAttribution using map.addControl if needed
		handleManualAttribution: function (styleId)
		{
			// Clear anything if present, so that any change starts from no control
			if (_manualAttribution !== null) {
				_map.removeControl (_manualAttribution);
				_manualAttribution = null;
			}
			
			// Set attribution
			if (_backgroundMapStylesManualAttributions[styleId]) {
				_manualAttribution = new mapboxgl.AttributionControl ({
					customAttribution: _backgroundMapStylesManualAttributions[styleId]
				});
				_map.addControl (_manualAttribution);
			}
		},
		
		
		// Define background map styles
		getBackgroundMapStyles: function ()
		{
			// Register each tileset
			$.each (_settings.tileUrls, function (tileLayerId, tileLayerAttributes) {
				
				// Register vector tiles or traditional raster (bitmap) background map layers
				// These are prefixed with _backgroundStylesInternalPrefix to provide basic namespacing against foreground layers
				if (tileLayerAttributes.vectorTiles) {
					_backgroundMapStyles[_backgroundStylesInternalPrefix + tileLayerId] = layerviewer.defineVectorBackgroundMapLayer (tileLayerAttributes, tileLayerId);
				} else {
					_backgroundMapStyles[_backgroundStylesInternalPrefix + tileLayerId] = layerviewer.defineRasterTilesLayer (tileLayerAttributes, _backgroundStylesInternalPrefix + tileLayerId);
				}
			});
		},
		
		
		// Function to define a vector background map layer definition
		defineVectorBackgroundMapLayer: function (tileLayerAttributes, tileLayerId)
		{
			// Register manual attribution handling
			if (tileLayerAttributes.hasOwnProperty ('attribution')) {
				_backgroundMapStylesManualAttributions[tileLayerId] = tileLayerAttributes.attribution;
			}
			
			// Support native vector tiles URL format, e.g. mapbox://... ; see: https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters -> options.style
			return tileLayerAttributes.vectorTiles;
		},
		
		
		// Function to define a raster tiles map layer, for background map tiles or for foreground tile-based layers
		defineRasterTilesLayer: function (tileLayerAttributes, id)
		{
			// Determine if this is a TMS (i.e. {-y}) tilesource; see: https://docs.mapbox.com/mapbox-gl-js/style-spec/#sources-raster-scheme
			var scheme = 'xyz';
			if (tileLayerAttributes.tiles.indexOf('{-y}') != -1) {
				tileLayerAttributes.tiles = tileLayerAttributes.tiles.replace ('{-y}', '{y}');
				scheme = 'tms';
			}
		
			// Expand {s} server to a,b,c if present
			if (tileLayerAttributes.tiles.indexOf('{s}') != -1) {
				tileLayerAttributes.tiles = [
					tileLayerAttributes.tiles.replace ('{s}', 'a'),
					tileLayerAttributes.tiles.replace ('{s}', 'b'),
					tileLayerAttributes.tiles.replace ('{s}', 'c')
				];
			}
			
			// Convert string (without {s}) to array
			if (typeof tileLayerAttributes.tiles === 'string') {
				tileLayerAttributes.tiles = [
					tileLayerAttributes.tiles
				];
			}
			
			// Register the definition
			var sources = {};
			sources[id] = {
				type: 'raster',
				scheme: scheme,
				tiles: tileLayerAttributes.tiles,
				tileSize: (tileLayerAttributes.tileSize ? tileLayerAttributes.tileSize : 256),	// NB Mapbox GL default is 512
				attribution: tileLayerAttributes.attribution
			};
			var layerDefinition = {
				version: 8,
				sources: sources,	// Defined separately so that the id can be specified as a key
				layers: [{
					id: id,
					type: 'raster',
					source: id,
					paint : {'raster-opacity' : 0.7}	// https://stackoverflow.com/a/48016804/180733
				}]
			};
			
			// Return the layer definition
			return layerDefinition;
		},
		
		
		// Buildings layer; see: https://www.mapbox.com/mapbox-gl-js/example/3d-buildings/
		addBuildings: function ()
		{
			// The 'building' layer in the mapbox-streets vector source contains building-height data from OpenStreetMap.
			_map.on('style.load', function() {
				
				// Get the layers in the source style
				var layers = _map.getStyle().layers;
				
				// Ensure the layer has buildings, or end
				if (!layerviewer.styleHasLayer (layers, 'building')) {return;}
				
				// Insert the layer beneath any symbol layer.
				var labelLayerId;
				var i;
				for (i = 0; i < layers.length; i++) {
					if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
						labelLayerId = layers[i].id;
						break;
					}
				}
				
				// Add the layer
				_map.addLayer ({
					'id': '3d-buildings',
					'source': 'composite',
					'source-layer': 'building',
					'filter': ['==', 'extrude', 'true'],
					'type': 'fill-extrusion',
					'minzoom': 15,
					'paint': {
						'fill-extrusion-color': '#aaa',
						
						// Use an 'interpolate' expression to add a smooth transition effect to the buildings as the user zooms in
						'fill-extrusion-height': [
							"interpolate", ["linear"], ["zoom"],
							15, 0,
							15.05, ["get", "height"]
						],
						'fill-extrusion-base': [
							"interpolate", ["linear"], ["zoom"],
							15, 0,
							15.05, ["get", "min_height"]
						],
						'fill-extrusion-opacity': 0.6
					}
				}, labelLayerId);
			});
		},
		
		
		// Function to test whether a style has a layer
		styleHasLayer: function (layers, layerName)
		{
			// Ensure the layer has buildings, or end
			var i;
			for (i = 0; i < layers.length; i++) {
				if (layers[i].id == layerName) {
					return true;
				}
			}
			
			// Not found
			return false;
		},
		
		
		// 3D terrain; see: https://docs.mapbox.com/mapbox-gl-js/example/add-terrain/
		add3dTerrain: function ()
		{
			// Enable the layer
			_map.on ('load', function () {
				
				// Add the DEM
				_map.addSource ('mapbox-dem', {
					'type': 'raster-dem',
					'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
					'tileSize': 512,
					'maxzoom': 14
				});
				
				// Add the DEM source as a terrain layer with exaggerated height
				_map.setTerrain ({ 'source': 'mapbox-dem', 'exaggeration': 2.5 });
				 
				// Add a sky layer that will show when the map is highly pitched
				_map.addLayer ({
					'id': 'sky',
					'type': 'sky',
					'paint': {
						'sky-type': 'atmosphere',
						'sky-atmosphere-sun': [0.0, 0.0],
						'sky-atmosphere-sun-intensity': 15
					}
				});
			});
		},
		
		
		// Wrapper to enable tilt
		enableTilt: function ()
		{
			// Only enable on a touch device
			if (!_isTouchDevice) {return;}
			
			// Add panning control
			$(_settings.panningControlInsertionElement).prepend (_settings.panningControlElement);
			
			// Handle panning control UI
			layerviewer.controlPanning ();
			
			// Request permission where required on iOS13 and other supporting browsers; see:
			// https://github.com/w3c/deviceorientation/issues/57
			// https://dev.to/li/how-to-requestpermission-for-devicemotion-and-deviceorientation-events-in-ios-13-46g2
			$('body').on ('click', '#panning', function () {
				if (typeof DeviceOrientationEvent.requestPermission === 'function') {
					DeviceOrientationEvent.requestPermission()
						.then ( (permissionState) => {
							if (permissionState === 'granted') {
								layerviewer.implementTilt ();
							}
						})
						.catch (console.error);
				} else {
					layerviewer.implementTilt ();
				}
			});
		},
		
		
		// Externally accessible setter to define a custom action to be run when toggling panning on and off
		// This will replace the default action.
		setCustomPanningIndicatorAction: function (customAction)
		{
			_customPanningIndicatorAction = customAction;
		},


		// Control panning
		controlPanning: function ()
		{
			/*
			// Enable pan on rotate
			// https://github.com/mapbox/mapbox-gl-js/issues/3357
			_map.on ('rotateend', function () {
				_panningEnabled = true;
				layerviewer.setPanningIndicator ();
			});
			*/
			
			// Toggle panning on/off, and update the control
			$('#panning').on ('click', function () {
				
				_panningEnabled = !_panningEnabled;
				layerviewer.setPanningIndicator ();
				
				// Switch to top-down view when not enabled
				if (!_panningEnabled) {
					_map.setPitch (0);
				}
			});
		},
		
		
		// Set text for panning control
		setPanningIndicator: function ()
		{
			// Run custom panning indicator if available
			if (_customPanningIndicatorAction){
				_customPanningIndicatorAction (_panningEnabled);
			} else {
				var text = (_panningEnabled ? 'Panning: enabled' : 'Panning: disabled');
				$('#panning').text (text);
			}
		},
		
		
		// Function to tilt and orientate the map direction automatically based on the phone position
		// Note that the implementation of the W3C spec is inconsistent and is split between "world-orientated" and "game-orientated" implementations; accordingly a library is used
		// https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation
		// https://developers.google.com/web/fundamentals/native-hardware/device-orientation/
		// https://stackoverflow.com/a/26275869/180733
		// https://www.w3.org/2008/geolocation/wiki/images/e/e0/Device_Orientation_%27alpha%27_Calibration-_Implementation_Status_and_Challenges.pdf
		implementTilt: function ()
		{
			layerviewer.monitorDragging();
			
			// Obtain a new *world-oriented* Full Tilt JS DeviceOrientation Promise
			var promise = FULLTILT.getDeviceOrientation ({ 'type': 'world' });
			
			// Wait for Promise result
			promise.then (function (deviceOrientation) { // Device Orientation Events are supported
				
				// Register a callback to run every time a new deviceorientation event is fired by the browser.
				deviceOrientation.listen (function() {
					
					// Disable if required
					// #!# For efficiency, disabling panning should disable this whole function, using FULLTILT.DeviceOrientation.stop() / .start(), rather than just at the final point here
					if (_panningEnabled) {
						
						// Get the current *screen-adjusted* device orientation angles
						var currentOrientation = deviceOrientation.getScreenAdjustedEuler ();
						
						// Calculate the current compass heading that the user is 'looking at' (in degrees)
						var compassHeading = 360 - currentOrientation.alpha;
						
						// Set the bearing and pitch
						_map.setBearing (compassHeading);
						_map.setPitch (currentOrientation.beta);
					}
				});
				
			}).catch (function (errorMessage) { // Device Orientation Events are not supported
				console.log (errorMessage);
			});
		},


		// Deactivate FULLTILT when map is being dragged, as it blocks panning otherwise
		monitorDragging: function () {
			var isDragging = false;
			var panningWasEnabled = false;

			$('#map')
				.tapstart(function () {
					if (_panningEnabled) {
						panningWasEnabled = _panningEnabled;
						_panningEnabled = false;
						isDragging = false;
						layerviewer.setPanningIndicator();
					}
				})
				.tapmove(function () {
					if (panningWasEnabled) {
						isDragging = true;
						layerviewer.setPanningIndicator();
					}
				})
				.tapend(function () {
					if (panningWasEnabled) {
						panningWasEnabled = false;
						var wasDragging = isDragging;
						isDragging = false;
						if (wasDragging) {
							_panningEnabled = true;
							layerviewer.setPanningIndicator();
						}
					}
				});
		},


		// Set geolocation availability
		setGeolocationAvailability: function (boolean) {
			_geolocationAvailable = boolean;
		},


		// Get geolocation availability
		getGeolocationAvailability: function () {
			return _geolocationAvailable;
		},
		

		// Function to ascertain the geolocation status of the brwoser
		// If the class geolocationAvailability flag has been set to false, this function will not attempt to geolocate
		// @param onSuccess: function to be called if geolocation is found
		// @param onError: function to be called if geolocation is unavailable, or an error occurs doing search
		// @param force: boolean determining whether to force find a location (ignore geolocationAvailability flag)
		// @param surpressErrorMessages: boolean determining whether to show user error messages and prompts (i.e. to change privacy settings)
		checkForGeolocationStatus (onSuccess = false, onError = false, force = false, surpressErrorMessages = false)
		{
			// On startup, check the geolocation status of the browser
			function getLocation () 
			{
				var options = {
					enableHighAccuracy: false,
					timeout: 2000,
					maximumAge: Infinity
				};
				  
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition (showPosition, showError, options);
				} else {
					if (!surpressErrorMessages) {
						vex.dialog.alert ('Geolocation is not supported by this browser.');
					}
					layerviewer.setGeolocationAvailability (false);
				}
			}

			function showPosition (position) 
			{
				layerviewer.setGeolocationAvailability (true);
				
				// If there is a success callback
				if (onSuccess){
					onSuccess (position);
				}
			}

			function showError (error) 
			{				
				// If there is an error callback
				if (onError) {
					onError ();
				}
				
				// Display a user message and in certain cases set geolocation availability flag to false
				switch (error.code) {
					case error.PERMISSION_DENIED:
						layerviewer.setGeolocationAvailability (false);
						if (!surpressErrorMessages) {
							vex.dialog.alert ('Please allow the browser to access your location, by refreshing the page or changing privacy settings.');	
						}
						break;
					case error.POSITION_UNAVAILABLE:
						if (!surpressErrorMessages) {
							vex.dialog.alert ('Location information is unavailable.');
						}
						break;
					case error.TIMEOUT:
						if (!surpressErrorMessages) {
							vex.dialog.alert ('The request to get user location timed out.');
						}
						break;
					case error.UNKNOWN_ERROR:
						if (!surpressErrorMessages) {
							vex.dialog.alert ('An unknown error occurred.');
						}
						break;
				}
			}

			// Main entrance to this function
			if (layerviewer.getGeolocationAvailability () || force){
				getLocation ();
			} else {
				return false;
			}
		},

		
		// Function to add a geolocation control and associated events
		// https://www.mapbox.com/mapbox-gl-js/example/locate-user/
		// https://github.com/mapbox/mapbox-gl-js/issues/5464
		geolocation: function (geolocationElementId = false, trackUser = false)
		{
			// Exit if don't want a geolocation element
			if (!_settings.geolocationPosition) {
				return;
			}
			
			// Create a tracking control
			_geolocate = new mapboxgl.GeolocateControl ({
				positionOptions: {
					enableHighAccuracy: true
				},
				fitBoundsOptions: {
					duration: 1500
				},
				trackUserLocation: trackUser
			});
			
			// Add to the map
			_map.addControl (_geolocate, _settings.geolocationPosition);
			
			// Disable tilt on click
			/*
			_geolocate.on ('geolocate', function (event) {
				_panningEnabled = false;
				layerviewer.setPanningIndicator ();
			});
			*/

			// Click handler for new geolocation element
			if (geolocationElementId) {
				$('#' + geolocationElementId).on ('click', function (e){
					e.preventDefault ();
					e.stopPropagation ();
					
					layerviewer.triggerGeolocation ();

					if (_customGeolocationButtonAction){
						_customGeolocationButtonAction ();
					}
				});

				if (_settings.hideDefaultGeolocationControl) {
					// Hide default control
					$('.mapboxgl-ctrl-geolocate').hide ();
				}
			}

			// Listener for setting geolocation availability and setting map bounds
			_map.on ('locationfound', function(e) {
				layerviewer.setGeolocationAvailability (true);
				_map.fitBounds (e.bounds, {duration: 1500});
			});
		},
		
		
		// Setter for custom geolocation button action
		setCustomGeolocationButtonAction: function (customAction)
		{
			_customGeolocationButtonAction = customAction;
		},
		
		
		// Trigger geolocation, accessible externally
		triggerGeolocation: function () 
		{
			// Display error message if we haven't got permission
			if (!layerviewer.getGeolocationAvailability ()) {
				vex.dialog.alert ('Please allow the browser to access your location, by refreshing the page or changing privacy settings.');	
			}

			_geolocate.trigger ();
		},
		
		
		// Getter for the user's geolocation
		getGeolocation: function () 
		{
			return _geolocate;
		},
		
		
		// Function to add style (background layer) switching
		// https://www.mapbox.com/mapbox-gl-js/example/setstyle/
		// https://bl.ocks.org/ryanbaumann/7f9a353d0a1ae898ce4e30f336200483/96bea34be408290c161589dcebe26e8ccfa132d7
		styleSwitcher: function ()
		{
			// Add style switcher UI, unless creating a graphical container in a defined container
			if (!_settings.styleSwitcherGraphical) {
				var containerId = 'styleswitcher';
				layerviewer.createControl (containerId, 'bottom-left', 'expandable');
			}
			
			// Determine the container path
			var container = _settings.styleSwitcherGraphical || '#' + containerId;
			
			// Construct HTML for style switcher
			var styleSwitcherHtml = '<ul>';
			var name;
			var description;
			var image;
			var labelContent;
			$.each (_backgroundMapStyles, function (styleId, style) {
				var unprefixedStyleId = styleId.replace (_backgroundStylesInternalPrefix, '');
				name = (_settings.tileUrls[unprefixedStyleId].label ? _settings.tileUrls[unprefixedStyleId].label : layerviewer.ucfirst (unprefixedStyleId));
				description = (_settings.tileUrls[unprefixedStyleId].description ? _settings.tileUrls[unprefixedStyleId].description : '');
				if (_settings.styleSwitcherGraphical) {
					image = '/images/mapstyle/' + styleId + '.png';
					labelContent  = '<img src="' + image + '" alt="' + name + '" />';
					labelContent += '<h3>' + name + '</h3>';
					labelContent += '<p>' + description + '</p>';
				} else {
					labelContent = '<abbr title="' + description + '">' + name + '</abbr>';
				}
				styleSwitcherHtml += '<li><input id="' + styleId + '" type="radio" name="styleswitcher" value="' + styleId + '"' + (styleId == _settings.defaultTileLayer ? ' checked="checked"' : '') + '>';
				styleSwitcherHtml += '<label for="' + styleId + '">' + labelContent + '</label></li>';
			});
			styleSwitcherHtml += '</ul>';
			$(container).append (styleSwitcherHtml);
			
			// Switch to selected style
			function switchStyle (style)
			{
				var tileLayerId = style.target.id.replace (_backgroundStylesInternalPrefix, '');
				var style = _backgroundMapStyles[_backgroundStylesInternalPrefix + tileLayerId];
				_map.setStyle (style);
				
				// Set manual attribution if required
				layerviewer.handleManualAttribution (tileLayerId);
				
				// Save this style as a cookie
				Cookies.set ('mapstyle', tileLayerId);
				
				// Set the style flag to the new ID
				_currentBackgroundMapStyleId = tileLayerId;
				
				// Fire an event; see: https://javascript.info/dispatch-events
				layerviewer.styleChanged ();
			}
			var inputs = $(container + ' ul input');
			var i;
			for (i = 0; i < inputs.length; i++) {
				inputs[i].onclick = switchStyle;
			}

		},
		
		
		// Function to trigger style changed, checking whether it is actually loading; see: https://stackoverflow.com/a/47313389/180733
		// Cannot use _map.on(style.load) directly, as that does not fire when loading a raster after another raster: https://github.com/mapbox/mapbox-gl-js/issues/7579
		styleChanged: function ()
		{
			// Delay for 200 minutes in a loop until the style is loaded; see: https://stackoverflow.com/a/47313389/180733
			if (!_map.isStyleLoaded()) {
				setTimeout (function () {
					layerviewer.styleChanged ();	// Done inside a function to avoid "Maximum Call Stack Size Exceeded"
				}, 250);
				return;
			}
			
			// Fire a custom event that client code can pick up when the style is changed
			var body = document.getElementsByTagName ('body')[0];
			var myEvent = new Event ('style-changed', {'bubbles': true});
			body.dispatchEvent (myEvent);
		},
		
		
		// Function to create a control in a corner
		// See: https://www.mapbox.com/mapbox-gl-js/api/#icontrol
		createControl: function (id, position, className)
		{
			function myControl() { }
			
			myControl.prototype.onAdd = function(_map) {
				this._map = map;
				this._container = document.createElement('div');
				this._container.setAttribute ('id', id);
				this._container.className = 'mapboxgl-ctrl-group mapboxgl-ctrl local';
				if (className) {
					this._container.className += ' ' + className;
				}
				return this._container;
			};
			
			myControl.prototype.onRemove = function () {
				this._container.parentNode.removeChild(this._container);
				this._map = undefined;
			};
			
			// #!# Need to add icon and hover; partial example at: https://github.com/schulzsebastian/mapboxgl-legend/blob/master/index.js
			
			// Instiantiate and add the control
			_map.addControl (new myControl (), position);
		},
		
		
		// Wrapper function to add a geocoder control
		geocoder: function ()
		{
			// End if control not present on the page
			var geocoderSelector = '.geocoder input';
			if (!$(geocoderSelector).length) {return;}
			
			// Geocoder URL; re-use of settings values is supported, represented as placeholders {%apiBaseUrl}, {%apiKey}, {%autocompleteBbox}
			var geocoderApiUrl = layerviewer.settingsPlaceholderSubstitution (_settings.geocoderApiUrl, ['apiBaseUrl', 'apiKey', 'autocompleteBbox']);
			
			// Attach the autocomplete library behaviour to the location control
			autocomplete.addTo (geocoderSelector, {
				sourceUrl: geocoderApiUrl,
				select: function (event, ui) {
					var bbox = ui.item.feature.properties.bbox.split(',');	// W,S,E,N
					_map.fitBounds(bbox, {maxZoom: 16, duration: 1500});
					
					event.preventDefault();
				}
			});
		},
		
		
		// Helper function to implement settings placeholder substitution in a string
		settingsPlaceholderSubstitution: function (string, supportedPlaceholders)
		{
			// Substitute each placeholder
			var placeholder;
			$.each (supportedPlaceholders, function (index, field) {
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
			if ($(_settings.selector + ' li.' + layerId).hasClass ('unavailable')) {
				vex.dialog.alert ('Sorry, the ' + $(_settings.selector + ' li.' + layerId + ' a').text().toLowerCase() + ' layer is not available yet.');
				$(_settings.selector + ' li.' + layerId + ' input').prop('checked', false);
				return;
			}
			
			// If marker setting is enabled, add handlers
			layerviewer.setMarkerHandling (layerId);
			
			// Get the form parameters on load
			_parameters[layerId] = layerviewer.parseFormValues (layerId);
			
			// If sublayer parameterisation is enabled, i.e. layer style is dependent on a form value that has caused the layer to be reloaded, inject the new form value
			// #!# Currently, it is assumed that the calling application will write a handler to disable + re-enable the layer - this should be generalised as a setting
			_sublayerValues[layerId] = false;	// This ensures there is always a value for each layer, even if the form itself transmits an empty value string ''
			if (_layerConfig[layerId].sublayerParameter) {
				if (_parameters[layerId][_layerConfig[layerId].sublayerParameter]) {
					_sublayerValues[layerId] = _parameters[layerId][_layerConfig[layerId].sublayerParameter];
				}
			}
			
			// Set the legend
			layerviewer.setLegend (layerId);
			
			// If the data should initially be fit to the data extent, set a flag for first load
			if (_layerConfig[layerId].fitInitial) {
				_fitInitial[layerId] = true;
			}
			
			// Perform initial zoom, if required
			if (_layerConfig[layerId].zoomInitialMin) {
				if (_map.getZoom () < _layerConfig[layerId].zoomInitialMin) {
					_map.flyTo ({zoom: _layerConfig[layerId].zoomInitialMin});
				}
			}
			
			// Register to show/hide message based on zoom level
			if (_layerConfig[layerId].fullZoom) {
				layerviewer.fullZoomMessage (layerId);
				_map.on ('zoomend', function (e) {
					layerviewer.fullZoomMessage (layerId);
				});
			}
			
			// Register right-click feedback handler if required
			layerviewer.addLocateFeedbackHandler (layerId);
			
			// GeoJSON layer, which is the default type
			var isGeojsonLayer = (!_layerConfig[layerId].heatmap && !_layerConfig[layerId].vector && !_layerConfig[layerId].tileLayer);
			if (isGeojsonLayer) {
				layerviewer.addGeojsonLayer (layerId);
				layerviewer.layersOrderResetTop ();
			}
			
			// Native vector layer, assumed to be static (i.e. not dependent on map moves)
			if (_layerConfig[layerId].vector) {
				layerviewer.addVectorLayer (_layerConfig[layerId].vector, layerId);
				layerviewer.layersOrderResetTop ();
				return;		// Layer is static so no getData calls
			}
			
			// Heatmap layer
			if (_layerConfig[layerId].heatmap) {
				layerviewer.addHeatmapLayer (layerId);
				layerviewer.layersOrderResetTop ();
			}
			
			// Fetch the data
			layerviewer.getData (layerId, _parameters[layerId]);
			
			// Register to refresh data on map move
			if (!_layerConfig[layerId].static) {	// Unless marked as static, i.e. no change based on map location
				_dataRefreshHandlers[layerId] = function (e) {
					layerviewer.getData (layerId, _parameters[layerId]);
				};
				_map.on ('moveend', _dataRefreshHandlers[layerId]);
			}
			
			// Reload data on style change
			$('body').on ('style-changed', function (event) {
				layerviewer.getData (layerId, _parameters[layerId]);
			});
			
			// Reload the data for this layer, using a rescan of the form parameters for the layer, when any change is made
			var rescanPathBase = layerviewer.parseSettingSelector ('formRescanPath', layerId);
			var rescanPath = rescanPathBase + ' :input';
			
			// Also scan drawing area if enabled
			if (_settings.enableDrawing) {
				rescanPath += ', form #drawing :input';
			}
			
			// Rescan on form change
			$(document).on ('change', rescanPath, function () {
				_parameters[layerId] = layerviewer.parseFormValues (layerId);
				layerviewer.updateUrl ();
				layerviewer.getData (layerId, _parameters[layerId]);
			});
			$(rescanPathBase + ' :text, ' + rescanPathBase + ' input[type="search"]').on ('input', function () {	// Also include text input changes as-you-type; see: https://gist.github.com/brandonaaskov/1596867
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
		
		
		// Function to load IDs from URL parameters
		loadIdFromUrl: function (urlParameters)
		{
			// Read the variables to obtain section and ID
			// #!# This should eventually loop through each section and get all IDs
			var layerId = urlParameters.sections[0];
			if (!layerId) {return;}
			
			var id = urlParameters.id;

			// Do not run if no definition of the functionality
			if (!_layerConfig[layerId].hasOwnProperty ('apiCallId')) {return;}

			// Do not run if there is no URL parameter
			if (!urlParameters.hasOwnProperty ('id')) {return;}
			
			// Start API data parameters and add in the ID
			var apiData = layerviewer.assembleBaseApiData (layerId, true);
			apiData.id = id;

			// Determine the API URL to use
			var apiUrl = _layerConfig[layerId].apiCallId.apiCall;
			if (! (/https?:\/\//).test (apiUrl)) {
				apiUrl = _settings.apiBaseUrl + apiUrl;
			}
			
			// Get the data via AJAX
			$.ajax ({
				dataType: 'json',
				type: 'GET',
				url: apiUrl,
				data: apiData,
				success: function (response) 
				{
					// Convert using a callback if required
					if (_layerConfig[layerId].convertData) {
						response = _layerConfig[layerId].convertData (response);
						//console.log(data);
					}
					
					// If there is a popup callback, create the popup
					if (_layerConfig[layerId].hasOwnProperty ('popupCallback')) {
						
						// Generate popupHTML
						var template = _layerConfig[layerId].popupHtml;
						var popupContentHtml = layerviewer.renderDetailsHtml (response.features[0], template, layerId);

						// Display the popup using the callback
						_layerConfig[layerId].popupCallback (popupContentHtml, _layerConfig[layerId].apiCallId.popupAnimation);
					}
					
					// If there is no popup callback, the popup should be generated with standard HTML
					// #!# It is assumed that the main API call will create a marker, as here we only create the popup
				}
			});
		},

		
		// Marker setting handling
		setMarkerHandling: function (layerId)
		{
			// Run only if enabled
			if (!_layerConfig[layerId].setMarker) {return;}
			
			// Determine the input field
			var inputField = _layerConfig[layerId].setMarker;
			var inputFieldSelector = 'nav #' + layerId + " input[name='" + inputField + "']";
			
			// Get any intial value
			var initialValue = $(inputFieldSelector).val ();
			var lonLat;
			if (initialValue) {
				var position = initialValue.split (',');
				lonLat = {lng: parseFloat(position[0]), lat: parseFloat(position[1])};
			} else {
				lonLat = _map.getCenter ();
			}
			
			// Create the icon
			var iconUrl = layerviewer.getIconUrl (layerId, null);
			var iconSize = layerviewer.getIconSize (layerId, null);
			var icon = layerviewer.createIconDom (iconUrl, iconSize);
			
			// Add the marker to the map, setting it as draggable
			var marker = new mapboxgl.Marker (icon, {draggable: true})
				.setLngLat (lonLat)
				.addTo (_map);
			
			// If the marker is dragged or set to a different location, update the input value
			marker.on ('dragend', function (e) {
				var lngLat = marker.getLngLat ();
				var value = lngLat.lng.toFixed(5) + ',' + lngLat.lat.toFixed(5);
				$(inputFieldSelector)
					.attr ('value', value)		// Using this rather than .val() ensures the console representation is also correct
					.trigger('change');			// Ensure that form rescan gets triggered
			});
		},
		
		
		// Function to create a zoom message for a layer
		// #!# This needs to be reworked to register messages on a per-layer basis, then compile them, and hide the message box if none; currently it operates only on zoom changes
		fullZoomMessage: function (layerId)
		{
			// If the layer is disabled, hide the message
			if (!_layers[layerId]) {
				_message.hide ();
				return;
			}
			
			// Show or hide the message
			if (_map.getZoom () < _layerConfig[layerId].fullZoom) {
				if (_layerConfig[layerId].fullZoomMessage) {
					var message = _layerConfig[layerId].fullZoomMessage;
				} else {
					var message = 'Zoom in to show all ' + layerviewer.layerNameFromId (layerId).toLowerCase() + ' markers - only a selection are shown due to the volume.';
				}
				_message.show (message);
				$(_settings.selector + ' li.' + layerId + ' p.total').hide();
			} else {
				_message.hide ();
				$(_settings.selector + ' li.' + layerId + ' p.total').show();
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
			
			var rescanPathBase = layerviewer.parseSettingSelector ('formRescanPath', layerId);
			$(rescanPathBase + ' :input').each(function() {
				
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
				// Design decision here that an empty value '' will not get registered, as this is assumed to be an uninteresting default
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
				//var boundary = $('form#data #drawing :input').val();
				var boundary = $('form #drawing :input').val();
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
			// End if the layer has been disabled
			if (!_layers[layerId]) {return;}
			
			// If a minimum zoom is specified, end if the zoom is too low
			if (_layerConfig[layerId].minZoom) {
				if (_map.getZoom () < _layerConfig[layerId].minZoom) {return;}
			}
			
			// If the layer is a tile layer rather than an API call, add it and end
			// #!# Cannot yet move up as per other layer types, as form rescan needs to hook into style change
			if (_layerConfig[layerId].tileLayer) {
				layerviewer.addTileOverlayLayer (_layerConfig[layerId].tileLayer, layerId, parameters);
				return;		// No further action, e.g. API calls
			}
			
			// Start API data parameters
			var apiData = layerviewer.assembleBaseApiData (layerId);
			
			// If required for this layer, reformat a drawn boundary, leaving it unchanged for other layers
			if (parameters.boundary) {
				if (_layerConfig[layerId].hasOwnProperty('apiBoundaryFormat')) {
					parameters.boundary = layerviewer.reformatBoundary (parameters.boundary, _layerConfig[layerId].apiBoundaryFormat);
				}
			}
			
			// Determine which retrieval strategy is needed - bbox (default) or lat/lon or none
			var retrievalStrategy = _layerConfig[layerId].retrievalStrategy || 'bbox';
			
			// Unless a boundary is drawn in, supply a bbox or lat/lon
			if (!parameters.boundary) {
				
				// For bbox, get the bbox, and reduce the co-ordinate accuracy to avoid over-long URLs
				if (retrievalStrategy == 'bbox') {
					var bbox = _map.getBounds();
					parameters.bbox = bbox.getWest() + ',' + bbox.getSouth() + ',' + bbox.getEast() + ',' + bbox.getNorth();
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
				
				// If none, send neither of the above
				// if (retrievalStrategy == 'none') {}
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
				apiData.zoom = parseInt (_map.getZoom ());
			}
			
			// Add in the parameters from the form
			$.each (parameters, function (field, value) {
				apiData[field] = value;
			});
			
			// Add beta flag if enabled
			if (_betaMode) {
				apiData.beta = 1;
			}
			
			// Determine the API URL to use
			var apiUrl = _layerConfig[layerId].apiCall;
			if (! (/https?:\/\//).test (apiUrl)) {
				apiUrl = _settings.apiBaseUrl + apiUrl;
			}
			
			// If there is a region selected in the dropdown, and there is a space for a token in the apiUrl, swap it out
			if (_settings.regionsSubstitutionToken) {
				if (apiUrl.includes (_settings.regionsSubstitutionToken)) {
					var selectedOption = $('#regionswitcher option:selected').val();
					if (!selectedOption) {
						selectedOption = $($('#regionswitcher option')[1]).val();
					}
					var region = (selectedOption == null ? $('#regionswitcher option').first().val() : selectedOption);
					apiUrl = apiUrl.replace (_settings.regionsSubstitutionToken, region);
				}
			}
			
			// If the URL has placeholders that match form parameters, substitute those instead of treating them as query string parameters
			var placeholdersRegexp = /{%([^}]+)}/g;
			var urlPlaceholders = apiUrl.match (placeholdersRegexp);
			var field;
			if (urlPlaceholders) {
				$.each (urlPlaceholders, function (index, urlPlaceholder) {
					field = urlPlaceholder.replace (/{%([^}]+)}/, '$1');
					apiUrl = apiUrl.replace (urlPlaceholder, apiData[field]);	// It is assumed that all will be present
					delete apiData[field];
				});
			}
			
			// If no change (e.g. map move while boundary set, and no other changes), avoid re-requesting data
			// This also means that KML and other static datasets will not get re-requested
			var requestSerialised = apiUrl + (!$.isEmptyObject (apiData) ? '?' + $.param (apiData) : '');		// Note that the apiUrl is included, as this could have had placeholder replacement
			if (_requestCache.hasOwnProperty (layerId)) {
				if (requestSerialised == _requestCache[layerId]) {
					return;
				}
			}
			_requestCache[layerId] = requestSerialised;     // Update cache
			
			// Set/update a cookie containing the full request state
			layerviewer.setStateCookie ();
			
			// If an outstanding layer request is still active, cancel it
			if (_xhrRequests[layerId] != null) {
				_xhrRequests[layerId].abort();
				_xhrRequests[layerId] = null;
			}
			
			// Start data loading spinner for this layer
			var dataLoadingSpinnerSelector = layerviewer.parseSettingSelector ('dataLoadingSpinnerSelector', layerId);
			$(dataLoadingSpinnerSelector).show();
			
			// Set the data type
			var dataType = (_layerConfig[layerId].dataType ? _layerConfig[layerId].dataType : (layerviewer.browserSupportsCors () ? 'json' : 'jsonp'));		// Fall back to JSON-P for IE9
			
			// KML: use XML for data type
			if (_layerConfig[layerId].dataType && _layerConfig[layerId].dataType == 'kml') {
				dataType = 'xml';
			}
			
			// Fetch data
			_xhrRequests[layerId] = $.ajax({
				url: apiUrl,
				data: apiData,
				dataType: dataType,
				crossDomain: true,	// Needed for IE<=9; see: https://stackoverflow.com/a/12644252/180733
				error: function (jqXHR, error, exception) {
					
					// Deregister from the request registry
					_xhrRequests[layerId] = null;
					
					// Stop data loading spinner for this layer
					$(dataLoadingSpinnerSelector).hide ();
					
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
					$(dataLoadingSpinnerSelector).hide();
					
					// Determine error handling UI mode
					var errorNonModalDialog = layerviewer.glocalVariable ('errorNonModalDialog', layerId);
					
					// Show API-level error if one occured
					// #!# This is done here because the API still returns Status code 200
					if (data.error) {
						layerviewer.removeLayer (layerId);
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
					return layerviewer.showCurrentData (layerId, data, requestSerialised);
				}
			});
		},
		
		
		// Function to assemble the base API data by reading the apiCallFixedParameters from the layer definitions
		// @param apiCallId: boolean. The function will attempt to use apiCallId properties instead
		assembleBaseApiData: function (layerId, apiCallId = false)
		{
			var apiData = {};
	
			// Add the key, unless disabled
			var sendApiKey = (_layerConfig[layerId].hasOwnProperty ('apiKey') ? _layerConfig[layerId].apiKey : true);
			if (sendApiKey) {
				apiData.key = _settings.apiKey;
			}
	
			// Add fixed parameters if present
			if (apiCallId) {
				if (_layerConfig[layerId].apiCallId.apiFixedParameters) {
					$.each(_layerConfig[layerId].apiCallId.apiFixedParameters, function (field, value) {
						apiData[field] = value;
					});
				}
			} else {
				if (_layerConfig[layerId].apiFixedParameters) {
					$.each(_layerConfig[layerId].apiFixedParameters, function (field, value) {
						apiData[field] = value;
					});
				}
			}
			return apiData;
		},


		// Function to parse a setting for a dynamic layerId
		parseSettingSelector: function (setting, layerId)
		{
			return (_settings[setting].replace ('{layerId}', layerId));
		},
		
		
		// Function to add a GeoJSON layer
		addGeojsonLayer: function (layerId)
		{
			// Add the GeoJSON data source; rather than use addLayer and specify the source directly, we have to split the source addition and the layer addition, as the layers can have different feature types (point/line/polygon), which need different renderers
			layerviewer.addGeojsonSource (layerId);
			
			// Add layer renderers for each feature type
			layerviewer.addFeatureTypeLayerSet (layerId);
			
			// Enable popups if required, for each of the three geometry types
			var popupHtmlTemplate = layerviewer.sublayerableConfig ('popupHtml', layerId);
			var layerVariantId;
			$.each (_opengisTypes, function (index, geometryType) {
				layerVariantId = layerviewer.layerVariantId (layerId, geometryType);
				layerviewer.createPopups (layerId, layerVariantId, geometryType, popupHtmlTemplate);
			});
			
			// Register a dialog box handler for showing additional popup details if required
			layerviewer.detailsOverlayHandler ('#details', layerId);
			
			// Register in-popup feedback button handler if required
			layerviewer.addPopupFeedbackHandler (layerId);
		},
		
		
		// Function to add a GeoJSON source
		addGeojsonSource: function (layerId)
		{
			// Define the initial GeoJSON state
			var data = {type: 'FeatureCollection', 'features': []};	// Empty GeoJSON; see: https://github.com/mapbox/mapbox-gl-js/issues/5986
			if (_layerConfig[layerId].hasOwnProperty ('data') && _layerConfig[layerId].data !== false) {
				var data = _layerConfig[layerId].data;
			}
			
			// Define the data source
			_map.addSource (layerId, {
				type: 'geojson',
				data: data,
				generateId: true	// NB See: https://github.com/mapbox/mapbox-gl-js/issues/8133
			});
		},
		
		
		// Function to add a layer for each feature type
		addFeatureTypeLayerSet: function (layerId)
		{
			// Assemble the styles definition
			var styles = layerviewer.layerSettingsStyles (layerId, true);
			
			// Add renderers for each different feature type; see: https://docs.mapbox.com/mapbox-gl-js/example/multiple-geometries/
			var layer;
			var layerVariantId;
			$.each (styles, function (geometryType, style) {
				
				// Determine if there is an icon; if so, the marker has been rendered already, so a render icon is not needed
				if (geometryType == 'Point') {
					var iconUrl = layerviewer.getIconUrl (layerId, null);
					if (iconUrl) {return;}
				}
				
				// Add the layer
				layerVariantId = layerviewer.layerVariantId (layerId, geometryType);
				layer = {
					id: layerVariantId,
					source: layerId,
					type: style.type,
					paint: style.paint,
					layout: style.layout,
					filter: ['==', '$type', geometryType]
				};
				_map.addLayer (layer);
			});
			
			// For line style, add hover state handlers if enabled; see: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
			if (_settings.hover || _layerConfig[layerId].hover) {
				layerviewer.hoverStateHandlers (layerId + '_' + 'linestring', layerId);
			}
		},
		
		
		// Function to add a heatmap layer; see: https://docs.mapbox.com/help/tutorials/make-a-heatmap-with-mapbox-gl-js/
		addHeatmapLayer: function (layerId)
		{
			// Add the GeoJSON data source; rather than use addLayer and specify the source directly, we have to split the source addition and the layer addition, as the layers can have different feature types (point/line/polygon), which need different renderers
			layerviewer.addGeojsonSource (layerId);
			
			// Add the layer
			var layer = {
				id: layerviewer.layerVariantId (layerId, 'heatmap'),	// E.g. mydata_heatmap
				source: layerId,
				type: 'heatmap',
				paint: layerviewer.heatmapStyles (),
			};
			_map.addLayer (layer);
		},
		
		
		// Function to add a native vector layer; vector layers are assumed to be static
		addVectorLayer: function (vectorLayerAttributes, layerId)
		{
			// Amend the ID in the layer specification
			vectorLayerAttributes.layer.id = layerId;
			vectorLayerAttributes.layer.source = layerId;
			
			// Convert absolute tile source paths to full URL, as otherwise an 'Unable to parse URL' error will result
			$.each (vectorLayerAttributes.source.tiles, function (index, url) {
				if (url.match (/^\//)) {		// I.e. starts with /
					vectorLayerAttributes.source.tiles[index] = window.location.origin + url;
				}
			});
			
			// Styles allocation precedence is as follows; NB see paint vs layout definition at: https://docs.mapbox.com/help/glossary/layout-paint-property/
			// - If the layer defines paint (and possibly layout) styles, then that acts as the starting point
			// - If paint and layout are both not defined, the default styles (which has paint and sometimes layout) will be put in
			// - If there are layer settings -defined styles, e.g. (e.g. polygonColourField, polygonColourValues, etc.) they will then override specific styles; currently only paint is supported
			
			// If no style defined in the vector definition, i.e. no paint and no layout, use default styles
			var useDefaultStyles = (!vectorLayerAttributes.layer.hasOwnProperty ('paint') && !vectorLayerAttributes.layer.hasOwnProperty ('layout'));
			var layerType = vectorLayerAttributes.layer.type;	// I.e. circle/line/fill
			if (useDefaultStyles) {
				var defaultStylesByType = layerviewer.stylesBySymboliserType (_defaultStyles);
				vectorLayerAttributes.layer.paint  = defaultStylesByType[layerType].paint;
				vectorLayerAttributes.layer.layout = defaultStylesByType[layerType].layout;
			}
			
			// Override any styles with layer settings -defined styles (e.g. polygonColourField, polygonColourValues, etc); currently only paint is supported
			var layerSettingsStyles = layerviewer.layerSettingsStyles (layerId, false);
			var layerSettingsStylesByType = layerviewer.stylesBySymboliserType (layerSettingsStyles);
			if (!$.isEmptyObject (layerSettingsStylesByType[layerType].paint)) {
				vectorLayerAttributes.layer.paint  = layerSettingsStylesByType[layerType].paint;
			}
			
			// Register the source and layer
			_map.addSource (layerId, vectorLayerAttributes.source);		// source will contain {type: 'vector', tiles: [...], etc}
			_map.addLayer (vectorLayerAttributes.layer);			// layer will contain {id: ..., type: 'circle', source: ..., 'source-layer': ..., 'paint': {...}}
			
			// Enable popups if required
			var popupHtmlTemplate = layerviewer.sublayerableConfig ('popupHtml', layerId);
			layerviewer.createPopups (layerId, layerId, false, popupHtmlTemplate);
			
			// Register a dialog box handler for showing additional popup details if required
			layerviewer.detailsOverlayHandler ('#details', layerId);
			
			// Register in-popup feedback button handler if required
			layerviewer.addPopupFeedbackHandler (layerId);
		},
		
		
		// Function to arrange default styles by symboliser type, e.g. indexed by 'line' rather than OpenGIS type LineString
		stylesBySymboliserType: function (stylesByOpengisType)
		{
			var defaultStylesByType = {};
			$.each (stylesByOpengisType, function (opengisType, style) {
				defaultStylesByType[style.type] = style;
			});
			return defaultStylesByType;
		},
		
		
		// Function to add a tile overlay (foreground) layer
		addTileOverlayLayer: function (tileLayerAttributes, layerId, parameters)
		{
			// Make changes on the tile layer attributes without modifying the original
			tileLayerAttributes = $.extend (true, {}, tileLayerAttributes);
			
			// Substitute placeholder values, e.g. style switcher
			if (parameters) {
				var placeholder;
				$.each (parameters, function (field, value) {
					placeholder = '{%' + field + '}';
					tileLayerAttributes.tiles = tileLayerAttributes.tiles.replace (placeholder, value);
				});
			}
			
			// Construct the ID, incorporating any parameters to ensure uniqueness
			var id = layerId + '-' + jQuery.param (parameters);	// E.g. abc-style=blue
			
			// Leave current setup in place if already present, with the same style options
			if (_tileOverlayLayer == id) {
				return;
			}
			
			// If an existing layer is already present, e.g. with different style options, remove it
			if (_tileOverlayLayer) {
				layerviewer.removeTileOverlayLayer ();
			}
			
			// Register to the cache
			_tileOverlayLayer = id;
			
			// Add to the map
			var layer = layerviewer.defineRasterTilesLayer (tileLayerAttributes, id);
			_map.addSource (id, layer.sources[id]);
			_map.addLayer (layer.layers[0]);
			// #!# Max zoom on layer doesn't actually seem to work
			_map.setLayerZoomRange (id, 0, (tileLayerAttributes.maxZoom ? tileLayerAttributes.maxZoom : 20));
		},
		
		
		// Function to remove a vector layer
		removeVectorLayer: function (layerId)
		{
			// Remove the layer and the source, and reset the layer value
			_map.removeLayer (layerId);
			_map.removeSource (layerId);
		},
		
		
		// Function to remove a tile overlay (foreground) layer
		removeTileOverlayLayer: function ()
		{
			// Remove the layer and the source, and reset the layer value
			_map.removeLayer (_tileOverlayLayer);
			_map.removeSource (_tileOverlayLayer);
			_tileOverlayLayer = false;
		},
		
		
		// Function to determine the value of a variable settable globally and/or locally
		glocalVariable: function (variableName, layerId)
		{
			// Default to global value
			var value = _settings[variableName];
			
			// Layer-specific setting can override global
			if (_layerConfig[layerId].hasOwnProperty (variableName)) {
				value = _layerConfig[layerId][variableName];
			}
			
			// Return the value
			return value;
		},
		
		
		// Details dialog box handler
		detailsOverlayHandler: function (triggerElement, layerId)
		{
			// End if not enabled
			if (!_layerConfig[layerId].detailsOverlay) {return;}
			
			// Register a handler; note that the HTML in bindPopup doesn't exist yet, so $(triggerElement) can't be used; instead, this listens for click events on the map element which will bubble up from the tooltip, once it's created and someone clicks on it; see: https://stackoverflow.com/questions/13698975/
			$('#map').on('click', triggerElement, function (e) {
				
				// Load the data, using the specified data-id attribute set in the popup HTML dynamically
				var apiUrl = $(this).attr('data-url') + '&key=' + _settings.apiKey;
				$.get(apiUrl, function (data) {
					
					// Access the data
					var feature = data.features[0];
					
					// Render the data into the overlay template
					var template = (_layerConfig[layerId].overlayHtml ? _layerConfig[layerId].overlayHtml : false);
					var html = layerviewer.renderDetailsHtml (feature, template, layerId);
					
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
				coordinates[i] = +parseFloat(coordinates[i]).toFixed(accuracy);
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
		
		
		// Function to populate a layer's field labels from a CSV file
		populateFieldLabels: function (layerId)
		{
			// Exit immediately if this layer has no associated CSV file
			if (!_layerConfig[layerId].fieldLabelsCsv) {
				return;
			}
			
			// Initialise blank popupLabels property if necessary
			if (!_layerConfig[layerId].hasOwnProperty('popupLabels')) {
				_layerConfig[layerId].popupLabels = {};
			}
			
			// Initialise blank popupDescriptions property if necessary
			if (!_layerConfig[layerId].hasOwnProperty('popupDescriptions')) {
				_layerConfig[layerId].popupDescriptions = {};
			}
			
			// Default fields
			// #!# This should really be done at the layer initialisation
			var fieldColumn = _layerConfig[layerId].fieldLabelsCsvField || 'field';
			var titleColumn = _layerConfig[layerId].fieldLabelsCsvTitle || 'title';
			var descriptionColumn = _layerConfig[layerId].fieldLabelsCsvDescription || 'description';
			
			// Stream and parse the CSV file
			Papa.parse (_layerConfig[layerId].fieldLabelsCsv, {
				header: true,
				download: true,
				complete: function (fields) {
					var key;
					var title;
					var description;
					$.each (fields.data, function (index, fieldLabels) {
						key = fieldLabels[fieldColumn];
						title = fieldLabels[titleColumn];
						description = fieldLabels[descriptionColumn];
						_layerConfig[layerId].popupLabels[key] = title;
						_layerConfig[layerId].popupDescriptions[key] = description;
					});
				}
			});
		},
		
		
		// Function to construct the popup/overlay content HTML
		renderDetailsHtml: function (feature, template /* optional */, layerId)
		{
			// If template is an object, get the HTML
			if (template.popupHtmlSelector) {
				template = $(template.popupHtmlSelector).prop ('outerHTML');
			}
			
			// Use a template if this has been defined in the layer config
			var html;
			if (template) {
				
				// Define a path parser, so that the template can define properties.foo which would obtain feature.properties.foo; see: https://stackoverflow.com/a/22129960
				Object.resolve = function(path, obj) {
					return path.split('.').reduce(function(prev, curr) {
						return (prev ? prev[curr] : undefined);
					}, obj || self);
				};

				// Convert data-src into src
				if (template.indexOf ('data-src') >= 0) {
					var templateElement = $.parseHTML (template);
					var dataSrcElements = $('[data-src]', templateElement);
					
					var elementOriginalStr;
					var templatisedString;
					$.each (dataSrcElements, function (indexInArray, element) { 
						// Make a copy of the string of the original element
						elementOriginalStr = $(element)[0].outerHTML;
						
						// Using jQuery to convert the string into a element, replace the src with data-src
						$(element).prop ('src', $(element).data ('src'));
						
						// Convert this element into a string
						templatisedString = $(element)[0].outerHTML;
						
						// Find the original string in the template, and replace it with the templatised string
						template = template.replace(elementOriginalStr, templatisedString);
					});
				}
				
				// Convert Street View macro
				if (template.indexOf ('{%streetview}') >= 0) {
					template = template.replace ('{%streetview}', layerviewer.streetViewTemplate (feature));
				}
				
				// Convert map position macro
				// #!# Ideally this would be the exact located/clicked position, but that adds quite a bit more complexity
				if (template.indexOf ('{%mapposition}') >= 0) {
					var centre = _map.getCenter ();
					var zoom = _map.getZoom ();
					var mapPosition = zoom.toFixed(1) + '/' + centre.lat.toFixed(5) + '/' + centre.lng.toFixed(5);		// Should be the same as the hash, if the hash exists
					template = template.replace ('{%mapposition}', mapPosition);
				}
				
				// If any property is null, show '?' instead
				$.each (feature.properties, function (key, value) {
					if (value === null) {
						feature.properties[key] = '<span class="unknown">?</span>';
					}
				});
				
				// Convert OSM edit link macro
				if (template.indexOf ('{%osmeditlink}') >= 0) {
					var centroid = layerviewer.polygonCentroid (feature);
					var zoom = 19;	// #!# Need equivalent of getBoundsZoom, to replace this fixed value
					var osmEditUrl = 'https://www.openstreetmap.org/edit#map=' + zoom + '/' + centroid.lat.toFixed(5) + '/' + centroid.lng.toFixed(5);
					template = template.replace (/{%osmeditlink}/g, '<a class="edit" target="_blank" href="' + osmEditUrl + '">Add in OSM</a>');
				}
				
				// Replace template placeholders; see: https://stackoverflow.com/a/378000
				template = template.replace (/\{[^{}]+\}/g, function (path){
					var resolvedPlaceholderText = Object.resolve (path.replace(/[{}]+/g, '') , feature);
					if (resolvedPlaceholderText == undefined && _layerConfig[layerId].hasOwnProperty ('emptyPlaceholderText')) {
						return _layerConfig[layerId].emptyPlaceholderText;
					} else {
						return resolvedPlaceholderText;
					}
				});
				
				html = template;
				
				// Support 'yearstable' macro, which generates a table of fields for each year, with parameters: first year, last year, fieldslist split by semicolon, labels for each field split by semicolon
				var matches = html.match (/\[macro:yearstable\((.+), (.+), (.+), (.+)\)\]/);
				if (matches) {
					html = html.replace (matches[0], layerviewer.macroYearstable (matches, feature));
				}
				
			// Otherwise, create a simple key/value pair HTML table dynamically
			} else {
				
				// Determine rounding decimal places in popups
				var popupsRoundingDP = layerviewer.glocalVariable ('popupsRoundingDP', layerId);
				
				html = '<table>';
				var fieldLabel;
				var fieldDescription;
				$.each (feature.properties, function (key, value) {
					
					// Skip if value is an array/object
					if ($.type (value) === 'array')  {return; /* i.e. continue */}
					if ($.type (value) === 'object') {return; /* i.e. continue */}
					
					// Skip if icon field
					if (_layerConfig[layerId].iconField) {
						if (key == _layerConfig[layerId].iconField) {return; /* i.e. continue */}
					}
					
					// Key
					fieldLabel = key;
					if (_layerConfig[layerId].popupLabels) {
						if (_layerConfig[layerId].popupLabels.hasOwnProperty (key)) {
							fieldLabel = _layerConfig[layerId].popupLabels[key];
						}
					}
					
					// Description (i.e. <abbr> tag contents)
					fieldDescription = false;
					if (_layerConfig[layerId].popupDescriptions) {
						if (_layerConfig[layerId].popupDescriptions[key]) {
							fieldDescription = _layerConfig[layerId].popupDescriptions[key];
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
					value = layerviewer.number_format (value, popupsRoundingDP);
					
					// Convert TRUE to tick
					if (value == 'TRUE') {value = '&#10004;';}
					
					// If a callback formatter, use that instead, ignoring other changes
					if (_layerConfig[layerId].popupFormatters) {
						if (_layerConfig[layerId].popupFormatters[key]) {
							value = _layerConfig[layerId].popupFormatters[key] (feature.properties[key], feature);
						}
					}

					// Compile the HTML
					html += '<tr><td>' + (fieldDescription ? '<abbr title="' + fieldDescription + '">' : '') + fieldLabel + (fieldDescription ? '</abbr>' : '') + ':</td><td><strong>' + value + '</strong></td></tr>';
				});
				html += '</table>';
				
				// Add images if enabled
				if (_layerConfig[layerId].popupImagesField) {
					var popupImagesField = _layerConfig[layerId].popupImagesField;
					if (feature.properties[popupImagesField]) {
						$.each (feature.properties[popupImagesField], function (index, imageUrl) {
							html += '<a href="' + imageUrl + '" target="_blank"><img src="' + imageUrl + '" width="140" /> ';
						});
					}
				}
				
				// Add Street View if directly specified
				if (_layerConfig[layerId].streetview) {
					html += layerviewer.streetViewTemplate (feature);
				}
			}
			
			// Prepend feedback button if required
			var feedbackButton = layerviewer.addPopupFeedbackButton (layerId, feature);
			html = feedbackButton + html;
			
			// Return the content
			return html;
		},
		
		
		// Street View container template
		streetViewTemplate: function (feature)
		{
			// Determine the centroid
			var centre = layerviewer.getCentre (feature.geometry);
			
			// Assemble and return the HTML
			return '<iframe id="streetview" src="/streetview.html?latitude=' + centre.lat + '&longitude=' + centre.lon + '">Street View loading &hellip;</iframe>';
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
			var i;
			var range = [];
			for (i = start; i <= end; i++) {
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
		showCurrentData: function (layerId, data, requestSerialised)
		{
			// Convert using a callback if required
			if (_layerConfig[layerId].convertData) {
				data = _layerConfig[layerId].convertData (data);
				//console.log(data);
			}
			
			// Convert from flat JSON to GeoJSON if required
			if (_layerConfig[layerId].flatJson) {
				data = GeoJSON.parse (data, {Point: _layerConfig[layerId].flatJson});
				//console.log(data);
			}
			
			// Convert from KML to GeoJSON if required; see: https://github.com/placemark/togeojson
			if (_layerConfig[layerId].dataType && _layerConfig[layerId].dataType == 'kml') {
				data = toGeoJSON.kml (data);
			}
			
			// Fix up data
			var lineColourField = layerviewer.sublayerableConfig ('lineColourField', layerId);
			var lineWidthField = layerviewer.sublayerableConfig ('lineWidthField', layerId);
			$.each (data.features, function (index, feature) {
				
				// Ensure data is numeric for the line colour field, to enable correct comparison
				if (!isNaN (data.features[index].properties[lineColourField])) {
					data.features[index].properties[lineColourField] = Number (feature.properties[lineColourField]);
				}
				
				// Ensure numeric data is numeric for the line width field, to enable correct comparison
				if (!isNaN (data.features[index].properties[lineWidthField])) {
					data.features[index].properties[lineWidthField] = Number (feature.properties[lineWidthField]);
				}
				
				// Workaround to fix up string "null" to null for popups; see: https://github.com/mapbox/vector-tile-spec/issues/62
				$.each (feature.properties, function (key, value) {
					if (value === 'null') {
						data.features[index].properties[key] = null;
					}
				});
			});
			
			// Update display of total in the menu and export links
			layerviewer.updateTotals (data.features, layerId, requestSerialised);
			
			// Perform initial fit of map extent, if required
			if (_fitInitial[layerId]) {
				var geojsonBounds = geojsonExtent (data);
				var fitInitialPadding = (_layerConfig[layerId].hasOwnProperty ? _layerConfig[layerId].fitInitialPadding : 20);
				_map.fitBounds (geojsonBounds, {padding: fitInitialPadding});
				_fitInitial[layerId] = false;		// Disable for further map pannings; renabling the layer will reset
			}
			
			// Remove any existing markers and popups, neither of which are technically bound to a feature
			layerviewer.removePopups (layerId);
			layerviewer.removeMarkers (layerId);
			
			// Set the data
			// Note that for DOM icon -based layers, while setData is done, the data is actually put on the map in drawManualDomIcons below
			_map.getSource (layerId).setData (data);
			
			// Show icons, where Points present
			var popupHtmlTemplate = layerviewer.sublayerableConfig ('popupHtml', layerId);
			layerviewer.drawManualDomIcons (data, layerId, popupHtmlTemplate);
		},
		
		
		// Function to create a layer variant ID from a layerId and geometry type, e.g. mydata_point, mydata_linestring, mydata_polygon
		layerVariantId: function (layerId, geometryType)
		{
			return layerId + '_' + geometryType.toLowerCase ();
		},
		
		
		// Function to update totals in the interface, as well as provide CSV/GeoJSON export link(s)
		// #!# These two functionalities should be split out
		updateTotals: function (features, layerId, requestSerialised)
		{
			// Determine the total number of items in the data
			var totalItems = Object.keys(features).length;
			
			// Update the total count in the menu
			$(_settings.selector + ' li.' + layerId + ' p.total').html(totalItems);
			
			// Add the export link button(s) if not currently present
			if ( $('#sections #' + layerId + ' div.export p a').length == 0) {	// i.e. currently unlinked
				$('#sections #' + layerId + ' div.export p').append(' <span></span>');
				$('#sections #' + layerId + ' div.export .csv').wrap('<a href="#"></a>');
				$('#sections #' + layerId + ' div.export .geojson').wrap('<a href="#"></a>');
				$('#sections #' + layerId + ' div.export p').addClass('enabled');
			}
			
			// Enable/update CSV/GeoJSON export link(s), if there are items, and show the count
			var exportUrlCsv = requestSerialised + '&format=csv&export=csv';	// Both parameter types supported (format=csv, export=csv)
			var exportUrlGeojson = requestSerialised.replace (/.json($|\?)/, '.geojson$1');
			$('#sections #' + layerId + ' div.export p span').text ('(' + totalItems + ')');
			$('#sections #' + layerId + ' div.export .csv').parent('a').attr('href', exportUrlCsv);
			$('#sections #' + layerId + ' div.export .geojson').parent('a').attr('href', exportUrlGeojson);
		},
		
		
		// Function to show icons from dynamic URLs in GeoJSON
		// See: https://docs.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
		// See: https://github.com/mapbox/mapbox-gl-js/issues/4736 and https://github.com/mapbox/mapbox-gl-js/issues/822
		// See: https://stackoverflow.com/questions/50411046/add-custom-marker-to-mapbox-map
		// This approach cannot work as it requires loadImage/addImage pairs to be done before map loading: https://gomasuga.com/blog/switch-from-google-maps-to-mapbox
		drawManualDomIcons: function (data, layerId, popupHtmlTemplate)
		{
			// Do not use for heatmap
			if (_layerConfig[layerId].heatmap) {return;}
			
			// Remove any existing markers
			layerviewer.removeMarkers (layerId);
			
			// Determine the field in the feature.properties data that specifies the icon to use
			var iconField = _layerConfig[layerId].iconField;
			
			// If marker importance is defined, define the zIndex offset values for each marker type, to be based on the iconField
			if (_layerConfig[layerId].markerImportance) {
				var markerZindexOffsets = [];
				$.each (_layerConfig[layerId].markerImportance, function (index, iconFieldValue) {
					markerZindexOffsets[iconFieldValue] = 0 + (1 * index);	// NB Need to check for overlap with layer switcher
				});
			}
			
			// Loop through each feature
			$.each (data.features, function (index, feature) {
				
				// Consider only points
				if (feature.geometry.type == 'Point') {
					
					// Generate popupHTML
					var popupContentHtml = layerviewer.renderDetailsHtml (feature, popupHtmlTemplate, layerId);
					
					// Initiate the popup
					var popup = new mapboxgl.Popup ({className: layerId})
						.setHTML (popupContentHtml);
					
					// Register the popup so it can be removed on redraw
					_popups[layerId].push (popup);
					
					// Determine whether to use a local fixed icon, a local icon set, or an icon field in the data, or no marker at all (if no iconUrl)
					var iconUrl = layerviewer.getIconUrl (layerId, feature);
					
					// End if no icon
					if (!iconUrl) {return false;}	/* i.e. break */
					
					// Determine icon size
					var iconSize = layerviewer.getIconSize (layerId, feature);
					
					// Construct the icon
					var marker = layerviewer.createIconDom (iconUrl, iconSize);
					
					// Set the icon zIndexOffset if required
					if (_layerConfig[layerId].markerImportance) {
						var fieldValue = feature.properties[iconField];
						marker.style.zIndex = markerZindexOffsets[fieldValue];
					}
					
					// Add the marker to the map
					if (marker) {
						marker = new mapboxgl.Marker (marker)
							.setLngLat (feature.geometry.coordinates)
							.setPopup (popup)
							.addTo (_map);
					}
					
					// If we have a callback, store each marker's popupHtml
					if (_layerConfig[layerId].hasOwnProperty ('popupCallback')) {
						
						// Create a marker property __popupHTML, unofficially overloading the published data structure
						var template = _layerConfig[layerId].popupHtml;
						marker.__popupHtml = layerviewer.renderDetailsHtml (feature, template, layerId);

						// Add a custom click listener, which will ignore the default popup action
						marker.getElement().addEventListener('click', function (event) {
							_layerConfig[layerId].popupCallback (marker.__popupHtml);
							
							event.preventDefault ();
							event.stopImmediatePropagation ();
						});
					}
					
					// Register the marker so it can be removed on redraw
					_markers[layerId].push (marker);
				}
			});
		},
		
		
		// Function to determine the iconUrl for a feature
		getIconUrl: function (layerId, feature /* may be set to null if checking layer-only definitions */)
		{
			// Use layer fixed icon, if set
			if (_layerConfig[layerId].iconUrl) {
				return _layerConfig[layerId].iconUrl;
			}
			
			// Obtain the field in the feature.properties data that specifies the icon to use
			var iconField = _layerConfig[layerId].iconField;
			
			// If there is a feature, use iconField
			if (feature) {
				
				// Select from layer icon set, if set
				if (_layerConfig[layerId].icons) {
					return _layerConfig[layerId].icons[feature.properties[iconField]];
				}
				
				// Else use feature properties directly
				if (feature.properties[iconField]) {
					return feature.properties[iconField];
				}
			} else {
				
				// If no feature, but an iconField is set, an iconUrl can be deemed to exist
				if (iconField) {
					return true;
				}
			}
			
			// Otherwise use global icon, if set
			return _settings.iconUrl;
		},
		
		
		// Determine icon size
		getIconSize: function (layerId, feature /* may be set to null if checking layer-only definitions */)
		{
			// Use the global setting by default
			var iconSize = _settings.iconSize;
			
			// If a layer-specific value is set, use that
			if (_layerConfig[layerId].iconSize) {
				iconSize = _layerConfig[layerId].iconSize;
			}
			
			// Dynamic icon size based on feature properties
			if (feature) {
				if (_layerConfig[layerId].iconSizeField && !$.isEmptyObject (_layerConfig[layerId].iconSizes)) {
					var dataValue = feature.properties[_layerConfig[layerId].iconSizeField];
					if (_layerConfig[layerId].iconSizes.hasOwnProperty (dataValue)) {
						iconSize = _layerConfig[layerId].iconSizes[dataValue];
					}	// Otherwise default to the above, e.g. if property not present or not in the list
				}
			}
			
			// Return the icon size
			return iconSize;
		},
		
		
		// Construct the DOM representation for an icon
		// See: https://docs.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
		// This all has to be done manually in the DOM, unfortunately, as Mapbox GL JS has no support for native dynamically-defined markers
		createIconDom: function (iconUrl, iconSize)
		{
			// Create the marker
			var marker = document.createElement ('img');
			marker.setAttribute ('src', iconUrl);
			marker.className = 'marker';
			marker.style.width = iconSize[0] + 'px';
			marker.style.height = iconSize[1] + 'px';
			marker.style.cursor = 'pointer';
			
			// Return the marker
			return marker;
		},
		
		
		// Function assemble the styles definition for a layer from the layer settings
		layerSettingsStyles: function (layerId, useDefaultStyles)
		{
			// Determine definitions
			// #!# This merge-style operation should be dealt with generically at top-level
			var lineColourField = layerviewer.sublayerableConfig ('lineColourField', layerId);
			var lineColourStops = layerviewer.sublayerableConfig ('lineColourStops', layerId);
			var lineColourValues = layerviewer.sublayerableConfig ('lineColourValues', layerId);
			var lineWidthField = layerviewer.sublayerableConfig ('lineWidthField', layerId);
			var lineWidthStops = layerviewer.sublayerableConfig ('lineWidthStops', layerId);
			var lineWidthValues = layerviewer.sublayerableConfig ('lineWidthValues', layerId);
			var polygonColourField = layerviewer.sublayerableConfig ('polygonColourField', layerId);
			var polygonColourValues = layerviewer.sublayerableConfig ('polygonColourValues', layerId);
			
			// Initialise empty styles structure
			var styles = {
				'Point':      { type: 'circle', layout: {}, paint: {} },
				'LineString': { type: 'line',   layout: {}, paint: {} },
				'Polygon':    { type: 'fill',   layout: {}, paint: {} }
			};
			
			// Use default styles if required
			if (useDefaultStyles) {
				styles = $.extend (true, {}, _defaultStyles);	// Clone
			}
			
			// Support for point colour directly from the API response
			if (_layerConfig[layerId].pointColourApiField) {
				styles['Point']['paint']['circle-color'] = ['get', _layerConfig[layerId].pointColourApiField];
			}
			
			// Support for line colour directly from the API response
			if (_layerConfig[layerId].lineColourApiField) {
				styles['LineString']['paint']['line-color'] = ['get', _layerConfig[layerId].lineColourApiField];
			}
			
			// Fixed line colour
			if (_layerConfig[layerId].lineColour) {
				styles['LineString']['paint']['line-color'] = _layerConfig[layerId].lineColour;
			}
			
			// Set line colour from data if required
			if (lineColourField && lineColourStops) {
				styles['LineString']['paint']['line-color'] = layerviewer.stopsExpression (lineColourField, lineColourStops.slice().reverse());	// Reverse the original definition: https://stackoverflow.com/a/30610528/180733
			}

			// Set line colour from lookups, if required
			if (lineColourField && lineColourValues) {
				styles['LineString']['paint']['line-color'] = layerviewer.valuesExpression (lineColourField, lineColourValues, 'red');
			}
			
			// Set point size if required
			if (_layerConfig[layerId].pointSize) {
				styles['Point']['paint']['circle-radius'] = _layerConfig[layerId].pointSize;
			}
			
			// Fixed line width
			if (_layerConfig[layerId].lineWidth) {
				styles['LineString']['paint']['line-width'] = _layerConfig[layerId].lineWidth;
			}
			
			// Set line width from stops, if required
			if (lineWidthField && lineWidthStops) {
				styles['LineString']['paint']['line-width'] = layerviewer.stopsExpression (lineWidthField, lineWidthStops.slice().reverse());	// Reverse the original definition: https://stackoverflow.com/a/30610528/180733
			}
			
			// Set line width from lookups, if required
			if (lineWidthField && lineWidthValues) {
				styles['LineString']['paint']['line-width'] = layerviewer.valuesExpression (lineWidthField, lineWidthValues, 5);
			}
			
			// If we have polygonColourStops
			if (polygonColourField && _layerConfig[layerId].polygonColourStops) {
				styles['Polygon']['paint']['fill-color'] = layerviewer.stopsExpression (polygonColourField, _layerConfig[layerId].polygonColourStops.slice().reverse(), true, true);	// Reverse the original definition: https://stackoverflow.com/a/30610528/180733
				styles['Polygon']['paint']['fill-outline-color'] = '#aaa';
				
			// Set polygon style from values
			} else if (polygonColourField && polygonColourValues) {
				styles['Polygon']['paint']['fill-color'] = layerviewer.valuesExpression (polygonColourField, polygonColourValues, _defaultStyles['Polygon']['paint']['fill-color']);
				
			// Set pre-defined polygon style if required: grid / fixed styles
			} else if (_layerConfig[layerId].polygonStyle) {
				styles = layerviewer.polygonStylePresets (styles, _layerConfig[layerId].polygonStyle);
			}
			
			// Polygon fill and outline
			if (_layerConfig[layerId].fillOpacity) {
				styles['Polygon']['paint']['fill-opacity'] = _layerConfig[layerId].fillOpacity;
			}
			if (_layerConfig[layerId].fillOutlineColor) {
				styles['Polygon']['paint']['fill-outline-color'] = _layerConfig[layerId].fillOutlineColor;
			}
			
			// Start from global style if supplied
			// E.g. _settings.style = {LineString: {'line-color': 'red';} } will get merged in
			if (!$.isEmptyObject (_settings.style)) {
				$.each (_settings.style, function (geometryType, style) {
					styles[geometryType]['paint'] = style;
				});
			}
			
			// Start from default layer style if supplied
			// E.g. layer.style = {LineString: {'line-color': 'red';} } will get merged in
			if (!$.isEmptyObject (_layerConfig[layerId].style)) {
				$.each (_layerConfig[layerId].style, function (geometryType, style) {
					styles[geometryType]['paint'] = style;
				});
			}
			
			// For line style, if hover is enabled, override hover style width in definition
			if (_settings.hover || _layerConfig[layerId].hover) {
				styles['LineString']['paint']['line-width'] = ['case', ['boolean', ['feature-state', 'hover'], false], 12, styles['LineString']['paint']['line-width'] ];
			}
			
			// Return the definition
			return styles;
		},
		
		
		// Function to assign preset polygon styles
		polygonStylePresets: function (styles /* current object so far, to be modified */, polygonStyle)
		{
			// Select polygon style
			switch (polygonStyle) {
				
				// Blue boxes with dashed lines, intended for data that is likely to tessellate, e.g. adjacent box grid
				case 'grid':
					styles['Polygon']['paint']['fill-color'] = ['case', ['has', 'colour'], ['get', 'colour'], /* fallback: */ '#03f'];	// See: https://github.com/mapbox/mapbox-gl-js/issues/4079#issuecomment-385196151 and https://docs.mapbox.com/mapbox-gl-js/example/data-driven-lines/
					//styles['Polygon']['paint']['fill-outline-dasharray'] = [5, 5];
					break;
					
				// Red
				case 'red':
					styles['Polygon']['paint']['fill-outline-color'] = 'darkred';
					styles['Polygon']['paint']['fill-color'] = 'red';
					break;
					
				// Green
				case 'green':
					styles['Polygon']['paint']['fill-outline-color'] = 'green';
					styles['Polygon']['paint']['fill-color'] = '#090';
					break;
					
				// Blue
				case 'blue':
					styles['Polygon']['paint']['fill-outline-color'] = 'darkblue';
					styles['Polygon']['paint']['fill-color'] = '#3388ff';
					break;
			}
			
			// Return the modified styles object
			return styles;
		},
		
		
		// Function to create popups for a layer, for rendered (i.e. non-icon) features; see: https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
		createPopups: function (layerId, layerVariantId, geometryType, popupHtmlTemplate)
		{
			// Determine whether to have popups, ending if not required
			var popups = layerviewer.glocalVariable ('popups', layerId);
			if (!popups) {return;}
			
			// Set up handlers to give a cursor pointer over each feature; see: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
			layerviewer.cursorPointerHandlers (layerVariantId);
			
			// Initialise the popup handle
			var popup = null;
			
			// Initialise the feature ID handle
			var popupFeatureId = null;
			
			// Define a popup click handler for this layer; this is registered to a property so that it can be disabled using map.off()/map.on(); see: https://stackoverflow.com/a/45665068/180733
			_popupClickHandlers[layerVariantId] = function (e) {
				var feature = e.features[0];
				
				// Remove the popup if already opened and clicked again (implied close)
				if (popupFeatureId) {
					if (popupFeatureId == feature.id) {
						popup.remove ();
						popupFeatureId = null;
						return;		// End here
					}
				}
				popupFeatureId = feature.id;
				
				// Remove any popup already existing for this layer, i.e. enforce single item only
				layerviewer.removePopups (layerId);
				
				// Set the location of the click; for a point, look up the feature's actual location
				var coordinates = e.lngLat;	// Actual lat/lon clicked on
				if (geometryType == 'Point') {
					coordinates = feature.geometry.coordinates.slice ();	// https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
				}
				
				// Workaround to fix up string "null" to null; see: https://github.com/mapbox/vector-tile-spec/issues/62
				$.each (feature.properties, function (key, value) {
					if (value === 'null') {
						feature.properties[key] = null;
					}
				});
				
				// Delete auto-colour field if enabled
				if (_layerConfig[layerId].pointColourApiField) {
					if (feature.properties.hasOwnProperty (_layerConfig[layerId].pointColourApiField)) {
						delete feature.properties[_layerConfig[layerId].pointColourApiField];
					}
				}
				
				// Delete auto-colour field if enabled
				if (_layerConfig[layerId].lineColourApiField) {
					if (feature.properties.hasOwnProperty (_layerConfig[layerId].lineColourApiField)) {
						delete feature.properties[_layerConfig[layerId].lineColourApiField];
					}
				}
				
				// Workaround to deal with nested images property; see: https://github.com/mapbox/mapbox-gl-js/issues/2434
				// The array has become serialised to a string that looks like an array; this parses out the string back to an array
				if (_layerConfig[layerId].popupImagesField) {
					var popupImagesField = _layerConfig[layerId].popupImagesField;
					feature.properties[popupImagesField] = JSON.parse (feature.properties[popupImagesField]);
				}
				
				// Create the popup
				var popupContentHtml = layerviewer.renderDetailsHtml (feature, popupHtmlTemplate, layerId);
				popup = new mapboxgl.Popup ({className: layerId})
					.setLngLat (coordinates)
					.setHTML (popupContentHtml)
					.addTo (_map);
				
				// Register the marker so it can be removed on redraw
				_popups[layerId].push (popup);
			};
			
			// Register the handler
			_map.on ('click', layerVariantId, _popupClickHandlers[layerVariantId]);
		},
		
		
		// Function to create handlers to give a cursor pointer over each feature; see: https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
		// This does not get triggered for DOM icons (see: createIconDom), which have pointer set directly on the image CSS properties
		cursorPointerHandlers: function (layerId)
		{
			// Create the handlers
			_map.on ('mousemove', layerId, function () {
				_map.getCanvas().style.cursor = 'pointer';
			});
			_map.on ('mouseleave', layerId, function() {
				_map.getCanvas().style.cursor = '';
			});
		},
		
		
		// Function to remove any existing markers for a layer; see: https://docs.mapbox.com/mapbox-gl-js/api/#marker#remove
		removeMarkers: function (layerId)
		{
			if (_markers[layerId]) {
				var totalMarkers = _markers[layerId].length;
				var i;
				for (i = 0; i < totalMarkers; i++) {
					_markers[layerId][i].remove ();		// Remove the actual item, not a copy
				}
			}
			_markers[layerId] = [];
		},
		
		
		// Function to remove any existing popups for a layer
		removePopups: function (layerId)
		{
			if (_popups[layerId]) {
				var totalPopups = _popups[layerId].length;
				var i;
				for (i = 0; i < totalPopups; i++) {
					_popups[layerId][i].remove ();		// Remove the actual item, not a copy
				}
			}
			_popups[layerId] = [];
		},
		
		
		// Function to render a stops expression; see: https://github.com/mapbox/mapbox-gl-js/commit/9ac35b1059ed5f9f7798c37700b52259ce9a815d#diff-bde08934db09c688e8b1d2c0a4d2bce0
		stopsExpression: function (property, stops, supportNullTransparent, stepMode)
		{
			// Start the expression
			var expression = [
				'interpolate',
				['linear'],
				['get', property]
			];
			
			// In step mode, use 'step'; see: https://stackoverflow.com/a/53506912
			if (stepMode) {
				expression = [
					'step',
					['get', property],
					'transparent'
				];
			}
			
			// Loop through each pair of the stops
			$.each (stops, function (key, value) {
				expression.push (value[0], value[1]);
			});
			
			// If support is enabled for a value of null being transparent, wrap the expression with a case; see: https://dev.to/laney/mapbox-how-to-conditionally-style-features-based-on-covid-19-data-h78
			if (supportNullTransparent) {
				expression = [
					'case',
						['==', ['get', property], null],
							'transparent',
						expression
				];
			}
			
			// Return the completed expression
			return expression;
		},
		
		
		// Function to render a case expression; see e.g. https://stackoverflow.com/a/49611427 and https://docs.mapbox.com/mapbox-gl-js/example/cluster-html/
		valuesExpression: function (property, values, fallback)
		{
			// Start the expression
			var expression = [];
			expression.push ('case');
			
			// Loop through each value
			$.each (values, function (key, value) {
				expression.push (['==', ['get', property], key]);
				expression.push (value);
			});
			
			// Add the fallback
			expression.push (fallback);
			
			// Return the completed expression
			return expression;
		},
		
		
		// Function to define heatmap styles
		heatmapStyles: function ()
		{
			// Define and return the styles
			return {
				
				// Increase weight as diameter breast height increases
				'heatmap-weight': {
					property: 'dbh',
					type: 'exponential',
					stops: [
						[1, 0],
						[62, 1]
					]
				},
				
				/*
				// Increase intensity as zoom level increases
				'heatmap-intensity': {
					stops: [
						[11, 1],
						[15, 3]
					]
				},
				*/
				
				// Assign color values be applied to points depending on their density
				'heatmap-color': [
					'interpolate',
					['linear'],
					['heatmap-density'],
					0, 'rgba(236,222,239,0)',
					0.1, 'blue',
					0.2, 'cyan',
					0.3, 'lime',
					0.6, 'yellow',
					1, 'red'
				],
				
				// Increase radius as zoom increases
				'heatmap-radius': {
					stops: [
						[11, 15],
						[15, 18]
					]
				}
			};
		},
		
		
		// Function to obtain a value from a sublayerable configuration parameter
		sublayerableConfig: function (layerConfigField, layerId)
		{
			// End, returning false, if no such config for this field
			if (!_layerConfig[layerId][layerConfigField]) {return false;}
			
			// For clarity, create a local variable for the config definition for the current config field of the current layer
			var configDefinition = _layerConfig[layerId][layerConfigField];
			
			// If sublayering not enabled, i.e. is not dependent on a form value within the layer, pass through unchanged
			if (!_layerConfig[layerId].sublayerParameter) {
				return configDefinition;
			}
			
			// If no sublayer values set in the form for this layer, return false
			if (!_sublayerValues[layerId]) {		// I.e. if no form widget or if form widget value is empty, thus `_sublayerValues[layerId] = false;` will have been set
				return false;
			}
			
			// If a wildcard '*' is used, dynamically determine the field, i.e. map directly
			// The form value then maps directly to the chosen field; this is useful for a styling dropdown where each field has its own values, e.g. form value 'foo' sets the parameter to be 'foo', hence looking at field 'foo' in data
			if (_layerConfig[layerId][layerConfigField] == '*') {
				var formParameter = _layerConfig[layerId].sublayerParameter;
				return _parameters[layerId][formParameter];
			}
			
			// Pre-process the definition if multiple value keys (string, separated by comma) are present, splitting out; e.g. 'quietest,balanced,fastest' becomes three separate keys, each having the same value
			configDefinition = layerviewer.expandListKeys (configDefinition);
			
			// Now that we have confirmed that sublayer parameterisation is enabled, i.e. layer style is dependent on a form value, obtain the layer value, then look up the config definition value
			var sublayerValue = _sublayerValues[layerId];
			var configSubdefinition = configDefinition[sublayerValue];
			
			// Return the config sub-definition
			return configSubdefinition;
		},
		
		
		// Function to expand (split out) keys containing a list, e.g. {'a' => 'foo', 'b,c' => 'bar'} becomes {'a' => 'foo', 'b' => 'bar', 'c' => 'bar'}
		expandListKeys: function (configDefinition)
		{
			// Split where required
			$.each (configDefinition, function (key, value) {
				if (key.indexOf (',') !== -1) {		// I.e. contains comma
					var newKeys = key.split (',');
					$.each (newKeys, function (index, newKey) {
						configDefinition[newKey] = value;
					});
					delete (configDefinition[key]);
				}
			});
			
			// Return the definition
			return configDefinition;
		},
		
		
		// Function to remove a layer
		removeLayer: function (layerId)
		{
			// Remove the layerId from the _requestCache object
			// This is performing a similar task to the requestSerialised block in getData
			if (_requestCache.hasOwnProperty (layerId)) {
				delete _requestCache[layerId];
			}
			
			// Cache this deletion
			layerviewer.setStateCookie ();

			// If the layer is a native vector layer rather than an API call, remove it and end
			if (_layerConfig[layerId].vector) {
				layerviewer.removeVectorLayer (layerId);
				return;
			}
			
			// If the layer is a tile layer rather than an API call, remove it and end
			if (_layerConfig[layerId].tileLayer) {
				if (_tileOverlayLayer) {
					layerviewer.removeTileOverlayLayer ();
				}
				
				// No further action, e.g. API calls
				return;
			}
			
			// Remove any existing markers and popups, neither of which are technically bound to a feature
			layerviewer.removePopups (layerId);
			layerviewer.removeMarkers (layerId);
			
			// Deregister popup and locate feedback handler for a layer
			layerviewer.removePopupFeedbackHandler (layerId);
			layerviewer.removeLocateFeedbackHandler (layerId);
			
			// Deregister handler to refresh data on map move; note that some native dormancy handling was added in: https://github.com/mapbox/mapbox-gl-js/issues/5145
			if (!_layerConfig[layerId].static) {
				_map.off ('moveend', _dataRefreshHandlers[layerId]);
				delete _dataRefreshHandlers[layerId];
			}
			
			// Remove the layer(s), checking first to ensure each exists
			var geometryTypes = ['point', 'linestring', 'polygon', 'heatmap'];
			$.each (geometryTypes, function (index, geometryType) {
				var geometryTypeId = layerId + '_' + geometryType;
				if (_map.getLayer (geometryTypeId)) {
					_map.removeLayer (geometryTypeId);
				}
			});
			
			// Remove the source
			// The 'if' check should not be necessary, but occasionally otherwise this will generate a 'There is no source with this ID' error, presumably due to a timing issue. See also: https://github.com/mapbox/mapbox-gl-js/issues/4466#issuecomment-288177042
			if (_map.getSource (layerId)) {
				_map.removeSource (layerId);
			}
			
			// Remove the total count
			$(_settings.selector + ' li.' + layerId + ' p.total').html('');
			
			// Remove/reset the export link, and its count
			if ($('#sections #' + layerId + ' div.export p a').length) {	// i.e. currently linked
				$('#sections #' + layerId + ' div.export p a').contents().unwrap();
				$('#sections #' + layerId + ' div.export p').removeClass('enabled');
				$('#sections #' + layerId + ' div.export span').remove();
			}
		},
		
		
		// Drawing functionality, wrapping mapbox-gl-draw
		drawing: function (targetField, fragmentOnly, defaultValueString, geometryType)
		{
			// Define the structure
			_drawing = {
				happeningInternal: false,
				happeningListener: function (val) { },
				set happening (val) {
					this.happeningInternal = val;
					this.happeningListener (val);
				},
				get happening () {
					return this.happeningInternal;
				},
				registerListener: function (listener) {
					this.happeningListener = listener;
				}
			};
			
			// Disable drawing on mobile, as it interferes with popups, pending workaround for https://github.com/mapbox/mapbox-gl-draw/issues/617
			if (_isTouchDevice) {return;}
			
			// Define drawing styles; based on https://github.com/NYCPlanning/labs-factfinder/blob/a617955c652b05dd81308e8d4158cfd76c01d1e2/app/layers/draw-styles.js
			var styles = [
				// Polygon outline stroke
				{
					id: 'gl-draw-polygon-stroke-active',
					type: 'line',
					layout: {
						'line-cap': 'round',
						'line-join': 'round'
					},
					paint: {
						'line-color': '#D96B27',
						'line-dasharray': [0.2, 2],
						'line-width': 4
					}
				},
				// Vertex point halos
				{
					id: 'gl-draw-polygon-and-line-vertex-halo-active',
					type: 'circle',
					filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
					paint: {
						'circle-radius': 7,
						'circle-color': '#FFF'
					}
				},
				// Vertex points
				{
					id: 'gl-draw-polygon-and-line-vertex-active',
					type: 'circle',
					filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
					paint: {
						'circle-radius': 6,
						'circle-color': '#D96B27'
					}
				}
			];
			
			// For Polygon type, also add fill
			if (geometryType == 'Polygon') {
				styles.push ({
					id: 'gl-draw-polygon-fill',
					type: 'fill',
					paint: {
						'fill-color': '#D20C0C',
						'fill-outline-color': '#D20C0C',
						'fill-opacity': 0.1
					}
				});
			}
			
			// See example at: https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/
			// See also support for circle drawing (potential future feature) at: https://medium.com/nyc-planning-digital/building-a-custom-draw-mode-for-mapbox-gl-draw-1dab71d143ee
			_draw = new MapboxDraw ({
				displayControlsDefault: false,
				styles: styles
			});
			_map.addControl (_draw);
			
			// Register handlers for data creation/update
			_map.on ('draw.create', updateArea);
			_map.on ('draw.update', updateArea);
			
			// Add default value if supplied; see: https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#addgeojson-object--arraystring
			if (defaultValueString) {	// E.g. '[[-0.106355,51.510595],[-0.106709,51.51082],[-0.105666,51.511347],[-0.106355,51.510595]]'
				
				// Convert the string to an array of lat,lon values
				var featurePoints = JSON.parse (defaultValueString);
				
				// Construct the feature
				var defaultFeature = {type: geometryType, coordinates: [featurePoints]};
				
				// Add the polygon
				_draw.add (defaultFeature);
			}
			
			// Enable polygon/line drawing when the button is clicked
			$('body').on ('click', '.draw.area, .draw.line', function () {
				// Clear any existing features - allow only a single feature at present
				// #!# Remove this when the server-side allows multiple polygons
				_draw.deleteAll ();
				
				// Move the drawing layer (actually sublayers) to the top
				layerviewer.layersOrderResetTop ();
				
				// Set state
				_drawing.happening = true;
				layerviewer.disablePopupHandlers ();

				// Start drawing
				var drawMode = (geometryType == 'Polygon' ? 'draw_polygon' : 'draw_line_string');	// See: https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#modes
				_draw.changeMode (drawMode);
			});

			// Enable point drawing when the button is clicked
			$('body').on('click', '.draw.point', function () {
				// Clear any existing features - allow only a single feature at present
				_draw.deleteAll ();

				// Set state
				_drawing.happening = true;
				layerviewer.disablePopupHandlers ();

				// Start drawing
				_draw.changeMode ('draw_point');
			});

			
			// Handle created features
			function updateArea (e) {
				
				// Capture the data, which will be GeoJSON
				var geojsonValue = _draw.getAll ();
				
				// Reduce coordinate accuracy to 6dp (c. 1m) to avoid over-long URLs
				var coordinates;
				var i;
				switch (geometryType) {
					case 'Polygon':
						coordinates = geojsonValue.features[0].geometry.coordinates[0];		// Single ring
						for (i = 0; i < coordinates.length; i++) {
							coordinates[i] = layerviewer.reduceCoordinateAccuracy (coordinates[i]);
						}
						geojsonValue.features[0].geometry.coordinates[0] = coordinates;
						break;
					case 'LineString':
						coordinates = geojsonValue.features[0].geometry.coordinates;
						for (i = 0; i < coordinates.length; i++) {
							coordinates[i] = layerviewer.reduceCoordinateAccuracy (coordinates[i]);
						}
						geojsonValue.features[0].geometry.coordinates = coordinates;
						break;
				}
				
				// If required, send only the coordinates fragment
				if (fragmentOnly) {
					geojsonValue = coordinates;
				}
				
				// Send to receiving input form
				$(targetField).val (JSON.stringify (geojsonValue));
				
				// Trigger jQuery change event, so that .change() behaves as expected for the hidden field; see: https://stackoverflow.com/a/8965804
				// #!# Note that this fires twice for some reason - see notes to the answer in the above URL
				$(targetField).trigger ('change');
				
				// Set state
				_drawing.happening = false;
				layerviewer.reenablePopupHandlers ();
			}
			
			// Cancel button clears drawn feature and clears the form value
			$('.edit-clear').click (function () {
				if (_settings.stopDrawingWhenClearingLine) {
					_draw.trash ();
				} else {
					_draw.deleteAll ();
					_draw.changeMode ('draw_line_string');
				}

				$(targetField).val ('');
			
				// Trigger jQuery change event, so that .change() behaves as expected for the hidden field; see: https://stackoverflow.com/a/8965804
				$(targetField).trigger ('change');
				
				// If drawing is in progress and the clear button is clicked without the drawing being auto-closed, end it; if drawing already finished automatically, do not re-reenable popup handlers as that will newly create an additional set
				if (_settings.stopDrawingWhenClearingLine) {
					if (_drawing.happening) {
						_drawing.happening = false;
						layerviewer.reenablePopupHandlers ();
					}
				}
			});
			
			// Undo button; not yet implemented: https://github.com/mapbox/mapbox-gl-draw/issues/791
			/*
			$('.edit-undo').click(function() {
				//
			});
			*/
		},
		
		
		// Function to move specified layers and the drawing layer (actually sublayers) to the top
		layersOrderResetTop: function ()
		{
			//console.log (_map.getStyle().layers);
			
			// If required, ensure place names are on top
			if (_settings.placenamesOnTop) {
				$.each (_settings.tileUrls, function (tileLayerId, tileLayer) {
					if (tileLayer.hasOwnProperty ('placenamesLayers')) {
						$.each (tileLayer.placenamesLayers, function (index, layerId) {
							if (_map.getLayer (layerId)) {
								_map.moveLayer (layerId);
							}
						});
					}
				});
			}
			
			// Ensure any additional topmost layers are moved to the front
			$.each (_settings.forceTopLayers, function (index, layerId) {
				if (_map.getLayer (layerId)) {
					_map.moveLayer (layerId);
				}
			});
			
			// Add each gl-draw-* layer to the top, if present; see: https://docs.mapbox.com/mapbox-gl-js/api/map/#map#movelayer
			$.each (_map.getStyle().layers, function (index, layer) {
				if (layer.id.startsWith ('gl-draw-')) {
					_map.moveLayer (layer.id);		// E.g. gl-draw-polygon-stroke-active.cold, gl-draw-polygon-and-line-vertex-halo-active.cold, etc.
				}
			});
		},


		// Finish the drawing at a given point
		finishDrawing: function ()
		{
			// Reenable popup handlers
			_drawing.happening = false;
			layerviewer.reenablePopupHandlers ();

			// Stop drawing mode
			_draw.changeMode ('simple_select');
		},
		
		
		// Disable click handler for underlying layers
		disablePopupHandlers: function ()
		{
			// Close any popups currently open
			$.each (_layers, function (layerId, popups) {		// #!# For some reason, iterating through _popups doesn't work, so _layers used for now
				layerviewer.removePopups (layerId);
			});
			
			// Disable the popup click handler for each variant layer
			var layerVariantId;
			$.each (_layers, function (layerId, layerEnabled) {
				
				// Direct layer IDs, e.g. vector layers, e.g. 'foo'
				if (_popupClickHandlers.hasOwnProperty (layerId)) {
					_map.off ('click', layerId, _popupClickHandlers[layerId]);
				}
				
				// Variant layers, e.g. GeoJSON layers, e.g. 'foo_point', 'foo_linestring', 'foo_polygon'
				$.each (_opengisTypes, function (index, geometryType) {
					layerVariantId = layerviewer.layerVariantId (layerId, geometryType);
					if (_popupClickHandlers.hasOwnProperty (layerVariantId)) {
						_map.off ('click', layerVariantId, _popupClickHandlers[layerVariantId]);
					}
				});
			});
			
			// #!# Currently there is no support for popups added using .setPopup in drawManualDomIcons ()
		},
		
		
		// Re-enable click handler for underlying layers
		reenablePopupHandlers: function ()
		{
			// Short delay as the existing popup click handler will trigger first
			setTimeout (function () {
				
				// Re-enable the popup click handler for each variant layer
				var layerVariantId;
				$.each (_layers, function (layerId, layerEnabled) {
					
					// Direct layer IDs, e.g. vector layers, e.g. 'foo'
					if (_popupClickHandlers.hasOwnProperty (layerId)) {
						_map.on ('click', layerId, _popupClickHandlers[layerId]);
					}
					
					// Variant layers, e.g. GeoJSON layers, e.g. 'foo_point', 'foo_linestring', 'foo_polygon'
					$.each (_opengisTypes, function (index, geometryType) {
						layerVariantId = layerviewer.layerVariantId (layerId, geometryType);
						if (_popupClickHandlers.hasOwnProperty (layerVariantId)) {
							_map.on ('click', layerVariantId, _popupClickHandlers[layerVariantId]);
						}
					});
				});
				
				// #!# Currently there is no support for popups added using .setPopup in drawManualDomIcons ()
				
			}, 200);
		},
		
		
		// Region switcher
		regionSwitcher: function ()
		{
			// End if not enabled
			if (!_settings.regionsFile || !_settings.regionsField) {return;}
			
			// Load the GeoJSON file
			$.ajax ({
				url: _settings.regionsFile,
				dataType: (layerviewer.browserSupportsCors () ? 'json' : 'jsonp'),		// Fall back to JSON-P for IE9
				error: function (jqXHR, error, exception) {
					vex.dialog.alert ('Error: could not load regions list file.');
				},
				success: function (data, textStatus, jqXHR) {
					
					// Parse the areas to centre-points, and extract the names
					var regions = layerviewer.regionsToList (data);
					
					// Create a droplist
					var html = '<select>';
					html += '<option value="">' + _settings.regionSwitcherNullText + ':</option>';
					$.each (regions, function (index, region) {
						html += '<option value="' + layerviewer.htmlspecialchars (region.key) + '">' + layerviewer.htmlspecialchars (region.name) + '</option>';
					});
					html += '</select>';
					
					// Add to the map
					layerviewer.createControl ('regionswitcher', _settings.regionSwitcherPosition, 'info');
					$('#regionswitcher').html (html);
					
					// Create a lookup of region key to bounds
					$.each (regions, function (index, region) {
						_regionBounds[region.key] = region.bounds;
					});
					
					// Add a handler for changes to the select box
					$('#regionswitcher select').change (function () {
						if (this.value) {
							
							// Fit bounds
							_selectedRegion = this.value;
							var options = {};
							if (_settings.regionSwitcherMaxZoom) {
								options.maxZoom = _settings.regionSwitcherMaxZoom;
							}
							
							_map.fitBounds (_regionBounds[_selectedRegion], options);
							
							// Store selected region as a cookie
							Cookies.set ('selectedRegion', _selectedRegion, {expires: 7});
							
							// Update the URL if required
							if (_settings.regionSwitcherPermalinks) {
								layerviewer.updateUrl ();
							}
							
							// Call any callback
							if (_settings.regionSwitcherCallback) {
								_settings.regionSwitcherCallback (_selectedRegion);
							}
						}
						
						// #!# IE bug workaround: need to move the focus to something else, otherwise change works first time but not after that
						if (navigator.appVersion.indexOf('Trident/') !== -1) {
							$('#regionswitcher select').focus();
						}
					});
					
					// Start default region determination
					var defaultRegion = false;
					
					// If we have a default region stored in the settings, set it as the default
					if (_settings.regionSwitcherDefaultRegion) {
						defaultRegion = _settings.regionSwitcherDefaultRegion;
					}
					
					// If we have a cookie saved with a region, set it as the default
					var regionKeys = Object.keys (_regionBounds);
					var selectedRegion = Cookies.get ('selectedRegion');
					if (regionKeys.includes (selectedRegion)) {
						defaultRegion = selectedRegion;
					}
					
					// If region switcher permalinks have been enabled, and a region is specified, and it exists, set it as the default
					if (_regionSwitcherDefaultRegionFromUrl) {
						if (regionKeys.includes (_regionSwitcherDefaultRegionFromUrl)) {
							defaultRegion = _regionSwitcherDefaultRegionFromUrl;
						}
					}
					
					// If a default region has now been set, change the region selector programmatically
					if (defaultRegion) {
						_selectedRegion = defaultRegion;
						$('#regionswitcher select').val (defaultRegion);
						$('#regionswitcher select').trigger ('change');
					}
				}
			});
		},
		
		
		/* private */ regionsToList: function (data)
		{
			// Start an ordered array of regions
			var regions = [];
			
			// Ensure basic GeoJSON structure
			if (!data.type) {return regions;}
			if (data.type != 'FeatureCollection') {return regions;}
			if (!data.features) {return regions;}
			
			// Parse each feature for key, name and location
			var key;
			var name;
			var bounds;
			$.each (data.features, function (index, feature) {
				
				// Get the key, or skip if not present in this feature
				if (!feature.properties[_settings.regionsField]) {return false;}
				key = feature.properties[_settings.regionsField];
				
				// Get the name
				var name = (_settings.regionsNameField ? feature.properties[_settings.regionsNameField] : layerviewer.ucfirst (key));
				
				// Get location; see: https://github.com/mapbox/geojson-extent
				bounds = geojsonExtent (feature);
				
				// Register region
				regions.push ({
					key: key,
					name: name,
					bounds: bounds
				});
			});
			
			// Reorder by name
			var sortBy = 'name';
			regions.sort (function (a, b) {
				return a[sortBy].localeCompare (b[sortBy]);
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
		
		
		// Function to convert newlines to linebreak
		nl2br: function (string)
		{
			if (typeof string !== 'string') {return string;}
			return string.replace (/\n/g, '<br />');
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
			$('.wizard.feedback .action.forward').click (function () {
				// Feedback URL; re-use of settings values is supported, represented as placeholders {%apiBaseUrl}, {%apiKey}
				var feedbackApiUrl = layerviewer.settingsPlaceholderSubstitution (_settings.feedbackApiUrl, ['apiBaseUrl', 'apiKey']);
				
				// Locate the form
				var form = $('.feedback form');

				// Send the feedback via AJAX
				$.ajax({
					url: feedbackApiUrl,
					type: form.attr('method'),
					data: form.serialize()
				}).done (function (result) {
					// Detect API error
					if ('error' in result) {
						$('.feedback-submit.error p').text (result.error);
						cyclestreetsui.switchPanel ('.panel', '.feedback-submit.error');
					
					// Normal result; NB result.id is the feedback number
					} else {
						cyclestreetsui.switchPanel ('.panel', '.feedback-submit.submitted');
						$('.feedback-submit.submitted p').text ('Your feedback has been submitted as number ' + result.id + '.');
					}
					
				}).fail (function (failure) {
					if (failure.responseJSON.error) {
						$('.feedback-submit.error p').text (failure.responseJSON.error);
					}
					cyclestreetsui.switchPanel ('.panel', '.feedback-submit.error');
				});
			});
		},
		
		
		// Embed dialog box handler
		embedHandler: function ()
		{
			// Add a click handler for the embed link
			$('a.embed').click (function (e) {
				
				// Construct the embed URL
				var url  = window.location.href;
				url = url.replace ('/#', '/embed/#');
				url += '/' + _currentBackgroundMapStyleId;
				
				// Compile the iframe code
				var iframeHtml = '<iframe src="' + url + '" width="100%" height="650" title="CycleStreets Bikedata map" frameborder="0"></iframe>';
				
				// Compile the HTML
				var html  = '<div id="embedbox">';
				html += '<h2>Embed this map in your website</h2>';
				html += '<p>To use this on your website, add the following code to any page:</p>';
				html += '<p><tt>' + layerviewer.htmlspecialchars (iframeHtml) + '</tt></p>';
				html += '<p>The currently-enabled layers, map position and map style are all captured in this link.</p>';
				html += '</div>';
				
				// Create a dialog
				vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain'});
				
				// Prevent normal submit
				event.preventDefault ();
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
		},
		
		
		// Function to provide mini-maps, e.g. as layer toggle infographic buttons
		/* public */ populateMiniMaps: function (miniMapsLayers, selectedRegion)
		{
			// Create mini maps for each layer
			var id;
			var url;
			var defaultType;
			var regionWsen = _regionBounds[selectedRegion];
			var regionCentre = [ (regionWsen[1] + regionWsen[3])/2, (regionWsen[0] + regionWsen[2])/2 ];	// lat,lon centre
			$.each (miniMapsLayers, function (index, layerId) {
				id = 'map_' + layerId;
				url = _layerConfig[layerId].apiCall;
				url = url.replace ('{site_name}', selectedRegion);
				if (url.indexOf ('{%type}') !== -1) {
					defaultType = $('#data .selector li.' + layerId + ' select option[selected="selected"]')[0].value;
					url = url.replace ('{%type}', defaultType);
				}
				layerviewer.miniMap (id, url, regionCentre, layerId);
			});
		},
		
		
		// Function to create a mini-map, using Leaflet.js (which is lightweight and will load quickly)
		miniMap: function (id, geojsonUrl, regionCentre, layerId)
		{
			// Initialise map if not already present
			if (!_miniMaps[id]) {
				
				// Define URL for raster basemap; available styles include: streets-v11, dark-v10
				var mapboxUrl = 'https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/256/{z}/{x}/{y}?access_token=' + _settings.mapboxApiKey;
				
				// Create the map
				_miniMaps[id] = L.map (id, {attributionControl: false, zoomControl: false}).setView (regionCentre, 9);
				L.tileLayer (mapboxUrl, {
					tileSize: 256,
					maxZoom: 20
				}).addTo (_miniMaps[id] );
				
				// Disable interaction; see: https://gis.stackexchange.com/a/201470/58752
				_miniMaps[id]._handlers.forEach (function (handlerType) {
					handlerType.disable ();
				});
				
			// Otherwise move the map location and clear any layers
			} else {
				_miniMaps[id].setView (regionCentre, 10);
				_miniMaps[id].removeLayer (_miniMapLayers[id]);
			}
			
			// Define the styling/behaviour for the GeoJSON layer
			var stylingBehaviour = {
				style: function (feature) {
					
					// Default
					var style = {
						color: '#888',
						weight: 2
					};
					
					// Dynamic styling based on data, if enabled - polygons
					if (_layerConfig[layerId].polygonColourField && _layerConfig[layerId].polygonColourStops) {
						style.fillColor = layerviewer.lookupStyleValue (feature.properties[_layerConfig[layerId].polygonColourField], _layerConfig[layerId].polygonColourStops);
						style.weight = 0.5;
					}
					if (_layerConfig[layerId].hasOwnProperty ('fillOpacity')) {
						style.fillOpacity = _layerConfig[layerId].fillOpacity;
					}
					
					// Dynamic styling based on data, if enabled - lines
					if (_layerConfig[layerId].lineColourField && _layerConfig[layerId].lineColourStops) {
						style.color = layerviewer.lookupStyleValue (feature.properties[_layerConfig[layerId].lineColourField], _layerConfig[layerId].lineColourStops);
					}
					if (_layerConfig[layerId].lineWidthField && _layerConfig[layerId].lineWidthStops) {
						style.weight = layerviewer.lookupStyleValue (feature.properties[_layerConfig[layerId].lineWidthField], _layerConfig[layerId].lineWidthStops);
						style.weight = style.weight / 5;	// Maps are very small so avoid thick lines
					}
					
					// Return the resulting style
					return style;
				}
			};
			
			// Add the GeoJSON layer
			_miniMapLayers[id] = L.geoJson.ajax (geojsonUrl, stylingBehaviour);
			_miniMapLayers[id].addTo (_miniMaps[id]);
		},
		
		
		// Assign style from lookup table
		lookupStyleValue: function (value, lookupTable)
		{
			// If the value is null, set to be transparent
			if (value === null) {
				return 'transparent';
			}
			
			// Loop through each style stop until found
			var i;
			var styleStop;
			for (i = 0; i < lookupTable.length; i++) {
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
		
		
		// Helper function to get the centre-point of a geometry
		getCentre: function (geometry)
		{
			// Determine the centre point
			var centre = {};
			var longitudes = [];
			var latitudes = [];
			switch (geometry.type) {
				
				case 'Point':
					centre = {
						lat: geometry.coordinates[1],
						lon: geometry.coordinates[0]
					};
					break;
					
				case 'LineString':
					$.each (geometry.coordinates, function (index, lonLat) {
						longitudes.push (lonLat[0]);
						latitudes.push (lonLat[1]);
					});
					centre = {
						lat: ((Math.max.apply (null, latitudes) + Math.min.apply (null, latitudes)) / 2),
						lon: ((Math.max.apply (null, longitudes) + Math.min.apply (null, longitudes)) / 2)
					};
					break;
					
				case 'MultiLineString':
				case 'Polygon':
					$.each (geometry.coordinates, function (index, line) {
						$.each (line, function (index, lonLat) {
							longitudes.push (lonLat[0]);
							latitudes.push (lonLat[1]);
						});
					});
					centre = {
						lat: ((Math.max.apply (null, latitudes) + Math.min.apply (null, latitudes)) / 2),
						lon: ((Math.max.apply (null, longitudes) + Math.min.apply (null, longitudes)) / 2)
					};
					break;
					
				case 'MultiPolygon':
					$.each (geometry.coordinates, function (index, polygon) {
						$.each (polygon, function (index, line) {
							$.each (line, function (index, lonLat) {
								longitudes.push (lonLat[0]);
								latitudes.push (lonLat[1]);
							});
						});
					});
					centre = {
						lat: ((Math.max.apply (null, latitudes) + Math.min.apply (null, latitudes)) / 2),
						lon: ((Math.max.apply (null, longitudes) + Math.min.apply (null, longitudes)) / 2)
					};
					break;
					
				case 'GeometryCollection':
					var centre;
					$.each (geometry.geometries, function (index, geometryItem) {
						centre = streetfocus.getCentre (geometryItem);		// Iterate
						longitudes.push (centre.lon);
						latitudes.push (centre.lat);
					});
					centre = {
						lat: ((Math.max.apply (null, latitudes) + Math.min.apply (null, latitudes)) / 2),
						lon: ((Math.max.apply (null, longitudes) + Math.min.apply (null, longitudes)) / 2)
					};
					break;
					
				default:
					console.log ('Unsupported geometry type: ' + geometry.type, geometry);
			}
			
			// Return the centre
			return centre;
		},
		
		
		// Function to create a popup feedback layer
		addPopupFeedbackButton: function (layerId, feature)
		{
			// End if not enabled for this layer
			if (!_layerConfig[layerId].popupFeedbackButton) {return '';}
			
			// Assemble the feature to an encoded string that can safely be passed into the data properties
			var featureBase64 = window.btoa (JSON.stringify (feature));
			
			// Assemble the HTML
			var html = '<p class="feedbackbutton">';
			html += '<a href="#" data-feature="' + featureBase64 + '" title="Give feedback">';
			html += _layerConfig[layerId].popupFeedbackButton;
			html += '</a>';
			html += '</p>';
			
			// Return the HTML
			return html;
		},
		
		
		// Function to create a popup feedback handler
		addPopupFeedbackHandler: function (layerId)
		{
			// End if not enabled for this layer
			if (!_layerConfig[layerId].popupFeedbackButton) {return;}
			
			// Add handler
			$('body').on ('click', '.mapboxgl-popup.' + layerId + ' p.feedbackbutton', {layerId: layerId}, function (event) {
				
				// Create an overlay canvas
				var overlayHtml = '<div id="feedbackoverlay"><a href="#" class="closebutton">x</a><div id="popupfeedbackoverlaycontent" class="overlaycontent"></div></div>';
				$(overlayHtml).hide ().appendTo ( $(this).closest ('.mapboxgl-popup-content') ).fadeIn (500, function () {
					
					// Get the layer
					var layerId = event.data.layerId;
					
					// Add the HTML contents to the overlay
					var popupFeedbackOverlayContent = $('#popupfeedback' + layerId).children ().clone ();	// .children() ensures the container itself isn't copied
					popupFeedbackOverlayContent.appendTo ('#popupfeedbackoverlaycontent');
					
					// Retrieve the feature properties
					var featureBase64 = event.target.dataset.feature;
					var feature = JSON.parse (window.atob (featureBase64));
					
					// Define a function to resolve a path; see: https://stackoverflow.com/a/22129960/180733
					var resolve = function (obj, path) {
						var separator = '.';
						var properties = (Array.isArray (path) ? path : path.split (separator));
						return properties.reduce ((prev, curr) => prev && prev[curr], obj);
					}
					
					// Populate any hidden fields from the feature
					var path;
					var value;
					$('#popupfeedbackoverlaycontent input[type="hidden"]').each (function () {
						if ($(this)[0].dataset.hasOwnProperty ('value')) {		// i.e. data-value is defined
							path = $(this)[0].dataset.value;
							value = resolve (feature, path);	// E.g. data-value="properties.foo" will look up that path in the feature
							$(this).val (value);
						}
					});
					
					// Add form processor
					layerviewer.processPopupFeedbackForm ('#popupfeedbackoverlaycontent');
				});
			});
			
			// Remove the overlay canvas on close
			$('body').on ('click', '#feedbackoverlay .closebutton', function (e) {
				$('#feedbackoverlay').fadeOut (500, function () { $(this).remove(); });
			});
		},
		
		
		// Function to process a popup feedback form
		processPopupFeedbackForm: function (containerDiv)
		{
			// Move focus to first input
			$(containerDiv + ' input, ' + containerDiv + ' textarea, ' + containerDiv + ' select').first ().focus ();
			
			// Capture the form submit, so that it goes via AJAX instead
			$(containerDiv + ' form').submit (function () {
				var form = $(this);
				var resultHtml;
				var errorHtml = '<p class="error">Sorry, an error occured while trying to save your feedback. Please try again later.</p>';
				$.ajax ({
					type: form.attr ('method'),
					url: layerviewer.settingsPlaceholderSubstitution (form.attr ('action'), ['apiBaseUrl', 'apiKey']),
					data: form.serialize (),
					success: function (data) {
						if (data.id) {
							resultHtml = '<p class="success">&#10003; Thank you - we will review your feedback shortly.</p>';
						}
						if (data.error) {
							resultHtml = errorHtml;
						}
						$(containerDiv).html (resultHtml);
					},
					error: function (jqXHR, textStatus, errorThrown) {
						resultHtml = errorHtml;
						$(containerDiv).html (resultHtml);
					}
				});
				return false;	// Prevent submit
			});
		},
		
		
		// Function to remove a popup feedback handler
		removePopupFeedbackHandler: function (layerId)
		{
			// End if not enabled for this layer
			if (!_layerConfig[layerId].popupFeedbackButton) {return;}
			
			// Remove the handler, with the path exactly matching the onClick handler above
			$('body').off ('click', '.mapboxgl-popup.' + layerId + ' p.feedbackbutton');
		},
		
		
		// Function to create a locate (click on map) feedback handler
		addLocateFeedbackHandler: function (layerId)
		{
			// End if not enabled for this layer
			if (!_layerConfig[layerId].popupFeedbackButton) {return;}
			
			// Create a marker, which will be a singleton, as it is defined as a single object
			_locateHandlerMarker = new mapboxgl.Marker ({
				draggable: true,
				color: '#603'
			});
			
			// Create popup, which will be retained upon drag or new re-click
			var overlayHtml = '<div id="locatefeedbackoverlaycontent" class="overlaycontent"></div>';
			_locateHandlerMarker.setPopup (new mapboxgl.Popup ().setHTML (overlayHtml));
			
			// Define a function set the lat/lon values in the form fields
			var setFormLocation = function (lngLat) {
				$('#locatefeedbackoverlaycontent form input[name="longitude"]').val (lngLat.lng);
				$('#locatefeedbackoverlaycontent form input[name="latitude"]').val (lngLat.lat);
			};
			
			// Define handler function
			_locateHandlerFunction = function (e) {
				
				// Add the marker to the map, or relocate if it already exists
				_locateHandlerMarker.setLngLat (e.lngLat)
					.addTo (_map)
					.togglePopup ();
				
				// Add the HTML contents to the overlay, if not already present
				if (!$('#locatefeedbackoverlaycontent form').length) {
					var locateFeedbackOverlayContent = $('#locatefeedback' + layerId).children ().clone ();	// .children() ensures the container itself isn't copied
					$('#locatefeedbackoverlaycontent').html (locateFeedbackOverlayContent);		// .html() rather than .appendTo() to avoid additional
				}
				
				// Set the lat/lon values
				setFormLocation (e.lngLat);
				
				// Add form processor
				layerviewer.processPopupFeedbackForm ('#locatefeedbackoverlaycontent');
			};
			
			// Add handler
			_map.on ('contextmenu', _locateHandlerFunction);
			
			// Update the form location values if moved
			_locateHandlerMarker.on ('dragend', function () {
				var lngLat = _locateHandlerMarker.getLngLat ();
				setFormLocation (lngLat);
			});
		},
		
		
		// Function to remove a popup feedback handler
		removeLocateFeedbackHandler: function (layerId)
		{
			// End if not enabled for this layer
			if (!_layerConfig[layerId].popupFeedbackButton) {return;}
			
			// Remove the marker
			_locateHandlerMarker.remove ();
			
			// Remove the handler
			_map.off ('contextmenu', _locateHandlerFunction);
		},
		
		
		// Function to add a GeoJSON layer directly
		addDirectGeojson: function (data /* as FeatureCollection */, /* assign this: */ layerId, layerConfig)
		{
			// If the layer is already present, update the data
			if (_layerConfig[layerId]) {
				layerviewer.showCurrentData (layerId, data, '_fixed');
				return;
			}
			
			// Register the new layer
			_layerConfig[layerId] = {
				data: data,
				apiCall: false,
				bbox: false,
				static: true
			};
			
			// Merge in any layer configuration, e.g. iconUrl
			if (layerConfig) {
				$.extend (_layerConfig[layerId], layerConfig);
			}
			
			// Enable the layer
			layerviewer.enableLayer (layerId);
			
			// Show the data
			// #!# This should not be necessary, but somewhere within the enableLayer () tree, the data is not being set
			layerviewer.showCurrentData (layerId, data, '_fixed');
		},
		
		
		// Function to erase contents of a directly-added GeoJSON layer; the layer itself will continue to exist
		eraseDirectGeojson: function (layerId)
		{
			// End if not present
			if (!_layerConfig[layerId]) {return;}
			
			// Leave the layer in place, but set the data to empty
			var data = {type: 'FeatureCollection', 'features': []};
			layerviewer.showCurrentData (layerId, data, '_fixed');
		}
	};
	
} (jQuery));


