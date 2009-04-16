#include "RemoteInvocation.h"
#include <winbase.h>
#include "time.h"

#define WM_STOP WM_USER+2000	// Message to stop IE control thread.

/*VARIANT FAR* fnHandleCallback(ExternalBase* obj, DISPPARAMS FAR *pdispparams)
{
	return ((RemoteInvocation*)obj)->fnHandleCallback(pdispparams);
}

void navigateErrors(ExternalBase* obj)
{
	((RemoteInvocation*)obj)->navigateError(obj);
}*/

RemoteInvocation::RemoteInvocation()
{
	result = NULL;
	remoteInvocThread = 0;
	controlSetup.htmlControl = 0;
	finished = false;
}

RemoteInvocation::~RemoteInvocation()
{
}

VARIANT FAR* RemoteInvocation::fnHandleCallback(DISPPARAMS FAR *pdispparams)
{
	result = pdispparams;	// Set the callback parameters.
	finished = true;	// Signal that the remote invocation has finished.
	return NULL;
}

void RemoteInvocation::navigateError()
{
	result = NULL;	// Set as error.
	finished = true;	// Signal that the remote invocation has finished.
}

DWORD CALLBACK RemoteInvocation::handleIEThread(LPVOID param)
{
	IEControlSetup* setup = (IEControlSetup*)param;

	// Create HTML control.
	setup->htmlControl = new HTMLControl();
	setup->htmlControl->CreateHWND(setup->parent);
	setup->htmlControl->setNavigateErrorFn(setup->remoteInvocationObject, (NavigateError)&RemoteInvocation::navigateError);

	// Add callback method.
	setup->htmlControl->addToNameFnMap(setup->fnName, setup->remoteInvocationObject, (ExternalMethod)&RemoteInvocation::fnHandleCallback);

	// Navigate to page.
	setup->htmlControl->AddRef();	// Tell control that something is using it.
	setup->htmlControl->NavigateToName(setup->url);

	while (1)
	{
		DWORD dwStatus = MsgWaitForMultipleObjectsEx(0, NULL,
		                 INFINITE, QS_ALLINPUT,
		                 MWMO_ALERTABLE | MWMO_INPUTAVAILABLE);
		if (dwStatus == WAIT_OBJECT_0)
		{
			MSG msg;
			while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE))
			{
				if (msg.message == WM_QUIT || msg.message == WM_STOP)
				{
					if (setup->htmlControl->m_pweb)
					{
						setup->htmlControl->m_pweb->Stop();
					}
					setup->htmlControl->remove();
					setup->htmlControl->close();
					setup->htmlControl->Release();
					setup->htmlControl = 0;
					return 0;
				}

				if (WM_KEYFIRST > msg.message || WM_KEYLAST < msg.message || !setup->htmlControl || !setup->htmlControl->translateKey(&msg))
				{
					if (!IsDialogMessage(setup->parent, &msg))
					{
						TranslateMessage(&msg);
						DispatchMessage(&msg);
					}
				}
			}
		}
	}
}

void RemoteInvocation::waitForResponse()
{
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
				if (WM_KEYFIRST > msg.message || WM_KEYLAST < msg.message || !controlSetup.htmlControl || !controlSetup.htmlControl->translateKey(&msg))
				{
					if (!IsDialogMessage(controlSetup.parent, &msg))
					{
						TranslateMessage(&msg);
						DispatchMessage(&msg);
					}
				}
			}
		}

		if (finished || clock()-start_time > 10000)	// More than 10 seconds have elapsed.
		{
			return;
		}
	}
}

DISPPARAMS FAR *RemoteInvocation::remoteInvoke(const char* url, const char* fnName, HWND parent)
{
	if (!controlSetup.htmlControl)	// Only do function if a callback isn't already running.
	{
		// Setup parameters.
		controlSetup.parent = parent;
		controlSetup.url = (char *)url;
		controlSetup.fnName = (char *)fnName;
		controlSetup.remoteInvocationObject = this;

		// Start IE control in separate thread.
		remoteInvocThread = CreateThread(NULL, 0, handleIEThread, (LPVOID)&controlSetup, 0, &remoteInvocThreadId);

		// Wait for invocation finished event (at most 10 seconds).
		waitForResponse();

		// Stop the IE control thread.
		PostThreadMessage(remoteInvocThreadId, WM_STOP, 0, 0);

		// Reset flag.
		finished = false;

		return result;
	}

	return 0;
}