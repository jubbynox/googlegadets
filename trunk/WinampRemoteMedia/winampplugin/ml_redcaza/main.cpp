#include "../resource.h"
#include "main.h"
#include "../Winamp/wa_ipc.h"
#include "../gen_ml/ml_ipc_0313.h"
#include <api/service/waservicefactory.h>
#include "GetSupportedApps.h"
#include "WinAmpHooks.h"

#include <hash_map>

#define WEB_MEDIA_VER "v1.0"

// The ID of the WEB MP3 ML item.
int webMp3MlItemId=0;
// App URLs
stdext::hash_map <int, std::string> appURLs;

// Exposed functions.
INT_PTR CreateView(INT_PTR treeItem, HWND parent);	// Creates the Web Media media library view in the ML window.
int Init();	// Initialises the Web Media media library plugin.
void Quit();	// Quits the Web Media media library plugin.
int MessageProc(int message_type, int param1, int param2, int param3);	// Message processing routing for Media library plugin.

// Pointer to the IE control.
HWND ieControl = NULL;

// Web Media media library structure.
winampMediaLibraryPlugin WebMediaML =
{
	MLHDR_VER,
	"Web Media " WEB_MEDIA_VER,
	Init,
	Quit,
	MessageProc,
	0,
	0,
	0,
};

//IDispatch *winampExternal = 0;
int winampVersion = 0;
WNDPROC waProc=0;

static DWORD WINAPI wa_newWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	if (msg == WM_WA_IPC)
	{
		switch (lParam)
		{

		case IPC_MBOPEN:
		case IPC_MBOPENREAL:
			if (!wParam || wParam == 32)
			{
				if (wParam == 32/* || g_config->ReadInt("mbautoswitch", 1)*/) // TODO: read this config value
				{
					SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM)webMp3MlItemId, ML_IPC_SETCURTREEITEM);
				}
			}
			else
			{
				//Navigate((char *)wParam);
			}
			break;
		}
	}

	if (waProc)
		return CallWindowProcW(waProc, hwnd, msg, wParam, lParam);
	else
		return DefWindowProc(hwnd, msg, wParam, lParam);
}

void Hook(HWND winamp)
{
	if (winamp)
		waProc = (WNDPROC)SetWindowLongW(winamp, GWLP_WNDPROC, (LONG_PTR)wa_newWndProc);
}

void Unhook(HWND winamp)
{
	if (winamp && waProc)
		SetWindowLongW(winamp, GWLP_WNDPROC, (LONG_PTR)waProc);
	waProc=0;
}

void addChildrenToMenu(int parentId, stdext::hash_map <std::string, supported_apps::SupportedApp> supportedApps)
{
	// Get pointers to start and end of map.
	stdext::hash_map <std::string, supported_apps::SupportedApp>::iterator mapIterator;
	stdext::hash_map <std::string, supported_apps::SupportedApp>::const_iterator mapEnd;
	mapIterator = supportedApps.begin();
	mapEnd = supportedApps.end();

	// Add the children.
	do
	{
		supported_apps::SupportedApp app = mapIterator->second;

		// Add menu item.
		MLTREEITEM child;
		child.size = sizeof(MLTREEITEM);
		child.parentId = parentId;
		child.title = (char *)app.name.c_str();
		child.hasChildren = 0;
		child.id = 0;
		MLTREEIMAGE img = {WebMediaML.hDllInstance, IDB_TREEITEM_NOWPLAYING, -1, (BMPFILTERPROC)FILTER_DEFAULT1, 0, 0};
		child.imageIndex = (int)(INT_PTR)SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM) &img, ML_IPC_TREEIMAGE_ADD);
		SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM) &child, ML_IPC_TREEITEM_ADD);

		// Map menu item ID to application URL.
		appURLs[child.id] = std::string(app.appUrl);
	}
	while (++mapIterator != mapEnd);
}

int Init()
{
	hookToWinAmp(WebMediaML.hwndLibraryParent, WebMediaML.hwndWinampParent);
	Hook(WebMediaML.hwndWinampParent);

	// Begin setup of tree menu.
	MLTREEITEM newTree;
	newTree.size = sizeof(MLTREEITEM);
	newTree.parentId    = 0;
	newTree.title        = "Web Media";
	newTree.hasChildren = 0;
	newTree.id      = 0;

	// Get the supported apps.
	stdext::hash_map <std::string, supported_apps::SupportedApp> supportedApps;
	supported_apps::getSupportedApps(WebMediaML.hwndWinampParent, supportedApps);

	if (supportedApps.size() == 0)
	{
		// Something has gone wrong.
		MLTREEIMAGE img = {WebMediaML.hDllInstance, IDB_TREEITEM_NOWPLAYING, -1, (BMPFILTERPROC)FILTER_DEFAULT1, 0, 0};
		newTree.imageIndex = (int)(INT_PTR)SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM) &img, ML_IPC_TREEIMAGE_ADD); 
	}
	else
	{
		// Add children to tree.
		newTree.hasChildren = 1;
		newTree.imageIndex = MLTREEIMAGE_BRANCH;
	}

	SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM) &newTree, ML_IPC_TREEITEM_ADD);
	webMp3MlItemId = newTree.id;

	// Add child items, if any.
	if (newTree.hasChildren)
	{
		addChildrenToMenu(webMp3MlItemId, supportedApps);
	}

	return 0;
}

void Quit()
{
//	Unhook(WebMediaML.hwndWinampParent); // don't unhook because we'll unleash subclassing hell

}

INT_PTR MessageProc(int message_type, INT_PTR param1, INT_PTR param2, INT_PTR param3)
{
	switch (message_type)
	{
		case ML_MSG_TREE_ONCREATEVIEW:     // param1 = param of tree item, param2 is HWND of parent. return HWND if it is us
			return CreateView(param1, (HWND)param2);
	}
	return 0;
}

INT_PTR CreateView(INT_PTR treeItem, HWND parent)
{
	char* url;
	bool urlAssigned = false;

	if (treeItem == webMp3MlItemId)	// Root has been selected.
	{
		//url = "http://localhost:8080/";
		url = "http://winamp.banacek.org";
		urlAssigned = true;
	}
	else if (appURLs.find(treeItem) != appURLs.end())	// Application has been selected.
	{
		url = (char *)appURLs[treeItem].c_str();
		urlAssigned = true;
	}

	if (urlAssigned)
	{
		ieControl = CreateDialog(WebMediaML.hDllInstance, MAKEINTRESOURCE(IDD_SAMPLEHTTP), parent, MainDialogProc);
		SendMessage(ieControl, WM_GOTOPAGE, 0, (LPARAM)url);
		return (INT_PTR)ieControl;
	}
	else
	{
		return 0;
	}
}

extern "C" __declspec(dllexport) winampMediaLibraryPlugin *winampGetMediaLibraryPlugin()
{
	return &WebMediaML;
}
