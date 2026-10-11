@echo off
chcp 65001 >nul
title Suivi Démarches — démarrage

echo.
echo  ============================================
echo     SUIVI DEMARCHES — Lancement de la plateforme
echo  ============================================
echo.
echo  Pre-requis : Laragon doit etre demarre (bouton "Demarrer tout").
echo.

rem --- API Laravel (port 8000) ---
cd /d "%~dp0backend"
start "Suivi Demarches - API (ne pas fermer)" cmd /k php artisan serve --port=8000

rem --- Interface React (port 5173) ---
cd /d "%~dp0frontend"
start "Suivi Demarches - Interface (ne pas fermer)" cmd /k npm run dev

echo  Demarrage en cours, le navigateur va s'ouvrir...
timeout /t 6 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo  La plateforme est ouverte sur http://localhost:5173
echo  Pour l'arreter : fermez les deux fenetres noires "Suivi Demarches".
echo.
pause
