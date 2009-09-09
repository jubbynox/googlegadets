/**
 * The LastFM Results Pane UI.
 */
var LastFMResultsPaneUI = Base.extend(
{
    /**
     * Thumbnail HTML.
     */
    THUMBNAIL_HTML: '<img src="SRC" alt="ALT">',
    
    /**
     * Definition of result columns.
     */
    __columnDefs: [{key:"thumbnail", label:"Thumbnail"}, {key:"artist", label:"Artist"}],
                    
    /**
     * The data schema.
     */             
    __schema: ["thumbnail", "artist"],
    
    /**
     * The list UI.
     */
    __listUI: null,
    
    /**
     * Constructor for YouTubeResultsPaneUI.
     * 
     * @param containerId The ID of the container.
     * @param fnGetMoreResults Callback function to get more results. 
     * @param fnTracksSelected The function to invoke when tracks are selected.
     */
    constructor: function(containerId, fnGetMoreResults, fnTracksSelected)
    {
        // Setup the sites pane UI.
        this.__listUI = new SelectableTableUI(containerId, this.__columnDefs, this.__schema,
            fnTracksSelected, "Enqueue selection", fnGetMoreResults);
    },
    
    /**
     * Clears the list.
     */
    clear: function()
    {
        this.__listUI.clear();
    },
    
    /**
     * Adds a result.
     * 
     * @param result The result.
     */
    addResult: function(result)
    {
        this.__listUI.addRow(this.__parseResult(result));
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
     * Parse the result object.
     * 
     * @param result The result.
     * 
     * @return The result object.
     */
    __parseResult: function(result)
    {
        if (!result.thumbnail)
        {
            // Create HTML for thumbnail.
            var thumbnailHTML = this.THUMBNAIL_HTML.replace('SRC', result.thumbnailURL);
            result.thumbnail = thumbnailHTML.replace('ALT', result.title);
        }
        
        return result;
    },
    
    /**
     * Parse the result objects.
     * 
     * @param results The results.
     * 
     * @return The result objects.
     */
    __parseResults: function(results)
    {
        for (var index in results)
        {
            var result = results[index];
            result = this.__parseResult(result);
        }
        
        return results;
    }
});