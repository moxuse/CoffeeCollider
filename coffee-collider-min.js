!function(a){"use strict";var b=function(a,c,d){b.modules||(b.modules={},b.payloads={}),b.payloads[a]=d,b.modules[a]=null},c=function(a,e){e=d(a,e);var f=b.modules[e];if(!f){f=b.payloads[e];var g={},h={id:e,exports:g},i=function(a){return c(e,a)},j=f(i,g,h);g=j||h.exports,b.modules[e]=g,delete b.payloads[e]}return f=b.modules[e]=g||f},d=function(a,b){if("."===b.charAt(0)){var c=a.split("/").slice(0,-1).join("/");b=c+"/"+b;for(var d;-1!==b.indexOf(".")&&d!==b;)d=b,b=b.replace(/\/\.\//,"/").replace(/[^\/]+\/\.\.\//,"")}return b},e=b;e("cc/loader",["require","exports","module","cc/cc","cc/front/coffee-collider","cc/lang/installer","cc/synth/synth-server"],function(b,c,d){var e=b("./cc");if("undefined"!=typeof document){var f=document.getElementsByTagName("script"),g=!1;if(f&&f.length)for(var h,i=0;i<f.length;i++)if(!e.coffeeColliderPath&&(h=/^(.*\/coffee-collider(?:-min)?\.js)(#lang)?/.exec(f[i].src))){e.coffeeColliderPath=h[1],"#lang"===h[2]&&(g=!0);break}g?(e.context="server",b("./lang/installer").install()):(e.context="window",a.CoffeeCollider=b("./front/coffee-collider").CoffeeCollider)}else"undefined"!=typeof WorkerLocation&&(e.context="synth",b("./synth/synth-server"));d.exports={}}),e("cc/cc",["require","exports","module"],function(a,b,c){c.exports={}}),e("cc/front/coffee-collider",["require","exports","module","cc/cc","cc/front/audio-context","cc/front/compiler"],function(a,b,c){var d=a("cc/cc"),e=a("./audio-context").AudioContext,f=a("./compiler").Compiler,g={},h=function(){function a(){var a=this,c=document.createElement("iframe");c.style.width=0,c.style.height=0,c.style.border=0,c.sandbox="allow-scripts allow-same-origin",document.body.appendChild(c);var f=document.createElement("script"),g=d.coffeeColliderPath;f.src=g+"#lang",f.onload=function(){window.addEventListener("message",function(b){var c=b.data;c instanceof Float32Array?(a.strmList[a.strmListWriteIndex]=c,a.strmListWriteIndex=7&a.strmListWriteIndex+1):a.recv(b.data)})},c.contentDocument.body.appendChild(f),this.iframe=c,this.cclang=c.contentWindow,this.isConnected=!1,this.execId=0,this.execCallbacks={},b||(b=new e),this.context=b,this.context.append(this),this.sampleRate=this.context.sampleRate,this.channels=this.context.channels,this.strmLength=this.context.strmLength,this.bufLength=this.context.bufLength,this.isPlaying=!1,this.strm=new Float32Array(this.strmLength*this.channels),this.strmList=new Array(8),this.strmListReadIndex=0,this.strmListWriteIndex=0}var b=null;return a.prototype.destroy=function(){this.context.remove(this),document.body.removeChild(this.iframe)},a.prototype.play=function(){this.isPlaying||(this.isPlaying=!0,this.context.play(),this.sendToLang(["/play"]))},a.prototype.reset=function(){},a.prototype.pause=function(){this.isPlaying&&(this.isPlaying=!1,this.context.pause(),this.sendToLang(["/pause"]))},a.prototype.process=function(){var a=this.strmList[this.strmListReadIndex];a&&(this.strmListReadIndex=7&this.strmListReadIndex+1,this.strm.set(a))},a.prototype.exec=function(a,b){"string"==typeof a&&(a=(new f).compile(a.trim()),this.sendToLang(["/exec",this.execId,a]),"function"==typeof b&&(this.execCallbacks[this.execId]=b),this.execId+=1)},a.prototype.loadJavaScript=function(a,b){var c=document.createElement("script");c.src=a,"function"==typeof b&&(c.onload=function(){b()}),this.iframe.contentDocument.body.appendChild(c)},a.prototype.sendToLang=function(a){this.cclang.postMessage(a,"*")},a.prototype.recv=function(a){if(a){var b=g[a[0]];b&&b.call(this,a)}},a.prototype.sync=function(a){this.sendToLang(a)},a}();g["/connect"]=function(){this.isConnected=!0,this.sendToLang(["/init",this.sampleRate,this.channels,this.strmLength,this.bufLength,this.context.syncCount])},g["/exec"]=function(a){var b=a[1],c=a[2],d=this.execCallbacks[b];d&&(void 0!==c&&(c=JSON.parse(c)),d(c),delete this.execCallbacks[b])};var i=function(){function a(){this.impl=new h,this.sampleRate=this.impl.sampleRate,this.channels=this.impl.channels}return a.prototype.destroy=function(){return this.impl&&(this.impl.destroy(),delete this.impl,delete this.sampleRate,delete this.channels),this},a.prototype.play=function(){return this.impl&&this.impl.play(),this},a.prototype.reset=function(){return this.impl&&this.impl.reset(),this},a.prototype.pause=function(){return this.impl&&this.impl.pause(),this},a.prototype.exec=function(a,b){return this.impl&&this.impl.exec(a,b),this},a.prototype.getStream=function(){return this.impl?this.impl.strm:void 0},a.prototype.loadJavaScript=function(a,b){return this.impl&&this.impl.loadJavaScript(a,b),this},a}();c.exports={CoffeeCollider:i}}),e("cc/front/audio-context",["require","exports","module","cc/front/web-audio-api"],function(a,b,c){var d=function(){function a(){var a=e();this.sampleRate=44100,this.channels=2,a&&(this.driver=new a(this),this.sampleRate=this.driver.sampleRate,this.channels=this.driver.channels),this.colliders=[],this.process=b,this.strmLength=1024,this.bufLength=64,this.strm=new Float32Array(this.strmLength*this.channels),this.clear=new Float32Array(this.strmLength*this.channels),this.syncCount=0,this.syncItems=new Float32Array(6),this.isPlaying=!1}a.prototype.append=function(a){var b=this.colliders.indexOf(a);-1===b&&(this.colliders.push(a),this.process=1===this.colliders.length?c:d)},a.prototype.remove=function(a){var e=this.colliders.indexOf(a);-1!==e&&this.colliders.splice(e,1),this.process=1===this.colliders.length?c:0===this.colliders.length?b:d},a.prototype.play=function(){this.isPlaying||(this.isPlaying=!0,this.syncCount=0,this.driver.play())},a.prototype.pause=function(){if(this.isPlaying){var a=this.colliders.every(function(a){return!a.isPlaying});a&&(this.isPlaying=!1,this.driver.pause())}};var b=function(){this.strm.set(this.clear)},c=function(){var a=this.colliders[0];this.syncItems[0]=this.syncCount,a.process(),this.strm.set(a.strm),a.sync(this.syncItems),this.syncCount++},d=function(){var a,b,c=this.strm,d=c.length,e=this.colliders,f=this.syncItems;f[0]=this.syncCount,c.set(this.clear);for(var g=0,h=e.length;h>g;++g){a=e[g],a.process(),b=a.strm;for(var i=0;d>i;i+=8)c[i]+=b[i],c[i+1]+=b[i+1],c[i+2]+=b[i+2],c[i+3]+=b[i+3],c[i+4]+=b[i+4],c[i+5]+=b[i+5],c[i+6]+=b[i+6],c[i+7]+=b[i+7];a.sync(f)}this.syncCount++};return a}(),e=function(){return a("./web-audio-api").getAPI()};c.exports={AudioContext:d}}),e("cc/front/web-audio-api",["require","exports","module"],function(b,c,d){function e(a){this.sys=a,this.context=new g,this.sampleRate=this.context.sampleRate,this.channels=a.channels}var f;d.exports={getAPI:function(){return f}};var g=a.AudioContext||a.webkitAudioContext;g&&(e.prototype.play=function(){var a,b=this.sys,c=b.strmLength,d=4*c,e=b.strm.buffer;this.sys.sampleRate===this.sampleRate&&(a=function(a){var c=a.outputBuffer;b.process(),c.getChannelData(0).set(new Float32Array(e.slice(0,d))),c.getChannelData(1).set(new Float32Array(e.slice(d)))}),this.bufSrc=this.context.createBufferSource(),this.jsNode=this.context.createJavaScriptNode(c,2,this.channels),this.jsNode.onaudioprocess=a,this.bufSrc.noteOn(0),this.bufSrc.connect(this.jsNode),this.jsNode.connect(this.context.destination)},e.prototype.pause=function(){this.bufSrc.disconnect(),this.jsNode.disconnect()},f=e)}),e("cc/front/compiler",["require","exports","module","cc/lang/bop"],function(b,c,d){var e=b("../lang/bop"),f=function(){if(a.CoffeeScript)return a.CoffeeScript;try{return b(["coffee-script"][0])}catch(c){}}(),g=function(){function a(){}var b=0,c=1,d={};return a.prototype.compile=function(a){var b=f.tokens(a);return b=this.doPI(b),b=this.doBOP(b),f.nodes(b).compile({bare:!0}).trim()},a.prototype.doPI=function(a){var e,f,g=[];for(e=0;e<a.length;)f=a[e],"pi"===f[c]&&(a.splice(e,1),"NUMBER"===g[b]&&a.splice(e++,0,["MATH","*",d]),a.splice(e++,0,["IDENTIFIER","Math",d]),a.splice(e++,0,[".",".",d]),a.splice(e,0,["IDENTIFIER","PI",d])),g=a[e++];return a},a.prototype.doBOP=function(){var a=0,f=1,g=e.replaceTable,h=function(a){return a[a.length-1]},i=function(a){return a.pop(),a[a.length-1]},j=function(a,b){return a.push(b),a[a.length-1]},k=function(a,b){a.push([".",".",d]),a.push(["IDENTIFIER",b,d]),a.push(["CALL_START","(",d])},l=function(a){a.push(["CALL_END",")",d])};return function(d){for(var e,m,n=[],o=[],p=!1;m=d.shift();)if(p&&g[m[c]])k(n,g[m[c]]),e={type:a},j(o,e),p=!1;else{switch(p=!0,e=h(o),m[b]){case",":case"TERMINATOR":case"INDENT":case"OUTDENT":for(;e&&e.type===a;)l(n),e=i(o);p=!1;break;case"CALL_START":case"(":case"[":case"{":j(o,{type:f}),p=!1;break;case"}":case"]":case")":case"CALL_END":for(;e&&e.type===a;)l(n),e=i(o);for(e&&e.type===f&&(n.push(m),e=i(o));e&&e.type===a;)l(n,e),e=i(o);continue}n.push(m)}return n}}(),a}();d.exports={Compiler:g}}),e("cc/lang/bop",["require","exports","module"],function(a,b,c){var d=function(){var a=function(a,b){return function(c){return Array.isArray(c)?c.map(function(b){return this[a](b)},this):b(this,c)}},b=function(a){return function(b){var c=this;return Array.isArray(b)?b.map(function(b,d){return c[d%c.length][a](b)}):c.map(function(c){return c[a](b)})}};Number.prototype.__add__=a("__add__",function(a,b){return a+b}),Number.prototype.__sub__=a("__sub__",function(a,b){return a-b}),Number.prototype.__mul__=a("__mul__",function(a,b){return a*b}),Number.prototype.__div__=a("__div__",function(a,b){return a/b}),Number.prototype.__mod__=a("__mod__",function(a,b){return a%b}),Array.prototype.__add__=b("__add__"),Array.prototype.__sub__=b("__sub__"),Array.prototype.__mul__=b("__mul__"),Array.prototype.__div__=b("__div__"),Array.prototype.__mod__=b("__mod__"),String.prototype.__add__=a("__add__",function(a,b){return a+b}),String.prototype.__mul__=a("__mul__",function(a,b){if("number"==typeof b){for(var c=new Array(b),d=0;b>d;d++)c[d]=a;return c.join("")}return a})},e={"+":"__add__","-":"__sub__","*":"__mul__","/":"__div__","%":"__mod__"};c.exports={install:d,replaceTable:e}}),e("cc/lang/installer",["require","exports","module","cc/lang/lang-server","cc/lang/bop"],function(a,b,c){var d=function(){a("./lang-server").install(),a("./bop").install()};c.exports={install:d}}),e("cc/lang/lang-server",["require","exports","module","cc/cc"],function(b,c,d){var e=b("cc/cc"),f={},g=function(){function a(){var a=this;this.worker=new Worker(e.coffeeColliderPath),this.worker.addEventListener("message",function(b){var c=b.data;c instanceof Float32Array?a.sendToCC(c):a.recv(c)})}return a.prototype.sendToCC=function(a){window.parent.postMessage(a,"*")},a.prototype.sendToSynth=function(a){this.worker.postMessage(a)},a.prototype.recv=function(a){if(a){var b=f[a[0]];b&&b.call(this,a)}},a}();f["/init"]=function(a){this.sendToSynth(a)},f["/play"]=function(a){this.sendToSynth(a)},f["/pause"]=function(a){this.sendToSynth(a)},f["/console/log"]=function(a){console.log.apply(console,a[1])},f["/console/debug"]=function(a){console.debug.apply(console,a[1])},f["/console/info"]=function(a){console.info.apply(console,a[1])},f["/console/error"]=function(a){console.error.apply(console,a[1])},f["/exec"]=function(b){var c=b[1],d=b[2],e=eval.call(a,d);this.sendToCC(["/exec",c,JSON.stringify(e)])};var h=function(){var a=new g;window.addEventListener("message",function(b){var c=b.data;c instanceof Float32Array?a.sendToSynth(c):a.recv(c)}),a.sendToCC(["/connect"])};d.exports={LangServer:g,install:h}}),e("cc/synth/synth-server",["require","exports","module"],function(b,c,d){var e={},f=function(){function a(){this.sysSyncCount=0,this.sysCurrentTime=0,this.syncItems=new Float32Array(6),this.onaudioprocess=this.onaudioprocess.bind(this),this.timerId=0}return a.prototype.sendToLang=function(a){postMessage(a)},a.prototype.recv=function(a){if(a){var b=e[a[0]];b&&b.call(this,a)}},a.prototype.onaudioprocess=function(){if(!(this.syncCount-this.sysSyncCount>=4)){for(var a=this.strm,b=0;b<a.length;b++)a[b]=.5*Math.random()-.25;this.syncCount+=1,this.sendToLang(a)}},a}();e["/init"]=function(a){this.sampleRate=a[1],this.channels=a[2],this.strmLength=a[3],this.bufLength=a[4],this.syncCount=a[5],this.strm=new Float32Array(this.strmLength*this.channels)},e["/play"]=function(){0===this.timerId&&(this.timerId=setInterval(this.onaudioprocess,10))},e["/pause"]=function(){this.timerId&&(clearInterval(this.timerId),this.timerId=0)};var g=new f;addEventListener("message",function(a){var b=a.data;b instanceof Float32Array?(g.sysSyncCount=0|b[0],g.sysCurrentTime=0|b[1],g.syncItems.set(b)):g.recv(b)}),a.console=function(){var a={};return["log","debug","info","error"].forEach(function(b){a[b]=function(){g.sendToLang(["/console/"+b,Array.prototype.slice.call(arguments)])}}),a}(),d.exports={SynthServer:f}}),c("cc/cc","cc/loader")}(this.self||global);
//# sourceMappingURL=coffee-collider-min.map