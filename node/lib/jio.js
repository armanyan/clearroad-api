(function (window) {
  var navigator = {},
  RSVP = require('rsvp'),
  moment = require('moment'),
  Rusha = require('rusha'),
  XMLHttpRequest = require('xhr2'),
  FormData = require('form-data'),
  URI = require('urijs'),
  UriTemplate = require('uritemplate'),
  process = require('process');

window.FormData = window.FormData || FormData;
window.XMLHttpRequest = window.XMLHttpRequest || XMLHttpRequest;
var html5weakmap = new WeakMap();

function EventTarget() {
  html5weakmap.set(this, Object.create(null));
};

EventTarget.prototype.addEventListener = function (type, listener) {
  if (typeof listener !== 'function') {
    return;
  }
  var em = html5weakmap.get(this);
  type = type.toString();
  if (em[type]) {
    em[type].push(listener);
  } else {
    em[type] = [listener];
  }
};

EventTarget.prototype.removeEventListener = function (type, listener) {
  if (typeof listener !== 'function') {
    return;
  }
  var em = html5weakmap.get(this),
    i,
    listeners = em[type];

  type = type.toString();

  if (listeners) {
    for (i = 0; i < listeners.length; ++i) {
      if (listeners[i] === listener) {
        if (listeners.length === 1) {
          delete em[type];
          return;
        }
        listeners.splice(i, 1);
        return;
      }
    }
  }
};

EventTarget.prototype.dispatchEvent = function (event) {
  var type = event.type.toString(),
    em = html5weakmap.get(this),
    ontype = 'on' + type,
    i,
    listeners;

  if (typeof this[ontype] === 'function') {
    try {
      this[ontype](event);
    } catch (ignore) {}
  }
  listeners = em[type];
  if (listeners) {
    for (i = 0; i < listeners.length; ++i) {
      try {
        listeners[i](event);
      } catch (ignore) {}
    }
  }
};

window.EventTarget = window.EventTarget || EventTarget;

function Blob(blobParts, options) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Blob
  var i,
    priv = {},
    buffers = [];

  html5weakmap.set(this, priv);
  if (blobParts) {
    for (i = 0; i < blobParts.length; ++i) {
      if (Buffer.isBuffer(blobParts[i])) {
        buffers.push(blobParts[i]);
      } else if (blobParts[i] instanceof Blob) {
        buffers.push(html5weakmap.get(blobParts[i]).data);
      } else if (blobParts[i] instanceof ArrayBuffer) {
        buffers.push(new Buffer(new Uint8Array(blobParts[i])));
      } else {
        buffers.push(new Buffer('' + blobParts[i]));
      }
    }
  }
  priv.data = Buffer.concat(buffers);
  Object.defineProperty(this, 'size', {
    enumerable: true,
    value: priv.data.length
  });
  Object.defineProperty(this, 'type', {
    enumerable: true,
    value: options ? '' + (options.type || '') : ''
  });
};
Blob.prototype.size = 0;
Blob.prototype.type = '';
Blob.prototype.slice = function (start, end, contentType) {
  return new Blob([html5weakmap.get(this).data.slice(start, end)], {
    type: contentType
  });
};

window.Blob = window.Blob || Blob;

function FileReader() {
  EventTarget.call(this);
};
FileReader.prototype = Object.create(EventTarget.prototype);
Object.defineProperty(FileReader, 'constructor', {
  value: FileReader
});
FileReader.prototype.readAsText = function (blob) {
  var target = this,
    priv = html5weakmap.get(blob),
    result = priv.data.toString(),
    event = Object.freeze({
      type: 'load',
      target: target
    });

  process.nextTick(function () {
    target.result = result;
    target.dispatchEvent(event);
  });
};
FileReader.prototype.readAsArrayBuffer = function (blob) {
  var target = this,
    priv = html5weakmap.get(blob),
    result = new Uint8Array(priv.data).buffer,
    event = Object.freeze({
      type: 'load',
      target: target
    });

  process.nextTick(function () {
    target.result = result;
    target.dispatchEvent(event);
  });
};
FileReader.prototype.readAsDataURL = function (blob) {
  var target = this,
    priv = html5weakmap.get(blob),
    result = 'data:' + blob.type + ';base64,' + priv.data.toString('base64'),
    event = Object.freeze({
      type: 'load',
      target: target
    });

  process.nextTick(function () {
    target.result = result;
    target.dispatchEvent(event);
  });
};

window.FileReader = window.FileReader || FileReader;

function atob(str) {
  try {
    return window.atob(str);
  }
  catch (err) {
    var buffer;
    if (str instanceof Buffer) {
      buffer = str;
    }
    else {
      buffer = Buffer.from(str.toString(), 'base64');
    }
    return buffer.toString('binary');
  }
}

window.atob = window.atob || atob;

function btoa(str) {
  try {
    return window.btoa(str);
  }
  catch (err) {
    var buffer;
    if (str instanceof Buffer) {
      buffer = str;
    }
    else {
      buffer = Buffer.from(str.toString(), 'binary');
    }
    return buffer.toString('base64');
  }
}

window.btoa = window.btoa || btoa;
/*
 * Copyright 2013, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/**
 * Parse a text request to a json query object tree
 *
 * @param  {String} string The string to parse
 * @return {Object} The json query tree
 */
function parseStringToObject(string) {

var arrayExtend = function () {
  var j, i, newlist = [], list_list = arguments;
  for (j = 0; j < list_list.length; j += 1) {
    for (i = 0; i < list_list[j].length; i += 1) {
      newlist.push(list_list[j][i]);
    }
  }
  return newlist;

}, mkSimpleQuery = function (key, value, operator) {
  var object = {"type": "simple", "key": key, "value": value};
  if (operator !== undefined) {
    object.operator = operator;
  }
  return object;

}, mkNotQuery = function (query) {
  if (query.operator === "NOT") {
    return query.query_list[0];
  }
  return {"type": "complex", "key": "", "operator": "NOT", "query_list": [query]};

}, mkComplexQuery = function (key, operator, query_list) {
  var i, query_list2 = [];
  for (i = 0; i < query_list.length; i += 1) {
    if (query_list[i].operator === operator) {
      query_list2 = arrayExtend(query_list2, query_list[i].query_list);
    } else {
      query_list2.push(query_list[i]);
    }
  }
  return {type:"complex",key:key,operator:operator,query_list:query_list2};

}, querySetKey = function (query, key) {
  if (({simple: 1, complex: 1})[query.type] && !query.key) {
    query.key = key;
    return true;
  }
  return false;
},
  error_offsets = [],
  error_lookaheads = [],
  error_count = 0,
  result;
/* parser generated by jison 0.4.16 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,5],$V1=[1,7],$V2=[1,8],$V3=[1,10],$V4=[1,12],$V5=[1,6,7,15],$V6=[1,6,7,9,12,14,15,16,19,21],$V7=[1,6,7,9,11,12,14,15,16,19,21],$V8=[2,17];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"begin":3,"search_text":4,"end":5,"EOF":6,"NEWLINE":7,"and_expression":8,"OR":9,"boolean_expression":10,"AND":11,"NOT":12,"expression":13,"LEFT_PARENTHESE":14,"RIGHT_PARENTHESE":15,"WORD":16,"DEFINITION":17,"value":18,"OPERATOR":19,"string":20,"QUOTE":21,"QUOTED_STRING":22,"$accept":0,"$end":1},
terminals_: {2:"error",6:"EOF",7:"NEWLINE",9:"OR",11:"AND",12:"NOT",14:"LEFT_PARENTHESE",15:"RIGHT_PARENTHESE",16:"WORD",17:"DEFINITION",19:"OPERATOR",21:"QUOTE",22:"QUOTED_STRING"},
productions_: [0,[3,2],[5,0],[5,1],[5,1],[4,1],[4,2],[4,3],[8,1],[8,3],[10,2],[10,1],[13,3],[13,3],[13,1],[18,2],[18,1],[20,1],[20,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1];
break;
case 5: case 8: case 11: case 14: case 16:
 this.$ = $$[$0];
break;
case 6:
 this.$ = mkComplexQuery('', 'AND', [$$[$0-1], $$[$0]]);
break;
case 7:
 this.$ = mkComplexQuery('', 'OR', [$$[$0-2], $$[$0]]);
break;
case 9:
 this.$ = mkComplexQuery('', 'AND', [$$[$0-2], $$[$0]]);
break;
case 10:
 this.$ = mkNotQuery($$[$0]);
break;
case 12:
 this.$ = $$[$0-1];
break;
case 13:
 querySetKey($$[$0], $$[$0-2]); this.$ = $$[$0];
break;
case 15:
 $$[$0].operator = $$[$0-1] ; this.$ = $$[$0];
break;
case 17:
 this.$ = mkSimpleQuery('', $$[$0]);
break;
case 18:
 this.$ = mkSimpleQuery('', $$[$0-1]);
break;
}
},
table: [{3:1,4:2,8:3,10:4,12:$V0,13:6,14:$V1,16:$V2,18:9,19:$V3,20:11,21:$V4},{1:[3]},{1:[2,2],5:13,6:[1,14],7:[1,15]},o($V5,[2,5],{8:3,10:4,13:6,18:9,20:11,4:16,9:[1,17],12:$V0,14:$V1,16:$V2,19:$V3,21:$V4}),o($V6,[2,8],{11:[1,18]}),{13:19,14:$V1,16:$V2,18:9,19:$V3,20:11,21:$V4},o($V7,[2,11]),{4:20,8:3,10:4,12:$V0,13:6,14:$V1,16:$V2,18:9,19:$V3,20:11,21:$V4},o($V7,$V8,{17:[1,21]}),o($V7,[2,14]),{16:[1,23],20:22,21:$V4},o($V7,[2,16]),{22:[1,24]},{1:[2,1]},{1:[2,3]},{1:[2,4]},o($V5,[2,6]),{4:25,8:3,10:4,12:$V0,13:6,14:$V1,16:$V2,18:9,19:$V3,20:11,21:$V4},{8:26,10:4,12:$V0,13:6,14:$V1,16:$V2,18:9,19:$V3,20:11,21:$V4},o($V7,[2,10]),{15:[1,27]},{13:28,14:$V1,16:$V2,18:9,19:$V3,20:11,21:$V4},o($V7,[2,15]),o($V7,$V8),{21:[1,29]},o($V5,[2,7]),o($V6,[2,9]),o($V7,[2,12]),o($V7,[2,13]),o($V7,[2,18])],
defaultActions: {13:[2,1],14:[2,3],15:[2,4]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = new Error();

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    var lex = function () {
        var token;
        token = lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:this.begin("letsquote"); return "QUOTE";
break;
case 1:this.popState(); this.begin("endquote"); return "QUOTED_STRING";
break;
case 2:this.popState(); return "QUOTE";
break;
case 3:/* skip whitespace */
break;
case 4:return "LEFT_PARENTHESE";
break;
case 5:return "RIGHT_PARENTHESE";
break;
case 6:return "AND";
break;
case 7:return "OR";
break;
case 8:return "NOT";
break;
case 9:return "DEFINITION";
break;
case 10:return 19;
break;
case 11:return 16;
break;
case 12:return 6;
break;
}
},
rules: [/^(?:")/,/^(?:(\\"|[^"])*)/,/^(?:")/,/^(?:[^\S]+)/,/^(?:\()/,/^(?:\))/,/^(?:AND\b)/,/^(?:OR\b)/,/^(?:NOT\b)/,/^(?::)/,/^(?:(!?=|<=?|>=?))/,/^(?:[^\s\n"():><!=]+)/,/^(?:$)/],
conditions: {"endquote":{"rules":[2],"inclusive":false},"letsquote":{"rules":[1],"inclusive":false},"INITIAL":{"rules":[0,3,4,5,6,7,8,9,10,11,12],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();/*
 * Copyright 2013, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
  return parser.parse(string);
} // parseStringToObject

/*
 * Copyright 2013, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/*global RSVP, window, parseStringToObject*/
/*jslint nomen: true, maxlen: 90*/
(function (RSVP, window, parseStringToObject) {
  "use strict";

  var query_class_dict = {},
    regexp_escape = /[\-\[\]{}()*+?.,\\\^$|#\s]/g,
    regexp_percent = /%/g,
    regexp_underscore = /_/g,
    regexp_operator = /^(?:AND|OR|NOT)$/i,
    regexp_comparaison = /^(?:!?=|<=?|>=?)$/i;

  /**
   * Convert metadata values to array of strings. ex:
   *
   *     "a" -> ["a"],
   *     {"content": "a"} -> ["a"]
   *
   * @param  {Any} value The metadata value
   * @return {Array} The value in string array format
   */
  function metadataValueToStringArray(value) {
    var i, new_value = [];
    if (value === undefined) {
      return undefined;
    }
    if (!Array.isArray(value)) {
      value = [value];
    }
    for (i = 0; i < value.length; i += 1) {
      if (typeof value[i] === 'object') {
        new_value[i] = value[i].content;
      } else {
        new_value[i] = value[i];
      }
    }
    return new_value;
  }

  /**
   * A sort function to sort items by key
   *
   * @param  {Array} sort_list List of couples [key, direction]
   * @return {Function} The sort function
   */
  function generateSortFunction(key_schema, sort_list) {
    return function sortByMultipleIndex(a, b) {
      var result,
        cast_to,
        key = sort_list[0][0],
        way = sort_list[0][1],
        i,
        l,
        a_string_array,
        b_string_array,
        f_a,
        f_b,
        tmp;

      if (way === 'descending') {
        result = 1;
      } else if (way === 'ascending') {
        result = -1;
      } else {
        throw new TypeError("Query.sortFunction(): " +
                            "Argument 2 must be 'ascending' or 'descending'");
      }

      if (key_schema !== undefined &&
          key_schema.key_set !== undefined &&
          key_schema.key_set[key] !== undefined &&
          key_schema.key_set[key].cast_to !== undefined) {
        if (typeof key_schema.key_set[key].cast_to === "string") {
          cast_to = key_schema.cast_lookup[key_schema.key_set[key].cast_to];
        } else {
          cast_to = key_schema.key_set[key].cast_to;
        }
        f_a = cast_to(a[key]);
        f_b = cast_to(b[key]);
        if (typeof f_b.cmp === 'function') {
          tmp = result * f_b.cmp(f_a);
          if (tmp !== 0) {
            return tmp;
          }
          if (sort_list.length > 1) {
            return generateSortFunction(key_schema, sort_list.slice(1))(a, b);
          }
          return tmp;
        }
        if (f_a > f_b) {
          return -result;
        }
        if (f_a < f_b) {
          return result;
        }
        if (sort_list.length > 1) {
          return generateSortFunction(key_schema, sort_list.slice(1))(a, b);
        }
        return 0;
      }

      // this comparison is 5 times faster than json comparison
      a_string_array = metadataValueToStringArray(a[key]) || [];
      b_string_array = metadataValueToStringArray(b[key]) || [];
      l = Math.max(a_string_array.length, b_string_array.length);
      for (i = 0; i < l; i += 1) {
        if (a_string_array[i] === undefined) {
          return result;
        }
        if (b_string_array[i] === undefined) {
          return -result;
        }
        if (a_string_array[i] > b_string_array[i]) {
          return -result;
        }
        if (a_string_array[i] < b_string_array[i]) {
          return result;
        }
      }
      if (sort_list.length > 1) {
        return generateSortFunction(key_schema, sort_list.slice(1))(a, b);
      }
      return 0;

    };
  }


  /**
   * Sort a list of items, according to keys and directions.
   *
   * @param  {Array} sort_on_option List of couples [key, direction]
   * @param  {Array} list The item list to sort
   * @return {Array} The filtered list
   */
  function sortOn(sort_on_option, list, key_schema) {
    if (!Array.isArray(sort_on_option)) {
      throw new TypeError("jioquery.sortOn(): " +
                          "Argument 1 is not of type 'array'");
    }
    list.sort(generateSortFunction(
      key_schema,
      sort_on_option
    ));
    return list;
  }

  /**
   * Limit a list of items, according to index and length.
   *
   * @param  {Array} limit_option A couple [from, length]
   * @param  {Array} list The item list to limit
   * @return {Array} The filtered list
   */
  function limit(limit_option, list) {
    if (!Array.isArray(limit_option)) {
      throw new TypeError("jioquery.limit(): " +
                          "Argument 1 is not of type 'array'");
    }
    if (!Array.isArray(list)) {
      throw new TypeError("jioquery.limit(): " +
                          "Argument 2 is not of type 'array'");
    }
    list.splice(0, limit_option[0]);
    if (limit_option[1]) {
      list.splice(limit_option[1]);
    }
    return list;
  }

  /**
   * Filter a list of items, modifying them to select only wanted keys.
   *
   * @param  {Array} select_option Key list to keep
   * @param  {Array} list The item list to filter
   * @return {Array} The filtered list
   */
  function select(select_option, list) {
    var i, j, new_item;
    if (!Array.isArray(select_option)) {
      throw new TypeError("jioquery.select(): " +
                          "Argument 1 is not of type Array");
    }
    if (!Array.isArray(list)) {
      throw new TypeError("jioquery.select(): " +
                          "Argument 2 is not of type Array");
    }
    for (i = 0; i < list.length; i += 1) {
      new_item = {};
      for (j = 0; j < select_option.length; j += 1) {
        if (list[i].hasOwnProperty([select_option[j]])) {
          new_item[select_option[j]] = list[i][select_option[j]];
        }
      }
      for (j in new_item) {
        if (new_item.hasOwnProperty(j)) {
          list[i] = new_item;
          break;
        }
      }
    }
    return list;
  }

  function checkKeySchema(key_schema) {
    var prop;

    if (key_schema !== undefined) {
      if (typeof key_schema !== 'object') {
        throw new TypeError("Query().create(): " +
                            "key_schema is not of type 'object'");
      }
      // key_set is mandatory
      if (key_schema.key_set === undefined) {
        throw new TypeError("Query().create(): " +
                            "key_schema has no 'key_set' property");
      }
      for (prop in key_schema) {
        if (key_schema.hasOwnProperty(prop)) {
          switch (prop) {
          case 'key_set':
          case 'cast_lookup':
          case 'match_lookup':
            break;
          default:
            throw new TypeError("Query().create(): " +
                               "key_schema has unknown property '" + prop + "'");
          }
        }
      }
    }
  }

  /**
   * The query to use to filter a list of objects.
   * This is an abstract class.
   *
   * @class Query
   * @constructor
   */
  function Query(key_schema) {

    checkKeySchema(key_schema);
    this._key_schema = key_schema || {};

    /**
     * Called before parsing the query. Must be overridden!
     *
     * @method onParseStart
     * @param  {Object} object The object shared in the parse process
     * @param  {Object} option Some option gave in parse()
     */
  //   this.onParseStart = emptyFunction;

    /**
     * Called when parsing a simple query. Must be overridden!
     *
     * @method onParseSimpleQuery
     * @param  {Object} object The object shared in the parse process
     * @param  {Object} option Some option gave in parse()
     */
  //   this.onParseSimpleQuery = emptyFunction;

    /**
     * Called when parsing a complex query. Must be overridden!
     *
     * @method onParseComplexQuery
     * @param  {Object} object The object shared in the parse process
     * @param  {Object} option Some option gave in parse()
     */
  //   this.onParseComplexQuery = emptyFunction;

    /**
     * Called after parsing the query. Must be overridden!
     *
     * @method onParseEnd
     * @param  {Object} object The object shared in the parse process
     * @param  {Object} option Some option gave in parse()
     */
  //   this.onParseEnd = emptyFunction;

    return;
  }

  /**
   * Filter the item list with matching item only
   *
   * @method exec
   * @param  {Array} item_list The list of object
   * @param  {Object} [option] Some operation option
   * @param  {Array} [option.select_list] A object keys to retrieve
   * @param  {Array} [option.sort_on] Couples of object keys and "ascending"
   *                 or "descending"
   * @param  {Array} [option.limit] Couple of integer, first is an index and
   *                 second is the length.
   */
  Query.prototype.exec = function (item_list, option) {
    if (!Array.isArray(item_list)) {
      throw new TypeError("Query().exec(): Argument 1 is not of type 'array'");
    }
    if (option === undefined) {
      option = {};
    }
    if (typeof option !== 'object') {
      throw new TypeError("Query().exec(): " +
                          "Optional argument 2 is not of type 'object'");
    }
    var context = this,
      i;
    for (i = item_list.length - 1; i >= 0; i -= 1) {
      if (!context.match(item_list[i])) {
        item_list.splice(i, 1);
      }
    }

    if (option.sort_on && option.sort_on.length) {
      sortOn(option.sort_on, item_list, this._key_schema);
    }

    if (option.limit) {
      limit(option.limit, item_list);
    }

    select(option.select_list || [], item_list);

    return new RSVP.Queue()
      .push(function () {
        return item_list;
      });
  };

  /**
   * Test if an item matches this query
   *
   * @method match
   * @param  {Object} item The object to test
   * @return {Boolean} true if match, false otherwise
   */
  Query.prototype.match = function () {
    return true;
  };

  /**
   * Browse the Query in deep calling parser method in each step.
   *
   * `onParseStart` is called first, on end `onParseEnd` is called.
   * It starts from the simple queries at the bottom of the tree calling the
   * parser method `onParseSimpleQuery`, and go up calling the
   * `onParseComplexQuery` method.
   *
   * @method parse
   * @param  {Object} option Any options you want (except 'parsed')
   * @return {Any} The parse result
   */
  Query.prototype.parse = function (option) {
    var that = this,
      object;
    /**
     * The recursive parser.
     *
     * @param  {Object} object The object shared in the parse process
     * @param  {Object} options Some options usable in the parseMethods
     * @return {Any} The parser result
     */
    function recParse(object, option) {
      var query = object.parsed,
        queue = new RSVP.Queue(),
        i;

      function enqueue(j) {
        queue
          .push(function () {
            object.parsed = query.query_list[j];
            return recParse(object, option);
          })
          .push(function () {
            query.query_list[j] = object.parsed;
          });
      }

      if (query.type === "complex") {


        for (i = 0; i < query.query_list.length; i += 1) {
          enqueue(i);
        }

        return queue
          .push(function () {
            object.parsed = query;
            return that.onParseComplexQuery(object, option);
          });

      }
      if (query.type === "simple") {
        return that.onParseSimpleQuery(object, option);
      }
    }
    object = {
      parsed: JSON.parse(JSON.stringify(that.serialized()))
    };
    return new RSVP.Queue()
      .push(function () {
        return that.onParseStart(object, option);
      })
      .push(function () {
        return recParse(object, option);
      })
      .push(function () {
        return that.onParseEnd(object, option);
      })
      .push(function () {
        return object.parsed;
      });

  };

  /**
   * Convert this query to a parsable string.
   *
   * @method toString
   * @return {String} The string version of this query
   */
  Query.prototype.toString = function () {
    return "";
  };

  /**
   * Convert this query to an jsonable object in order to be remake thanks to
   * QueryFactory class.
   *
   * @method serialized
   * @return {Object} The jsonable object
   */
  Query.prototype.serialized = function () {
    return undefined;
  };

  /**
   * Provides static methods to create Query object
   *
   * @class QueryFactory
   */
  function QueryFactory() {
    return;
  }

  /**
   * Escapes regexp special chars from a string.
   *
   * @param  {String} string The string to escape
   * @return {String} The escaped string
   */
  function stringEscapeRegexpCharacters(string) {
    return string.replace(regexp_escape, "\\$&");
  }

  /**
   * Inherits the prototype methods from one constructor into another. The
   * prototype of `constructor` will be set to a new object created from
   * `superConstructor`.
   *
   * @param  {Function} constructor The constructor which inherits the super one
   * @param  {Function} superConstructor The super constructor
   */
  function inherits(constructor, superConstructor) {
    constructor.super_ = superConstructor;
    constructor.prototype = Object.create(superConstructor.prototype, {
      "constructor": {
        "configurable": true,
        "enumerable": false,
        "writable": true,
        "value": constructor
      }
    });
  }

  /**
   * Convert a search text to a regexp.
   *
   * @param  {String} string The string to convert
   * @param  {Boolean} [use_wildcard_character=true] Use wildcard "%" and "_"
   * @return {RegExp} The search text regexp
   */
  function searchTextToRegExp(string, use_wildcard_characters) {
    if (typeof string !== 'string') {
      throw new TypeError("jioquery.searchTextToRegExp(): " +
                          "Argument 1 is not of type 'string'");
    }
    if (use_wildcard_characters === false) {
      return new RegExp("^" + stringEscapeRegexpCharacters(string) + "$");
    }
    return new RegExp("^" + stringEscapeRegexpCharacters(string)
      .replace(regexp_percent, '[\\s\\S]*')
      .replace(regexp_underscore, '.') + "$", "i");
  }

  /**
   * The ComplexQuery inherits from Query, and compares one or several metadata
   * values.
   *
   * @class ComplexQuery
   * @extends Query
   * @param  {Object} [spec={}] The specifications
   * @param  {String} [spec.operator="AND"] The compare method to use
   * @param  {String} spec.key The metadata key
   * @param  {String} spec.value The value of the metadata to compare
   */
  function ComplexQuery(spec, key_schema) {
    Query.call(this, key_schema);

    /**
     * Logical operator to use to compare object values
     *
     * @attribute operator
     * @type String
     * @default "AND"
     * @optional
     */
    this.operator = spec.operator;

    this.key = spec.key || this.key;

    /**
     * The sub Query list which are used to query an item.
     *
     * @attribute query_list
     * @type Array
     * @default []
     * @optional
     */
    this.query_list = spec.query_list || [];
    this.query_list = this.query_list.map(
      // decorate the map to avoid sending the index as key_schema argument
      function (o) { return QueryFactory.create(o, key_schema); }
    );

  }
  inherits(ComplexQuery, Query);

  ComplexQuery.prototype.operator = "AND";
  ComplexQuery.prototype.type = "complex";
  ComplexQuery.prototype.key = "";

  /**
   * #crossLink "Query/match:method"
   */
  ComplexQuery.prototype.match = function (item) {
    var operator = this.operator;
    if (!(regexp_operator.test(operator))) {
      operator = "AND";
    }
    return this[operator.toUpperCase()](item);
  };

  /**
   * #crossLink "Query/toString:method"
   */
  ComplexQuery.prototype.toString = function () {
    /*global objectToSearchText */
    return objectToSearchText(this.toJSON());
  };

  /**
   * #crossLink "Query/serialized:method"
   */
  ComplexQuery.prototype.serialized = function () {
    var s = {
      "type": "complex",
      "operator": this.operator,
      "key": this.key,
      "query_list": []
    };
    this.query_list.forEach(function (query) {
      s.query_list.push(
        typeof query.toJSON === "function" ? query.toJSON() : query
      );
    });
    return s;
  };
  ComplexQuery.prototype.toJSON = ComplexQuery.prototype.serialized;

  /**
   * Comparison operator, test if all sub queries match the
   * item value
   *
   * @method AND
   * @param  {Object} item The item to match
   * @return {Boolean} true if all match, false otherwise
   */
  ComplexQuery.prototype.AND = function (item) {
    var result = true,
      i = 0;

    while (result && (i !== this.query_list.length)) {
      result = this.query_list[i].match(item);
      i += 1;
    }
    return result;

  };

  /**
   * Comparison operator, test if one of the sub queries matches the
   * item value
   *
   * @method OR
   * @param  {Object} item The item to match
   * @return {Boolean} true if one match, false otherwise
   */
  ComplexQuery.prototype.OR = function (item) {
    var result = false,
      i = 0;

    while ((!result) && (i !== this.query_list.length)) {
      result = this.query_list[i].match(item);
      i += 1;
    }

    return result;
  };

  /**
   * Comparison operator, test if the sub query does not match the
   * item value
   *
   * @method NOT
   * @param  {Object} item The item to match
   * @return {Boolean} true if one match, false otherwise
   */
  ComplexQuery.prototype.NOT = function (item) {
    return !this.query_list[0].match(item);
  };

  /**
   * Creates Query object from a search text string or a serialized version
   * of a Query.
   *
   * @method create
   * @static
   * @param  {Object,String} object The search text or the serialized version
   *         of a Query
   * @return {Query} A Query object
   */
  QueryFactory.create = function (object, key_schema) {
    if (object === "") {
      return new Query(key_schema);
    }
    if (typeof object === "string") {
      object = parseStringToObject(object);
    }
    if (typeof (object || {}).type === "string" &&
        query_class_dict[object.type]) {
      return new query_class_dict[object.type](object, key_schema);
    }
    throw new TypeError("QueryFactory.create(): " +
                        "Argument 1 is not a search text or a parsable object");
  };

  function objectToSearchText(query) {
    var str_list = [], operator = "", query_list = null;
    if (query.type === "complex") {
      query_list = query.query_list || [];
      if (query_list.length === 0) {
        return "";
      }
      operator = query.operator;
      if (operator === "NOT") {
        str_list.push("NOT");
        // fallback to AND operator if several queries are given
        // i.e. `NOT ( a AND b )`
        operator = "AND";
      }
      if (query.key) {
        str_list.push(query.key + ":");
      }
      str_list.push("(");
      query_list.forEach(function (sub_query) {
        str_list.push(objectToSearchText(sub_query));
        str_list.push(operator);
      });
      str_list.length -= 1;
      str_list.push(")");
      return str_list.join(" ");
    }
    if (query.type === "simple") {
      return (query.key ? query.key + ": " : "") +
        (query.operator || "") + ' "' + query.value + '"';
    }
    throw new TypeError("This object is not a query");
  }

  /**
   * The SimpleQuery inherits from Query, and compares one metadata value
   *
   * @class SimpleQuery
   * @extends Query
   * @param  {Object} [spec={}] The specifications
   * @param  {String} [spec.operator="="] The compare method to use
   * @param  {String} spec.key The metadata key
   * @param  {String} spec.value The value of the metadata to compare
   */
  function SimpleQuery(spec, key_schema) {
    Query.call(this, key_schema);

    /**
     * Operator to use to compare object values
     *
     * @attribute operator
     * @type String
     * @optional
     */
    this.operator = spec.operator;

    /**
     * Key of the object which refers to the value to compare
     *
     * @attribute key
     * @type String
     */
    this.key = spec.key;

    /**
     * Value is used to do the comparison with the object value
     *
     * @attribute value
     * @type String
     */
    this.value = spec.value;

  }
  inherits(SimpleQuery, Query);

  SimpleQuery.prototype.type = "simple";

  function checkKey(key) {
    var prop;

    if (key.read_from === undefined) {
      throw new TypeError("Custom key is missing the read_from property");
    }

    for (prop in key) {
      if (key.hasOwnProperty(prop)) {
        switch (prop) {
        case 'read_from':
        case 'cast_to':
        case 'equal_match':
          break;
        default:
          throw new TypeError("Custom key has unknown property '" +
                              prop + "'");
        }
      }
    }
  }

  /**
   * #crossLink "Query/match:method"
   */
  SimpleQuery.prototype.match = function (item) {
    var object_value = null,
      equal_match = null,
      cast_to = null,
      matchMethod = null,
      operator = this.operator,
      value = null,
      key = this.key,
      k;

    if (!(regexp_comparaison.test(operator))) {
      // `operator` is not correct, we have to change it to "like" or "="
      if (regexp_percent.test(this.value)) {
        // `value` contains a non escaped `%`
        operator = "like";
      } else {
        // `value` does not contain non escaped `%`
        operator = "=";
      }
    }

    matchMethod = this[operator];

    if (this._key_schema.key_set && this._key_schema.key_set[key] !== undefined) {
      key = this._key_schema.key_set[key];
    }

    // match with all the fields if key is empty
    if (key === '') {
      matchMethod = this.like;
      value = '%' + this.value + '%';
      for (k in item) {
        if (item.hasOwnProperty(k)) {
          if (k !== '__id' && item[k]) {
            if (matchMethod(item[k], value) === true) {
              return true;
            }
          }
        }
      }
      return false;
    }

    if (typeof key === 'object') {
      checkKey(key);
      object_value = item[key.read_from];

      equal_match = key.equal_match;

      // equal_match can be a string
      if (typeof equal_match === 'string') {
        // XXX raise error if equal_match not in match_lookup
        equal_match = this._key_schema.match_lookup[equal_match];
      }

      // equal_match overrides the default '=' operator
      if (equal_match !== undefined) {
        matchMethod = (operator === "=" || operator === "like" ?
                       equal_match : matchMethod);
      }

      value = this.value;
      cast_to = key.cast_to;
      if (cast_to) {
        // cast_to can be a string
        if (typeof cast_to === 'string') {
          // XXX raise error if cast_to not in cast_lookup
          cast_to = this._key_schema.cast_lookup[cast_to];
        }

        try {
          value = cast_to(value);
        } catch (e) {
          value = undefined;
        }

        try {
          object_value = cast_to(object_value);
        } catch (e) {
          object_value = undefined;
        }
      }
    } else {
      object_value = item[key];
      value = this.value;
    }
    if (object_value === undefined || value === undefined) {
      return false;
    }
    return matchMethod(object_value, value);
  };

  /**
   * #crossLink "Query/toString:method"
   */
  SimpleQuery.prototype.toString = function () {
    return objectToSearchText(this.toJSON());
  };

  /**
   * #crossLink "Query/serialized:method"
   */
  SimpleQuery.prototype.serialized = function () {
    var object = {
      "type": "simple",
      "key": this.key,
      "value": this.value
    };
    if (this.operator !== undefined) {
      object.operator = this.operator;
    }
    return object;
  };
  SimpleQuery.prototype.toJSON = SimpleQuery.prototype.serialized;

  /**
   * Comparison operator, test if this query value matches the item value
   *
   * @method =
   * @param  {String} object_value The value to compare
   * @param  {String} comparison_value The comparison value
   * @return {Boolean} true if match, false otherwise
   */
  SimpleQuery.prototype["="] = function (object_value, comparison_value) {
    var value, i;
    if (!Array.isArray(object_value)) {
      object_value = [object_value];
    }
    for (i = 0; i < object_value.length; i += 1) {
      value = object_value[i];
      if (typeof value === 'object' && value.hasOwnProperty('content')) {
        value = value.content;
      }
      if (typeof value.cmp === "function") {
        return (value.cmp(comparison_value) === 0);
      }
      if (comparison_value.toString() === value.toString()) {
        return true;
      }
    }
    return false;
  };

  /**
   * Comparison operator, test if this query value matches the item value
   *
   * @method like
   * @param  {String} object_value The value to compare
   * @param  {String} comparison_value The comparison value
   * @return {Boolean} true if match, false otherwise
   */
  SimpleQuery.prototype.like = function (object_value, comparison_value) {
    var value, i;
    if (!Array.isArray(object_value)) {
      object_value = [object_value];
    }
    for (i = 0; i < object_value.length; i += 1) {
      value = object_value[i];
      if (typeof value === 'object' && value.hasOwnProperty('content')) {
        value = value.content;
      }
      if (typeof value.cmp === "function") {
        return (value.cmp(comparison_value) === 0);
      }
      if (
        searchTextToRegExp(comparison_value.toString()).test(value.toString())
      ) {
        return true;
      }
    }
    return false;
  };

  /**
   * Comparison operator, test if this query value does not match the item value
   *
   * @method !=
   * @param  {String} object_value The value to compare
   * @param  {String} comparison_value The comparison value
   * @return {Boolean} true if not match, false otherwise
   */
  SimpleQuery.prototype["!="] = function (object_value, comparison_value) {
    var value, i;
    if (!Array.isArray(object_value)) {
      object_value = [object_value];
    }
    for (i = 0; i < object_value.length; i += 1) {
      value = object_value[i];
      if (typeof value === 'object' && value.hasOwnProperty('content')) {
        value = value.content;
      }
      if (typeof value.cmp === "function") {
        return (value.cmp(comparison_value) !== 0);
      }
      if (comparison_value.toString() === value.toString()) {
        return false;
      }
    }
    return true;
  };

  /**
   * Comparison operator, test if this query value is lower than the item value
   *
   * @method <
   * @param  {Number, String} object_value The value to compare
   * @param  {Number, String} comparison_value The comparison value
   * @return {Boolean} true if lower, false otherwise
   */
  SimpleQuery.prototype["<"] = function (object_value, comparison_value) {
    var value;
    if (!Array.isArray(object_value)) {
      object_value = [object_value];
    }
    value = object_value[0];
    if (typeof value === 'object' && value.hasOwnProperty('content')) {
      value = value.content;
    }
    if (typeof value.cmp === "function") {
      return (value.cmp(comparison_value) < 0);
    }
    return (value < comparison_value);
  };

  /**
   * Comparison operator, test if this query value is equal or lower than the
   * item value
   *
   * @method <=
   * @param  {Number, String} object_value The value to compare
   * @param  {Number, String} comparison_value The comparison value
   * @return {Boolean} true if equal or lower, false otherwise
   */
  SimpleQuery.prototype["<="] = function (object_value, comparison_value) {
    var value;
    if (!Array.isArray(object_value)) {
      object_value = [object_value];
    }
    value = object_value[0];
    if (typeof value === 'object' && value.hasOwnProperty('content')) {
      value = value.content;
    }
    if (typeof value.cmp === "function") {
      return (value.cmp(comparison_value) <= 0);
    }
    return (value <= comparison_value);
  };

  /**
   * Comparison operator, test if this query value is greater than the item
   * value
   *
   * @method >
   * @param  {Number, String} object_value The value to compare
   * @param  {Number, String} comparison_value The comparison value
   * @return {Boolean} true if greater, false otherwise
   */
  SimpleQuery.prototype[">"] = function (object_value, comparison_value) {
    var value;
    if (!Array.isArray(object_value)) {
      object_value = [object_value];
    }
    value = object_value[0];
    if (typeof value === 'object' && value.hasOwnProperty('content')) {
      value = value.content;
    }
    if (typeof value.cmp === "function") {
      return (value.cmp(comparison_value) > 0);
    }
    return (value > comparison_value);
  };

  /**
   * Comparison operator, test if this query value is equal or greater than the
   * item value
   *
   * @method >=
   * @param  {Number, String} object_value The value to compare
   * @param  {Number, String} comparison_value The comparison value
   * @return {Boolean} true if equal or greater, false otherwise
   */
  SimpleQuery.prototype[">="] = function (object_value, comparison_value) {
    var value;
    if (!Array.isArray(object_value)) {
      object_value = [object_value];
    }
    value = object_value[0];
    if (typeof value === 'object' && value.hasOwnProperty('content')) {
      value = value.content;
    }
    if (typeof value.cmp === "function") {
      return (value.cmp(comparison_value) >= 0);
    }
    return (value >= comparison_value);
  };

  query_class_dict.simple = SimpleQuery;
  query_class_dict.complex = ComplexQuery;

  Query.parseStringToObject = parseStringToObject;
  Query.objectToSearchText = objectToSearchText;

  window.Query = Query;
  window.SimpleQuery = SimpleQuery;
  window.ComplexQuery = ComplexQuery;
  window.QueryFactory = QueryFactory;

}(RSVP, window, parseStringToObject));
  var QueryFactory = window.QueryFactory,
    Query = window.Query,
    SimpleQuery = window.SimpleQuery,
    ComplexQuery = window.ComplexQuery;
/*
 * Copyright 2014, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/*global window, moment */
/*jslint nomen: true, maxlen: 200*/
(function (window, moment) {
  "use strict";

//   /**
//    * Add a secured (write permission denied) property to an object.
//    *
//    * @param  {Object} object The object to fill
//    * @param  {String} key The object key where to store the property
//    * @param  {Any} value The value to store
//    */
//   function _export(key, value) {
//     Object.defineProperty(to_export, key, {
//       "configurable": false,
//       "enumerable": true,
//       "writable": false,
//       "value": value
//     });
//   }

  var YEAR = 'year',
    MONTH = 'month',
    DAY = 'day',
    HOUR = 'hour',
    MIN = 'minute',
    SEC = 'second',
    MSEC = 'millisecond',
    precision_grade = {
      'year': 0,
      'month': 1,
      'day': 2,
      'hour': 3,
      'minute': 4,
      'second': 5,
      'millisecond': 6
    },
    lesserPrecision = function (p1, p2) {
      return (precision_grade[p1] < precision_grade[p2]) ? p1 : p2;
    },
    JIODate;


  JIODate = function (str) {
    // in case of forgotten 'new'
    if (!(this instanceof JIODate)) {
      return new JIODate(str);
    }

    if (str instanceof JIODate) {
      this.mom = str.mom.clone();
      this._precision = str._precision;
      return;
    }

    if (str === undefined) {
      this.mom = moment();
      this.setPrecision(MSEC);
      return;
    }

    this.mom = null;
    this._str = str;

    // http://www.w3.org/TR/NOTE-datetime
    // http://dotat.at/tmp/ISO_8601-2004_E.pdf

    // XXX these regexps fail to detect many invalid dates.

    if (str.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+\-][0-2]\d:[0-5]\d|Z)/)
          || str.match(/\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d/)) {
      // ISO, milliseconds
      this.mom = moment(str);
      this.setPrecision(MSEC);
    } else if (str.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+\-][0-2]\d:[0-5]\d|Z)/)
          || str.match(/\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d/)) {
      // ISO, seconds
      this.mom = moment(str);
      this.setPrecision(SEC);
    } else if (str.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+\-][0-2]\d:[0-5]\d|Z)/)
          || str.match(/\d\d\d\d-\d\d-\d\d \d\d:\d\d/)) {
      // ISO, minutes
      this.mom = moment(str);
      this.setPrecision(MIN);
    } else if (str.match(/\d\d\d\d-\d\d-\d\d \d\d/)) {
      this.mom = moment(str);
      this.setPrecision(HOUR);
    } else if (str.match(/\d\d\d\d-\d\d-\d\d/)) {
      this.mom = moment(str);
      this.setPrecision(DAY);
    } else if (str.match(/\d\d\d\d-\d\d/)) {
      this.mom = moment(str);
      this.setPrecision(MONTH);
    } else if (str.match(/\d\d\d\d/)) {
      // Creating a moment with only the year will show this deprecation
      // warning:
      //
      // Deprecation warning: moment construction falls back to js Date. This is
      // discouraged and will be removed in upcoming major release. Please refer
      // to https://github.com/moment/moment/issues/1407 for more info.
      //
      // TL;DR: parsing year-only strings with momentjs falls back to native
      // Date and it won't correctly represent the year in local time if UTF
      // offset is negative.
      //
      // The solution is to use the format parameter, so momentjs won't fall
      // back to the native Date and we will have the correct year in local
      // time.
      //
      this.mom = moment(str, 'YYYY');
      this.setPrecision(YEAR);
    }

    if (!this.mom) {
      throw new Error("Cannot parse: " + str);
    }

  };


  JIODate.prototype.setPrecision = function (prec) {
    this._precision = prec;
  };


  JIODate.prototype.getPrecision = function () {
    return this._precision;
  };


  JIODate.prototype.cmp = function (other) {
    var m1 = this.mom,
      m2 = other.mom,
      p = lesserPrecision(this._precision, other._precision);
    return m1.isBefore(m2, p) ? -1 : (m1.isSame(m2, p) ? 0 : +1);
  };


  JIODate.prototype.toPrecisionString = function (precision) {
    var fmt;

    precision = precision || this._precision;

    fmt = {
      'millisecond': 'YYYY-MM-DD HH:mm:ss.SSS',
      'second': 'YYYY-MM-DD HH:mm:ss',
      'minute': 'YYYY-MM-DD HH:mm',
      'hour': 'YYYY-MM-DD HH',
      'day': 'YYYY-MM-DD',
      'month': 'YYYY-MM',
      'year': 'YYYY'
    }[precision];

    if (!fmt) {
      throw new TypeError("Unsupported precision value '" + precision + "'");
    }

    return this.mom.format(fmt);
  };


  JIODate.prototype.toString = function () {
    return this._str;
  };


//   _export('JIODate', JIODate);
//
//   _export('YEAR', YEAR);
//   _export('MONTH', MONTH);
//   _export('DAY', DAY);
//   _export('HOUR', HOUR);
//   _export('MIN', MIN);
//   _export('SEC', SEC);
//   _export('MSEC', MSEC);

  window.jiodate = {
    JIODate: JIODate,
    YEAR: YEAR,
    MONTH: MONTH,
    DAY: DAY,
    HOUR: HOUR,
    MIN: MIN,
    SEC: SEC,
    MSEC: MSEC
  };
}(window, moment));
var jiodate = window.jiodate;
/*
 * Copyright 2014, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/*global window, RSVP, Blob, XMLHttpRequest, QueryFactory, Query, atob,
  FileReader, ArrayBuffer, Uint8Array, navigator */
(function (window, RSVP, Blob, QueryFactory, Query, atob,
           FileReader, ArrayBuffer, Uint8Array, navigator) {
  "use strict";

  if (window.openDatabase === undefined) {
    window.openDatabase = function () {
      throw new Error('WebSQL is not supported by ' + navigator.userAgent);
    };
  }

  /* Safari does not define DOMError */
  if (window.DOMError === undefined) {
    window.DOMError = {};
  }

  var util = {},
    jIO;

  function jIOError(message, status_code) {
    if ((message !== undefined) && (typeof message !== "string")) {
      throw new TypeError('You must pass a string.');
    }
    this.message = message || "Default Message";
    this.status_code = status_code || 500;
  }
  jIOError.prototype = new Error();
  jIOError.prototype.constructor = jIOError;
  util.jIOError = jIOError;

  /**
   * Send request with XHR and return a promise. xhr.onload: The promise is
   * resolved when the status code is lower than 400 with the xhr object as
   * first parameter. xhr.onerror: reject with xhr object as first
   * parameter. xhr.onprogress: notifies the xhr object.
   *
   * @param  {Object} param The parameters
   * @param  {String} [param.type="GET"] The request method
   * @param  {String} [param.dataType=""] The data type to retrieve
   * @param  {String} param.url The url
   * @param  {Any} [param.data] The data to send
   * @param  {Number} param.timeout The request timeout value
   * @param  {Function} [param.beforeSend] A function called just before the
   *    send request. The first parameter of this function is the XHR object.
   * @return {Promise} The promise
   */
  function ajax(param) {
    var xhr = new window.XMLHttpRequest();
    return new RSVP.Promise(function (resolve, reject, notify) {
      var k;
      xhr.open(param.type || "GET", param.url, true);
      xhr.responseType = param.dataType || "";
      if (typeof param.headers === 'object' && param.headers !== null) {
        for (k in param.headers) {
          if (param.headers.hasOwnProperty(k)) {
            xhr.setRequestHeader(k, param.headers[k]);
          }
        }
      }
      xhr.addEventListener("load", function (e) {
        if (e.target.status >= 400) {
          return reject(e);
        }
        resolve(e);
      });
      xhr.addEventListener("error", reject);
      xhr.addEventListener("progress", function (e) {
        if (notify) {
          notify(e);
        }
      });
      if (typeof param.xhrFields === 'object' && param.xhrFields !== null) {
        for (k in param.xhrFields) {
          if (param.xhrFields.hasOwnProperty(k)) {
            xhr[k] = param.xhrFields[k];
          }
        }
      }
      if (param.timeout !== undefined && param.timeout !== 0) {
        xhr.timeout = param.timeout;
        xhr.ontimeout = function () {
          return reject(new jIO.util.jIOError("Gateway Timeout", 504));
        };
      }
      if (typeof param.beforeSend === 'function') {
        param.beforeSend(xhr);
      }
      xhr.send(param.data);
    }, function () {
      xhr.abort();
    });
  }
  util.ajax = ajax;

  function readBlobAsText(blob, encoding) {
    var fr = new FileReader();
    return new RSVP.Promise(function (resolve, reject, notify) {
      fr.addEventListener("load", resolve);
      fr.addEventListener("error", reject);
      fr.addEventListener("progress", notify);
      fr.readAsText(blob, encoding);
    }, function () {
      fr.abort();
    });
  }
  util.readBlobAsText = readBlobAsText;

  function readBlobAsArrayBuffer(blob) {
    var fr = new FileReader();
    return new RSVP.Promise(function (resolve, reject, notify) {
      fr.addEventListener("load", resolve);
      fr.addEventListener("error", reject);
      fr.addEventListener("progress", notify);
      fr.readAsArrayBuffer(blob);
    }, function () {
      fr.abort();
    });
  }
  util.readBlobAsArrayBuffer = readBlobAsArrayBuffer;

  function readBlobAsDataURL(blob) {
    var fr = new FileReader();
    return new RSVP.Promise(function (resolve, reject, notify) {
      fr.addEventListener("load", resolve);
      fr.addEventListener("error", reject);
      fr.addEventListener("progress", notify);
      fr.readAsDataURL(blob);
    }, function () {
      fr.abort();
    });
  }
  util.readBlobAsDataURL = readBlobAsDataURL;

  function stringify(obj) {
    // Implement a stable JSON.stringify
    // Object's keys are alphabetically ordered
    var key,
      key_list,
      i,
      value,
      result_list;
    if (obj === undefined) {
      return undefined;
    }
    if (obj === null) {
      return 'null';
    }
    if (obj.constructor === Object) {
      key_list = Object.keys(obj).sort();
      result_list = [];
      for (i = 0; i < key_list.length; i += 1) {
        key = key_list[i];
        value = stringify(obj[key]);
        if (value !== undefined) {
          result_list.push(stringify(key) + ':' + value);
        }
      }
      return '{' + result_list.join(',') + '}';
    }
    if (obj.constructor === Array) {
      result_list = [];
      for (i = 0; i < obj.length; i += 1) {
        result_list.push(stringify(obj[i]));
      }
      return '[' + result_list.join(',') + ']';
    }
    return JSON.stringify(obj);
  }
  util.stringify = stringify;

  function base64toBlob(b64String, mimeString) {

    var byteString = atob(b64String),
    // write the bytes of the string to an ArrayBuffer
      arrayBuffer = new ArrayBuffer(byteString.length),
      _ia = new Uint8Array(arrayBuffer),
      i;
    for (i = 0; i < byteString.length; i += 1) {
      _ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], {type: mimeString});
  }

  util.base64toBlob = base64toBlob;

  // https://gist.github.com/davoclavo/4424731
  function dataURItoBlob(dataURI) {
    if (dataURI === 'data:') {
      return new Blob();
    }
    // convert base64 to raw binary data held in a string
    var mimeString = dataURI.split(',')[0].split(':')[1];
    mimeString = mimeString.slice(0, mimeString.length - ";base64".length);
    return base64toBlob(dataURI.split(',')[1], mimeString);
  }

  util.dataURItoBlob = dataURItoBlob;

  // tools
  function checkId(argument_list, storage, method_name) {
    if (typeof argument_list[0] !== 'string' || argument_list[0] === '') {
      throw new jIO.util.jIOError(
        "Document id must be a non empty string on '" + storage.__type +
          "." + method_name + "'.",
        400
      );
    }
  }

  function checkAttachmentId(argument_list, storage, method_name) {
    if (typeof argument_list[1] !== 'string' || argument_list[1] === '') {
      throw new jIO.util.jIOError(
        "Attachment id must be a non empty string on '" + storage.__type +
          "." + method_name + "'.",
        400
      );
    }
  }

  function ensurePushableQueue(callback, argument_list, context) {
    var result;
    try {
      result = callback.apply(context, argument_list);
    } catch (e) {
      return new RSVP.Queue()
        .push(function returnPushableError() {
          return RSVP.reject(e);
        });
    }
    if (result instanceof RSVP.Queue) {
      return result;
    }
    return new RSVP.Queue()
      .push(function returnPushableResult() {
        return result;
      });
  }

  function declareMethod(klass, name, precondition_function, post_function) {
    klass.prototype[name] = function () {
      var argument_list = arguments,
        context = this,
        precondition_result,
        storage_method,
        queue;

      // Precondition function are not asynchronous
      if (precondition_function !== undefined) {
        precondition_result = precondition_function.apply(
          context.__storage,
          [argument_list, context, name]
        );
      }

      storage_method = context.__storage[name];
      if (storage_method === undefined) {
        throw new jIO.util.jIOError(
          "Capacity '" + name + "' is not implemented on '" +
            context.__type + "'",
          501
        );
      }
      queue = ensurePushableQueue(storage_method, argument_list,
                                  context.__storage);

      if (post_function !== undefined) {
        queue
          .push(function (result) {
            return post_function.call(
              context,
              argument_list,
              result,
              precondition_result
            );
          });
      }
      return queue;
    };
    // Allow chain
    return this;
  }




  /////////////////////////////////////////////////////////////////
  // jIO Storage Proxy
  /////////////////////////////////////////////////////////////////
  function JioProxyStorage(type, storage) {
    if (!(this instanceof JioProxyStorage)) {
      return new JioProxyStorage();
    }
    this.__type = type;
    this.__storage = storage;
  }

  declareMethod(JioProxyStorage, "put", checkId, function (argument_list) {
    return argument_list[0];
  });
  declareMethod(JioProxyStorage, "get", checkId);
  declareMethod(JioProxyStorage, "bulk");
  declareMethod(JioProxyStorage, "remove", checkId, function (argument_list) {
    return argument_list[0];
  });

  JioProxyStorage.prototype.post = function () {
    var context = this,
      argument_list = arguments;
    return ensurePushableQueue(function () {
      var storage_method = context.__storage.post;
      if (storage_method === undefined) {
        throw new jIO.util.jIOError(
          "Capacity 'post' is not implemented on '" + context.__type + "'",
          501
        );
      }
      return context.__storage.post.apply(context.__storage, argument_list);
    });
  };

  declareMethod(JioProxyStorage, 'putAttachment', function (argument_list,
                                                            storage,
                                                            method_name) {
    checkId(argument_list, storage, method_name);
    checkAttachmentId(argument_list, storage, method_name);

    var options = argument_list[3] || {};

    if (typeof argument_list[2] === 'string') {
      argument_list[2] = new Blob([argument_list[2]], {
        "type": options._content_type || options._mimetype ||
                "text/plain;charset=utf-8"
      });
    } else if (!(argument_list[2] instanceof Blob)) {
      throw new jIO.util.jIOError(
        'Attachment content is not a blob',
        400
      );
    }
  });

  declareMethod(JioProxyStorage, 'removeAttachment', function (argument_list,
                                                               storage,
                                                               method_name) {
    checkId(argument_list, storage, method_name);
    checkAttachmentId(argument_list, storage, method_name);
  });

  declareMethod(JioProxyStorage, 'getAttachment', function (argument_list,
                                                            storage,
                                                            method_name) {
    var result = "blob";
//     if (param.storage_spec.type !== "indexeddb" &&
//         param.storage_spec.type !== "dav" &&
//         (param.kwargs._start !== undefined
//          || param.kwargs._end !== undefined)) {
//       restCommandRejecter(param, [
//         'bad_request',
//         'unsupport',
//         '_start, _end not support'
//       ]);
//       return false;
//     }
    checkId(argument_list, storage, method_name);
    checkAttachmentId(argument_list, storage, method_name);
    // Drop optional parameters, which are only used in postfunction
    if (argument_list[2] !== undefined) {
      result = argument_list[2].format || result;
      delete argument_list[2].format;
    }
    return result;
  }, function (argument_list, blob, convert) {
    var result;
    if (!(blob instanceof Blob)) {
      throw new jIO.util.jIOError(
        "'getAttachment' (" + argument_list[0] + " , " +
          argument_list[1] + ") on '" + this.__type +
          "' does not return a Blob.",
        501
      );
    }
    if (convert === "blob") {
      result = blob;
    } else if (convert === "data_url") {
      result = new RSVP.Queue()
        .push(function () {
          return jIO.util.readBlobAsDataURL(blob);
        })
        .push(function (evt) {
          return evt.target.result;
        });
    } else if (convert === "array_buffer") {
      result = new RSVP.Queue()
        .push(function () {
          return jIO.util.readBlobAsArrayBuffer(blob);
        })
        .push(function (evt) {
          return evt.target.result;
        });
    } else if (convert === "text") {
      result = new RSVP.Queue()
        .push(function () {
          return jIO.util.readBlobAsText(blob);
        })
        .push(function (evt) {
          return evt.target.result;
        });
    } else if (convert === "json") {
      result = new RSVP.Queue()
        .push(function () {
          return jIO.util.readBlobAsText(blob);
        })
        .push(function (evt) {
          return JSON.parse(evt.target.result);
        });
    } else {
      throw new jIO.util.jIOError(
        this.__type + ".getAttachment format: '" + convert +
          "' is not supported",
        400
      );
    }
    return result;
  });

  JioProxyStorage.prototype.buildQuery = function () {
    var storage_method = this.__storage.buildQuery,
      context = this,
      argument_list = arguments;
    if (storage_method === undefined) {
      throw new jIO.util.jIOError(
        "Capacity 'buildQuery' is not implemented on '" + this.__type + "'",
        501
      );
    }
    return ensurePushableQueue(storage_method, argument_list,
                               context.__storage);
  };

  JioProxyStorage.prototype.hasCapacity = function (name) {
    var storage_method = this.__storage.hasCapacity,
      capacity_method = this.__storage[name];
    if (capacity_method !== undefined) {
      return true;
    }
    if ((storage_method === undefined) ||
        !storage_method.apply(this.__storage, arguments)) {
      throw new jIO.util.jIOError(
        "Capacity '" + name + "' is not implemented on '" + this.__type + "'",
        501
      );
    }
    return true;
  };

  JioProxyStorage.prototype.allDocs = function (options) {
    var context = this;
    if (options === undefined) {
      options = {};
    }
    return ensurePushableQueue(function () {
      if (context.hasCapacity("list") &&
          ((options.query === undefined) || context.hasCapacity("query")) &&
          ((options.sort_on === undefined) || context.hasCapacity("sort")) &&
          ((options.select_list === undefined) ||
           context.hasCapacity("select")) &&
          ((options.include_docs === undefined) ||
           context.hasCapacity("include")) &&
          ((options.limit === undefined) || context.hasCapacity("limit"))) {
        return context.buildQuery(options)
          .push(function (result) {
            return {
              data: {
                rows: result,
                total_rows: result.length
              }
            };
          });
      }
    });
  };

  declareMethod(JioProxyStorage, "allAttachments", checkId);
  declareMethod(JioProxyStorage, "repair");

  JioProxyStorage.prototype.repair = function () {
    var context = this,
      argument_list = arguments;
    return ensurePushableQueue(function () {
      var storage_method = context.__storage.repair;
      if (storage_method !== undefined) {
        return context.__storage.repair.apply(context.__storage,
                                              argument_list);
      }
    });
  };

  /////////////////////////////////////////////////////////////////
  // Storage builder
  /////////////////////////////////////////////////////////////////
  function JioBuilder() {
    if (!(this instanceof JioBuilder)) {
      return new JioBuilder();
    }
    this.__storage_types = {};
  }

  JioBuilder.prototype.createJIO = function (storage_spec, util) {

    if (typeof storage_spec.type !== 'string') {
      throw new TypeError("Invalid storage description");
    }
    if (!this.__storage_types[storage_spec.type]) {
      throw new TypeError("Unknown storage '" + storage_spec.type + "'");
    }

    return new JioProxyStorage(
      storage_spec.type,
      new this.__storage_types[storage_spec.type](storage_spec, util)
    );

  };

  JioBuilder.prototype.addStorage = function (type, Constructor) {
    if (typeof type !== 'string') {
      throw new TypeError(
        "jIO.addStorage(): Argument 1 is not of type 'string'"
      );
    }
    if (typeof Constructor !== 'function') {
      throw new TypeError("jIO.addStorage(): " +
                          "Argument 2 is not of type 'function'");
    }
    if (this.__storage_types[type] !== undefined) {
      throw new TypeError("jIO.addStorage(): Storage type already exists");
    }
    this.__storage_types[type] = Constructor;
  };

  JioBuilder.prototype.util = util;
  JioBuilder.prototype.QueryFactory = QueryFactory;
  JioBuilder.prototype.Query = Query;

  /////////////////////////////////////////////////////////////////
  // global
  /////////////////////////////////////////////////////////////////
  jIO = new JioBuilder();
  window.jIO = jIO;

}(window, RSVP, Blob, QueryFactory, Query, atob,
  FileReader, ArrayBuffer, Uint8Array, navigator));
var jIO = window.jIO;

// Blob is not supported by xhr2, so convert to ArrayBuffer instead
var originalAjax = jIO.util.ajax;
jIO.util.ajax = function ajax(param) {
  if (param.data instanceof Blob) {
    return jIO.util.readBlobAsArrayBuffer(param.data).then(function (data) {
      param.data = data.target.result;
      return originalAjax(param);
    });
  }

  return originalAjax(param);
};
/*
 * Copyright 2015, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/*jslint nomen: true*/
/*global Blob, RSVP, unescape, escape*/
(function (jIO, Blob, RSVP, unescape, escape) {
  "use strict";
  /**
   * The jIO DocumentStorage extension
   *
   * @class DocumentStorage
   * @constructor
   */
  function DocumentStorage(spec) {
    this._sub_storage = jIO.createJIO(spec.sub_storage);
    this._document_id = spec.document_id;
    this._repair_attachment = spec.repair_attachment || false;
  }

  var DOCUMENT_EXTENSION = ".json",
    DOCUMENT_REGEXP = new RegExp("^jio_document/([\\w=]+)" +
                                 DOCUMENT_EXTENSION + "$"),
    ATTACHMENT_REGEXP = new RegExp("^jio_attachment/([\\w=]+)/([\\w=]+)$"),
    btoa = function (str) {
      return window.btoa(unescape(encodeURIComponent(str)));
    },
    atob = function (str) {
      return decodeURIComponent(escape(window.atob(str)));
    };

  function getSubAttachmentIdFromParam(id, name) {
    if (name === undefined) {
      return 'jio_document/' + btoa(id) + DOCUMENT_EXTENSION;
    }
    return 'jio_attachment/' + btoa(id) + "/" + btoa(name);
  }

  DocumentStorage.prototype.get = function (id) {
    return this._sub_storage.getAttachment(
      this._document_id,
      getSubAttachmentIdFromParam(id),
      {format: "json"}
    );
  };

  DocumentStorage.prototype.allAttachments = function (id) {
    return this._sub_storage.allAttachments(this._document_id)
      .push(function (result) {
        var attachments = {},
          exec,
          key;
        for (key in result) {
          if (result.hasOwnProperty(key)) {
            if (ATTACHMENT_REGEXP.test(key)) {
              exec = ATTACHMENT_REGEXP.exec(key);
              try {
                if (atob(exec[1]) === id) {
                  attachments[atob(exec[2])] = {};
                }
              } catch (error) {
                // Check if unable to decode base64 data
                if (!error instanceof ReferenceError) {
                  throw error;
                }
              }
            }
          }
        }
        return attachments;
      });
  };

  DocumentStorage.prototype.put = function (doc_id, param) {
    return this._sub_storage.putAttachment(
      this._document_id,
      getSubAttachmentIdFromParam(doc_id),
      new Blob([JSON.stringify(param)], {type: "application/json"})
    )
      .push(function () {
        return doc_id;
      });

  };

  DocumentStorage.prototype.remove = function (id) {
    var context = this;
    return this.allAttachments(id)
      .push(function (result) {
        var key,
          promise_list = [];
        for (key in result) {
          if (result.hasOwnProperty(key)) {
            promise_list.push(context.removeAttachment(id, key));
          }
        }
        return RSVP.all(promise_list);
      })
      .push(function () {
        return context._sub_storage.removeAttachment(
          context._document_id,
          getSubAttachmentIdFromParam(id)
        );
      })
      .push(function () {
        return id;
      });
  };

  DocumentStorage.prototype.repair = function () {
    var context = this;
    return this._sub_storage.repair.apply(this._sub_storage, arguments)
      .push(function (result) {
        if (context._repair_attachment) {
          return context._sub_storage.allAttachments(context._document_id)
            .push(function (result_dict) {
              var promise_list = [],
                id_dict = {},
                attachment_dict = {},
                id,
                attachment,
                exec,
                key;
              for (key in result_dict) {
                if (result_dict.hasOwnProperty(key)) {
                  id = undefined;
                  attachment = undefined;
                  if (DOCUMENT_REGEXP.test(key)) {
                    try {
                      id = atob(DOCUMENT_REGEXP.exec(key)[1]);
                    } catch (error) {
                      // Check if unable to decode base64 data
                      if (!error instanceof ReferenceError) {
                        throw error;
                      }
                    }
                    if (id !== undefined) {
                      id_dict[id] = null;
                    }
                  } else if (ATTACHMENT_REGEXP.test(key)) {
                    exec = ATTACHMENT_REGEXP.exec(key);
                    try {
                      id = atob(exec[1]);
                      attachment = atob(exec[2]);
                    } catch (error) {
                      // Check if unable to decode base64 data
                      if (!error instanceof ReferenceError) {
                        throw error;
                      }
                    }
                    if (attachment !== undefined) {
                      if (!id_dict.hasOwnProperty(id)) {
                        if (!attachment_dict.hasOwnProperty(id)) {
                          attachment_dict[id] = {};
                        }
                        attachment_dict[id][attachment] = null;
                      }
                    }
                  }
                }
              }
              for (id in attachment_dict) {
                if (attachment_dict.hasOwnProperty(id)) {
                  if (!id_dict.hasOwnProperty(id)) {
                    for (attachment in attachment_dict[id]) {
                      if (attachment_dict[id].hasOwnProperty(attachment)) {
                        promise_list.push(context.removeAttachment(
                          id,
                          attachment
                        ));
                      }
                    }
                  }
                }
              }
              return RSVP.all(promise_list);
            });
        }
        return result;
      });
  };

  DocumentStorage.prototype.hasCapacity = function (capacity) {
    return (capacity === "list");
  };

  DocumentStorage.prototype.buildQuery = function () {
    return this._sub_storage.allAttachments(this._document_id)
      .push(function (attachment_dict) {
        var result = [],
          key;
        for (key in attachment_dict) {
          if (attachment_dict.hasOwnProperty(key)) {
            if (DOCUMENT_REGEXP.test(key)) {
              try {
                result.push({
                  id: atob(DOCUMENT_REGEXP.exec(key)[1]),
                  value: {}
                });
              } catch (error) {
                // Check if unable to decode base64 data
                if (!error instanceof ReferenceError) {
                  throw error;
                }
              }
            }
          }
        }
        return result;
      });
  };

  DocumentStorage.prototype.getAttachment = function (id, name) {
    return this._sub_storage.getAttachment(
      this._document_id,
      getSubAttachmentIdFromParam(id, name)
    );
  };

  DocumentStorage.prototype.putAttachment = function (id, name, blob) {
    return this._sub_storage.putAttachment(
      this._document_id,
      getSubAttachmentIdFromParam(id, name),
      blob
    );
  };

  DocumentStorage.prototype.removeAttachment = function (id, name) {
    return this._sub_storage.removeAttachment(
      this._document_id,
      getSubAttachmentIdFromParam(id, name)
    );
  };

  jIO.addStorage('document', DocumentStorage);

}(jIO, Blob, RSVP, unescape, escape));
/*
 * Copyright 2014, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/*jslint nomen: true*/
/*global RSVP, Blob*/
(function (jIO, RSVP, Blob) {
  "use strict";

  /**
   * The jIO FileSystemBridgeStorage extension
   *
   * @class FileSystemBridgeStorage
   * @constructor
   */
  function FileSystemBridgeStorage(spec) {
    this._sub_storage = jIO.createJIO(spec.sub_storage);
  }
  var DOCUMENT_EXTENSION = ".json",
    DOCUMENT_KEY = "/.jio_documents/",
    ROOT = "/";

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  FileSystemBridgeStorage.prototype.get = function (id) {
    var context = this;
    return new RSVP.Queue()

      // First, try to get explicit reference to the document

      .push(function () {
        // First get the document itself if it exists
        return context._sub_storage.getAttachment(
          DOCUMENT_KEY,
          id + DOCUMENT_EXTENSION,
          {format: "json"}
        );
      })
      .push(undefined, function (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {

          // Second, try to get default attachment
          return context._sub_storage.allAttachments(ROOT)
            .push(function (attachment_dict) {
              if (attachment_dict.hasOwnProperty(id)) {
                return {};
              }
              throw new jIO.util.jIOError("Cannot find document " + id,
                                          404);
            });
        }
        throw error;
      });
  };

  FileSystemBridgeStorage.prototype.allAttachments = function (id) {
    var context = this;
    return context._sub_storage.allAttachments(ROOT)
      .push(function (attachment_dict) {
        if (attachment_dict.hasOwnProperty(id)) {
          return {
            enclosure: {}
          };
        }
        // Second get the document itself if it exists
        return context._sub_storage.getAttachment(
          DOCUMENT_KEY,
          id + DOCUMENT_EXTENSION
        )
          .push(function () {
            return {};
          }, function (error) {
            if ((error instanceof jIO.util.jIOError) &&
                (error.status_code === 404)) {
              throw new jIO.util.jIOError("Cannot find document " + id,
                                          404);
            }
            throw error;
          });
      });

  };

  FileSystemBridgeStorage.prototype.put = function (doc_id, param) {
    var context = this;
    // XXX Handle conflict!

    return context._sub_storage.putAttachment(
      DOCUMENT_KEY,
      doc_id + DOCUMENT_EXTENSION,
      new Blob([JSON.stringify(param)], {type: "application/json"})
    )
      .push(undefined, function (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {
          return context._sub_storage.put(DOCUMENT_KEY, {})
            .push(function () {
              return context._sub_storage.putAttachment(
                DOCUMENT_KEY,
                doc_id + DOCUMENT_EXTENSION,
                new Blob([JSON.stringify(param)],
                         {type: "application/json"})
              );
            });
        }
        throw error;
      })
      .push(function () {
        return doc_id;
      });

  };

  FileSystemBridgeStorage.prototype.remove = function (doc_id) {
    var context = this,
      got_error = false;
    return new RSVP.Queue()

      // First, try to remove enclosure
      .push(function () {
        return context._sub_storage.removeAttachment(
          ROOT,
          doc_id
        );
      })

      .push(undefined, function (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {
          got_error = true;
          return;
        }
        throw error;
      })

      // Second, try to remove explicit doc
      .push(function () {
        return context._sub_storage.removeAttachment(
          DOCUMENT_KEY,
          doc_id + DOCUMENT_EXTENSION
        );
      })

      .push(undefined, function (error) {
        if ((!got_error) && (error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {
          return doc_id;
        }
        throw error;
      });

  };

  FileSystemBridgeStorage.prototype.hasCapacity = function (capacity) {
    return (capacity === "list");
  };

  FileSystemBridgeStorage.prototype.buildQuery = function () {
    var result_dict = {},
      context = this;
    return new RSVP.Queue()

      // First, get list of explicit documents

      .push(function () {
        return context._sub_storage.allAttachments(DOCUMENT_KEY);
      })
      .push(function (result) {
        var key;
        for (key in result) {
          if (result.hasOwnProperty(key)) {
            if (endsWith(key, DOCUMENT_EXTENSION)) {
              result_dict[key.substring(
                0,
                key.length - DOCUMENT_EXTENSION.length
              )] = null;
            }
          }
        }
      }, function (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {
          return;
        }
        throw error;
      })

      // Second, get list of enclosure

      .push(function () {
        return context._sub_storage.allAttachments(ROOT);
      })
      .push(function (result) {
        var key;
        for (key in result) {
          if (result.hasOwnProperty(key)) {
            result_dict[key] = null;
          }
        }
      })

      // Finally, build the result

      .push(function () {
        var result = [],
          key;
        for (key in result_dict) {
          if (result_dict.hasOwnProperty(key)) {
            result.push({
              id: key,
              value: {}
            });
          }
        }
        return result;
      });

  };

  FileSystemBridgeStorage.prototype.getAttachment = function (id, name) {
    if (name !== "enclosure") {
      throw new jIO.util.jIOError("Only support 'enclosure' attachment",
                                  400);
    }

    return this._sub_storage.getAttachment(ROOT, id);
  };

  FileSystemBridgeStorage.prototype.putAttachment = function (id, name, blob) {
    if (name !== "enclosure") {
      throw new jIO.util.jIOError("Only support 'enclosure' attachment",
                                  400);
    }

    return this._sub_storage.putAttachment(
      ROOT,
      id,
      blob
    );
  };

  FileSystemBridgeStorage.prototype.removeAttachment = function (id, name) {
    if (name !== "enclosure") {
      throw new jIO.util.jIOError("Only support 'enclosure' attachment",
                                  400);
    }

    return this._sub_storage.removeAttachment(ROOT, id);
  };

  FileSystemBridgeStorage.prototype.repair = function () {
    return this._sub_storage.repair.apply(this._sub_storage, arguments);
  };

  jIO.addStorage('drivetojiomapping', FileSystemBridgeStorage);

}(jIO, RSVP, Blob));
/*
 * Copyright 2013, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/**
 * JIO Dropbox Storage. Type = "dropbox".
 * Dropbox "database" storage.
 */
/*global Blob, jIO, RSVP*/
/*jslint nomen: true*/

(function (jIO, RSVP, Blob, JSON) {
  "use strict";
  var GET_URL = "https://content.dropboxapi.com/2/files/download",
    UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload",
    REMOVE_URL = "https://api.dropboxapi.com/2/files/delete_v2",
    CREATE_DIR_URL = "https://api.dropboxapi.com/2/files/create_folder_v2",
    METADATA_URL = "https://api.dropboxapi.com/2/files/get_metadata",
    LIST_FOLDER_URL = "https://api.dropboxapi.com/2/files/list_folder",
    LIST_MORE_URL = "https://api.dropboxapi.com/2/files/list_folder/continue";

  function restrictDocumentId(id) {
    if (id.indexOf("/") !== 0) {
      throw new jIO.util.jIOError("id " + id + " is forbidden (no begin /)",
                                  400);
    }
    if (id.lastIndexOf("/") !== (id.length - 1)) {
      throw new jIO.util.jIOError("id " + id + " is forbidden (no end /)",
                                  400);
    }
    return id.slice(0, -1);
  }

  function restrictAttachmentId(id) {
    if (id.indexOf("/") !== -1) {
      throw new jIO.util.jIOError("attachment " + id + " is forbidden",
                                  400);
    }
  }

  function recursiveAllAttachments(result, token, id, cursor) {
    var data,
      url;
    if (cursor === undefined) {
      data = {
        "path": id,
        "recursive": false,
        "include_media_info": false,
        "include_deleted": false,
        "include_has_explicit_shared_members": false,
        "include_mounted_folders": true
      };
      url = LIST_FOLDER_URL;
    } else {
      data = {"cursor": cursor};
      url = LIST_MORE_URL;
    }
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: "POST",
          url: url,
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          },
          data: JSON.stringify(data)
        });
      })
      .push(function (evt) {
        var obj = JSON.parse(evt.target.response || evt.target.responseText),
          i;
        for (i = 0; i < obj.entries.length; i += 1) {
          if (obj.entries[i][".tag"] === "file") {
            result[obj.entries[i].name] = {};
          }
        }
        if (obj.has_more) {
          return recursiveAllAttachments(result, token, id, obj.cursor);
        }
        return result;
      }, function (error) {
        if (error.target !== undefined && error.target.status === 409) {
          var err_content = JSON.parse(error.target.response ||
                                       error.target.responseText);
          if ((err_content.error['.tag'] === 'path') &&
              (err_content.error.path['.tag'] === 'not_folder')) {
            throw new jIO.util.jIOError("Not a directory: " + id + "/",
                                        404);
          }
          if ((err_content.error['.tag'] === 'path') &&
              (err_content.error.path['.tag'] === 'not_found')) {
            throw new jIO.util.jIOError("Cannot find document: " + id + "/",
                                        404);
          }
        }
        throw error;
      });
  }

  /**
   * The JIO Dropbox Storage extension
   *
   * @class DropboxStorage
   * @constructor
   */
  function DropboxStorage(spec) {
    if (typeof spec.access_token !== 'string' || !spec.access_token) {
      throw new TypeError("Access Token' must be a string " +
                          "which contains more than one character.");
    }
    this._access_token = spec.access_token;
  }

  DropboxStorage.prototype.put = function (id, param) {
    var that = this;
    id = restrictDocumentId(id);
    if (Object.getOwnPropertyNames(param).length > 0) {
      // Reject if param has some properties
      throw new jIO.util.jIOError("Can not store properties: " +
                                  Object.getOwnPropertyNames(param), 400);
    }
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: "POST",
          url: CREATE_DIR_URL,
          headers: {
            "Authorization": "Bearer " + that._access_token,
            "Content-Type": "application/json"
          },
          data: JSON.stringify({"path": id, "autorename": false})
        });
      })
      .push(undefined, function (err) {
        if ((err.target !== undefined) &&
            (err.target.status === 409)) {
          var err_content = JSON.parse(err.target.response ||
                                       err.target.responseText);
          if ((err_content.error['.tag'] === 'path') &&
              (err_content.error.path['.tag'] === 'conflict')) {
            // Directory already exists, no need to fail
            return;
          }
        }
        throw err;
      });
  };

  DropboxStorage.prototype.remove = function (id) {
    id = restrictDocumentId(id);
    return jIO.util.ajax({
      type: "POST",
      url: REMOVE_URL,
      headers: {
        "Authorization": "Bearer " + this._access_token,
        "Content-Type": "application/json"
      },
      data: JSON.stringify({"path": id})
    });
  };

  DropboxStorage.prototype.get = function (id) {
    var that = this;

    if (id === "/") {
      return {};
    }
    id = restrictDocumentId(id);

    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: "POST",
          url: METADATA_URL,
          headers: {
            "Authorization": "Bearer " + that._access_token,
            "Content-Type": "application/json"
          },
          data: JSON.stringify({"path": id})
        });
      })
      .push(function (evt) {
        var obj = JSON.parse(evt.target.response ||
                             evt.target.responseText);
        if (obj[".tag"] === "folder") {
          return {};
        }
        throw new jIO.util.jIOError("Not a directory: " + id + "/", 404);
      }, function (error) {
        if (error.target !== undefined && error.target.status === 409) {
          var err_content = JSON.parse(error.target.response ||
                                       error.target.responseText);
          if ((err_content.error['.tag'] === 'path') &&
              (err_content.error.path['.tag'] === 'not_found')) {
            throw new jIO.util.jIOError("Cannot find document: " + id + "/",
                                        404);
          }
        }
        throw error;
      });
  };

  DropboxStorage.prototype.allAttachments = function (id) {
    id = restrictDocumentId(id);
    return recursiveAllAttachments({}, this._access_token, id);
  };

  //currently, putAttachment will fail with files larger than 150MB,
  //due to the Dropbox API. the API provides the "chunked_upload" method
  //to pass this limit, but upload process becomes more complex to implement.
  //
  //putAttachment will also create a folder if you try to put an attachment
  //to an inexisting foler.

  DropboxStorage.prototype.putAttachment = function (id, name, blob) {
    id = restrictDocumentId(id);
    restrictAttachmentId(name);

    return jIO.util.ajax({
      type: "POST",
      url: UPLOAD_URL,
      headers: {
        "Authorization": "Bearer " + this._access_token,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          "path": id + "/" + name,
          "mode": "overwrite",
          "autorename": false,
          "mute": false
        })
      },
      data: blob
    });
  };

  DropboxStorage.prototype.getAttachment = function (id, name) {
    var context = this;

    id = restrictDocumentId(id);
    restrictAttachmentId(name);

    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          url: GET_URL,
          type: "POST",
          dataType: "blob",
          headers: {
            "Authorization": "Bearer " + context._access_token,
            "Dropbox-API-Arg": JSON.stringify({"path": id + "/" + name})
          }
        });
      })
      .push(function (evt) {
        if (evt.target.response instanceof Blob) {
          return evt.target.response;
        }
        return new Blob(
          [evt.target.responseText],
          {"type": evt.target.getResponseHeader('Content-Type') ||
            "application/octet-stream"}
        );
      }, function (error) {
        if (error.target !== undefined && error.target.status === 409) {
          if (!(error.target.response instanceof Blob)) {
            var err_content = JSON.parse(error.target.responseText);
            if ((err_content.error['.tag'] === 'path') &&
                (err_content.error.path['.tag'] === 'not_found')) {
              throw new jIO.util.jIOError("Cannot find attachment: " +
                                          id + "/, " + name, 404);
            }
            throw error;
          }
          return new RSVP.Queue()
            .push(function () {
              return jIO.util.readBlobAsText(error.target.response);
            })
            .push(function (evt) {
              var err_content2 = JSON.parse(evt.target.result);
              if ((err_content2.error['.tag'] === 'path') &&
                  (err_content2.error.path['.tag'] === 'not_found')) {
                throw new jIO.util.jIOError("Cannot find attachment: " +
                                            id + "/, " + name, 404);
              }
              throw error;
            });
        }
        throw error;
      });
  };

  //removeAttachment removes also directories.(due to Dropbox API)

  DropboxStorage.prototype.removeAttachment = function (id, name) {
    var that = this;
    id = restrictDocumentId(id);
    restrictAttachmentId(name);

    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: "POST",
          url: REMOVE_URL,
          headers: {
            "Authorization": "Bearer " + that._access_token,
            "Content-Type": "application/json"
          },
          data: JSON.stringify({"path": id + "/" + name})
        });
      }).push(undefined, function (error) {
        if (error.target !== undefined && error.target.status === 409) {
          var err_content = JSON.parse(error.target.response ||
                                       error.target.responseText);
          if ((err_content.error['.tag'] === 'path_lookup') &&
              (err_content.error.path_lookup['.tag'] === 'not_found')) {
            throw new jIO.util.jIOError("Cannot find attachment: " +
                                        id + "/, " + name, 404);
          }
        }
        throw error;
      });
  };

  jIO.addStorage('dropbox', DropboxStorage);

}(jIO, RSVP, Blob, JSON));
/*
 * Copyright 2013, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
// JIO ERP5 Storage Description :
// {
//   type: "erp5"
//   url: {string}
// }

/*jslint nomen: true, unparam: true */
/*global jIO, UriTemplate, FormData, RSVP, URI, Blob,
         SimpleQuery, ComplexQuery*/

(function (jIO, UriTemplate, FormData, RSVP, URI, Blob, btoa,
           SimpleQuery, ComplexQuery) {
  "use strict";

  function getSiteDocument(storage) {
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: "GET",
          url: storage._url,
          xhrFields: {
            withCredentials: storage._withCredentials
          },
          headers: storage._headers
        });
      })
      .push(function (event) {
        return JSON.parse(event.target.responseText);
      });
  }

  function getDocumentAndHateoas(storage, id, options) {
    if (options === undefined) {
      options = {};
    }
    return getSiteDocument(storage)
      .push(function (site_hal) {
        // XXX need to get modified metadata
        return new RSVP.Queue()
          .push(function () {
            return jIO.util.ajax({
              type: "GET",
              url: UriTemplate.parse(
                site_hal._links.traverse.href
              ).expand({
                relative_url: id,
                view: options._view
              }),
              xhrFields: {
                withCredentials: storage._withCredentials
              },
              headers: storage._headers
            });
          })
          .push(undefined, function (error) {
            if ((error.target !== undefined) &&
                (error.target.status === 404)) {
              throw new jIO.util.jIOError("Cannot find document: " + id, 404);
            }
            throw error;
          });
      });
  }

  var allowed_field_dict = {
    "StringField": null,
    "EmailField": null,
    "IntegerField": null,
    "FloatField": null,
    "TextAreaField": null
  };

  function extractPropertyFromFormJSON(json) {
    var form = json._embedded._view,
      converted_json = {
        portal_type: json._links.type.name
      },
      form_data_json = {},
      field,
      key,
      prefix_length,
      result;

    if (json._links.hasOwnProperty('parent')) {
      converted_json.parent_relative_url =
        new URI(json._links.parent.href).segment(2);
    }

    form_data_json.form_id = {
      "key": [form.form_id.key],
      "default": form.form_id["default"]
    };
    // XXX How to store datetime
    for (key in form) {
      if (form.hasOwnProperty(key)) {
        field = form[key];
        prefix_length = 0;
        if (key.indexOf('my_') === 0 && field.editable) {
          prefix_length = 3;
        }
        if (key.indexOf('your_') === 0) {
          prefix_length = 5;
        }
        if ((prefix_length !== 0) &&
            (allowed_field_dict.hasOwnProperty(field.type))) {
          form_data_json[key.substring(prefix_length)] = {
            "default": field["default"],
            "key": field.key
          };
          converted_json[key.substring(prefix_length)] = field["default"];
        }
      }
    }

    result = {
      data: converted_json,
      form_data: form_data_json
    };
    if (form.hasOwnProperty('_actions') &&
        form._actions.hasOwnProperty('put')) {
      result.action_href = form._actions.put.href;
    }
    return result;
  }

  function extractPropertyFromForm(context, id) {
    return context.getAttachment(id, "view")
      .push(function (blob) {
        return jIO.util.readBlobAsText(blob);
      })
      .push(function (evt) {
        return JSON.parse(evt.target.result);
      })
      .push(function (json) {
        return extractPropertyFromFormJSON(json);
      });
  }

  // XXX docstring
  function ERP5Storage(spec) {
    if (typeof spec.url !== "string" || !spec.url) {
      throw new TypeError("ERP5 'url' must be a string " +
                          "which contains more than one character.");
    }
    this._url = spec.url;
    this._default_view_reference = spec.default_view_reference;
    this._headers = null;
    this._withCredentials = true;
    if (spec.login && spec.password) {
      this._headers = {
        Accept: "*/*",
        Authorization: "Basic " + btoa(spec.login + ":" + spec.password)
      };
      this._withCredentials = false;
    }
    else if (spec.access_token) {
      this._headers = {
        Accept: "*/*",
        'X-ACCESS-TOKEN': spec.access_token
      };
      this._withCredentials = false;
    }
  }

  function convertJSONToGet(json) {
    var key,
      result = json.data;
    // Remove all ERP5 hateoas links / convert them into jIO ID
    for (key in result) {
      if (result.hasOwnProperty(key)) {
        if (!result[key]) {
          delete result[key];
        }
      }
    }
    return result;
  }

  ERP5Storage.prototype.get = function (id) {
    return extractPropertyFromForm(this, id)
      .push(function (result) {
        return convertJSONToGet(result);
      });
  };

  ERP5Storage.prototype.post = function (data) {
    var context = this,
      new_id;

    return getSiteDocument(this)
      .push(function (site_hal) {
        var form_data = new FormData();
        form_data.append("portal_type", data.portal_type);
        form_data.append("parent_relative_url", data.parent_relative_url);
        return jIO.util.ajax({
          type: "POST",
          url: site_hal._actions.add.href,
          data: form_data,
          xhrFields: {
            withCredentials: context._withCredentials
          },
          headers: context._headers
        });
      })
      .push(function (evt) {
        var location = evt.target.getResponseHeader("X-Location"),
          uri = new URI(location);
        new_id = uri.segment(2);
        return context.put(new_id, data);
      })
      .push(function () {
        return new_id;
      });
  };

  ERP5Storage.prototype.put = function (id, data) {
    var context = this;

    return extractPropertyFromForm(context, id)
      .push(function (result) {
        var key,
          json = result.form_data,
          form_data = {};
        form_data[json.form_id.key] = json.form_id["default"];

        // XXX How to store datetime:!!!!!
        for (key in data) {
          if (data.hasOwnProperty(key)) {
            if (key === "form_id") {
              throw new jIO.util.jIOError(
                "ERP5: forbidden property: " + key,
                400
              );
            }
            if ((key !== "portal_type") && (key !== "parent_relative_url")) {
              if (!json.hasOwnProperty(key)) {
                throw new jIO.util.jIOError(
                  "ERP5: can not store property: " + key,
                  400
                );
              }
              form_data[json[key].key] = data[key];
            }
          }
        }
        if (!result.hasOwnProperty('action_href')) {
          throw new jIO.util.jIOError(
            "ERP5: can not modify document: " + id,
            403
          );
        }
        return context.putAttachment(
          id,
          result.action_href,
          new Blob([JSON.stringify(form_data)], {type: "application/json"})
        );
      });
  };

  ERP5Storage.prototype.allAttachments = function (id) {
    var context = this;
    return getDocumentAndHateoas(this, id)
      .push(function () {
        if (context._default_view_reference === undefined) {
          return {
            links: {}
          };
        }
        return {
          view: {},
          links: {}
        };
      });
  };

  ERP5Storage.prototype.getAttachment = function (id, action, options) {
    if (options === undefined) {
      options = {};
    }
    if (action === "view") {
      if (this._default_view_reference === undefined) {
        throw new jIO.util.jIOError(
          "Cannot find attachment view for: " + id,
          404
        );
      }
      return getDocumentAndHateoas(this, id,
                                   {"_view": this._default_view_reference})
        .push(function (response) {
          var result = JSON.parse(response.target.responseText);
          // Remove all ERP5 hateoas links / convert them into jIO ID

          // XXX Change default action to an jio urn with attachment name inside
          // if Base_edit, do put URN
          // if others, do post URN (ie, unique new attachment name)
          // XXX Except this attachment name should be generated when
          return new Blob(
            [JSON.stringify(result)],
            {"type": 'application/hal+json'}
          );
        });
    }
    if (action === "links") {
      return getDocumentAndHateoas(this, id)
        .push(function (response) {
          return new Blob(
            [JSON.stringify(JSON.parse(response.target.responseText))],
            {"type": 'application/hal+json'}
          );
        });
    }
    if (action.indexOf(this._url) === 0) {
      var context = this;

      return new RSVP.Queue()
        .push(function () {
          var start,
            end,
            range,
            request_options = {
              type: "GET",
              dataType: "blob",
              url: action,
              xhrFields: {
                withCredentials: context._withCredentials
              },
              headers: context._headers
            };
          if (options.start !== undefined ||  options.end !== undefined) {
            start = options.start || 0;
            end = options.end;
            if (end !== undefined && end < 0) {
              throw new jIO.util.jIOError("end must be positive",
                                          400);
            }
            if (start < 0) {
              range = "bytes=" + start;
            } else if (end === undefined) {
              range = "bytes=" + start + "-";
            } else {
              if (start > end) {
                throw new jIO.util.jIOError("start is greater than end",
                                            400);
              }
              range = "bytes=" + start + "-" + end;
            }
            request_options.headers = {Range: range};
          }
          return jIO.util.ajax(request_options);
        })
        .push(function (evt) {
          if (evt.target.response === undefined) {
            return new Blob(
              [evt.target.responseText],
              {"type": evt.target.getResponseHeader("Content-Type")}
            );
          }
          return evt.target.response;
        });
    }
    throw new jIO.util.jIOError("ERP5: not support get attachment: " + action,
                                400);
  };

  ERP5Storage.prototype.putAttachment = function (id, name, blob) {
    var context = this;

    // Assert we use a callable on a document from the ERP5 site
    if (name.indexOf(this._url) !== 0) {
      throw new jIO.util.jIOError("Can not store outside ERP5: " +
                                  name, 400);
    }

    return new RSVP.Queue()
      .push(function () {
        return jIO.util.readBlobAsText(blob);
      })
      .push(function (evt) {
        var form_data = JSON.parse(evt.target.result),
          data = new FormData(),
          array,
          i,
          key,
          value;
        for (key in form_data) {
          if (form_data.hasOwnProperty(key)) {
            if (Array.isArray(form_data[key])) {
              array = form_data[key];
            } else {
              array = [form_data[key]];
            }
            for (i = 0; i < array.length; i += 1) {
              value = array[i];
              if (typeof value === "object") {
                data.append(key, jIO.util.dataURItoBlob(value.url),
                            value.file_name);
              } else {
                data.append(key, value);
              }
            }
          }
        }
        return jIO.util.ajax({
          type: "POST",
          url: name,
          data: data,
          dataType: "blob",
          xhrFields: {
            withCredentials: context._withCredentials
          },
          headers: context._headers
        });
      });
  };

  ERP5Storage.prototype.hasCapacity = function (name) {
    return ((name === "list") || (name === "query") ||
            (name === "select") || (name === "limit") ||
            (name === "sort"));
  };

  function isSingleLocalRoles(parsed_query) {
    if ((parsed_query instanceof SimpleQuery) &&
        (parsed_query.operator === undefined) &&
        (parsed_query.key === 'local_roles')) {
      // local_roles:"Assignee"
      return parsed_query.value;
    }
  }

  function isSingleDomain(parsed_query) {
    if ((parsed_query instanceof SimpleQuery) &&
        (parsed_query.operator === undefined) &&
        (parsed_query.key !== undefined) &&
        (parsed_query.key.indexOf('selection_domain_') === 0)) {
      // domain_region:"europe/france"
      var result = {};
      result[parsed_query.key.slice('selection_domain_'.length)] =
        parsed_query.value;
      return result;
    }
  }

  function isMultipleLocalRoles(parsed_query) {
    var i,
      sub_query,
      is_multiple = true,
      local_role_list = [];
    if ((parsed_query instanceof ComplexQuery) &&
        (parsed_query.operator === 'OR')) {

      for (i = 0; i < parsed_query.query_list.length; i += 1) {
        sub_query = parsed_query.query_list[i];
        if ((sub_query instanceof SimpleQuery) &&
            (sub_query.key !== undefined) &&
            (sub_query.key === 'local_roles')) {
          local_role_list.push(sub_query.value);
        } else {
          is_multiple = false;
        }
      }
      if (is_multiple) {
        // local_roles:"Assignee" OR local_roles:"Assignor"
        return local_role_list;
      }
    }
  }

  ERP5Storage.prototype.buildQuery = function (options) {
    var context = this;

//     if (typeof options.query !== "string") {
//       options.query = (options.query ?
//                        jIO.Query.objectToSearchText(options.query) :
//                        undefined);
//     }
    return getSiteDocument(this)
      .push(function (site_hal) {
        var query = options.query,
          i,
          key,
          parsed_query,
          sub_query,
          result_list,
          local_roles,
          local_role_found = false,
          selection_domain,
          sort_list = [];
        if (options.query) {
          parsed_query = jIO.QueryFactory.create(options.query);
          result_list = isSingleLocalRoles(parsed_query);
          if (result_list) {
            query = undefined;
            local_roles = result_list;
          } else {
            result_list = isSingleDomain(parsed_query);
            if (result_list) {
              query = undefined;
              selection_domain = result_list;
            } else {

              result_list = isMultipleLocalRoles(parsed_query);
              if (result_list) {
                query = undefined;
                local_roles = result_list;
              } else if ((parsed_query instanceof ComplexQuery) &&
                         (parsed_query.operator === 'AND')) {

                // portal_type:"Person" AND local_roles:"Assignee"
                // AND selection_domain_region:"europe/france"
                for (i = 0; i < parsed_query.query_list.length; i += 1) {
                  sub_query = parsed_query.query_list[i];

                  if (!local_role_found) {
                    result_list = isSingleLocalRoles(sub_query);
                    if (result_list) {
                      local_roles = result_list;
                      parsed_query.query_list.splice(i, 1);
                      query = jIO.Query.objectToSearchText(parsed_query);
                      local_role_found = true;
                    } else {
                      result_list = isMultipleLocalRoles(sub_query);
                      if (result_list) {
                        local_roles = result_list;
                        parsed_query.query_list.splice(i, 1);
                        query = jIO.Query.objectToSearchText(parsed_query);
                        local_role_found = true;
                      }
                    }
                  }

                  result_list = isSingleDomain(sub_query);
                  if (result_list) {
                    parsed_query.query_list.splice(i, 1);
                    query = jIO.Query.objectToSearchText(parsed_query);
                    if (selection_domain) {
                      for (key in result_list) {
                        if (result_list.hasOwnProperty(key)) {
                          selection_domain[key] = result_list[key];
                        }
                      }
                    } else {
                      selection_domain = result_list;
                    }
                    i -= 1;
                  }

                }
              }
            }
          }
        }

        if (options.sort_on) {
          for (i = 0; i < options.sort_on.length; i += 1) {
            sort_list.push(JSON.stringify(options.sort_on[i]));
          }
        }

        if (selection_domain) {
          selection_domain = JSON.stringify(selection_domain);
        }

        return jIO.util.ajax({
          type: "GET",
          url: UriTemplate.parse(
            site_hal._links.raw_search.href
          ).expand({
            query: query,
            // XXX Force erp5 to return embedded document
            select_list: options.select_list || ["title", "reference"],
            limit: options.limit,
            sort_on: sort_list,
            local_roles: local_roles,
            selection_domain: selection_domain
          }),
          xhrFields: {
            withCredentials: context._withCredentials
          },
          headers: context._headers
        });
      })
      .push(function (response) {
        return JSON.parse(response.target.responseText);
      })
      .push(function (catalog_json) {
        var data = catalog_json._embedded.contents,
          count = data.length,
          i,
          uri,
          item,
          result = [];
        for (i = 0; i < count; i += 1) {
          item = data[i];
          uri = new URI(item._links.self.href);
          delete item._links;
          result.push({
            id: uri.segment(2),
            value: item
          });
        }
        return result;
      });
  };

  jIO.addStorage("erp5", ERP5Storage);

}(jIO, UriTemplate, FormData, RSVP, URI, Blob, btoa,
  SimpleQuery, ComplexQuery));
/*
 * Copyright 2017, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/*jslint nomen: true */
/*global RSVP, UriTemplate*/
(function (jIO, RSVP, UriTemplate) {
  "use strict";

  var GET_POST_URL = "https://graph.facebook.com/v2.9/{+post_id}" +
      "?fields={+fields}&access_token={+access_token}",
    get_post_template = UriTemplate.parse(GET_POST_URL),
    GET_FEED_URL = "https://graph.facebook.com/v2.9/{+user_id}/feed" +
        "?fields={+fields}&limit={+limit}&since={+since}&access_token=" +
        "{+access_token}",
    get_feed_template = UriTemplate.parse(GET_FEED_URL);

  function FBStorage(spec) {
    if (typeof spec.access_token !== 'string' || !spec.access_token) {
      throw new TypeError("Access Token must be a string " +
                          "which contains more than one character.");
    }
    if (typeof spec.user_id !== 'string' || !spec.user_id) {
      throw new TypeError("User ID must be a string " +
                          "which contains more than one character.");
    }
    this._access_token = spec.access_token;
    this._user_id = spec.user_id;
    this._default_field_list = spec.default_field_list || [];
    this._default_limit = spec.default_limit || 500;
  }

  FBStorage.prototype.get = function (id) {
    var that = this;
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: "GET",
          url: get_post_template.expand({post_id: id,
            fields: that._default_field_list, access_token: that._access_token})
        });
      })
      .push(function (result) {
        return JSON.parse(result.target.responseText);
      });
  };

  function paginateResult(url, result, select_list) {
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: "GET",
          url: url
        });
      })
      .push(function (response) {
        return JSON.parse(response.target.responseText);
      },
        function (err) {
          throw new jIO.util.jIOError("Getting feed failed " + err.toString(),
            err.target.status);
        })
      .push(function (response) {
        if (response.data.length === 0) {
          return result;
        }
        var i, j, obj = {};
        for (i = 0; i < response.data.length; i += 1) {
          obj.id = response.data[i].id;
          obj.value = {};
          for (j = 0; j < select_list.length; j += 1) {
            obj.value[select_list[j]] = response.data[i][select_list[j]];
          }
          result.push(obj);
          obj = {};
        }
        return paginateResult(response.paging.next, result, select_list);
      });
  }

  FBStorage.prototype.buildQuery = function (query) {
    var that = this, fields = [], limit = this._default_limit,
      template_argument = {
        user_id: this._user_id,
        limit: limit,
        access_token: this._access_token
      };
    if (query.include_docs) {
      fields = fields.concat(that._default_field_list);
    }
    if (query.select_list) {
      fields = fields.concat(query.select_list);
    }
    if (query.limit) {
      limit = query.limit[1];
    }
    template_argument.fields = fields;
    template_argument.limit = limit;
    return paginateResult(get_feed_template.expand(template_argument), [],
      fields)
      .push(function (result) {
        if (!query.limit) {
          return result;
        }
        return result.slice(query.limit[0], query.limit[1]);
      });
  };

  FBStorage.prototype.hasCapacity = function (name) {
    var this_storage_capacity_list = ["list", "select", "include", "limit"];
    if (this_storage_capacity_list.indexOf(name) !== -1) {
      return true;
    }
  };

  jIO.addStorage('facebook', FBStorage);

}(jIO, RSVP, UriTemplate));/*
 * Copyright 2015, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/**
 * JIO Google Drive Storage. Type = "gdrive".
 * Google Drive "database" storage.
 */
/*global jIO, Blob, RSVP, UriTemplate, JSON*/
/*jslint nomen: true*/

(function (jIO, Blob, RSVP, UriTemplate, JSON) {
  "use strict";

  var UPLOAD_URL = "https://www.googleapis.com{/upload}/drive/v2/files{/id}" +
      "{?uploadType,access_token}",
    upload_template = UriTemplate.parse(UPLOAD_URL),
    REMOVE_URL = "https://www.googleapis.com/drive/v2/" +
      "files{/id,trash}{?access_token}",
    remove_template = UriTemplate.parse(REMOVE_URL),
    LIST_URL = "https://www.googleapis.com/drive/v2/files" +
      "?prettyPrint=false{&pageToken}&q=trashed=false" +
      "&fields=nextPageToken,items(id){&access_token}",
    list_template = UriTemplate.parse(LIST_URL),
    GET_URL = "https://www.googleapis.com/drive/v2/files{/id}{?alt}",
    get_template = UriTemplate.parse(GET_URL);

  function handleError(error, id) {
    if (error.target.status === 404) {
      throw new jIO.util.jIOError(
        "Cannot find document: " + id,
        404
      );
    }
    throw error;
  }

  function listPage(result, token) {
    var i,
      obj;
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          "type": "GET",
          "url": list_template.expand({
            pageToken : (result.nextPageToken || ""),
            access_token: token
          })
        });
      })
      .push(function (data) {
        obj = JSON.parse(data.target.response || data.target.responseText);
        for (i = 0; i < obj.items.length; i += 1) {
          obj.items[i].value = {};
          result.push(obj.items[i]);
        }
        result.nextPageToken = obj.nextPageToken;
        return result;
      }, handleError);
  }

  function checkName(name) {
    if (name !== "enclosure") {
      throw new jIO.util.jIOError("Only support 'enclosure' attachment", 400);
    }
  }

  /**
   * The JIO Google Drive Storage extension
   *
   * @class GdriveStorage
   * @constructor
   */
  function GdriveStorage(spec) {
    if (spec === undefined || spec.access_token === undefined ||
        typeof spec.access_token !== 'string') {
      throw new TypeError("Access Token must be a string " +
                          "which contains more than one character.");
    }
    if (spec.trashing !== undefined &&
        (spec.trashing !== true && spec.trashing !== false)) {
      throw new TypeError("trashing parameter" +
                          " must be a boolean (true or false)");
    }
    this._trashing = spec.trashing || true;
    this._access_token = spec.access_token;
    return;
  }

  function recursiveAllDocs(result, accessToken) {
    return new RSVP.Queue()
      .push(function () {
        return listPage(result, accessToken);
      })
      .push(function () {
        if (result.nextPageToken) {
          return recursiveAllDocs(result, accessToken);
        }
        return result;
      });
  }

  GdriveStorage.prototype.hasCapacity = function (name) {
    return (name === "list");
  };

  GdriveStorage.prototype.buildQuery = function () {
    return recursiveAllDocs([], this._access_token);
  };

  function sendMetaData(id, param, token) {
    var boundary = "-------314159265358979323846";

    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          "type": id ? "PUT" : "POST",
          "url": upload_template.expand({
            access_token: token,
            id: id || [],
            upload: id ? [] : "upload",
            uploadType: "multipart"
          }),
          headers: {
            "Content-Type" : 'multipart/related; boundary="' + boundary + '"'
          },
          data: '--' + boundary + '\n' +
            'Content-Type: application/json; charset=UTF-8\n\n' +
            JSON.stringify(param) + '\n\n--' + boundary + "--"
        });
      })
      .push(function (result) {
        var obj = JSON.parse(result.target.responseText);

        return obj.id;
      },
            function (error) {handleError(error, id); });
  }

  GdriveStorage.prototype.put = function (id, param) {
    return sendMetaData(id, param, this._access_token);
  };

  GdriveStorage.prototype.post = function (param) {
    return sendMetaData(undefined, param, this._access_token);
  };

  function sendData(id, blob, token) {
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          "type": "PUT",
          "url": upload_template.expand({
            access_token: token,
            upload: "upload",
            id: id,
            uploadType: "media"
          }),
          data: blob
        });
      })
      .push(function (data) {
        data = JSON.parse(data.target.responseText);
        if (data.mimeType === "application/vnd.google-apps.folder") {
          throw new jIO.util.jIOError("cannot put attachments to folder", 400);
        }
        return data;
      }, function (error) {handleError(error, id); });
  }

  GdriveStorage.prototype.putAttachment = function (id, name, blob) {
    checkName(name);
    return sendData(id, blob, this._access_token);
  };

  GdriveStorage.prototype.remove = function (id) {
    var that  = this;
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: that._trashing ? "POST" : "DELETE",
          url: remove_template.expand({
            id : id,
            access_token : that._access_token,
            trash : that._trashing ? "trash" : []
          })
        });
      })
      .push(undefined, function (error) {handleError(error, id); });
  };

  function getData(id, attach, token) {
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: "GET",
          dataType: attach ? "blob" : "json",
          url: get_template.expand({
            id: id,
            alt: attach ? "media" : [],
            access_token: token
          }),
          headers: {
            "Authorization" : "Bearer " + token
          }
        });
      })
      .push(function (evt) {
        return evt.target.response ||
          (attach ? new Blob([evt.target.responseText],
                             {"type" :
                              evt.target.responseHeaders["Content-Type"]}) :
              JSON.parse(evt.target.responseText));
      }, function (error) {handleError(error, id); });
  }

  GdriveStorage.prototype.get = function (id) {
    return getData(id, false, this._access_token);
  };

  GdriveStorage.prototype.getAttachment = function (id, name) {
    checkName(name);
    return getData(id, true, this._access_token);
  };

  GdriveStorage.prototype.allAttachments = function (id) {
    var token = this._access_token;

    return new RSVP.Queue()
      .push(function () {
        return getData(id, false, token);
      })
      .push(function (data) {
        if (data.mimeType === "application/vnd.google-apps.folder") {
          return {};
        }
        return {"enclosure": {}};
      });
  };

  jIO.addStorage('gdrive', GdriveStorage);

}(jIO, Blob, RSVP, UriTemplate, JSON));
/*jslint indent:2, maxlen: 80, nomen: true */
/*global jIO, RSVP, UriTemplate, SimpleQuery, ComplexQuery, QueryFactory,
  Query, FormData*/
(function (jIO, RSVP, UriTemplate, SimpleQuery, ComplexQuery, QueryFactory,
  Query, FormData) {
  "use strict";

  function getSubIdEqualSubProperty(storage, value, key) {
    var query;
    if (storage._no_sub_query_id) {
      throw new jIO.util.jIOError('no sub query id active', 404);
    }
    if (!value) {
      throw new jIO.util.jIOError(
        'can not find document with ' + key + ' : undefined',
        404
      );
    }
    if (storage._mapping_id_memory_dict[value]) {
      return storage._mapping_id_memory_dict[value];
    }
    query = new SimpleQuery({
      key: key,
      value: value,
      type: "simple"
    });
    if (storage._query.query !== undefined) {
      query = new ComplexQuery({
        operator: "AND",
        query_list: [query, storage._query.query],
        type: "complex"
      });
    }
    query = Query.objectToSearchText(query);
    return storage._sub_storage.allDocs({
      "query": query,
      "sort_on": storage._query.sort_on,
      "select_list": storage._query.select_list,
      "limit": storage._query.limit
    })
      .push(function (data) {
        if (data.data.total_rows === 0) {
          throw new jIO.util.jIOError(
            "Can not find document with (" + key + ", " + value + ")",
            404
          );
        }
        if (data.data.total_rows > 1) {
          throw new TypeError("id must be unique field: " + key
            + ", result:" + data.data.rows.toString());
        }
        storage._mapping_id_memory_dict[value] = data.data.rows[0].id;
        return data.data.rows[0].id;
      });
  }

  /*jslint unparam: true*/
  var mapping_function = {
    "equalSubProperty": {
      "mapToSubProperty": function (property, sub_doc, doc, args, id) {
        sub_doc[args] = doc[property];
        return args;
      },
      "mapToMainProperty": function (property, sub_doc, doc, args, sub_id) {
        if (sub_doc.hasOwnProperty(args)) {
          doc[property] = sub_doc[args];
        }
        return args;
      },
      "mapToSubId": function (storage, doc, id, args) {
        if (doc !== undefined) {
          if (storage._property_for_sub_id &&
              doc.hasOwnProperty(storage._property_for_sub_id)) {
            return doc[storage._property_for_sub_id];
          }
        }
        return getSubIdEqualSubProperty(storage, id, storage._map_id[1]);
      },
      "mapToId": function (storage, sub_doc, sub_id, args) {
        return sub_doc[args];
      }
    },
    "equalValue": {
      "mapToSubProperty": function (property, sub_doc, doc, args) {
        sub_doc[property] = args;
        return property;
      },
      "mapToMainProperty": function (property) {
        return property;
      }
    },
    "ignore": {
      "mapToSubProperty": function () {
        return false;
      },
      "mapToMainProperty": function (property) {
        return property;
      }
    },
    "equalSubId": {
      "mapToSubProperty": function (property, sub_doc, doc) {
        sub_doc[property] = doc[property];
        return property;
      },
      "mapToMainProperty": function (property, sub_doc, doc, args, sub_id) {
        if (sub_id === undefined && sub_doc.hasOwnProperty(property)) {
          doc[property] = sub_doc[property];
        } else {
          doc[property] = sub_id;
        }
        return property;
      },
      "mapToSubId": function (storage, doc, id, args) {
        return id;
      },
      "mapToId": function (storage, sub_doc, sub_id) {
        return sub_id;
      }
    },
    "keep": {
      "mapToSubProperty": function (property, sub_doc, doc) {
        sub_doc[property] = doc[property];
        return property;
      },
      "mapToMainProperty": function (property, sub_doc, doc) {
        doc[property] = sub_doc[property];
        return property;
      }
    },
    "switchPropertyValue": {
      "mapToSubProperty": function (property, sub_doc, doc, args) {
        sub_doc[args[0]] = args[1][doc[property]];
        return args[0];
      },
      "mapToMainProperty": function (property, sub_doc, doc, args) {
        var subvalue, value = sub_doc[args[0]];
        for (subvalue in args[1]) {
          if (args[1].hasOwnProperty(subvalue)) {
            if (value === args[1][subvalue]) {
              doc[property] = subvalue;
              return property;
            }
          }
        }
      }
    }
  };
  /*jslint unparam: false*/

  function initializeQueryAndDefaultMapping(storage) {
    var property, query_list = [];
    for (property in storage._mapping_dict) {
      if (storage._mapping_dict.hasOwnProperty(property)) {
        if (storage._mapping_dict[property][0] === "equalValue") {
          if (storage._mapping_dict[property][1] === undefined) {
            throw new jIO.util.jIOError("equalValue has not parameter", 400);
          }
          storage._default_mapping[property] =
            storage._mapping_dict[property][1];
          query_list.push(new SimpleQuery({
            key: property,
            value: storage._mapping_dict[property][1],
            type: "simple"
          }));
        }
        if (storage._mapping_dict[property][0] === "equalSubId") {
          if (storage._property_for_sub_id !== undefined) {
            throw new jIO.util.jIOError(
              "equalSubId can be defined one time",
              400
            );
          }
          storage._property_for_sub_id = property;
        }
      }
    }
    if (storage._map_id[0] === "equalSubProperty") {
      storage._mapping_dict[storage._map_id[1]] = ["keep"];
    }
    if (storage._query.query !== undefined) {
      query_list.push(QueryFactory.create(storage._query.query));
    }
    if (query_list.length > 1) {
      storage._query.query = new ComplexQuery({
        type: "complex",
        query_list: query_list,
        operator: "AND"
      });
    } else if (query_list.length === 1) {
      storage._query.query = query_list[0];
    }
  }

  function MappingStorage(spec) {
    this._mapping_dict = spec.property || {};
    this._sub_storage = jIO.createJIO(spec.sub_storage);
    this._map_all_property = spec.map_all_property !== undefined ?
        spec.map_all_property : true;
    this._no_sub_query_id = spec.no_sub_query_id;
    this._attachment_mapping_dict = spec.attachment || {};
    this._query = spec.query || {};
    this._map_id = spec.id || ["equalSubId"];
    this._id_mapped = (spec.id !== undefined) ? spec.id[1] : false;

    if (this._query.query !== undefined) {
      this._query.query = QueryFactory.create(this._query.query);
    }
    this._default_mapping = {};
    this._mapping_id_memory_dict = {};
    this._attachment_list = spec.attachment_list || [];
    this._caching_dict = {id: {}};

    initializeQueryAndDefaultMapping(this);
  }

  function getAttachmentId(storage, sub_id, attachment_id, method) {
    var mapping_dict = storage._attachment_mapping_dict;
    if (mapping_dict !== undefined
        && mapping_dict[attachment_id] !== undefined
        && mapping_dict[attachment_id][method] !== undefined
        && mapping_dict[attachment_id][method].uri_template !== undefined) {
      return UriTemplate.parse(
        mapping_dict[attachment_id][method].uri_template
      ).expand({id: sub_id});
    }
    return attachment_id;
  }

  function getSubStorageId(storage, id, doc) {
    if (storage._caching_dict.id.hasOwnProperty(id)) {
      return new RSVP.Queue()
        .push(function () {
          return storage._caching_dict.id[id];
        });
    }
    return new RSVP.Queue()
      .push(function () {
        var map_info = storage._map_id || ["equalSubId"];
        if (storage._property_for_sub_id && doc !== undefined &&
            doc.hasOwnProperty(storage._property_for_sub_id)) {
          return doc[storage._property_for_sub_id];
        }
        return mapping_function[map_info[0]].mapToSubId(
          storage,
          doc,
          id,
          map_info[1]
        );
      })
      .push(function (sub_id) {
        storage._caching_dict.id[id] = sub_id;
        return sub_id;
      });
  }

  function mapToSubProperty(storage, property, sub_doc, doc, id) {
    var mapping_info = storage._mapping_dict[property] || ["keep"];
    return mapping_function[mapping_info[0]].mapToSubProperty(
      property,
      sub_doc,
      doc,
      mapping_info[1],
      id
    );
  }

  function mapToMainProperty(storage, property, sub_doc, doc, sub_id) {
    var mapping_info = storage._mapping_dict[property] || ["keep"];
    return mapping_function[mapping_info[0]].mapToMainProperty(
      property,
      sub_doc,
      doc,
      mapping_info[1],
      sub_id
    );
  }

  function mapToMainDocument(storage, sub_doc, sub_id) {
    var doc = {},
      property,
      property_list = [storage._id_mapped];
    for (property in storage._mapping_dict) {
      if (storage._mapping_dict.hasOwnProperty(property)) {
        property_list.push(mapToMainProperty(
          storage,
          property,
          sub_doc,
          doc,
          sub_id
        ));
      }
    }
    if (storage._map_all_property) {
      for (property in sub_doc) {
        if (sub_doc.hasOwnProperty(property)) {
          if (property_list.indexOf(property) < 0) {
            doc[property] = sub_doc[property];
          }
        }
      }
    }
    if (storage._map_for_sub_storage_id !== undefined) {
      doc[storage._map_for_sub_storage_id] = sub_id;
    }
    return doc;
  }

  function mapToSubstorageDocument(storage, doc, id) {
    var sub_doc = {}, property;

    for (property in doc) {
      if (doc.hasOwnProperty(property)) {
        mapToSubProperty(storage, property, sub_doc, doc, id);
      }
    }
    for (property in storage._default_mapping) {
      if (storage._default_mapping.hasOwnProperty(property)) {
        sub_doc[property] = storage._default_mapping[property];
      }
    }
    if (storage._map_id[0] === "equalSubProperty" && id !== undefined) {
      sub_doc[storage._map_id[1]] = id;
    }
    return sub_doc;
  }

  function handleAttachment(storage, argument_list, method) {
    return getSubStorageId(storage, argument_list[0])
      .push(function (sub_id) {
        argument_list[0] = sub_id;
        var old_id = argument_list[1];
        argument_list[1] = getAttachmentId(
          storage,
          argument_list[0],
          argument_list[1],
          method
        );
        if (storage._attachment_list.length > 0
            && storage._attachment_list.indexOf(old_id) < 0) {
          if (method === "get") {
            throw new jIO.util.jIOError("unhautorized attachment", 404);
          }
          return;
        }
        return storage._sub_storage[method + "Attachment"].apply(
          storage._sub_storage,
          argument_list
        );
      });
  }

  MappingStorage.prototype.get = function (id) {
    var storage = this;
    return getSubStorageId(this, id)
      .push(function (sub_id) {
        return storage._sub_storage.get(sub_id)
          .push(function (sub_doc) {
            return mapToMainDocument(storage, sub_doc, sub_id);
          });
      });
  };

  MappingStorage.prototype.post = function (doc) {
    var sub_doc = mapToSubstorageDocument(
      this,
      doc
    ),
      id = doc[this._property_for_sub_id],
      storage = this;
    if (this._property_for_sub_id && id !== undefined) {
      return this._sub_storage.put(id, sub_doc);
    }
    if (this._id_mapped && doc[this._id_mapped] !== undefined) {
      return getSubStorageId(storage, id, doc)
        .push(function (sub_id) {
          return storage._sub_storage.put(sub_id, sub_doc);
        })
        .push(function () {
          return doc[storage._id_mapped];
        })
        .push(undefined, function (error) {
          if (error instanceof jIO.util.jIOError) {
            return storage._sub_storage.post(sub_doc);
          }
          throw error;
        });
    }
    throw new jIO.util.jIOError(
      "post is not supported with id mapped",
      400
    );
  };

  MappingStorage.prototype.put = function (id, doc) {
    var storage = this,
      sub_doc = mapToSubstorageDocument(this, doc, id);
    return getSubStorageId(this, id, doc)
      .push(function (sub_id) {
        return storage._sub_storage.put(sub_id, sub_doc);
      })
      .push(undefined, function (error) {
        if (error instanceof jIO.util.jIOError && error.status_code === 404) {
          return storage._sub_storage.post(sub_doc);
        }
        throw error;
      })
      .push(function () {
        return id;
      });
  };

  MappingStorage.prototype.remove = function (id) {
    var storage = this;
    return getSubStorageId(this, id)
      .push(function (sub_id) {
        return storage._sub_storage.remove(sub_id);
      })
      .push(function () {
        return id;
      });
  };

  MappingStorage.prototype.getAttachment = function () {
    return handleAttachment(this, arguments, "get");
  };

  MappingStorage.prototype.putAttachment = function (id, attachment_id, blob) {
    var storage = this,
      mapping_dict = storage._attachment_mapping_dict;
    // THIS IS REALLY BAD, FIND AN OTHER WAY IN FUTURE
    if (mapping_dict !== undefined
        && mapping_dict[attachment_id] !== undefined
        && mapping_dict[attachment_id].put !== undefined
        && mapping_dict[attachment_id].put.erp5_put_template !== undefined) {
      return getSubStorageId(storage, id)
        .push(function (sub_id) {
          var url = UriTemplate.parse(
            mapping_dict[attachment_id].put.erp5_put_template
          ).expand({id: sub_id}),
            data = new FormData();
          data.append("field_my_file", blob);
          data.append("form_id", "File_view");
          return jIO.util.ajax({
            "type": "POST",
            "url": url,
            "data": data,
            "xhrFields": {
              withCredentials: true
            }
          });
        });
    }
    return handleAttachment(this, arguments, "put", id)
      .push(function () {
        return attachment_id;
      });
  };

  MappingStorage.prototype.removeAttachment = function (id, attachment_id) {
    return handleAttachment(this, arguments, "remove", id)
      .push(function () {
        return attachment_id;
      });
  };

  MappingStorage.prototype.allAttachments = function (id) {
    var storage = this, sub_id;
    return getSubStorageId(storage, id)
      .push(function (sub_id_result) {
        sub_id = sub_id_result;
        return storage._sub_storage.allAttachments(sub_id);
      })
      .push(function (result) {
        var attachment_id,
          attachments = {},
          mapping_dict = {},
          i;
        for (attachment_id in storage._attachment_mapping_dict) {
          if (storage._attachment_mapping_dict.hasOwnProperty(attachment_id)) {
            mapping_dict[getAttachmentId(storage, sub_id, attachment_id, "get")]
              = attachment_id;
          }
        }
        for (attachment_id in result) {
          if (result.hasOwnProperty(attachment_id)) {
            if (!(storage._attachment_list.length > 0
                && storage._attachment_list.indexOf(attachment_id) < 0)) {
              if (mapping_dict.hasOwnProperty(attachment_id)) {
                attachments[mapping_dict[attachment_id]] = {};
              } else {
                attachments[attachment_id] = {};
              }
            }
          }
        }
        for (i = 0; i < storage._attachment_list.length; i += 1) {
          if (!attachments.hasOwnProperty(storage._attachment_list[i])) {
            attachments[storage._attachment_list[i]] = {};
          }
        }
        return attachments;
      });
  };

  MappingStorage.prototype.hasCapacity = function (name) {
    return this._sub_storage.hasCapacity(name);
  };

  MappingStorage.prototype.repair = function () {
    return this._sub_storage.repair.apply(this._sub_storage, arguments);
  };

  MappingStorage.prototype.bulk = function (id_list) {
    var storage = this;

    function mapId(parameter) {
      return getSubStorageId(storage, parameter.parameter_list[0])
        .push(function (id) {
          return {"method": parameter.method, "parameter_list": [id]};
        });
    }

    return new RSVP.Queue()
      .push(function () {
        var promise_list = id_list.map(mapId);
        return RSVP.all(promise_list);
      })
      .push(function (id_list_mapped) {
        return storage._sub_storage.bulk(id_list_mapped);
      })
      .push(function (result) {
        var mapped_result = [], i;
        for (i = 0; i < result.length; i += 1) {
          mapped_result.push(mapToMainDocument(
            storage,
            result[i]
          ));
        }
        return mapped_result;
      });
  };

  MappingStorage.prototype.buildQuery = function (option) {
    var storage = this,
      i,
      query,
      property,
      select_list = [],
      sort_on = [];

    function mapQuery(one_query) {
      var j, query_list = [], key, sub_query;
      if (one_query.type === "complex") {
        for (j = 0; j < one_query.query_list.length; j += 1) {
          sub_query = mapQuery(one_query.query_list[j]);
          if (sub_query) {
            query_list.push(sub_query);
          }
        }
        one_query.query_list = query_list;
        return one_query;
      }
      key = mapToMainProperty(storage, one_query.key, {}, {});
      if (key !== undefined) {
        one_query.key = key;
        return one_query;
      }
      return false;
    }

    if (option.sort_on !== undefined) {
      for (i = 0; i < option.sort_on.length; i += 1) {
        property = mapToMainProperty(this, option.sort_on[i][0], {}, {});
        if (property && sort_on.indexOf(property) < 0) {
          sort_on.push([property, option.sort_on[i][1]]);
        }
      }
    }
    if (this._query.sort_on !== undefined) {
      for (i = 0; i < this._query.sort_on.length; i += 1) {
        property = mapToMainProperty(this, this._query.sort_on[i], {}, {});
        if (sort_on.indexOf(property) < 0) {
          sort_on.push([property, option.sort_on[i][1]]);
        }
      }
    }
    if (option.select_list !== undefined) {
      for (i = 0; i < option.select_list.length; i += 1) {
        property = mapToMainProperty(this, option.select_list[i], {}, {});
        if (property && select_list.indexOf(property) < 0) {
          select_list.push(property);
        }
      }
    }
    if (this._query.select_list !== undefined) {
      for (i = 0; i < this._query.select_list; i += 1) {
        property = this._query.select_list[i];
        if (select_list.indexOf(property) < 0) {
          select_list.push(property);
        }
      }
    }
    if (this._id_mapped) {
      // modify here for future way to map id
      select_list.push(this._id_mapped);
    }
    if (option.query !== undefined) {
      query = mapQuery(QueryFactory.create(option.query));
    }

    if (this._query.query !== undefined) {
      if (query === undefined) {
        query = this._query.query;
      }
      query = new ComplexQuery({
        operator: "AND",
        query_list: [query, this._query.query],
        type: "complex"
      });
    }

    if (query !== undefined) {
      query = Query.objectToSearchText(query);
    }
    var queryOptions = {};
    if (query) {
      queryOptions.query = query;
    }
    if (select_list) {
      queryOptions.select_list = select_list;
    }
    if (sort_on) {
      queryOptions.sort_on = sort_on;
    }
    if (option.limit) {
      queryOptions.limit = option.limit;
    }
    return this._sub_storage.allDocs(queryOptions)
      .push(function (result) {
        var sub_doc, map_info = storage._map_id || ["equalSubId"];
        for (i = 0; i < result.data.total_rows; i += 1) {
          sub_doc = result.data.rows[i].value;
          result.data.rows[i].id =
            mapping_function[map_info[0]].mapToId(
              storage,
              sub_doc,
              result.data.rows[i].id,
              map_info[1]
            );
          result.data.rows[i].value =
            mapToMainDocument(
              storage,
              sub_doc
            );
        }
        return result.data.rows;
      });
  };

  jIO.addStorage('mapping', MappingStorage);
}(jIO, RSVP, UriTemplate, SimpleQuery, ComplexQuery, QueryFactory, Query,
  FormData));/*
 * Copyright 2013, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */

/*jslint nomen: true*/
/*global jIO, RSVP*/

/**
 * JIO Memory Storage. Type = 'memory'.
 * Memory browser "database" storage.
 *
 * Storage Description:
 *
 *     {
 *       "type": "memory"
 *     }
 *
 * @class MemoryStorage
 */

(function (jIO, JSON, RSVP) {
  "use strict";

  /**
   * The JIO MemoryStorage extension
   *
   * @class MemoryStorage
   * @constructor
   */
  function MemoryStorage() {
    this._database = {};
  }

  MemoryStorage.prototype.put = function (id, metadata) {
    if (!this._database.hasOwnProperty(id)) {
      this._database[id] = {
        attachments: {}
      };
    }
    this._database[id].doc = JSON.stringify(metadata);
    return id;
  };

  MemoryStorage.prototype.get = function (id) {
    try {
      return JSON.parse(this._database[id].doc);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new jIO.util.jIOError(
          "Cannot find document: " + id,
          404
        );
      }
      throw error;
    }
  };

  MemoryStorage.prototype.allAttachments = function (id) {
    var key,
      attachments = {};
    try {
      for (key in this._database[id].attachments) {
        if (this._database[id].attachments.hasOwnProperty(key)) {
          attachments[key] = {};
        }
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new jIO.util.jIOError(
          "Cannot find document: " + id,
          404
        );
      }
      throw error;
    }
    return attachments;
  };

  MemoryStorage.prototype.remove = function (id) {
    delete this._database[id];
    return id;
  };

  MemoryStorage.prototype.getAttachment = function (id, name) {
    try {
      var result = this._database[id].attachments[name];
      if (result === undefined) {
        throw new jIO.util.jIOError(
          "Cannot find attachment: " + id + " , " + name,
          404
        );
      }
      return jIO.util.dataURItoBlob(result);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new jIO.util.jIOError(
          "Cannot find attachment: " + id + " , " + name,
          404
        );
      }
      throw error;
    }
  };

  MemoryStorage.prototype.putAttachment = function (id, name, blob) {
    var attachment_dict;
    try {
      attachment_dict = this._database[id].attachments;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new jIO.util.jIOError("Cannot find document: " + id, 404);
      }
      throw error;
    }
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.readBlobAsDataURL(blob);
      })
      .push(function (evt) {
        attachment_dict[name] = evt.target.result;
      });
  };

  MemoryStorage.prototype.removeAttachment = function (id, name) {
    try {
      delete this._database[id].attachments[name];
    } catch (error) {
      if (error instanceof TypeError) {
        throw new jIO.util.jIOError(
          "Cannot find document: " + id,
          404
        );
      }
      throw error;
    }
  };


  MemoryStorage.prototype.hasCapacity = function (name) {
    return ((name === "list") || (name === "include"));
  };

  MemoryStorage.prototype.buildQuery = function (options) {
    var rows = [],
      i;
    for (i in this._database) {
      if (this._database.hasOwnProperty(i)) {
        if (options.include_docs === true) {
          rows.push({
            id: i,
            value: {},
            doc: JSON.parse(this._database[i].doc)
          });
        } else {
          rows.push({
            id: i,
            value: {}
          });
        }

      }
    }
    return rows;
  };

  jIO.addStorage('memory', MemoryStorage);

}(jIO, JSON, RSVP));
/*
 * Copyright 2014, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/*jslint nomen: true*/
/*global RSVP, jiodate*/
(function (jIO, RSVP, jiodate) {
  "use strict";

  function dateType(str) {
    return jiodate.JIODate(new Date(str).toISOString());
  }

  function initKeySchema(storage, spec) {
    var property;
    for (property in spec.schema) {
      if (spec.schema.hasOwnProperty(property)) {
        if (spec.schema[property].type === "string" &&
            spec.schema[property].format === "date-time") {
          storage._key_schema.key_set[property] = {
            read_from: property,
            cast_to: "dateType"
          };
          if (storage._key_schema.cast_lookup.dateType === undefined) {
            storage._key_schema.cast_lookup.dateType = dateType;
          }
        } else {
          throw new jIO.util.jIOError(
            "Wrong schema for property: " + property,
            400
          );
        }
      }
    }
  }

  /**
   * The jIO QueryStorage extension
   *
   * @class QueryStorage
   * @constructor
   */
  function QueryStorage(spec) {
    this._sub_storage = jIO.createJIO(spec.sub_storage);
    this._key_schema = {key_set: {}, cast_lookup: {}};
    initKeySchema(this, spec);
  }

  QueryStorage.prototype.get = function () {
    return this._sub_storage.get.apply(this._sub_storage, arguments);
  };
  QueryStorage.prototype.allAttachments = function () {
    return this._sub_storage.allAttachments.apply(this._sub_storage, arguments);
  };
  QueryStorage.prototype.post = function () {
    return this._sub_storage.post.apply(this._sub_storage, arguments);
  };
  QueryStorage.prototype.put = function () {
    return this._sub_storage.put.apply(this._sub_storage, arguments);
  };
  QueryStorage.prototype.remove = function () {
    return this._sub_storage.remove.apply(this._sub_storage, arguments);
  };
  QueryStorage.prototype.getAttachment = function () {
    return this._sub_storage.getAttachment.apply(this._sub_storage, arguments);
  };
  QueryStorage.prototype.putAttachment = function () {
    return this._sub_storage.putAttachment.apply(this._sub_storage, arguments);
  };
  QueryStorage.prototype.removeAttachment = function () {
    return this._sub_storage.removeAttachment.apply(this._sub_storage,
                                                    arguments);
  };
  QueryStorage.prototype.repair = function () {
    return this._sub_storage.repair.apply(this._sub_storage, arguments);
  };

  QueryStorage.prototype.hasCapacity = function (name) {
    var this_storage_capacity_list = ["limit",
                                      "sort",
                                      "select",
                                      "query"];

    if (this_storage_capacity_list.indexOf(name) !== -1) {
      return true;
    }
    if (name === "list") {
      return this._sub_storage.hasCapacity(name);
    }
    return false;
  };
  QueryStorage.prototype.buildQuery = function (options) {
    var substorage = this._sub_storage,
      context = this,
      sub_options = {},
      is_manual_query_needed = false,
      is_manual_include_needed = false;

    if (substorage.hasCapacity("list")) {

      // Can substorage handle the queries if needed?
      try {
        if (((options.query === undefined) ||
             (substorage.hasCapacity("query"))) &&
            ((options.sort_on === undefined) ||
             (substorage.hasCapacity("sort"))) &&
            ((options.select_list === undefined) ||
             (substorage.hasCapacity("select"))) &&
            ((options.limit === undefined) ||
             (substorage.hasCapacity("limit")))) {
          sub_options.query = options.query;
          sub_options.sort_on = options.sort_on;
          sub_options.select_list = options.select_list;
          sub_options.limit = options.limit;
        }
      } catch (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 501)) {
          is_manual_query_needed = true;
        } else {
          throw error;
        }
      }

      // Can substorage include the docs if needed?
      try {
        if ((is_manual_query_needed ||
            (options.include_docs === true)) &&
            (substorage.hasCapacity("include"))) {
          sub_options.include_docs = true;
        }
      } catch (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 501)) {
          is_manual_include_needed = true;
        } else {
          throw error;
        }
      }

      return substorage.buildQuery(sub_options)

        // Include docs if needed
        .push(function (result) {
          var include_query_list = [result],
            len,
            i;

          function safeGet(j) {
            var id = result[j].id;
            return substorage.get(id)
              .push(function (doc) {
                // XXX Can delete user data!
                doc._id = id;
                return doc;
              }, function (error) {
                // Document may have been dropped after listing
                if ((error instanceof jIO.util.jIOError) &&
                    (error.status_code === 404)) {
                  return;
                }
                throw error;
              });
          }

          if (is_manual_include_needed) {
            len = result.length;
            for (i = 0; i < len; i += 1) {
              include_query_list.push(safeGet(i));
            }
            result = RSVP.all(include_query_list);
          }
          return result;
        })
        .push(function (result) {
          var original_result,
            len,
            i;
          if (is_manual_include_needed) {
            original_result = result[0];
            len = original_result.length;
            for (i = 0; i < len; i += 1) {
              original_result[i].doc = result[i + 1];
            }
            result = original_result;
          }
          return result;

        })

        // Manual query if needed
        .push(function (result) {
          var data_rows = [],
            len,
            i;
          if (is_manual_query_needed) {
            len = result.length;
            for (i = 0; i < len; i += 1) {
              result[i].doc.__id = result[i].id;
              data_rows.push(result[i].doc);
            }
            if (options.select_list) {
              options.select_list.push("__id");
            }
            result = jIO.QueryFactory.create(options.query || "",
                                             context._key_schema).
              exec(data_rows, options);
          }
          return result;
        })

        // reconstruct filtered rows, preserving the order from docs
        .push(function (result) {
          var new_result = [],
            element,
            len,
            i;
          if (is_manual_query_needed) {
            len = result.length;
            for (i = 0; i < len; i += 1) {
              element = {
                id: result[i].__id,
                value: options.select_list ? result[i] : {},
                doc: {}
              };
              if (options.select_list) {
                // Does not work if user manually request __id
                delete element.value.__id;
              }
              if (options.include_docs) {
                // XXX To implement
                throw new Error("QueryStorage does not support include docs");
              }
              new_result.push(element);
            }
            result = new_result;
          }
          return result;
        });

    }
  };

  jIO.addStorage('query', QueryStorage);

}(jIO, RSVP, jiodate));
/*
 * JIO extension for resource replication.
 * Copyright (C) 2013, 2015  Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */

/*jslint nomen: true*/
/*global jIO, RSVP, Rusha*/

(function (jIO, RSVP, Rusha, stringify) {
  "use strict";

  var rusha = new Rusha(),
    CONFLICT_THROW = 0,
    CONFLICT_KEEP_LOCAL = 1,
    CONFLICT_KEEP_REMOTE = 2,
    CONFLICT_CONTINUE = 3;

  function SkipError(message) {
    if ((message !== undefined) && (typeof message !== "string")) {
      throw new TypeError('You must pass a string.');
    }
    this.message = message || "Skip some asynchronous code";
  }
  SkipError.prototype = new Error();
  SkipError.prototype.constructor = SkipError;

  /****************************************************
   Use a local jIO to read/write/search documents
   Synchronize in background those document with a remote jIO.
   Synchronization status is stored for each document as an local attachment.
  ****************************************************/

  function generateHash(content) {
    // XXX Improve performance by moving calculation to WebWorker
    return rusha.digestFromString(content);
  }

  function generateHashFromArrayBuffer(content) {
    // XXX Improve performance by moving calculation to WebWorker
    return rusha.digestFromArrayBuffer(content);
  }

  function ReplicateStorage(spec) {
    this._query_options = spec.query || {};
    if (spec.signature_hash_key !== undefined) {
      this._query_options.select_list = [spec.signature_hash_key];
    }
    this._signature_hash_key = spec.signature_hash_key;

    this._local_sub_storage = jIO.createJIO(spec.local_sub_storage);
    this._remote_sub_storage = jIO.createJIO(spec.remote_sub_storage);

    if (spec.hasOwnProperty('signature_sub_storage')) {
      this._signature_sub_storage = jIO.createJIO(spec.signature_sub_storage);
      this._custom_signature_sub_storage = true;
    } else {
      this._signature_hash = "_replicate_" + generateHash(
        stringify(spec.local_sub_storage) +
          stringify(spec.remote_sub_storage) +
          stringify(this._query_options)
      );
      this._signature_sub_storage = jIO.createJIO({
        type: "query",
        sub_storage: {
          type: "document",
          document_id: this._signature_hash,
          sub_storage: spec.local_sub_storage
        }
      });
      this._custom_signature_sub_storage = false;
    }

    this._use_remote_post = spec.use_remote_post || false;
    // Number of request we allow browser execution for attachments
    this._parallel_operation_attachment_amount =
      spec.parallel_operation_attachment_amount || 1;
    // Number of request we allow browser execution for documents
    this._parallel_operation_amount =
      spec.parallel_operation_amount || 1;

    this._conflict_handling = spec.conflict_handling || 0;
    // 0: no resolution (ie, throw an Error)
    // 1: keep the local state
    //    (overwrites the remote document with local content)
    //    (delete remote document if local is deleted)
    // 2: keep the remote state
    //    (overwrites the local document with remote content)
    //    (delete local document if remote is deleted)
    // 3: keep both copies (leave documents untouched, no signature update)
    if ((this._conflict_handling !== CONFLICT_THROW) &&
        (this._conflict_handling !== CONFLICT_KEEP_LOCAL) &&
        (this._conflict_handling !== CONFLICT_KEEP_REMOTE) &&
        (this._conflict_handling !== CONFLICT_CONTINUE)) {
      throw new jIO.util.jIOError("Unsupported conflict handling: " +
                                  this._conflict_handling, 400);
    }

    this._check_local_modification = spec.check_local_modification;
    if (this._check_local_modification === undefined) {
      this._check_local_modification = true;
    }
    this._check_local_creation = spec.check_local_creation;
    if (this._check_local_creation === undefined) {
      this._check_local_creation = true;
    }
    this._check_local_deletion = spec.check_local_deletion;
    if (this._check_local_deletion === undefined) {
      this._check_local_deletion = true;
    }
    this._check_remote_modification = spec.check_remote_modification;
    if (this._check_remote_modification === undefined) {
      this._check_remote_modification = true;
    }
    this._check_remote_creation = spec.check_remote_creation;
    if (this._check_remote_creation === undefined) {
      this._check_remote_creation = true;
    }
    this._check_remote_deletion = spec.check_remote_deletion;
    if (this._check_remote_deletion === undefined) {
      this._check_remote_deletion = true;
    }
    this._check_local_attachment_modification =
      spec.check_local_attachment_modification;
    if (this._check_local_attachment_modification === undefined) {
      this._check_local_attachment_modification = false;
    }
    this._check_local_attachment_creation =
      spec.check_local_attachment_creation;
    if (this._check_local_attachment_creation === undefined) {
      this._check_local_attachment_creation = false;
    }
    this._check_local_attachment_deletion =
      spec.check_local_attachment_deletion;
    if (this._check_local_attachment_deletion === undefined) {
      this._check_local_attachment_deletion = false;
    }
    this._check_remote_attachment_modification =
      spec.check_remote_attachment_modification;
    if (this._check_remote_attachment_modification === undefined) {
      this._check_remote_attachment_modification = false;
    }
    this._check_remote_attachment_creation =
      spec.check_remote_attachment_creation;
    if (this._check_remote_attachment_creation === undefined) {
      this._check_remote_attachment_creation = false;
    }
    this._check_remote_attachment_deletion =
      spec.check_remote_attachment_deletion;
    if (this._check_remote_attachment_deletion === undefined) {
      this._check_remote_attachment_deletion = false;
    }
  }

  ReplicateStorage.prototype.remove = function (id) {
    if (id === this._signature_hash) {
      throw new jIO.util.jIOError(this._signature_hash + " is frozen",
                                  403);
    }
    return this._local_sub_storage.remove.apply(this._local_sub_storage,
                                                arguments);
  };
  ReplicateStorage.prototype.post = function () {
    return this._local_sub_storage.post.apply(this._local_sub_storage,
                                              arguments);
  };
  ReplicateStorage.prototype.put = function (id) {
    if (id === this._signature_hash) {
      throw new jIO.util.jIOError(this._signature_hash + " is frozen",
                                  403);
    }
    return this._local_sub_storage.put.apply(this._local_sub_storage,
                                             arguments);
  };
  ReplicateStorage.prototype.get = function () {
    return this._local_sub_storage.get.apply(this._local_sub_storage,
                                             arguments);
  };
  ReplicateStorage.prototype.getAttachment = function () {
    return this._local_sub_storage.getAttachment.apply(this._local_sub_storage,
                                                       arguments);
  };
  ReplicateStorage.prototype.allAttachments = function () {
    return this._local_sub_storage.allAttachments.apply(this._local_sub_storage,
                                                        arguments);
  };
  ReplicateStorage.prototype.putAttachment = function (id) {
    if (id === this._signature_hash) {
      throw new jIO.util.jIOError(this._signature_hash + " is frozen",
                                  403);
    }
    return this._local_sub_storage.putAttachment.apply(this._local_sub_storage,
                                                       arguments);
  };
  ReplicateStorage.prototype.removeAttachment = function (id) {
    if (id === this._signature_hash) {
      throw new jIO.util.jIOError(this._signature_hash + " is frozen",
                                  403);
    }
    return this._local_sub_storage.removeAttachment.apply(
      this._local_sub_storage,
      arguments
    );
  };
  ReplicateStorage.prototype.hasCapacity = function () {
    return this._local_sub_storage.hasCapacity.apply(this._local_sub_storage,
                                                     arguments);
  };
  ReplicateStorage.prototype.buildQuery = function () {
    // XXX Remove signature document?
    return this._local_sub_storage.buildQuery.apply(this._local_sub_storage,
                                                    arguments);
  };

  function dispatchQueue(context, function_used, argument_list,
                         number_queue) {
    var result_promise_list = [],
      i;

    function pushAndExecute(queue) {
      queue
        .push(function () {
          if (argument_list.length > 0) {
            var argument_array = argument_list.shift(),
              sub_queue = new RSVP.Queue();
            argument_array[0] = sub_queue;
            function_used.apply(context, argument_array);
            pushAndExecute(queue);
            return sub_queue;
          }
        });
    }
    for (i = 0; i < number_queue; i += 1) {
      result_promise_list.push(new RSVP.Queue());
      pushAndExecute(result_promise_list[i]);
    }
    if (number_queue > 1) {
      return RSVP.all(result_promise_list);
    }
    return result_promise_list[0];
  }

  function callAllDocsOnStorage(context, storage, cache, cache_key) {
    return new RSVP.Queue()
      .push(function () {
        if (!cache.hasOwnProperty(cache_key)) {
          return storage.allDocs(context._query_options)
            .push(function (result) {
              var i,
                cache_entry = {};
              for (i = 0; i < result.data.total_rows; i += 1) {
                cache_entry[result.data.rows[i].id] = result.data.rows[i].value;
              }
              cache[cache_key] = cache_entry;
            });
        }
      })
      .push(function () {
        return cache[cache_key];
      });
  }

  function propagateAttachmentDeletion(context, skip_attachment_dict,
                                       destination,
                                       id, name) {
    return destination.removeAttachment(id, name)
      .push(function () {
        return context._signature_sub_storage.removeAttachment(id, name);
      })
      .push(function () {
        skip_attachment_dict[name] = null;
      });
  }

  function propagateAttachmentModification(context, skip_attachment_dict,
                                           destination,
                                           blob, hash, id, name) {
    return destination.putAttachment(id, name, blob)
      .push(function () {
        return context._signature_sub_storage.putAttachment(id, name,
                                                            JSON.stringify({
            hash: hash
          }));
      })
      .push(function () {
        skip_attachment_dict[name] = null;
      });
  }

  function checkAndPropagateAttachment(context,
                                       skip_attachment_dict,
                                       status_hash, local_hash, blob,
                                       source, destination, id, name,
                                       conflict_force, conflict_revert,
                                       conflict_ignore) {
    var remote_blob;
    return destination.getAttachment(id, name)
      .push(function (result) {
        remote_blob = result;
        return jIO.util.readBlobAsArrayBuffer(remote_blob);
      })
      .push(function (evt) {
        return generateHashFromArrayBuffer(
          evt.target.result
        );
      }, function (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {
          remote_blob = null;
          return null;
        }
        throw error;
      })
      .push(function (remote_hash) {
        if (local_hash === remote_hash) {
          // Same modifications on both side
          if (local_hash === null) {
            // Deleted on both side, drop signature
            return context._signature_sub_storage.removeAttachment(id, name)
              .push(function () {
                skip_attachment_dict[name] = null;
              });
          }

          return context._signature_sub_storage.putAttachment(id, name,
            JSON.stringify({
              hash: local_hash
            }))
            .push(function () {
              skip_attachment_dict[name] = null;
            });
        }

        if ((remote_hash === status_hash) || (conflict_force === true)) {
          // Modified only locally. No conflict or force
          if (local_hash === null) {
            // Deleted locally
            return propagateAttachmentDeletion(context, skip_attachment_dict,
                                               destination,
                                               id, name);
          }
          return propagateAttachmentModification(context,
                                       skip_attachment_dict,
                                       destination, blob,
                                       local_hash, id, name);
        }

        // Conflict cases
        if (conflict_ignore === true) {
          return;
        }

        if ((conflict_revert === true) || (local_hash === null)) {
          // Automatically resolve conflict or force revert
          if (remote_hash === null) {
            // Deleted remotely
            return propagateAttachmentDeletion(context, skip_attachment_dict,
                                               source, id, name);
          }
          return propagateAttachmentModification(
            context,
            skip_attachment_dict,
            source,
            remote_blob,
            remote_hash,
            id,
            name
          );
        }

        // Minimize conflict if it can be resolved
        if (remote_hash === null) {
          // Copy remote modification remotely
          return propagateAttachmentModification(context,
                                       skip_attachment_dict,
                                       destination, blob,
                                       local_hash, id, name);
        }
        throw new jIO.util.jIOError("Conflict on '" + id +
                                    "' with attachment '" +
                                    name + "'",
                                    409);
      });
  }

  function checkAttachmentSignatureDifference(queue, context,
                                              skip_attachment_dict,
                                              source,
                                              destination, id, name,
                                              conflict_force,
                                              conflict_revert,
                                              conflict_ignore,
                                              is_creation, is_modification) {
    var blob,
      status_hash;
    queue
      .push(function () {
        // Optimisation to save a get call to signature storage
        if (is_creation === true) {
          return RSVP.all([
            source.getAttachment(id, name),
            {hash: null}
          ]);
        }
        if (is_modification === true) {
          return RSVP.all([
            source.getAttachment(id, name),
            context._signature_sub_storage.getAttachment(
              id,
              name,
              {format: 'json'}
            )
          ]);
        }
        throw new jIO.util.jIOError("Unexpected call of"
                                    + " checkAttachmentSignatureDifference",
                                    409);
      })
      .push(function (result_list) {
        blob = result_list[0];
        status_hash = result_list[1].hash;
        return jIO.util.readBlobAsArrayBuffer(blob);
      })
      .push(function (evt) {
        var array_buffer = evt.target.result,
          local_hash = generateHashFromArrayBuffer(array_buffer);

        if (local_hash !== status_hash) {
          return checkAndPropagateAttachment(context,
                                             skip_attachment_dict,
                                             status_hash, local_hash, blob,
                                             source, destination, id, name,
                                             conflict_force, conflict_revert,
                                             conflict_ignore);
        }
      });
  }

  function checkAttachmentLocalDeletion(queue, context,
                              skip_attachment_dict,
                              destination, id, name, source,
                              conflict_force, conflict_revert,
                              conflict_ignore) {
    var status_hash;
    queue
      .push(function () {
        return context._signature_sub_storage.getAttachment(id, name,
                                                            {format: 'json'});
      })
      .push(function (result) {
        status_hash = result.hash;
        return checkAndPropagateAttachment(context,
                                 skip_attachment_dict,
                                 status_hash, null, null,
                                 source, destination, id, name,
                                 conflict_force, conflict_revert,
                                 conflict_ignore);
      });
  }

  function pushDocumentAttachment(context,
                                  skip_attachment_dict, id, source,
                                  destination, signature_allAttachments,
                                  options) {
    var local_dict = {},
      signature_dict = {};
    return source.allAttachments(id)
      .push(undefined, function (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {
          return {};
        }
        throw error;
      })
      .push(function (source_allAttachments) {
        var is_modification,
          is_creation,
          key,
          argument_list = [];
        for (key in source_allAttachments) {
          if (source_allAttachments.hasOwnProperty(key)) {
            if (!skip_attachment_dict.hasOwnProperty(key)) {
              local_dict[key] = null;
            }
          }
        }
        for (key in signature_allAttachments) {
          if (signature_allAttachments.hasOwnProperty(key)) {
            if (!skip_attachment_dict.hasOwnProperty(key)) {
              signature_dict[key] = null;
            }
          }
        }

        for (key in local_dict) {
          if (local_dict.hasOwnProperty(key)) {
            is_modification = signature_dict.hasOwnProperty(key)
              && options.check_modification;
            is_creation = !signature_dict.hasOwnProperty(key)
              && options.check_creation;
            if (is_modification === true || is_creation === true) {
              argument_list.push([undefined,
                                  context,
                                  skip_attachment_dict,
                                  source,
                                  destination, id, key,
                                  options.conflict_force,
                                  options.conflict_revert,
                                  options.conflict_ignore,
                                  is_creation,
                                  is_modification]);
            }
          }
        }
        return dispatchQueue(
          context,
          checkAttachmentSignatureDifference,
          argument_list,
          context._parallel_operation_attachment_amount
        );
      })
      .push(function () {
        var key, argument_list = [];
        if (options.check_deletion === true) {
          for (key in signature_dict) {
            if (signature_dict.hasOwnProperty(key)) {
              if (!local_dict.hasOwnProperty(key)) {
                argument_list.push([undefined,
                                             context,
                                             skip_attachment_dict,
                                             destination, id, key,
                                             source,
                                             options.conflict_force,
                                             options.conflict_revert,
                                             options.conflict_ignore]);
              }
            }
          }
          return dispatchQueue(
            context,
            checkAttachmentLocalDeletion,
            argument_list,
            context._parallel_operation_attachment_amount
          );
        }
      });
  }

  function propagateFastAttachmentDeletion(queue, id, name, storage) {
    return queue
      .push(function () {
        return storage.removeAttachment(id, name);
      });
  }

  function propagateFastAttachmentModification(queue, id, key, source,
                                               destination, signature, hash) {
    return queue
      .push(function () {
        return signature.getAttachment(id, key, {format: 'json'})
          .push(undefined, function (error) {
            if ((error instanceof jIO.util.jIOError) &&
                (error.status_code === 404)) {
              return {hash: null};
            }
            throw error;
          })
          .push(function (result) {
            if (result.hash !== hash) {
              return source.getAttachment(id, key)
                .push(function (blob) {
                  return destination.putAttachment(id, key, blob);
                })
                .push(function () {
                  return signature.putAttachment(id, key, JSON.stringify({
                    hash: hash
                  }));
                });
            }
          });

      });
  }

  function repairFastDocumentAttachment(context, id,
                                        signature_hash,
                                        signature_attachment_hash,
                                        signature_from_local) {
    if (signature_hash === signature_attachment_hash) {
      // No replication to do
      return;
    }
    return new RSVP.Queue()
      .push(function () {
        return RSVP.all([
          context._signature_sub_storage.allAttachments(id),
          context._local_sub_storage.allAttachments(id),
          context._remote_sub_storage.allAttachments(id)
        ]);
      })
      .push(function (result_list) {
        var key,
          source_attachment_dict,
          destination_attachment_dict,
          source,
          destination,
          push_argument_list = [],
          delete_argument_list = [],
          signature_attachment_dict = result_list[0],
          local_attachment_dict = result_list[1],
          remote_attachment_list = result_list[2],
          check_local_modification =
            context._check_local_attachment_modification,
          check_local_creation = context._check_local_attachment_creation,
          check_local_deletion = context._check_local_attachment_deletion,
          check_remote_modification =
            context._check_remote_attachment_modification,
          check_remote_creation = context._check_remote_attachment_creation,
          check_remote_deletion = context._check_remote_attachment_deletion;

        if (signature_from_local) {
          source_attachment_dict = local_attachment_dict;
          destination_attachment_dict = remote_attachment_list;
          source = context._local_sub_storage;
          destination = context._remote_sub_storage;
        } else {
          source_attachment_dict = remote_attachment_list;
          destination_attachment_dict = local_attachment_dict;
          source = context._remote_sub_storage;
          destination = context._local_sub_storage;
          check_local_modification = check_remote_modification;
          check_local_creation = check_remote_creation;
          check_local_deletion = check_remote_deletion;
          check_remote_creation = check_local_creation;
          check_remote_deletion = check_local_deletion;
        }

        // Push all source attachments
        for (key in source_attachment_dict) {
          if (source_attachment_dict.hasOwnProperty(key)) {

            if ((check_local_creation &&
                 !signature_attachment_dict.hasOwnProperty(key)) ||
                (check_local_modification &&
                 signature_attachment_dict.hasOwnProperty(key))) {
              push_argument_list.push([
                undefined,
                id,
                key,
                source,
                destination,
                context._signature_sub_storage,
                signature_hash
              ]);
            }
          }
        }

        // Delete remaining signature + remote attachments
        for (key in signature_attachment_dict) {
          if (signature_attachment_dict.hasOwnProperty(key)) {
            if (check_local_deletion &&
                !source_attachment_dict.hasOwnProperty(key)) {
              delete_argument_list.push([
                undefined,
                id,
                key,
                context._signature_sub_storage
              ]);
            }
          }
        }
        for (key in destination_attachment_dict) {
          if (destination_attachment_dict.hasOwnProperty(key)) {
            if (!source_attachment_dict.hasOwnProperty(key)) {
              if ((check_local_deletion &&
                   signature_attachment_dict.hasOwnProperty(key)) ||
                  (check_remote_creation &&
                   !signature_attachment_dict.hasOwnProperty(key))) {
                delete_argument_list.push([
                  undefined,
                  id,
                  key,
                  destination
                ]);
              }
            }
          }
        }

        return RSVP.all([
          dispatchQueue(
            context,
            propagateFastAttachmentModification,
            push_argument_list,
            context._parallel_operation_attachment_amount
          ),
          dispatchQueue(
            context,
            propagateFastAttachmentDeletion,
            delete_argument_list,
            context._parallel_operation_attachment_amount
          )
        ]);
      })
      .push(function () {
        // Mark that all attachments have been synchronized
        return context._signature_sub_storage.put(id, {
          hash: signature_hash,
          attachment_hash: signature_hash,
          from_local: signature_from_local
        });
      });
  }

  function repairDocumentAttachment(context, id, signature_hash_key,
                                    signature_hash,
                                    signature_attachment_hash,
                                    signature_from_local) {
    if (signature_hash_key !== undefined) {
      return repairFastDocumentAttachment(context, id,
                                    signature_hash,
                                    signature_attachment_hash,
                                    signature_from_local);
    }

    var skip_attachment_dict = {};
    return new RSVP.Queue()
      .push(function () {
        if (context._check_local_attachment_modification ||
            context._check_local_attachment_creation ||
            context._check_local_attachment_deletion ||
            context._check_remote_attachment_modification ||
            context._check_remote_attachment_creation ||
            context._check_remote_attachment_deletion) {
          return context._signature_sub_storage.allAttachments(id);
        }
        return {};
      })
      .push(undefined, function (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {
          return {};
        }
        throw error;
      })
      .push(function (signature_allAttachments) {
        if (context._check_local_attachment_modification ||
            context._check_local_attachment_creation ||
            context._check_local_attachment_deletion) {
          return pushDocumentAttachment(
            context,
            skip_attachment_dict,
            id,
            context._local_sub_storage,
            context._remote_sub_storage,
            signature_allAttachments,
            {
              conflict_force: (context._conflict_handling ===
                               CONFLICT_KEEP_LOCAL),
              conflict_revert: (context._conflict_handling ===
                                CONFLICT_KEEP_REMOTE),
              conflict_ignore: (context._conflict_handling ===
                                CONFLICT_CONTINUE),
              check_modification:
                context._check_local_attachment_modification,
              check_creation: context._check_local_attachment_creation,
              check_deletion: context._check_local_attachment_deletion
            }
          )
            .push(function () {
              return signature_allAttachments;
            });
        }
        return signature_allAttachments;
      })
      .push(function (signature_allAttachments) {
        if (context._check_remote_attachment_modification ||
            context._check_remote_attachment_creation ||
            context._check_remote_attachment_deletion) {
          return pushDocumentAttachment(
            context,
            skip_attachment_dict,
            id,
            context._remote_sub_storage,
            context._local_sub_storage,
            signature_allAttachments,
            {
              use_revert_post: context._use_remote_post,
              conflict_force: (context._conflict_handling ===
                               CONFLICT_KEEP_REMOTE),
              conflict_revert: (context._conflict_handling ===
                                CONFLICT_KEEP_LOCAL),
              conflict_ignore: (context._conflict_handling ===
                                CONFLICT_CONTINUE),
              check_modification:
                context._check_remote_attachment_modification,
              check_creation: context._check_remote_attachment_creation,
              check_deletion: context._check_remote_attachment_deletion
            }
          );
        }
      });
  }

  function propagateModification(context, source, destination, doc, hash, id,
                                 skip_document_dict,
                                 skip_deleted_document_dict,
                                 options) {
    var result = new RSVP.Queue(),
      post_id,
      to_skip = true,
      from_local;
    if (options === undefined) {
      options = {};
    }
    from_local = options.from_local;

    if (doc === null) {
      result
        .push(function () {
          return source.get(id);
        })
        .push(function (source_doc) {
          doc = source_doc;
        }, function (error) {
          if ((error instanceof jIO.util.jIOError) &&
              (error.status_code === 404)) {
            throw new SkipError(id);
          }
          throw error;
        });
    }
    if (options.use_post) {
      result
        .push(function () {
          return destination.post(doc);
        })
        .push(function (new_id) {
          to_skip = false;
          post_id = new_id;
          return source.put(post_id, doc);
        })
        .push(function () {
          // Copy all attachments
          // This is not related to attachment replication
          // It's just about not losing user data
          return source.allAttachments(id);
        })
        .push(function (attachment_dict) {
          var key,
            copy_queue = new RSVP.Queue();

          function copyAttachment(name) {
            copy_queue
              .push(function () {
                return source.getAttachment(id, name);
              })
              .push(function (blob) {
                return source.putAttachment(post_id, name, blob);
              });
          }

          for (key in attachment_dict) {
            if (attachment_dict.hasOwnProperty(key)) {
              copyAttachment(key);
            }
          }
          return copy_queue;
        })
        .push(function () {
          return source.remove(id);
        })
        .push(function () {
          return context._signature_sub_storage.remove(id);
        })
        .push(function () {
          to_skip = true;
          return context._signature_sub_storage.put(post_id, {
            hash: hash,
            from_local: from_local
          });
        })
        .push(function () {
          skip_document_dict[post_id] = null;
        });
    } else {
      result
        .push(function () {
          // Drop signature if the destination document was empty
          // but a signature exists
          if (options.create_new_document === true) {
            delete skip_deleted_document_dict[id];
            return context._signature_sub_storage.remove(id);
          }
        })
        .push(function () {
          return destination.put(id, doc);
        })
        .push(function () {
          return context._signature_sub_storage.put(id, {
            hash: hash,
            from_local: from_local
          });
        });
    }
    return result
      .push(function () {
        if (to_skip) {
          skip_document_dict[id] = null;
        }
      })
      .push(undefined, function (error) {
        if (error instanceof SkipError) {
          return;
        }
        throw error;
      });
  }

  function propagateDeletion(context, destination, id, skip_document_dict,
                             skip_deleted_document_dict) {
    // Do not delete a document if it has an attachment
    // ie, replication should prevent losing user data
    // Synchronize attachments before, to ensure
    // all of them will be deleted too
    var result;
    if (context._signature_hash_key !== undefined) {
      result = destination.remove(id)
        .push(function () {
          return context._signature_sub_storage.remove(id);
        });
    } else {
      result = repairDocumentAttachment(context, id)
        .push(function () {
          return destination.allAttachments(id);
        })
        .push(function (attachment_dict) {
          if (JSON.stringify(attachment_dict) === "{}") {
            return destination.remove(id)
              .push(function () {
                return context._signature_sub_storage.remove(id);
              });
          }
        }, function (error) {
          if ((error instanceof jIO.util.jIOError) &&
              (error.status_code === 404)) {
            return;
          }
          throw error;
        });
    }
    return result
      .push(function () {
        skip_document_dict[id] = null;
        // No need to sync attachment twice on this document
        skip_deleted_document_dict[id] = null;
      });
  }

  function checkAndPropagate(context, skip_document_dict,
                             skip_deleted_document_dict,
                             cache, destination_key,
                             status_hash, local_hash, doc,
                             source, destination, id,
                             conflict_force, conflict_revert,
                             conflict_ignore,
                             options) {
    var from_local = options.from_local;
    return new RSVP.Queue()
      .push(function () {
        if (options.signature_hash_key !== undefined) {
          return callAllDocsOnStorage(context, destination,
                                      cache, destination_key)
            .push(function (result) {
              if (result.hasOwnProperty(id)) {
                return [null, result[id][options.signature_hash_key]];
              }
              return [null, null];
            });
        }
        return destination.get(id)
          .push(function (remote_doc) {
            return [remote_doc, generateHash(stringify(remote_doc))];
          }, function (error) {
            if ((error instanceof jIO.util.jIOError) &&
                (error.status_code === 404)) {
              return [null, null];
            }
            throw error;
          });
      })

      .push(function (remote_list) {
        var remote_doc = remote_list[0],
          remote_hash = remote_list[1];
        if (local_hash === remote_hash) {
          // Same modifications on both side
          if (local_hash === null) {
            // Deleted on both side, drop signature
            return context._signature_sub_storage.remove(id)
              .push(function () {
                skip_document_dict[id] = null;
              });
          }

          return context._signature_sub_storage.put(id, {
            hash: local_hash,
            from_local: from_local
          })
            .push(function () {
              skip_document_dict[id] = null;
            });
        }

        if ((remote_hash === status_hash) || (conflict_force === true)) {
          // Modified only locally. No conflict or force
          if (local_hash === null) {
            // Deleted locally
            return propagateDeletion(context, destination, id,
                                     skip_document_dict,
                                     skip_deleted_document_dict);
          }
          return propagateModification(context, source, destination, doc,
                                       local_hash, id, skip_document_dict,
                                       skip_deleted_document_dict,
                                       {use_post: ((options.use_post) &&
                                                   (remote_hash === null)),
                                        from_local: from_local,
                                        create_new_document:
                                          ((remote_hash === null) &&
                                           (status_hash !== null))
                                        });
        }

        // Conflict cases
        if (conflict_ignore === true) {
          return;
        }

        if ((conflict_revert === true) || (local_hash === null)) {
          // Automatically resolve conflict or force revert
          if (remote_hash === null) {
            // Deleted remotely
            return propagateDeletion(context, source, id, skip_document_dict,
                                     skip_deleted_document_dict);
          }
          return propagateModification(
            context,
            destination,
            source,
            remote_doc,
            remote_hash,
            id,
            skip_document_dict,
            skip_deleted_document_dict,
            {use_post: ((options.use_revert_post) &&
                        (local_hash === null)),
              from_local: !from_local,
              create_new_document: ((local_hash === null) &&
                                    (status_hash !== null))}
          );
        }

        // Minimize conflict if it can be resolved
        if (remote_hash === null) {
          // Copy remote modification remotely
          return propagateModification(context, source, destination, doc,
                                       local_hash, id, skip_document_dict,
                                       skip_deleted_document_dict,
                                       {use_post: options.use_post,
                                        from_local: from_local,
                                        create_new_document:
                                          (status_hash !== null)});
        }
        doc = doc || local_hash;
        remote_doc = remote_doc || remote_hash;
        throw new jIO.util.jIOError("Conflict on '" + id + "': " +
                                    stringify(doc) + " !== " +
                                    stringify(remote_doc),
                                    409);
      });
  }

  function checkLocalDeletion(queue, context, skip_document_dict,
                              skip_deleted_document_dict,
                              cache, destination_key,
                              destination, id, source,
                              conflict_force, conflict_revert,
                              conflict_ignore, options) {
    var status_hash;
    queue
      .push(function () {
        return context._signature_sub_storage.get(id);
      })
      .push(function (result) {
        status_hash = result.hash;
        return checkAndPropagate(context, skip_document_dict,
                                 skip_deleted_document_dict,
                                 cache, destination_key,
                                 status_hash, null, null,
                                 source, destination, id,
                                 conflict_force, conflict_revert,
                                 conflict_ignore,
                                 options);
      });
  }

  function checkSignatureDifference(queue, context, skip_document_dict,
                                    skip_deleted_document_dict,
                                    cache, destination_key,
                                    source, destination, id,
                                    conflict_force, conflict_revert,
                                    conflict_ignore,
                                    local_hash, status_hash,
                                    options) {
    queue
      .push(function () {
        if (local_hash === null) {
          // Hash was not provided by the allDocs query
          return source.get(id);
        }
        return null;
      })
      .push(function (doc) {
        if (local_hash === null) {
          // Hash was not provided by the allDocs query
          local_hash = generateHash(stringify(doc));
        }

        if (local_hash !== status_hash) {
          return checkAndPropagate(context, skip_document_dict,
                                   skip_deleted_document_dict,
                                   cache, destination_key,
                                   status_hash, local_hash, doc,
                                   source, destination, id,
                                   conflict_force, conflict_revert,
                                   conflict_ignore,
                                   options);
        }
      });
  }

  function pushStorage(context, skip_document_dict,
                       skip_deleted_document_dict,
                       cache, source_key, destination_key,
                       source, destination, signature_allDocs, options) {
    var argument_list = [],
      argument_list_deletion = [];
    if (!options.hasOwnProperty("use_post")) {
      options.use_post = false;
    }
    if (!options.hasOwnProperty("use_revert_post")) {
      options.use_revert_post = false;
    }
    return callAllDocsOnStorage(context, source, cache, source_key)
      .push(function (source_allDocs) {
        var i,
          local_dict = {},
          signature_dict = {},
          is_modification,
          is_creation,
          status_hash,
          local_hash,
          key,
          queue = new RSVP.Queue();
        for (key in source_allDocs) {
          if (source_allDocs.hasOwnProperty(key)) {
            if (!skip_document_dict.hasOwnProperty(key)) {
              local_dict[key] = source_allDocs[key];
            }
          }
        }
        /*
        for (i = 0; i < source_allDocs.data.total_rows; i += 1) {
          if (!skip_document_dict.hasOwnProperty(
              source_allDocs.data.rows[i].id
            )) {
            local_dict[source_allDocs.data.rows[i].id] =
              source_allDocs.data.rows[i].value;
          }
        }
        */
        for (i = 0; i < signature_allDocs.data.total_rows; i += 1) {
          if (!skip_document_dict.hasOwnProperty(
              signature_allDocs.data.rows[i].id
            )) {
            signature_dict[signature_allDocs.data.rows[i].id] =
              signature_allDocs.data.rows[i].value.hash;
          }
        }
        for (key in local_dict) {
          if (local_dict.hasOwnProperty(key)) {
            is_modification = signature_dict.hasOwnProperty(key)
              && options.check_modification;
            is_creation = !signature_dict.hasOwnProperty(key)
              && options.check_creation;

            if (is_creation === true) {
              status_hash = null;
            } else if (is_modification === true) {
              status_hash = signature_dict[key];
            }

            local_hash = null;
            if (options.signature_hash_key !== undefined) {
              local_hash = local_dict[key][options.signature_hash_key];
              if (is_modification === true) {
                // Bypass fetching all documents and calculating the sha
                // Compare the select list values returned by allDocs calls
                is_modification = false;
                if (local_hash !== status_hash) {
                  is_modification = true;
                }
              }
            }

            if (is_modification === true || is_creation === true) {
              argument_list.push([undefined, context, skip_document_dict,
                                  skip_deleted_document_dict,
                                  cache, destination_key,
                                  source, destination,
                                  key,
                                  options.conflict_force,
                                  options.conflict_revert,
                                  options.conflict_ignore,
                                  local_hash, status_hash,
                                  options]);
            }
          }
        }
        queue
          .push(function () {
            return dispatchQueue(
              context,
              checkSignatureDifference,
              argument_list,
              options.operation_amount
            );
          });
        for (key in signature_dict) {
          if (signature_dict.hasOwnProperty(key)) {
            if (!local_dict.hasOwnProperty(key)) {
              if (options.check_deletion === true) {
                argument_list_deletion.push([undefined,
                                             context,
                                             skip_document_dict,
                                             skip_deleted_document_dict,
                                             cache, destination_key,
                                             destination, key,
                                             source,
                                             options.conflict_force,
                                             options.conflict_revert,
                                             options.conflict_ignore,
                                             options]);
              } else {
                skip_deleted_document_dict[key] = null;
              }
            }
          }
        }
        if (argument_list_deletion.length !== 0) {
          queue.push(function () {
            return dispatchQueue(
              context,
              checkLocalDeletion,
              argument_list_deletion,
              options.operation_amount
            );
          });
        }
        return queue;
      });
  }

  function repairDocument(queue, context, id, signature_hash_key,
                          signature_hash, signature_attachment_hash,
                          signature_from_local) {
    queue.push(function () {
      return repairDocumentAttachment(context, id, signature_hash_key,
                                      signature_hash,
                                      signature_attachment_hash,
                                      signature_from_local);
    });
  }

  ReplicateStorage.prototype.repair = function () {
    var context = this,
      argument_list = arguments,
      skip_document_dict = {},
      skip_deleted_document_dict = {},
      cache = {};

    return new RSVP.Queue()
      .push(function () {
        // Ensure that the document storage is usable
        if (context._custom_signature_sub_storage === false) {
          // Do not sync the signature document
          skip_document_dict[context._signature_hash] = null;

          return context._signature_sub_storage.__storage._sub_storage
                                               .__storage._sub_storage.get(
              context._signature_hash
            );
        }
      })
      .push(undefined, function (error) {
        if ((error instanceof jIO.util.jIOError) &&
            (error.status_code === 404)) {
          return context._signature_sub_storage.__storage._sub_storage
                                               .__storage._sub_storage.put(
              context._signature_hash,
              {}
            );
        }
        throw error;
      })

      .push(function () {
        return RSVP.all([
// Don't repair local_sub_storage twice
//           context._signature_sub_storage.repair.apply(
//             context._signature_sub_storage,
//             argument_list
//           ),
          context._local_sub_storage.repair.apply(
            context._local_sub_storage,
            argument_list
          ),
          context._remote_sub_storage.repair.apply(
            context._remote_sub_storage,
            argument_list
          )
        ]);
      })

      .push(function () {
        if (context._check_local_modification ||
            context._check_local_creation ||
            context._check_local_deletion ||
            context._check_remote_modification ||
            context._check_remote_creation ||
            context._check_remote_deletion) {
          return context._signature_sub_storage.allDocs({
            select_list: ['hash']
          });
        }
      })

      .push(function (signature_allDocs) {
        if (context._check_local_modification ||
            context._check_local_creation ||
            context._check_local_deletion) {
          return pushStorage(context, skip_document_dict,
                             skip_deleted_document_dict,
                             cache, 'local', 'remote',
                             context._local_sub_storage,
                             context._remote_sub_storage,
                             signature_allDocs,
                             {
              use_post: context._use_remote_post,
              conflict_force: (context._conflict_handling ===
                               CONFLICT_KEEP_LOCAL),
              conflict_revert: (context._conflict_handling ===
                                CONFLICT_KEEP_REMOTE),
              conflict_ignore: (context._conflict_handling ===
                                CONFLICT_CONTINUE),
              check_modification: context._check_local_modification,
              check_creation: context._check_local_creation,
              check_deletion: context._check_local_deletion,
              operation_amount: context._parallel_operation_amount,
              signature_hash_key: context._signature_hash_key,
              from_local: true
            })
              .push(function () {
              return signature_allDocs;
            });
        }
        return signature_allDocs;
      })
      .push(function (signature_allDocs) {
        if (context._check_remote_modification ||
            context._check_remote_creation ||
            context._check_remote_deletion) {
          return pushStorage(context, skip_document_dict,
                             skip_deleted_document_dict,
                             cache, 'remote', 'local',
                             context._remote_sub_storage,
                             context._local_sub_storage,
                             signature_allDocs, {
              use_revert_post: context._use_remote_post,
              conflict_force: (context._conflict_handling ===
                               CONFLICT_KEEP_REMOTE),
              conflict_revert: (context._conflict_handling ===
                                CONFLICT_KEEP_LOCAL),
              conflict_ignore: (context._conflict_handling ===
                                CONFLICT_CONTINUE),
              check_modification: context._check_remote_modification,
              check_creation: context._check_remote_creation,
              check_deletion: context._check_remote_deletion,
              operation_amount: context._parallel_operation_amount,
              signature_hash_key: context._signature_hash_key,
              from_local: false
            });
        }
      })
      .push(function () {
        if (context._check_local_attachment_modification ||
            context._check_local_attachment_creation ||
            context._check_local_attachment_deletion ||
            context._check_remote_attachment_modification ||
            context._check_remote_attachment_creation ||
            context._check_remote_attachment_deletion) {
          // Attachments are synchronized if and only if their parent document
          // has been also marked as synchronized.
          return context._signature_sub_storage.allDocs({
            select_list: ['hash', 'attachment_hash', 'from_local']
          })
            .push(function (result) {
              var i,
                local_argument_list = [],
                row,
                len = result.data.total_rows;

              for (i = 0; i < len; i += 1) {
                row = result.data.rows[i];
                // Do not synchronize attachment if one version of the document
                // is deleted but not pushed to the other storage
                if (!skip_deleted_document_dict.hasOwnProperty(row.id)) {
                  local_argument_list.push(
                    [undefined, context, row.id, context._signature_hash_key,
                      row.value.hash, row.value.attachment_hash,
                      row.value.from_local]
                  );
                }
              }
              return dispatchQueue(
                context,
                repairDocument,
                local_argument_list,
                context._parallel_operation_amount
              );
            });
        }
      });
  };

  jIO.addStorage('replicate', ReplicateStorage);

}(jIO, RSVP, Rusha, jIO.util.stringify));
/*
 * Copyright 2015, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
/*jslint nomen: true*/
(function (jIO) {
  "use strict";

  /**
   * The jIO UUIDStorage extension
   *
   * @class UUIDStorage
   * @constructor
   */
  function UUIDStorage(spec) {
    this._sub_storage = jIO.createJIO(spec.sub_storage);
  }

  UUIDStorage.prototype.get = function () {
    return this._sub_storage.get.apply(this._sub_storage, arguments);
  };
  UUIDStorage.prototype.allAttachments = function () {
    return this._sub_storage.allAttachments.apply(this._sub_storage, arguments);
  };
  UUIDStorage.prototype.post = function (param) {

    function S4() {
      return ('0000' + Math.floor(
        Math.random() * 0x10000 /* 65536 */
      ).toString(16)).slice(-4);
    }

    var id = S4() + S4() + "-" +
      S4() + "-" +
      S4() + "-" +
      S4() + "-" +
      S4() + S4() + S4();

    return this.put(id, param);
  };
  UUIDStorage.prototype.put = function () {
    return this._sub_storage.put.apply(this._sub_storage, arguments);
  };
  UUIDStorage.prototype.remove = function () {
    return this._sub_storage.remove.apply(this._sub_storage, arguments);
  };
  UUIDStorage.prototype.getAttachment = function () {
    return this._sub_storage.getAttachment.apply(this._sub_storage, arguments);
  };
  UUIDStorage.prototype.putAttachment = function () {
    return this._sub_storage.putAttachment.apply(this._sub_storage, arguments);
  };
  UUIDStorage.prototype.removeAttachment = function () {
    return this._sub_storage.removeAttachment.apply(this._sub_storage,
                                                    arguments);
  };
  UUIDStorage.prototype.repair = function () {
    return this._sub_storage.repair.apply(this._sub_storage, arguments);
  };
  UUIDStorage.prototype.hasCapacity = function (name) {
    return this._sub_storage.hasCapacity(name);
  };
  UUIDStorage.prototype.buildQuery = function () {
    return this._sub_storage.buildQuery.apply(this._sub_storage,
                                              arguments);
  };

  jIO.addStorage('uuid', UUIDStorage);

}(jIO));

  module.exports = window;

}({}));
