%1 MergeJS.py %2\yaml\remotemedia\CommonCode.js %2\scripts
%1 MergeJS.py %2\yaml\remotemedia\GoogleMedia.js %2\scripts\google
xcopy %2\src\*.* %3\ /E /Y
xcopy %2\yaml\*.* %3\ /E /Y