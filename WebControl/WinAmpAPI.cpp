#include "WinAmpAPI.h"
#include <strsafe.h>
#include "WinAmpHooks.h"
#include <api/service/waservicefactory.h>

WinAmpAPI::WinAmpAPI()
{
	metaDataApi = 0;
	decodeFileApi = 0;
	mt = 0;
	fileLoaded = false;
	currentUrl = "";
	trackLength = -1;

	// Load Agave meta data service.
	if (wasabiServiceManager)
	{
		// Load the meta data API.
		waServiceFactory *factory = wasabiServiceManager->service_getServiceByGuid(api_metadataGUID);
		if (factory)
			metaDataApi = (api_metadata*)factory->getInterface();

		// Load the decode file API.
		factory = wasabiServiceManager->service_getServiceByGuid(decodeFileGUID);
		if (factory)
			decodeFileApi = (api_decodefile*)factory->getInterface();
	}
}

WinAmpAPI::~WinAmpAPI()
{
	if (wasabiServiceManager)
	{
		// Release meta data API.
		waServiceFactory *factory = wasabiServiceManager->service_getServiceByGuid(api_metadataGUID);
		if (factory)
			factory->releaseInterface(metaDataApi);

		// Release decode file API.
		factory = wasabiServiceManager->service_getServiceByGuid(decodeFileGUID);
		if (factory)
			factory->releaseInterface(decodeFileApi);
	}

	if (mt)	// Close the previous meta tag, if any.
	{
		mt->metaTag_close();
	}
}

void WinAmpAPI::enqueue(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult)
{
	bool enqueue = false;	// Whether or not to enqueue.
	enqueueFileWithMetaStruct eFWMS = {0};

	if (pdispparams->cArgs == 1 && pdispparams->rgvarg[0].vt == VT_BSTR)
	{
		// URL
		eFWMS.filename = _com_util::ConvertBSTRToString(pdispparams->rgvarg[0].bstrVal);
		eFWMS.title = _com_util::ConvertBSTRToString(pdispparams->rgvarg[0].bstrVal);	// Same as URL.
		eFWMS.length = -1;  // Unknown.
		enqueue = true;
	}
	else if (pdispparams->cArgs == 2 && pdispparams->rgvarg[0].vt == VT_BSTR && pdispparams->rgvarg[1].vt == VT_BSTR)
	{
		// title, URL
		eFWMS.title = _com_util::ConvertBSTRToString(pdispparams->rgvarg[0].bstrVal);
		eFWMS.filename = _com_util::ConvertBSTRToString(pdispparams->rgvarg[1].bstrVal);
		eFWMS.length = -1;  // Unknown.
		enqueue = true;
	}
	else if (pdispparams->cArgs == 3 && pdispparams->rgvarg[0].vt == VT_I4 && pdispparams->rgvarg[1].vt == VT_BSTR && pdispparams->rgvarg[2].vt == VT_BSTR)
	{
		// length, title, URL
		eFWMS.length = pdispparams->rgvarg[0].lVal;
		eFWMS.title = _com_util::ConvertBSTRToString(pdispparams->rgvarg[1].bstrVal);
		eFWMS.filename = _com_util::ConvertBSTRToString(pdispparams->rgvarg[2].bstrVal);
		enqueue = true;
	}
	
	if (enqueue)	// Enqueue the song.
	{
		SendMessage(*hwndWinampParent, WM_WA_IPC, (WPARAM)&eFWMS, IPC_ENQUEUEFILE);
		delete [] eFWMS.filename;
		delete [] eFWMS.title;
	}
}

void WinAmpAPI::getClassicColour(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult)
{
	if (pdispparams->cArgs == 1 && pdispparams->rgvarg[0].vt == VT_I4)
	{
		wchar_t htmlColour[10];
		StringCchPrintfW(htmlColour, 10, L"#%06X", GetHTMLColor(ml_color(pdispparams->rgvarg[0].lVal)));
		pvarResult->vt = VT_BSTR;
		pvarResult->bstrVal = SysAllocString(htmlColour);
	}
}

void WinAmpAPI::getFont(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult)
{
	LOGFONT lf;
	GetObject(ml_font, sizeof(lf), &lf);
	pvarResult->vt = VT_BSTR;
	pvarResult->bstrVal = SysAllocString(lf.lfFaceName);
}

void WinAmpAPI::getFontSize(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult)
{
	LOGFONT lf;
	GetObject(ml_font, sizeof(lf), &lf);
	pvarResult->vt = VT_I4;
	pvarResult->lVal = abs(lf.lfHeight);
}

void WinAmpAPI::isRegisteredExtension(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult)
{
}

void WinAmpAPI::getMetadata(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult)
{
	// Create empty tag variable.
	uint8_t tag[512] = "";
	uint8_t *ptr = tag;
	for (int index=512; index>0; index-=2)
	{
		*ptr = 32;
		ptr++;
		*ptr = 0;
		ptr++;
	}

	if (pdispparams->cArgs == 2 && pdispparams->rgvarg[0].vt == VT_BSTR && pdispparams->rgvarg[1].vt == VT_BSTR)
	{
		pvarResult->vt = VT_EMPTY;	// Assume invalid file.

		BSTR tagName = pdispparams->rgvarg[0].bstrVal;	// Meta data to retrieve.
		BSTR url = pdispparams->rgvarg[1].bstrVal;	// URL of media.

		// Load the file.
		if (loadFile(url))
		{
			if (compareBStr(tagName, "length") == 0)	// Length already calculated.
			{
				pvarResult->vt = VT_I4;
				pvarResult->lVal = trackLength;
			}
			else	// Use meta data API.
			{
				mt->getMetaData(tagName, tag, sizeof(tag), METATYPE_STRING);

				if (tag[0] == 0)	// Test for no result.
				{
					pvarResult->vt = VT_BSTR;
					pvarResult->bstrVal = SysAllocString(L"");	// At least return something.
				}
				else	// Result returned.
				{
					pvarResult->vt = VT_BSTR;
					pvarResult->bstrVal = SysAllocStringByteLen((LPCSTR)tag, sizeof(tag));
				}
			}
		}
	}
}

bool WinAmpAPI::loadFile(BSTR url)
{
	if (!fileLoaded || compareBStr(url, (char*)currentUrl.c_str()) != 0)	// Test for new file.
	{
		if (mt)	// Close the previous meta tag, if any.
		{
			mt->metaTag_close();
			mt = 0;
		}

		// Attempt to load part of the file.
		AudioParameters audioParameters;
		ifc_audiostream *audioStream = decodeFileApi->OpenAudioBackground(url, &audioParameters);
		decodeFileApi->CloseAudio(audioStream);

		if (audioParameters.errorCode == API_DECODEFILE_SUCCESS)	// This is a valid file.
		{
			// Copy the new URL.
			char* tmpCharArray = _com_util::ConvertBSTRToString(url);
			currentUrl = tmpCharArray;	// Overloaded operator. currentUrl is of type std::string.
			delete[] tmpCharArray;

			// Get new meta info.
			trackLength = getLength(audioParameters);
			mt = metaDataApi->GetMetaTagObject(url, METATAG_ALL);
			mt->metaTag_open(url);

			fileLoaded = true;
		}
		else	// Not a valid file.
		{
			fileLoaded = false;
		}
	}

	return fileLoaded;
}

int WinAmpAPI::compareBStr(BSTR str1, char* str2)
{
	char* tmpCharArray = _com_util::ConvertBSTRToString(str1);
	std::string tmpString(tmpCharArray);
	delete[] tmpCharArray;

	return tmpString.compare(str2);
}

long WinAmpAPI::getLength(AudioParameters parameters)
{
	if (parameters.sizeBytes == (size_t)-1)
	{
		return -1;
	}
	else
	{
		long numBits = parameters.sizeBytes * 8;
		long numSamples = numBits / (parameters.channels * parameters.bitsPerSample);
		return numSamples / parameters.sampleRate;
	}
}