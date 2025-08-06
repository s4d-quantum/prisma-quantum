"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/set-function-name";
exports.ids = ["vendor-chunks/set-function-name"];
exports.modules = {

/***/ "(rsc)/./node_modules/set-function-name/index.js":
/*!*************************************************!*\
  !*** ./node_modules/set-function-name/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar define = __webpack_require__(/*! define-data-property */ \"(rsc)/./node_modules/define-data-property/index.js\");\nvar hasDescriptors = __webpack_require__(/*! has-property-descriptors */ \"(rsc)/./node_modules/has-property-descriptors/index.js\")();\nvar functionsHaveConfigurableNames = (__webpack_require__(/*! functions-have-names */ \"(rsc)/./node_modules/functions-have-names/index.js\").functionsHaveConfigurableNames)();\n\nvar $TypeError = __webpack_require__(/*! es-errors/type */ \"(rsc)/./node_modules/es-errors/type.js\");\n\n/** @type {import('.')} */\nmodule.exports = function setFunctionName(fn, name) {\n\tif (typeof fn !== 'function') {\n\t\tthrow new $TypeError('`fn` is not a function');\n\t}\n\tvar loose = arguments.length > 2 && !!arguments[2];\n\tif (!loose || functionsHaveConfigurableNames) {\n\t\tif (hasDescriptors) {\n\t\t\tdefine(/** @type {Parameters<define>[0]} */ (fn), 'name', name, true, true);\n\t\t} else {\n\t\t\tdefine(/** @type {Parameters<define>[0]} */ (fn), 'name', name);\n\t\t}\n\t}\n\treturn fn;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvc2V0LWZ1bmN0aW9uLW5hbWUvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQWE7O0FBRWIsYUFBYSxtQkFBTyxDQUFDLGdGQUFzQjtBQUMzQyxxQkFBcUIsbUJBQU8sQ0FBQyx3RkFBMEI7QUFDdkQscUNBQXFDLHNJQUE4RDs7QUFFbkcsaUJBQWlCLG1CQUFPLENBQUMsOERBQWdCOztBQUV6QyxXQUFXLGFBQWE7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsdUJBQXVCO0FBQzVDLElBQUk7QUFDSixxQkFBcUIsdUJBQXVCO0FBQzVDO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyIvaG9tZS9nYXNjYXQvcHJpc21hcXVhbnQvcHJpc21hLXF1YW50dW0vbm9kZV9tb2R1bGVzL3NldC1mdW5jdGlvbi1uYW1lL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmluZSA9IHJlcXVpcmUoJ2RlZmluZS1kYXRhLXByb3BlcnR5Jyk7XG52YXIgaGFzRGVzY3JpcHRvcnMgPSByZXF1aXJlKCdoYXMtcHJvcGVydHktZGVzY3JpcHRvcnMnKSgpO1xudmFyIGZ1bmN0aW9uc0hhdmVDb25maWd1cmFibGVOYW1lcyA9IHJlcXVpcmUoJ2Z1bmN0aW9ucy1oYXZlLW5hbWVzJykuZnVuY3Rpb25zSGF2ZUNvbmZpZ3VyYWJsZU5hbWVzKCk7XG5cbnZhciAkVHlwZUVycm9yID0gcmVxdWlyZSgnZXMtZXJyb3JzL3R5cGUnKTtcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4nKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2V0RnVuY3Rpb25OYW1lKGZuLCBuYW1lKSB7XG5cdGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignYGZuYCBpcyBub3QgYSBmdW5jdGlvbicpO1xuXHR9XG5cdHZhciBsb29zZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmICEhYXJndW1lbnRzWzJdO1xuXHRpZiAoIWxvb3NlIHx8IGZ1bmN0aW9uc0hhdmVDb25maWd1cmFibGVOYW1lcykge1xuXHRcdGlmIChoYXNEZXNjcmlwdG9ycykge1xuXHRcdFx0ZGVmaW5lKC8qKiBAdHlwZSB7UGFyYW1ldGVyczxkZWZpbmU+WzBdfSAqLyAoZm4pLCAnbmFtZScsIG5hbWUsIHRydWUsIHRydWUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWZpbmUoLyoqIEB0eXBlIHtQYXJhbWV0ZXJzPGRlZmluZT5bMF19ICovIChmbiksICduYW1lJywgbmFtZSk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmbjtcbn07XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/set-function-name/index.js\n");

/***/ })

};
;