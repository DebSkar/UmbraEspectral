@echo off
title Umbra Espectral - Servidor Local
echo Iniciando servidor local para Umbra Espectral...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
pause
