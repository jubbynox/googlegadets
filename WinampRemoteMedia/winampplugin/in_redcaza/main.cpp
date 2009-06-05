#include <winsock2.h>
#include <windows.h>
#include "../../Winamp/in2.h"
#include <shlwapi.h>

#include "Main.h"
#include "ParseMediaDetails.h"
#include "InputPluginManagement.h"
#include "AskAppEngine.h"
#include "Transcoder.h"

#define RED_CAZA_PREFIX L"redcaza://"	// Prefix for files recognized by the module.

In_Module *inMod = 0;	// The currently used input module.
extern In_Module plugin; // This plugin's definition and data struct

InputPluginManagement inModManagement;	// The input plugin module management class.

MediaDetails mediaDetails; // The currently playing media details.

// Post this to the main window at end of the media (after playback as stopped during transcoding).
#define WM_EOF WM_USER+2

wchar_t* wMRL;
char* sMRL;

void SyncPluginFlags()
{
	// sync seekable state and plugin flags (field is named "UsesOutputPlug" but is actually a flags field)
	// this is the real challenging part ... we really need to make sure that these things match at all times.
	// this is problematic because it can change on the fly on a background thread and we don't have a good way of knowing when it happened
	// we're going to override our chained plugin's "SetInfo" function as a way to have a good opportunity to sync
	// these flags right at the real playback start
	if (inMod)
	{
		plugin.is_seekable = mediaDetails.seekable != 0 || inMod->is_seekable != 0 ? 1 : 0;
		plugin.UsesOutputPlug = inMod->UsesOutputPlug;
	}
}

void SetInfoHook(int bitrate, int srate, int stereo, int synched)
{
	if (inMod) // we shouldn't even get called if this is null, but it's worth checking anyway
	{
		SyncPluginFlags();
		plugin.SetInfo(bitrate, srate, stereo, synched); // call the real one
	}
}


void Config(HWND hwndParent)
{
	// empty for this example
}

void About(HWND hwndParent)
{
	// empty for this example
}

void Init()
{
	wchar_t path[MAX_PATH];
	GetModuleFileNameW(plugin.hDllInstance, path, MAX_PATH);
	PathRemoveFileSpecW(path);
	inModManagement.loadPlugins(path);
	// Link Web Control.
	hookToWinAmp(plugin.hMainWindow, plugin.hMainWindow);
	// Setup remote invocation namespace.
	ask_app_engine::setup(plugin.hMainWindow);
	transcoder::setup(plugin.hMainWindow);
}

void Quit()
{
	// Destructor of inModManagement clears memory.
	ask_app_engine::destroy();
	transcoder::destroy();
}

wchar_t* getJSONStringFromFilename(const wchar_t *file)
{
	// Get JSON string.
	wchar_t* pJSON = (wchar_t*)file;
	pJSON += 10;	// Must be length of RED_CAZA_PREFIX.
	return pJSON;
}

void GetFileInfo(const wchar_t *file, wchar_t *title, int *length_in_ms)
{
	MediaDetails tmpMediaDetails;
	if (!file || !*file)
	{
		// Use current playing details.
		tmpMediaDetails = mediaDetails;
	}
	else
	{
		// Get details from file name passed in.
		tmpMediaDetails = parseMediaDetails(getJSONStringFromFilename(file), plugin.hMainWindow);
	}

	if (title)
	{
		std::wstring wtitle = s2ws(tmpMediaDetails.title);
		wtitle.copy(title, wtitle.length(), 0);
		title[wtitle.length()] = 0; // NULL terminate.
	}

	if (length_in_ms)
	{
		*length_in_ms = tmpMediaDetails.duration * 1000;
	}
}

int InfoBox(const wchar_t *file, HWND hwndParent)
{
	if (inMod)
	{
		MediaDetails tmpMediaDetails = parseMediaDetails(getJSONStringFromFilename(file), plugin.hMainWindow);
		if (inMod->version & IN_UNICODE)
		{
			std::wstring url = s2ws(tmpMediaDetails.url);
			return inMod->InfoBox(url.c_str(), hwndParent);
		}
		else
		{
			// if our chained plugin is ANSI, 
			return inMod->InfoBox((const in_char *)tmpMediaDetails.url.c_str(), hwndParent);
		}
	}
	else
	{
		return INFOBOX_UNCHANGED;
	}
}

int IsOurFile(const wchar_t *file)
{
	if (wcsstr(file, RED_CAZA_PREFIX))
	{
		return 1;
	}
	else
	{
		return 0;
	}
}

int playUsingWinAmpModule()//const wchar_t* wFileLocation, const char* sFileLocation)
{
	// Load the associated input plugin.
	inMod = inModManagement.findInputPlugin(wMRL);
	if (inMod)
	{
		int res;
		inMod->SetInfo = SetInfoHook; // hook the SetInfo function so we can use it as an opportunity to sync plugin state
		inMod->outMod = plugin.outMod;
		if (inMod->version & IN_UNICODE)
		{
			res = inMod->Play(wMRL);
		}
		else
		{
			// if our chained plugin is ANSI, 
			res = inMod->Play((const in_char *)sMRL);
		}

		SyncPluginFlags();
		return res;
	}
	else
	{
		return 1;	// Not able to play media.
	}
}

int askAppEngine(std::string *url)
{
	// Append VLC version.
	url->append("&vlcVer=");
	url->append(transcoder::vlcVersion);
	std::wstring responseJSON;
	ask_app_engine::askAppEngine(url, responseJSON);	// Ask the App Engine.

	if (!responseJSON.empty())
	{
		// Recurse with response.
		return playMedia((wchar_t*)responseJSON.c_str());
	}
	else
	{
		return 1;	// Quit.
	}
}

int playTranscoded()
{
	int res = 1; // By default, quit.
	std::string port;

	if (transcoder::transcode(mediaDetails, port))
	{
		std::string localAddress("mms://localhost:");
		localAddress.append(port);
		std::wstring wLocalAddress(s2ws(localAddress));
		wMRL = (wchar_t*)wLocalAddress.c_str();
		sMRL = (char*)localAddress.c_str();
		res = playUsingWinAmpModule();//wLocalAddress.c_str(), localAddress.c_str());
	}

	return res;
}

int playMedia(wchar_t* pJSON)
{
	int res = 1;	// By default, quit.

	// Parse the JSON and merge with existing media details.
	MediaDetails newMediaDetails = parseMediaDetails(pJSON, plugin.hMainWindow);
	if (newMediaDetails.error)
	{
		return 1;	// An error occurred. Quit.
	}
	mediaDetails = mergeMediaDetails(newMediaDetails, mediaDetails);

	// Get the media location as a wide string.
	std::wstring wLocation = s2ws(mediaDetails.url);
	wMRL = (wchar_t*)wLocation.c_str();
	sMRL = (char*)mediaDetails.url.c_str();

	// Decide which operation to perform.
	switch (mediaDetails.operation)
	{
		case 0:	// Use WinAmp module.
			res = playUsingWinAmpModule();//wLocation.c_str(), mediaDetails.url.c_str());
			break;
		case 1: // Use transcoding.
			res = playTranscoded();
			break;
		case 2:	// Ask app engine for more information.
			res = askAppEngine(&mediaDetails.url);
			break;
		default:
			// Do nothing more. File will be skipped.
			break;
	}

	return res;
}

int Play(const wchar_t *file)
{
	// Play media.
	return playMedia(getJSONStringFromFilename(file));
}

void Pause()
{
	if (inMod)
	{
		if (mediaDetails.transcoded)
		{
			transcoder::pause();
			inMod->Stop();
			inMod->SetInfo = plugin.SetInfo; // unhook
			plugin.outMod->Close();
		}
		else
		{
			inMod->Pause();
		}
	}
}

void UnPause()
{
	if (inMod)
	{
		if (mediaDetails.transcoded)
		{
			transcoder::unPause();
			playUsingWinAmpModule();
		}
		else
		{
			inMod->UnPause();
		}
	}
}

int IsPaused()
{
	if (inMod)
	{
		return inMod->IsPaused();
	}
	else
	{
		return 0;
	}
}

void Stop()
{
	if (inMod)
	{
		inMod->Stop();
		inMod->SetInfo = plugin.SetInfo; // unhook
		plugin.outMod->Close();
		if (mediaDetails.transcoded)
		{
			transcoder::stopTranscoding();
		}
		clearMediaDetails(mediaDetails);	// Resest media details.
	}
}

int GetLength()
{
	if (inMod)
	{
		if (mediaDetails.transcoded)
		{
			return transcoder::getLength(inMod->GetOutputTime());
		}
		else
		{
			return inMod->GetLength();
		}
	}
	else
	{
		return 0;
	}
}

int GetOutputTime()
{
	if (inMod)
	{
		if (mediaDetails.transcoded)
		{
			int outputTime = transcoder::getOutputTime(inMod->GetOutputTime());
			if (outputTime == -1)
			{
				// The stream has stopped.
				// Move to next item in playlist.
				PostMessage(plugin.hMainWindow, WM_WA_MPEG_EOF, 0, 0);
			}
			return outputTime;
		}
		else
		{
			return inMod->GetOutputTime();
		}
	}
	else
	{
		return 0;
	}
}

void SetOutputTime(int time_in_ms)
{
	if (inMod)
	{
		if (mediaDetails.transcoded && mediaDetails.seekable)
		{
			transcoder::setOutputTime(time_in_ms);
		}
		else if (inMod->is_seekable)
		{
			inMod->SetOutputTime(time_in_ms);
		}
	}
}

void SetVolume(int volume)
{
	if (inMod)
	{
		inMod->outMod = plugin.outMod;
		inMod->SetVolume(volume);
	}
}

void SetPan(int pan)
{
	if (inMod)
	{
		inMod->outMod = plugin.outMod;
		inMod->SetPan(pan);
	}
}

void EQSet(int on, char data[10], int preamp)
{
	if (inMod && inMod->EQSet)
		inMod->EQSet(on, data, preamp);
}

In_Module plugin =
{
	IN_VER,	// defined in IN2.H
	"RedCaza input plugin.",
	0,	// hMainWindow (filled in by winamp)
	0,  // hDllInstance (filled in by winamp)
	"\0",	// this is a double-null limited list. "EXT\0Description\0EXT\0Description\0" etc.
	1,	// is_seekable
	1,	// uses output plug-in system
	Config,
	About,
	Init,
	Quit,
	GetFileInfo,
	InfoBox,
	IsOurFile,
	Play,
	Pause,
	UnPause,
	IsPaused,
	Stop,

	GetLength,
	GetOutputTime,
	SetOutputTime,

	SetVolume,
	SetPan,

	0,0,0,0,0,0,0,0,0, // visualization calls filled in by winamp

	0,0, // dsp calls filled in by winamp

	EQSet,

	NULL,		// setinfo call filled in by winamp

	0, // out_mod filled in by winamp
};

extern "C" __declspec(dllexport) In_Module *winampGetInModule2()
{
	return &plugin;
}