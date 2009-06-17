#ifndef WINAMP_API
#define WINAMP_API

#include "HTMLContainer.h"

#include "../../Agave/Metadata/api_metadata.h"
#include "../../Agave/DecodeFile/api_decodefile.h"

class WinAmpAPI : public ExternalBase
{
	private:
		api_metadata *metaDataApi;	// Meta data API.
		api_decodefile *decodeFileApi;	// File decoder API.
		HTMLContainer *htmlContainer;	// The HTML container.

		svc_metaTag *mt;	// Meta tag reader of current loaded file.
		std::string currentUrl;	// URL of current loaded file.
		bool fileLoaded;	// Whether or not a file is loaded.
		long trackLength;	// Length (seconds) of current loaded file.

		int compareBStr(BSTR str1, char* str2);
		bool loadFile(BSTR url);	// Loads a file from a URL.
		long getLength(AudioParameters parameters);	// Gets the length of an audio file.

	public:
		WinAmpAPI();
		~WinAmpAPI();
		void enqueue(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to enqueue media.
		void getClassicColour(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to get classic colour scheme.
		void getFont(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Gets the font name.
		void getFontSize(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Gets the font size (in px).
		void isRegisteredExtension(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to check if extension has been registered.
		void getMetadata(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to get meta data of media.
};

#endif