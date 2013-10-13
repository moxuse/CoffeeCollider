define(function(require, exports, module) {
  "use strict";

  var unit = require("./unit");
  var BINARY_OP_UGEN_MAP = require("../ugen/basic_ops").BINARY_OP_UGEN_MAP;

  var AA = C.AUDIO   * 10 + C.AUDIO;
  var AK = C.AUDIO   * 10 + C.CONTROL;
  var AI = C.AUDIO   * 10 + C.SCALAR;
  var KA = C.CONTROL * 10 + C.AUDIO;
  var KK = C.CONTROL * 10 + C.CONTROL;
  var KI = C.CONTROL * 10 + C.SCALAR;
  var IA = C.SCALAR  * 10 + C.AUDIO;
  var IK = C.SCALAR  * 10 + C.CONTROL;
  var II = C.SCALAR  * 10 + C.SCALAR;

  var calcFunc = {};
  
  var BinaryOpUGen = function() {
    var ctor = function() {
      var func = calcFunc[BINARY_OP_UGEN_MAP[this.specialIndex]];
      var process;
      if (func) {
        switch (this.inRates[0] * 10 + this.inRates[1]) {
        case AA: process = func.aa; break;
        case AK: process = func.ak; break;
        case AI: process = func.ai; break;
        case KA: process = func.ka; break;
        case KK: process = func.kk; break;
        case KI: process = func.ki; break;
        case IA: process = func.ia; break;
        case IK: process = func.ik; break;
        case II: process = func.ii; break;
        }
        this.process = process;
        this._a = this.inputs[0][0];
        this._b = this.inputs[1][0];
        if (this.process) {
          this.process(1);
        } else {
          this.outs[0][0] = func(this.inputs[0][0], this.inputs[1][0]);
        }
      } else {
        console.log("BinaryOpUGen[" + this.specialIndex + "] is not defined.");
      }
    };
    return ctor;
  };

  var aa = function(func) {
    return function(inNumSamples) {
      inNumSamples = inNumSamples|0;
      var out = this.outs[0];
      var aIn = this.inputs[0], bIn = this.inputs[1];
      for (var i = 0; i < inNumSamples; i += 8) {
        out[i  ] = func(aIn[i  ], bIn[i  ]); out[i+1] = func(aIn[i+1], bIn[i+1]);
        out[i+2] = func(aIn[i+2], bIn[i+2]); out[i+3] = func(aIn[i+3], bIn[i+3]);
        out[i+4] = func(aIn[i+4], bIn[i+4]); out[i+5] = func(aIn[i+5], bIn[i+5]);
        out[i+6] = func(aIn[i+6], bIn[i+6]); out[i+7] = func(aIn[i+7], bIn[i+7]);
      }
    };
  };
  var ak = function(func) {
    return function(inNumSamples) {
      inNumSamples = inNumSamples|0;
      var outs = this.outs[0];
      var aIn  = this.inputs[0], b = this._b;
      var nextB  = this.inputs[1][0];
      var b_slope = (nextB - this._b) * this.rate.slopeFactor;
      for (var i = 0; i < inNumSamples; i += 8) {
        outs[i  ] = func(aIn[i  ], b); b += b_slope;
        outs[i+1] = func(aIn[i+1], b); b += b_slope;
        outs[i+2] = func(aIn[i+2], b); b += b_slope;
        outs[i+3] = func(aIn[i+3], b); b += b_slope;
        outs[i+4] = func(aIn[i+4], b); b += b_slope;
        outs[i+5] = func(aIn[i+5], b); b += b_slope;
        outs[i+6] = func(aIn[i+6], b); b += b_slope;
        outs[i+7] = func(aIn[i+7], b); b += b_slope;
      }
      this._b = nextB;
    };
  };
  var ai = function(func) {
    return function(inNumSamples) {
      inNumSamples = inNumSamples|0;
      var outs = this.outs[0];
      var aIn = this.inputs[0], b = this._b;
      for (var i = 0; i < inNumSamples; i += 8) {
        outs[i  ] = func(aIn[i  ], b);
        outs[i+1] = func(aIn[i+1], b);
        outs[i+2] = func(aIn[i+2], b);
        outs[i+3] = func(aIn[i+3], b);
        outs[i+4] = func(aIn[i+4], b);
        outs[i+5] = func(aIn[i+5], b);
        outs[i+6] = func(aIn[i+6], b);
        outs[i+7] = func(aIn[i+7], b);
      }
    };
  };
  var ka = function(func) {
    return function(inNumSamples) {
      inNumSamples = inNumSamples|0;
      var outs = this.outs[0];
      var a = this._a, bIn = this.inputs[1];
      var nextA  = this.inputs[0][0];
      var a_slope = (nextA - this._a) * this.rate.slopeFactor;
      for (var i = 0; i < inNumSamples; i += 8) {
        outs[i  ] = func(a, bIn[i  ]); a += a_slope;
        outs[i+1] = func(a, bIn[i+1]); a += a_slope;
        outs[i+2] = func(a, bIn[i+2]); a += a_slope;
        outs[i+3] = func(a, bIn[i+3]); a += a_slope;
        outs[i+4] = func(a, bIn[i+4]); a += a_slope;
        outs[i+5] = func(a, bIn[i+5]); a += a_slope;
        outs[i+6] = func(a, bIn[i+6]); a += a_slope;
        outs[i+7] = func(a, bIn[i+7]); a += a_slope;
      }
      this._a = nextA;
    };
  };
  var kk = function(func) {
    return function() {
      this.outs[0][0] = func(this.inputs[0][0], this.inputs[1][0]);
    };
  };
  var ia = function(func) {
    return function(inNumSamples) {
      inNumSamples = inNumSamples|0;
      var outs = this.outs[0];
      var a = this._a, bIn = this.inputs[1];
      for (var i = 0; i < inNumSamples; i += 8) {
        outs[i  ] = func(a, bIn[i  ]);
        outs[i+1] = func(a, bIn[i+1]);
        outs[i+2] = func(a, bIn[i+2]);
        outs[i+3] = func(a, bIn[i+3]);
        outs[i+4] = func(a, bIn[i+4]);
        outs[i+5] = func(a, bIn[i+5]);
        outs[i+6] = func(a, bIn[i+6]);
        outs[i+7] = func(a, bIn[i+7]);
      }
    };
  };

  calcFunc["+"] = function(a, b) {
    return a + b;
  };
  calcFunc["+"].aa = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn = this.inputs[0], bIn = this.inputs[1];
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] + bIn[i  ];
      out[i+1] = aIn[i+1] + bIn[i+1];
      out[i+2] = aIn[i+2] + bIn[i+2];
      out[i+3] = aIn[i+3] + bIn[i+3];
      out[i+4] = aIn[i+4] + bIn[i+4];
      out[i+5] = aIn[i+5] + bIn[i+5];
      out[i+6] = aIn[i+6] + bIn[i+6];
      out[i+7] = aIn[i+7] + bIn[i+7];
    }
  };
  calcFunc["+"].ak = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn  = this.inputs[0], b = this._b;
    var nextB  = this.inputs[1][0];
    var b_slope = (nextB - this._b) * this.rate.slopeFactor;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] + b; b += b_slope;
      out[i+1] = aIn[i+1] + b; b += b_slope;
      out[i+2] = aIn[i+2] + b; b += b_slope;
      out[i+3] = aIn[i+3] + b; b += b_slope;
      out[i+4] = aIn[i+4] + b; b += b_slope;
      out[i+5] = aIn[i+5] + b; b += b_slope;
      out[i+6] = aIn[i+6] + b; b += b_slope;
      out[i+7] = aIn[i+7] + b; b += b_slope;
    }
    this._b = nextB;
  };
  calcFunc["+"].ai = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn  = this.inputs[0], b = this._b;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] + b;
      out[i+1] = aIn[i+1] + b;
      out[i+2] = aIn[i+2] + b;
      out[i+3] = aIn[i+3] + b;
      out[i+4] = aIn[i+4] + b;
      out[i+5] = aIn[i+5] + b;
      out[i+6] = aIn[i+6] + b;
      out[i+7] = aIn[i+7] + b;
    }
  };
  calcFunc["+"].ka = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var a = this._a, bIn = this.inputs[1];
    var nextA  = this.inputs[0][0];
    var a_slope = (nextA - this._a) * this.rate.slopeFactor;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = a + bIn[i  ]; a += a_slope;
      out[i+1] = a + bIn[i+1]; a += a_slope;
      out[i+2] = a + bIn[i+2]; a += a_slope;
      out[i+3] = a + bIn[i+3]; a += a_slope;
      out[i+4] = a + bIn[i+4]; a += a_slope;
      out[i+5] = a + bIn[i+5]; a += a_slope;
      out[i+6] = a + bIn[i+6]; a += a_slope;
      out[i+7] = a + bIn[i+7]; a += a_slope;
    }
    this._a = nextA;
  };
  calcFunc["+"].kk = function() {
    this.outs[0][0] = this.inputs[0][0] + this.inputs[1][0];
  };
  calcFunc["+"].ia = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var a = this._a, bIn = this.inputs[1];
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = a + bIn[i  ];
      out[i+1] = a + bIn[i+1];
      out[i+2] = a + bIn[i+2];
      out[i+3] = a + bIn[i+3];
      out[i+4] = a + bIn[i+4];
      out[i+5] = a + bIn[i+5];
      out[i+6] = a + bIn[i+6];
      out[i+7] = a + bIn[i+7];
    }
  };
  
  calcFunc["-"] = function(a, b) {
    return a - b;
  };
  calcFunc["-"].aa = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn = this.inputs[0], bIn = this.inputs[1];
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] - bIn[i  ];
      out[i+1] = aIn[i+1] - bIn[i+1];
      out[i+2] = aIn[i+2] - bIn[i+2];
      out[i+3] = aIn[i+3] - bIn[i+3];
      out[i+4] = aIn[i+4] - bIn[i+4];
      out[i+5] = aIn[i+5] - bIn[i+5];
      out[i+6] = aIn[i+6] - bIn[i+6];
      out[i+7] = aIn[i+7] - bIn[i+7];
    }
  };
  calcFunc["-"].ak = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn  = this.inputs[0], b = this._b;
    var nextB  = this.inputs[1][0];
    var b_slope = (nextB - this._b) * this.rate.slopeFactor;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] - b; b += b_slope;
      out[i+1] = aIn[i+1] - b; b += b_slope;
      out[i+2] = aIn[i+2] - b; b += b_slope;
      out[i+3] = aIn[i+3] - b; b += b_slope;
      out[i+4] = aIn[i+4] - b; b += b_slope;
      out[i+5] = aIn[i+5] - b; b += b_slope;
      out[i+6] = aIn[i+6] - b; b += b_slope;
      out[i+7] = aIn[i+7] - b; b += b_slope;
    }
    this._b = nextB;
  };
  calcFunc["-"].ai = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn  = this.inputs[0], b = this._b;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] - b;
      out[i+1] = aIn[i+1] - b;
      out[i+2] = aIn[i+2] - b;
      out[i+3] = aIn[i+3] - b;
      out[i+4] = aIn[i+4] - b;
      out[i+5] = aIn[i+5] - b;
      out[i+6] = aIn[i+6] - b;
      out[i+7] = aIn[i+7] - b;
    }
  };
  calcFunc["-"].ka = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var a = this._a, bIn = this.inputs[1];
    var nextA  = this.inputs[0][0];
    var a_slope = (nextA - this._a) * this.rate.slopeFactor;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = a - bIn[i  ]; a += a_slope;
      out[i+1] = a - bIn[i+1]; a += a_slope;
      out[i+2] = a - bIn[i+2]; a += a_slope;
      out[i+3] = a - bIn[i+3]; a += a_slope;
      out[i+4] = a - bIn[i+4]; a += a_slope;
      out[i+5] = a - bIn[i+5]; a += a_slope;
      out[i+6] = a - bIn[i+6]; a += a_slope;
      out[i+7] = a - bIn[i+7]; a += a_slope;
    }
    this._a = nextA;
  };
  calcFunc["-"].kk = function() {
    this.outs[0][0] = this.inputs[0][0] - this.inputs[1][0];
  };
  calcFunc["-"].ia = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var a = this._a, bIn = this.inputs[1];
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = a - bIn[i  ];
      out[i+1] = a - bIn[i+1];
      out[i+2] = a - bIn[i+2];
      out[i+3] = a - bIn[i+3];
      out[i+4] = a - bIn[i+4];
      out[i+5] = a - bIn[i+5];
      out[i+6] = a - bIn[i+6];
      out[i+7] = a - bIn[i+7];
    }
  };

  calcFunc["*"] = function(a, b) {
    return a * b;
  };
  calcFunc["*"].aa = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn = this.inputs[0], bIn = this.inputs[1];
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] * bIn[i  ];
      out[i+1] = aIn[i+1] * bIn[i+1];
      out[i+2] = aIn[i+2] * bIn[i+2];
      out[i+3] = aIn[i+3] * bIn[i+3];
      out[i+4] = aIn[i+4] * bIn[i+4];
      out[i+5] = aIn[i+5] * bIn[i+5];
      out[i+6] = aIn[i+6] * bIn[i+6];
      out[i+7] = aIn[i+7] * bIn[i+7];
    }
  };
  calcFunc["*"].ak = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn  = this.inputs[0], b = this._b;
    var nextB  = this.inputs[1][0];
    var b_slope = (nextB - this._b) * this.rate.slopeFactor;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] * b; b += b_slope;
      out[i+1] = aIn[i+1] * b; b += b_slope;
      out[i+2] = aIn[i+2] * b; b += b_slope;
      out[i+3] = aIn[i+3] * b; b += b_slope;
      out[i+4] = aIn[i+4] * b; b += b_slope;
      out[i+5] = aIn[i+5] * b; b += b_slope;
      out[i+6] = aIn[i+6] * b; b += b_slope;
      out[i+7] = aIn[i+7] * b; b += b_slope;
    }
    this._b = nextB;
  };
  calcFunc["*"].ai = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var aIn  = this.inputs[0], b = this._b;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = aIn[i  ] * b;
      out[i+1] = aIn[i+1] * b;
      out[i+2] = aIn[i+2] * b;
      out[i+3] = aIn[i+3] * b;
      out[i+4] = aIn[i+4] * b;
      out[i+5] = aIn[i+5] * b;
      out[i+6] = aIn[i+6] * b;
      out[i+7] = aIn[i+7] * b;
    }
  };
  calcFunc["*"].ka = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var a = this._a, bIn = this.inputs[1];
    var nextA  = this.inputs[0][0];
    var a_slope = (nextA - this._a) * this.rate.slopeFactor;
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = a * bIn[i  ]; a += a_slope;
      out[i+1] = a * bIn[i+1]; a += a_slope;
      out[i+2] = a * bIn[i+2]; a += a_slope;
      out[i+3] = a * bIn[i+3]; a += a_slope;
      out[i+4] = a * bIn[i+4]; a += a_slope;
      out[i+5] = a * bIn[i+5]; a += a_slope;
      out[i+6] = a * bIn[i+6]; a += a_slope;
      out[i+7] = a * bIn[i+7]; a += a_slope;
    }
    this._a = nextA;
  };
  calcFunc["*"].kk = function() {
    this.outs[0][0] = this.inputs[0][0] * this.inputs[1][0];
  };
  calcFunc["*"].ia = function(inNumSamples) {
    inNumSamples = inNumSamples|0;
    var out = this.outs[0];
    var a = this._a, bIn = this.inputs[1];
    for (var i = 0; i < inNumSamples; i += 8) {
      out[i  ] = a * bIn[i  ];
      out[i+1] = a * bIn[i+1];
      out[i+2] = a * bIn[i+2];
      out[i+3] = a * bIn[i+3];
      out[i+4] = a * bIn[i+4];
      out[i+5] = a * bIn[i+5];
      out[i+6] = a * bIn[i+6];
      out[i+7] = a * bIn[i+7];
    }
  };

  calcFunc["/"] = function(a, b) {
    return b === 0 ? 0 : a / b;
  };
  calcFunc["%"] = function(a, b) {
    return b === 0 ? 0 : a % b;
  };
  
  Object.keys(calcFunc).forEach(function(key) {
    var func = calcFunc[key];
    if (!func.aa) { func.aa = aa(func); }
    if (!func.ak) { func.ak = ak(func); }
    if (!func.ai) { func.ai = ai(func); }
    if (!func.ka) { func.ka = ka(func); }
    if (!func.kk) { func.kk = kk(func); }
    if (!func.ki) { func.ki = func.kk;  }
    if (!func.ia) { func.ia = ia(func); }
    if (!func.ik) { func.ik = func.kk;  }
  });
  
  module.exports = {
    install: function() {
      unit.register("BinaryOpUGen", BinaryOpUGen);
    }
  };

});