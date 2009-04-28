#ifndef REMOTE_INVOCATION
#define REMOTE_INVOCATION
#include "HTMLControl.h"

class RemoteInvocation : public ExternalBase
{
	struct IEControlSetup
	{
		HWND parent;
		char* url;
		char* fnName;
		HTMLControl *htmlControl;
		RemoteInvocation* remoteInvocationObject;
	};

	private:
		HANDLE remoteInvocThread;	// Thread handle for IE control.
		DWORD remoteInvocThreadId;	// Thread identifier.
		bool finished;
		IEControlSetup controlSetup;	// Details of the IE control.
		void (*processCallback)(DISPPARAMS FAR *);

		static DWORD CALLBACK handleIEThread(PVOID param);	// Background thread method to manage remote invocation.
		void waitForResponse();	// Waits for a reponse. Times-out after 10 seconds.

	public:
		RemoteInvocation();
		~RemoteInvocation();
		void fnHandleCallback(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to handle callback invocation from remote script.
		void navigateError();	// Function to handle navigation error.
		void remoteInvoke(const char* url, const char* fnName, HWND parent, void (*processResults)(DISPPARAMS FAR *));	// Main method to invoke remote functions.
};

#endif