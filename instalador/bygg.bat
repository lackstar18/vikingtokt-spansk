@echo off
rem Compila Vikingtokt-Installer.exe con el compilador de C# que ya trae Windows (.NET Framework 4).
cd /d "%~dp0"
"%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /codepage:65001 /target:winexe /optimize+ /out:Vikingtokt-Installer.exe /win32icon:..\arte\vikingtokt.ico /win32manifest:app.manifest /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll Installer.cs
