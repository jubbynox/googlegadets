#include <string>

#include "WinAmpHooks.h"
#include "RemoteInvocation.h"

namespace ask_app_engine	// Can't be arsed to write another C++ object.
{
	std::wstring *inJSON;	// To hold the JSON response.
	RemoteInvocation *remoteInvocation = 0;

	void setup(HWND parent)
	{
		remoteInvocation = new RemoteInvocation(parent);
	}

	void destroy()
	{
		delete remoteInvocation;
	}

	void processResults(DISPPARAMS FAR *results)
	{
		if (results && results->cArgs > 0 && results->rgvarg[0].pvarVal && results->rgvarg[0].vt == VT_BSTR)
		{
			// Correct data passed in. Get string stream.
			*inJSON = results->rgvarg[0].bstrVal;
		}
	}

	void askAppEngine(std::string *url, std::wstring &responseJSON)
	{
		inJSON = &responseJSON;
		url->append("&callback=window.external.externalMethod");
		
		remoteInvocation->remoteInvoke(url->c_str(), "externalMethod", &processResults, false);
	}
}