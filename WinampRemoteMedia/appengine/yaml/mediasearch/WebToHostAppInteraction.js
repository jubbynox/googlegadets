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