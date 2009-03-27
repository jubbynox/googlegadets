/*
	Base.js, version 1.1
	Copyright 2006-2007, Dean Edwards
	License: http://www.opensource.org/licenses/mit-license.php
	
	Extended - JAL - to have a method to help with callbacks.
*/

/**
 * Regular expression to count function arguments. Over complicated to avoid using non-greedy operator that may not be supported.
 */
var COUNT_FUNCTION_ARGS = new RegExp(/function\s*\(([^\)]*)\)/);

var Base = function() {
	// dummy
};

Base.extend = function(_instance, _static) { // subclass
	var extend = Base.prototype.extend;
	
	// build the prototype
	Base._prototyping = true;
	var proto = new this;
	extend.call(proto, _instance);
	delete Base._prototyping;
	
	// create th wrapper for the constructor function
	//var constructor = proto.constructor.valueOf(); //-dean
	var constructor = proto.constructor;
	var klass = proto.constructor = function() {
		if (!Base._prototyping) {
			if (this._constructing || this.constructor == klass) { // instantiation
				this._constructing = true;
				constructor.apply(this, arguments);
				delete this._constructing;
			} else if (arguments[0] != null) { // casting
				return (arguments[0].extend || extend).call(arguments[0], proto);
			}
		}
	};
	
	// build the class interface
	klass.ancestor = this;
	klass.extend = this.extend;
	klass.forEach = this.forEach;
	klass.implement = this.implement;
	klass.prototype = proto;
	klass.toString = this.toString;
	klass.valueOf = function(type) {
		//return (type == "object") ? klass : constructor; //-dean
		return (type == "object") ? klass : constructor.valueOf();
	};
	extend.call(klass, _static);
	// class initialisation
	if (typeof klass.init == "function") klass.init();
	return klass;
};

Base.prototype = {	
	extend: function(source, value) {
		if (arguments.length > 1) { // extending with a name/value pair
			var ancestor = this[source];
			if (ancestor && (typeof value == "function") && // overriding a method?
				// the valueOf() comparison is to avoid circular references
				(!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
				/\bbase\b/.test(value)) {
				// get the underlying method
				var method = value.valueOf();
				// override
				value = function() {
					var previous = this.base || Base.prototype.base;
					this.base = ancestor;
					var returnValue = method.apply(this, arguments);
					this.base = previous;
					return returnValue;
				};
				// point to the underlying method
				value.valueOf = function(type) {
					return (type == "object") ? value : method;
				};
				value.toString = Base.toString;
			}
			this[source] = value;
			// Add 'getForCallback' functionality.
			// Add 'name' to functions.
			if (typeof value == "function")
			{
				this[source].fnName = source;
			}
		} else if (source) { // extending with an object literal
			var extend = Base.prototype.extend;
			// if this object has a customised extend method then use it
			if (!Base._prototyping && typeof this != "function") {
				extend = this.extend || extend;
			}
			var proto = {toSource: null};
			// do the "toString" and other methods manually
			var hidden = ["constructor", "toString", "valueOf"];
			// if we are prototyping then include the constructor
			var i = Base._prototyping ? 0 : 1;
			while (key = hidden[i++]) {
				if (source[key] != proto[key]) {
					extend.call(this, key, source[key]);

				}
			}
			// copy each of the source object's properties to this object
			for (var key in source) {
				if (!proto[key]) extend.call(this, key, source[key]);
			}
		}
		return this;
	},

	base: function() {
		// call this method from any other method to invoke that method's ancestor
	},
	
	/**
	 * Gets the number of arguments in a function definition.
	 *
	 * @param functionSource The function source.
	 *
	 * @return The number of arguments.
	 */
	__getNumberOfArguments: function(functionSource)
	{
		var argsMatch = COUNT_FUNCTION_ARGS.exec(functionSource);
		if (!argsMatch || argsMatch.length < 1)
		{
			return 0;
		}
		
		var matchedArgs = argsMatch[1].split(',');
		
		// Test for 0 arguments.
		if (matchedArgs[0].length == 0)
		{
			return 0;
		}
		else
		{
			return matchedArgs.length;
		}
	},

	/**
	 * Creates an argument list.
	 *
	 * @param numArgs The number of arguments.
	 *
	 * @return The argument list.
	 */
	__createArgumentList: function(numArgs)
	{
		var argString = '';
		if (numArgs == 0)
		{
			return argString;
		}
		
		var argNum = 0;
		argString += 'arg' + argNum;
		while (++argNum < numArgs)
		{
			argString += ',arg' + argNum;
		}
		return argString;
	},
	
	/**
	 * Returns a function to be used in callback routines.
	 *
	 * @param callingContext The calling context to execute the function from.
	 * @param theFunction The function to execute.
	 *
	 * @return The callback function.
	 */
	getForCallback: function(callingContext, theFunction)
	{
		var callbackFunction;
		var argList = this.__createArgumentList(this.__getNumberOfArguments(theFunction));
		
		var functionCreateStr = 'callbackFunction = function(' + argList + ')';
		functionCreateStr += '{callingContext.' + theFunction.fnName + '(' + argList + ');';
		functionCreateStr += '};';
		return eval(functionCreateStr);
	}
};

// initialise
Base = Base.extend({
	constructor: function() {
		this.extend(arguments[0]);
	}
}, {
	ancestor: Object,
	version: "1.1",
	
	forEach: function(object, block, context) {
		for (var key in object) {
			if (this.prototype[key] === undefined) {
				block.call(context, object[key], key, object);
			}
		}
	},
		
	implement: function() {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == "function") {
				// if it's a function, call it
				arguments[i](this.prototype);
			} else {
				// add the interface using the extend method
				this.prototype.extend(arguments[i]);
			}
		}
		return this;
	},
	
	toString: function() {
		return String(this.valueOf());
	}
});
/**
 * URL to report bad media.
 */
var BAD_MEDIA_URL = 'google/addBadMedia';

/**
 * URL to send comments to.
 */
var COMMENTS_URL = 'addComments';


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
	// Make comments safe.
	comments = comments.replace(/("|\\)/g, '\\$1')
	
	// Post data.
	postDomainJSON(COMMENTS_URL, comments);
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
 * Load common libraries.
 * Requires hosting page to include Google's AJAX APIs.
 */
google.load("jquery", "1");
google.load("jqueryui", "1");

/** Global variables **/
var test = 0; // 0, 1, 2
var searchObject;


/** Application loader. **/
google.setOnLoadCallback(onLoad);


/**
 * Function to be invoked on page load. Sets up the required objects.
 */
function onLoad()
{
	// Setup default JQuery AJAX settings.
	$.ajaxSetup({timeout: 10000});
	
	// Call application onLoad method.
	onLoadExtended();
}

/**
 * Main search function.
 *
 * @param searchString The search string.
 */
function search(searchString)
{
	// Do the search.
	searchObject.search(searchString);
	
	// Ensure that the invoking form doesn't cause a page load.
	return false;
}

/**
 * Clears the results.
 */
function clearResults()
{
	// Clear search objects.
	searchObject.clearResults();
	
	// Clear the input box.
	$('#SearchInput')[0].value = '';
}
/**
 * A selectable list that can invoke functions on double or right click.
 * If there is to be a context menu then double click and multi-select is allowed; otherwise single click acts like a double click.
 * If there is to be "more" functionality then pass a function as "fnMore" parameter.
 */
var SelectableTableUI = Base.extend(
{
	/**
	 * The data table.
	 */
	__dataTable: null,
	
	/**
	 * The element ID of the HTML element to contain the list.
	 */
	__containerId: null,
	
	/**
	 * The column definitions (see DataTable YUI).
	 */
	__columns: null,
	
	/**
	 * The data schema.
	 */
	__schema: null,
	
	/**
	 * The method to call on selection.
	 */
	__fnSelect: null,
	
	/**
	 * The right-click context menu text to activate the select function.
	 */
	__contextMenuTxt: null,
	
	/**
	 * The method to call to get more results. 
	 */
	__fnMore: null,
	
	/**
	 * Constructor.
	 * If there is to be a context menu then double click and multi-select is allowed; otherwise single click acts like a double click.
	 * Adding "fnMore" enables callback to add more results.
	 *
	 * @param containerId The element ID of the HTML element to contain the list.
	 * @param columns The column definitions (see DataTable YUI).
	 * @param schema The schema.
	 * @param fnSelect The method to call on selection.
	 * @param contextMenuTxt The right-click context menu text to activate the select function.
	 * @param fnMore The method to get more results (sends the current data as a parameter).
	 */
	constructor: function(containerId, columns, schema, fnSelect, contextMenuTxt, fnMore)
	{
		// Assign properties.
		this.__containerId = containerId;
		this.__columns = columns;
		this.__schema = schema;
		this.__fnSelect = fnSelect;
		this.__contextMenuTxt = contextMenuTxt;
		this.__fnMore = fnMore;
	},
	
	/**
	 * Adds data to the existing table.
	 * 
	 * @param data The data to add.
	 */
	addRow: function(data)
	{
		if (!this.__dataTable)	// If table does not exist the create a new one...
		{
			// Create array of data..
			var tmpData = new Array();
			tmpData[0] = data;
		
			// Create the table.
			this.__createTable(tmpData);
		}
		else	// ...else add row.
		{
			this.__dataTable.addRow(data);
		}
	},
	
	/**
	 * Adds data to the existing table.
	 * 
	 * @param data The data to add.
	 */
	addRows: function(data)
	{
		if (!this.__dataTable)	// If table does not exist the create a new one...
		{
			this.__createTable(data);
		}
		else	// ...else add rows.
		{
			this.__dataTable.addRows(data);
		}
	},
		
	/**
	 * Clears the table.
	 */
	clear: function()
	{
		// Destroy existing table.
		if (this.__dataTable)
		{
			this.__dataTable.destroy();
			this.__dataTable = null;
		}
	},
	
	/**
	 * Creates a new table.
	 * 
	 * @param data The row data.
	 */
	__createTable: function(data)
	{
		// Setup data source.	
		var dataSource = new YAHOO.util.LocalDataSource(data);
		dataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSARRAY;
		dataSource.responseSchema = this.__schema;
		
		// Create new table.
		this.__dataTable = new SelectableDataTable(this.__containerId, this.__columns,
				dataSource, this.__fnSelect, this.__contextMenuTxt, this.__fnMore);
	}
});


/**
 * A selectable table that can invoke functions on double or right click.
 * If there is to be a context menu then double click and multi-select is allowed; otherwise single click acts like a double click.
 *
 * @param containerId The element ID of the HTML element to contain the list.
 * @param columns The column definitions (see DataTable YUI).
 * @param dataSource The data source.
 * @param fnSelect The method to call on selection.
 * @param contextMenuTxt The right-click context menu text to activate the select function.
 * @param fnMore The method to get more results (sends the current data as a parameter).
 */
SelectableDataTable = function(containerId, columns, dataSource, fnSelect, contextMenuTxt, fnMore)
{
	SelectableDataTable.superclass.constructor.call(this, containerId, columns, dataSource, {renderLoopSize: 100});
	this.setup(containerId, fnSelect, contextMenuTxt, fnMore);
};

YAHOO.extend(SelectableDataTable, YAHOO.widget.DataTable,
{
	/**
	 * The HTML for a "more..." button.
	 */
	MORE_HTML: '<a id="ID" href="#more_results">more...</a>',
	
	/**
	 * The container ID.
	 */
	__containerId: null,
	
	/**
	 * The method to call on selection.
	 */
	__fnSelect: null,
	
	/**
	 * The right-click context menu text to activate the select function.
	 */
	__contextMenuTxt: null,
	
	/**
	 * The context menu object.
	 */
	__contextMenu: null,
	
	/**
     * Setup the selectable table.
     *
     * @param containerId The element ID of the HTML element to contain the list.
	 * @param fnSelect The method to call on selection.
	 * @param contextMenuTxt The right-click context menu text to activate the select function.
	 * @param fnMore The method to get more results (sends the current data as a parameter).
     */
    setup: function(containerId, fnSelect, contextMenuTxt, fnMore)
    {
    	// Assign properties.
    	this.__containerId = containerId;
    	this.__fnSelect = fnSelect;
    	this.__contextMenuTxt = contextMenuTxt;
    	
    	// Setup events based on context menu functionality.
    	if (contextMenuTxt)
    	{
    		// Single click just highlights row.
    		this.subscribe("rowClickEvent", this.__singleClick);
    		this.subscribe("rowDblclickEvent", this.__dblClick);
    	}
    	else
    	{
    		// Single click acts selects row if there is no context menu.
    		this.subscribe("rowClickEvent", this.__singleClickAndSelect);
    		// Disable multi-select if there is no context menu.
    		this.set("selectionMode","singlecell");
    	}
    	
    	// Add "more" functionality, if required.
    	if (fnMore)
    	{
    		var aID = containerId + '_a';
    		$('#' + containerId).append(this.MORE_HTML.replace('ID', aID));
    		$('#' + aID).bind('click', fnMore);
    	}
    },
    
    /**
     * Destroys the selectable data table.
     */
    destroy: function()
    {
    	// Destroy context menu.
    	if (this.__contextMenu)
    	{
    		this.__contextMenu.destroy();
    		this.__contextMenu = null;
    	}

    	// Invoke super method.
    	YAHOO.widget.DataTable.prototype.destroy.apply(this);
    },
    
    /**
     * Row selected.
     * 
     * @param event The event.
     * @param target The target.
     */
    __singleClick: function(event, target)
    {
    	// Invoke event select row method on parent object.
    	this.onEventSelectRow(event, target);
    	
    	// Create a context menu object (now that a row has been selected), if required.
    	if (this.__contextMenuTxt && !this.__contextMenu)
    	{
    		var dataTable = this;
    		this.__contextMenu = new YAHOO.widget.ContextMenu(this.__containerId + "_context",
                {trigger:dataTable.getTbodyEl()});
        	this.__contextMenu.addItem(this.__contextMenuTxt);
        	this.__contextMenu.render(this.__containerId);
        	this.__contextMenu.clickEvent.subscribe(this.__contextClick, this);
    	}
    },
    
    /**
     * Row selected.
     * 
     * @param event The event.
     * @param target The target.
     */
    __singleClickAndSelect: function(event, target)
    {
    	// Invoke event select row method on parent object.
    	this.onEventSelectRow(event, target);
    	
    	this.__rowsSelected(this.getSelectedRows());
    },
    
    /**
     * Double click event.
     * 
     * @param event The event object.
     * @param target The TD element.
     */
    __dblClick: function(event, target)
    {
    	this.__rowsSelected(this.getSelectedRows());
    },
    
    /**
     * Right-click context selection.
     */
    __contextClick: function(type, args, dataTable)
    {
    	dataTable.__rowsSelected(dataTable.getSelectedRows());
    },
    
    /**
     * Rows have been selected.
     * 
     * @selectedRowIds The selected row IDs.
     */
    __rowsSelected: function(selectedRowIds)
    {
    	var record;
    	var data = new Array();
    	for (var rowId in selectedRowIds)
    	{
    		record = this.getRecord(selectedRowIds[rowId]);
    		data[data.length] = record.getData();
    	}
    	this.__fnSelect(data);
    }
});
/**
 * Handles media interaction between WEB page and hosting application.
 */
var WebToHostAppInteraction = Base.extend(
{
	/**
	 * The event handling object.
	 */
	__eventHandlers: new Object(),
	
	/**
	 * Register the ID of the element that is for adding media to the playlist.
	 * 
	 * @param id The element ID.
	 */
	registerAddToPlaylistId: function(id)
	{
		// Check that hosting application has the defined function.
		if (window.external && "addToPlaylist" in window.external)
		{
			// Register this ID against the function.
			this.__eventHandlers[id] = function(media)
				{
					window.external.addToPlaylist(media.type, media.name, media.url);
				};
		}
		else
		{
			// Function does not exist. Show an alert instead.
			this.__eventHandlers[id] = function()
				{
					alert("Requires a method in hosting application: addToPlaylist(type : string, name : string, url : string)");
				};
		}
	},
	
	/**
	 * Invoked when media is dropped onto a target.
	 * 
	 * @param id The ID of the element the media was dropped onto.
	 * @param media The media.
	 */
	mediaDropEvent: function(id, media)
	{
		this.__eventHandlers[id](media);
	}
});
/** Global variables. **/
var winAmpAPI = false;

// Check that hosting application has WinAmp API.
if (window.external &&
	"PlayQueue" in window.external &&
	"Enqueue" in window.external.PlayQueue &&
	"Skin" in window.external &&
	"GetClassicColor" in window.external.Skin &&
	"MediaCore" in window.external &&
	"IsRegisteredExtension" in window.external.IsRegisteredExtension)
{
	winAmpAPI = true;
}
else
{
	alert("The hosting container does not expose the WinAmp JavaScript API, e.g.: window.external.API.Method.\n You will not be able to listen to or view media.");
}
