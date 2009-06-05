#include <windows.h>
#include <vlc/vlc.h>
#include "ParseMediaDetails.h"
#include <sstream>
#include "time.h"

namespace transcoder	// LIB_VLC is a singleton, so is this.
{
	HWND wndHandle;
	const char *vlcVersion;
	const int startPort = 1755;	// MMS port.
	libvlc_instance_t * inst = 0;	// LIB VLC instance
	libvlc_exception_t ex;	// LIB VLC exception handler.
	libvlc_media_player_t *mediaPlayer;	// The media player.
	libvlc_media_player_t *tempMediaPlayer;	// The media player to test for stream connectivity.
	bool playing = false;
	bool endReached = false;
	bool buffering = false;
	bool error = false;
	bool tmpPlaying = false;
	bool tmpEndReached = false;
	bool tmpBuffering = false;
	bool tmpError = false;
	bool modConnected = false;	// Whether or not the module has connected to the stream.
	bool transcodeInvoked = false;	// Whether or not transcoding has been invoked.
	//bool streamOffsetCalculated = false;
	int length = 0;	// Length of the stream.
	int bufferLength = 0;	// The calculated module buffer length.
	//int streamOffset = 0;	// The offset between the actual stream and that being played.
	clock_t pauseStart;
	int pauseOffset = 0;
	int lastModTime = 0;
	int endTrapStarted = 0;	// When the end trap was started.

	bool handleError(libvlc_exception_t *exception)
	{
		if (libvlc_exception_raised (exception))
		{
			std::string exString(libvlc_exception_get_message(exception));
			std::wstring exWString = s2ws(exString);
			MessageBox(wndHandle, exWString.c_str(), L"Transcoder error", MB_OK);
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
		tmpPlaying = false;
		tmpEndReached = false;
		tmpBuffering = false;
		tmpError = false;
		//streamOffsetCalculated = false;
		modConnected = false;
		transcodeInvoked = false;
		length = 0;
		bufferLength = 0;
		//streamOffset = 0;
		pauseOffset = 0;
		lastModTime = 0;
		endTrapStarted = 0;

		if (mediaPlayer)
		{
			// Stop and release media player.
			libvlc_media_player_stop(mediaPlayer, &ex);
			libvlc_exception_clear(&ex);
		}
	}

	void destroy()
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

	void trapTmpPlayingEvent(const libvlc_event_t *, void *)
	{
		tmpPlaying = transcodeInvoked;
	}

	void trapTmpEndReachedEvent(const libvlc_event_t *, void *)
	{
		tmpEndReached = transcodeInvoked;
		tmpPlaying = false;
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
			libvlc_event_attach(eventManager, libvlc_MediaPlayerPlaying, (libvlc_callback_t)trapTmpPlayingEvent, NULL, &ex);
			libvlc_event_attach(eventManager, libvlc_MediaPlayerEndReached, (libvlc_callback_t)trapTmpEndReachedEvent, NULL, &ex);
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

		if (RegOpenKeyEx (HKEY_LOCAL_MACHINE, L"SOFTWARE\\VideoLAN\\VLC", NULL, KEY_READ, &hKey)  == ERROR_SUCCESS)
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

	void loadVLC(std::wstring vlcPath)
	{
		// Load core.
		std::wstring dllPath(vlcPath);
		dllPath.append(L"\\libvlccore.dll");
		LoadLibrary(dllPath.c_str());

		// Load library.
		dllPath.assign(vlcPath);
		dllPath.append(L"\\libvlc.dll");
		LoadLibrary(dllPath.c_str());
	}

	void setup(HWND handle)
	{
		if (!inst)
		{
			wndHandle = handle;
			std::wstring vlcPath = getVLCPath();
			loadVLC(vlcPath);
			std::string pluginPathOption = getPluginPathOption(vlcPath);
			const char * const vlc_args[] = {
					  "-I", "dummy", /* Don't use any interface */
					  pluginPathOption.c_str(),
					  "--ignore-config", /* Don't use VLC's config */
					  "--http-caching", "5000",
					  "--sout-mux-caching", "500",
					  "--sout-keep"};
			libvlc_exception_init (&ex);

			/* init vlc modules, should be done only once */
			inst = libvlc_new(sizeof(vlc_args) / sizeof(vlc_args[0]), vlc_args, &ex);
			
			// Check for exception.
			if (handleError(&ex))
			{
				destroy();
				return;
			}

			// Initialise media player.
			mediaPlayer = libvlc_media_player_new(inst, &ex);

			// Check for exception.
			if (handleError(&ex))
			{
				destroy();
				return;
			}

			// Initialise temp media player.
			tempMediaPlayer = libvlc_media_player_new(inst, &ex);

			// Check for exception.
			if (handleError(&ex))
			{
				destroy();
				return;
			}

			// Get an event manager for the media player.
			libvlc_event_manager_t *eventManager = libvlc_media_player_event_manager(mediaPlayer, &ex);
			if (handleError(&ex))
			{
				destroy();
				return;
			}

			// Attach events.
			if (!attachEventHandlers(eventManager, false))
			{
				destroy();
				return;
			}

			// Get the event manager for the temporary media player.
			eventManager = libvlc_media_player_event_manager(tempMediaPlayer, &ex);
			if (handleError(&ex))
			{
				destroy();
				return;
			}

			// Attach events.
			if (!attachEventHandlers(eventManager, true))
			{
				destroy();
				return;
			}

			// Get the version.
			vlcVersion = libvlc_get_version();
		}
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
		tmpPlaying = false;
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
			MessageBox(wndHandle, L"Unable to find free port for transcoding.", L"Transcoder error", MB_OK);
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

		Sleep(500);	// The length of --sout-mux-caching option.

		// Wait until stream available.
		/*state = waitForTranscodeStream(strPort.c_str());
		if (state == libvlc_Error)
		{
			stopTranscoding();
			// Log an error?
			return false;
		}*/

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

		
		
		/*float position = 0;
		while (position == 0)
		{
			Sleep(1);
			position = libvlc_media_player_get_position(mp, &ex);
			if (handleError(handle, &ex))
			{
				libvlc_exception_clear(&ex);
				return 0;
			}
		}*/

		/*// Add this broadcast.
		libvlc_vlm_add_broadcast(inst, "broadcast", (char*)input, (char*)output.c_str(), numVLCOptions, vlcOptions, 1, 0, &ex);
		// Check for exception.
		if (handleError(handle, &ex))
		{
			libvlc_exception_clear(&ex);
			return 0;
		}

		// Start playing the media.
		libvlc_vlm_play_media(inst, "broadcast", &ex);
		// Check for exception.
		if (handleError(handle, &ex))
		{
			libvlc_exception_clear(&ex);
			return 0;
		}

		// Work out if and when to let WinAmp connect to stream.
		int length = libvlc_vlm_get_media_instance_length(inst, "broadcast", NULL, &ex);
		while (length <= 0 && !handleError(handle, &ex))
		{
			libvlc_exception_clear(&ex);
			Sleep(1);
			length = libvlc_vlm_get_media_instance_length(inst, "broadcast", NULL, &ex);
		}
		// Quit if stream unavailable.
		if (libvlc_exception_raised(&ex))
		{
			libvlc_exception_clear(&ex);
			return 0;
		}

		// Get stream details.
		char* info = libvlc_vlm_show_media(inst, "broadcast", &ex);
		while(1)
		{
			if (libvlc_exception_raised(&ex))
			{
				libvlc_exception_clear(&ex);
				Sleep(1000);
				info = libvlc_vlm_show_media(inst, "broadcast", &ex);
			}
		}


		// Wait for 1 second to play.
		float position = libvlc_vlm_get_media_instance_position(inst, "broadcast", NULL, &ex);
		/*while (length * position < 1000000 * 2)
		{
			Sleep(1);
			position = libvlc_vlm_get_media_instance_position(inst, "broadcast", NULL, &ex);
		}
		libvlc_exception_clear(&ex);*/



		/*std::ostringstream buff;
		buff<<time;
		std::string tempString(buff.str());
		std::wstring exWString = s2ws(tempString);
		MessageBox(handle, exWString.c_str(), L"Transcoder error", MB_OK);*/

		/*libvlc_exception_clear(&ex);
		std::stringstream buff2;
		buff2<<length;
		std::string tempString2(buff2.str());
		std::wstring exWString2 = s2ws(tempString2);
		MessageBox(handle, exWString2.c_str(), L"Transcoder error", MB_OK);*/

		return true;
	}

	void calculateBufferLength(int modTime)
	{
		bufferLength = (int)(length * libvlc_media_player_get_position(mediaPlayer, &ex)) - modTime;
		if (libvlc_exception_raised(&ex))
		{
			libvlc_exception_clear(&ex);
			bufferLength = 0;
		}
	}

	/*void calculateStreamOffset(int modTime)
	{
		if (!streamOffsetCalculated && modTime > 0)
		{
			// Calculate offset.
			streamOffsetCalculated = true;
			int streamPosition = (int)(length * libvlc_media_player_get_position(mediaPlayer, &ex));
			if (libvlc_exception_raised(&ex))
			{
				libvlc_exception_clear(&ex);
				streamPosition = 0;
			}
			streamOffset = streamPosition - modTime;
			std::ostringstream buff;
		buff<<streamOffset;
		std::string tempString(buff.str());
		std::wstring exWString = s2ws(tempString);
		MessageBox(wndHandle, exWString.c_str(), L"Transcoder error", MB_OK);
		}
	}*/

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
		else
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
		//calculateStreamOffset(modTime);

		return length;// - streamOffset;
	}

	int getOutputTime(int modTime)
	{
		// Check for end of stream.
		if (transcodeInvoked)	// Don't bother detecting end of stream if not transcoding.
		{
			if (endReached && endTrapStarted == 0 && modTime == lastModTime)	// Difficult to determine when mod has reached the end of the stream!
			{
				// Start a timer.
				endTrapStarted = clock();
			}
			else if (endReached && endTrapStarted != 0 && modTime == lastModTime && clock()-endTrapStarted > 1000)
			{
				// 1 second has passed without anything happening. Assume end.
				return -1;
			}
			else if (endReached && endTrapStarted != 0 && modTime != lastModTime)
			{
				// Must have been a blip; continue...
				endTrapStarted = 0;
			}
		}

		lastModTime = modTime;
		return modTime >= 0 ? modTime : 0;	// Never return negative number, as the main method uses this to determine the end of the stream.
		//calculateBufferLength(modTime - pauseOffset);
		//return modTime - pauseOffset;
	}

	void setOutputTime(int outputTime)
	{
		libvlc_media_player_set_position(mediaPlayer, outputTime / (length*1.0), &ex);
		if (libvlc_exception_raised(&ex))
		{
			libvlc_exception_clear(&ex);
		}
	}
}