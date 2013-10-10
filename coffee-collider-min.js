!function(a){"use strict";var b=function(a,c){b.modules||(b.modules={},b.payloads={}),b.payloads[a]=c,b.modules[a]=null},c=function(a,e){e=d(a,e);var f=b.modules[e];if(!f){f=b.payloads[e];var g={},h={id:e,exports:g},i=function(a){return c(e,a)},j=f(i,g,h);g=j||h.exports,b.modules[e]=g,delete b.payloads[e]}return f=b.modules[e]=g||f},d=function(a,b){if("."===b.charAt(0)){var c=a.split("/").slice(0,-1).join("/");b=c+"/"+b;for(var d;-1!==b.indexOf(".")&&d!==b;)d=b,b=b.replace(/\/\.\//,"/").replace(/[^\/]+\/\.\.\//,"")}return b},e=b;e("cc/loader",function(b,c,d){var e=b("./cc");"undefined"!=typeof document?(e.context="client",b("./client/installer").install(a)):"undefined"!=typeof WorkerLocation&&(e.context="server",b("./server/installer").install(a)),d.exports={}}),e("cc/cc",function(a,b,c){c.exports={}}),e("cc/client/installer",function(a,b,c){var d=a("cc/cc"),e=a("./coffee_collider").CoffeeCollider;if("undefined"!=typeof document){var f=document.getElementsByTagName("script");if(f&&f.length)for(var g,h=0;h<f.length;h++)if(!d.coffeeColliderPath&&(g=/^.*\/coffee-collider(?:-min)?\.js/.exec(f[h].src))){d.coffeeColliderPath=g[0];break}}var i=function(a){a.CoffeeCollider=e};c.exports={install:i}}),e("cc/client/coffee_collider",function(a,b,c){var d=a("./client").SynthClient,e=function(){function a(){this.client=new d,this.sampleRate=this.client.sampleRate,this.channels=this.client.channels,this.compiler=this.client.compiler}return a.prototype.destroy=function(){return this.client&&(this.client.destroy(),delete this.client,delete this.sampleRate,delete this.channels),this},a.prototype.play=function(){return this.client&&this.client.play(),this},a.prototype.reset=function(){return this.client&&this.client.reset(),this},a.prototype.pause=function(){return this.client&&this.client.pause(),this},a.prototype.exec=function(a,b){return this.client&&this.client.exec(a,b),this},a.prototype.getStream=function(){return this.client?this.client.strm:void 0},a.prototype.loadScript=function(a){return this.client&&this.client.loadScript(a),this},a}();c.exports={CoffeeCollider:e}}),e("cc/client/client",function(a,b,c){var d=a("cc/cc"),e=a("./sound_system").SoundSystem,f=a("./compiler").Compiler,g={},h=function(){function a(){var a=this;this.worker=new Worker(d.coffeeColliderPath),this.worker.addEventListener("message",function(b){var c=b.data;c instanceof Float32Array?(a.strmList[a.strmListWriteIndex]=c,a.strmListWriteIndex=7&a.strmListWriteIndex+1):a.recv(c)}),this.compiler=new f,this.isConnected=!1,this.execId=0,this.execCallbacks={},this.sys=e.getInstance(),this.sys.append(this),this.sampleRate=this.sys.sampleRate,this.channels=this.sys.channels,this.strmLength=this.sys.strmLength,this.bufLength=this.sys.bufLength,this.isPlaying=!1,this.strm=new Float32Array(this.strmLength*this.channels),this.strmList=new Array(8),this.strmListReadIndex=0,this.strmListWriteIndex=0}return a.prototype.destroy=function(){this.sys.remove(this),delete this.worker},a.prototype.play=function(){this.isPlaying||(this.isPlaying=!0,this.sys.play(),this.send(["/play",this.sys.syncCount]))},a.prototype.reset=function(){},a.prototype.pause=function(){this.isPlaying&&(this.isPlaying=!1,this.sys.pause(),this.send(["/pause"]))},a.prototype.process=function(){var a=this.strmList[this.strmListReadIndex];a&&(this.strmListReadIndex=7&this.strmListReadIndex+1,this.strm.set(a))},a.prototype.exec=function(a,b){"string"==typeof a&&(a=this.compiler.compile(a.trim()),this.send(["/exec",this.execId,a]),"function"==typeof b&&(this.execCallbacks[this.execId]=b),this.execId+=1)},a.prototype.loadScript=function(a){this.send(["/loadScript",a])},a.prototype.send=function(a){this.worker.postMessage(a)},a.prototype.recv=function(a){if(a){var b=g[a[0]];b&&b.call(this,a)}},a.prototype.sync=function(a){this.send(a)},a}();g["/connect"]=function(){this.isConnected=!0,this.send(["/init",this.sampleRate,this.channels,this.strmLength,this.bufLength,this.sys.syncCount])},g["/exec"]=function(a){var b=a[1],c=a[2],d=this.execCallbacks[b];d&&(void 0!==c&&(c=JSON.parse(c)),d(c),delete this.execCallbacks[b])},g["/console/log"]=function(a){console.log.apply(console,a[1])},g["/console/debug"]=function(a){console.debug.apply(console,a[1])},g["/console/info"]=function(a){console.info.apply(console,a[1])},g["/console/error"]=function(a){console.error.apply(console,a[1])},c.exports={SynthClient:h}}),e("cc/client/sound_system",function(a,b,c){var d=function(){function a(){var a=e();this.sampleRate=44100,this.channels=2,a&&(this.driver=new a(this),this.sampleRate=this.driver.sampleRate,this.channels=this.driver.channels),this.colliders=[],this.process=c,this.strmLength=1024,this.bufLength=64,this.strm=new Float32Array(this.strmLength*this.channels),this.clear=new Float32Array(this.strmLength*this.channels),this.syncCount=0,this.syncItems=new Float32Array(6),this.isPlaying=!1}var b=null;a.getInstance=function(){return b||(b=new a),b},a.prototype.append=function(a){var b=this.colliders.indexOf(a);-1===b&&(this.colliders.push(a),this.process=1===this.colliders.length?d:f)},a.prototype.remove=function(a){var b=this.colliders.indexOf(a);-1!==b&&this.colliders.splice(b,1),this.process=1===this.colliders.length?d:0===this.colliders.length?c:f},a.prototype.play=function(){this.isPlaying||(this.isPlaying=!0,this.syncCount=0,this.driver.play())},a.prototype.pause=function(){if(this.isPlaying){var a=this.colliders.every(function(a){return!a.isPlaying});a&&(this.isPlaying=!1,this.driver.pause())}};var c=function(){this.strm.set(this.clear)},d=function(){var a=this.colliders[0];this.syncItems[0]=this.syncCount,a.process(),this.strm.set(a.strm),a.sync(this.syncItems),this.syncCount++},f=function(){var a,b,c=this.strm,d=c.length,e=this.colliders,f=this.syncItems;f[0]=this.syncCount,c.set(this.clear);for(var g=0,h=e.length;h>g;++g){a=e[g],a.process(),b=a.strm;for(var i=0;d>i;i+=8)c[i]+=b[i],c[i+1]+=b[i+1],c[i+2]+=b[i+2],c[i+3]+=b[i+3],c[i+4]+=b[i+4],c[i+5]+=b[i+5],c[i+6]+=b[i+6],c[i+7]+=b[i+7];a.sync(f)}this.syncCount++};return a}(),e=function(){return a("./web_audio_api").getAPI()};c.exports={SoundSystem:d}}),e("cc/client/web_audio_api",function(b,c,d){function e(a){this.sys=a,this.context=new g,this.sampleRate=this.context.sampleRate,this.channels=a.channels}var f;d.exports={getAPI:function(){return f}};var g=a.AudioContext||a.webkitAudioContext;g&&(e.prototype.play=function(){var a,b=this.sys,c=b.strmLength,d=4*c,e=b.strm.buffer;this.sys.sampleRate===this.sampleRate&&(a=function(a){var c=a.outputBuffer;b.process(),c.getChannelData(0).set(new Float32Array(e.slice(0,d))),c.getChannelData(1).set(new Float32Array(e.slice(d)))}),this.bufSrc=this.context.createBufferSource(),this.jsNode=this.context.createJavaScriptNode(c,2,this.channels),this.jsNode.onaudioprocess=a,this.bufSrc.noteOn(0),this.bufSrc.connect(this.jsNode),this.jsNode.connect(this.context.destination)},e.prototype.pause=function(){this.bufSrc.disconnect(),this.jsNode.disconnect()},f=e)}),e("cc/client/compiler",function(b,c,d){var e=function(){if(a.CoffeeScript)return a.CoffeeScript;try{return b(["coffee-script"][0])}catch(c){}}(),f=0,g=1,h={},i=function(a){console.log(a.map(function(a){return a[0]+"	"+a[1]}).join("\n"))},j=function(a){for(var b="";a--;)b+=" ";return b},k=function(a,b){var c=0;for(b-=1;b>0;){var d=a[b-1];if(!d||"."!==d[f])switch(d=a[b],d[f]){case"INDENT":return b+1;case"(":case"[":case"{":c-=1;case"IDENTIFIER":case"NUMBER":case"STRING":case"BOOL":case"REGEX":case"NULL":case"UNDEFINED":if(0===c){if(d=a[b-1]){if("UNARY"===d[f])return b-1;if("+"===d[g]||"-"===d[g]){if(d=a[b-2],!d)return b-1;switch(d[f]){case"INDENT":case"TERMINATOR":case"CALL_START":case"COMPOUND_ASSIGN":case"UNARY":case"LOGIC":case"SHIFT":case"COMPARE":case"=":case"..":case"...":case"[":case"(":case"{":case",":case"?":return b-1}}}return b}break;case"}":case"]":case")":case"CALL_END":c+=1}b-=1}return 0},l=function(a,b){var c=0;for(b+=1;b<a.length;){var d=a[b];switch(d[f]){case"}":case"]":case")":case"CALL_END":c-=1}if(d=a[b+1],!d||"."!==d[f])switch(d=a[b],d[f]){case"TERMINATOR":case"OUTDENT":return b-1;case"IDENTIFIER":if(d=a[b+1],d&&"CALL_START"===d[f]){c+=1;break}if(0===c)return b;break;case"NUMBER":case"STRING":case"BOOL":case"REGEX":case"NULL":case"UNDEFINED":if(0===c)return b;break;case"(":case"[":case"{":c+=1;break;case"}":case"]":case")":case"CALL_END":if(0===c)return b}b+=1}return a.length-1},m=function(a){for(var b=a.length-1;b>=0;){var c,d,e=a[b];"pi"===e[g]&&(a.splice(b,1),e=a[b-1],e&&"NUMBER"===e[f]?(c=k(a,b),a.splice(b,0,["MATH","*",h]),d=b):(c=-1,d=b-1),a.splice(d+1,0,["IDENTIFIER","Math",h]),a.splice(d+2,0,[".",".",h]),a.splice(d+3,0,["IDENTIFIER","PI",h]),-1!==c&&(a.splice(d+4,0,[")",")",h]),a.splice(c,0,["(","(",h]))),b-=1}return a},n=function(a){for(var b=a.length-1;b>=0;){var c=a[b];if("MATH"===c[f]){var d=k(a,b),e=l(a,b)+1;a.splice(e,0,[")",")",h]),a.splice(d,0,["(","(",h])}b-=1}return a},o={"+":"num","-":"neg","!":"not","~":"tilde"},p=function(a){for(var b=a.length-1;b>=0;){var c=a[b],d=o[c[g]];if(d)switch(c=a[b-1]||{0:"TERMINATOR"},c[f]){case"INDENT":case"TERMINATOR":case"CALL_START":case"COMPOUND_ASSIGN":case"UNARY":case"LOGIC":case"SHIFT":case"COMPARE":case"=":case"..":case"...":case"[":case"(":case"{":case",":case"?":case"+":case"-":var e=l(a,b);a.splice(e+1,0,[".",".",h]),a.splice(e+2,0,["IDENTIFIER",d,h]),a.splice(e+3,0,["CALL_START","(",h]),a.splice(e+4,0,["CALL_END",")",h]),a.splice(b,1)}b-=1}return a},q={"+":"__add__","-":"__sub__","*":"__mul__","/":"__div__","%":"__mod__"},r=function(a){for(var b=0,c=!1;b<a.length;){var d=a[b];if(c){var e=q[d[g]];if(e){var i=l(a,b)+1;a.splice(b++,1,[".",".",h]),a.splice(b++,0,["IDENTIFIER",e,h]),a.splice(b,0,["CALL_START","(",h]),a.splice(i+2,0,["CALL_END",")",h]),c=!1;continue}}switch(d[f]){case"INDENT":case"TERMINATOR":case"CALL_START":case"COMPOUND_ASSIGN":case"UNARY":case"LOGIC":case"SHIFT":case"COMPARE":case"=":case"..":case"...":case"[":case"(":case"{":case",":case"?":c=!1;break;default:c=!0}b+=1}return a},s={"+=":"__add__","-=":"__sub__","*=":"__mul__","/=":"__div__","%=":"__mod__"},t=function(a){for(var b=a.length-1;b>=0;){var c=a[b],d=s[c[g]];if(d){var e=k(a,b),f=l(a,b)+1;a[b]=["=","=",h],a.splice(b+1,0,[".",".",h]),a.splice(b+2,0,["IDENTIFIER",d,h]),a.splice(b+3,0,["CALL_START","(",h]),a.splice(f+3,0,["CALL_END",")",h]);for(var i=e;b>i;i++)a.splice(b+1,0,a[i])}b-=1}return a},u=function(a){for(var b=0,c=0;b<a.length;){var d=a[b];if("("===d[f]&&(d=a[b+1],d&&"("===d[f])){c=2;for(var e=b+2;e<a.length;e++)if(d=a[e][f],"("===d&&(c+=1),")"===d&&(c-=1,0===c)){")"===a[e-1][f]&&(a.splice(e,1),a.splice(b,1),b-=1);break}}b+=1}return a},v=function(){function a(){}return a.prototype.tokens=function(a){var b=e.tokens(a);return b=m(b),b=p(b),b=n(b),b=r(b),b=t(b),b=u(b)},a.prototype.compile=function(a){var b=this.tokens(a);return e.nodes(b).compile({bare:!0}).trim()},a.prototype.toString=function(a){var b=0;return"string"==typeof a&&(a=this.tokens(a)),a.map(function(a){switch(a[f]){case"TERMINATOR":return"\n";case"INDENT":return b+=0|a[g],"\n"+j(b);case"OUTDENT":return b-=0|a[g],"\n"+j(b);case",":return a[g]+" ";default:return a[g]}}).join("").trim()},a}();d.exports={Compiler:v,dumpTokens:i,findOperandHead:k,findOperandTail:l,replacePi:m,replacePrecedence:n,replaceBinaryOp:r,replaceUnaryOp:p,replaceCompoundAssign:t,cleanupParenthesis:u}}),e("cc/server/installer",function(a,b,c){var d=function(b){b=b||{},b.register=function(a){/^__.*__$/.test(a)||(b[a]=function(b){if(null!==b&&void 0!==b){var c=b[a];return"function"==typeof c?c.apply(b,Array.prototype.slice.call(arguments,1)):c}return 0})},a("./server").install(b),a("./bop").install(b),a("./uop").install(b),a("./array").install(b),delete b.register};c.exports={install:d}}),e("cc/server/server",function(b,c,d){var e={},f=function(){function a(){this.sysSyncCount=0,this.sysCurrentTime=0,this.syncItems=new Float32Array(6),this.onaudioprocess=this.onaudioprocess.bind(this),this.timerId=0}return a.prototype.send=function(a){postMessage(a)},a.prototype.recv=function(a){if(a){var b=e[a[0]];b&&b.call(this,a)}},a.prototype.onaudioprocess=function(){if(!(this.syncCount-this.sysSyncCount>=4)){for(var a=this.strm,b=0;b<a.length;b++)a[b]=.5*Math.random()-.25;this.syncCount+=1,this.send(a)}},a}();e["/init"]=function(a){this.sampleRate=a[1],this.channels=a[2],this.strmLength=a[3],this.bufLength=a[4],this.syncCount=a[5],this.strm=new Float32Array(this.strmLength*this.channels)},e["/play"]=function(a){0===this.timerId&&(this.timerId=setInterval(this.onaudioprocess,10),this.syncCount=a[1])},e["/pause"]=function(){this.timerId&&(clearInterval(this.timerId),this.timerId=0)},e["/exec"]=function(b){var c=b[1],d=b[2],e=eval.call(a,d);this.send(["/exec",c,JSON.stringify(e)])},e["/loadScript"]=function(a){importScripts(a[1])};var g=function(){var b=new f;addEventListener("message",function(a){var c=a.data;c instanceof Float32Array?(b.sysSyncCount=0|c[0],b.sysCurrentTime=0|c[1],b.syncItems.set(c)):b.recv(c)}),b.send(["/connect"]),"undefined"==typeof a.console&&(a.console=function(){var a={};return["log","debug","info","error"].forEach(function(c){a[c]=function(){b.send(["/console/"+c,Array.prototype.slice.call(arguments)])}}),a}())};d.exports={SynthServer:f,install:g}}),e("cc/server/bop",function(a,b,c){var d=function(a){var b=function(a,b){return function(c){return Array.isArray(c)?c.map(function(b){return this[a](b)},this):b(this,c)}},c=function(a,b){return function(c){return Array.isArray(c)?c.map(function(b){return(+this)[a](b)},this):b(+this,c)}};Object.keys(e).forEach(function(d){var f=e[d];Number.prototype[d]=b(d,f),e[d].array&&(f=e[d]),Array.prototype[d]=function(a){var b=this;return Array.isArray(a)?a.map(function(a,c){return b[c%b.length][d](a)}):b.map(function(b){return b[d](a)})},e[d].bool?(f=e[d],Boolean.prototype[d]=b(d,f)):Boolean.prototype[d]=c(d,f),e[d].str?(f=e[d].str,String.prototype[d]=b(d,f)):String.prototype[d]=c(d,f),a&&a.register&&a.register(d)})},e={};e.__add__=function(a,b){return a+b},e.__add__.str=e.__add__,e.__sub__=function(a,b){return a-b},e.__mul__=function(a,b){return a*b},e.__mul__.str=function(a,b){if("number"==typeof b){for(var c=new Array(Math.max(0,b)),d=0;b>d;d++)c[d]=a;return c.join("")}return a},e.__div__=function(a,b){return a/b},e.__mod__=function(a,b){return a%b},c.exports={install:d}}),e("cc/server/uop",function(a,b,c){var d=function(a){Object.keys(e).forEach(function(b){var c=e[b];Number.prototype[b]=function(){return c(this)},Array.prototype[b]=function(){return this.map(function(a){return a[b]()})},Boolean.prototype[b]=function(){return c(+this)},String.prototype[b]=function(){return c(+this)},a&&a.register&&a.register(b)})},e={};e.num=function(a){return+a},e.neg=function(a){return-a},e.not=function(a){return!a},e.tilde=function(a){return~a},c.exports={install:d}}),e("cc/server/array",function(a,b,c){var d=a("./fn"),e=[].slice,f=function(){var a=e.call(arguments),b=a.reduce(function(a,b){return Math.max(a,Array.isArray(b)?b.length:1)},0),c=new Array(b),d=a.length;if(0===d)c[0]=[];else for(var f=0;b>f;++f)for(var g=c[f]=new Array(d),h=0;d>h;++h)g[h]=Array.isArray(a[h])?a[h][f%a[h].length]:a[h];return c},g=function(a,b,c){for(var d=0,e=a.length;e>d;++d)0>=b||!Array.isArray(a[d])?c.push(a[d]):c=g(a[d],b-1,c);return c},h=d(function(a,b){return Array.isArray(a)?g(a,b,[]):[a]}).defaults("list,level=Infinity").build(),i=function(a,b){for(var c=[],d=[],e=0,f=a.length;f>e;++e)d.push(a[e]),d.length>=b&&(c.push(d),d=[]);return d.length>0&&c.push(d),c},j=d(function(a,b){return Array.isArray(a)?i(a,b):[a]}).defaults("list,groupSize=2").build(),k=function(a){Array.prototype.zip=function(){return f.apply(null,this)},Array.prototype.flatten=d(function(a){return g(this,a,[])}).defaults("level=Infinity").build(),Array.prototype.clump=d(function(a){return i(this,a)}).defaults("groupSize=2").build(),a&&(a.zip=f,a.flatten=h,a.clump=j)};c.exports={install:k,zip:f,flatten:h,clump:j,impl:{zip:f,flatten:g,clump:i}}}),e("cc/server/fn",function(a,b,c){var d=[].slice,e=function(){function a(a){this.func=a,this.def=""}a.prototype.defaults=function(a){return this.def=a,this},a.prototype.build=function(){var a=this.func,c=[],e=[];this.def.split(",").forEach(function(a){a=a.trim().split("="),c.push(a[0].trim()),e.push(a.length>1?+a[1].trim():void 0)});var f=a;return""!==this.def&&(f=function(){return a.apply(this,b(c,e,d.call(arguments)))}),f};var b=function(a,b,c){var d,f=b.slice();if(e.isDictionary(c[c.length-1])){d=c.pop();for(var g in d){var h=a.indexOf(g);-1!==h&&(f[h]=d[g])}}for(var i=0,j=Math.min(c.length,f.length);j>i;++i)f[i]=c[i];return d&&f.length<a.length-1&&f.push(d),f};return function(b){return new a(b)}}();e.extend=function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);return c.prototype=b.prototype,a.prototype=new c,a.__super__=b.prototype,a},e.classmethod=function(){var a=function(a,b){return function(){return this instanceof a?b.apply(this,arguments):b.apply(new a,arguments)}};return function(b){var c=b.classmethods||{};Object.keys(b.prototype).forEach(function(a){"$"===a.charAt(0)&&"function"==typeof b.prototype[a]&&(c[a]=b.prototype[a],delete b.prototype[a])}),Object.keys(c).forEach(function(d){var e=c[d];d=d.substr(1),b[d]=a(b,e),b.prototype[d]=e}),b.classmethods=c}}(),e.isDictionary=function(a){return!(!a||a.constructor!==Object)},c.exports=e}),c("cc/cc","cc/loader")}(this.self||global);
//# sourceMappingURL=coffee-collider-min.map