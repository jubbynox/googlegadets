#ifndef NULLSOFT_HTMLCONTROLH
#define NULLSOFT_HTMLCONTROLH

#include "HTMLContainer.h"
#include "main.h"

class HTMLControl : public HTMLContainer
{
public:
	HTMLControl();
	
	void NavigateToName(char *pszUrl);
	void WriteHTML(const wchar_t *);
	//STDMETHOD (GetExternal)(IDispatch __RPC_FAR *__RPC_FAR *ppDispatch);
	HWND CreateHWND(HWND parent);
	void setNavigateErrorFn(void (*navigateErrorCallback)(void));
	virtual void OnNavigateError();
	virtual void OnNavigateComplete();

	STDMETHOD_(ULONG, Release)(void);
	STDMETHOD (TranslateAccelerator)(LPMSG lpMsg, const GUID __RPC_FAR *pguidCmdGroup, DWORD nCmdID);
	
private:
	void (*navErrorCallback)();
	bool colorInit;
	void setWnd(HWND hwnd);
	virtual DWORD GetDownloadSettings();
};

#endif