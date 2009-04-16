#ifndef NULLSOFT_HTMLCONTROLH
#define NULLSOFT_HTMLCONTROLH

#include "HTMLContainer.h"
//#include "main.h"

typedef void (ExternalBase::*NavigateError)();

class HTMLControl : public HTMLContainer
{
public:
	HTMLControl();
	
	void NavigateToName(char *pszUrl);
	void WriteHTML(const wchar_t *);
	//STDMETHOD (GetExternal)(IDispatch __RPC_FAR *__RPC_FAR *ppDispatch);
	HWND CreateHWND(HWND parent);
	void setNavigateErrorFn(ExternalBase* obj, NavigateError navigateError);
	virtual void OnNavigateError();
	virtual void OnNavigateComplete();

	STDMETHOD_(ULONG, Release)(void);
	STDMETHOD (TranslateAccelerator)(LPMSG lpMsg, const GUID __RPC_FAR *pguidCmdGroup, DWORD nCmdID);
	
private:
	ExternalBase* errorObj;
	NavigateError navError;
	bool colorInit;
	void setWnd(HWND hwnd);
	virtual DWORD GetDownloadSettings();
};

#endif