define(function(require, exports, module) {
  "use strict";

  var CoffeeScript = (function() {
    if (global.CoffeeScript) {
      return global.CoffeeScript;
    }
    try {
      return require(["coffee-script"][0]);
    } catch(e) {}
  })();

  // CoffeeScript tags
  // IDENTIFIER
  // NUMBER
  // STRING
  // REGEX
  // BOOL
  // NULL
  // UNDEFINED
  // COMPOUND_ASSIGN -=, +=, div=, *=, %=, ||=, &&=, ?=, <<=, >>=, >>>=, &=, ^=, |=
  // UNARY           !, ~, new, typeof, delete, do
  // LOGIC           &&, ||, &, |, ^
  // SHIFT           <<, >>, >>>
  // COMPARE         ==, !=, <, >, <=, >=
  // MATH            *, div, %, 
  // RELATION        in, of, instanceof
  // =
  // +
  // -
  // ..
  // ...
  // ++
  // --
  // (
  // )
  // [
  // ]
  // {
  // }
  // ?
  // ::
  // @
  // THIS
  // SUPER
  // INDENT
  // OUTDENT
  // TERMINATOR

  var TAG   = 0;
  var VALUE = 1;
  var _     = {}; // empty location
  
  var dumpTokens = function(tokens) {
    console.log(tokens.map(function(t) {
      return t[0] + "\t" + t[1];
    }).join("\n"));
  };
  
  var tab = function(n) {
    var t = "";
    while (n--) {
      t += " ";
    }
    return t;
  };
  
  var findOperandHead = function(tokens, index) {
    var bracket = 0;
    index -= 1;
    while (0 < index) {
      var token = tokens[index - 1];
      if (!token || token[TAG] !== ".") {
        token = tokens[index];
        switch (token[TAG]) {
        case "INDENT":
          return index + 1;
        case "(": case "[": case "{":
          bracket -= 1;
          /* falls through */
        case "IDENTIFIER":
        case "NUMBER": case "STRING": case "BOOL":
        case "REGEX": case "NULL": case "UNDEFINED":
          if (bracket === 0) {
            token = tokens[index - 1];
            if (token) {
              if (token[TAG] === "UNARY") {
                return index - 1;
              }
              if (token[VALUE] === "+" || token[VALUE] === "-") {
                token = tokens[index - 2];
                if (!token) {
                  return index - 1;
                }
                switch (token[TAG]) {
                case "INDENT": case "TERMINATOR": case "CALL_START":
                case "COMPOUND_ASSIGN": case "UNARY": case "LOGIC":
                case "SHIFT": case "COMPARE": case "=": case "..": case "...":
                case "[": case "(": case "{": case ",": case "?":
                  return index - 1;
                }
              }
            }
            return index;
          }
          break;
        case "}": case "]": case ")": case "CALL_END":
          bracket += 1;
          break;
        }
      }
      index -= 1;
    }
    return 0;
  };

  var findOperandTail = function(tokens, index) {
    var bracket = 0;
    index += 1;
    while (index < tokens.length) {
      var token = tokens[index + 1];
      if (!token || token[TAG] !== ".") {
        token = tokens[index];
        switch (token[TAG]) {
        case "TERMINATOR": case "OUTDENT":
          return index - 1;
        case "IDENTIFIER":
          token = tokens[index + 1];
          if (token && token[TAG] === "CALL_START") {
            bracket += 1;
            break;
          }
          if (bracket === 0) {
            return index;
          }
          break;
        case "NUMBER": case "STRING": case "BOOL":
        case "REGEX": case "NULL": case "UNDEFINED":
          if (bracket === 0) {
            return index;
          }
          break;
        case "(": case "[": case "{":
          bracket += 1;
          break;
        case "}": case "]": case ")": case "CALL_END":
          bracket -= 1;
          if (bracket === 0) {
            return index;
          }
          break;
        }
      }
      index += 1;
    }
    return tokens.length - 1;
  };

  var replacePi = function(tokens) {
    var i = 0, a;
    while (i < tokens.length) {
      var token = tokens[i];
      if (token[VALUE] === "pi") {
        tokens.splice(i, 1);
        token = tokens[i - 1];
        if (token && token[TAG] === "NUMBER") {
          a = findOperandHead(tokens, i);
          tokens.splice(i++, 0, ["MATH", "*", _]);
        } else {
          a = -1;
        }
        tokens.splice(i++, 0, ["IDENTIFIER", "Math", _]);
        tokens.splice(i++, 0, ["."         , "."   , _]);
        tokens.splice(i++, 0, ["IDENTIFIER", "PI"  , _]);
        if (a !== -1) {
          tokens.splice(i, 0, [")", ")", _]);
          tokens.splice(a, 0, ["(", "(", _]);
        }
      }
      i += 1;
    }
    // dumpTokens(tokens);
    return tokens;
  };

  var replacePrecedence = function(tokens) {
    var i = 0;
    while (i < tokens.length) {
      var token = tokens[i];
      if (token[TAG] === "MATH") {
        var a = findOperandHead(tokens, i);
        var b = findOperandTail(tokens, i) + 1;
        tokens.splice(b, 0, [")", ")" , _]);
        tokens.splice(a, 0, ["(", "(" , _]);
        i += 1;
      }
      i += 1;
    }
    // dumpTokens(tokens);
    return tokens;
  };

  var replaceBinaryOpTable = {
    "+": "__add__",
    "-": "__sub__",
    "*": "__mul__",
    "/": "__div__",
    "%": "__mod__",
  };
  
  var replaceBinaryOp = function(tokens) {
    var i = 0;
    var replaceable = false;
    while (i < tokens.length) {
      var token = tokens[i];
      if (replaceable) {
        var selector = replaceBinaryOpTable[token[VALUE]];
        if (selector) {
          var b = findOperandTail(tokens, i) + 1;
          tokens.splice(i++, 1, ["."         , "."     , _]);
          tokens.splice(i++, 0, ["IDENTIFIER", selector, _]);
          tokens.splice(i++, 0, ["CALL_START", "("     , _]);
          tokens.splice(b+2, 0, ["CALL_END"  , ")"     , _]);
          replaceable = false;
          continue;
        }
      }
      switch (token[TAG]) {
      case "INDENT": case "TERMINATOR": case "CALL_START":
      case "COMPOUND_ASSIGN": case "UNARY": case "LOGIC":
      case "SHIFT": case "COMPARE": case "=": case "..": case "...":
      case "[": case "(": case "{": case ",": case "?":
        replaceable = false;
        break;
      default:
        replaceable = true;
      }
      i += 1;
    }
    // dumpTokens(tokens);
    return tokens;
  };
  
  var Compiler = (function() {
    function Compiler() {
    }
    Compiler.prototype.tokens = function(code) {
      var tokens = CoffeeScript.tokens(code);
      tokens = replacePi(tokens);
      tokens = replacePrecedence(tokens);
      tokens = replaceBinaryOp(tokens);
      return tokens;
    };
    Compiler.prototype.compile = function(code) {
      var tokens = this.tokens(code);
      return CoffeeScript.nodes(tokens).compile({bare:true}).trim();
    };
    Compiler.prototype.toString = function(tokens) {
      var indent = 0;
      if (typeof tokens === "string") {
        tokens = this.tokens(tokens);
      }
      return tokens.map(function(token) {
        switch (token[TAG]) {
        case "TERMINATOR":
          return "\n";
        case "INDENT":
          indent += token[VALUE]|0;
          return "\n" + tab(indent);
        case "OUTDENT":
          indent -= token[VALUE]|0;
          return "\n" + tab(indent);
        case ",":
          return token[VALUE] + " ";
        default:
          return token[VALUE];
        }
      }).join("").trim();
    };
    return Compiler;
  })();

  module.exports = {
    Compiler: Compiler,
    dumpTokens       : dumpTokens,
    findOperandHead  : findOperandHead,
    findOperandTail  : findOperandTail,
    replacePi        : replacePi,
    replacePrecedence: replacePrecedence,
    replaceBinaryOp  : replaceBinaryOp,
  };

});
