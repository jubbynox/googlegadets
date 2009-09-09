#ifndef WIN_AMP_HOOKS
#define WIN_AMP_HOOKS

#include <windows.h>
#include <api/service/api_service.h>

#define WM_GOTOPAGE	WM_USER + 2001

// Creates the main web page dialog (see SampleHtp.cpp).
INT_PTR CALLBACK MainDialogProc(HWND hwndDlg, UINT uMsg, WPARAM wParam, LPARAM lParam);

// Handle to parent windows.
extern HWND *hwndLibraryParent;
extern HWND *hwndWinampParent;

// Exposes OLE protocol of WinAmp for embedding web pages.
extern IDispatch *winampExternal;

// Exposes WASABI API.
extern api_service *wasabiServiceManager;

/* function pointer for letting winamp get first dibs on dialog messages */
typedef int (*HookDialogFunc)(HWND hwndDlg, UINT uMsg, WPARAM wParam, LPARAM lParam);
extern HookDialogFunc ml_hook_dialog_msg;

/* function pointer for drawing dialog items in winamp style */
typedef void (*DrawFunc)(HWND hwndDlg, int *tab, int tabsize); 
extern DrawFunc ml_draw;

/* The font used by the media library. */
extern HFONT ml_font;

/* function pointer to retrieve winamp skin colors */
typedef int (*ColorFunc)(int idx);
extern ColorFunc ml_color;

// N.B. This must be called before using the web control.
void hookToWinAmp(HWND &hwndLibrary, HWND &hwndWinamp);

#endif WIN_AMP_HOOKS