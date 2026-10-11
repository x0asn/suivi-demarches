@echo off
title Suivi Demarches - Interface (ne pas fermer)

rem Relance uniquement l'interface React (port 5173).
rem A utiliser si la fenetre "Interface" a ete fermee alors que l'API tourne encore.
cd /d "%~dp0frontend"
npm run dev
