#include "InputPluginManagement.h"
#include "ParseMediaDetails.h"

InputPluginManagement::InputPluginManagement()
{
}

InputPluginManagement::~InputPluginManagement()
{
	// Unload input plugins.
	while (!inModList.empty())
	{
		// Free the library.
		InMod inMod = inModList.front();
		FreeLibrary(inMod.hdll);

		// Delete entry.
		inModList.pop_front();
	}
}

void InputPluginManagement::loadPlugins(const wchar_t *path)
{
	WIN32_FIND_DATA	findfile;	// Data for files that are found.
	HANDLE hFind;	// Handle to input plugin file.
	DWORD width = 0;
	wchar_t use[MAX_PATH];	// Search string for input plugins.

	// Construct search string.
	wsprintf(use, L"%s\\in_*.dll", path);
	// Find files.
	hFind = FindFirstFile(use, &findfile);
	
	// Load input plugins into list.
	while(hFind && hFind != INVALID_HANDLE_VALUE)
	{
		if(!(findfile.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY))	// Not a directory.
		{
			if (wcsicmp(RED_CAZA_MODULE, findfile.cFileName) != 0)	// Don't load self.
			{
				// Create the full filename of the plugin.
				wchar_t file[2*MAX_PATH];
				wsprintf(file, L"%s\\%s", path, findfile.cFileName);

				// Load plugin.
				InMod inMod;
				inMod.hdll = LoadLibrary(file);
				if (inMod.hdll)	// Test plugin has loaded.
				{
					PluginGetter pluginGetter = (PluginGetter)GetProcAddress(inMod.hdll, "winampGetInModule2");
					if (pluginGetter)	// Test plugin was attached (may not have correctly defined entry points).
					{
						inMod.mod = pluginGetter();
					}

					inModList.push_back(inMod);
				}
			}
		}

		// if there are no more files then stop the search
		if(hFind && !FindNextFile(hFind, &findfile))
		{
			FindClose(hFind);
			hFind = 0;
		}
	}
}

bool InputPluginManagement::caseInsensitiveStringFind(const std::wstring& subStr, const std::wstring& fullStr)
{
    std::wstring fullStrCpy(fullStr);
    std::wstring subStrCpy(subStr);
    std::transform(fullStrCpy.begin(), fullStrCpy.end(), fullStrCpy.begin(), ::tolower);
    std::transform(subStrCpy.begin(), subStrCpy.end(), subStrCpy.begin(), ::tolower);

    if (fullStrCpy.find(subStrCpy, 0) != std::wstring::npos)
	{
		return true;
	}
	else
	{
		return false;
	}
}

In_Module* InputPluginManagement::findInputPlugin(const wchar_t *file)
{
	In_Module* foundMod = 0;

	std::list<InMod>::iterator it;

	// Search using IsOurFile first.
	for (it=inModList.begin(); it!=inModList.end(); it++)
	{
		if (it->mod->IsOurFile(file) == 1)
		{
			foundMod = it->mod;
			break;
		}
	}

	if (!foundMod)	// Search by extension.
	{
		// Get the filename extension.
		std::wstring ext = std::wstring(PathFindExtension(file));
		ext.erase(0, 1);	// Remove "."

		for (it=inModList.begin(); it!=inModList.end(); it++)
		{
			std::string extensionList = std::string(it->mod->FileExtensions);
			std::wstring wExtensionList = s2ws(extensionList);
			if (caseInsensitiveStringFind(ext, wExtensionList))
			{
				foundMod = it->mod;
				break;
			}
		}
	}

	return foundMod;
}