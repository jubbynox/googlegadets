#include <string>
#include <sstream>
#include <comutil.h>
#include <hash_map>

#include "../Cajun/elements.h"
#include "../Cajun/reader.h"
#include "../Cajun/quick.h"
#include "../Cajun/cast.h"

#include "RemoteInvocation.h"

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

namespace supported_apps	// Can't be arsed to write another C++ object.
{
	struct SupportedApp
	{
		std::string name;
		std::string appUrl;
		int iconId;
	};

	stdext::hash_map <std::string, SupportedApp> *supportedApps;	// Holds the map passed into the main function.
	HWND hwndParent;	// The parent window handle.

	void processResults(DISPPARAMS FAR *results)
	{
		try
		{
			if (results && results->cArgs > 0 && results->rgvarg[0].pvarVal && results->rgvarg[0].vt == VT_BSTR)
			{
				// Correct data passed in. Get string stream.
				BSTR inJSON = results->rgvarg[0].bstrVal;
				char* tmpString = _com_util::ConvertBSTRToString(inJSON);
				std::string strJSON(tmpString);
				delete[] tmpString;
				std::istringstream streamJSON(strJSON, std::istringstream::in);

				// Parse as JSON.
				json::Element elemRootFile = json::String();
				json::Reader::Read(elemRootFile, streamJSON);

				// Extract data.
				json::QuickInterpreter interpreter(elemRootFile);
				int numApps = (int)interpreter.As<json::Array>().Size();
				for (int i = 0; i < numApps; i++)
				{
					SupportedApp supportedApp;
					supportedApp.name = interpreter[i]["name"].As<json::String>();
					supportedApp.appUrl = interpreter[i]["appurl"].As<json::String>();
					supportedApp.iconId = (int)interpreter[i]["iconid"].As<json::Number>();
					(*supportedApps)[supportedApp.name] = supportedApp;
				}
			}
		}
		catch(...)
		{
			MessageBox(hwndParent, L"There was a problem determining the supported applications.", L"redcaza Error", MB_OK | MB_ICONERROR);
		}
	}

	void getSupportedApps(HWND parent, RemoteInvocation *remoteInvocation, stdext::hash_map <std::string, SupportedApp> &supportedAppMap)
	{
		supportedApps = &supportedAppMap;
		hwndParent = parent;
		remoteInvocation->remoteInvoke("getSupportedApps?callback=window.external.externalMethod", "externalMethod", &processResults, true);
	}
}