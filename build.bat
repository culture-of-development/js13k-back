
if exist "./output" rd /q /s "./output"

CALL mkdir output

CALL cd src

CALL uglifyjs --mangle-props -m -c drop_console=true --toplevel game.js -o ../output/game.js

for %%I in (index.html) do copy %%I "../output"

CALL cd ..

if exist "./build" rd /q /s "./build"

CALL mkdir build

CALL zip build/offline.zip ./output/*

CALL ls -la build/