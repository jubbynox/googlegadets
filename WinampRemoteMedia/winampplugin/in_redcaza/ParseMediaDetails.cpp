#include "ParseMediaDetails.h"

#include <sstream>
#include <windows.h>

#include "../Cajun/elements.h"
#include "../Cajun/reader.h"
#include "../Cajun/quick.h"
#include "../Cajun/cast.h"

std::wstring s2ws(const std::string& s)
{
	int len;
	int slength = (int)s.length() + 1;
	len = MultiByteToWideChar(CP_ACP, 0, s.c_str(), slength, 0, 0); 
	wchar_t* buf = new wchar_t[len];
	MultiByteToWideChar(CP_ACP, 0, s.c_str(), slength, buf, len);
	std::wstring r(buf);
	delete[] buf;
	return r;
}

std::string ws2s(const std::wstring& s)
{
	int len;
	int slength = (int)s.length() + 1;
	len = WideCharToMultiByte(CP_ACP, 0, s.c_str(), slength, 0, 0, NULL, NULL); 
	char* buf = new char[len];
	WideCharToMultiByte(CP_ACP, 0, s.c_str(), slength, buf, len, NULL, NULL);
	std::string r(buf);
	delete[] buf;
	return r;
}

MediaDetails parseMediaDetails(wchar_t *pJSON)
{
	std::wstring wJSON(pJSON);
	std::string sJSON = ws2s(wJSON);

	// Parse JSON.
	std::istringstream streamJSON(sJSON, std::istringstream::in);
	json::Element elemRootFile = json::String();
	json::Reader::Read(elemRootFile, streamJSON);

	// Extract data.
	json::QuickInterpreter interpreter(elemRootFile);
	MediaDetails mediaDetails;
	json::Object obj = interpreter.As<json::Object>();

	// Required data.
	if (obj.Find("operation") == obj.End() || obj.Find("url") == obj.End())
	{
		// Required data missing. Return error.
		mediaDetails.error = true;
		return mediaDetails;
	}
	mediaDetails.operation = (int)interpreter["operation"].As<json::Number>();
	mediaDetails.url = interpreter["url"].As<json::String>();

	// Optional data.
	if (obj.Find("title") != obj.End())
	{
		mediaDetails.title = interpreter["title"].As<json::String>();
	}
	if (obj.Find("duration") != obj.End())
	{
		mediaDetails.duration = (int)interpreter["duration"].As<json::Number>();
	}
	if (obj.Find("seekable") != obj.End())
	{
		mediaDetails.seekable = (int)interpreter["seekable"].As<json::Number>();
	}
	if (obj.Find("transcoded") != obj.End())
	{
		mediaDetails.transcoded = (bool)interpreter["transcoded"].As<json::Boolean>();
	}
	if (obj.Find("transcodeConfig") != obj.End())
	{
		mediaDetails.transcodeConfig = interpreter["transcodeConfig"].As<json::String>();
	}
	if (obj.Find("transcoderOptions") != obj.End())
	{
		mediaDetails.transcoderOptions = interpreter["transcoderOptions"].As<json::String>();
	}
	

	return mediaDetails;
}

MediaDetails mergeMediaDetails(MediaDetails newDetails, MediaDetails oldDetails)
{
	MediaDetails mergedDetails;

	// Required data.
	mergedDetails.operation = newDetails.operation;
	mergedDetails.url = newDetails.url;

	// Optional data.
	mergedDetails.title = newDetails.title.length() > 0 ? newDetails.title : oldDetails.title;
	mergedDetails.duration = newDetails.duration != -1 ? newDetails.duration : oldDetails.duration;
	mergedDetails.seekable = newDetails.seekable != -1 ? newDetails.seekable : oldDetails.seekable;
	mergedDetails.transcoded = newDetails.transcoded || oldDetails.transcoded;
	mergedDetails.transcodeConfig = newDetails.transcodeConfig.length() > 0 ? newDetails.transcodeConfig : oldDetails.transcodeConfig;
	mergedDetails.transcoderOptions = newDetails.transcoderOptions.length() > 0 ? newDetails.transcoderOptions : oldDetails.transcoderOptions;

	return mergedDetails;
}