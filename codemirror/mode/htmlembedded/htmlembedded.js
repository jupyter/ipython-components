// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

((mod => {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../htmlmixed/htmlmixed"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../htmlmixed/htmlmixed"], mod);
  else // Plain browser env
    mod(CodeMirror);
}))(CodeMirror => {
"use strict";

CodeMirror.defineMode("htmlembedded", (config, parserConfig) => {
  //config settings
  var scriptStartRegex = parserConfig.scriptStartRegex || /^<%/i;

  var scriptEndRegex = parserConfig.scriptEndRegex || /^%>/i;

  //inner modes
  var scriptingMode;

  var htmlMixedMode;

  //tokenizer when in html mode
  function htmlDispatch(stream, state) {
      if (stream.match(scriptStartRegex, false)) {
          state.token=scriptingDispatch;
          return scriptingMode.token(stream, state.scriptState);
          }
      else
          return htmlMixedMode.token(stream, state.htmlState);
    }

  //tokenizer when in scripting mode
  function scriptingDispatch(stream, state) {
      if (stream.match(scriptEndRegex, false))  {
          state.token=htmlDispatch;
          return htmlMixedMode.token(stream, state.htmlState);
         }
      else
          return scriptingMode.token(stream, state.scriptState);
         }


  return {
    startState() {
      scriptingMode = scriptingMode || CodeMirror.getMode(config, parserConfig.scriptingModeSpec);
      htmlMixedMode = htmlMixedMode || CodeMirror.getMode(config, "htmlmixed");
      return {
          token :  parserConfig.startOpen ? scriptingDispatch : htmlDispatch,
          htmlState : CodeMirror.startState(htmlMixedMode),
          scriptState : CodeMirror.startState(scriptingMode)
      };
    },

    token(stream, state) {
      return state.token(stream, state);
    },

    indent(state, textAfter) {
      if (state.token == htmlDispatch)
        return htmlMixedMode.indent(state.htmlState, textAfter);
      else if (scriptingMode.indent)
        return scriptingMode.indent(state.scriptState, textAfter);
    },

    copyState(state) {
      return {
       token : state.token,
       htmlState : CodeMirror.copyState(htmlMixedMode, state.htmlState),
       scriptState : CodeMirror.copyState(scriptingMode, state.scriptState)
      };
    },

    innerMode(state) {
      if (state.token == scriptingDispatch) return {state: state.scriptState, mode: scriptingMode};
      else return {state: state.htmlState, mode: htmlMixedMode};
    }
  };
}, "htmlmixed");

CodeMirror.defineMIME("application/x-ejs", { name: "htmlembedded", scriptingModeSpec:"javascript"});
CodeMirror.defineMIME("application/x-aspx", { name: "htmlembedded", scriptingModeSpec:"text/x-csharp"});
CodeMirror.defineMIME("application/x-jsp", { name: "htmlembedded", scriptingModeSpec:"text/x-java"});
CodeMirror.defineMIME("application/x-erb", { name: "htmlembedded", scriptingModeSpec:"ruby"});

});
