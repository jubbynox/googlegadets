#ifndef INPUT_PLUGIN_MANAGEMENT
#define INPUT_PLUGIN_MANAGEMENT

#include <windows.h>
#include <list>
#include <algorithm>
#include <shlwapi.h>
#include "../../Winamp/in2.h"

#define RED_CAZA_MODULE L"in_redcaza.dll"	// The name of this module.

typedef struct	// Structure to hold input plugin handle and module.
{
	In_Module *mod;
	HMODULE hdll;
} InMod;

typedef In_Module* (*PluginGetter)(void);

class InputPluginManagement
{
	private:
		std::list<InMod> inModList;		// input plugin list
		bool caseInsensitiveStringFind(const std::wstring& subStr, const std::wstring& fullStr);	// Case insensitive string comparison.

	public:
		InputPluginManagement();
		~InputPluginManagement();
		void InputPluginManagement::loadPlugins(const wchar_t *file);	// Loads plugins.
		In_Module* findInputPlugin(const wchar_t *file);	// Finds an input plugin to use with the file.
};

#endif