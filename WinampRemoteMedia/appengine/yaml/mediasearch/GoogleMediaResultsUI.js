/**
 * The Google media results UI.
 */
var GoogleMediaResultsUI = Base.extend(
{
	/**
	 * The media interaction object.
	 */
	__webToHostAppInteraction: null,
	
	/**
	 * Constructor.
	 *
	 * @param webToHostAppInteraction The media interaction object.
	 */
	constructor: function(webToHostAppInteraction)
	{
		this.__webToHostAppInteraction = webToHostAppInteraction;
	},
	
	/**
	 * Builds the media tree for the given contexts.
	 *
	 * @param parent The parent layout.
	 * @param height The height of the tab view.
	 * @param width The width of the tab view.
	 * @param elementId The HTML element ID to put the tree into.
	 * @param boundaryElement The boundary element.
	 * @param resultNodes An array of result nodes from the search.
	 * @param resultDirectories An array of result directories beneath the last node.
	 * @param fnGetMoreResults The asynchronous function to get more results.
	 */
	buildMediaTree: function(height, width, elementId, boundaryElement, resultNodes, resultDirectories, fnGetMoreResults)
	{
		var tracksPaneId = elementId + '_tracksPane';
		var resultTreePaneId = elementId + '_resultTreePane';
		
		var widthDetails = calculateResizePaneWidthSettings(100, 200, width, 100);
		
		// Split the pane into 2 for tree results and tracks.
		var layout = new YAHOO.widget.Layout(elementId, {height: height, width: width,
			units: [
        		{ position: 'right', width: widthDetails.width, minWidth: widthDetails.minWidth, maxWidth: widthDetails.maxWidth, scroll: true, resize: true, gutter: '0 0 0 7', body: '<div id="' + tracksPaneId + '"></div>' },
        		{ position: 'center', scroll: true, gutter: '0 2 0 0', body: '<div id="' + resultTreePaneId + '"></div>' }]});
		layout.render();
		
		// Setup the tracks pane UI and attach to width change event.
		var tracksPaneUi = new MediaResultsUI(tracksPaneId, boundaryElement, this.__webToHostAppInteraction);
		var elTracksPane = layout.getUnitByPosition('right');
		elTracksPane.subscribe('widthChange', tracksPaneUi.onWidthChange, tracksPaneUi); 
	
		// Build tree up to and including last result node.
		var tree = new YAHOO.widget.TreeView(resultTreePaneId);
		var currNode = tree.getRoot();
		var oData = new Object();
		oData.expanded = true;
		oData.tracksPaneUi = tracksPaneUi;
		for (resultIndex in resultNodes)
		{
			oData.searchResults = resultNodes[resultIndex];
			currNode = new MediaNode(oData, currNode);
			// Add the dynamic load function, so that it can be called at any time (as well as on node expansion)
			var self = this;
			currNode.fnLoadResults =
									function()
									{
										this.isLoading = true;
    									this.refresh();
										var node = this;
										self.__nodeExpanded(this, function()
											{
												node.isLoading = false;
												node.refresh();
											}, fnGetMoreResults);
									};
		}

		// Add result directories to last result node.
		this.__buildDynamicChildren(currNode, resultDirectories, fnGetMoreResults);
		
		// Render the tree.
		tree.render();
	},
	
	/**
	 * Builds the dynamic children that hang off the last retrieved node.
	 *
	 * @param parentNode The parent node off which to hang the children.
	 * @param resultDirectories An array of result directories.
	 * @param fnGetMoreResults The asynchronous function to get more results.
	 */
	__buildDynamicChildren: function(parentNode, resultDirectories, fnGetMoreResults)
	{
		var continueChildCheck = true;
		var oData = new Object();
	 	oData.expanded = false;
	 	oData.tracksPaneUi = parentNode.getTracksPaneUi();
		for (resultDirectoryIndex in resultDirectories)
		{
			// Remove any trailing /.
			resultDirectories[resultDirectoryIndex].name = resultDirectories[resultDirectoryIndex].name.replace(/\/$/, '');
			
			// Check whether to add this child (it may already exist).
			if (continueChildCheck && parentNode.doesChildExist(resultDirectories[resultDirectoryIndex].name))
			{
				// The child already exists skip to the next one (no need to check for match after this too!).
				continueChildCheck = false;
				continue;
			}
			
			// Construct oData object.
			oData.searchResults = resultDirectories[resultDirectoryIndex];
			oData.searchResults.url = parentNode.getSearchResults().url + '/' + oData.searchResults.context;
			
			// Add the child.
			this.__addChildNode(parentNode, oData, fnGetMoreResults);
		}
	},

	/**
	 * Adds a child node the specified parent.
	 * 
	 * @param parentNode The parent node.
	 * @param oData the child's object data.
	 * @param fnGetMoreResults The asynchronous function to get more results.
	 */	
	__addChildNode: function(parentNode, oData, fnGetMoreResults)
	{
		var self = this;
		
		// Create the child node.
		var newNode = new MediaNode(oData, parentNode);
		
		// Set the function to callback when the node is expanded.
		newNode.setDynamicLoad(
			function(node, fnLoadComplete)
			{
				self.__nodeExpanded(node, fnLoadComplete, fnGetMoreResults);
			});
	},
	
	/**
	 * Function called when a dynamic node is expanded.
	 *
	 * @param node The node that is to be expanded.
	 * @param fnLoadComplete Function to call when the dynamic data insertion has completed.
	 * @param fnGetMoreResults The asynchronous function to get more results.
	 */
	__nodeExpanded: function(node, fnLoadComplete, fnGetMoreResults)
	{
		var self = this;
		fnGetMoreResults(node.getSearchResults(),
			function(nodeResults, resultDirectories)
			{
				self.__buildBranchExpandedResults(node, nodeResults, resultDirectories, fnGetMoreResults, fnLoadComplete); 
			});
	},
	
	/**
	 * Function called to add results to a dynamic node.
	 *
	 * @param node The node that is to be expanded.
	 * @param nodeResults The search results for the node.
	 * @param resultDirectories An array of result directories beneath the last node.
	 * @param fnGetMoreResults The asynchronous function to get more results.
	 * @param fnLoadComplete Function to call when the dynamic data insertion has completed.
	 */
	__buildBranchExpandedResults: function(node, nodeResults, resultDirectories, fnGetMoreResults, fnLoadComplete)
	{
		if (nodeResults && resultDirectories)
		{
			// Update the node data.
			node.setSearchResults(nodeResults);
			node.parent.refresh();
			
			// Add the children, if any.
			if (resultDirectories.length > 0)
			{
				this.__buildDynamicChildren(node, resultDirectories, fnGetMoreResults);
			}
			else
			{
				node.iconMode = 1;
			}
		}
		else
		{
			// Ensure this node won't load again.
			var searchResults = node.getSearchResults();
			searchResults.areLoaded = true;
			node.setSearchResults(searchResults);
			if (!node.children || node.children.length == 0)
			{
				node.iconMode = 1;
			}
			node.parent.refresh();
		}
		fnLoadComplete();
	}
});


/**
 * A media directory node that contains the search results.
 * Contains data:
 * .searchResults.name - name of the directory (as set in parent page)
 * .searchResults.title - title of the page (i.e. "index of")
 * .searchResults.url - the full URL to the page
 * .searchResults.tracks - the tracks under the node
 * .searchResults.areLoaded - whether or not the results have been loaded.
 *
 * @extends YAHOO.widget.TextNode
 *
 * @param oData    {object}  A string or object containing the data that will
 *                           be used to render this node.
 * @param oParent  {Node}    This node's parent node
 */
MediaNode = function(oData, oParent)
{
	MediaNode.superclass.constructor.call(this,oData,oParent,oData.expanded);
	if (oParent.__type == this.__type)
	{
		oParent.addChildName(oData.searchResults.name);	// Store this child's name in the parent for quick lookup.
	}
	this.setup(oData);
};

YAHOO.extend(MediaNode, YAHOO.widget.TextNode,
{
	/**
     * The node type
     * @property __type
     * @private
     * @type string
     * @default "MediaNode"
     */
    __type: "MediaNode",
    
    /**
     * An array of child names, keyed by the child name.
     */
    __childNames: [],

    /**
     * The search results.
     *
     * @type custom search results.
     */
    __searchResults: null,
    
    /**
     * The tracks pane UI.
     */
    __tracksPaneUi: null,
    
    /**
     * Function to load results.
     */
    fnLoadResults: null,
    
    /**
     * Setup the node.
     *
     * @param oData The node setup data.
     */
    setup: function(oData)
    {
    	this.__searchResults = oData.searchResults;
    	this.__tracksPaneUi = oData.tracksPaneUi;
    	
    	// Setup node select event.
		this.tree.subscribe('clickEvent', this.nodeSelectEvent); 
    },
    
    /**
     * Adds a child name to the array index.
     * 
     * @param childName The child name.
     */
    addChildName: function(childName)
    {
    	this.__childNames[childName.toUpperCase()] = true;
    },
    
    /**
     * Checks if the child name exists under this node. The child array is used for fast indexing.
     * 
     * @param childName The child name.
     * @return TRUE if the child name exists.
     */
    doesChildExist: function(childName)
    {
    	// Convert name to upper case.
		childName = childName.toUpperCase();
		
    	if (this.__childNames[childName])
    	{
    		return true;
    	}
    	else
    	{
    		return false;
    	}
    },
    
    /**
     * Event when any node is selected.
     *
     * @param oArgs Information about the select event.
     */
    nodeSelectEvent: function(oArgs)
    {
    	var node = oArgs.node;
    	return node.onNodeSelect();
    },
    
    /**
     * Function invoked when the node is selected.
     */
    onNodeSelect: function()
    {
    	if (this.__searchResults.areLoaded)
    	{
    		this.__displayTracks();
    		this.focus();
    		return false;
    	}
    	else
    	{
    		if (this.expanded)	// Load results for a node that is already expanded.
    		{
    			this.fnLoadResults();
    			return false;	// No further action as this has been managed.
    		}
    		else
    		{
    			return true;	// Let YUI model decide what to do next.
    		}
    	}
    },
    
    /**
     * Displays the tracks of the node.
     */
    __displayTracks: function()
    {
    	this.__tracksPaneUi.displayMedia(this.__searchResults.tracks);
    },
    
    /**
     * Sets the search results.
     *
     * @param searchResults The search results.
     */
    setSearchResults: function(searchResults)
    {
    	this.__searchResults = searchResults;
    },
    
    /**
     * Gets the search results.
     *
     * @return The search results.
     */
    getSearchResults: function()
    {
    	return this.__searchResults;
    },
    
    /**
     * Gets the tracks pane UI.
     *
     * @return The tracks pane UI.
     */
    getTracksPaneUi: function()
    {
    	return this.__tracksPaneUi;
    },

	/**
	 * Get the HTML for the node.
	 */
    getContentHtml: function()
    {                                                                                                                                           
        var sb = []; 
        sb[sb.length] = '<table>';
        sb[sb.length] = '<tr>';
        sb[sb.length] = '<td><span';                                                                                                                                       
        sb[sb.length] = ' id="' + this.labelElId + '"';                                                                                                              
        /*if (this.title)
        {                                                                                                                                                  
            sb[sb.length] = ' title="' + this.title + '"';                                                                                                                 
        }*/
        sb[sb.length] = ' class="' + this.labelStyle  + '"';                                                                                                               
        sb[sb.length] = '>';                                                                                                                                          
        sb[sb.length] = this.__searchResults.name;
        if (this.__searchResults.tracks)
        {
        	sb[sb.length] = ' (' + this.__searchResults.tracks.length + ')';
        }                                                                                                                                     
        sb[sb.length] = '</span></td>';
        sb[sb.length] = '</tr>';
        
        
        /*this.__addInfo(sb, 'url: ' + this.__searchResults.url);
        if (this.__searchResults.title)
        {
        	this.__addInfo(sb, 'title: ' + this.__searchResults.title);
        }
        if (this.__searchResults.tracks)
        {
        	this.__addInfo(sb, 'number of tracks: ' + this.__searchResults.tracks.length);
        }*/
        
        sb[sb.length] = '</table>';
                                                                                                                                    
        return sb.join("");                                                                                                                                                
    },
    
    /**
     * Adds HTML info to the node.
     *
     * @param sb The string builder.
     * @param info The information.
     */
    __addInfo: function(sb, info)
    {
    	sb[sb.length] = '<tr>';
        sb[sb.length] = '<td><span class="mediaSearchBranchInfo">';
        sb[sb.length] = info;
        sb[sb.length] = '</tr>';
        sb[sb.length] = '</span></td>';
        sb[sb.length] = '</tr>';
    } 
});