#include "HTMLControl.h"

struct IEControlSetup
{
  char* url;
  char* fnName;
};

RemoteInvocation::RemoteInvocation()
{
	remoteInvocThread = 0;
	*remoteInvocHTMLControl = 0;
	threadEvent = 0;
	remoteInvokeFinishedEvent = 0;
}

RemoteInvocation::~RemoteInvocation()
{
}

VARIANT FAR* RemoteInvocation::fnHandleCallback(DISPPARAMS FAR *pdispparams)
{
	result = pdispparams;
	return NULL;
}

void RemoteInvocation::navigateError()
{
}

static DWORD CALLBACK RemoteInvocation::RemoteInvocThread(LPVOID param)
{
	IEControlSetup* setup = (IEControlSetup*)param;

	// Create HTML control.
	remoteInvocHTMLControl = new HTMLControl();
	remoteInvocHTMLControl->CreateHWND(_parent);
	remoteInvocHTMLControl->setNavigateErrorFn(&navigateError);

	// Add callback method.
	remoteInvocHTMLControl->addToNameFnMap(setup->fnName, &fnHandleCallback);

	// Navigate to page.
	remoteInvocHTMLControl->AddRef();	// Tell control that something is using it.
	remoteInvocHTMLControl->NavigateToName(setup->url);

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
				if (callbackInvoked || msg.message == WM_QUIT)
				{
					if (remoteInvocHTMLControl->m_pweb)
					{
						remoteInvocHTMLControl->m_pweb->Stop();
					}
					remoteInvocHTMLControl->remove();
					remoteInvocHTMLControl->close();
					remoteInvocHTMLControl->Release();
					remoteInvocHTMLControl = 0;
					SetEvent(remoteInvokeFinishedEvent);	// Signal that the remote invocation has finished.
					return 0;
				}

				if (WM_KEYFIRST > msg.message || WM_KEYLAST < msg.message || !remoteInvocHTMLControl || !remoteInvocHTMLControl->translateKey(&msg))
				{
					if (!IsDialogMessage(_parent, &msg))
					{
						TranslateMessage(&msg);
						DispatchMessage(&msg);
					}
				}
			}
		}
	}
}


DISPPARAMS FAR *RemoteInvocation::remoteInvoke(const char* url, const char* fnName, HWND parent)
{
	if (!remoteInvocHTMLControl)	// Only do function if a callback isn't already running.
	{
		_parent = parent;

		// Setup parameters.
		IEControlSetup* setup = new IEControlSetup();
		setup->url = (char *)url;
		setup->fnName = (char *)fnName;

		// Setup event.
		remoteInvokeFinishedEvent = CreateEvent(0, TRUE, FALSE, 0);

		// Start IE control in separate thread.
		remoteInvocThread = CreateThread(NULL, 0, RemoteInvocThread, (LPVOID)setup, 0, &remoteInvocThreadId);

		// Wait for invocation finished event.
		DWORD reason = WaitForSingleObject(remoteInvokeFinishedEvent, 10000);
		CloseHandle(remoteInvokeFinishedEvent);

		switch (reason)
		{
			case WAIT_OBJECT_0:	// Successful remote invocation.
				return result;
				break;
			case WAIT_ABANDONED:	// Error in remote invocation.
			case WAIT_TIMEOUT:
				return -1;
				break;
		}
	}

	return 0;
}