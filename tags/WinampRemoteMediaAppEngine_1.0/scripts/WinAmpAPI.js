/** Global variables. **/
var winAmpAPI = false;

var CLASSIC_COLOUR_SCHEME = {'0': '#000000',
							'1': '#00FF00',
							'2': '#292939',
							'3': '#000000',
							'4': '#00FF00',
							'5': '#3F3F58',
							'6': '#0000C3',
							'7': '#3F3F58',
							'8': '#CBCBCB',
							'9': '#4A4A67',
							'10': '#2E2E3F',
							'11': '#000000',
							'12': '#2E2E3F',
							'13': '#000000',
							'14': '#000000',
							'15': '#000000',
							'16': '#000000',
							'17': '#292939',
							'18': '#00FF00',
							'19': '#0000C3',
							'20': '#00FF00',
							'21': '#000082',
							'22': '#000000',
							'23': '#000000'};

// Check that hosting application has WinAmp API.
/*if (window.external &&
	"PlayQueue" in window.external &&
	"Enqueue" in window.external.PlayQueue &&
	"Skin" in window.external &&
	"GetClassicColor" in window.external.Skin &&
	"MediaCore" in window.external &&
	"IsRegisteredExtension" in window.external.MediaCore)*/
function checkForWinAmpAPI()
{
	if (window.external &&
		"Enqueue" in window.external &&
		"GetClassicColor" in window.external &&
		"font" in window.external &&
		"fontsize" in window.external &&
		"IsRegisteredExtension" in window.external &&
		"GetMetadata" in window.external)	// Can't be bothered yet to work out how to pass objects back from C++.
	{
		winAmpAPI = true;
	}
	else
	{
		alert("The hosting container does not expose the redcaza JavaScript API, e.g.: window.external.Method.\n You will not be able to listen to or view media.");
    }
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
 * Gets skin colour of UI elements.
 * 
 * @param classicColourNumber A number in the range 0-23 (see: http://dev.winamp.com/wiki/Complete_JavaScript_API_technology_framework#GetClassicColor.28.29).
 */
function winampGetClassicColour(classicColourNumber)
{
	if (winAmpAPI)
	{
		var colourRef = window.external.GetClassicColor(classicColourNumber);
		if (colourRef)
		{
			return colourRef;
		}
		else
		{
			// Error.
			return -1;
		}
	}
	else
	{
		// No data; WinAmp API not accessible. Use classic colour scheme as default.
		if (classicColourNumber in CLASSIC_COLOUR_SCHEME)
		{
			return CLASSIC_COLOUR_SCHEME[classicColourNumber];
		}
		else
		{
			return '#000000';
		}
	}
}

/**
 * Gets the font name.
 */
function winampGetFont()
{
	if (winAmpAPI)
	{
		return window.external.font();
	}
	else
	{
		return "arial";
	}
}

/**
 * Gets the font size.
 */
function winampGetFontSize()
{
	if (winAmpAPI)
	{
		return window.external.fontsize() + "px";
	}
	else
	{
		return "1em";
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
					return "";
				}
			}
			else
			{
				// Return the number.
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
		return 0;
	}
}