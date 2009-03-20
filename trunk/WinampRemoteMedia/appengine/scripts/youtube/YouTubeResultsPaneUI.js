/**
 * The YouTube Results Pane UI.
 */
var YouTubeResultsPaneUI = Base.extend(
{
	/**
	 * Thumbnail HTML.
	 */
	THUMBNAIL_HTML: '<img src="SRC" alt="ALT" width="60">',
	
	/**
	 * Definition of result columns.
	 */
	__columnDefs: [{key:"thumbnail", label:"Thumbnail"}, {key:"title", label:"Title"}
		, {key:"duration", label:"Duration"}],
				    
	/**
	 * The data schema.
	 */			    
	__schema: ["thumbnail", "title", "duration", "videoID"],
	
	/**
	 * The list UI.
	 */
	__listUI: null,
	
	/**
	 * Constructor for YouTubeResultsPaneUI.
	 * 
	 * @param containerId The ID of the container.
	 * @param fnGetMoreResults Callback function to get more results. 
	 */
	constructor: function(containerId, fnGetMoreResults)
	{
		// Setup the sites pane UI.
		this.__listUI = new SelectableTableUI(containerId, this.__columnDefs, this.__schema,
				function(rowData)
				{
					alert(rowData[0].videoID);
				},
				null, fnGetMoreResults);
	},
	
	/**
	 * Clears the list.
	 */
	clear: function()
	{
		this.__listUI.clear();
	},
	
	/**
	 * Adds results.
	 * 
	 * @param results The results.
	 */
	addResults: function(results)
	{
		// Update list UI.
		if (results.length > 0)
		{
			this.__listUI.addRows(this.__parseResults(results));
		}
		else
		{
			this.clear();
		}
	},
	
	/**
     * Parse the result objects.
     * 
     * @param results The results.
     */
    __parseResults: function(results)
    {
    	for (var index in results)
    	{
    		var result = results[index];
    		if (!result.thumbnail)
    		{
	    		// Create HTML for thumbnail.
	    		var thumbnailHTML = this.THUMBNAIL_HTML.replace('SRC', result.thumbnailURL);
	    		result.thumbnail = thumbnailHTML.replace('ALT', result.title);
    		}
    	}
    	
    	return results;
    }
});