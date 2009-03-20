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