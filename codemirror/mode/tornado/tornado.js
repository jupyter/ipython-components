// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

((mod => {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../htmlmixed/htmlmixed"),
        require("../../addon/mode/overlay"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../htmlmixed/htmlmixed",
            "../../addon/mode/overlay"], mod);
  else // Plain browser env
    mod(CodeMirror);
}))(CodeMirror => {
  "use strict";

  CodeMirror.defineMode("tornado:inner", () => {
    var keywords = ["and","as","assert","autoescape","block","break","class","comment","context",
                    "continue","datetime","def","del","elif","else","end","escape","except",
                    "exec","extends","false","finally","for","from","global","if","import","in",
                    "include","is","json_encode","lambda","length","linkify","load","module",
                    "none","not","or","pass","print","put","raise","raw","return","self","set",
                    "squeeze","super","true","try","url_escape","while","with","without","xhtml_escape","yield"];
    keywords = new RegExp("^((" + keywords.join(")|(") + "))\\b");

    function tokenBase (stream, state) {
      stream.eatWhile(/[^\{]/);
      var ch = stream.next();
      if (ch == "{") {
        if (ch = stream.eat(/\{|%|#/)) {
          state.tokenize = inTag(ch);
          return "tag";
        }
      }
    }
    function inTag (close) {
      if (close == "{") {
        close = "}";
      }
      return (stream, state) => {
        var ch = stream.next();
        if ((ch == close) && stream.eat("}")) {
          state.tokenize = tokenBase;
          return "tag";
        }
        if (stream.match(keywords)) {
          return "keyword";
        }
        return close == "#" ? "comment" : "string";
      };
    }
    return {
      startState() {
        return {tokenize: tokenBase};
      },
      token(stream, state) {
        return state.tokenize(stream, state);
      }
    };
  });

  CodeMirror.defineMode("tornado", config => {
    var htmlBase = CodeMirror.getMode(config, "text/html");
    var tornadoInner = CodeMirror.getMode(config, "tornado:inner");
    return CodeMirror.overlayMode(htmlBase, tornadoInner);
  });

  CodeMirror.defineMIME("text/x-tornado", "tornado");
});
