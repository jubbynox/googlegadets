#ifndef PARSE_MEDIA_DETAILS
#define PARSE_MEDIA_DETAILS

#include <string>
#include <windows.h>

struct MediaDetails
{
	bool error;
	int operation;
	std::string url;
	std::string title;
	int duration;
	int seekable;
	bool transcoded;
	std::string transcodeConfig;
	std::string transcoderOptions;

	MediaDetails() : error(false), duration(-1), seekable(-1), transcoded(false) {}
};

std::wstring s2ws(const std::string& s);

std::string ws2s(const std::wstring& s);

MediaDetails parseMediaDetails(wchar_t *pJSON, HWND hwndParent);

MediaDetails mergeMediaDetails(MediaDetails newDetails, MediaDetails oldDetails);

void clearMediaDetails(MediaDetails &mediaDetails);

#endif