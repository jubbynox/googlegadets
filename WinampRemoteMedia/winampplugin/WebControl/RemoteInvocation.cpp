#include "RemoteInvocation.h"
#include <winbase.h>
#include "time.h"
#include <string>

//const char* RemoteInvocation::baseURL = "http://localhost:8080/";
const char* RemoteInvocation::baseURL = "http://winamp.banacek.org/";

//const char* RemoteInvocation::pluginPageURL = "http://localhost:8080/pluginPage&dllVer=0.1";
const char* RemoteInvocation::pluginPageURL = "http://winamp.banacek.org/pluginPage&dllVer=0.1";

const char* RemoteInvocation::dllVer = "0.1";

RemoteInvocation::RemoteInvocation(HWND parent)
{
	finished = false;
	thisParent = parent;

	// Create HTML control.
	htmlControl = new HTMLControl();
	htmlControl->setVisible(false);
	htmlControl->CreateHWND(parent);
	htmlControl->setNavigateErrorFn(this, (NavigateError)&RemoteInvocation::navigateError);
}

RemoteInvocation::~RemoteInvocation()
{
	htmlControl->remove();
	htmlControl->close();
	delete htmlControl;
}

const char* RemoteInvocation::getPluginPageURL()
{
	return pluginPageURL;
}

void RemoteInvocation::fnHandleCallback(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult)
{
	(*processCallback)(pdispparams);
	finished = true;	// Signal that the remote invocation has finished.
}

void RemoteInvocation::navigateError()
{
	finished = true;	// Signal that the remote invocation has finished.
}

void RemoteInvocation::remoteInvoke(const char* context, const char* fnName, void (*processResults)(DISPPARAMS FAR *), bool useBaseURL)
{
	// Construct url.
	std::string strUrl;
	if (useBaseURL)	// Use base URL, otherwise supplied in method invocation.
	{
		strUrl.append(baseURL);
	}
	// Append context.
	strUrl.append(context);
	// Add plugin version.
	strUrl.append("&dllVer=");
	strUrl.append(dllVer);

	// Remove existing external functions.
	htmlControl->removeFns();

	// Hold a reference to the callback method.
	processCallback = processResults;

	// Add callback method.
	htmlControl->addToNameFnMap((char *)fnName, this, (ExternalMethod)&RemoteInvocation::fnHandleCallback);

	// Navigate to page.
	htmlControl->NavigateToName((char *)strUrl.c_str());

	clock_t start_time;
	start_time = clock();
	while (1)
	{
		DWORD dwStatus = MsgWaitForMultipleObjectsEx(0, NULL,
		                 0, QS_ALLINPUT,
		                 MWMO_ALERTABLE | MWMO_INPUTAVAILABLE);
		if (dwStatus == WAIT_OBJECT_0)
		{
			MSG msg;
			while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE))
			{
				if (msg.message == WM_QUIT)
				{
					if (htmlControl->m_pweb)
					{
						htmlControl->m_pweb->Stop();
					}
					finished = false;
					return;
				}

				if (WM_KEYFIRST > msg.message || WM_KEYLAST < msg.message || !htmlControl || !htmlControl->translateKey(&msg))
				{
					if (!IsDialogMessage(thisParent, &msg))
					{
						TranslateMessage(&msg);
						DispatchMessage(&msg);
					}
				}
			}
		}
		if (finished || clock()-start_time > 10000)	// More than 10 seconds have elapsed.
		{
			if (htmlControl->m_pweb)
			{
				htmlControl->m_pweb->Stop();
			}
			finished = false;
			return;
		}
	}
}