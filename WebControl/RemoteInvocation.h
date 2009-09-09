#ifndef REMOTE_INVOCATION
#define REMOTE_INVOCATION
#include "HTMLControl.h"

class RemoteInvocation : public ExternalBase
{
	private:
		static const char* baseURL;
		static const char* pluginPageURL;
		static const char* dllVer;
		bool finished;
		HWND thisParent;
		HTMLControl *htmlControl;	// The HTML control.
		void (*processCallback)(DISPPARAMS FAR *);

	public:
		RemoteInvocation(HWND parent);
		~RemoteInvocation();
		static const char* getPluginPageURL();
		void fnHandleCallback(DISPPARAMS FAR *pdispparams, VARIANT FAR* pvarResult);	// Function to handle callback invocation from remote script.
		void navigateError();	// Function to handle navigation error.
		void remoteInvoke(const char* url, const char* fnName, void (*processResults)(DISPPARAMS FAR *), bool useBaseURL);	// Main method to invoke remote functions.
};

#endif