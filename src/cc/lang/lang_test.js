define(function(require, exports, module) {
  "use strict";

  var assert = require("chai").assert;
  var testTools = require("../../testTools");
  
  require("./lang");
  
  var cc = require("./cc");
  
  describe("lang/lang.js", function() {
    testTools.mock("createWebWorker");
    testTools.mock("resetBuffer");
    testTools.mock("resetNode");
    testTools.mock("resetBuiltin");
    testTools.mock("createTaskManager");
    
    describe("SynthLang", function() {
      describe("createSynthLang", function() {
        it("WebWorker", function() {
          cc.opmode = "worker";
          cc.createSynthLang();
          assert.equal(cc.opmode, "worker");
        });
        it("WebSocket", function() {
          cc.opmode = "socket";
          cc.createSynthLang();
          assert.equal(cc.opmode, "socket");
        });
      });
      describe("instance methods", function() {
        var instance, sendToClient, sendToServer;
        beforeEach(function() {
          sendToClient = sendToServer = [""];
          cc.opmode = "worker";
          instance = cc.createSynthLang();
          instance.sendToServer = function(msg) {
            sendToServer = msg;
          };
          instance.sendToClient = function(msg) {
            sendToClient = msg;
          };
        });
        it("#pushToTimeline", function() {
          instance.pushToTimeline(0);
          instance.pushToTimeline(1);
          instance.pushToTimeline(2);
          assert.deepEqual(instance.timelineResult, [0, 1, 2]);
        });
        it("#play", function() {
          instance.play(["/play"]);
          assert.deepEqual(cc.createTaskManager.called, ["start"]);
          assert.deepEqual(sendToServer, ["/play"]);
        });
        it("#pause", function() {
          instance.pause(["/pause"]);
          assert.deepEqual(sendToServer, ["/pause"]);
        });
        it("#reset", function() {
          instance.reset(["/reset"]);
          assert.isTrue(cc.resetBuffer .result);
          assert.isTrue(cc.resetNode   .result);
          assert.isTrue(cc.resetBuiltin.result);
          assert.deepEqual(cc.createTaskManager.called, ["reset"]);
          assert.deepEqual(sendToServer, ["/reset"]);
        });
        it("#requestBuffer", function() {
          // SEE: messaging :: /buffer/response
        });
      });
      describe("messaging", function() {
        var instance, sendToClient, sendToServer;
        beforeEach(function() {
          sendToClient = sendToServer = [""];
          cc.opmode = "worker";
          instance = cc.createSynthLang();
          instance.sendToServer = function(msg) {
            sendToServer = msg;
          };
          instance.sendToClient = function(msg) {
            sendToClient = msg;
          };
        });
        it("/connected", function() {
          instance.recvFromServer(["/connected", 96000, 4]);
          assert.equal(sendToClient[0], "/connected");
          assert.equal(sendToClient[1], 96000);
          assert.equal(sendToClient[2], 4);
          assert.isArray(sendToClient[3]);
        });
        it("/init", function() {
          instance.recvFromClient(["/init", 44100, 2]);
          assert.equal(instance.sampleRate, 44100);
          assert.equal(instance.channels  , 2);
          assert.deepEqual(sendToServer, ["/init", 44100, 2]);
        });
        it("/play", function() {
          instance.recvFromClient(["/play"]);
          assert.deepEqual(sendToServer, ["/play"]);
        });
        it("/pause", function() {
          instance.recvFromClient(["/pause"]);
          assert.deepEqual(sendToServer, ["/pause"]);
        });
        it("/reset", function() {
          instance.recvFromClient(["/reset"]);
          assert.deepEqual(sendToServer, ["/reset"]);
        });
        describe("/execute", function() {
          it("not append, without callback", function() {
            var code = "global.result = 10";
            instance.recvFromClient(["/execute", 0, code, false, false]);
            assert.equal(global.result, 10);
            assert.deepEqual(sendToClient, [""]);
            assert.deepEqual(sendToServer, ["/reset"]);
          });
          it("append, without callback", function() {
            var code = "global.result = 20";
            instance.recvFromClient(["/execute", 0, code, true, false]);
            assert.equal(global.result, 20);
            assert.deepEqual(sendToClient, [""]);
            assert.deepEqual(sendToServer, [""]);
          });
          it("not append, with callback", function() {
            var code = "global.result = 30";
            instance.recvFromClient(["/execute", 0, code, false, true]);
            assert.equal(global.result, 30);
            assert.deepEqual(sendToClient, ["/executed", 0, 30]);
            assert.deepEqual(sendToServer, ["/reset"]);
          });
          it("append, with callback", function() {
            var code = "global.result = 40";
            instance.recvFromClient(["/execute", 0, code, true, true]);
            assert.equal(global.result, 40);
            assert.deepEqual(sendToClient, ["/executed", 0, 40]);
            assert.deepEqual(sendToServer, [""]);
          });
        });
        it("/buffer/response", function(done) {
          var reqId = instance.bufferRequestId;
          instance.requestBuffer("path/to/audio", function(result) {
            assert.equal(result, "buffer");
            done()
          });
          setTimeout(function() {
            instance.recvFromClient(["/buffer/response", "buffer", reqId]);
          }, 0);
        });
        describe("socket", function() {
          // TODO: write
        });
        it("/process", function() {
          instance.recvFromServer(["/process"]);
          assert.deepEqual(sendToServer, ["/processed", []]);
        });
      });
      describe("processing", function() {
        var instance, sendToClient, sendToServer;
        it("WebWorker", function() {
          sendToClient = sendToServer = [""];
          cc.opmode = "worker";
          instance = cc.createSynthLang();
          instance.sendToServer = function(msg) {
            sendToServer = msg;
          };
          instance.sendToClient = function(msg) {
            sendToClient = msg;
          };
          
          instance.process();
          assert.deepEqual(
            cc.createTaskManager.called, ["process"],
            "WebWorkerLang processes one by one"
          );
          assert.deepEqual(sendToServer, ["/processed", [] ]);
        });
        it("WebSocket", function() {
          sendToClient = sendToServer = [""];
          cc.opmode = "socket";
          instance = cc.createSynthLang();
          instance.sendToServer = function(msg) {
            sendToServer = msg;
          };
          instance.sendToClient = function(msg) {
            sendToClient = msg;
          };

          var expected = [];
          var i, n = instance.strmLength / instance.bufLength;
          for (var i = 0; i < n; ++i) {
            expected.push("process");
          }
          
          instance.process();
          assert.deepEqual(
            cc.createTaskManager.called, expected,
            "WebSocketLang processes in a lump"
          );
          expected = expected.map(function(x) { return 0; });
          assert.deepEqual(sendToServer, ["/processed", expected ]);
        });
      });
    });
  });

});
