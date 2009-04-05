/* Definition window.external functions, window.external->C++ function map. */
#include <string>
#include <comutil.h>
#include <hash_map> 

typedef VARIANT FAR* (*ExternalMethod)(DISPPARAMS FAR *pdispparams);
typedef stdext::hash_map <std::string, ExternalMethod> NameToFnMap;

class RemoteInvocation
{
	private:
		DISPPARAMS FAR *result;	// The result of the remote invocation.
		HANDLE remoteInvocThread;	// Thread handle for IE control.
		HWND _parent;	// Handle to parent window.
		DWORD remoteInvocThreadId;	// Thread identifier.
		HTMLControl *remoteInvocHTMLControl;	// Pointer to HTML control object.
		HANDLE remoteInvokeFinishedEvent;	// Handle of event to fire when the remote invocation has finished.

		DWORD CALLBACK remoteInvocThread(LPVOID param);	// Background thread method to manage remote invocation.
		VARIANT FAR* fnHandleCallback(DISPPARAMS FAR *pdispparams);	// Function to handle callback invocation from remote script.
		void navigateError();	// Function to handle navigation error.

	public:
		RemoteInvocation();
		~RemoteInvocation();
		DISPPARAMS FAR *remoteInvoke(const char* url, const char* fnName, HWND parent);	// Main method to invoke remote functions.
}