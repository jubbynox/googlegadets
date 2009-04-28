#ifndef WINAMP_API
#define WINAMP_API

#include "HTMLContainer.h"
#include "main.h"

#include "../Agave/Metadata/api_metadata.h"
//extern api_metadata *metadataApi;
//#define AGAVE_API_METADATA metadataApi

#include "../Agave/DecodeFile/api_decodefile.h"

#include <api/service/waservicefactory.h>

class WinAmpAPI : public ExternalBase
{
	private:
		api_metadata *metaDataApi;	// Meta data API.
		api_decodefile *decodeFileApi;	// File decoder API.

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
		void getClassicColor(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to get classic colour scheme.
		void isRegisteredExtension(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to check if extension has been registered.
		void getMetadata(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to get meta data of media.
};

#endif