@echo off
cd /d "%~dp0.."
echo === Running extraction pipeline tests ===
node --test --env-file=.env test/extraction-pipeline.test.js