/**
 * The Google Media Site Browser Pane UI.
 */
var GoogleMediaSiteBrowserPaneUI = Base.extend(
{
	/**
	 * The container ID.
	 */
	__containerId: null,
	
	/**
	 * The site tree.
	 */
	__siteTree: null,
	
	/**
	 * The asynchronous function to get more results.
	 */
	__fnGetMoreResults: null,
	
	/**
	 * The function to invoke when a context is selected.
	 */
	__fnContextSelected: null,
	
	/**
	 * Constructor for GoogleMediaSiteBrowserPaneUI.
	 * 
	 * @param containerId The ID of the container.
	 * @param fnGetMoreResults The asynchronous function to get more results.
	 * @param fnContextSelected The function to invoke when a context is selected.
	 */
	constructor: function(containerId, fnGetMoreResults, fnContextSelected)
	{
		this.__containerId = containerId;
		this.__fnGetMoreResults = fnGetMoreResults;
		this.__fnContextSelected = fnContextSelected;
		
		// Create a tree.
		this.__siteTree = new YAHOO.widget.TreeView(this.__containerId);
	},
	
	/**
	 * Clears the site tree.
	 */
	clear: function()
	{
		if (this.__siteTree)
		{
			// Destroy functionality works, but can't re-create tree object. Bug in YUI? Remove children and clear HTML instead.
			this.__siteTree.removeChildren(this.__siteTree.getRoot());
			$('#' + this.__containerId).empty();
		}
	},
	
	/**
	 * Shows a site.
	 * 
	 * @param siteData The site data.
	 */
	showSite: function(siteData)
	{
		// Clear any existing tree.
		this.clear();

		// Get the root and begin setup of node data.
		var currNode = this.__siteTree.getRoot();

		// Separate contexts. Each one will be the base search results for each node.
		var resultNodes = this.__getResultNodes(siteData);

		// Build tree nodes.
		for (resultIndex in resultNodes)
		{
			var oData = new Object();
			oData.expanded = true;
			oData.searchResults = resultNodes[resultIndex];
			currNode = new MediaNode(oData, currNode, this.__fnGetMoreResults, this.__fnContextSelected);
		}

		// Add result directories to last result node.
		currNode.addCollapsedChildren(siteData.directories);

		// Render the tree.
		this.__siteTree.render();
	},
	
	/**
	 * Builds the contexts to the end of the supplied URL.
	 *
	 * @param siteData The site data.
	 *
	 * @return An array of results for each context. The last context node will have the tracks.
	 */
	__getResultNodes: function(siteData)
	{
		// Get the contexts.
		var contexts = this.__getContexts(siteData.url);

		// Loop through all contexts, building result nodes.
		var resultNodes = [];
		var previousFullContext = '';
		var context;
		var lastResultNode;
		for (context in contexts)
		{
			resultNodes[context] = new Object();
			resultNodes[context].name = contexts[context];
			resultNodes[context].url = previousFullContext + contexts[context];
			previousFullContext = resultNodes[context].url + '/';	// The next context to use.
			lastResultNode = resultNodes[context];
		}
		
		// Add response data to the final result node.
		lastResultNode.title = siteData.title;
		lastResultNode.tracks = siteData.tracks;
		lastResultNode.areLoaded = true;
		
		return resultNodes;
	},
	
	/**
	 * Splits the URL into the contexts.
	 *
	 * @param url The URL.
	 *
	 * @return An array of contexts.
	 */
	__getContexts: function getContexts(url)
	{
		// Get protocol.
		var parts = url.split('//');
		
		// Split on delimiter.
		var contexts = parts[1].split('/');
		
		// Recombine protocol with initial context.
		contexts[0] = parts[0] + '//' + contexts[0];
		
		return contexts; 
	}
});


/**
 * A media directory node that contains the search results.
 * Contains data:
 * .__searchResults.name - name of the directory (as set in parent page)
 * .__searchResults.title - title of the page (i.e. "index of")
 * .__searchResults.url - the full URL to the page
 * .__searchResults.tracks - the tracks under the node
 * .__searchResults.areLoaded - whether or not the results have been loaded.
 *
 * @extends YAHOO.widget.TextNode
 *
 * @param oData    {object}  A string or object containing the data that will
 *                           be used to render this node.
 * @param oParent  {Node}    This node's parent node.
 * @param fnGetMoreResults	 The asynchronous function to get more results.
 * @param fnNodeSelected	 The function to invoke when a node is selected.
 */
MediaNode = function(oData, oParent, fnGetMoreResults, fnNodeSelected)
{
	MediaNode.superclass.constructor.call(this,oData,oParent,oData.expanded);
	if (oParent.__type == this.__type)
	{
		oParent.addChildName(oData.searchResults.name);	// Store this child's name in the parent for quick lookup.
	}
	this.setup(oData, fnGetMoreResults, fnNodeSelected);
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
    __childNames: null,

    /**
     * The search results.
     */
    __searchResults: null,
    
    /**
     * The method to invoke to get more results.
     */
    __fnGetMoreResults: null,
    
    /**
     * The method to invoke when a node is selected.
     */
    __fnNodeSelected: null,
    
    /**
     * Setup the node.
     *
     * @param oData The node setup data.
     * @param fnGetMoreResults The asynchronous function to get more results.
     * @param fnNodeSelected The function to invoke when a node is selected.
     */
    setup: function(oData, fnGetMoreResults, fnNodeSelected)
    {
    	this.__fnGetMoreResults = fnGetMoreResults;
    	this.__fnNodeSelected = fnNodeSelected;
    	this.__childNames = new Array();
    	this.__searchResults = oData.searchResults;
    	
    	// Setup node select event.
		this.tree.subscribe('clickEvent', this.nodeSelectEvent); 
    },
    
    /**
	 * Get the HTML for the node.
	 */
    getContentHtml: function()
    {                                                                                                                                           
        var sb = [];
        sb[sb.length] = '<table>';
        sb[sb.length] = '<tr>';
        sb[sb.length] = '<td><span id="';
        sb[sb.length] = this.labelElId;
        sb[sb.length] = '" class="';
        sb[sb.length] = this.labelStyle;
        sb[sb.length] = '">';
        sb[sb.length] = this.__searchResults.name;
        if (this.__searchResults.tracks)
        {
        	sb[sb.length] = ' (' + this.__searchResults.tracks.length + ')';
        }                                                                                                                                     
        sb[sb.length] = '</span></td>';
        sb[sb.length] = '</tr>';
        sb[sb.length] = '</table>';
        
        return sb.join("");                                                                                                                                                
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
    		// Search results have already been loaded for this node. Focus it and callback function with tracks for selected node.
    		this.focus();
    		this.__fnNodeSelected(this.__searchResults);
    		return false;
    	}
    	else
    	{
    		// Search results have not been loaded yet.
    		if (this.expanded)
    		{
    			// Load results for a node that is already expanded.
    			this.__loadNode();
    			return false;	// No further action as this has been managed.
    		}
    		else
    		{
    			return true;	// Let YUI model decide what to do next (invokes dynamic load function).
    		}
    	}
    },
    
    /**
	 * Builds the dynamic children that hang off this node.
	 *
	 * @param resultDirectories An array of result directories.
	 */
    addCollapsedChildren: function(resultDirectories)
	{
		var continueChildCheck = true;

		for (resultDirectoryIndex in resultDirectories)
		{
			// Remove any trailing /.
			var directoryName = resultDirectories[resultDirectoryIndex].name.replace(/\/$/, '');
			
			// Check whether to add this child (it may already exist).
			if (continueChildCheck && this.__doesChildExist(directoryName))
			{
				// The child already exists skip to the next one (no need to check for match after this, as there can only be 1 pre-loaded child).
				continueChildCheck = false;
				continue;
			}
			
			// Construct oData object.
			var tmpData = new Object();
	 		tmpData.expanded = false;
	 		tmpData.searchResults = new Object();
			tmpData.searchResults.name = directoryName;
			tmpData.searchResults.url = this.__searchResults.url + '/' + resultDirectories[resultDirectoryIndex].context;

			//Add the child.
			var childNode = new MediaNode(tmpData, this, this.__fnGetMoreResults, this.__fnNodeSelected);
			
			// Set the function to callback when the child is expanded.
			childNode.setDynamicLoad(
				function(self)
				{
					return function(node, fnLoadComplete)
					{
						self.__nodeExpanded(fnLoadComplete);
					};
				}(childNode));
		}
	},
	
	/**
     * Checks if the child name exists under this node. The child array is used for fast indexing.
     * 
     * @param childName The child name.
     * @return TRUE if the child name exists.
     */
    __doesChildExist: function(childName)
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
     * Loads node data.
     */
    __loadNode: function()
    {
    	this.isLoading = true;
		this.refresh();
		var node = this;
		// Use the expanded functionality to load data.
		this.__nodeExpanded(
			// For when loading is complete.
			function()
			{
				node.isLoading = false;
				node.refresh();
			});
    },
    
    /**
	 * Function called when a dynamic node is expanded.
	 *
	 * @param fnLoadComplete Function to call when the dynamic data insertion has completed.
	 */
	__nodeExpanded: function(fnLoadComplete)
	{
		var self = this;
		// Get more results.
		this.__fnGetMoreResults(this.__searchResults.url,
			function(branchData)
			{
				self.__buildBranchExpandedResults(branchData, fnLoadComplete); 
			});
	},
	
	/**
	 * Function called to add results to a dynamic node.
	 *
	 * @param branchData The branch data.
	 * @param fnLoadComplete Function to call when the dynamic data insertion has completed.
	 */
	__buildBranchExpandedResults: function(branchData, fnLoadComplete)
	{
		// Check that data was returned.
		if (branchData)
		{
			// Update the node data.
			this.__searchResults.title = branchData.title;
			this.__searchResults.tracks = branchData.tracks;
			this.__searchResults.areLoaded = true;
			this.parent.refresh();
			// Add the children (child nodes/directories), if any.
			if (branchData.directories.length > 0)
			{
				this.addCollapsedChildren(branchData.directories);
			}
			else
			{
				this.iconMode = 1;
			}
		}
		else
		{
			// Ensure this node won't load again.
			this.__searchResults.areLoaded = true;
			if (!this.children || this.children.length == 0)
			{
				// Set the icon mode as there are no children.
				this.iconMode = 1;
			}
			this.parent.refresh();
		}
		
		// Loading complete.
		fnLoadComplete();
	}
});