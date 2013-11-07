define(function(require, exports, module) {
  "use strict";

  var assert = require("chai").assert;

  var cc    = require("./cc");
  var sched = require("./sched");
  var slice = [].slice;
  var nop = function() {};
  var nil;
  
  describe("sched.js", function() {
    var func, cmd, actual;
    before(function() {
      sched.use();
      func = function() {
        return [
          function() {
            cmd[0].apply(this, slice.call(arguments));
          },
          function() {
            cmd[1].apply(this, slice.call(arguments));
          },
          function() {
            cmd[2].apply(this, slice.call(arguments));
          },
        ];
      };
    });
    beforeEach(function() {
      actual = [];
      cmd    = [
        function(i) {
          actual.push([i, 1]);
        },
        function(i) {
          actual.push([i, 2]);
        },
        function(i) {
          actual.push([i, 3]);
        },
      ];
    });
    describe("Timeline", function() {
      it("whole", function() {
        var tl = cc.createTimeline();
        assert.instanceOf(tl, sched.Timeline);
        assert.isTrue(cc.instanceOfTimeline(tl));
      });      
      it("play/pause", function() {
        var tl = cc.createTimeline();
        tl.play(16);
        assert.equal(tl.counterIncr, 16);
        tl.play(0);
        assert.equal(tl.counterIncr, 1);
        tl.pause()
        assert.equal(tl.counterIncr, 0);
      });
      it("append", function() {
        var task = {};
        var tl = cc.createTimeline();
        tl.append(task);
        assert.equal(tl.tasks.length,1);
        tl.append(task);
        assert.equal(tl.tasks.length,1);
        tl.remove(task);
        assert.equal(tl.tasks.length,0);
        tl.remove(task);
        assert.equal(tl.tasks.length,0);
      });
      it("process", function() {
        var actual = 0;
        var task = {
          process: function(counterIncr) {
            actual += counterIncr;
          }
        };
        var tl = cc.createTimeline();
        tl.append(task);
        
        tl.process();
        assert.equal(actual, 0);
        
        tl.play(16);
        tl.process();
        assert.equal(actual, 16);
        
        tl.process();
        assert.equal(actual, 32);
        
        tl.pause();
        
        tl.process();
        assert.equal(actual, 32);
        
        tl.process();
        assert.equal(actual, 32);
      });
    });
    describe("TaskFunction", function() {
      it("create", function() {
        var f = cc.global.Task(func);
        assert.instanceOf(f, sched.TaskFunction);
        assert.isTrue(cc.instanceOfTaskFunction(f));
        assert.throws(function() {
          cc.createTaskFunction("func");
        }, TypeError);
        assert.throws(function() {
          cc.createTaskFunction(function() {});
        }, TypeError);
      });
      it("perform", function() {
        var b;
        var f = cc.global.Task(func);
        b = f.perform(null, 10);
        assert.isTrue(b);
        assert.deepEqual(actual, [[10,1]]);
        
        b = f.perform(null, 20);
        assert.isTrue(b);
        assert.deepEqual(actual, [[10,1], [20,2]]);
        
        b = f.perform(null, 30);
        assert.isTrue(b);
        assert.deepEqual(actual, [[10,1], [20,2], [30, 3]]);
        
        b = f.perform(null, 40);
        assert.isFalse(b);
        assert.deepEqual(actual, [[10,1], [20,2], [30, 3]]);
      });
    });
    describe("TaskWaitToken", function() {
      it("number", function() {
        var b;
        var t = cc.createTaskWaitToken(2);
        assert.instanceOf(t, sched.TaskWaitTokenNumber);
        assert.isTrue(cc.instanceOfTaskWaitToken(t));
        
        b = t.performWait(1);
        assert.isTrue(b);

        b = t.performWait(1);
        assert.isFalse(b);
        
        b = t.performWait(0);
        assert.isFalse(b);
      });
      it("function", function() {
        var b, flag;
        var t = cc.createTaskWaitToken(function() {
          return flag;
        });
        assert.instanceOf(t, sched.TaskWaitTokenFunction);
        assert.isTrue(cc.instanceOfTaskWaitToken(t));

        flag = true;
        b = t.performWait(1);
        assert.isTrue(b);

        b = t.performWait(1);
        assert.isTrue(b);

        flag = false;
        b = t.performWait(1);
        assert.isFalse(b);

        flag = true;
        b = t.performWait(1);
        assert.isFalse(b);
      });
      it("bool", function() {
        var t, b;
        
        t = cc.createTaskWaitToken(true);
        assert.instanceOf(t, sched.TaskWaitTokenBoolean);
        assert.isTrue(cc.instanceOfTaskWaitToken(t));

        b = t.performWait(1);
        assert.isTrue(b);
        b = t.performWait(1);
        assert.isTrue(b);

        t = cc.createTaskWaitToken(false);
        assert.isTrue(cc.instanceOfTaskWaitToken(t));
        
        b = t.performWait(1);
        assert.isFalse(b);
        b = t.performWait(1);
        assert.isFalse(b);
      });
      it("array", function() {
        var t, b;
        
        t = cc.createTaskWaitToken([10,30,20]);
        assert.instanceOf(t, sched.TaskWaitTokenLogicAND);
        assert.isTrue(cc.instanceOfTaskWaitToken(t));

        b = t.performWait(10);
        assert.isTrue(b);
        b = t.performWait(10);
        assert.isTrue(b);
        b = t.performWait(10);
        assert.isFalse(b);
      });
      it("blockable", function() {
        var b, flag;
        var blockable = {
          performWait: function() {
            return flag;
          }
        };
        
        var t = cc.createTaskWaitToken(blockable);
        assert.instanceOf(t, sched.TaskWaitTokenBlockable);
        assert.isTrue(cc.instanceOfTaskWaitToken(t));
        
        flag = true;
        b = t.performWait(1);
        assert.isTrue(b);

        b = t.performWait(1);
        assert.isTrue(b);

        flag = false;
        b = t.performWait(1);
        assert.isFalse(b);

        flag = true;
        b = t.performWait(1);
        assert.isFalse(b);
      });
      it("invalid", function() {
        assert.throws(function() {
          cc.createTaskWaitToken(null);
        }, TypeError);
        assert.throws(function() {
          cc.createTaskWaitToken({});
        }, TypeError);
      });
      it("and", function() {
        var b;
        var t0 = cc.createTaskWaitToken(20);
        var t1 = cc.createTaskWaitToken(10);
        var t2 = cc.createTaskWaitToken(30);
        var t3 = cc.createTaskWaitLogic("and", [t0, t1]);
        var t  = cc.createTaskWaitLogic("and", [t2, t3]);
        assert.instanceOf(t, sched.TaskWaitTokenLogicAND);

        b = t.performWait(1);
        assert.isTrue(b);
        assert.isTrue(t0.performWait(0));
        assert.isTrue(t1.performWait(0));
        assert.isTrue(t2.performWait(0));

        b = t.performWait(10);
        assert.isTrue(b);
        assert.isTrue(t0.performWait(0));
        assert.isFalse(t1.performWait(0));
        assert.isTrue(t2.performWait(0));

        b = t.performWait(10);
        assert.isTrue(b);
        assert.isFalse(t0.performWait(0));
        assert.isFalse(t1.performWait(0));
        assert.isTrue(t2.performWait(0));

        b = t.performWait(10);
        assert.isFalse(b);
        assert.isFalse(t0.performWait(0));
        assert.isFalse(t1.performWait(0));
        assert.isFalse(t2.performWait(0));
        
        b = t.performWait(0);
        assert.isFalse(b);
      });
      it("or", function() {
        var b;
        var t0 = cc.createTaskWaitToken(20);
        var t1 = cc.createTaskWaitToken(10);
        var t2 = cc.createTaskWaitToken(30);
        var t3 = cc.createTaskWaitLogic("or", [t0, t1]);
        var t  = cc.createTaskWaitLogic("or", [t2, t3]);
        assert.instanceOf(t, sched.TaskWaitTokenLogicOR);

        b = t.performWait(1);
        assert.isTrue(b);
        assert.isTrue(t0.performWait(0));
        assert.isTrue(t1.performWait(0));
        assert.isTrue(t2.performWait(0));
        
        b = t.performWait(10);
        assert.isFalse(b);
        assert.isTrue(t0.performWait(0));
        assert.isFalse(t1.performWait(0));
        assert.isTrue(t2.performWait(0));
        
        b = t.performWait(10);
        assert.isFalse(b);
        assert.isFalse(t0.performWait(0));
        assert.isFalse(t1.performWait(0));
        assert.isTrue(t2.performWait(0));
        
        b = t.performWait(10);
        assert.isFalse(b);
        assert.isFalse(t0.performWait(0));
        assert.isFalse(t1.performWait(0));
        assert.isFalse(t2.performWait(0));
        
        b = t.performWait(0);
        assert.isFalse(b);
      });
    });
    describe("Processor", function() {
      beforeEach(function() {
        cmd = [
          function(n, i) {
            actual.push([n, i, 1]);
            this.wait(16);
          },
          function(n, i) {
            actual.push([n, i, 2]);
            this.wait(16);
          },
          function(n, i) {
            actual.push([n, i, 3]);
            this.wait(16);
          },
        ];
      });
      it("Task.do", function() {
        var passed = false;
        var t = cc.global.Task.do(func).on("end", function() {
          passed = true;
        });
        assert.instanceOf(t, sched.TaskProcessorDo);
        
        t.process(0);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1]]);

        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2]]);

        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2], [0, nil, 3]]);
        
        t.process(16);
        assert.isTrue(passed);

        t.stop();
      });
      it("Task.loop", function() {
        var passed = false;
        var t = cc.global.Task.loop(func).on("end", function() {
          passed = true;
        });
        assert.instanceOf(t, sched.TaskProcessorLoop);
        
        t.process(0);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1]]);

        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2]]);

        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2], [0, nil, 3]]);
        
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2], [0, nil, 3], [1, nil, 1]]);
      });
      it("Task.each", function() {
        var passed = false;
        var t = cc.global.Task.each([10,20,30], func).on("end", function() {
          passed = true;
        });
        assert.instanceOf(t, sched.TaskProcessorEach);
        
        t.process(0);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1]]);

        t.process(16);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2], [10, 0, 3]]);
        
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2], [10, 0, 3],
                                  [20, 1, 1]]);
        t.process(16);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2], [10, 0, 3],
                                  [20, 1, 1], [20, 1, 2], [20, 1, 3]]);          
        t.process(16);
        t.process(16);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2], [10, 0, 3],
                                  [20, 1, 1], [20, 1, 2], [20, 1, 3],
                                  [30, 2, 1], [30, 2, 2], [30, 2, 3]]);
        t.process(0);
        assert.isFalse(passed);
        
        t.process(16);
        assert.isTrue(passed);
        
        assert.throws(function() {
          cc.global.Task.each("invalid", func);
        }, TypeError);
      });
      it("Task.timeout", function() {
        var passed = false;
        var t = cc.global.Task.timeout(32, func).on("end", function() {
          passed = true;
        });
        assert.instanceOf(t, sched.TaskProcessorTimeout);
        
        t.process(0);
        assert.isFalse(passed);
        assert.deepEqual(actual, []);

        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, []);

        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1]]);
        
        t.process(16);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2], [0, nil, 3]]);
        
        t.process(16);
        assert.isTrue(passed);
        
        t.stop();
      });
      it("Task.interval", function() {
        var passed = false;
        var t = cc.global.Task.interval(32, func).on("end", function() {
          passed = true;
        });
        assert.instanceOf(t, sched.TaskProcessorInterval);
        
        t.process(0);
        assert.isFalse(passed);
        assert.deepEqual(actual, []);
        
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, []);

        t.process(16);
        t.process(16);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2], [0, nil, 3]]);
        t.process(16);
        
        // delay
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2], [0, nil, 3]]);
        
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[0, nil, 1], [0, nil, 2], [0, nil, 3], [1, nil, 1]]);
      });
      it("continue", function() {
        var passed = false;
        var t = cc.global.Task.each([10,20,30], func).on("end", function() {
          passed = true;
        });

        cmd[1] = function(n, i) {
          actual.push([n, i, 2]);
          this.continue(16);
        };
        
        t.process(0);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2]]);
        
        t.process(16);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2],
                                  [20, 1, 1], [20, 1, 2]]);
      });
      it("redo", function() {
        var passed = false;
        var t = cc.global.Task.each([10,20,30], func).on("end", function() {
          passed = true;
        });

        cmd[1] = function(n, i) {
          actual.push([n, i, 2]);
          this.redo(16);
        };
        
        t.process(0);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2]]);
        
        t.process(16);
        t.process(16);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2],
                                  [10, 0, 1], [10, 0, 2]]);
      });
      it("break", function() {
        var passed = false;
        var t = cc.global.Task.each([10,20,30], func).on("end", function() {
          passed = true;
        });

        cmd[1] = function(n, i) {
          actual.push([n, i, 2]);
          this.break();
        };
        
        t.process(0);
        assert.isFalse(passed);
        assert.deepEqual(actual, [[10, 0, 1]]);
        
        t.process(16);
        assert.isTrue(passed);
        assert.deepEqual(actual, [[10, 0, 1], [10, 0, 2]]);
      });
      it("chain", function() {
        var passed = [];
        var tl = cc.createTimeline();
        var t0 = cc.global.Task.timeout(16, func).on("end", function() {
          passed.push("timeout");
        });
        var t1 = t0.do(func).on("end", function() {
          passed.push("do");
        });
        var t2 = t1.each([10, 20], func).on("end", function() {
          passed.push("each");
        });
        var t3 = t2.interval(16, func).on("end", function() {
          passed.push("interval");
        });
        var t4 = t3.loop(func).on("end", function() {
          passed.push("loop");
        });
        var t5 = t4.timeout(16, func).on("end", function() {
          passed.push("end");
        });

        tl.play(8);
        t5.play();
        
        cmd[1] = function() {
          this.break();
        };
        
        tl.process();
        assert.deepEqual(actual, []);

        tl.process();
        assert.deepEqual(actual, [[0, nil, 1]]);
        assert.deepEqual(passed, []);

        // timeout
        tl.process();
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1]]);
        assert.deepEqual(passed, ["timeout"]);

        // do
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1],
                                  [0, nil, 1]]);
        assert.deepEqual(passed, ["timeout"]);
        
        tl.process();
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1],
                                  [0, nil, 1]]);
        assert.deepEqual(passed, ["timeout", "do"]);

        // each
        tl.process();
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1]]);
        assert.deepEqual(passed, ["timeout", "do"]);
        tl.process();
        tl.process();
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1]]);
        assert.deepEqual(passed, ["timeout", "do", "each"]);

        // interval
        tl.process(); // delay
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1]]);
        tl.process();
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1],
                                  [ 0, nil, 1]]);
        assert.deepEqual(passed, ["timeout", "do", "each"]);
        tl.process();
        tl.process();
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1],
                                  [ 0, nil, 1]]);
        assert.deepEqual(passed, ["timeout", "do", "each", "interval"]);
        
        // loop
        tl.process();
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1],
                                  [ 0, nil, 1],
                                  [ 0, nil, 1]]);
        assert.deepEqual(passed, ["timeout", "do", "each", "interval"]);
        tl.process();
        tl.process();
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1],
                                  [ 0, nil, 1],
                                  [ 0, nil, 1]]);
        assert.deepEqual(passed, ["timeout", "do", "each", "interval", "loop"]);
        
        // timeout
        tl.process(); // delay
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1],
                                  [ 0, nil, 1],
                                  [ 0, nil, 1]]);
        tl.process();
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1],
                                  [ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [ 0, nil, 1]]);
        assert.deepEqual(passed, ["timeout", "do", "each", "interval", "loop"]);
        tl.process();
        tl.process();
        assert.deepEqual(actual, [[ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [10,   0, 1],
                                  [ 0, nil, 1],
                                  [ 0, nil, 1],
                                  [ 0, nil, 1]]);
        assert.deepEqual(passed, ["timeout", "do", "each", "interval", "loop", "end"]);
      });
      it("play/pause/stop", function() {
        var passed = false;
        var tl = cc.createTimeline();
        var t0 = cc.global.Task.loop(func).play().play().on("end", function() {
          passed = true;
        });
        var wt = cc.createTaskWaitToken(t0);
        assert.isTrue(cc.instanceOfTaskWaitToken(wt));
        assert.isTrue(wt.performWait(0));
        
        tl.play(16);
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1]]);
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1],
                                  [0, nil, 2]]);
        
        t0.pause().pause();
        tl.process();
        tl.process();
        tl.process();
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1],
                                  [0, nil, 2]]);

        t0.play();
        
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1],
                                  [0, nil, 2],
                                  [0, nil, 3]]);
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1],
                                  [0, nil, 2],
                                  [0, nil, 3],
                                  [1, nil, 1]]);
        assert.isFalse(passed);
        t0.stop();
        t0.play();
        assert.isTrue(passed);
        
        tl.process();
        tl.process();
        tl.process();
        tl.process();
        assert.deepEqual(actual, [[0, nil, 1],
                                  [0, nil, 2],
                                  [0, nil, 3],
                                  [1, nil, 1]]);

        passed = false;
        t0.pause();
        t0.stop();
        assert.isFalse(passed); // emit once
        
        assert.isFalse(wt.performWait(0));
      });
    });
  });

});
