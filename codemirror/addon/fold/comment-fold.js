// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

((mod => {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
}))(CodeMirror => {
"use strict";

CodeMirror.registerGlobalHelper("fold", "comment", mode => mode.blockCommentStart && mode.blockCommentEnd, (cm, start) => {
  var mode = cm.getModeAt(start);
  var startToken = mode.blockCommentStart;
  var endToken = mode.blockCommentEnd;
  if (!startToken || !endToken) return;
  var line = start.line;
  var lineText = cm.getLine(line);

  var startCh;
  for (var at = start.ch, pass = 0;;) {
    var found = at <= 0 ? -1 : lineText.lastIndexOf(startToken, at - 1);
    if (found == -1) {
      if (pass == 1) return;
      pass = 1;
      at = lineText.length;
      continue;
    }
    if (pass == 1 && found < start.ch) return;
    if (/comment/.test(cm.getTokenTypeAt(CodeMirror.Pos(line, found + 1)))) {
      startCh = found + startToken.length;
      break;
    }
    at = found - 1;
  }

  var depth = 1;
  var lastLine = cm.lastLine();
  var end;
  var endCh;
  outer: for (var i = line; i <= lastLine; ++i) {
    var text = cm.getLine(i);
    var pos = i == line ? startCh : 0;
    for (;;) {
      var nextOpen = text.indexOf(startToken, pos);
      var nextClose = text.indexOf(endToken, pos);
      if (nextOpen < 0) nextOpen = text.length;
      if (nextClose < 0) nextClose = text.length;
      pos = Math.min(nextOpen, nextClose);
      if (pos == text.length) break;
      if (pos == nextOpen) ++depth;
      else if (!--depth) { end = i; endCh = pos; break outer; }
      ++pos;
    }
  }
  if (end == null || line == end && endCh == startCh) return;
  return {from: CodeMirror.Pos(line, startCh),
          to: CodeMirror.Pos(end, endCh)};
});

});
