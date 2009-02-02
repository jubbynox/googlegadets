/**
 * URL to report bad media.
 */
var BAD_MEDIA_URL = 'method/addBadMedia';

/**
 * Calculates the minimum width, initial width and maximum width for a resizable pane.
 *
 * @param desiredMinWidth The desired minimum width.
 * @param desiredInitialWidth The desired initial width.
 * @param boundaryWidth The width of the bounding element.
 * @param marginAtMax The space to leave between the bounding element when extended to maximum width.
 *
 * @return Width object containing: minWidth, width, maxWidth.
 */
function calculateResizePaneWidthSettings(desiredMinWidth, desiredInitialWidth, boundaryWidth, marginAtMax)
{
	// Calculate maximum width.
	var maxWidth = boundaryWidth - marginAtMax;
	if (maxWidth < 10)	// There has to be a limit on how small this can be.
	{
		maxWidth = 10;
	}
	
	// Ensure that minimum width does not exceed maximum width.
	if (desiredMinWidth > maxWidth)
	{
		desiredMinWidth = maxWidth;
	}
	
	// Ensure that initial width is within bounds of minimum and maximum width.
	if (desiredInitialWidth < desiredMinWidth)
	{
		desiredInitialWidth = desiredMinWidth;
	}
	else if (desiredInitialWidth > maxWidth)
	{
		desiredInitialWidth = maxWidth;
	}
	
	// Construct object;
	var widthDetails = new Object();
	widthDetails.minWidth = desiredMinWidth;
	widthDetails.width = desiredInitialWidth;
	widthDetails.maxWidth = maxWidth;
	
	return widthDetails;
}


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
 * @param directoryUrl The URL to the directory that caused a problem.
 * @param mediaUrl The URL to any media that is a problem.
 */
function reportBadMedia(directoryUrl, mediaUrl)
{
	// Setup object.
	var data = new Object();
	data.directoryUrl = directoryUrl;
	data.mediaUrl = mediaUrl;
	
	// Post the data.
	postDomainJSON(BAD_MEDIA_URL, data);
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