/**
 * The Google Media Search UI.
 */
var YouTubeUI = Base.extend(
{
	/**
	 * The layout.
	 */
	__layout: null,
	
	/**
	 * The results pane UI.
	 */
	__resultsPaneUI: null,
	
	/**
	 * Constructor for YouTubeUI.
	 * 
	 * @param containerId The ID of the container.
	 * @param fnGetMoreResults Callback function to get more results.
	 */
	constructor: function(containerId, fnGetMoreResults)
	{
		// Setup IDs for panes.
		var resultsId = containerId + "_resultsPane";
		
		// Setup sizes.
		var elContainer = $('#' + containerId);
		var height = $(window).height() - elContainer.offset().top - 40; // Leave gap at bottom.
		var width = elContainer.width();
		
		// Create the layout.
		this.__layout = new YAHOO.widget.Layout(containerId, {height: height, width: width,
			units: [
        		{ position: 'center', scroll: true, body: '<div id="' + resultsId + '"></div>' }]});
		this.__layout.render();
		
		// Create the results pane.
		this.__resultsPaneUI = new YouTubeResultsPaneUI(resultsId, fnGetMoreResults);
	},
	
	/**
	 * Clears all results.
	 */
	clear: function()
	{
		// Clear the results pane UI.
		this.__resultsPaneUI.clear();
	},
	
	/**
	 * Adds results.
	 * 
	 * @param results The results.
	 */
	addResults: function(results)
	{
		this.__resultsPaneUI.addResults(results);
	}
});