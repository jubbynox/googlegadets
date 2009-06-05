#include "WinAmpHooks.h"
#include "../../Winamp/wa_ipc.h"
#include "../../gen_ml/ml.h"

HWND *hwndLibraryParent = 0;
HWND *hwndWinampParent = 0;
IDispatch *winampExternal = 0;
api_service *wasabiServiceManager = 0;
HookDialogFunc ml_hook_dialog_msg = 0;	// Function hook to allow WinAmp to access the dialog first.
DrawFunc ml_draw = 0;	// Function to make WinAmp paint the dialog using current skin.
ColorFunc ml_color = 0;	// Functions to retrieve the skin colours.
HFONT ml_font = 0;	// The font of the media library.

DWORD threadStorage=TLS_OUT_OF_INDEXES;

void hookToWinAmp(HWND &hwndLibrary, HWND &hwndWinamp)
{
	hwndLibraryParent = &hwndLibrary;
	hwndWinampParent = &hwndWinamp;

	// Get IDispatch object for embedded webpages
	winampExternal  = (IDispatch *)SendMessage(hwndWinamp, WM_WA_IPC, 0, IPC_GET_DISPATCH_OBJECT);
	// Get the WSABI service.
	wasabiServiceManager = (api_service*)SendMessage(hwndWinamp, WM_WA_IPC, 0, IPC_GET_API_SERVICE);

	// Load media library functions and data.
	ml_color = (ColorFunc)SendMessage(hwndLibrary, WM_ML_IPC, (WPARAM)1, ML_IPC_SKIN_WADLG_GETFUNC);
	ml_hook_dialog_msg = (HookDialogFunc)SendMessage(hwndLibrary, WM_ML_IPC, (WPARAM)2, ML_IPC_SKIN_WADLG_GETFUNC);
	ml_draw = (DrawFunc)SendMessage(hwndLibrary, WM_ML_IPC, (WPARAM)3, ML_IPC_SKIN_WADLG_GETFUNC);
	ml_font = (HFONT)SendMessage(hwndLibrary, WM_ML_IPC, (WPARAM)66, ML_IPC_SKIN_WADLG_GETFUNC);

	// Thread memory.
	threadStorage = TlsAlloc();
}