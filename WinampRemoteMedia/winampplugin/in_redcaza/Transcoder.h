#include <windows.h>
#include <vlc/vlc.h>
#include "ParseMediaDetails.h"
#include <sstream>
#include "time.h"

namespace transcoder	// LIB_VLC is a singleton, so is this.
{
	HWND wndHandle;
	const char *vlcVersion = "?";
	const int startPort = 1755;	// MMS port.
	libvlc_instance_t * inst = 0;	// LIB VLC instance
	libvlc_exception_t ex;	// LIB VLC exception handler.
	libvlc_media_player_t *mediaPlayer;	// The media player.
	libvlc_media_player_t *tempMediaPlayer;	// The media player to test for stream connectivity.
	bool playing = false;
	bool endReached = false;
	bool buffering = false;
	bool error = false;
	bool tmpBuffering = false;
	bool tmpError = false;
	bool modConnected = false;	// Whether or not the module has connected to the stream.
	bool transcodeInvoked = false;	// Whether or not transcoding has been invoked.
	int length = 0;	// Length of the stream.
	clock_t pauseStart = 0;
	int pauseOffset = 0;
	int lastModTime = 0;
	int endTrapStarted = 0;	// When the end trap was started.
	int modBreakdownTrapStarted = 0;	// When the mod breakdown trap was started.

	bool handleError(libvlc_exception_t *exception)
	{
		if (libvlc_exception_raised (exception))
		{
			std::string exString(libvlc_exception_get_message(exception));
			std::wstring exWString = s2ws(exString);
			MessageBox(wndHandle, exWString.c_str(), L"Transcoder error", MB_OK | MB_ICONERROR);
			return true;
		}
		return false;
	}

	void stopTranscoding()
	{
		playing = false;
		endReached = false;
		buffering = false;
		error = false;
		tmpBuffering = false;
		tmpError = false;
		modConnected = false;
		transcodeInvoked = false;
		length = 0;
		pauseStart = 0;
		pauseOffset = 0;
		lastModTime = 0;
		endTrapStarted = 0;
		modBreakdownTrapStarted = 0;

		if (mediaPlayer)
		{
			// Stop and release media player.
			libvlc_media_player_stop(mediaPlayer, &ex);
			libvlc_exception_clear(&ex);
		}
	}

	void destroy()
	{
		if (inst)
		{
			// Stop any active transcoding.
			stopTranscoding();

			if (mediaPlayer)
			{
				libvlc_media_player_release(mediaPlayer);
				mediaPlayer = 0;
			}

			if (tempMediaPlayer)
			{
				libvlc_media_player_release(tempMediaPlayer);
				tempMediaPlayer = 0;
			}

			if (inst)
			{
				// Release VLC.
				libvlc_release(inst);
				inst = 0;
			}

			libvlc_exception_clear(&ex);
		}
	}

	void trapPlayingEvent(const libvlc_event_t *, void *)
	{
		playing = transcodeInvoked;
	}

	void trapEndReachedEvent(const libvlc_event_t *, void *)
	{
		endReached = transcodeInvoked;
		playing = false;
	}

	void trapBufferingEvent(const libvlc_event_t *, void *)
	{
		buffering = transcodeInvoked;
	}

	void trapErrorEvent(const libvlc_event_t *, void *)
	{
		error = transcodeInvoked;
	}

	void trapTmpBufferingEvent(const libvlc_event_t *, void *)
	{
		tmpBuffering = transcodeInvoked;
	}

	void trapTmpErrorEvent(const libvlc_event_t *, void *)
	{
		tmpError = transcodeInvoked;
	}

	bool attachEventHandlers(libvlc_event_manager_t *eventManager, bool useTemporary)
	{
		if (!useTemporary)
		{
			libvlc_event_attach(eventManager, libvlc_MediaPlayerPlaying, (libvlc_callback_t)trapPlayingEvent, NULL, &ex);
			libvlc_event_attach(eventManager, libvlc_MediaPlayerEndReached, (libvlc_callback_t)trapEndReachedEvent, NULL, &ex);
			libvlc_event_attach(eventManager, libvlc_MediaPlayerBuffering, (libvlc_callback_t)trapBufferingEvent, NULL, &ex);
			libvlc_event_attach(eventManager, libvlc_MediaPlayerEncounteredError, (libvlc_callback_t)trapErrorEvent, NULL, &ex);
			if (handleError(&ex))
			{
				destroy();
				return false;
			}
		}
		else
		{
			libvlc_event_attach(eventManager, libvlc_MediaPlayerBuffering, (libvlc_callback_t)trapTmpBufferingEvent, NULL, &ex);
			libvlc_event_attach(eventManager, libvlc_MediaPlayerEncounteredError, (libvlc_callback_t)trapTmpErrorEvent, NULL, &ex);
			if (handleError(&ex))
			{
				destroy();
				return false;
			}
		}
		return true;
	}

	std::wstring getVLCPath()
	{
		std::wstring pluginPathOption;
		HKEY hKey;
		DWORD buffersize = 1024;
		wchar_t* lpData = new wchar_t[buffersize];

		if (RegOpenKeyEx (HKEY_LOCAL_MACHINE, L"SOFTWARE\\VideoLAN\\VLC", NULL, KEY_READ, &hKey) == ERROR_SUCCESS)
		{
			RegQueryValueEx(hKey, L"InstallDir", NULL, NULL, (LPBYTE)lpData, &buffersize);
			pluginPathOption.assign(lpData);
		}

		return pluginPathOption;
	}

	std::string getPluginPathOption(std::wstring vlcPath)
	{
		std::wstring pluginPathOption(vlcPath);
		pluginPathOption.insert(0, L"--plugin-path=");
		pluginPathOption.append(L"\\plugins");
		return ws2s(pluginPathOption);
	}

	bool loadVLC(HWND handle, std::wstring vlcPath)
	{
		if (vlcPath.length() == 0)
		{
			MessageBox(handle, L"Unable to load VLC libraries.\nWill not be able to play some types of online media.\nCheck VLC is installed.", L"redcaza Error", MB_OK | MB_ICONWARNING);
			return false;
		}
		HMODULE modHandle;

		// Load core.
		std::wstring dllPath(vlcPath);
		dllPath.append(L"\\libvlccore.dll");
		modHandle = LoadLibrary(dllPath.c_str());
		if (modHandle == NULL)
		{
			dllPath.insert(0, L"Unable to load: ");
			dllPath.append(L"\nWill not be able to play some types of online media.\nCheck VLC is installed.");
			MessageBox(handle, dllPath.c_str(), L"redcaza Error", MB_OK | MB_ICONWARNING);
			return false;
		}

		// Load library.
		dllPath.assign(vlcPath);
		dllPath.append(L"\\libvlc.dll");
		modHandle = LoadLibrary(dllPath.c_str());
		if (modHandle == NULL)
		{
			dllPath.insert(0, L"Unable to load: ");
			dllPath.append(L"\nWill not be able to play some types of online media.\nCheck VLC is installed.");
			MessageBox(handle, dllPath.c_str(), L"redcaza Error", MB_OK | MB_ICONWARNING);
			return false;
		}

		return true;
	}

	bool setup(HWND handle)
	{
		if (!inst)
		{
			wndHandle = handle;
			std::wstring vlcPath = getVLCPath();
			if (!loadVLC(handle, vlcPath))
			{
				return false;	// Could not load VLC libraries.
			}

			std::string pluginPathOption = getPluginPathOption(vlcPath);
			const char * const vlc_args[] = {
					  "-I", "dummy", /* Don't use any interface */
					  pluginPathOption.c_str(),
					  "--ignore-config", /* Don't use VLC's config */
					  "--http-caching", "5000",
					  "--sout-mux-caching", "1000",
					  "--sout-keep"};
			libvlc_exception_init (&ex);

			/* init vlc modules, should be done only once */
			inst = libvlc_new(sizeof(vlc_args) / sizeof(vlc_args[0]), vlc_args, &ex);
			
			// Check for exception.
			if (handleError(&ex))
			{
				destroy();
				return false;
			}

			// Initialise media player.
			mediaPlayer = libvlc_media_player_new(inst, &ex);

			// Check for exception.
			if (handleError(&ex))
			{
				destroy();
				return false;
			}

			// Initialise temp media player.
			tempMediaPlayer = libvlc_media_player_new(inst, &ex);

			// Check for exception.
			if (handleError(&ex))
			{
				destroy();
				return false;
			}

			// Get an event manager for the media player.
			libvlc_event_manager_t *eventManager = libvlc_media_player_event_manager(mediaPlayer, &ex);
			if (handleError(&ex))
			{
				destroy();
				return false;
			}

			// Attach events.
			if (!attachEventHandlers(eventManager, false))
			{
				destroy();
				return false;
			}

			// Get the event manager for the temporary media player.
			eventManager = libvlc_media_player_event_manager(tempMediaPlayer, &ex);
			if (handleError(&ex))
			{
				destroy();
				return false;
			}

			// Attach events.
			if (!attachEventHandlers(eventManager, true))
			{
				destroy();
				return false;
			}

			// Get the version.
			vlcVersion = libvlc_get_version();
		}

		return true;
	}

	int getFreePort()
	{
		int port = -1;	// -1 means error (or no free ports).
		int end = 5555;	// That would have been a lot of used ports!
		SOCKET sock;
		SOCKADDR_IN sin;
		WSADATA wsadata;
		
		if (WSAStartup(MAKEWORD(1, 1), &wsadata) != 0)
		{
			WSACleanup();
			return -1;	// Error.
		}

		port = startPort;
		while(port < end)
		{
			// Setup socket details.
			sock = socket(AF_INET, SOCK_STREAM, 0);
			if(sock == INVALID_SOCKET)
			{
				port = end;
				break;
			}
			sin.sin_family = AF_INET;
			sin.sin_addr.S_un.S_un_b.s_b1 = 127; 
			sin.sin_addr.S_un.S_un_b.s_b2 = 0; 
			sin.sin_addr.S_un.S_un_b.s_b3 = 0; 
			sin.sin_addr.S_un.S_un_b.s_b4 = 1;
			sin.sin_port = htons(port);

			// Attempt to connect.
			if (connect(sock, (sockaddr*)&sin, sizeof(sin)) == SOCKET_ERROR)
			{
				// Port not in use.
				closesocket(sock);
				break;
			}
			closesocket(sock);
			
			// Try next port.
			port++;
		}

		WSACleanup();
		if (port == end)
		{
			return -1;
		}

		return port;
	}

	libvlc_media_t* setupMedia(MediaDetails &mediaDetails, const char *port)
	{
		const char* input = mediaDetails.url.c_str();	// The remote URL.

		// Setup local URL.
		std::string output(mediaDetails.transcodeConfig.c_str());
		size_t index = output.find("DST");
		if (index == std::string::npos)
		{
			// There was a problem with the returned string. Report error?
			return 0;
		}
		std::string localAddress("localhost:");
		localAddress.append(port);
		output.replace(index, 3, localAddress.c_str());
		output.insert(0, ":sout=");

		// Create media
		libvlc_media_t* media = libvlc_media_new(inst, (char*)input, &ex);
		if (handleError(&ex))
		{
			libvlc_exception_clear(&ex);
			return 0;
		}

		// Setup output options.
		libvlc_media_add_option(media, (char*)output.c_str(), &ex);
		if (handleError(&ex))
		{
			libvlc_exception_clear(&ex);
			return 0;
		}

		return media;
	}

	libvlc_state_t startMediaPlayer(libvlc_media_t* media)
	{
		playing = false;
		buffering = false;
		error = false;

		// Set media to player.
		libvlc_media_player_set_media(mediaPlayer, media, &ex);
		// Release the media.
		libvlc_media_release(media);
		media = 0;
		if (handleError(&ex))
		{
			libvlc_exception_clear(&ex);
			return libvlc_Error;
		}

		// Attempt to start playing.
		libvlc_media_player_play(mediaPlayer, &ex);
		if (handleError(&ex))
		{
			libvlc_exception_clear(&ex);
			return libvlc_Error;
		}

		// Wait for something to happen.
		while (!(playing || error))
		{
			Sleep(1);
		}

		// Something went wrong.
		if (error)
		{
			return libvlc_Error;
		}

		return libvlc_Playing;
	}

	libvlc_state_t waitForTranscodeStream(const char *port)
	{
		tmpBuffering = false;
		tmpError = false;

		// Create temporary media
		std::string localAddress("mmsh://localhost:");
		localAddress.append(port);
		libvlc_media_t *tempMedia = libvlc_media_new(inst, localAddress.c_str(), &ex);
		if (handleError(&ex))
		{
			libvlc_exception_clear(&ex);
			return libvlc_Error;
		}

		// Set media to player.
		libvlc_media_player_set_media(tempMediaPlayer, tempMedia, &ex);
		// Release the media.
		libvlc_media_release(tempMedia);
		tempMedia = 0;
		if (handleError(&ex))
		{
			libvlc_exception_clear(&ex);
			return libvlc_Error;
		}

		// Keep trying to connect - until a time-out or otherwise.
		clock_t start_time;
		start_time = clock();
		while (!(tmpBuffering || tmpError))
		{
			// Attempt to start playing.
			libvlc_media_player_play(tempMediaPlayer, &ex);
			if (handleError(&ex))
			{
				libvlc_exception_clear(&ex);
				return libvlc_Error;
			}

			// Wait for something to happen.
			while (!(tmpBuffering || tmpError))
			{
				Sleep(250);
			}
			tmpError = false;	// Reset for next attempt.

			// Stop this connection attempt.
			libvlc_media_player_stop(tempMediaPlayer, &ex);
			libvlc_exception_clear(&ex);

			if (clock()-start_time > 10000)	// Time-out (10s).
			{
				tmpError = true;
			}
		}

		if (tmpError)
		{
			return libvlc_Error;
		}
		return libvlc_Playing;
	}

	bool transcode(MediaDetails &mediaDetails, std::string &strPort)	// Return the port number used.
	{
		transcodeInvoked = true;
		int port = getFreePort();
		if (port == -1)
		{
			MessageBox(wndHandle, L"Unable to find free port for transcoding.", L"Transcoder error", MB_OK | MB_ICONERROR);
			return false;
		}

		// Convert port integer to string.
		std::stringstream temp;
		temp << port;
		strPort.assign(temp.str());

		// Setup media.
		libvlc_media_t* media = setupMedia(mediaDetails, strPort.c_str());
		
		// Start media player.
		libvlc_state_t state = startMediaPlayer(media);
		if (state == libvlc_Error)
		{
			// Log an error?
			return false;
		}

		Sleep(1000);	// The length of --sout-mux-caching option.

		// Wait until stream available.
		state = waitForTranscodeStream(strPort.c_str());
		if (state == libvlc_Error)
		{
			stopTranscoding();
			// Log an error?
			return false;
		}

		// Pause and move back to start now that stream is available.
		libvlc_media_player_pause(mediaPlayer, &ex);
		if (libvlc_exception_raised(&ex))
		{
			libvlc_exception_clear(&ex);
			return false;
		}
		libvlc_media_player_set_position(mediaPlayer, 0, &ex);
		if (handleError(&ex))
		{
			libvlc_exception_clear(&ex);
			return false;
		}

		return true;
	}

	void pause()
	{
		libvlc_media_player_pause(mediaPlayer, &ex);
		if (libvlc_exception_raised(&ex))
		{
			libvlc_exception_clear(&ex);
		}
		else
		{
			pauseStart = clock();
		}
	}

	void unPause()
	{
		libvlc_media_player_play(mediaPlayer, &ex);
		if (libvlc_exception_raised(&ex))
		{
			libvlc_exception_clear(&ex);
		}
		else if (pauseStart > 0)
		{
			pauseOffset = pauseOffset + (clock() - pauseStart);
		}
	}

	int getLength(int modTime)
	{
		// Determine length.
		if (length == 0)
		{
			length = (int)libvlc_media_player_get_length(mediaPlayer, &ex);
			if (libvlc_exception_raised(&ex))
			{
				libvlc_exception_clear(&ex);
				length = 0;
			}
		}

		// Start the stream if the module has just connected.
		if (!modConnected && transcodeInvoked)
		{
			modConnected = true;
			unPause();
		}

		return length;
	}

	int getOutputTime(int modTime)
	{
		if (transcodeInvoked)	// Don't bother checing if not transcoding.
		{
			// Check for end of stream.
			if (endReached && endTrapStarted == 0 && modTime == lastModTime)	// Difficult to determine when mod has reached the end of the stream!
			{
				// Start a timer.
				endTrapStarted = clock();
			}
			else if (endReached && endTrapStarted != 0 && modTime == lastModTime && clock()-endTrapStarted > 1000)	// 1 second wait.
			{
				// 1 second has passed without anything happening. Assume end.
				endTrapStarted = 0;
				return -1;
			}
			else if (endReached && endTrapStarted != 0 && modTime != lastModTime)
			{
				// Must have been a blip; continue...
				endTrapStarted = 0;
			}
			// Check for mod break down.
			else if (modTime == lastModTime && modBreakdownTrapStarted == 0 && !endReached)
			{
				// Start a timer.
				modBreakdownTrapStarted = clock();
			}
			else if (modTime == lastModTime && modBreakdownTrapStarted != 0 && !endReached && clock()-modBreakdownTrapStarted > 60000) // 1 minute wait.
			{
				// 1 minute has passed without anything happening. Assume mod has broken.
				modBreakdownTrapStarted = 0;
				return -1;
			}
			else if (modBreakdownTrapStarted != 0 && !endReached && modTime != lastModTime)
			{
				// Blip is over; continue...
				modBreakdownTrapStarted = 0;
			}
		}

		lastModTime = modTime;
		int calcTime = modTime - pauseOffset;
		return calcTime >= 0 ? calcTime : 0;	// Never return negative number, as the main method uses this to determine the end of the stream.
	}

	void setOutputTime(int newTime, int modTime)
	{
		int calcTime = modTime - pauseOffset;	// The time WinAmp is showing.

		// Calculate buffer size.
		int bufferSize;
		int vlcPos = (int)(length * libvlc_media_player_get_position(mediaPlayer, &ex));
		if (libvlc_exception_raised(&ex))
		{
			libvlc_exception_clear(&ex);
			return;
		}
		bufferSize = vlcPos - calcTime;

		// Calculate new pause offset.
		int newPauseOffset = pauseOffset + (calcTime - (newTime-bufferSize));

		if (calcTime - newPauseOffset < modTime)	// Will WinAmp let this new time be displayed with stopping for some reason?
		{
			// Move VLC position.
			libvlc_media_player_set_position(mediaPlayer, newTime / (length*1.0), &ex);
			if (libvlc_exception_raised(&ex))
			{
				libvlc_exception_clear(&ex);
				return;
			}

			// Set new pause offset.
			pauseOffset = newPauseOffset;
		}
	}
}