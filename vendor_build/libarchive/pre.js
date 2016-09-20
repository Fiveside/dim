// Emscripten pre-module script.
var Module = {};
Module.noInitialRun = true;
Module.noExitRuntime = true;

// Force override the environment (web environ does weird stuff?).
Module.ENVIRONMENT = "NODE";
