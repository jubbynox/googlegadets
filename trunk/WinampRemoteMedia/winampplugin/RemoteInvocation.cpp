#include "RemoteInvocation.h"
#include <winbase.h>
#include "time.h"

#define WM_STOP WM_USER+2000	// Message to stop IE control thread.

RemoteInvocation::RemoteInvocation()
{
	remoteInvocThread = 0;
	controlSetup.htmlControl = 0;
	finished = false;
}

RemoteInvocation::~RemoteInvocation()
{
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

DWORD CALLBACK RemoteInvocation::handleIEThread(LPVOID param)
{
	IEControlSetup* setup = (IEControlSetup*)param;
	HWND parent = setup->parent;

	// Create HTML control.
	setup->htmlControl = new HTMLControl();
	HTMLControl *localControl = setup->htmlControl;
	localControl->CreateHWND(setup->parent);
	localControl->setNavigateErrorFn(setup->remoteInvocationObject, (NavigateError)&RemoteInvocation::navigateError);

	// Add callback method.
	localControl->addToNameFnMap(setup->fnName, setup->remoteInvocationObject, (ExternalMethod)&RemoteInvocation::fnHandleCallback);

	// Navigate to page.
	localControl->AddRef();	// Tell control that something is using it.
	localControl->NavigateToName(setup->url);

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
					if (localControl->m_pweb)
					{
						localControl->m_pweb->Stop();
					}
					localControl->remove();
					localControl->close();
					localControl->Release();
					setup->htmlControl = 0;
					return 0;
				}

				if (WM_KEYFIRST > msg.message || WM_KEYLAST < msg.message || !localControl || !localControl->translateKey(&msg))
				{
					if (!IsDialogMessage(parent, &msg))
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

void RemoteInvocation::remoteInvoke(const char* url, const char* fnName, HWND parent, void (*processResults)(DISPPARAMS FAR *))
{
	if (!controlSetup.htmlControl)	// Only do function if a callback isn't already running.
	{
		// Setup parameters.
		controlSetup.parent = parent;
		controlSetup.url = (char *)url;
		controlSetup.fnName = (char *)fnName;
		controlSetup.remoteInvocationObject = this;
		processCallback = processResults;

		// Start IE control in separate thread.
		remoteInvocThread = CreateThread(NULL, 0, handleIEThread, (LPVOID)&controlSetup, 0, &remoteInvocThreadId);

		// Wait for invocation finished event (at most 10 seconds).
		waitForResponse();

		// Stop the IE control thread.
		PostThreadMessage(remoteInvocThreadId, WM_STOP, 0, 0);

		// Reset flag.
		finished = false;
	}
}