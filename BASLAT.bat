@echo off
chcp 65001 > nul
title Fırsat Lab
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Baslat.ps1"
if errorlevel 1 pause
