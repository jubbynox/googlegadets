/**
 * Load common libraries.
 * Requires hosting page to include Google's AJAX APIs.
 */
google.load("jquery", "1");
google.load("jqueryui", "1");

/** Application loader. **/
google.setOnLoadCallback(onLoad);

/**
 * Function to be invoked on page load. Sets up the required objects.
 */
function onLoad()
{
    // Setup default JQuery AJAX settings. Default 10 seconds timeout. Ensure utf-8 used throughout.
    $.ajaxSetup({timeout: 10000, scriptCharset: "utf-8", contentType: "application/json; charset=utf-8"});

    // Call application onLoad method.
    onLoadExtended();
    
    // Check that the latest plugin is being used.
    checkPlugin();
}

/**
 * URL to report bad media.
 */
var BAD_MEDIA_URL = 'google/addBadMedia';

/**
 * URL to send comments to.
 */
var COMMENTS_URL = 'addComments';

/**
 * Stylesheet HTML snippet to insert dynamically.
 */
var STYLESHEET_LINK = '/winamp.css?font=FONT&fontsize=FONT_SIZE&' +
	'itemBackground=ITEM_BACKGROUND&itemForeground=ITEM_FOREGROUND&windowBackground=WINDOW_BACKGROUND&' +
	'buttonForeground=BUTTON_FOREGROUND&hilite=HILITE&' +
	'listHeaderBackground=LIST_HEADER_BACKGROUND&listHeaderText=LIST_HEADER_TEXT&' +
	'selectionBarForeground=SELECTION_BAR_FOREGROUND&selectionBarBackground=SELECTION_BAR_BACKGROUND&' +
	'inactiveSelectionBarBackground=INACTIVE_SELECTION_BAR_BACKGROUND&' +
	'alternateItemBackground=ALTERNATE_ITEM_BACKGROUND&' +
	'alternateItemForeground=ALTERNATE_ITEM_FOREGROUND';
	
/**
 * Request string for enqueuing media.
 */
var ENQUEUE_MEDIA = 'redcaza://{"operation": OPERATION, "url": "URL", "title": "TITLE", "duration": DURATION}';

/**
 * Gets JSON from the same domain.
 * 
 * @param url The request URL.
 * @param data The request data to send.
 * @param fnCallbackSuccess Function to call on success, e.g. fn(data, textStatus)
 * @param fnCallbackError Function to call on error, e.g. fn(XMLHttpRequest, textStatus, errorThrown)
 */
function getDomainJSON(url, data, fnCallbackSuccess, fnCallbackError)
{
	$.ajax({
		dataType: "json",
		data: data,
		error: fnCallbackError,
		success: fnCallbackSuccess,
		url: url});
}

/**
 * Gets JSON from another domain that supports JSONP.
 * 
 * @param url The full request URL.
 * @param data The request data to send.
 * @param fnCallbackSuccess Function to call on success, e.g. fn(data, textStatus)
 * @param fnCallbackError Function to call on error, e.g. fn(XMLHttpRequest, textStatus, errorThrown)
 */
function getXDomainJSON(url, data, fnCallbackSuccess, fnCallbackError)
{
	$.ajax({
		dataType: "jsonp",
		data: data,
		error: fnCallbackError,
		success: fnCallbackSuccess,
		url: url});
}

/**
 * Posts JSON data to the same domain.
 * 
 * @param url The post url.
 * @param data The post data to send.
 */
function postDomainJSON(url, data)
{
	$.ajax({
		dataType: "json",
		data: data,
		type: "POST",
		url: url});
}

/**
 * Reports bad media to the App Engine.
 * 
 * @param mediaUrl The URL to the media that caused a problem.
 * @param cause The cause of the problem. 1 = Bad response fetching URL content; 2 = App Engine timed out;
 */
function reportBadMedia(mediaUrl, cause)
{
	// Setup object.
	var data = new Object();
	data.mediaUrl = mediaUrl;
	data.cause = cause.toString();	// Cast to string.
	
	// Post the data.
	postDomainJSON(BAD_MEDIA_URL, data);
}


/**
 * Adds comments.
 *
 * @param comments The comments.
 */
function addComments(comments)
{
	if (comments.length && comments.length > 0)
	{
		// Make comments safe.
		comments = comments.replace(/("|\\)/g, '\\$1');
		if (comments.length > 512)
		{
			comments = comments.substring(0, 512);
		}
		
		// Construct object.
		var data = new Object();
		data.comments = comments;
		
		// Post data.
		postDomainJSON(COMMENTS_URL, data);
	}
}


/**
 * Class loops through an array, <code>batchSize</code> elements at a time, invoking <code>fnToSendArrayElementsTo</code> with the array elements.
 * It waits <code>timerInterval</code> between each batch.
 */
var ThreadedLoop = Base.extend(
{
	/**
	 * Constructor.
	 * 
	 * @param array	The array to loop through.
	 * @param fnToSendArrayElementsTo The function to send array elements to.
	 * @param timerInterval Time between each timer call.
	 * @param batchSize The size of each batch processed within the array.
	 * @param fnFinished The function to call when each iteration finishes.
	 */
	constructor: function(array, fnToSendArrayElementsTo, timerInterval, batchSize, fnFinished)
	{
		// Setup variables.
		this.__arrayIndex = 0;
		this.__array = array;
		this.__batchSize = batchSize;
		this.__fnToSendArrayElementsTo = fnToSendArrayElementsTo;
		this.__fnFinished = fnFinished;
		
		// Start the timer.
		var self = this;
		this.__timerId = setInterval(function(){self.onTimer();}, timerInterval);
	},
	
	/**
	 * ID of timer.
	 */
	__timerId: null,
	
	/**
	 * The array.
	 */
	__array: null,
	
	/**
	 * Function to send array elements to.
	 */
	__fnToSendArrayElementsTo: null,
	
	/**
	 * Current array index.
	 */
	__arrayIndex: null,
	
	/**
	 * Size of batches.
	 */
	__batchSize: null,
	
	/**
	 * Function to call when each iteration finishes.
	 */
	__fnFinished: null,
	
	/**
	 * Timer function; loops this.__batchSize times through the array.
	 */
	onTimer: function()
	{
		// Calculate end index.
		var indexEnd = this.__arrayIndex + this.__batchSize;
		if (indexEnd >= this.__array.length)
		{
			indexEnd = this.__array.length;
			clearInterval(this.__timerId);	// Stop the timer.
		}
		
		// Loop through this.__batchSize elements.
		while(this.__arrayIndex < indexEnd)
		{
			this.__fnToSendArrayElementsTo(this.__array[this.__arrayIndex]);
			this.__arrayIndex++;
		}
		
		this.__fnFinished();
	}
});


/**
 * Sets up the stylesheet.
 */
function setupStylesheet()
{
	// Perform IE hacks.
	var inputCSS = getInputCSS(winampGetClassicColour(1), winampGetClassicColour(0), winampGetClassicColour(2),
		winampGetClassicColour(5), winampGetClassicColour(2), winampGetClassicColour(5));
	var buttonCSS = getInputCSS("#000000", "#CBCBCB", winampGetClassicColour(0),
		winampGetClassicColour(0), winampGetClassicColour(0), winampGetClassicColour(0));
	$('input[type="text"]').css(inputCSS);
	$('input[type="button"]').css(buttonCSS);
	$('input[type="submit"]').css(buttonCSS);
	
	stylesheetLink = STYLESHEET_LINK.replace(/FONT/, winampGetFont());
	stylesheetLink = stylesheetLink.replace(/FONT_SIZE/, winampGetFontSize());
	stylesheetLink = stylesheetLink.replace(/ITEM_BACKGROUND/, winampGetClassicColour(0));
	stylesheetLink = stylesheetLink.replace(/ITEM_FOREGROUND/, winampGetClassicColour(1));
	stylesheetLink = stylesheetLink.replace(/WINDOW_BACKGROUND/, winampGetClassicColour(2));
	stylesheetLink = stylesheetLink.replace(/BUTTON_FOREGROUND/, winampGetClassicColour(3));
	stylesheetLink = stylesheetLink.replace(/HILITE/, winampGetClassicColour(5));
	stylesheetLink = stylesheetLink.replace(/LIST_HEADER_BACKGROUND/, winampGetClassicColour(7));
	stylesheetLink = stylesheetLink.replace(/LIST_HEADER_TEXT/, winampGetClassicColour(8));
	stylesheetLink = stylesheetLink.replace(/SELECTION_BAR_FOREGROUND/, winampGetClassicColour(18));
	stylesheetLink = stylesheetLink.replace(/SELECTION_BAR_BACKGROUND/, winampGetClassicColour(19));
	stylesheetLink = stylesheetLink.replace(/INACTIVE_SELECTION_BAR_BACKGROUND/, winampGetClassicColour(21));
	stylesheetLink = stylesheetLink.replace(/ALTERNATE_ITEM_BACKGROUND/, winampGetClassicColour(22));
	stylesheetLink = stylesheetLink.replace(/ALTERNATE_ITEM_FOREGROUND/, winampGetClassicColour(23));
	stylesheetLink = stylesheetLink.replace(/#/g, '%23');
	
	var headID = document.getElementsByTagName("head")[0];         
	var cssNode = document.createElement('link');
	cssNode.type = 'text/css';
	cssNode.rel = 'stylesheet';
	cssNode.href = stylesheetLink;
	cssNode.media = 'screen';
	headID.appendChild(cssNode);
}

/**
 * Returns a CSS object for an input box.
 */
function getInputCSS(foreground, background, borderTop, borderBottom, borderLeft, borderRight)
{
	var inputCSS = new Object();
	inputCSS['color'] = foreground;
	inputCSS['background-color'] = background;
	inputCSS['border-top'] = '1px solid ' + borderTop;
	inputCSS['border-bottom'] = '1px solid ' + borderBottom;
	inputCSS['border-left'] = '1px solid ' + borderLeft;
	inputCSS['border-right'] = '1px solid ' + borderRight;
	return inputCSS;
}

/**
 * Enqueues media.
 * 
 * @param operation Operation to perform: 0: use WinAmp module; 1: use transcoding; 2: ask app engine for more information.
 * @param url The URL of the media (or app engine request).
 * @param title The title of the media.
 * @param duration The duration of the media.
 */
function enqueueMedia(operation, url, title, duration)
{
	var enqueueMedia = ENQUEUE_MEDIA.replace(/OPERATION/, operation);
	enqueueMedia = enqueueMedia.replace(/URL/, url);
	enqueueMedia = enqueueMedia.replace(/TITLE/, title.replace(/"/g, '\\"'));	// Ensure " is escaped.
	enqueueMedia = enqueueMedia.replace(/DURATION/, duration);
	winampEnqueue(enqueueMedia, title, duration);
}

/**
 * Gets a request parameter from the URL.
 * 
 * @param name The name of the request parameter.
 * @return The request parameter value.
 */
function getRequestParameter(name)
{
    name = name.replace(/[\[]/, "'\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(window.location.href);
    if( results == null )
    {
        return "";
    }
    else
    {
        return results[1];
    }
}

/**
 * Checks that the latest plugin is being used. Displays a message if it is not.
 */
function checkPlugin()
{
	var dllVer = getRequestParameter('dllVer');
	if (!dllVer || pageData.latestVersion != getRequestParameter('dllVer'))
	{
		$('#newPlugin').show();
	}
}	