mkdir %3\scripts
%1 MergeJS.py %3\scripts\CommonCode.js %2\scripts
%1 MergeJS.py %3\scripts\CustomYUI.js %2\scripts\customYUI
%1 MergeJS.py %3\scripts\GoogleMedia.js %2\scripts\google
%1 MergeJS.py %3\scripts\YouTube.js %2\scripts\youtube
%1 MergeJS.py %3\scripts\HomePage.js %2\scripts\homepage
xcopy %2\src\*.* %3\ /E /Y
xcopy %2\yaml\*.* %3\ /E /Y
xcopy %2\html\*.* %3\html\ /E /Y
xcopy %2\img\*.* %3\img\ /E /Y
xcopy %2\css\*.* %3\css\ /E /Y
xcopy %2\templates\*.* %3\templates\ /E /Y
xcopy %2\installer\install_redcaza.exe %3\installer\ /E /Y