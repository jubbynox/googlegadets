# Auto-generated by EclipseNSIS Script Wizard
# 26-Jun-2009 08:03:24

Name redcaza

# General Symbol Definitions
!define REGKEY "SOFTWARE\$(^Name)"
!define VERSION 0.1
!define COMPANY "Banacek Music"
!define URL http://winamp.banacek.org

# Included files
!include Sections.nsh
!include Library.nsh
!include NSISpcre.nsh

# Macros used in installer.
!insertmacro REMatches

# Installer pages
Page components
Page directory
Page instfiles

# Installer attributes
OutFile install_redcaza.exe
InstallDir $PROGRAMFILES\Winamp\Plugins
CRCCheck on
XPStyle on
Icon "${NSISDIR}\Contrib\Graphics\Icons\classic-install.ico"
ShowInstDetails show
AutoCloseWindow false
VIProductVersion 0.1.0.0
VIAddVersionKey ProductName redcaza
VIAddVersionKey ProductVersion "${VERSION}"
VIAddVersionKey CompanyName "${COMPANY}"
VIAddVersionKey CompanyWebsite "${URL}"
VIAddVersionKey FileVersion "${VERSION}"
VIAddVersionKey FileDescription ""
VIAddVersionKey LegalCopyright ""

InstType "full"
InstType "minimal"

# Installer sections
Section "redcaza Winamp DLLs" SEC0000
    SectionIn 1 2 RO
    AddSize 2292
    # Installing library C:\Program Files\Winamp\Plugins\in_redcaza.dll
    !insertmacro InstallLib DLL NOTSHARED NOREBOOT_PROTECTED "C:\Program Files\Winamp\Plugins\in_redcaza.dll" $INSTDIR\in_redcaza.dll $INSTDIR

    # Installing library C:\Program Files\Winamp\Plugins\ml_redcaza.dll
    !insertmacro InstallLib DLL NOTSHARED NOREBOOT_PROTECTED "C:\Program Files\Winamp\Plugins\ml_redcaza.dll" $INSTDIR\ml_redcaza.dll $INSTDIR
SectionEnd

Section "VLC" SEC0001
    SectionIn 1
    AddSize 16351
    ReadRegStr $R0 HKLM SOFTWARE\VideoLAN\VLC Version
    IfErrors askPermission
    StrCmp $R0 "0.9.9" alreadyInstalled wrongVersionInstalled
    alreadyInstalled:
        MessageBox MB_YESNO|MB_ICONQUESTION "According to the registry, VLCv0.9.9 is already installed.$\nWould you like to re-install it?" IDYES retry IDNO
        Goto done
    wrongVersionInstalled:
        MessageBox MB_YESNO|MB_ICONQUESTION "According to the registry, VLCv$R0 is installed.$\nredcaza has not been tested with this version.$\nWould you like to install v0.9.9?" IDYES retry IDNO
        Goto done
    askPermission:
        MessageBox MB_YESNO|MB_ICONQUESTION "redcaza requires VLC to operate fully$\n-- http://www.videolan.org/vlc --$\n$\nThis will now be downloaded and installed.$\nDo you wish to continue?" IDYES retry IDNO
        Goto done
    retry:
    IfFileExists $TEMP\vlc-0.9.9-win32.exe installVLC
    NSISdl::download http://www.videolan.org/mirror-geo.php?file=vlc/0.9.9/win32/vlc-0.9.9-win32.exe $TEMP\vlcLocation.htm
    Pop $R0 ;Get the return value
      StrCmp $R0 "success" +3
        MessageBox MB_RETRYCANCEL|MB_ICONQUESTION "Unable to download VLC installer location.$\n Try again?" IDRETRY retry IDCANCEL
        Goto done
    Call findVLCDownload
    Pop $R0
    StrCmp $R0 "" findLocationError downloadInstaller
    findLocationError:
        MessageBox MB_RETRYCANCEL|MB_ICONQUESTION "Failed to find VLC download location.$\n Try again?" IDRETRY retry IDCANCEL
        Goto done
    downloadInstaller:
    NSISdl::download $R0 $TEMP\vlc-0.9.9-win32.exe
    Pop $R0
    StrCmp $R0 "success" +3
        MessageBox MB_RETRYCANCEL|MB_ICONQUESTION "Unable to download VLC installer.$\n Try again?" IDRETRY retry IDCANCEL
        Goto done
    installVLC:
    ExecWait '"$TEMP\vlc-0.9.9-win32.exe"'
    IfErrors installError done
    installError:
        MessageBox MB_RETRYCANCEL|MB_ICONQUESTION "Installation of VLC failed.$\n Try again?" IDRETRY retry IDCANCEL
    done:
SectionEnd

# Find VLC download location.
Function findVLCDownload
    StrCpy $R0 ""
    FileOpen $R1 $TEMP\vlcLocation.htm r
    IfErrors done
    loop:
        FileRead $R1 $R2
        ${RECaptureMatches} $R3 "url=(.*?)$\"" $R2 1
        IfErrors loopFinished
        StrCmp $R3 "1" match loop
        match:
            Pop $R0
            Goto loopFinished
    Goto loop
    loopFinished:
        FileClose $R1
    done:
        Push $R0
FunctionEnd

# Installer functions
Function .onInit
    InitPluginsDir
FunctionEnd

