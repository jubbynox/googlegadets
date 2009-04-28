/** Global variables. **/
var winAmpAPI = false;

// Check that hosting application has WinAmp API.
/*if (window.external &&
	"PlayQueue" in window.external &&
	"Enqueue" in window.external.PlayQueue &&
	"Skin" in window.external &&
	"GetClassicColor" in window.external.Skin &&
	"MediaCore" in window.external &&
	"IsRegisteredExtension" in window.external.MediaCore)*/
if (window.external &&
	"Enqueue" in window.external &&
	"GetClassicColor" in window.external &&
	"IsRegisteredExtension" in window.external &&
	"GetMetadata" in window.external)	// Can't be bothered yet to work out how to pass objects back from C++.
{
	winAmpAPI = true;
}
else
{
	//alert("The hosting container does not expose the WinAmp JavaScript API, e.g.: window.external.API.Method.\n You will not be able to listen to or view media.");
	alert("The hosting container does not expose the Web Media JavaScript API, e.g.: window.external.Method.\n You will not be able to listen to or view media.");
}

/**
 * Queues a song in WinAmp.
 * 
 * @param url The URL to the song.
 * @param name The name of the song.
 * @param length the length of the song.
 */
function winampEnqueue(url, name, length)
{
	if (winAmpAPI)
	{
		window.external.Enqueue(url, name, length);
	}
}

/**
 * Gets the specified meta data info.
 * 
 * @param url The URL to the song.
 * @param tag The tag name of the meta data.
 * 
 * @return -1 error; 0 OK, but no data; 1 No WinAmp API.
 */
function winampGetMetadata(url, tag)
{
	if (winAmpAPI)
	{
		var metadata = window.external.GetMetadata(url, tag);
		if (metadata)
		{
			// Test whether a number has been returned.
			if (isNaN(parseInt(metadata)))
			{
				// Remove all the crap that my WinAmp API is leaving on the strings.
				var tmp = $.trim(metadata);
				if (tmp.length > 1)
				{
					return tmp.substring(0, tmp.length-1);
				}
				else
				{
					return 0;
				}
			}
			else
			{
				return metadata;
			}
		}
		else
		{
			// Error retrieving meta data.
			return -1;
		}
	}
	else
	{
		// No data; WinAmp API not accessible.
		return 1;
	}
}