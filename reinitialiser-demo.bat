@echo off
chcp 65001 >nul
title Suivi Démarches — réinitialisation des données

echo.
echo  ATTENTION : cette operation EFFACE toutes les donnees de la base
echo  "suivi_demarches" et recree le jeu de demonstration
echo  (comptes, procedures, dossiers, notifications, reclamations).
echo.
echo  A utiliser avant une repetition ou la soutenance.
echo.
set /p CONFIRMATION=Tapez OUI pour continuer :
if /I not "%CONFIRMATION%"=="OUI" (
  echo Operation annulee.
  pause
  exit /b
)

cd /d "%~dp0backend"
if exist "storage\app\private\dossiers" rmdir /s /q "storage\app\private\dossiers"
php artisan migrate:fresh --seed --force

echo.
echo  Donnees de demonstration recreees. Mot de passe de tous les comptes : Demo2026
pause
