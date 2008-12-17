/**
 * Handles the display of results.
 */
var ResultsUI = Base.extend(
{
	/**
	 * Constructor.
	 *
	 * @param resultsId The element ID of the results pane.
	 */
	constructor: function(resultsId)
	{
		// Get the results view.
		this.__elResults = $('#' + resultsId);//[0];
		
		// Work out height and width.
		var width = this.__elResults.width();
		var height = $(window).height() - this.__elResults.offset().top - 40; // Leave a gap at the bottom.
		
		// Split the results pane into 2 for results and results target.
		var resultsTargetId = resultsId + '_resultsTargetPane';
		var resultsSourceId = resultsId + '_resultsPane';
		var tabsId = resultsSourceId + '_tabs';
		layout = new YAHOO.widget.Layout(resultsId, {height: height, width: width,
			units: [
        		{ position: 'right', width: 200, body: '<div id="' + resultsTargetId + '" style="width:100%;height:100%"></div>' },
        		{ position: 'center', gutter: '0 2 0 0', body: '<div id="' + resultsSourceId + '"><div id="' + tabsId + '"></div></div>' }]});
		layout.render();
		
		/** Target pane setup. **/
		new YAHOO.util.DDTarget(resultsTargetId, 'media');
		
		/** Media interaction setup. **/
		this.__webToHostAppInteraction = new WebToHostAppInteraction();
		this.__webToHostAppInteraction.registerAddToPlaylistId(resultsTargetId);
		
		
		/** Results pane setup. **/
		
		// Setup tabs within results pane.
		this.__tabs = new YAHOO.widget.TabView(tabsId);
		this.__elTab = $('#' + tabsId);

		// Instantiate Google Media Results UI.
		this.__googleMediaResultsUi = new GoogleMediaResultsUI(this.__webToHostAppInteraction);
		
		// Hide the tabs view.
		this.__elTab.hide();
	},
	
	/**
	 * Holds the base of tab names.
	 */
	__TAB_NAME_BASE: 'searchTab',
	
	/**
	 * The results pane DOM element.
	 */
	__elResults: null,
	
	/**
	 * The tabs object.
	 */
	__tabs: null,
	
	/**
	 * The tabs DOM elements.
	 */
	__elTab: null,
	
	/**
	 * The next searchTab number.
	 */
	__nextTabNumber: 0,
	
	/**
	 * The height of the tab view pane.
	 */
	__tabViewHeight: 0,
	
	/**
	 * The width of the tab view pane.
	 */
	__tabViewWidth: 0,
	
	/**
	 * The media interaction object.
	 */
	__webToHostAppInteraction: null,
	
	/**
	 * Interface for Google search results.
	 */
	__googleMediaResultsUi: null,
	
	/**
	 * Adds a tab.
	 *
	 * @param label The name of the tab.
	 */
	__addTab: function(label)
	{
		// Make the tab ID.
		var tabId = this.__TAB_NAME_BASE + this.__nextTabNumber;
		this.__nextTabNumber++;
		
		// Show tab pane if this is the first one to be created.
		var isActive = false;
    	if (this.__nextTabNumber == 1)
    	{
    		isActive = true;
    		this.__elTab.show();
    	}
		
		// Add the tab.
		this.__tabs.addTab(new YAHOO.widget.Tab(
		{
        	label: label,
        	content: '<div id="' + tabId + '"></div>',
        	active: isActive
    	}));
    	
    	// Work out the height and width of the visible tab view.
    	if (isActive)
    	{
    		var activeTab = $('#' + tabId);
			var yCoord = activeTab.offset().top;
			this.__tabViewHeight = $(window).height() - yCoord - 20; // Leave a gap at the bottom.
			this.__tabViewWidth = activeTab.width();
    	}
    	
    	return tabId;
	},

	/**
	 * Adds a Google search results tree tab.
	 *
	 * @param searchString The search string.
	 * @param url The URL.
	 * @param resultNodes An array of result nodes from the search.
	 * @param resultDirectories An array of result directories beneath the last node.
	 * @param fnGetMoreResults Function to call when more results are required.
	 */
	addGoogleSearchResultsTree: function(searchString, url, resultNodes, resultDirectories, fnGetMoreResults)
	{
		// Add the tab and insert results.
		var tabId = this.__addTab(url + ' (' + searchString + ')');
		this.__googleMediaResultsUi.buildMediaTree(this.__tabViewHeight, this.__tabViewWidth, tabId, this.__elResults, resultNodes, resultDirectories, fnGetMoreResults);
	}
});