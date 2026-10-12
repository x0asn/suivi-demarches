@echo off
chcp 65001 >nul
title Suivi Démarches — démarrage pour téléphones

echo.
echo  ============================================================
echo     SUIVI DEMARCHES — Lancement accessible aux telephones
echo  ============================================================
echo.
echo  A utiliser le jour de la soutenance, pour que le jury puisse
echo  scanner le QR code de l'accuse de reception avec un telephone.
echo.
echo  Pre-requis :
echo   - Laragon est demarre (bouton "Demarrer tout") ;
echo   - l'ordinateur et les telephones sont sur le MEME wifi ;
echo   - si Windows demande une autorisation pour Node.js, cliquer "Autoriser".
echo.

rem --- Le QR code pointe vers l'adresse de l'ordinateur sur le wifi ---
cd /d "%~dp0backend"
php artisan demo:adresse --reseau
if errorlevel 1 (
  echo.
  echo  Impossible de trouver l'adresse reseau. Utilisez demarrer.bat a la place.
  pause
  exit /b
)

rem --- API Laravel (port 8000) ---
start "Suivi Demarches - API (ne pas fermer)" cmd /k php artisan serve --port=8000

rem --- Interface React (port 5173), ouverte au reseau local ---
cd /d "%~dp0frontend"
start "Suivi Demarches - Interface (ne pas fermer)" cmd /k npm run dev -- --host

echo.
echo  Demarrage en cours, le navigateur va s'ouvrir...
timeout /t 6 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo  Sur cet ordinateur : http://localhost:5173
echo  Sur un telephone   : l'adresse affichee ci-dessus (http://192.168.x.x:5173)
echo.
echo  Apres la soutenance, relancez simplement demarrer.bat :
echo  il remet l'adresse normale.
echo.
pause
