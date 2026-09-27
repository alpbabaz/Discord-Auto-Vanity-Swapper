@echo off
if not exist package.json (
    echo {"type": "module"} > package.json
)
node swap.js
pause
