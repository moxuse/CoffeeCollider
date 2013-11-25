define(function(require, exports, module) {
  "use strict";
  
  var cc = require("../cc");
  var fn = require("../fn");
  var extend = require("../../common/extend");
  var ops    = require("../../common/ops");
  var slice  = [].slice;
  
  var addToSynthDef = null;
  var specs = {};
  
  cc.ugen = {
    specs:specs,
    checkSameRateAsFirstInput: function(ugen) {
      if (ugen.rate !== ugen.inputs[0].rate) {
        var strRate = ["ir","kr","ar"][ugen.rate];
        throw new Error("first input is not " + strRate + " rate");
      }
    },
    checkNInputs: function(n) {
      return function(ugen) {
        if (ugen.rate === C.AUDIO) {
          for (var i = 0; i < n; ++i) {
            if (ugen.inputs[i].rate !== C.AUDIO) {
              throw new Error("input[" + i + "] is not AUDIO rate");
            }
          }
        }
      };
    }
  };
  
  var UGen = (function() {
    function UGen(name) {
      this.klassName = name;
      this.tag  = "";
      this.rate = C.AUDIO;
      this.signalRange = C.BIPOLAR;
      this.specialIndex = 0;
      this.outputIndex  = 0;
      this.numOfInputs  = 0;
      this.numOfOutputs = 1;
      this.inputs = [];
    }
    extend(UGen, cc.Object);
    
    UGen.prototype.init = function(rate) {
      this.rate = rate;
      if (addToSynthDef) {
        addToSynthDef(this);
      }
      this.inputs = slice.call(arguments, 1);
      this.numOfInputs = this.inputs.length;
      return this;
    };

    // common methods
    UGen.prototype.copy = function() {
      return this;
    };
    UGen.prototype.dup = fn(function(n) {
      var a = new Array(n|0);
      for (var i = 0, imax = a.length; i < imax; ++i) {
        a[i] = this;
      }
      return a;
    }).defaults(ops.COMMONS.dup).build();
    
    // unary operator methods
    ["__plus__","__minus__"].concat(Object.keys(ops.UNARY_OPS)).forEach(function(selector) {
      var ugenSelector;
      if (ops.ALIASES.hasOwnProperty(selector)) {
        ugenSelector = ops.ALIASES[selector];
      } else {
        ugenSelector = selector;
      }
      if (/^[a-z_][a-zA-Z0-9_]*$/.test(selector)) {
        UGen.prototype[selector] = function() {
          return cc.createUnaryOpUGen(ugenSelector, this);
        };
      }
    });
    
    // binay operator methods
    ["__add__","__sub__","__mul__","__div__","__mod__"].concat(Object.keys(ops.BINARY_OPS)).forEach(function(selector) {
      var ugenSelector;
      if (ops.ALIASES.hasOwnProperty(selector)) {
        ugenSelector = ops.ALIASES[selector];
      } else {
        ugenSelector = selector;
      }
      if (/^[a-z_][a-zA-Z0-9_]*$/.test(selector)) {
        fn.defineBinaryProperty(UGen.prototype, selector, function(b) {
          return cc.createBinaryOpUGen(ugenSelector, this, b);
        });
      }
    });

    UGen.prototype.__and__ = function() {
      return 0;
    };
    UGen.prototype.__or__ = function() {
      return 0;
    };
    
    // arity operators methods
    UGen.prototype.madd = fn(function(mul, add) {
      return cc.createMulAdd(this, mul, add);
    }).defaults(ops.ARITY_OPS.madd).multiCall().build();
    
    UGen.prototype.range = fn(function(lo, hi) {
      var mul, add;
      if (this.signalRange === C.BIPOLAR) {
        mul = (hi.__sub__(lo)).__mul__(0.5);
        add = mul.__add__(lo);
      } else {
        mul = hi.__sub__(lo);
        add = lo;
      }
      return cc.createMulAdd(this, mul, add);
    }).defaults(ops.ARITY_OPS.range).multiCall().build();
    
    UGen.prototype.exprange = fn(function(lo, hi) {
      if (this.signalRange === C.BIPOLAR) {
        return this.linexp(-1, 1, lo, hi);
      } else {
        return this.linexp( 0, 1, lo, hi);
      }
    }).defaults(ops.ARITY_OPS.exprange).multiCall().build();

    UGen.prototype.curverange = fn(function(lo, hi, curve) {
      if (this.signalRange === C.BIPOLAR) {
        return this.lincurve(-1, 1, lo, hi, curve);
      } else {
        return this.lincurve( 0, 1, lo, hi, curve);
      }
    }).defaults(ops.ARITY_OPS.curverange).multiCall().build();
    
    UGen.prototype.unipolar = fn(function(mul) {
      return this.range(0, mul);
    }).defaults(ops.ARITY_OPS.unipolar).multiCall().build();
    
    UGen.prototype.bipolar = fn(function(mul) {
      return this.range(mul.neg(), mul);
    }).defaults(ops.ARITY_OPS.bipolar).multiCall().build();

    UGen.prototype.clip = fn(function(lo, hi) {
      return cc.global.Clip(this.rate, this, lo, hi);
    }).defaults(ops.ARITY_OPS.clip).multiCall().build();

    UGen.prototype.fold = fn(function(lo, hi) {
      return cc.global.Fold(this.rate, this, lo, hi);
    }).defaults(ops.ARITY_OPS.fold).multiCall().build();
    
    UGen.prototype.wrap = fn(function(lo, hi) {
      return cc.global.Wrap(this.rate, this, lo, hi);
    }).defaults(ops.ARITY_OPS.wrap).multiCall().build();

    UGen.prototype.blend = fn(function(that, blendFrac) {
      var pan = blendFrac.linlin(0, 1, -1, 1);
      if (this.rate === C.AUDIO) {
        return cc.global.XFade2(C.AUDIO, this, that, pan);
      }
      if (that.rate === C.AUDIO) {
        return cc.global.XFade2(C.AUDIO, that, this, pan.neg());
      }
      return cc.global.LinXFade2(this.rate, this, that, pan);
    }).defaults(ops.ARITY_OPS.blend).multiCall().build();
    
    UGen.prototype.lag = fn(function(t1, t2) {
      if (typeof t2 === "undefined") {
        return cc.global.Lag(this.rate, this, t1);
      }
      return cc.global.LagUD(this.rate, this, t1, t2);
    }).defaults(ops.ARITY_OPS.lag).multiCall().build();
    
    UGen.prototype.lag2 = fn(function(t1, t2) {
      if (typeof t2 === "undefined") {
        return cc.global.Lag2(this.rate, this, t1);
      }
      return cc.global.Lag2UD(this.rate, this, t1, t2);
    }).defaults(ops.ARITY_OPS.lag2).multiCall().build();
    
    UGen.prototype.lag3 = fn(function(t1, t2) {
      if (typeof t2 === "undefined") {
        return cc.global.Lag3(this.rate, this, t1);
      }
      return cc.global.Lag3UD(this.rate, this, t1, t2);
    }).defaults(ops.ARITY_OPS.lag3).multiCall().build();
    
    UGen.prototype.lagud = fn(function(lagTimeU, lagTimeD) {
      return cc.global.LagUD(this.rate, this, lagTimeU, lagTimeD);
    }).defaults(ops.ARITY_OPS.lagud).multiCall().build();
    
    UGen.prototype.lag2ud = fn(function(lagTimeU, lagTimeD) {
      return cc.global.Lag2UD(this.rate, this, lagTimeU, lagTimeD);
    }).defaults(ops.ARITY_OPS.lag2ud).multiCall().build();
    
    UGen.prototype.lag3ud = fn(function(lagTimeU, lagTimeD) {
      return cc.global.Lag3UD(this.rate, this, lagTimeU, lagTimeD);
    }).defaults(ops.ARITY_OPS.lag3ud).multiCall().build();

    UGen.prototype.varlag = fn(function(time, curvature, warp, start) {
      return cc.global.VarLag(this.rate, this, time, curvature, warp, start);
    }).defaults(ops.ARITY_OPS.varlag).multiCall().build();
    
    UGen.prototype.slew = fn(function(up, down) {
      return cc.global.Slew(this.rate, this, up, down);
    }).defaults(ops.ARITY_OPS.slew).multiCall().build();
    
    UGen.prototype.prune = function(min, max, type) {
      switch (type) {
      case "minmax":
        return this.clip(min, max);
      case "min":
        return this.max(min);
      case "max":
        return this.min(max);
      }
      return this;
    };
    
    UGen.prototype.linlin = fn(function(inMin, inMax, outMin, outMax, clip) {
      return cc.global.LinLin(
        this.rate,
        this.prune(inMin, inMax, clip),
        inMin, inMax, outMin, outMax
      );
    }).defaults(ops.ARITY_OPS.linlin).multiCall().build();
    
    UGen.prototype.linexp = fn(function(inMin, inMax, outMin, outMax, clip) {
      return cc.global.LinExp(
        this.rate,
        this.prune(inMin, inMax, clip),
        inMin, inMax, outMin, outMax
      );
    }).defaults(ops.ARITY_OPS.linexp).multiCall().build();
    
    UGen.prototype.explin = fn(function(inMin, inMax, outMin, outMax, clip) {
      return cc.global.ExpLin(
        this.rate,
        this.prune(inMin, inMax, clip),
        inMin, inMax, outMin, outMax
      );
    }).defaults(ops.ARITY_OPS.explin).multiCall().build();
    
    UGen.prototype.expexp = fn(function(inMin, inMax, outMin, outMax, clip) {
      return cc.global.ExpExp(
        this.rate,
        this.prune(inMin, inMax, clip),
        inMin, inMax, outMin, outMax
      );
    }).defaults(ops.ARITY_OPS.expexp).multiCall().build();
    
    UGen.prototype.lincurve = fn(function(inMin, inMax, outMin, outMax, curve, clip) {
      if (typeof curve === "number" && Math.abs(curve) < 0.25) {
        return this.linlin(inMin, inMax, outMin, outMax, clip);
      }
      var grow = curve.exp();
      var a = outMax.__sub__(outMin).__div__((1).__sub__(grow));
      var b = outMin.__add__(a);
      var scaled = (this.prune(inMin, inMax, clip).__sub__(inMin)).__div__(inMax.__sub__(inMin));
      return b.__sub__(a.__mul__(grow.pow(scaled)));
    }).defaults(ops.ARITY_OPS.lincurve).multiCall().build();
    
    UGen.prototype.curvelin = fn(function(inMin, inMax, outMin, outMax, curve, clip) {
      if (typeof curve === "number" && Math.abs(curve) < 0.25) {
        return this.linlin(inMin, inMax, outMin, outMax, clip);
      }
      var grow = curve.exp();
      var a = outMax.__sub__(outMin).__div__((1).__sub__(grow));
      var b = outMin.__add__(a);
      var scaled = (this.prune(inMin, inMax, clip).__sub__(inMin)).__div__(inMax.__sub__(inMin));
      return ((b.__sub__(scaled)).__div__(a)).log().__div__(curve);
    }).defaults(ops.ARITY_OPS.curvelin).multiCall().build();

    UGen.prototype.bilin = fn(function(inCenter, inMin, inMax, outCenter, outMin, outMax, clip) {
      return cc.global.Select(this.rate, this.lt(inCenter), [
        this.linlin(inCenter, inMax, outCenter, outMax, clip),
        this.linlin(inMin, inCenter, outMin, outCenter, clip)
      ]);
    }).defaults(ops.ARITY_OPS.bilin).build();
    
    UGen.prototype.rrand = fn(function() {
      return 0;
    }).defaults(ops.ARITY_OPS.rrand).build();
    
    UGen.prototype.exprand = fn(function() {
      return 0;
    }).defaults(ops.ARITY_OPS.exprand).build();
    
    return UGen;
  })();
  
  var MultiOutUGen = (function() {
    function MultiOutUGen(name) {
      UGen.call(this, name || "MultiOutUGen");
      this.channels = null;
    }
    extend(MultiOutUGen, UGen);
    
    MultiOutUGen.prototype.initOutputs = function(numChannels, rate) {
      var channels = new Array(numChannels);
      for (var i = 0; i < numChannels; ++i) {
        channels[i] = new OutputProxy(rate, this, i);
      }
      this.channels = channels;
      this.numOfOutputs = channels.length;
      this.inputs = this.inputs.map(function(ugen) {
        if (!(ugen instanceof UGen)) {
          ugen = +ugen;
          if (isNaN(ugen)) {
            ugen = 0;
          }
        }
        return ugen;
      });
      this.numOfInputs = this.inputs.length;
      return (numChannels === 1) ? channels[0] : channels;
    };
    
    return MultiOutUGen;
  })();
  
  var OutputProxy = (function() {
    function OutputProxy(rate, source, index) {
      UGen.call(this, "OutputProxy");
      this.init(rate);
      this.inputs = [ source ];
      this.numOfOutputs = 1;
      this.outputIndex  = index;
    }
    extend(OutputProxy, UGen);
    
    return OutputProxy;
  })();
  
  var checkBadInput = function(ugen) {
    ugen.inputs.forEach(function(_in, i) {
      if (!(typeof _in === "number" || _in instanceof UGen)) {
        throw new TypeError("arg[" + i + "] bad input");
      }
    });
  };
  
  var init_instance = function(instance, tag, checkInputs) {
    if (Array.isArray(instance)) {
      instance.forEach(function(ugen) {
        if (ugen instanceof UGen) {
          checkBadInput(instance);
          if (checkInputs) {
            checkInputs(instance);
          }
          instance.tag = tag || "";
        }
      });
    } else if (instance instanceof UGen) {
      checkBadInput(instance);
      if (checkInputs) {
        checkInputs(instance);
      }
      instance.tag = tag || "";
    }
    return instance;
  };
  
  
  var register = function(name, spec) {
    var BaseClass = (spec.Klass === null) ? null : (spec.Klass || UGen);
    var multiCall   = spec.multiCall;
    var checkInputs = spec.checkInputs;
    var signalRange = spec.signalRange || C.BIPOLAR;
    
    var klass;
    if (spec.$new) {
      klass = function() {
        return cc.global[name]["new"].apply(null, slice.call(arguments));
      };
    } else {
      klass = function(rate) {
        if (typeof rate === "number") {
          rate = ["ir", "kr", "ar"][rate];
        }
        var func = cc.global[name][rate];
        if (func) {
          return func.apply(null, slice.call(arguments, 1));
        }
        return new UGen(name);
      };
    }
    cc.global[name] = klass;
    
    Object.keys(spec).forEach(function(key) {
      if (key.charAt(0) !== "$") {
        return;
      }
      var setting     = spec[key];
      var defaults    = setting.defaults + ",tag";
      var ctor        = setting.ctor;
      key = key.substr(1);
      if (BaseClass !== null) {
        klass[key] = fn(function() {
          var args = slice.call(arguments, 0, arguments.length - 1);
          var tag  = arguments[arguments.length - 1];
          var instance = ctor.apply(new BaseClass(name, tag), args);
          instance.signalRange = signalRange;
          return init_instance(instance, tag, checkInputs);
        }).defaults(defaults).multiCall(multiCall).build();
      } else {
        klass[key] = fn(function() {
          var args = slice.call(arguments, 0, arguments.length - 1);
          var tag  = arguments[arguments.length - 1];
          var instance = ctor.apply(null, args);
          instance.signalRange = signalRange;
          return init_instance(instance, tag, checkInputs);
        }).defaults(defaults).multiCall(multiCall).build();
      }
    });
  };
  
  cc.createUGen = function() {
    return new UGen();
  };
  cc.createOutputProxy = function(rate, source, index) {
    return new OutputProxy(rate, source, index);
  };
  cc.instanceOfUGen = function(obj) {
    return obj instanceof UGen;
  };
  cc.instanceOfMultiOutUGen = function(obj) {
    return obj instanceof MultiOutUGen;
  };
  cc.instanceOfOutputProxy = function(obj) {
    return obj instanceof OutputProxy;
  };
  cc.setSynthDef = function(func) {
    if (func && addToSynthDef !== null) {
      throw new Error("nested Synth.def");
    }
    addToSynthDef = func;
  };
  
  cc.UGen = UGen;
  cc.MultiOutUGen = MultiOutUGen;
  
  module.exports = {
    UGen        : UGen,
    MultiOutUGen: MultiOutUGen,
    OutputProxy : OutputProxy,
    register    : register,
  };

});
