mkdir %3\scripts
%1 MergeJS.py %3\scripts\CommonCode.js %2\scripts
%1 MergeJS.py %3\scripts\GoogleMedia.js %2\scripts\google
%1 MergeJS.py %3\scripts\YouTube.js %2\scripts\youtube
xcopy %2\src\*.* %3\ /E /Y
xcopy %2\yaml\*.* %3\ /E /Y
xcopy %2\html\*.* %3\html\ /E /Y
xcopy %2\templates\*.* %3\templates\ /E /Y