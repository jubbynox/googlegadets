#include "resource.h"
#include "main.h"
#include "../Winamp/wa_ipc.h"
#include <api/service/waservicefactory.h>

#define WEB_MEDIA_VER "v1.0"

/* dialog skinning helper functions 
see ML_IPC_SKIN_WADLG_GETFUNC in gen_ml/ml.h for details */
HookDialogFunc ml_hook_dialog_msg = 0;	// Function hook to allow WinAmp to access the dialog first.
DrawFunc ml_draw = 0;	// Function to make WinAmp paint the dialog using current skin.
ColorFunc ml_color = 0;	// Functions to retrieve the skin colours.

// The ID of the WEB MP3 ML item.
int webMp3MlItemId=0;

// Exposed functions.
INT_PTR CreateView(INT_PTR treeItem, HWND parent);	// Creates the Web Media media library view in the ML window.
int Init();	// Initialises the Web Media media library plugin.
void Quit();	// Quits the Web Media media library plugin.
int MessageProc(int message_type, int param1, int param2, int param3);	// Message processing routing for Media library plugin.

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

IDispatch *winampExternal = 0;
int winampVersion = 0;
WNDPROC waProc=0;
DWORD threadStorage=TLS_OUT_OF_INDEXES;
BOOL CALLBACK PreferencesDialogProc(HWND hwndDlg, UINT uMsg, WPARAM wParam, LPARAM lParam);

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
int Init()
{
	// Thread memory.
	threadStorage = TlsAlloc();

	/* gen_ml has some helper functions to deal with skinned dialogs,
		we're going to grab their function pointers.
		for definition of magic numbers, see gen_ml/ml.h	 */
	ml_color = (ColorFunc)SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM)1, ML_IPC_SKIN_WADLG_GETFUNC);
	ml_hook_dialog_msg = (HookDialogFunc)SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM)2, ML_IPC_SKIN_WADLG_GETFUNC);
	ml_draw = (DrawFunc)SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM)3, ML_IPC_SKIN_WADLG_GETFUNC);			


	Hook(WebMediaML.hwndWinampParent);

	// Get IDispatch object for embedded webpages
	winampExternal  = (IDispatch *)SendMessage(WebMediaML.hwndWinampParent, WM_WA_IPC, 0, IPC_GET_DISPATCH_OBJECT);

	MLTREEITEM newTree;
	newTree.size = sizeof(MLTREEITEM);
	newTree.parentId    = 0;
	newTree.title        = "Web MP3";
	newTree.hasChildren = 0;
	newTree.id      = 0;
	MLTREEIMAGE img = {WebMediaML.hDllInstance, IDB_TREEITEM_NOWPLAYING, -1, (BMPFILTERPROC)FILTER_DEFAULT1, 0, 0};
	newTree.imageIndex = (int)(INT_PTR)SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM) &img, ML_IPC_TREEIMAGE_ADD);
	SendMessage(WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM) &newTree, ML_IPC_TREEITEM_ADD);
	webMp3MlItemId = newTree.id;

	return 0;
}

// Gets the current media library tree.
int getRemoteMediaBranch()
{
	// Structure for get tree command.
	mlGetTreeStruct mlGetTree;
	mlGetTree.item_start = 0;
	mlGetTree.cmd_offset = 0;
	mlGetTree.max_numitems = -1;

	// Get the menu handles.
	HMENU treeMenu = HMENU(SendMessage (WebMediaML.hwndLibraryParent, WM_ML_IPC, (WPARAM) &mlGetTree, ML_IPC_GETTREE));
	TCHAR strMenuItem[512];
	for(int x=0; x<GetMenuItemCount(treeMenu); x++)
    {
		GetMenuString(treeMenu, x, LPTSTR(strMenuItem), 512, MF_BYPOSITION);
    }
	DestroyMenu(treeMenu);
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
	if (treeItem == webMp3MlItemId)
	{
		return (INT_PTR)CreateDialog(WebMediaML.hDllInstance, MAKEINTRESOURCE(IDD_SAMPLEHTTP), parent, MainDialogProc);
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
