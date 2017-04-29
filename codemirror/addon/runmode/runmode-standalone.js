// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

window.CodeMirror = {};

((() => {
  "use strict";

  function splitLines(string){ return string.split(/\r?\n|\r/); }

  function StringStream(string) {
    this.pos = this.start = 0;
    this.string = string;
    this.lineStart = 0;
  }
  StringStream.prototype = {
    eol() {return this.pos >= this.string.length;},
    sol() {return this.pos == 0;},
    peek() {return this.string.charAt(this.pos) || null;},
    next() {
      if (this.pos < this.string.length)
        return this.string.charAt(this.pos++);
    },
    eat(match) {
      var ch = this.string.charAt(this.pos);
      if (typeof match == "string") var ok = ch == match;
      else var ok = ch && (match.test ? match.test(ch) : match(ch));
      if (ok) {++this.pos; return ch;}
    },
    eatWhile(match) {
      var start = this.pos;
      while (this.eat(match)){}
      return this.pos > start;
    },
    eatSpace() {
      var start = this.pos;
      while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
      return this.pos > start;
    },
    skipToEnd() {this.pos = this.string.length;},
    skipTo(ch) {
      var found = this.string.indexOf(ch, this.pos);
      if (found > -1) {this.pos = found; return true;}
    },
    backUp(n) {this.pos -= n;},
    column() {return this.start - this.lineStart;},
    indentation() {return 0;},
    match(pattern, consume, caseInsensitive) {
      if (typeof pattern == "string") {
        var cased = str => caseInsensitive ? str.toLowerCase() : str;
        var substr = this.string.substr(this.pos, pattern.length);
        if (cased(substr) == cased(pattern)) {
          if (consume !== false) this.pos += pattern.length;
          return true;
        }
      } else {
        var match = this.string.slice(this.pos).match(pattern);
        if (match && match.index > 0) return null;
        if (match && consume !== false) this.pos += match[0].length;
        return match;
      }
    },
    current() {return this.string.slice(this.start, this.pos);},
    hideFirstChars(n, inner) {
      this.lineStart += n;
      try { return inner(); }
      finally { this.lineStart -= n; }
    }
  };
  CodeMirror.StringStream = StringStream;

  CodeMirror.startState = (mode, a1, a2) => mode.startState ? mode.startState(a1, a2) : true;

  var modes = CodeMirror.modes = {};
  var mimeModes = CodeMirror.mimeModes = {};
  CodeMirror.defineMode = function (name, mode) {
    if (arguments.length > 2)
      mode.dependencies = Array.prototype.slice.call(arguments, 2);
    modes[name] = mode;
  };
  CodeMirror.defineMIME = (mime, spec) => { mimeModes[mime] = spec; };
  CodeMirror.resolveMode = spec => {
    if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
      spec = mimeModes[spec];
    } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
      spec = mimeModes[spec.name];
    }
    if (typeof spec == "string") return {name: spec};
    else return spec || {name: "null"};
  };
  CodeMirror.getMode = (options, spec) => {
    spec = CodeMirror.resolveMode(spec);
    var mfactory = modes[spec.name];
    if (!mfactory) throw new Error("Unknown mode: " + spec);
    return mfactory(options, spec);
  };
  CodeMirror.registerHelper = CodeMirror.registerGlobalHelper = Math.min;
  CodeMirror.defineMode("null", () => ({
    token(stream) {stream.skipToEnd();}
  }));
  CodeMirror.defineMIME("text/plain", "null");

  CodeMirror.runMode = (string, modespec, callback, options) => {
    var mode = CodeMirror.getMode({ indentUnit: 2 }, modespec);

    if (callback.nodeType == 1) {
      var tabSize = (options && options.tabSize) || 4;
      var node = callback;
      var col = 0;
      node.innerHTML = "";
      callback = (text, style) => {
        if (text == "\n") {
          node.appendChild(document.createElement("br"));
          col = 0;
          return;
        }
        var content = "";
        // replace tabs
        for (var pos = 0; ;) {
          var idx = text.indexOf("\t", pos);
          if (idx == -1) {
            content += text.slice(pos);
            col += text.length - pos;
            break;
          } else {
            col += idx - pos;
            content += text.slice(pos, idx);
            var size = tabSize - col % tabSize;
            col += size;
            for (var i = 0; i < size; ++i) content += " ";
            pos = idx + 1;
          }
        }

        if (style) {
          var sp = node.appendChild(document.createElement("span"));
          sp.className = "cm-" + style.replace(/ +/g, " cm-");
          sp.appendChild(document.createTextNode(content));
        } else {
          node.appendChild(document.createTextNode(content));
        }
      };
    }

    var lines = splitLines(string);
    var state = (options && options.state) || CodeMirror.startState(mode);
    for (var i = 0, e = lines.length; i < e; ++i) {
      if (i) callback("\n");
      var stream = new CodeMirror.StringStream(lines[i]);
      if (!stream.string && mode.blankLine) mode.blankLine(state);
      while (!stream.eol()) {
        var style = mode.token(stream, state);
        callback(stream.current(), style, i, stream.start, state);
        stream.start = stream.pos;
      }
    }
  };
}))();
