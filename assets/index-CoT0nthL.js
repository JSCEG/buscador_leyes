(function(){const f=document.createElement("link").relList;if(f&&f.supports&&f.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))e(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&e(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function e(r){if(r.ep)return;r.ep=!0;const n=t(r);fetch(r.href,n)}})();var Rt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function ut(u){return u&&u.__esModule&&Object.prototype.hasOwnProperty.call(u,"default")?u.default:u}var zt={exports:{}};/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.9
 * Copyright (C) 2020 Oliver Nightingale
 * @license MIT
 */(function(u,f){(function(){var t=function(e){var r=new t.Builder;return r.pipeline.add(t.trimmer,t.stopWordFilter,t.stemmer),r.searchPipeline.add(t.stemmer),e.call(r,r),r.build()};t.version="2.3.9";/*!
 * lunr.utils
 * Copyright (C) 2020 Oliver Nightingale
 */t.utils={},t.utils.warn=function(e){return function(r){e.console&&console.warn&&console.warn(r)}}(this),t.utils.asString=function(e){return e==null?"":e.toString()},t.utils.clone=function(e){if(e==null)return e;for(var r=Object.create(null),n=Object.keys(e),o=0;o<n.length;o++){var s=n[o],d=e[s];if(Array.isArray(d)){r[s]=d.slice();continue}if(typeof d=="string"||typeof d=="number"||typeof d=="boolean"){r[s]=d;continue}throw new TypeError("clone is not deep and does not support nested objects")}return r},t.FieldRef=function(e,r,n){this.docRef=e,this.fieldName=r,this._stringValue=n},t.FieldRef.joiner="/",t.FieldRef.fromString=function(e){var r=e.indexOf(t.FieldRef.joiner);if(r===-1)throw"malformed field ref string";var n=e.slice(0,r),o=e.slice(r+1);return new t.FieldRef(o,n,e)},t.FieldRef.prototype.toString=function(){return this._stringValue==null&&(this._stringValue=this.fieldName+t.FieldRef.joiner+this.docRef),this._stringValue};/*!
 * lunr.Set
 * Copyright (C) 2020 Oliver Nightingale
 */t.Set=function(e){if(this.elements=Object.create(null),e){this.length=e.length;for(var r=0;r<this.length;r++)this.elements[e[r]]=!0}else this.length=0},t.Set.complete={intersect:function(e){return e},union:function(){return this},contains:function(){return!0}},t.Set.empty={intersect:function(){return this},union:function(e){return e},contains:function(){return!1}},t.Set.prototype.contains=function(e){return!!this.elements[e]},t.Set.prototype.intersect=function(e){var r,n,o,s=[];if(e===t.Set.complete)return this;if(e===t.Set.empty)return e;this.length<e.length?(r=this,n=e):(r=e,n=this),o=Object.keys(r.elements);for(var d=0;d<o.length;d++){var b=o[d];b in n.elements&&s.push(b)}return new t.Set(s)},t.Set.prototype.union=function(e){return e===t.Set.complete?t.Set.complete:e===t.Set.empty?this:new t.Set(Object.keys(this.elements).concat(Object.keys(e.elements)))},t.idf=function(e,r){var n=0;for(var o in e)o!="_index"&&(n+=Object.keys(e[o]).length);var s=(r-n+.5)/(n+.5);return Math.log(1+Math.abs(s))},t.Token=function(e,r){this.str=e||"",this.metadata=r||{}},t.Token.prototype.toString=function(){return this.str},t.Token.prototype.update=function(e){return this.str=e(this.str,this.metadata),this},t.Token.prototype.clone=function(e){return e=e||function(r){return r},new t.Token(e(this.str,this.metadata),this.metadata)};/*!
 * lunr.tokenizer
 * Copyright (C) 2020 Oliver Nightingale
 */t.tokenizer=function(e,r){if(e==null||e==null)return[];if(Array.isArray(e))return e.map(function(M){return new t.Token(t.utils.asString(M).toLowerCase(),t.utils.clone(r))});for(var n=e.toString().toLowerCase(),o=n.length,s=[],d=0,b=0;d<=o;d++){var k=n.charAt(d),L=d-b;if(k.match(t.tokenizer.separator)||d==o){if(L>0){var A=t.utils.clone(r)||{};A.position=[b,L],A.index=s.length,s.push(new t.Token(n.slice(b,d),A))}b=d+1}}return s},t.tokenizer.separator=/[\s\-]+/;/*!
 * lunr.Pipeline
 * Copyright (C) 2020 Oliver Nightingale
 */t.Pipeline=function(){this._stack=[]},t.Pipeline.registeredFunctions=Object.create(null),t.Pipeline.registerFunction=function(e,r){r in this.registeredFunctions&&t.utils.warn("Overwriting existing registered function: "+r),e.label=r,t.Pipeline.registeredFunctions[e.label]=e},t.Pipeline.warnIfFunctionNotRegistered=function(e){var r=e.label&&e.label in this.registeredFunctions;r||t.utils.warn(`Function is not registered with pipeline. This may cause problems when serialising the index.
`,e)},t.Pipeline.load=function(e){var r=new t.Pipeline;return e.forEach(function(n){var o=t.Pipeline.registeredFunctions[n];if(o)r.add(o);else throw new Error("Cannot load unregistered function: "+n)}),r},t.Pipeline.prototype.add=function(){var e=Array.prototype.slice.call(arguments);e.forEach(function(r){t.Pipeline.warnIfFunctionNotRegistered(r),this._stack.push(r)},this)},t.Pipeline.prototype.after=function(e,r){t.Pipeline.warnIfFunctionNotRegistered(r);var n=this._stack.indexOf(e);if(n==-1)throw new Error("Cannot find existingFn");n=n+1,this._stack.splice(n,0,r)},t.Pipeline.prototype.before=function(e,r){t.Pipeline.warnIfFunctionNotRegistered(r);var n=this._stack.indexOf(e);if(n==-1)throw new Error("Cannot find existingFn");this._stack.splice(n,0,r)},t.Pipeline.prototype.remove=function(e){var r=this._stack.indexOf(e);r!=-1&&this._stack.splice(r,1)},t.Pipeline.prototype.run=function(e){for(var r=this._stack.length,n=0;n<r;n++){for(var o=this._stack[n],s=[],d=0;d<e.length;d++){var b=o(e[d],d,e);if(!(b==null||b===""))if(Array.isArray(b))for(var k=0;k<b.length;k++)s.push(b[k]);else s.push(b)}e=s}return e},t.Pipeline.prototype.runString=function(e,r){var n=new t.Token(e,r);return this.run([n]).map(function(o){return o.toString()})},t.Pipeline.prototype.reset=function(){this._stack=[]},t.Pipeline.prototype.toJSON=function(){return this._stack.map(function(e){return t.Pipeline.warnIfFunctionNotRegistered(e),e.label})};/*!
 * lunr.Vector
 * Copyright (C) 2020 Oliver Nightingale
 */t.Vector=function(e){this._magnitude=0,this.elements=e||[]},t.Vector.prototype.positionForIndex=function(e){if(this.elements.length==0)return 0;for(var r=0,n=this.elements.length/2,o=n-r,s=Math.floor(o/2),d=this.elements[s*2];o>1&&(d<e&&(r=s),d>e&&(n=s),d!=e);)o=n-r,s=r+Math.floor(o/2),d=this.elements[s*2];if(d==e||d>e)return s*2;if(d<e)return(s+1)*2},t.Vector.prototype.insert=function(e,r){this.upsert(e,r,function(){throw"duplicate index"})},t.Vector.prototype.upsert=function(e,r,n){this._magnitude=0;var o=this.positionForIndex(e);this.elements[o]==e?this.elements[o+1]=n(this.elements[o+1],r):this.elements.splice(o,0,e,r)},t.Vector.prototype.magnitude=function(){if(this._magnitude)return this._magnitude;for(var e=0,r=this.elements.length,n=1;n<r;n+=2){var o=this.elements[n];e+=o*o}return this._magnitude=Math.sqrt(e)},t.Vector.prototype.dot=function(e){for(var r=0,n=this.elements,o=e.elements,s=n.length,d=o.length,b=0,k=0,L=0,A=0;L<s&&A<d;)b=n[L],k=o[A],b<k?L+=2:b>k?A+=2:b==k&&(r+=n[L+1]*o[A+1],L+=2,A+=2);return r},t.Vector.prototype.similarity=function(e){return this.dot(e)/this.magnitude()||0},t.Vector.prototype.toArray=function(){for(var e=new Array(this.elements.length/2),r=1,n=0;r<this.elements.length;r+=2,n++)e[n]=this.elements[r];return e},t.Vector.prototype.toJSON=function(){return this.elements};/*!
 * lunr.stemmer
 * Copyright (C) 2020 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */t.stemmer=function(){var e={ational:"ate",tional:"tion",enci:"ence",anci:"ance",izer:"ize",bli:"ble",alli:"al",entli:"ent",eli:"e",ousli:"ous",ization:"ize",ation:"ate",ator:"ate",alism:"al",iveness:"ive",fulness:"ful",ousness:"ous",aliti:"al",iviti:"ive",biliti:"ble",logi:"log"},r={icate:"ic",ative:"",alize:"al",iciti:"ic",ical:"ic",ful:"",ness:""},n="[^aeiou]",o="[aeiouy]",s=n+"[^aeiouy]*",d=o+"[aeiou]*",b="^("+s+")?"+d+s,k="^("+s+")?"+d+s+"("+d+")?$",L="^("+s+")?"+d+s+d+s,A="^("+s+")?"+o,M=new RegExp(b),P=new RegExp(L),F=new RegExp(k),T=new RegExp(A),R=/^(.+?)(ss|i)es$/,j=/^(.+?)([^s])s$/,N=/^(.+?)eed$/,J=/^(.+?)(ed|ing)$/,i=/.$/,ae=/(at|bl|iz)$/,ce=new RegExp("([^aeiouylsz])\\1$"),ue=new RegExp("^"+s+o+"[^aeiouwxy]$"),de=/^(.+?[^aeiou])y$/,ne=/^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/,U=/^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/,q=/^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/,Le=/^(.+?)(s|t)(ion)$/,Y=/^(.+?)e$/,Se=/ll$/,xe=new RegExp("^"+s+o+"[^aeiouwxy]$"),pe=function($){var Q,Z,I,_,O,H,fe;if($.length<3)return $;if(I=$.substr(0,1),I=="y"&&($=I.toUpperCase()+$.substr(1)),_=R,O=j,_.test($)?$=$.replace(_,"$1$2"):O.test($)&&($=$.replace(O,"$1$2")),_=N,O=J,_.test($)){var X=_.exec($);_=M,_.test(X[1])&&(_=i,$=$.replace(_,""))}else if(O.test($)){var X=O.exec($);Q=X[1],O=T,O.test(Q)&&($=Q,O=ae,H=ce,fe=ue,O.test($)?$=$+"e":H.test($)?(_=i,$=$.replace(_,"")):fe.test($)&&($=$+"e"))}if(_=de,_.test($)){var X=_.exec($);Q=X[1],$=Q+"i"}if(_=ne,_.test($)){var X=_.exec($);Q=X[1],Z=X[2],_=M,_.test(Q)&&($=Q+e[Z])}if(_=U,_.test($)){var X=_.exec($);Q=X[1],Z=X[2],_=M,_.test(Q)&&($=Q+r[Z])}if(_=q,O=Le,_.test($)){var X=_.exec($);Q=X[1],_=P,_.test(Q)&&($=Q)}else if(O.test($)){var X=O.exec($);Q=X[1]+X[2],O=P,O.test(Q)&&($=Q)}if(_=Y,_.test($)){var X=_.exec($);Q=X[1],_=P,O=F,H=xe,(_.test(Q)||O.test(Q)&&!H.test(Q))&&($=Q)}return _=Se,O=P,_.test($)&&O.test($)&&(_=i,$=$.replace(_,"")),I=="y"&&($=I.toLowerCase()+$.substr(1)),$};return function(me){return me.update(pe)}}(),t.Pipeline.registerFunction(t.stemmer,"stemmer");/*!
 * lunr.stopWordFilter
 * Copyright (C) 2020 Oliver Nightingale
 */t.generateStopWordFilter=function(e){var r=e.reduce(function(n,o){return n[o]=o,n},{});return function(n){if(n&&r[n.toString()]!==n.toString())return n}},t.stopWordFilter=t.generateStopWordFilter(["a","able","about","across","after","all","almost","also","am","among","an","and","any","are","as","at","be","because","been","but","by","can","cannot","could","dear","did","do","does","either","else","ever","every","for","from","get","got","had","has","have","he","her","hers","him","his","how","however","i","if","in","into","is","it","its","just","least","let","like","likely","may","me","might","most","must","my","neither","no","nor","not","of","off","often","on","only","or","other","our","own","rather","said","say","says","she","should","since","so","some","than","that","the","their","them","then","there","these","they","this","tis","to","too","twas","us","wants","was","we","were","what","when","where","which","while","who","whom","why","will","with","would","yet","you","your"]),t.Pipeline.registerFunction(t.stopWordFilter,"stopWordFilter");/*!
 * lunr.trimmer
 * Copyright (C) 2020 Oliver Nightingale
 */t.trimmer=function(e){return e.update(function(r){return r.replace(/^\W+/,"").replace(/\W+$/,"")})},t.Pipeline.registerFunction(t.trimmer,"trimmer");/*!
 * lunr.TokenSet
 * Copyright (C) 2020 Oliver Nightingale
 */t.TokenSet=function(){this.final=!1,this.edges={},this.id=t.TokenSet._nextId,t.TokenSet._nextId+=1},t.TokenSet._nextId=1,t.TokenSet.fromArray=function(e){for(var r=new t.TokenSet.Builder,n=0,o=e.length;n<o;n++)r.insert(e[n]);return r.finish(),r.root},t.TokenSet.fromClause=function(e){return"editDistance"in e?t.TokenSet.fromFuzzyString(e.term,e.editDistance):t.TokenSet.fromString(e.term)},t.TokenSet.fromFuzzyString=function(e,r){for(var n=new t.TokenSet,o=[{node:n,editsRemaining:r,str:e}];o.length;){var s=o.pop();if(s.str.length>0){var d=s.str.charAt(0),b;d in s.node.edges?b=s.node.edges[d]:(b=new t.TokenSet,s.node.edges[d]=b),s.str.length==1&&(b.final=!0),o.push({node:b,editsRemaining:s.editsRemaining,str:s.str.slice(1)})}if(s.editsRemaining!=0){if("*"in s.node.edges)var k=s.node.edges["*"];else{var k=new t.TokenSet;s.node.edges["*"]=k}if(s.str.length==0&&(k.final=!0),o.push({node:k,editsRemaining:s.editsRemaining-1,str:s.str}),s.str.length>1&&o.push({node:s.node,editsRemaining:s.editsRemaining-1,str:s.str.slice(1)}),s.str.length==1&&(s.node.final=!0),s.str.length>=1){if("*"in s.node.edges)var L=s.node.edges["*"];else{var L=new t.TokenSet;s.node.edges["*"]=L}s.str.length==1&&(L.final=!0),o.push({node:L,editsRemaining:s.editsRemaining-1,str:s.str.slice(1)})}if(s.str.length>1){var A=s.str.charAt(0),M=s.str.charAt(1),P;M in s.node.edges?P=s.node.edges[M]:(P=new t.TokenSet,s.node.edges[M]=P),s.str.length==1&&(P.final=!0),o.push({node:P,editsRemaining:s.editsRemaining-1,str:A+s.str.slice(2)})}}}return n},t.TokenSet.fromString=function(e){for(var r=new t.TokenSet,n=r,o=0,s=e.length;o<s;o++){var d=e[o],b=o==s-1;if(d=="*")r.edges[d]=r,r.final=b;else{var k=new t.TokenSet;k.final=b,r.edges[d]=k,r=k}}return n},t.TokenSet.prototype.toArray=function(){for(var e=[],r=[{prefix:"",node:this}];r.length;){var n=r.pop(),o=Object.keys(n.node.edges),s=o.length;n.node.final&&(n.prefix.charAt(0),e.push(n.prefix));for(var d=0;d<s;d++){var b=o[d];r.push({prefix:n.prefix.concat(b),node:n.node.edges[b]})}}return e},t.TokenSet.prototype.toString=function(){if(this._str)return this._str;for(var e=this.final?"1":"0",r=Object.keys(this.edges).sort(),n=r.length,o=0;o<n;o++){var s=r[o],d=this.edges[s];e=e+s+d.id}return e},t.TokenSet.prototype.intersect=function(e){for(var r=new t.TokenSet,n=void 0,o=[{qNode:e,output:r,node:this}];o.length;){n=o.pop();for(var s=Object.keys(n.qNode.edges),d=s.length,b=Object.keys(n.node.edges),k=b.length,L=0;L<d;L++)for(var A=s[L],M=0;M<k;M++){var P=b[M];if(P==A||A=="*"){var F=n.node.edges[P],T=n.qNode.edges[A],R=F.final&&T.final,j=void 0;P in n.output.edges?(j=n.output.edges[P],j.final=j.final||R):(j=new t.TokenSet,j.final=R,n.output.edges[P]=j),o.push({qNode:T,output:j,node:F})}}}return r},t.TokenSet.Builder=function(){this.previousWord="",this.root=new t.TokenSet,this.uncheckedNodes=[],this.minimizedNodes={}},t.TokenSet.Builder.prototype.insert=function(e){var r,n=0;if(e<this.previousWord)throw new Error("Out of order word insertion");for(var o=0;o<e.length&&o<this.previousWord.length&&e[o]==this.previousWord[o];o++)n++;this.minimize(n),this.uncheckedNodes.length==0?r=this.root:r=this.uncheckedNodes[this.uncheckedNodes.length-1].child;for(var o=n;o<e.length;o++){var s=new t.TokenSet,d=e[o];r.edges[d]=s,this.uncheckedNodes.push({parent:r,char:d,child:s}),r=s}r.final=!0,this.previousWord=e},t.TokenSet.Builder.prototype.finish=function(){this.minimize(0)},t.TokenSet.Builder.prototype.minimize=function(e){for(var r=this.uncheckedNodes.length-1;r>=e;r--){var n=this.uncheckedNodes[r],o=n.child.toString();o in this.minimizedNodes?n.parent.edges[n.char]=this.minimizedNodes[o]:(n.child._str=o,this.minimizedNodes[o]=n.child),this.uncheckedNodes.pop()}};/*!
 * lunr.Index
 * Copyright (C) 2020 Oliver Nightingale
 */t.Index=function(e){this.invertedIndex=e.invertedIndex,this.fieldVectors=e.fieldVectors,this.tokenSet=e.tokenSet,this.fields=e.fields,this.pipeline=e.pipeline},t.Index.prototype.search=function(e){return this.query(function(r){var n=new t.QueryParser(e,r);n.parse()})},t.Index.prototype.query=function(e){for(var r=new t.Query(this.fields),n=Object.create(null),o=Object.create(null),s=Object.create(null),d=Object.create(null),b=Object.create(null),k=0;k<this.fields.length;k++)o[this.fields[k]]=new t.Vector;e.call(r,r);for(var k=0;k<r.clauses.length;k++){var L=r.clauses[k],A=null,M=t.Set.empty;L.usePipeline?A=this.pipeline.runString(L.term,{fields:L.fields}):A=[L.term];for(var P=0;P<A.length;P++){var F=A[P];L.term=F;var T=t.TokenSet.fromClause(L),R=this.tokenSet.intersect(T).toArray();if(R.length===0&&L.presence===t.Query.presence.REQUIRED){for(var j=0;j<L.fields.length;j++){var N=L.fields[j];d[N]=t.Set.empty}break}for(var J=0;J<R.length;J++)for(var i=R[J],ae=this.invertedIndex[i],ce=ae._index,j=0;j<L.fields.length;j++){var N=L.fields[j],ue=ae[N],de=Object.keys(ue),ne=i+"/"+N,U=new t.Set(de);if(L.presence==t.Query.presence.REQUIRED&&(M=M.union(U),d[N]===void 0&&(d[N]=t.Set.complete)),L.presence==t.Query.presence.PROHIBITED){b[N]===void 0&&(b[N]=t.Set.empty),b[N]=b[N].union(U);continue}if(o[N].upsert(ce,L.boost,function(Ie,Pe){return Ie+Pe}),!s[ne]){for(var q=0;q<de.length;q++){var Le=de[q],Y=new t.FieldRef(Le,N),Se=ue[Le],xe;(xe=n[Y])===void 0?n[Y]=new t.MatchData(i,N,Se):xe.add(i,N,Se)}s[ne]=!0}}}if(L.presence===t.Query.presence.REQUIRED)for(var j=0;j<L.fields.length;j++){var N=L.fields[j];d[N]=d[N].intersect(M)}}for(var pe=t.Set.complete,me=t.Set.empty,k=0;k<this.fields.length;k++){var N=this.fields[k];d[N]&&(pe=pe.intersect(d[N])),b[N]&&(me=me.union(b[N]))}var $=Object.keys(n),Q=[],Z=Object.create(null);if(r.isNegated()){$=Object.keys(this.fieldVectors);for(var k=0;k<$.length;k++){var Y=$[k],I=t.FieldRef.fromString(Y);n[Y]=new t.MatchData}}for(var k=0;k<$.length;k++){var I=t.FieldRef.fromString($[k]),_=I.docRef;if(pe.contains(_)&&!me.contains(_)){var O=this.fieldVectors[I],H=o[I.fieldName].similarity(O),fe;if((fe=Z[_])!==void 0)fe.score+=H,fe.matchData.combine(n[I]);else{var X={ref:_,score:H,matchData:n[I]};Z[_]=X,Q.push(X)}}}return Q.sort(function(ye,je){return je.score-ye.score})},t.Index.prototype.toJSON=function(){var e=Object.keys(this.invertedIndex).sort().map(function(n){return[n,this.invertedIndex[n]]},this),r=Object.keys(this.fieldVectors).map(function(n){return[n,this.fieldVectors[n].toJSON()]},this);return{version:t.version,fields:this.fields,fieldVectors:r,invertedIndex:e,pipeline:this.pipeline.toJSON()}},t.Index.load=function(e){var r={},n={},o=e.fieldVectors,s=Object.create(null),d=e.invertedIndex,b=new t.TokenSet.Builder,k=t.Pipeline.load(e.pipeline);e.version!=t.version&&t.utils.warn("Version mismatch when loading serialised index. Current version of lunr '"+t.version+"' does not match serialized index '"+e.version+"'");for(var L=0;L<o.length;L++){var A=o[L],M=A[0],P=A[1];n[M]=new t.Vector(P)}for(var L=0;L<d.length;L++){var A=d[L],F=A[0],T=A[1];b.insert(F),s[F]=T}return b.finish(),r.fields=e.fields,r.fieldVectors=n,r.invertedIndex=s,r.tokenSet=b.root,r.pipeline=k,new t.Index(r)};/*!
 * lunr.Builder
 * Copyright (C) 2020 Oliver Nightingale
 */t.Builder=function(){this._ref="id",this._fields=Object.create(null),this._documents=Object.create(null),this.invertedIndex=Object.create(null),this.fieldTermFrequencies={},this.fieldLengths={},this.tokenizer=t.tokenizer,this.pipeline=new t.Pipeline,this.searchPipeline=new t.Pipeline,this.documentCount=0,this._b=.75,this._k1=1.2,this.termIndex=0,this.metadataWhitelist=[]},t.Builder.prototype.ref=function(e){this._ref=e},t.Builder.prototype.field=function(e,r){if(/\//.test(e))throw new RangeError("Field '"+e+"' contains illegal character '/'");this._fields[e]=r||{}},t.Builder.prototype.b=function(e){e<0?this._b=0:e>1?this._b=1:this._b=e},t.Builder.prototype.k1=function(e){this._k1=e},t.Builder.prototype.add=function(e,r){var n=e[this._ref],o=Object.keys(this._fields);this._documents[n]=r||{},this.documentCount+=1;for(var s=0;s<o.length;s++){var d=o[s],b=this._fields[d].extractor,k=b?b(e):e[d],L=this.tokenizer(k,{fields:[d]}),A=this.pipeline.run(L),M=new t.FieldRef(n,d),P=Object.create(null);this.fieldTermFrequencies[M]=P,this.fieldLengths[M]=0,this.fieldLengths[M]+=A.length;for(var F=0;F<A.length;F++){var T=A[F];if(P[T]==null&&(P[T]=0),P[T]+=1,this.invertedIndex[T]==null){var R=Object.create(null);R._index=this.termIndex,this.termIndex+=1;for(var j=0;j<o.length;j++)R[o[j]]=Object.create(null);this.invertedIndex[T]=R}this.invertedIndex[T][d][n]==null&&(this.invertedIndex[T][d][n]=Object.create(null));for(var N=0;N<this.metadataWhitelist.length;N++){var J=this.metadataWhitelist[N],i=T.metadata[J];this.invertedIndex[T][d][n][J]==null&&(this.invertedIndex[T][d][n][J]=[]),this.invertedIndex[T][d][n][J].push(i)}}}},t.Builder.prototype.calculateAverageFieldLengths=function(){for(var e=Object.keys(this.fieldLengths),r=e.length,n={},o={},s=0;s<r;s++){var d=t.FieldRef.fromString(e[s]),b=d.fieldName;o[b]||(o[b]=0),o[b]+=1,n[b]||(n[b]=0),n[b]+=this.fieldLengths[d]}for(var k=Object.keys(this._fields),s=0;s<k.length;s++){var L=k[s];n[L]=n[L]/o[L]}this.averageFieldLength=n},t.Builder.prototype.createFieldVectors=function(){for(var e={},r=Object.keys(this.fieldTermFrequencies),n=r.length,o=Object.create(null),s=0;s<n;s++){for(var d=t.FieldRef.fromString(r[s]),b=d.fieldName,k=this.fieldLengths[d],L=new t.Vector,A=this.fieldTermFrequencies[d],M=Object.keys(A),P=M.length,F=this._fields[b].boost||1,T=this._documents[d.docRef].boost||1,R=0;R<P;R++){var j=M[R],N=A[j],J=this.invertedIndex[j]._index,i,ae,ce;o[j]===void 0?(i=t.idf(this.invertedIndex[j],this.documentCount),o[j]=i):i=o[j],ae=i*((this._k1+1)*N)/(this._k1*(1-this._b+this._b*(k/this.averageFieldLength[b]))+N),ae*=F,ae*=T,ce=Math.round(ae*1e3)/1e3,L.insert(J,ce)}e[d]=L}this.fieldVectors=e},t.Builder.prototype.createTokenSet=function(){this.tokenSet=t.TokenSet.fromArray(Object.keys(this.invertedIndex).sort())},t.Builder.prototype.build=function(){return this.calculateAverageFieldLengths(),this.createFieldVectors(),this.createTokenSet(),new t.Index({invertedIndex:this.invertedIndex,fieldVectors:this.fieldVectors,tokenSet:this.tokenSet,fields:Object.keys(this._fields),pipeline:this.searchPipeline})},t.Builder.prototype.use=function(e){var r=Array.prototype.slice.call(arguments,1);r.unshift(this),e.apply(this,r)},t.MatchData=function(e,r,n){for(var o=Object.create(null),s=Object.keys(n||{}),d=0;d<s.length;d++){var b=s[d];o[b]=n[b].slice()}this.metadata=Object.create(null),e!==void 0&&(this.metadata[e]=Object.create(null),this.metadata[e][r]=o)},t.MatchData.prototype.combine=function(e){for(var r=Object.keys(e.metadata),n=0;n<r.length;n++){var o=r[n],s=Object.keys(e.metadata[o]);this.metadata[o]==null&&(this.metadata[o]=Object.create(null));for(var d=0;d<s.length;d++){var b=s[d],k=Object.keys(e.metadata[o][b]);this.metadata[o][b]==null&&(this.metadata[o][b]=Object.create(null));for(var L=0;L<k.length;L++){var A=k[L];this.metadata[o][b][A]==null?this.metadata[o][b][A]=e.metadata[o][b][A]:this.metadata[o][b][A]=this.metadata[o][b][A].concat(e.metadata[o][b][A])}}}},t.MatchData.prototype.add=function(e,r,n){if(!(e in this.metadata)){this.metadata[e]=Object.create(null),this.metadata[e][r]=n;return}if(!(r in this.metadata[e])){this.metadata[e][r]=n;return}for(var o=Object.keys(n),s=0;s<o.length;s++){var d=o[s];d in this.metadata[e][r]?this.metadata[e][r][d]=this.metadata[e][r][d].concat(n[d]):this.metadata[e][r][d]=n[d]}},t.Query=function(e){this.clauses=[],this.allFields=e},t.Query.wildcard=new String("*"),t.Query.wildcard.NONE=0,t.Query.wildcard.LEADING=1,t.Query.wildcard.TRAILING=2,t.Query.presence={OPTIONAL:1,REQUIRED:2,PROHIBITED:3},t.Query.prototype.clause=function(e){return"fields"in e||(e.fields=this.allFields),"boost"in e||(e.boost=1),"usePipeline"in e||(e.usePipeline=!0),"wildcard"in e||(e.wildcard=t.Query.wildcard.NONE),e.wildcard&t.Query.wildcard.LEADING&&e.term.charAt(0)!=t.Query.wildcard&&(e.term="*"+e.term),e.wildcard&t.Query.wildcard.TRAILING&&e.term.slice(-1)!=t.Query.wildcard&&(e.term=""+e.term+"*"),"presence"in e||(e.presence=t.Query.presence.OPTIONAL),this.clauses.push(e),this},t.Query.prototype.isNegated=function(){for(var e=0;e<this.clauses.length;e++)if(this.clauses[e].presence!=t.Query.presence.PROHIBITED)return!1;return!0},t.Query.prototype.term=function(e,r){if(Array.isArray(e))return e.forEach(function(o){this.term(o,t.utils.clone(r))},this),this;var n=r||{};return n.term=e.toString(),this.clause(n),this},t.QueryParseError=function(e,r,n){this.name="QueryParseError",this.message=e,this.start=r,this.end=n},t.QueryParseError.prototype=new Error,t.QueryLexer=function(e){this.lexemes=[],this.str=e,this.length=e.length,this.pos=0,this.start=0,this.escapeCharPositions=[]},t.QueryLexer.prototype.run=function(){for(var e=t.QueryLexer.lexText;e;)e=e(this)},t.QueryLexer.prototype.sliceString=function(){for(var e=[],r=this.start,n=this.pos,o=0;o<this.escapeCharPositions.length;o++)n=this.escapeCharPositions[o],e.push(this.str.slice(r,n)),r=n+1;return e.push(this.str.slice(r,this.pos)),this.escapeCharPositions.length=0,e.join("")},t.QueryLexer.prototype.emit=function(e){this.lexemes.push({type:e,str:this.sliceString(),start:this.start,end:this.pos}),this.start=this.pos},t.QueryLexer.prototype.escapeCharacter=function(){this.escapeCharPositions.push(this.pos-1),this.pos+=1},t.QueryLexer.prototype.next=function(){if(this.pos>=this.length)return t.QueryLexer.EOS;var e=this.str.charAt(this.pos);return this.pos+=1,e},t.QueryLexer.prototype.width=function(){return this.pos-this.start},t.QueryLexer.prototype.ignore=function(){this.start==this.pos&&(this.pos+=1),this.start=this.pos},t.QueryLexer.prototype.backup=function(){this.pos-=1},t.QueryLexer.prototype.acceptDigitRun=function(){var e,r;do e=this.next(),r=e.charCodeAt(0);while(r>47&&r<58);e!=t.QueryLexer.EOS&&this.backup()},t.QueryLexer.prototype.more=function(){return this.pos<this.length},t.QueryLexer.EOS="EOS",t.QueryLexer.FIELD="FIELD",t.QueryLexer.TERM="TERM",t.QueryLexer.EDIT_DISTANCE="EDIT_DISTANCE",t.QueryLexer.BOOST="BOOST",t.QueryLexer.PRESENCE="PRESENCE",t.QueryLexer.lexField=function(e){return e.backup(),e.emit(t.QueryLexer.FIELD),e.ignore(),t.QueryLexer.lexText},t.QueryLexer.lexTerm=function(e){if(e.width()>1&&(e.backup(),e.emit(t.QueryLexer.TERM)),e.ignore(),e.more())return t.QueryLexer.lexText},t.QueryLexer.lexEditDistance=function(e){return e.ignore(),e.acceptDigitRun(),e.emit(t.QueryLexer.EDIT_DISTANCE),t.QueryLexer.lexText},t.QueryLexer.lexBoost=function(e){return e.ignore(),e.acceptDigitRun(),e.emit(t.QueryLexer.BOOST),t.QueryLexer.lexText},t.QueryLexer.lexEOS=function(e){e.width()>0&&e.emit(t.QueryLexer.TERM)},t.QueryLexer.termSeparator=t.tokenizer.separator,t.QueryLexer.lexText=function(e){for(;;){var r=e.next();if(r==t.QueryLexer.EOS)return t.QueryLexer.lexEOS;if(r.charCodeAt(0)==92){e.escapeCharacter();continue}if(r==":")return t.QueryLexer.lexField;if(r=="~")return e.backup(),e.width()>0&&e.emit(t.QueryLexer.TERM),t.QueryLexer.lexEditDistance;if(r=="^")return e.backup(),e.width()>0&&e.emit(t.QueryLexer.TERM),t.QueryLexer.lexBoost;if(r=="+"&&e.width()===1||r=="-"&&e.width()===1)return e.emit(t.QueryLexer.PRESENCE),t.QueryLexer.lexText;if(r.match(t.QueryLexer.termSeparator))return t.QueryLexer.lexTerm}},t.QueryParser=function(e,r){this.lexer=new t.QueryLexer(e),this.query=r,this.currentClause={},this.lexemeIdx=0},t.QueryParser.prototype.parse=function(){this.lexer.run(),this.lexemes=this.lexer.lexemes;for(var e=t.QueryParser.parseClause;e;)e=e(this);return this.query},t.QueryParser.prototype.peekLexeme=function(){return this.lexemes[this.lexemeIdx]},t.QueryParser.prototype.consumeLexeme=function(){var e=this.peekLexeme();return this.lexemeIdx+=1,e},t.QueryParser.prototype.nextClause=function(){var e=this.currentClause;this.query.clause(e),this.currentClause={}},t.QueryParser.parseClause=function(e){var r=e.peekLexeme();if(r!=null)switch(r.type){case t.QueryLexer.PRESENCE:return t.QueryParser.parsePresence;case t.QueryLexer.FIELD:return t.QueryParser.parseField;case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var n="expected either a field or a term, found "+r.type;throw r.str.length>=1&&(n+=" with value '"+r.str+"'"),new t.QueryParseError(n,r.start,r.end)}},t.QueryParser.parsePresence=function(e){var r=e.consumeLexeme();if(r!=null){switch(r.str){case"-":e.currentClause.presence=t.Query.presence.PROHIBITED;break;case"+":e.currentClause.presence=t.Query.presence.REQUIRED;break;default:var n="unrecognised presence operator'"+r.str+"'";throw new t.QueryParseError(n,r.start,r.end)}var o=e.peekLexeme();if(o==null){var n="expecting term or field, found nothing";throw new t.QueryParseError(n,r.start,r.end)}switch(o.type){case t.QueryLexer.FIELD:return t.QueryParser.parseField;case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var n="expecting term or field, found '"+o.type+"'";throw new t.QueryParseError(n,o.start,o.end)}}},t.QueryParser.parseField=function(e){var r=e.consumeLexeme();if(r!=null){if(e.query.allFields.indexOf(r.str)==-1){var n=e.query.allFields.map(function(d){return"'"+d+"'"}).join(", "),o="unrecognised field '"+r.str+"', possible fields: "+n;throw new t.QueryParseError(o,r.start,r.end)}e.currentClause.fields=[r.str];var s=e.peekLexeme();if(s==null){var o="expecting term, found nothing";throw new t.QueryParseError(o,r.start,r.end)}switch(s.type){case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var o="expecting term, found '"+s.type+"'";throw new t.QueryParseError(o,s.start,s.end)}}},t.QueryParser.parseTerm=function(e){var r=e.consumeLexeme();if(r!=null){e.currentClause.term=r.str.toLowerCase(),r.str.indexOf("*")!=-1&&(e.currentClause.usePipeline=!1);var n=e.peekLexeme();if(n==null){e.nextClause();return}switch(n.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var o="Unexpected lexeme type '"+n.type+"'";throw new t.QueryParseError(o,n.start,n.end)}}},t.QueryParser.parseEditDistance=function(e){var r=e.consumeLexeme();if(r!=null){var n=parseInt(r.str,10);if(isNaN(n)){var o="edit distance must be numeric";throw new t.QueryParseError(o,r.start,r.end)}e.currentClause.editDistance=n;var s=e.peekLexeme();if(s==null){e.nextClause();return}switch(s.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var o="Unexpected lexeme type '"+s.type+"'";throw new t.QueryParseError(o,s.start,s.end)}}},t.QueryParser.parseBoost=function(e){var r=e.consumeLexeme();if(r!=null){var n=parseInt(r.str,10);if(isNaN(n)){var o="boost must be numeric";throw new t.QueryParseError(o,r.start,r.end)}e.currentClause.boost=n;var s=e.peekLexeme();if(s==null){e.nextClause();return}switch(s.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var o="Unexpected lexeme type '"+s.type+"'";throw new t.QueryParseError(o,s.start,s.end)}}},function(e,r){u.exports=r()}(this,function(){return t})})()})(zt);var rr=zt.exports;const qe=ut(rr);var Ft={exports:{}};/*!
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */(function(u,f){(function(t,e){u.exports=e()})(Rt,function(){return function(t){t.stemmerSupport={Among:function(e,r,n,o){if(this.toCharArray=function(s){for(var d=s.length,b=new Array(d),k=0;k<d;k++)b[k]=s.charCodeAt(k);return b},!e&&e!=""||!r&&r!=0||!n)throw"Bad Among initialisation: s:"+e+", substring_i: "+r+", result: "+n;this.s_size=e.length,this.s=this.toCharArray(e),this.substring_i=r,this.result=n,this.method=o},SnowballProgram:function(){var e;return{bra:0,ket:0,limit:0,cursor:0,limit_backward:0,setCurrent:function(r){e=r,this.cursor=0,this.limit=r.length,this.limit_backward=0,this.bra=this.cursor,this.ket=this.limit},getCurrent:function(){var r=e;return e=null,r},in_grouping:function(r,n,o){if(this.cursor<this.limit){var s=e.charCodeAt(this.cursor);if(s<=o&&s>=n&&(s-=n,r[s>>3]&1<<(s&7)))return this.cursor++,!0}return!1},in_grouping_b:function(r,n,o){if(this.cursor>this.limit_backward){var s=e.charCodeAt(this.cursor-1);if(s<=o&&s>=n&&(s-=n,r[s>>3]&1<<(s&7)))return this.cursor--,!0}return!1},out_grouping:function(r,n,o){if(this.cursor<this.limit){var s=e.charCodeAt(this.cursor);if(s>o||s<n)return this.cursor++,!0;if(s-=n,!(r[s>>3]&1<<(s&7)))return this.cursor++,!0}return!1},out_grouping_b:function(r,n,o){if(this.cursor>this.limit_backward){var s=e.charCodeAt(this.cursor-1);if(s>o||s<n)return this.cursor--,!0;if(s-=n,!(r[s>>3]&1<<(s&7)))return this.cursor--,!0}return!1},eq_s:function(r,n){if(this.limit-this.cursor<r)return!1;for(var o=0;o<r;o++)if(e.charCodeAt(this.cursor+o)!=n.charCodeAt(o))return!1;return this.cursor+=r,!0},eq_s_b:function(r,n){if(this.cursor-this.limit_backward<r)return!1;for(var o=0;o<r;o++)if(e.charCodeAt(this.cursor-r+o)!=n.charCodeAt(o))return!1;return this.cursor-=r,!0},find_among:function(r,n){for(var o=0,s=n,d=this.cursor,b=this.limit,k=0,L=0,A=!1;;){for(var M=o+(s-o>>1),P=0,F=k<L?k:L,T=r[M],R=F;R<T.s_size;R++){if(d+F==b){P=-1;break}if(P=e.charCodeAt(d+F)-T.s[R],P)break;F++}if(P<0?(s=M,L=F):(o=M,k=F),s-o<=1){if(o>0||s==o||A)break;A=!0}}for(;;){var T=r[o];if(k>=T.s_size){if(this.cursor=d+T.s_size,!T.method)return T.result;var j=T.method();if(this.cursor=d+T.s_size,j)return T.result}if(o=T.substring_i,o<0)return 0}},find_among_b:function(r,n){for(var o=0,s=n,d=this.cursor,b=this.limit_backward,k=0,L=0,A=!1;;){for(var M=o+(s-o>>1),P=0,F=k<L?k:L,T=r[M],R=T.s_size-1-F;R>=0;R--){if(d-F==b){P=-1;break}if(P=e.charCodeAt(d-1-F)-T.s[R],P)break;F++}if(P<0?(s=M,L=F):(o=M,k=F),s-o<=1){if(o>0||s==o||A)break;A=!0}}for(;;){var T=r[o];if(k>=T.s_size){if(this.cursor=d-T.s_size,!T.method)return T.result;var j=T.method();if(this.cursor=d-T.s_size,j)return T.result}if(o=T.substring_i,o<0)return 0}},replace_s:function(r,n,o){var s=o.length-(n-r),d=e.substring(0,r),b=e.substring(n);return e=d+o+b,this.limit+=s,this.cursor>=n?this.cursor+=s:this.cursor>r&&(this.cursor=r),s},slice_check:function(){if(this.bra<0||this.bra>this.ket||this.ket>this.limit||this.limit>e.length)throw"faulty slice operation"},slice_from:function(r){this.slice_check(),this.replace_s(this.bra,this.ket,r)},slice_del:function(){this.slice_from("")},insert:function(r,n,o){var s=this.replace_s(r,n,o);r<=this.bra&&(this.bra+=s),r<=this.ket&&(this.ket+=s)},slice_to:function(){return this.slice_check(),e.substring(this.bra,this.ket)},eq_v_b:function(r){return this.eq_s_b(r.length,r)}}}},t.trimmerSupport={generateTrimmer:function(e){var r=new RegExp("^[^"+e+"]+"),n=new RegExp("[^"+e+"]+$");return function(o){return typeof o.update=="function"?o.update(function(s){return s.replace(r,"").replace(n,"")}):o.replace(r,"").replace(n,"")}}}}})})(Ft);var ar=Ft.exports;const nr=ut(ar);var Ot={exports:{}};/*!
 * Lunr languages, `Spanish` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2014, Mihai Valentin
 * http://www.mozilla.org/MPL/
 */(function(u,f){(function(t,e){u.exports=e()})(Rt,function(){return function(t){if(typeof t>"u")throw new Error("Lunr is not present. Please include / require Lunr before this script.");if(typeof t.stemmerSupport>"u")throw new Error("Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.");t.es=function(){this.pipeline.reset(),this.pipeline.add(t.es.trimmer,t.es.stopWordFilter,t.es.stemmer),this.searchPipeline&&(this.searchPipeline.reset(),this.searchPipeline.add(t.es.stemmer))},t.es.wordCharacters="A-Za-zªºÀ-ÖØ-öø-ʸˠ-ˤᴀ-ᴥᴬ-ᵜᵢ-ᵥᵫ-ᵷᵹ-ᶾḀ-ỿⁱⁿₐ-ₜKÅℲⅎⅠ-ↈⱠ-ⱿꜢ-ꞇꞋ-ꞭꞰ-ꞷꟷ-ꟿꬰ-ꭚꭜ-ꭤﬀ-ﬆＡ-Ｚａ-ｚ",t.es.trimmer=t.trimmerSupport.generateTrimmer(t.es.wordCharacters),t.Pipeline.registerFunction(t.es.trimmer,"trimmer-es"),t.es.stemmer=function(){var e=t.stemmerSupport.Among,r=t.stemmerSupport.SnowballProgram,n=new function(){var s=[new e("",-1,6),new e("á",0,1),new e("é",0,2),new e("í",0,3),new e("ó",0,4),new e("ú",0,5)],d=[new e("la",-1,-1),new e("sela",0,-1),new e("le",-1,-1),new e("me",-1,-1),new e("se",-1,-1),new e("lo",-1,-1),new e("selo",5,-1),new e("las",-1,-1),new e("selas",7,-1),new e("les",-1,-1),new e("los",-1,-1),new e("selos",10,-1),new e("nos",-1,-1)],b=[new e("ando",-1,6),new e("iendo",-1,6),new e("yendo",-1,7),new e("ándo",-1,2),new e("iéndo",-1,1),new e("ar",-1,6),new e("er",-1,6),new e("ir",-1,6),new e("ár",-1,3),new e("ér",-1,4),new e("ír",-1,5)],k=[new e("ic",-1,-1),new e("ad",-1,-1),new e("os",-1,-1),new e("iv",-1,1)],L=[new e("able",-1,1),new e("ible",-1,1),new e("ante",-1,1)],A=[new e("ic",-1,1),new e("abil",-1,1),new e("iv",-1,1)],M=[new e("ica",-1,1),new e("ancia",-1,2),new e("encia",-1,5),new e("adora",-1,2),new e("osa",-1,1),new e("ista",-1,1),new e("iva",-1,9),new e("anza",-1,1),new e("logía",-1,3),new e("idad",-1,8),new e("able",-1,1),new e("ible",-1,1),new e("ante",-1,2),new e("mente",-1,7),new e("amente",13,6),new e("ación",-1,2),new e("ución",-1,4),new e("ico",-1,1),new e("ismo",-1,1),new e("oso",-1,1),new e("amiento",-1,1),new e("imiento",-1,1),new e("ivo",-1,9),new e("ador",-1,2),new e("icas",-1,1),new e("ancias",-1,2),new e("encias",-1,5),new e("adoras",-1,2),new e("osas",-1,1),new e("istas",-1,1),new e("ivas",-1,9),new e("anzas",-1,1),new e("logías",-1,3),new e("idades",-1,8),new e("ables",-1,1),new e("ibles",-1,1),new e("aciones",-1,2),new e("uciones",-1,4),new e("adores",-1,2),new e("antes",-1,2),new e("icos",-1,1),new e("ismos",-1,1),new e("osos",-1,1),new e("amientos",-1,1),new e("imientos",-1,1),new e("ivos",-1,9)],P=[new e("ya",-1,1),new e("ye",-1,1),new e("yan",-1,1),new e("yen",-1,1),new e("yeron",-1,1),new e("yendo",-1,1),new e("yo",-1,1),new e("yas",-1,1),new e("yes",-1,1),new e("yais",-1,1),new e("yamos",-1,1),new e("yó",-1,1)],F=[new e("aba",-1,2),new e("ada",-1,2),new e("ida",-1,2),new e("ara",-1,2),new e("iera",-1,2),new e("ía",-1,2),new e("aría",5,2),new e("ería",5,2),new e("iría",5,2),new e("ad",-1,2),new e("ed",-1,2),new e("id",-1,2),new e("ase",-1,2),new e("iese",-1,2),new e("aste",-1,2),new e("iste",-1,2),new e("an",-1,2),new e("aban",16,2),new e("aran",16,2),new e("ieran",16,2),new e("ían",16,2),new e("arían",20,2),new e("erían",20,2),new e("irían",20,2),new e("en",-1,1),new e("asen",24,2),new e("iesen",24,2),new e("aron",-1,2),new e("ieron",-1,2),new e("arán",-1,2),new e("erán",-1,2),new e("irán",-1,2),new e("ado",-1,2),new e("ido",-1,2),new e("ando",-1,2),new e("iendo",-1,2),new e("ar",-1,2),new e("er",-1,2),new e("ir",-1,2),new e("as",-1,2),new e("abas",39,2),new e("adas",39,2),new e("idas",39,2),new e("aras",39,2),new e("ieras",39,2),new e("ías",39,2),new e("arías",45,2),new e("erías",45,2),new e("irías",45,2),new e("es",-1,1),new e("ases",49,2),new e("ieses",49,2),new e("abais",-1,2),new e("arais",-1,2),new e("ierais",-1,2),new e("íais",-1,2),new e("aríais",55,2),new e("eríais",55,2),new e("iríais",55,2),new e("aseis",-1,2),new e("ieseis",-1,2),new e("asteis",-1,2),new e("isteis",-1,2),new e("áis",-1,2),new e("éis",-1,1),new e("aréis",64,2),new e("eréis",64,2),new e("iréis",64,2),new e("ados",-1,2),new e("idos",-1,2),new e("amos",-1,2),new e("ábamos",70,2),new e("áramos",70,2),new e("iéramos",70,2),new e("íamos",70,2),new e("aríamos",74,2),new e("eríamos",74,2),new e("iríamos",74,2),new e("emos",-1,1),new e("aremos",78,2),new e("eremos",78,2),new e("iremos",78,2),new e("ásemos",78,2),new e("iésemos",78,2),new e("imos",-1,2),new e("arás",-1,2),new e("erás",-1,2),new e("irás",-1,2),new e("ís",-1,2),new e("ará",-1,2),new e("erá",-1,2),new e("irá",-1,2),new e("aré",-1,2),new e("eré",-1,2),new e("iré",-1,2),new e("ió",-1,2)],T=[new e("a",-1,1),new e("e",-1,2),new e("o",-1,1),new e("os",-1,1),new e("á",-1,1),new e("é",-1,2),new e("í",-1,1),new e("ó",-1,1)],R=[17,65,16,0,0,0,0,0,0,0,0,0,0,0,0,0,1,17,4,10],j,N,J,i=new r;this.setCurrent=function(I){i.setCurrent(I)},this.getCurrent=function(){return i.getCurrent()};function ae(){if(i.out_grouping(R,97,252)){for(;!i.in_grouping(R,97,252);){if(i.cursor>=i.limit)return!0;i.cursor++}return!1}return!0}function ce(){if(i.in_grouping(R,97,252)){var I=i.cursor;if(ae()){if(i.cursor=I,!i.in_grouping(R,97,252))return!0;for(;!i.out_grouping(R,97,252);){if(i.cursor>=i.limit)return!0;i.cursor++}}return!1}return!0}function ue(){var I=i.cursor,_;if(ce()){if(i.cursor=I,!i.out_grouping(R,97,252))return;if(_=i.cursor,ae()){if(i.cursor=_,!i.in_grouping(R,97,252)||i.cursor>=i.limit)return;i.cursor++}}J=i.cursor}function de(){for(;!i.in_grouping(R,97,252);){if(i.cursor>=i.limit)return!1;i.cursor++}for(;!i.out_grouping(R,97,252);){if(i.cursor>=i.limit)return!1;i.cursor++}return!0}function ne(){var I=i.cursor;J=i.limit,N=J,j=J,ue(),i.cursor=I,de()&&(N=i.cursor,de()&&(j=i.cursor))}function U(){for(var I;;){if(i.bra=i.cursor,I=i.find_among(s,6),I)switch(i.ket=i.cursor,I){case 1:i.slice_from("a");continue;case 2:i.slice_from("e");continue;case 3:i.slice_from("i");continue;case 4:i.slice_from("o");continue;case 5:i.slice_from("u");continue;case 6:if(i.cursor>=i.limit)break;i.cursor++;continue}break}}function q(){return J<=i.cursor}function Le(){return N<=i.cursor}function Y(){return j<=i.cursor}function Se(){var I;if(i.ket=i.cursor,i.find_among_b(d,13)&&(i.bra=i.cursor,I=i.find_among_b(b,11),I&&q()))switch(I){case 1:i.bra=i.cursor,i.slice_from("iendo");break;case 2:i.bra=i.cursor,i.slice_from("ando");break;case 3:i.bra=i.cursor,i.slice_from("ar");break;case 4:i.bra=i.cursor,i.slice_from("er");break;case 5:i.bra=i.cursor,i.slice_from("ir");break;case 6:i.slice_del();break;case 7:i.eq_s_b(1,"u")&&i.slice_del();break}}function xe(I,_){if(!Y())return!0;i.slice_del(),i.ket=i.cursor;var O=i.find_among_b(I,_);return O&&(i.bra=i.cursor,O==1&&Y()&&i.slice_del()),!1}function pe(I){return Y()?(i.slice_del(),i.ket=i.cursor,i.eq_s_b(2,I)&&(i.bra=i.cursor,Y()&&i.slice_del()),!1):!0}function me(){var I;if(i.ket=i.cursor,I=i.find_among_b(M,46),I){switch(i.bra=i.cursor,I){case 1:if(!Y())return!1;i.slice_del();break;case 2:if(pe("ic"))return!1;break;case 3:if(!Y())return!1;i.slice_from("log");break;case 4:if(!Y())return!1;i.slice_from("u");break;case 5:if(!Y())return!1;i.slice_from("ente");break;case 6:if(!Le())return!1;i.slice_del(),i.ket=i.cursor,I=i.find_among_b(k,4),I&&(i.bra=i.cursor,Y()&&(i.slice_del(),I==1&&(i.ket=i.cursor,i.eq_s_b(2,"at")&&(i.bra=i.cursor,Y()&&i.slice_del()))));break;case 7:if(xe(L,3))return!1;break;case 8:if(xe(A,3))return!1;break;case 9:if(pe("at"))return!1;break}return!0}return!1}function $(){var I,_;if(i.cursor>=J&&(_=i.limit_backward,i.limit_backward=J,i.ket=i.cursor,I=i.find_among_b(P,12),i.limit_backward=_,I)){if(i.bra=i.cursor,I==1){if(!i.eq_s_b(1,"u"))return!1;i.slice_del()}return!0}return!1}function Q(){var I,_,O,H;if(i.cursor>=J&&(_=i.limit_backward,i.limit_backward=J,i.ket=i.cursor,I=i.find_among_b(F,96),i.limit_backward=_,I))switch(i.bra=i.cursor,I){case 1:O=i.limit-i.cursor,i.eq_s_b(1,"u")?(H=i.limit-i.cursor,i.eq_s_b(1,"g")?i.cursor=i.limit-H:i.cursor=i.limit-O):i.cursor=i.limit-O,i.bra=i.cursor;case 2:i.slice_del();break}}function Z(){var I,_;if(i.ket=i.cursor,I=i.find_among_b(T,8),I)switch(i.bra=i.cursor,I){case 1:q()&&i.slice_del();break;case 2:q()&&(i.slice_del(),i.ket=i.cursor,i.eq_s_b(1,"u")&&(i.bra=i.cursor,_=i.limit-i.cursor,i.eq_s_b(1,"g")&&(i.cursor=i.limit-_,q()&&i.slice_del())));break}}this.stem=function(){var I=i.cursor;return ne(),i.limit_backward=I,i.cursor=i.limit,Se(),i.cursor=i.limit,me()||(i.cursor=i.limit,$()||(i.cursor=i.limit,Q())),i.cursor=i.limit,Z(),i.cursor=i.limit_backward,U(),!0}};return function(o){return typeof o.update=="function"?o.update(function(s){return n.setCurrent(s),n.stem(),n.getCurrent()}):(n.setCurrent(o),n.stem(),n.getCurrent())}}(),t.Pipeline.registerFunction(t.es.stemmer,"stemmer-es"),t.es.stopWordFilter=t.generateStopWordFilter("a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era erais eran eras eres es esa esas ese eso esos esta estaba estabais estaban estabas estad estada estadas estado estados estamos estando estar estaremos estará estarán estarás estaré estaréis estaría estaríais estaríamos estarían estarías estas este estemos esto estos estoy estuve estuviera estuvierais estuvieran estuvieras estuvieron estuviese estuvieseis estuviesen estuvieses estuvimos estuviste estuvisteis estuviéramos estuviésemos estuvo está estábamos estáis están estás esté estéis estén estés fue fuera fuerais fueran fueras fueron fuese fueseis fuesen fueses fui fuimos fuiste fuisteis fuéramos fuésemos ha habida habidas habido habidos habiendo habremos habrá habrán habrás habré habréis habría habríais habríamos habrían habrías habéis había habíais habíamos habían habías han has hasta hay haya hayamos hayan hayas hayáis he hemos hube hubiera hubierais hubieran hubieras hubieron hubiese hubieseis hubiesen hubieses hubimos hubiste hubisteis hubiéramos hubiésemos hubo la las le les lo los me mi mis mucho muchos muy más mí mía mías mío míos nada ni no nos nosotras nosotros nuestra nuestras nuestro nuestros o os otra otras otro otros para pero poco por porque que quien quienes qué se sea seamos sean seas seremos será serán serás seré seréis sería seríais seríamos serían serías seáis sido siendo sin sobre sois somos son soy su sus suya suyas suyo suyos sí también tanto te tendremos tendrá tendrán tendrás tendré tendréis tendría tendríais tendríamos tendrían tendrías tened tenemos tenga tengamos tengan tengas tengo tengáis tenida tenidas tenido tenidos teniendo tenéis tenía teníais teníamos tenían tenías ti tiene tienen tienes todo todos tu tus tuve tuviera tuvierais tuvieran tuvieras tuvieron tuviese tuvieseis tuviesen tuvieses tuvimos tuviste tuvisteis tuviéramos tuviésemos tuvo tuya tuyas tuyo tuyos tú un una uno unos vosotras vosotros vuestra vuestras vuestro vuestros y ya yo él éramos".split(" ")),t.Pipeline.registerFunction(t.es.stopWordFilter,"stopWordFilter-es")}})})(Ot);var or=Ot.exports;const sr=ut(or);nr(qe);sr(qe);let Ee,K=[];function ir(u){const f=JSON.stringify(u);let t=5381;for(let e=0;e<f.length;e++)t=(t<<5)+t+f.charCodeAt(e)>>>0;return t.toString(36)}const Dt="bl-cache-v";function Qt(u){return`${Dt}${u}`}function lr(u){const f=[];for(let t=0;t<localStorage.length;t++){const e=localStorage.key(t);e&&e.startsWith(Dt)&&e!==u&&f.push(e)}f.forEach(t=>localStorage.removeItem(t))}function it(u,f,t){const e=Qt(u);lr(e);const r=JSON.stringify(f);try{const n=JSON.stringify({v:2,index:r,data:t});localStorage.setItem(e,n),console.log(`[Cache] Guardado índice + datos (${(n.length/1024).toFixed(0)} KB)`);return}catch(n){if(n.name!=="QuotaExceededError"){console.warn("[Cache] Error inesperado al guardar:",n.message);return}}try{const n=JSON.stringify({v:2,index:r});localStorage.setItem(e,n),console.log(`[Cache] Guardado solo índice (${(n.length/1024).toFixed(0)} KB) — quota insuficiente para datos`)}catch(n){console.warn("[Cache] No se pudo guardar en localStorage (quota excedida):",n.message)}}function dr(u){try{const f=localStorage.getItem(Qt(u));if(!f)return null;const t=JSON.parse(f);if(!t||t.v!==2||!t.index)return null;const e=qe.Index.load(JSON.parse(t.index)),r=t.data||null;return{index:e,data:r}}catch(f){return console.warn("[Cache] Error al cargar caché, se descartará:",f.message),null}}function lt(u){return qe(function(){this.use(qe.es),this.ref("id"),this.field("texto"),this.field("titulo_nombre",{boost:5}),this.field("capitulo_nombre",{boost:3}),this.field("articulo_label",{boost:10}),this.field("ley_origen",{boost:5}),u.forEach(f=>this.add(f))})}function dt(u){return u.flatMap(f=>f.articulos.map(t=>({...t,ley_origen:f.metadata.ley,fecha_publicacion:f.metadata.fecha_publicacion})))}function cr(u){return u.map(f=>{const t=f.metadata,e={};f.articulos.forEach(n=>{e[n.capitulo_nombre]||(e[n.capitulo_nombre]=0),e[n.capitulo_nombre]++});const r=Object.entries(e).sort((n,o)=>o[1]-n[1]).slice(0,3).map(n=>n[0]);return{titulo:t.ley,fecha:t.fecha_publicacion,articulos:t.total_articulos,temas_clave:r,id:t.ley.replace(/\s+/g,"-").toLowerCase(),resumen:t.resumen||"No hay resumen disponible para este documento."}})}function Xe(u){const f=new Set(K.map(e=>e.ley_origen)),t=cr(u);window.dispatchEvent(new CustomEvent("search-ready",{detail:{totalLeyes:f.size,totalArticulos:K.length,leyes:Array.from(f),summaries:t}}))}function ct(u){return fetch(`/data/${u}`).then(f=>{if(!f.ok)throw new Error(`HTTP ${f.status} para ${u}`);return f.json()})}async function ur(){try{console.log("[Search] Iniciando...");const u=await fetch("/data/manifest.json");if(!u.ok)throw new Error("Manifest no encontrado");const f=await u.json(),t=ir(f),e=dr(t);if(e&&e.data){console.log("[Search] ✓ Caché completo encontrado — sin necesidad de red"),Ee=e.index,K=e.data;const d={};K.forEach(b=>{d[b.ley_origen]||(d[b.ley_origen]={metadata:{ley:b.ley_origen,fecha_publicacion:b.fecha_publicacion,total_articulos:0,resumen:""},articulos:[]}),d[b.ley_origen].articulos.push(b),d[b.ley_origen].metadata.total_articulos++}),Xe(Object.values(d));return}if(e&&!e.data){console.log("[Search] ✓ Índice encontrado en caché — cargando datos en background"),Ee=e.index,Promise.all(f.map(ct)).then(d=>{K=dt(d),Ee=lt(K),Xe(d),it(t,Ee,K),console.log(`[Search] ✓ Datos cargados tras caché parcial: ${K.length} artículos`)}).catch(d=>console.error("[Search] Error cargando datos background:",d));return}const r=5,n=f.slice(0,r),o=f.slice(r);console.log(`[Search] Cargando primer lote (${n.length} leyes)...`);const s=await Promise.all(n.map(ct));K=dt(s),Ee=lt(K),Xe(s),console.log(`[Search] ✓ Primer lote listo: ${K.length} artículos indexados`),o.length>0?(console.log(`[Search] Cargando lote secundario (${o.length} leyes) en background...`),Promise.all(o.map(ct)).then(d=>{const b=[...s,...d];K=dt(b),Ee=lt(K),Xe(b),console.log(`[Search] ✓ Índice completo: ${K.length} artículos`),it(t,Ee,K)}).catch(d=>console.error("[Search] Error en lote secundario:",d))):it(t,Ee,K)}catch(u){console.error("[Search] Error en inicialización:",u)}}function pr(u){if(!Ee)return[];try{let f=u;return!/[~*^:+]/.test(u)&&(f=u.split(/\s+/).filter(r=>r.length>2||/^\d+°?$/.test(r)).map(r=>`${r}~1 ${r}*`).join(" ")),Ee.search(f).map(r=>({...K.find(o=>o.id===r.ref),score:r.score,matchData:r.matchData})).filter(r=>r.id)}catch(f){return console.warn("[Search] Error en búsqueda:",f),[]}}function Te(u){return K.find(f=>f.id===u)}function mr(u){return K.filter(f=>f.ley_origen===u)}function fr(){return K}const jt={gov:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21h18M3 10h18M5 21V10m6 11V10m6 11V10M12 3l9 7H3l9-7z"/></svg>',chain:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>',doc:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',council:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',plan:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>',scope:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'},Pt=[{id:"planeacion-vinculante",numero:"01",titulo:"Planeación Vinculante",subtitulo:"Instrumento Rector del Estado",objetivo:"La Planeación Vinculante es la obligación legal de que el gobierno, CFE, Pemex y empresas privadas subordinen sus actividades e inversiones a un mismo objetivo: mantener la energía segura, accesible para todos y cada vez más limpia. Para lograrlo, todos deben seguir rigurosamente los mismos Planes creados por la Secretaría de Energía.",color:"#9B2247",metricas:[{valor:"5",label:"leyes y reglamentos"},{valor:"7",label:"planes principales"},{valor:"107+",label:"menciones obligatorias"}],atributos:[{nombre:"¿Quién decide?",valor:"Secretaría de Energía (SENER)",tipo:"gov"},{nombre:"Naturaleza",valor:"Obligatorio para todo el sector",tipo:"chain"},{nombre:"Para el futuro",valor:"Transición hacia energías limpias",tipo:"doc"},{nombre:"¿Quién apoya?",valor:"Consejo de Planeación y Comités",tipo:"council"},{nombre:"Planes Principales",valor:"Estrategia Nacional, Programas Sectoriales, CFE, Pemex",tipo:"plan"},{nombre:"Aplica en...",valor:"Luz, Gasolinas, Diésel, Geotermia",tipo:"scope"}],cadena:[{nivel:1,rol:"LA GRAN META DEL PAÍS",nodos:[{id:"estrategia",titulo:"Estrategia de Transición",descripcion:"El horizonte a largo plazo para dejar atrás tecnologías contaminantes.",color:"#25D366",articulos:["LB-Art-011"],refs:"LB Art. 11 · LPTE"},{id:"pse",titulo:"Programa del Sector",descripcion:"Las metas sexenales derivadas del desarrollo del país.",color:"#9B2247",articulos:["LCNE-Art-007"],refs:"LCNE Art. 7"}],conector:"guían a la"},{nivel:2,rol:"QUIÉN DISEÑA LA RUTA",nodos:[{id:"sener",titulo:"SENER",descripcion:"Secretaría de Energía",color:"#9B2247",articulos:["LPTE-Art-002","LSE-Art-012","LSH-Art-008"],refs:"LPTE Art. 2 · LSE Art. 12 · LSH Art. 8"}],conector:"que emite los"},{nivel:3,rol:"PLANES ESPECIALIZADOS",nodos:[{id:"platease",titulo:"PLATEASE",descripcion:"Cómo lograr la transición y la eficiencia en el uso de la energía.",color:"#7a1b38",articulos:["LPTE-Art-008"],refs:"LPTE Art. 8"},{id:"pladese",titulo:"Plan Eléctrico (PLADESE)",descripcion:"Dónde instalar nuevas plantas de luz o nuevas torres de transmisión.",color:"#1E5B4F",articulos:["LSE-Art-012"],refs:"LSE Art. 12"},{id:"pladeshi",titulo:"Plan Petrolero (PLADESHi)",descripcion:"Decide cómo cuidaremos y extraeremos mejor nuestras reservas de crudo y gas.",color:"#A57F2C",articulos:["LSH-Art-008"],refs:"LSH Art. 8"}],conector:"que son vigilados por"},{nivel:4,rol:"ORGANISMOS DE VIGILANCIA Y APOYO",nodos:[{id:"cne",titulo:"Comisión N. E.",descripcion:"Revisa tarifas y da permisos siempre respetando los planes.",color:"#444",articulos:["RLPTE-Art-004","LSH-Art-009"],refs:"RLPTE Art. 4 · LSH Art. 9"},{id:"cpe",titulo:"Consejo de Planeación",descripcion:"Grupo de expertos que evalúa que la planeación vaya por buen camino.",color:"#555",articulos:["RLPTE-Art-002","LCPE-Art-002"],refs:"RLPTE Art. 2 · LCPE Art. 2"}],conector:"donde participan los"},{nivel:5,rol:"OPERADORES DEL DÍA A DÍA",nodos:[{id:"cfe",titulo:"CFE y su Programa",descripcion:"CFE diseña su plan de 5 años alineado al Plan Eléctrico Nacional.",color:"#1E5B4F",articulos:["LCFE-Art-016","LPTE-Art-002"],refs:"Ley de la CFE Art. 16"},{id:"pemex",titulo:"Pemex y su Programa",descripcion:"Pemex alinea su trabajo al Plan Petrolero Nacional.",color:"#A57F2C",articulos:["LPEMEX-Art-017","LSH-Art-009"],refs:"Ley de Pemex Art. 17"},{id:"particulares",titulo:"Empresas Privadas",descripcion:"Solo operan si cumplen con las metas ordenadas por la SENER.",color:"#666",articulos:["RLPTE-Art-004"],refs:"RLPTE Art. 4"}],conector:null}],articulosClave:[{id:"LPTE-Art-002",siglas:"LPTE",color:"#9B2247",label:"Art. 2",rol:"Norma Fundamental",descripcion:"Se asegura que el Estado planifique hacia dónde vamos en energía, siendo obligatorio y cuidando de que tengamos soberanía sin descuidar la justicia para la gente común.",extracto:'"La Secretaría de Energía está a cargo de la planeación vinculante en el Sector Energético, que incluye, como parte esencial, el desarrollo de las áreas estratégicas para preservar la soberanía, la seguridad, la autosuficiencia y la Justicia Energética de la Nación…"'},{id:"LPTE-Art-008",siglas:"LPTE",color:"#9B2247",label:"Art. 8",rol:"Los Tres Grandes Planes",descripcion:"La ley manda explícitamente a la Secretaría de Energía a escribir tres grandes Planes obligatorios (PLATEASE, PLADESE y PLADESHi).",extracto:'"Corresponde a la Secretaría: I. Elaborar y publicar la Estrategia, el Programa Sectorial de Energía, el PLATEASE, el PLADESE, el PLADESHi y coordinar su ejecución, así como vigilar el cumplimiento…"'},{id:"LB-Art-011",siglas:"Ley",color:"#25D366",label:"Estrategia",rol:"La Meta Superior",descripcion:"Muestra que todos los demás planes se rigen por las metas superiores de lograr usar energías que dañen menos nuestro planeta.",extracto:'"La Estrategia Nacional de Transición Energética debe de incluir las metas para Producción de Biocombustibles y energías limpias…"'},{id:"LCFE-Art-016",siglas:"LCFE",color:"#1E5B4F",label:"Art. 16",rol:"Programa de la CFE",descripcion:"Manda que la principal empresa de luz de México haga su propio Plan a 5 años, sin contradecir las guías del gobierno.",extracto:'"El Programa de Desarrollo de la CFE se debe elaborar y actualizar anualmente, con un horizonte de cinco años... para garantizar el suministro de energía eléctrica al pueblo…"'},{id:"LPEMEX-Art-017",siglas:"Pemex",color:"#A57F2C",label:"Art. 17",rol:"Programa de Pemex",descripcion:"La petrolera estatal debe organizar sus inversiones a cinco y quince años, siguiendo lo que ordene la política energética de la Secretaría.",extracto:'"El Programa de Desarrollo de Petróleos Mexicanos se debe elaborar con un horizonte de cinco años... para preservar la soberanía, seguridad, sostenibilidad, autosuficiencia y justicia energética de la Nación…"'},{id:"RLPTE-Art-004",siglas:"RLPTE",color:"#7a1b38",label:"Art. 4",rol:"Actos Administrativos",descripcion:"A nivel práctico, cualquier permiso privado que se quiera dar para vender gasolina o poner una planta eólica, será rechazado si no coincide con los Planes Mayores.",extracto:'"La planeación vinculante… debe ser considerada por la Secretaría de Energía y la Comisión Nacional de Energía para el otorgamiento de asignaciones, contratos, permisos, concesiones y autorizaciones…"'},{id:"LSE-Art-012",siglas:"LSE",color:"#1E5B4F",label:"Art. 12",rol:"Sector Eléctrico",descripcion:"A nivel eléctrico, ordena que el Estado sea la fuente del 54% de la luz del país, garantizando seguridad y que mande por encima de intereses privados.",extracto:'"La planeación del sector eléctrico tiene carácter vinculante… El Estado debe mantener al menos el cincuenta y cuatro por ciento del promedio de la energía inyectada a la red…"'},{id:"LSH-Art-008",siglas:"LSH",color:"#A57F2C",label:"Art. 8",rol:"Sector Hidrocarburos",descripcion:"Mismo criterio obligatorio, pero para pozos y refinerías. No se hace lo que una empresa quiera, se hace lo que necesite el país.",extracto:'"La planeación del sector hidrocarburos tiene carácter vinculante y está a cargo de la Secretaría de Energía, autoridad que debe emitir el Plan de Desarrollo del Sector Hidrocarburos…"'},{id:"LCNE-Art-007",siglas:"LCNE",color:"#444",label:"Art. 7",rol:"Programa Sectorial",descripcion:"Establece que incluso los reguladores están obligados a usar todos sus estudios científicos y económicos apoyando el Programa Sectorial, que es parte del Plan Nacional de Desarrollo de México.",extracto:'"Aportar elementos técnicos a la Secretaría para la formulación y seguimiento del Programa Sectorial de Energía y demás instrumentos de política pública en la materia…"'},{id:"LCPE-Art-002",siglas:"Regla",color:"#555",label:"Consejo",rol:"Órgano de Apoyo",descripcion:"Define el Consejo de Planeación Energética como un grupo de especialistas que acompaña constantemente a la Secretaría en el análisis de que se cumplan las metas.",extracto:'"El Consejo de Planeación Energética es el órgano colegiado de carácter permanente que apoya a la Secretaría de Energía en la coordinación y seguimiento de la planeación energética nacional…"'}],menciones:[{siglas:"LSH",nombre:"Legislación Petrolera",valor:67,color:"#A57F2C"},{siglas:"LSE",nombre:"Legislación Eléctrica",valor:50,color:"#1E5B4F"},{siglas:"RLPTE",nombre:"Reglamentos Complementarios",valor:47,color:"#7a1b38"},{siglas:"LPTE",nombre:"Ley General de Planeación (Pilar)",valor:27,color:"#9B2247"},{siglas:"LCPE",nombre:"Normativas de la Comisión/Consejos",valor:13,color:"#555"}]}];let Mt=!1;function gr(){if(Mt)return;Mt=!0;const u=document.createElement("style");u.id="analisis-styles",u.textContent=`
/* ── Análisis view ── */
.aview-back {
    display: inline-flex; align-items: center; gap: 0.375rem;
    font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: #9B2247; cursor: pointer;
    background: none; border: none; padding: 0; margin-bottom: 1.5rem;
    transition: opacity 0.2s; font-family: 'Noto Sans', sans-serif;
}
.aview-back:hover { opacity: 0.65; }
.aview-header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 600;
    color: #1a1a1a; line-height: 1.1; margin-bottom: 0.35rem;
}
.aview-header-sub {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #9B2247; margin-bottom: 1.25rem;
    font-family: 'Noto Sans', sans-serif;
}
.aview-divider {
    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem;
}
.aview-divider-line { flex: 1; height: 1px; background: #e5e7eb; }
.aview-divider-dot { width: 4px; height: 4px; border-radius: 9999px; background: #9B2247; opacity: 0.4; }

/* ── Topic card ── */
.atema-card {
    background: #fff; border: 1px solid rgba(0,0,0,0.07);
    border-radius: 1.25rem; overflow: hidden;
    box-shadow: 0 2px 24px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04);
    margin-bottom: 2rem;
}

/* ── Hero ── */
.atema-hero {
    padding: 2rem 2rem 1.75rem; position: relative; overflow: hidden;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    background: linear-gradient(135deg, #fff 60%, #fdf5f7 100%);
}
.atema-hero-bg {
    position: absolute; top: -0.5rem; right: 1rem;
    font-family: 'Cormorant Garamond', serif; font-size: 11rem;
    font-weight: 700; color: #9B2247; opacity: 0.04;
    line-height: 1; user-select: none; pointer-events: none;
}
.atema-num-row {
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 0.6rem;
}
.atema-num-badge {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: white; background: #9B2247;
    padding: 0.2rem 0.6rem; border-radius: 4px;
    font-family: 'Noto Sans', sans-serif;
}
.atema-num-label {
    font-size: 0.65rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #9B224780;
    font-family: 'Noto Sans', sans-serif;
}
.atema-titulo {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.5rem, 3.5vw, 2.2rem); font-weight: 600;
    color: #1a1a1a; line-height: 1.15; margin-bottom: 0.75rem;
}
.atema-objetivo {
    font-family: 'Noto Sans', sans-serif; font-size: 0.82rem;
    color: #6b7280; line-height: 1.75; max-width: 580px; margin-bottom: 1.5rem;
}
.atema-metricas { display: flex; gap: 2rem; flex-wrap: wrap; }
.atema-metrica { display: flex; flex-direction: column; }
.atema-metrica-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 600; color: #9B2247; line-height: 1;
}
.atema-metrica-lbl {
    font-size: 0.65rem; color: #9ca3af; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase; margin-top: 0.2rem;
    font-family: 'Noto Sans', sans-serif;
}
.atema-metrica-sep { width: 1px; background: #f0f0ee; align-self: stretch; margin: 0 0.25rem; }

/* ── Attributes ── */
.atema-atributos {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: #f3f4f6;
    border-top: 1px solid #f3f4f6;
}
.atema-attr {
    background: #fff; padding: 0.875rem 1.25rem;
    display: flex; flex-direction: column; gap: 0.3rem;
}
.atema-attr-head {
    display: flex; align-items: center; gap: 0.4rem; color: #9B2247;
}
.atema-attr-nombre {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: #9ca3af;
    font-family: 'Noto Sans', sans-serif;
}
.atema-attr-valor {
    font-size: 0.8rem; font-weight: 500; color: #374151;
    font-family: 'Noto Sans', sans-serif; line-height: 1.4;
}

/* ── Tabs ── */
.atema-tabs {
    display: flex; border-bottom: 1px solid #f3f4f6;
    padding: 0 1.5rem; background: #fafaf9; overflow-x: auto;
}
.atema-tab {
    padding: 0.9rem 1rem; font-size: 0.68rem; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af;
    cursor: pointer; border: none; background: none;
    border-bottom: 2px solid transparent; transition: color 0.2s, border-color 0.2s;
    white-space: nowrap; font-family: 'Noto Sans', sans-serif;
}
.atema-tab:hover { color: #6b7280; }
.atema-tab.active { color: #9B2247; border-bottom-color: #9B2247; }
.atema-tab-content { padding: 2rem; }
.atema-tab-panel.hidden { display: none; }

/* ── Flow diagram ── */
.aflujo {
    display: flex; flex-direction: column; align-items: center;
}
.aflujo-level { width: 100%; display: flex; flex-direction: column; align-items: center; }
.aflujo-rol {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.22em;
    color: #d1d5db; text-transform: uppercase; margin-bottom: 0.7rem;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-nodes { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; width: 100%; }
.aflujo-node {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 0.875rem 1rem; border: 1.5px solid; border-radius: 0.875rem;
    cursor: pointer; transition: transform 0.18s, box-shadow 0.18s;
    min-width: 90px; max-width: 155px; flex: 1; background: white;
}
.aflujo-node:hover { transform: translateY(-3px); }
.aflujo-node.anode-active {
    transform: translateY(-2px);
}
.aflujo-node-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.05rem;
    font-weight: 600; line-height: 1.1; margin-bottom: 0.25rem;
}
.aflujo-node-sub {
    font-size: 0.6rem; color: #6b7280; line-height: 1.35;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-node-refs {
    margin-top: 0.4rem; font-size: 0.56rem; font-weight: 600;
    letter-spacing: 0.04em; padding: 0.18rem 0.45rem; border-radius: 4px;
    opacity: 0.75; font-family: 'Noto Sans', sans-serif;
}
.aflujo-connector {
    display: flex; flex-direction: column; align-items: center; padding: 0.15rem 0;
}
.aflujo-conn-line { width: 1.5px; height: 16px; background: linear-gradient(to bottom, #e5e7eb, #9B224740); }
.aflujo-conn-badge {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: #9B2247; background: #9B22470d;
    border: 1px solid #9B224722; border-radius: 999px; padding: 0.15rem 0.65rem;
    margin: 0.2rem 0; font-family: 'Noto Sans', sans-serif;
}
.aflujo-conn-line2 { width: 1.5px; height: 10px; background: linear-gradient(to bottom, #9B224740, #e5e7eb); }
.aflujo-conn-arrow { font-size: 0.65rem; color: #d1d5db; line-height: 1; }

/* ── Node article panel ── */
.aflujo-panel {
    margin-top: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.875rem;
    overflow: hidden; width: 100%;
    animation: apanelIn 0.22s cubic-bezier(0.4,0,0.2,1);
}
@keyframes apanelIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}
.aflujo-panel-hdr {
    padding: 0.7rem 1rem; background: #fafaf9;
    border-bottom: 1px solid #f3f4f6;
    display: flex; align-items: center; justify-content: space-between;
}
.aflujo-panel-hdr-title {
    font-size: 0.66rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: #6b7280;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-close {
    font-size: 0.7rem; color: #9ca3af; cursor: pointer;
    background: none; border: none; padding: 0.1rem 0.35rem;
    border-radius: 4px; transition: color 0.15s; font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-close:hover { color: #9B2247; }
.aflujo-panel-art {
    padding: 0.875rem 1rem; border-bottom: 1px solid #f9f9f8;
    display: flex; flex-direction: column; gap: 0.25rem;
}
.aflujo-panel-art:last-child { border-bottom: none; }
.aflujo-panel-art-row {
    display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}
.aflujo-pbadge {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
    padding: 0.15rem 0.45rem; border-radius: 4px; color: white;
}
.aflujo-panel-art-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem; font-weight: 600; color: #374151;
}
.aflujo-panel-art-rol {
    margin-left: auto; font-size: 0.58rem; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-art-desc {
    font-size: 0.74rem; color: #6b7280; line-height: 1.55;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-art-btn {
    margin-top: 0.25rem; font-size: 0.64rem; font-weight: 600;
    color: #9B2247; background: none; border: 1px solid #9B224730;
    border-radius: 6px; padding: 0.22rem 0.65rem; cursor: pointer;
    align-self: flex-start; transition: all 0.15s; letter-spacing: 0.06em;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-art-btn:hover { background: #9B224712; border-color: #9B224660; }

/* ── Article cards ── */
.aarts-grid { display: flex; flex-direction: column; gap: 1rem; }
.aart-card {
    border: 1px solid #e9eaeb; border-radius: 0.875rem;
    overflow: hidden; transition: box-shadow 0.2s;
}
.aart-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.07); }
.aart-head {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.875rem 1rem; background: #fafaf9;
    border-bottom: 1px solid #f3f4f6; flex-wrap: wrap;
}
.aart-badge {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.12em;
    padding: 0.2rem 0.55rem; border-radius: 5px; color: white;
}
.aart-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600; color: #1a1a1a;
}
.aart-rol {
    margin-left: auto; font-size: 0.58rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af;
    font-family: 'Noto Sans', sans-serif;
}
.aart-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.aart-desc { font-size: 0.8rem; color: #374151; line-height: 1.65; font-family: 'Noto Sans', sans-serif; }
.aart-extracto {
    font-family: 'Merriweather', serif; font-size: 0.75rem; color: #6b7280;
    line-height: 1.75; border-left: 2.5px solid; padding-left: 0.875rem;
    margin: 0; font-style: italic;
}
.aart-btn {
    align-self: flex-start; font-size: 0.66rem; font-weight: 600;
    padding: 0.33rem 0.875rem; border-radius: 6px; cursor: pointer;
    transition: all 0.15s; border: 1px solid; background: transparent;
    letter-spacing: 0.06em; font-family: 'Noto Sans', sans-serif;
}
.aart-btn:hover { opacity: 0.8; }

/* ── Bar chart ── */
.achart-intro {
    font-size: 0.78rem; color: #6b7280; margin-bottom: 1rem;
    font-family: 'Noto Sans', sans-serif; line-height: 1.6;
}
.achart { display: flex; flex-direction: column; gap: 0.875rem; }
.achart-row { display: flex; align-items: center; gap: 0.75rem; }
.achart-siglas {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
    color: #374151; width: 44px; flex-shrink: 0; text-align: right;
    font-family: 'Noto Sans', sans-serif;
}
.achart-bar-wrap {
    flex: 1; height: 28px; background: #f3f4f6; border-radius: 6px; overflow: hidden;
}
.achart-bar {
    height: 100%; border-radius: 6px; width: 0%;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex; align-items: center; padding-left: 0.65rem;
}
.achart-bar-label {
    font-size: 0.6rem; font-weight: 600; color: rgba(255,255,255,0.9);
    white-space: nowrap; overflow: hidden; font-family: 'Noto Sans', sans-serif;
}
.achart-val {
    font-size: 0.7rem; font-weight: 700; color: #374151;
    width: 28px; flex-shrink: 0; font-family: 'Noto Sans', sans-serif;
}
.achart-sub {
    font-size: 0.62rem; color: #9ca3af;
    margin-left: 44px; margin-top: -0.5rem;
    font-family: 'Noto Sans', sans-serif;
}
.achart-note {
    margin-top: 0.75rem; padding: 0.75rem 1rem;
    background: #fafaf9; border: 1px solid #f3f4f6; border-radius: 0.5rem;
    font-size: 0.7rem; color: #9ca3af; font-family: 'Noto Sans', sans-serif;
    line-height: 1.5;
}

/* ── Dark mode ── */
.dark-mode .atema-card { background: #1e1e1e; border-color: #2d2d2d; }
.dark-mode .atema-hero { background: linear-gradient(135deg, #1e1e1e 60%, #241018 100%); }
.dark-mode .atema-titulo { color: #f5f5f5; }
.dark-mode .atema-objetivo { color: #a3a3a3; }
.dark-mode .atema-attr { background: #1e1e1e; }
.dark-mode .atema-atributos { background: #2d2d2d; }
.dark-mode .atema-attr-valor { color: #d4d4d4; }
.dark-mode .atema-tabs { background: #1a1a1a; border-color: #2d2d2d; }
.dark-mode .atema-tab { color: #555; }
.dark-mode .atema-tab:hover { color: #737373; }
.dark-mode .atema-tab-content { background: #1e1e1e; }
.dark-mode .atema-metrica-lbl { color: #555; }
.dark-mode .aflujo-node { background: #252525; }
.dark-mode .aflujo-node-title { color: #f0f0f0; }
.dark-mode .aflujo-node-sub { color: #737373; }
.dark-mode .aflujo-rol { color: #444; }
.dark-mode .aflujo-panel { border-color: #2d2d2d; }
.dark-mode .aflujo-panel-hdr { background: #1a1a1a; border-color: #2d2d2d; }
.dark-mode .aflujo-panel-art { border-color: #252525; }
.dark-mode .aflujo-panel-art-label { color: #d4d4d4; }
.dark-mode .aflujo-panel-art-desc { color: #737373; }
.dark-mode .aart-card { border-color: #2d2d2d; }
.dark-mode .aart-head { background: #1a1a1a; border-color: #2d2d2d; }
.dark-mode .aart-label { color: #f5f5f5; }
.dark-mode .aart-body { background: #1e1e1e; }
.dark-mode .aart-desc { color: #d4d4d4; }
.dark-mode .aart-extracto { color: #737373; }
.dark-mode .achart-bar-wrap { background: #2d2d2d; }
.dark-mode .achart-siglas { color: #d4d4d4; }
.dark-mode .achart-val { color: #d4d4d4; }
.dark-mode .achart-intro { color: #737373; }
.dark-mode .achart-sub { color: #555; }
.dark-mode .achart-note { background: #1a1a1a; border-color: #2d2d2d; color: #555; }
.dark-mode .aview-header-title { color: #f5f5f5; }
.dark-mode .aview-divider-line { background: #2d2d2d; }

@media (max-width: 640px) {
    .atema-hero { padding: 1.5rem 1.25rem 1.25rem; }
    .atema-tab-content { padding: 1.25rem; }
    .atema-atributos { grid-template-columns: repeat(2, 1fr); }
    .aflujo-node { min-width: 80px; padding: 0.65rem 0.75rem; }
    .aflujo-node-title { font-size: 0.9rem; }
    .atema-metricas { gap: 1.25rem; }
}
@media (max-width: 400px) {
    .atema-atributos { grid-template-columns: 1fr; }
}
    `,document.head.appendChild(u)}function hr(u){const f=u.metricas.map((t,e)=>e===u.metricas.length-1?`<div class="atema-metrica"><div class="atema-metrica-val">${t.valor}</div><div class="atema-metrica-lbl">${t.label}</div></div>`:`<div class="atema-metrica"><div class="atema-metrica-val">${t.valor}</div><div class="atema-metrica-lbl">${t.label}</div></div><div class="atema-metrica-sep"></div>`).join("");return`
        <div class="atema-hero">
            <div class="atema-hero-bg" aria-hidden="true">§</div>
            <div class="atema-num-row">
                <span class="atema-num-badge">Tema ${u.numero}</span>
                <span class="atema-num-label">${u.subtitulo}</span>
            </div>
            <h2 class="atema-titulo">${u.titulo}</h2>
            <p class="atema-objetivo">${u.objetivo}</p>
            <div class="atema-metricas">${f}</div>
        </div>`}function br(u){return`
        <div class="atema-atributos">
            ${u.atributos.map(f=>`
                <div class="atema-attr">
                    <div class="atema-attr-head">
                        <span style="color:${u.color}">${jt[f.tipo]||jt.gov}</span>
                        <span class="atema-attr-nombre">${f.nombre}</span>
                    </div>
                    <div class="atema-attr-valor">${f.valor}</div>
                </div>`).join("")}
        </div>`}function vr(u){return`
        <div class="atema-tabs">
            <button class="atema-tab active" data-target="tab-cadena-${u.id}">Cadena de Vinculación</button>
            <button class="atema-tab" data-target="tab-articulos-${u.id}">Artículos Clave</button>
            <button class="atema-tab" data-target="tab-menciones-${u.id}">Menciones por Ley</button>
        </div>`}function xr(u){return`
        <div class="aflujo-node" data-node-id="${u.id}" data-articles="${u.articulos.join(",")}"
            style="border-color:${u.color}45">
            <div class="aflujo-node-title" style="color:${u.color}">${u.titulo}</div>
            <div class="aflujo-node-sub">${u.descripcion}</div>
            <div class="aflujo-node-refs" style="background:${u.color}14;color:${u.color}">${u.refs}</div>
        </div>`}function yr(u){const f=u.cadena.map(t=>`
        <div class="aflujo-level">
            <div class="aflujo-rol">${t.rol}</div>
            <div class="aflujo-nodes">${t.nodos.map(xr).join("")}</div>
        </div>
        ${t.conector?`
        <div class="aflujo-connector">
            <div class="aflujo-conn-line"></div>
            <div class="aflujo-conn-badge">${t.conector}</div>
            <div class="aflujo-conn-line2"></div>
            <div class="aflujo-conn-arrow">▾</div>
        </div>`:""}
    `).join("");return`
        <div class="aflujo" id="flujo-${u.id}">${f}
            <div id="flujo-panel-${u.id}" class="aflujo-panel hidden"></div>
        </div>
        <p style="margin-top:1.25rem;font-size:0.66rem;color:#9ca3af;text-align:center;font-family:'Noto Sans',sans-serif;">
            Haz clic en cualquier nodo para ver los artículos que fundamentan esa relación
        </p>`}function wr(u){return`
        <div class="aarts-grid">
            ${u.articulosClave.map(f=>`
                <div class="aart-card">
                    <div class="aart-head">
                        <span class="aart-badge" style="background:${f.color}">${f.siglas}</span>
                        <span class="aart-label">${f.label}</span>
                        <span class="aart-rol">${f.rol}</span>
                    </div>
                    <div class="aart-body">
                        <p class="aart-desc">${f.descripcion}</p>
                        <blockquote class="aart-extracto" style="border-color:${f.color}50">${f.extracto}</blockquote>
                        <button class="aart-btn" data-open-article="${f.id}"
                            style="color:${f.color};border-color:${f.color}35">
                            Ver artículo completo →
                        </button>
                    </div>
                </div>`).join("")}
        </div>`}function kr(u){const f=Math.max(...u.menciones.map(t=>t.valor));return`
        <p class="achart-intro">
            Artículos con términos relacionados a <em>planeación vinculante</em>, <em>planeación</em>
            y <em>vinculante</em> en cada instrumento normativo. Refleja la densidad regulatoria del concepto.
        </p>
        <div class="achart" id="chart-${u.id}">
            ${u.menciones.map(t=>`
                <div>
                    <div class="achart-row">
                        <div class="achart-siglas">${t.siglas}</div>
                        <div class="achart-bar-wrap">
                            <div class="achart-bar" data-target="${Math.round(t.valor/f*100)}"
                                style="background:${t.color}">
                                <span class="achart-bar-label">${t.nombre}</span>
                            </div>
                        </div>
                        <div class="achart-val">${t.valor}</div>
                    </div>
                    <div class="achart-sub">${t.nombre}</div>
                </div>`).join("")}
        </div>
        <div class="achart-note">
            * Conteo de artículos que contienen al menos un término del campo semántico de planeación vinculante.
            No equivale al número de veces que aparece la frase exacta en el texto.
        </div>`}function Er(u){return`
        <div class="atema-card" id="tema-${u.id}">
            ${hr(u)}
            ${br(u)}
            ${vr(u)}
            <div class="atema-tab-content">
                <div id="tab-cadena-${u.id}" class="atema-tab-panel">
                    ${yr(u)}
                </div>
                <div id="tab-articulos-${u.id}" class="atema-tab-panel hidden">
                    ${wr(u)}
                </div>
                <div id="tab-menciones-${u.id}" class="atema-tab-panel hidden">
                    ${kr(u)}
                </div>
            </div>
        </div>`}function Lr(u,f,t){var s;const e=u.querySelector(`#flujo-panel-${f.id}`);if(!e)return;const r={};f.articulosClave.forEach(d=>{r[d.id]=d});const n=t.articulos.map(d=>r[d]).filter(Boolean);if(e.dataset.activeNode===t.id&&!e.classList.contains("hidden")){e.classList.add("hidden"),e.dataset.activeNode="",u.querySelectorAll(".aflujo-node").forEach(d=>{d.classList.remove("anode-active"),d.style.boxShadow=""});return}u.querySelectorAll(".aflujo-node").forEach(d=>{d.classList.remove("anode-active"),d.style.boxShadow=""});const o=u.querySelector(`[data-node-id="${t.id}"]`);if(o&&(o.classList.add("anode-active"),o.style.boxShadow=`0 6px 22px ${t.color}30`),e.dataset.activeNode=t.id,n.length===0){e.innerHTML='<div style="padding:1rem;text-align:center;font-size:0.75rem;color:#9ca3af">Sin artículos específicos para este nodo.</div>',e.classList.remove("hidden");return}e.innerHTML=`
        <div class="aflujo-panel-hdr">
            <span class="aflujo-panel-hdr-title">Artículos relacionados · ${t.titulo}</span>
            <button class="aflujo-panel-close" data-close-panel="${f.id}">✕ cerrar</button>
        </div>
        <div>
            ${n.map(d=>`
                <div class="aflujo-panel-art">
                    <div class="aflujo-panel-art-row">
                        <span class="aflujo-pbadge" style="background:${d.color}">${d.siglas}</span>
                        <span class="aflujo-panel-art-label">${d.label}</span>
                        <span class="aflujo-panel-art-rol">${d.rol}</span>
                    </div>
                    <p class="aflujo-panel-art-desc">${d.descripcion}</p>
                    <button class="aflujo-panel-art-btn" data-open-article="${d.id}">
                        Ver artículo completo →
                    </button>
                </div>`).join("")}
        </div>`,e.classList.remove("hidden"),setTimeout(()=>e.scrollIntoView({behavior:"smooth",block:"nearest"}),50),(s=e.querySelector(`[data-close-panel="${f.id}"]`))==null||s.addEventListener("click",()=>{e.classList.add("hidden"),e.dataset.activeNode="",u.querySelectorAll(".aflujo-node").forEach(d=>{d.classList.remove("anode-active"),d.style.boxShadow=""})}),qt(e,f)}function qt(u,f){u.querySelectorAll("[data-open-article]").forEach(t=>{t.addEventListener("click",()=>{const e=f.articulosClave.map(r=>r.id);document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:t.dataset.openArticle,list:e}}))})})}function Nt(u){u.querySelectorAll(".achart-bar").forEach(f=>{const t=f.dataset.target;t&&setTimeout(()=>{f.style.width=t+"%"},60)})}function Sr(u,f){u.querySelectorAll(".atema-tab").forEach(e=>{e.addEventListener("click",()=>{u.querySelectorAll(".atema-tab").forEach(n=>n.classList.remove("active")),e.classList.add("active");const r=e.dataset.target;u.querySelectorAll(".atema-tab-panel").forEach(n=>{n.classList.toggle("hidden",n.id!==r)}),r!=null&&r.includes("menciones")&&Nt(u)})}),u.querySelectorAll(".aflujo-node").forEach(e=>{e.addEventListener("click",()=>{const r=e.dataset.nodeId,n=f.cadena.find(s=>s.nodos.some(d=>d.id===r)),o=n==null?void 0:n.nodos.find(s=>s.id===r);o&&Lr(u,f,o)})}),qt(u,f);const t=u.querySelector(`#chart-${f.id}`);if(t&&"IntersectionObserver"in window){const e=new IntersectionObserver(r=>{r[0].isIntersecting&&(Nt(u),e.disconnect())},{threshold:.2});e.observe(t)}}function Cr(u){var f;gr(),u.innerHTML=`
        <div style="max-width:720px;margin:0 auto;padding-bottom:3rem">
            <button class="aview-back" id="analisis-back-btn">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Inicio
            </button>
            <h1 class="aview-header-title">
                Análisis de <em style="color:#9B2247;font-style:italic">Temas Transversales</em>
            </h1>
            <p class="aview-header-sub">Marco Legal Energético · SENER · México</p>
            <div class="aview-divider">
                <div class="aview-divider-line"></div>
                <div class="aview-divider-dot"></div>
                <div class="aview-divider-line"></div>
            </div>
            ${Pt.map(Er).join("")}
        </div>`,(f=u.querySelector("#analisis-back-btn"))==null||f.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("analisis:goHome"))}),Pt.forEach(t=>Sr(u,t))}function $r(){var Et,Lt,St,Ct,$t;const u=document.getElementById("search-input"),f=document.getElementById("results-container"),t=document.getElementById("law-detail-container"),e=document.getElementById("stats-minimal"),r=document.getElementById("hero-section"),n=document.getElementById("main-container"),o=document.getElementById("quick-filters"),s=document.getElementById("detail-modal"),d=document.getElementById("modal-panel"),b=document.getElementById("modal-content"),k=document.getElementById("modal-title"),L=document.getElementById("modal-ley"),A=document.getElementById("close-modal"),M=document.getElementById("copy-btn"),P=document.getElementById("loading-indicator"),F=document.getElementById("nav-inicio"),T=document.getElementById("nav-leyes"),R=document.getElementById("mobile-menu-btn"),j=document.getElementById("mobile-menu-overlay"),N=document.getElementById("mobile-menu-drawer"),J=document.getElementById("close-mobile-menu"),i=document.getElementById("mobile-nav-inicio"),ae=document.getElementById("mobile-nav-leyes"),ce="app-dark-mode";let ue=localStorage.getItem(ce)==="true";function de(a){if(ue=a,localStorage.setItem(ce,a),document.documentElement.classList.toggle("dark-mode",a),!document.getElementById("global-dark-style")){const p=document.createElement("style");p.id="global-dark-style",p.innerHTML=`
                .dark-mode { background-color: #111 !important; color: #e5e5e5 !important; }
                .dark-mode header { background-color: #111 !important; border-color: #222 !important; }
                .dark-mode footer { border-color: #222 !important; background-color: #111 !important; }
                .dark-mode .bg-white { background-color: #1e1e1e !important; }
                .dark-mode .bg-gray-50 { background-color: #1a1a1a !important; }
                .dark-mode .border-gray-100, .dark-mode .border-gray-200 { border-color: #2d2d2d !important; }
                .dark-mode .text-gray-900, .dark-mode .text-gray-800 { color: #f5f5f5 !important; }
                .dark-mode .text-gray-700, .dark-mode .text-gray-600 { color: #d4d4d4 !important; }
                .dark-mode .text-gray-500 { color: #a3a3a3 !important; }
                .dark-mode .text-gray-400, .dark-mode .text-gray-300 { color: #737373 !important; }
                .dark-mode .shadow-lg, .dark-mode .shadow-xl, .dark-mode .shadow-2xl { box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important; }
                .dark-mode #search-input { background-color: #1e1e1e !important; border-color: #333 !important; color: #f5f5f5 !important; }
                .dark-mode #search-input::placeholder { color: #555 !important; }
                .dark-mode #search-input:focus { border-color: #9B2247 !important; }
                .dark-mode .hover\\:bg-gray-50:hover { background-color: #252525 !important; }
                .dark-mode .bg-guinda\\/5 { background-color: rgba(155,34,71,0.15) !important; }
                .dark-mode .text-guinda { color: #f87171 !important; }
                .dark-mode #detail-modal { background-color: rgba(0,0,0,0.85) !important; }
                .dark-mode #modal-panel { background-color: #1a1a1a !important; }
                .dark-mode #modal-content { background-color: #1a1a1a !important; }
                .dark-mode mark { background-color: #7c5e10 !important; color: #fef3c7 !important; }
                .dark-mode #autocomplete-results { background-color: #1e1e1e !important; border-color: #333 !important; }
                .dark-mode #toc-panel { background-color: #1a1a1a !important; }
                .dark-mode .toc-art-btn { background-color: #252525 !important; border-color: #333 !important; color: #d4d4d4 !important; }
                .dark-mode #compare-modal { background-color: rgba(0,0,0,0.85) !important; }
                .dark-mode #compare-panel { background-color: #1a1a1a !important; }
            `,document.head.appendChild(p)}const l=document.querySelectorAll("#darkmode-icon-moon, #mobile-darkmode-moon"),c=document.querySelectorAll("#darkmode-icon-sun, #mobile-darkmode-sun"),m=document.getElementById("mobile-darkmode-label");l.forEach(p=>p.classList.toggle("hidden",a)),c.forEach(p=>p.classList.toggle("hidden",!a)),m&&(m.textContent=a?"Modo claro":"Modo oscuro")}ue&&de(!0),(Et=document.getElementById("darkmode-toggle"))==null||Et.addEventListener("click",()=>de(!ue)),(Lt=document.getElementById("mobile-darkmode-toggle"))==null||Lt.addEventListener("click",()=>de(!ue));function ne(a){!N||!j||(a?(j.classList.remove("hidden"),j.offsetWidth,j.classList.remove("opacity-0"),N.classList.remove("translate-x-full"),document.body.style.overflow="hidden"):(j.classList.add("opacity-0"),N.classList.add("translate-x-full"),document.body.style.overflow="",setTimeout(()=>{j.classList.add("hidden")},300)))}R&&R.addEventListener("click",()=>ne(!0)),J&&J.addEventListener("click",()=>ne(!1)),j&&j.addEventListener("click",()=>ne(!1)),i&&i.addEventListener("click",a=>{a.preventDefault(),Ie(),ne(!1)}),ae&&ae.addEventListener("click",a=>{a.preventDefault(),Pe(),ne(!1)});let U=[],q=[];window.addEventListener("search-ready",a=>{const{totalLeyes:l,totalArticulos:c,summaries:m}=a.detail;U=m,e&&(e.innerHTML=`
                <span class="opacity-60">Índice activo:</span>
                <span class="font-semibold text-guinda">${l} leyes</span>
                <span class="mx-1 opacity-30">|</span>
                <span class="font-semibold text-guinda">${c} artículos</span>
            `),gt(),setTimeout(Q,0)});const Le=document.getElementById("nav-favorites"),Y=document.getElementById("mobile-nav-favorites");Le&&Le.addEventListener("click",()=>bt()),Y&&Y.addEventListener("click",()=>{bt(),ne(!1)});const Se=document.getElementById("nav-analisis"),xe=document.getElementById("mobile-nav-analisis");Se&&Se.addEventListener("click",a=>{a.preventDefault(),kt()}),xe&&xe.addEventListener("click",a=>{a.preventDefault(),kt(),ne(!1)});const pe=document.getElementById("nav-stats"),me=document.getElementById("mobile-nav-stats");pe&&pe.addEventListener("click",a=>{a.preventDefault(),yt()}),me&&me.addEventListener("click",a=>{a.preventDefault(),yt(),ne(!1)}),document.addEventListener("analisis:openArticle",a=>{const{id:l,list:c}=a.detail;c&&c.length&&(ke=c.map(m=>Te(m)).filter(Boolean)),ge(l)}),document.addEventListener("analisis:goHome",()=>Ie()),(St=document.getElementById("close-compare-modal"))==null||St.addEventListener("click",tt),(Ct=document.getElementById("compare-modal"))==null||Ct.addEventListener("click",a=>{a.target===document.getElementById("compare-modal")&&tt()});function $(a){history.pushState(null,"",a?`${location.pathname}${a}`:location.pathname)}function Q(){const a=location.hash;if(a){if(a.startsWith("#art-")){const l=decodeURIComponent(a.slice(5)),c=Te(l);if(!c)return;ke=[c],ge(l)}else if(a.startsWith("#ley-")){const l=decodeURIComponent(a.slice(5)),c=U.find(m=>m.id===l);c&&Me(c)}}}window.addEventListener("popstate",()=>{const a=location.hash;if(!a)Ie();else if(a.startsWith("#art-")){const l=decodeURIComponent(a.slice(5)),c=Te(l);if(!c)return;ke=[c],ge(l)}else if(a.startsWith("#ley-")){const l=decodeURIComponent(a.slice(5)),c=U.find(m=>m.id===l);c&&Me(c)}});function Z(a,l="✓",c="bg-gray-900"){const m=document.getElementById("app-toast");m&&m.remove();const p=document.createElement("div");p.id="app-toast",p.className=`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 ${c} text-white text-xs font-semibold rounded-full shadow-2xl transition-all duration-300 opacity-0 scale-90 pointer-events-none`,p.innerHTML=`<span>${l}</span><span>${a}</span>`,document.body.appendChild(p),requestAnimationFrame(()=>{p.classList.replace("opacity-0","opacity-100"),p.classList.replace("scale-90","scale-100")}),setTimeout(()=>{p.classList.replace("opacity-100","opacity-0"),p.classList.replace("scale-100","scale-90"),setTimeout(()=>p.remove(),300)},2500)}function I(a=5){f.innerHTML=Array(a).fill("").map(()=>`
            <div class="animate-pulse rounded-xl p-5 border border-gray-50 bg-white">
                <div class="flex gap-2 mb-3">
                    <div class="h-4 bg-gray-100 rounded-full w-24"></div>
                    <div class="h-4 bg-gray-100 rounded-full w-36"></div>
                    <div class="h-4 bg-gray-100 rounded-full w-10 ml-auto"></div>
                </div>
                <div class="h-6 bg-gray-100 rounded-lg w-48 mb-3"></div>
                <div class="space-y-2">
                    <div class="h-3 bg-gray-100 rounded w-full"></div>
                    <div class="h-3 bg-gray-100 rounded w-5/6"></div>
                    <div class="h-3 bg-gray-100 rounded w-4/6"></div>
                </div>
            </div>
        `).join("")}let _="",O=[],H=1;const fe=10;function X(a,l,c){const m=document.getElementById(l);if(!m)return;const p=m.nextElementSibling;if(p&&p.classList.contains("pagination-nav")&&p.remove(),a<=fe)return;const w=Math.ceil(a/fe),v=document.createElement("nav");v.className="pagination-nav flex justify-center items-center gap-2 mt-8 mb-4";const h=document.createElement("button");h.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>',h.className=`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${H===1?"opacity-50 cursor-not-allowed":""}`,h.disabled=H===1,h.onclick=()=>{H>1&&(H--,c(),window.scrollTo({top:m.offsetTop-100,behavior:"smooth"}))};const g=document.createElement("span");g.className="text-xs text-gray-500 font-medium",g.innerText=`Página ${H} de ${w}`;const x=document.createElement("button");x.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>',x.className=`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${H===w?"opacity-50 cursor-not-allowed":""}`,x.disabled=H===w,x.onclick=()=>{H<w&&(H++,c(),window.scrollTo({top:m.offsetTop-100,behavior:"smooth"}))},v.appendChild(h),v.appendChild(g),v.appendChild(x),m.parentNode.insertBefore(v,m.nextSibling)}F&&F.addEventListener("click",a=>{a.preventDefault(),Ie()}),T&&T.addEventListener("click",a=>{a.preventDefault(),Pe()});function ye(){var l;(l=document.getElementById("toc-toggle-btn"))==null||l.remove();const a=document.getElementById("toc-panel");a&&(a.classList.add("translate-y-full"),setTimeout(()=>a.remove(),310)),document.body.style.overflow=""}function je(){var a;(a=document.getElementById("global-search-wrapper"))==null||a.classList.remove("hidden")}function pt(){var a;(a=document.getElementById("global-search-wrapper"))==null||a.classList.add("hidden"),u&&(u.value="")}function Ie(){var c;$(null),ye(),je(),u&&(u.value=""),r.classList.remove("hidden"),o.classList.remove("hidden"),e.classList.remove("hidden"),n.classList.add("justify-center","pt-24"),n.classList.remove("pt-8"),f.classList.add("hidden","opacity-0"),f.innerHTML="",t&&t.classList.add("hidden","opacity-0"),(c=document.getElementById("analisis-container"))==null||c.classList.add("hidden","opacity-0");const a=document.getElementById("search-filters");a&&a.remove();const l=document.querySelector(".pagination-nav");l&&l.remove(),H=1,W={type:"all",law:"all",artNum:""}}function Pe(){var m;if($(null),ye(),je(),r.classList.add("hidden"),o.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),(m=document.getElementById("analisis-container"))==null||m.classList.add("hidden","opacity-0"),n.classList.remove("justify-center","pt-24"),n.classList.add("pt-8"),f.classList.remove("hidden"),setTimeout(()=>f.classList.remove("opacity-0"),50),u&&(u.value=""),U.length===0){f.innerHTML='<div class="text-center py-12 text-gray-400">Cargando leyes...</div>';return}const a=U.filter(p=>p.titulo.toLowerCase().startsWith("ley")),l=U.filter(p=>p.titulo.toLowerCase().startsWith("reglamento")),c=U.filter(p=>!p.titulo.toLowerCase().startsWith("ley")&&!p.titulo.toLowerCase().startsWith("reglamento"));f.innerHTML=`
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Marco Jurídico Disponible</h2>
                <p class="text-sm text-gray-400 font-light">Explora las leyes y reglamentos indexados en el sistema.</p>
            </div>
            
            ${Ye("Leyes Federales",a)}
            ${Ye("Reglamentos",l)}
            ${Ye("Acuerdos y Otros Instrumentos",c)}
        `,document.querySelectorAll(".law-card").forEach(p=>{p.addEventListener("click",()=>{const w=p.dataset.title,v=U.find(h=>h.titulo===w);v&&Me(v)})}),document.querySelectorAll(".carousel-container").forEach(p=>{const w=p.querySelector(".carousel-scroll"),v=p.querySelector(".scroll-left"),h=p.querySelector(".scroll-right");v&&h&&w&&(v.addEventListener("click",()=>{w.scrollBy({left:-300,behavior:"smooth"})}),h.addEventListener("click",()=>{w.scrollBy({left:300,behavior:"smooth"})}))})}function Ye(a,l){if(l.length===0)return"";const c=a.toLowerCase().includes("ley"),m=a.toLowerCase().includes("reglamento"),p=c?{gradFrom:"#6b1532",gradTo:"#9B2247",label:"Ley Federal",dotClass:"bg-guinda"}:m?{gradFrom:"#14403a",gradTo:"#1E5B4F",label:"Reglamento",dotClass:"bg-emerald-700"}:{gradFrom:"#7a5c1e",gradTo:"#A57F2C",label:"Instrumento",dotClass:"bg-amber-700"},w=c?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>':m?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>';return`
            <div class="mb-10 carousel-container group/section">
                <h3 class="text-lg font-bold text-gray-800 mb-4 px-1 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${p.dotClass} flex-shrink-0"></span>
                    ${a}
                    <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${l.length}</span>
                </h3>

                <div class="relative">
                    <!-- Left Arrow -->
                    <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white/90 backdrop-blur border border-gray-100 shadow-lg rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-opacity disabled:opacity-0 hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>

                    <!-- Carousel Track -->
                    <div class="carousel-scroll flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 snap-x scrollbar-hide scroll-smooth">
                        ${l.map(v=>{const h=v.resumen?v.resumen.replace(/\n/g," ").slice(0,110)+(v.resumen.length>110?"…":""):v.temas_clave&&v.temas_clave.length>0?v.temas_clave.slice(0,3).join(" · "):"Ver artículos";return`
                            <div class="min-w-[300px] w-[300px] md:min-w-[340px] md:w-[340px] snap-start rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer law-card group flex flex-col h-[280px]"
                                data-title="${v.titulo.replace(/"/g,"&quot;")}"
                                style="background: linear-gradient(160deg, ${p.gradFrom} 0%, ${p.gradTo} 100%);">

                                <!-- Top: icon + label -->
                                <div class="flex items-start justify-between px-5 pt-5 pb-3">
                                    <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);">
                                        <svg class="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">${w}</svg>
                                    </div>
                                    <span class="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white/80" style="background: rgba(255,255,255,0.15);">${p.label}</span>
                                </div>

                                <!-- Middle: title + description -->
                                <div class="flex-1 px-5 pb-2 flex flex-col justify-center">
                                    <h3 class="text-sm font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-white/90 transition-colors" title="${v.titulo.replace(/"/g,"&quot;")}">${v.titulo}</h3>
                                    <p class="text-[11px] text-white/65 leading-relaxed line-clamp-3">${h}</p>
                                </div>

                                <!-- Footer: metadata bar -->
                                <div class="flex items-center justify-between px-5 py-3" style="background: rgba(0,0,0,0.25); backdrop-filter: blur(4px);">
                                    <div class="flex items-center gap-1.5 text-white/70 text-[10px]">
                                        <svg class="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <span>${v.articulos} artículos</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-white/50 text-[10px]">${v.fecha||"N/D"}</span>
                                        <svg class="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </div>
                                </div>
                            </div>`}).join("")}
                    </div>

                    <!-- Right Arrow -->
                    <button class="scroll-right absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white/90 backdrop-blur border border-gray-100 shadow-lg rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-opacity hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        `}function Me(a){var ve,ot,_t,Bt,It,At,Tt;if(!t)return;ye(),pt(),q=mr(a.titulo);const l=[...new Set(q.map(C=>C.capitulo_nombre).filter(Boolean))];[...new Set(q.map(C=>C.titulo_nombre).filter(Boolean))];const c=q.filter(C=>C.articulo_label.toLowerCase().includes("transitorio")).length;f.classList.add("hidden"),r.classList.add("hidden"),o.classList.add("hidden"),e.classList.add("hidden"),(ve=document.getElementById("analisis-container"))==null||ve.classList.add("hidden","opacity-0"),t.classList.remove("hidden"),setTimeout(()=>t.classList.remove("opacity-0"),50),$(`#ley-${encodeURIComponent(a.id)}`);let m=100,p=localStorage.getItem("reader-theme")||"light";t.innerHTML=`
            <!-- Desktop Reading Controls (hidden on mobile) -->
            <div id="reading-controls" class="hidden md:flex fixed bottom-6 right-6 z-40 flex-col gap-2 animate-fade-in-up">
                 <div class="bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-2xl p-2 flex flex-col gap-2 items-center transition-colors duration-300" id="reading-panel">
                    <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1">
                        <button id="btn-font-decrease" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors" title="Letra más pequeña">
                            <span class="font-serif text-sm">A</span>
                        </button>
                        <span id="font-size-display" class="text-[10px] font-bold text-gray-400 w-8 text-center">${m}%</span>
                        <button id="btn-font-increase" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors" title="Letra más grande">
                            <span class="font-serif text-lg font-bold">A</span>
                        </button>
                    </div>
                    <div class="w-full h-px bg-gray-100"></div>
                    <div class="flex gap-1">
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-white shadow-sm hover:scale-110 transition-transform ${p==="light"?"ring-2 ring-guinda ring-offset-1":""}" data-theme="light" title="Modo Claro"></button>
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-[#f4ecd8] shadow-sm hover:scale-110 transition-transform ${p==="sepia"?"ring-2 ring-guinda ring-offset-1":""}" data-theme="sepia" title="Modo Sepia"></button>
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-[#1a1a1a] shadow-sm hover:scale-110 transition-transform ${p==="dark"?"ring-2 ring-guinda ring-offset-1":""}" data-theme="dark" title="Modo Oscuro"></button>
                    </div>
                 </div>
            </div>

            <!-- Mobile: floating settings toggle -->
            <button id="mobile-reading-toggle" class="md:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-white border border-gray-200 shadow-xl rounded-full flex items-center justify-center text-gray-500 hover:text-guinda transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </button>
            <!-- Mobile reading overlay -->
            <div id="mobile-reading-overlay" class="md:hidden fixed inset-0 bg-black/30 z-40 hidden"></div>
            <!-- Mobile reading bottom sheet -->
            <div id="mobile-reading-sheet" class="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 transform translate-y-full transition-transform duration-300">
                <div class="flex justify-center pt-3 pb-1"><div class="w-10 h-1 bg-gray-200 rounded-full"></div></div>
                <div class="px-6 pb-10 pt-2">
                    <p class="text-sm font-bold text-gray-800 mb-5">Opciones de lectura</p>
                    <div class="mb-6">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tamaño de texto</p>
                        <div class="flex items-center gap-4">
                            <button id="mob-font-decrease" class="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center font-serif text-xl text-gray-600 active:bg-guinda active:text-white transition-colors">A</button>
                            <span id="mob-font-display" class="flex-1 text-center text-sm font-bold text-gray-500">${m}%</span>
                            <button id="mob-font-increase" class="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center font-serif text-3xl font-bold text-gray-600 active:bg-guinda active:text-white transition-colors">A</button>
                        </div>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Fondo</p>
                        <div class="grid grid-cols-3 gap-3">
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-white ${p==="light"?"border-guinda text-guinda":"border-gray-100 text-gray-700"}" data-theme="light">Blanco</button>
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-[#f4ecd8] ${p==="sepia"?"border-guinda text-guinda":"border-transparent text-[#5b4636]"}" data-theme="sepia">Sepia</button>
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-[#1a1a1a] ${p==="dark"?"border-guinda":"border-transparent"} text-white" data-theme="dark">Oscuro</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-8 animate-fade-in-up transition-colors duration-300" id="law-header-area">
                <nav aria-label="Ruta de navegación" class="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap">
                    <button id="crumb-inicio" class="hover:text-guinda transition-colors font-medium" aria-label="Ir al inicio">Inicio</button>
                    <svg class="w-3 h-3 text-gray-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    <button id="crumb-categoria" class="hover:text-guinda transition-colors font-medium" aria-label="Ver todas las leyes">${a.titulo.toLowerCase().startsWith("ley")?"Leyes Federales":a.titulo.toLowerCase().startsWith("reglamento")?"Reglamentos":"Acuerdos y Otros"}</button>
                    <svg class="w-3 h-3 text-gray-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    <span class="text-gray-600 font-semibold truncate max-w-[180px] sm:max-w-xs" title="${a.titulo.replace(/"/g,"&quot;")}">${a.titulo}</span>
                </nav>
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <span class="text-xs font-bold text-guinda uppercase tracking-widest bg-guinda/5 px-2 py-1 rounded-full">Marco Legal Vigente</span>
                        <h1 class="text-3xl sm:text-4xl font-head font-bold text-gray-900 mt-3 mb-2">${a.titulo}</h1>
                        <p class="text-sm text-gray-500">Publicado: ${a.fecha} · Última reforma: ${a.fecha}</p>
                        ${a.resumen?`<div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 font-light leading-relaxed max-w-4xl">${a.resumen.split(`

`)[0]}</div>`:""}
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <!-- Share button for the law -->
                        <div class="relative" id="law-share-wrapper">
                            <button id="law-share-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-2 shadow-sm">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Compartir
                            </button>
                            <div id="law-share-menu" class="hidden absolute bottom-full mb-2 right-0 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden w-56 z-20">
                                <div class="px-4 py-2 bg-gray-50/80 border-b border-gray-50">
                                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Compartir ley</span>
                                </div>
                                <button id="law-share-whatsapp-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style="background:#25D366">
                                        <svg viewBox="0 0 24 24" fill="white" class="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    </span>
                                    WhatsApp
                                </button>
                                <div class="border-t border-gray-50 mx-3 my-0.5"></div>
                                <button id="law-share-telegram-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style="background:#229ED9">
                                        <svg viewBox="0 0 24 24" fill="white" class="w-4 h-4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                                    </span>
                                    Telegram
                                </button>
                                <button id="law-share-twitter-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-black">
                                        <svg viewBox="0 0 24 24" fill="white" class="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                    </span>
                                    Twitter / X
                                </button>
                                <button id="law-share-email-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-500">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    </span>
                                    Correo electrónico
                                </button>
                                <div class="border-t border-gray-50 mx-3 my-0.5"></div>
                                <button id="law-share-link-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-blue-100">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                                    </span>
                                    Copiar enlace
                                </button>
                            </div>
                        </div>
                        <button id="export-csv-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-guinda hover:text-guinda transition-all flex items-center gap-2 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Exportar CSV
                        </button>
                        <button id="print-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-guinda hover:text-guinda transition-all flex items-center gap-2 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Imprimir / PDF
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats & Structure Dashboard -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up" style="animation-delay: 0.1s;">
                 <!-- Metric Cards -->
                 <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                     <span class="text-3xl font-head font-bold text-guinda">${q.length}</span>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mt-1">Artículos</span>
                 </div>
                 <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                     <span class="text-3xl font-head font-bold text-guinda">${l.length}</span>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mt-1">Capítulos</span>
                 </div>
                 <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                     <span class="text-3xl font-head font-bold text-guinda">${c}</span>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mt-1">Transitorios</span>
                 </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-fade-in-up" style="animation-delay: 0.2s;">
                <!-- Structure Chart (Expanded) -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 class="font-head font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        Distribución de Contenido
                    </h3>
                    <div id="law-structure-chart" class="w-full h-64"></div>
                </div>

                <!-- Topics Cloud -->
                <div class="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 class="font-head font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        Temas Principales
                    </h3>
                    <div class="flex flex-wrap gap-2 content-start">
                        ${a.temas_clave?a.temas_clave.map(C=>`<button class="theme-filter-btn text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-guinda hover:text-white hover:border-guinda transition-all shadow-sm" data-theme="${C}">${C}</button>`).join(""):'<span class="text-xs text-gray-400">No disponibles</span>'}
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="animate-fade-in-up" style="animation-delay: 0.3s;">
                <!-- Scoped Search -->
                <div class="relative mb-6 group max-w-2xl mx-auto">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg class="h-4 w-4 text-gray-400 group-focus-within:text-guinda transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="law-search-input" 
                        class="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-guinda/10 focus:border-guinda transition-all" 
                        placeholder="Buscar artículos específicos en ${a.titulo}...">
                </div>

                <!-- Articles List -->
                <div id="law-articles-list" class="space-y-4 max-w-4xl mx-auto">
                    <!-- Render initial articles -->
                </div>
            </div>
        `;const w=document.createElement("button");w.id="toc-toggle-btn",w.className="fixed bottom-24 left-4 z-40 bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-600 flex items-center gap-2 hover:text-guinda hover:border-guinda transition-all duration-300 group animate-fade-in-up",w.innerHTML=`
            <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10M4 18h6"/></svg>
            Índice
            <span class="bg-guinda/10 text-guinda px-1.5 py-0.5 rounded-full text-[9px] font-bold">${q.length}</span>
        `,document.body.appendChild(w);const v=q.map((C,z)=>{const oe=C.articulo_label.match(/\d+/),te=oe?oe[0]:z+1,ze=!!Re(C.id);return`<button class="toc-art-btn text-[11px] font-medium rounded-lg py-2 px-1 border transition-all text-center relative
                ${Oe(C.id)?"border-guinda/30 bg-guinda/5 text-guinda":"border-gray-100 bg-white text-gray-600 hover:border-guinda hover:text-guinda hover:bg-guinda/5"}"
                data-id="${C.id}" title="${C.articulo_label}">
                Art.${te}
                ${ze?'<span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>':""}
            </button>`}).join(""),h=q.map(C=>{const z=!!Re(C.id),oe=Oe(C.id),te=C.titulo_nombre?`<span class="text-gray-400 ml-1 font-normal">· ${C.titulo_nombre}</span>`:"",ze=C.texto?C.texto.replace(/\s+/g," ").substring(0,120).trim()+(C.texto.length>120?"...":""):"";return`<button class="toc-art-btn w-full flex flex-col gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-guinda/5 group/item
                ${oe?"text-guinda":"text-gray-700 hover:text-guinda"}"
                data-id="${C.id}">
                <div class="flex items-center gap-3">
                    <span class="flex-shrink-0 text-[10px] font-bold min-w-[36px] text-center py-1 rounded-md
                        ${oe?"bg-guinda/10 text-guinda":"bg-gray-100 text-gray-500 group-hover/item:bg-guinda/10 group-hover/item:text-guinda"}">
                        ${C.articulo_label.replace(/Artículo\s*/i,"Art.").split(" ")[0]+(C.articulo_label.match(/\d+/)?" "+C.articulo_label.match(/\d+/)[0]:"")}
                    </span>
                    <span class="text-xs font-medium flex-1 leading-snug">
                        ${C.articulo_label}${te}
                    </span>
                    <span class="flex-shrink-0 flex items-center gap-1">
                        ${z?'<span class="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Tiene nota"></span>':""}
                        ${oe?'<svg class="w-3 h-3 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>':""}
                    </span>
                </div>
                ${ze?`<span class="text-[11px] text-gray-500 leading-tight line-clamp-2">${ze}</span>`:""}
            </button>`}).join(""),g=document.createElement("div");g.id="toc-panel",g.className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 transform translate-y-full transition-transform duration-300 flex flex-col",g.style.maxHeight="75vh",g.innerHTML=`
            <!-- Handle bar -->
            <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>
            <!-- Header -->
            <div class="flex items-center justify-between px-5 pt-2 pb-3 flex-shrink-0">
                <div>
                    <p class="text-sm font-bold text-gray-800">Índice de Artículos</p>
                    <p class="text-[10px] text-gray-400 mt-0.5">${q.length} artículos · clic para abrir</p>
                </div>
                <button id="toc-close-btn" class="p-2 text-gray-400 hover:text-guinda transition-colors rounded-full hover:bg-guinda/5" aria-label="Cerrar índice">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <!-- Tabs -->
            <div class="flex gap-1 px-5 pb-3 flex-shrink-0 border-b border-gray-50">
                <button id="toc-tab-grid" class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all bg-guinda text-white shadow-sm">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                    Números
                </button>
                <button id="toc-tab-list" class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all text-gray-500 hover:text-guinda hover:bg-guinda/5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10M4 18h6"/></svg>
                    Artículos
                </button>
                <!-- Quick search inside TOC -->
                <div class="ml-auto relative flex items-center">
                    <svg class="absolute left-2.5 w-3 h-3 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input id="toc-search" type="text" placeholder="Filtrar…"
                        class="text-xs border border-gray-200 rounded-full pl-7 pr-3 py-1.5 w-32 focus:outline-none focus:border-guinda focus:ring-1 focus:ring-guinda/20 transition-all bg-white placeholder-gray-300">
                </div>
            </div>
            <!-- Content: Grid view (default) -->
            <div id="toc-content-grid" class="overflow-y-auto flex-1 px-4 py-3">
                <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-1.5">
                    ${v}
                </div>
            </div>
            <!-- Content: List view (hidden by default) -->
            <div id="toc-content-list" class="hidden overflow-y-auto flex-1 px-3 py-2 space-y-0.5">
                ${h}
            </div>
        `,document.body.appendChild(g);const x=g.querySelector("#toc-tab-grid"),E=g.querySelector("#toc-tab-list"),y=g.querySelector("#toc-content-grid"),S=g.querySelector("#toc-content-list"),B=g.querySelector("#toc-search"),V=["bg-guinda","text-white","shadow-sm"],G=["text-gray-500","hover:text-guinda","hover:bg-guinda/5"];x.addEventListener("click",()=>{x.classList.add(...V),x.classList.remove(...G),E.classList.remove(...V),E.classList.add(...G),y.classList.remove("hidden"),S.classList.add("hidden"),B&&(B.value=""),y.querySelectorAll(".toc-art-btn").forEach(C=>C.style.display="")}),E.addEventListener("click",()=>{E.classList.add(...V),E.classList.remove(...G),x.classList.remove(...V),x.classList.add(...G),S.classList.remove("hidden"),y.classList.add("hidden"),B&&(B.value=""),S.querySelectorAll(".toc-art-btn").forEach(C=>C.style.display="")}),B&&(B.addEventListener("input",C=>{const z=C.target.value.toLowerCase().trim();(S.classList.contains("hidden")?y:S).querySelectorAll(".toc-art-btn").forEach(te=>{var st;const ze=!z||((st=te.title)==null?void 0:st.toLowerCase().includes(z))||te.textContent.toLowerCase().includes(z);te.style.display=ze?"":"none"})}),B.addEventListener("click",C=>C.stopPropagation()));let ee=!1;const Ce=C=>{ee=C,C?(g.classList.remove("translate-y-full"),document.body.style.overflow="hidden"):(g.classList.add("translate-y-full"),document.body.style.overflow="")};w.addEventListener("click",()=>Ce(!ee)),(ot=g.querySelector("#toc-close-btn"))==null||ot.addEventListener("click",()=>Ce(!1)),g.querySelectorAll(".toc-art-btn").forEach(C=>{C.addEventListener("click",()=>{Ce(!1),ge(C.dataset.id)})}),Fe(q.slice(0,20),""),setTimeout(()=>{mt(q)},100);const he=document.getElementById("law-articles-list"),$e=document.getElementById("btn-font-increase"),_e=document.getElementById("btn-font-decrease"),be=document.getElementById("font-size-display"),De=document.querySelectorAll(".theme-btn");document.getElementById("law-header-area");const Ge=C=>{if(p=C,localStorage.setItem("reader-theme",C),document.body.className=`bg-${C} text-gray-900 font-body min-h-screen flex flex-col antialiased transition-colors duration-300`,De.forEach(z=>{z.classList.remove("ring-2","ring-guinda","ring-offset-1"),z.dataset.theme===C&&z.classList.add("ring-2","ring-guinda","ring-offset-1")}),document.querySelectorAll(".mob-theme-btn").forEach(z=>{z.classList.remove("border-guinda","text-guinda"),z.classList.add("border-transparent"),z.dataset.theme===C&&(z.classList.remove("border-transparent"),z.classList.add("border-guinda"),C!=="dark"&&z.classList.add("text-guinda"))}),!document.getElementById("reader-themes-style")){const z=document.createElement("style");z.id="reader-themes-style",z.innerHTML=`
                    /* Sepia Mode */
                    .bg-sepia { background-color: #f4ecd8 !important; color: #5b4636 !important; }
                    .bg-sepia .bg-white { background-color: #fdf6e3 !important; border-color: #e6dcb1 !important; }
                    .bg-sepia .text-gray-900, .bg-sepia .text-gray-800 { color: #433422 !important; }
                    .bg-sepia .text-gray-600, .bg-sepia .text-gray-500 { color: #5b4636 !important; }
                    .bg-sepia #reading-panel { background-color: rgba(253, 246, 227, 0.95) !important; border-color: #e6dcb1 !important; }
                    
                    /* Dark Mode */
                    .bg-dark { background-color: #121212 !important; color: #e5e5e5 !important; }
                    .bg-dark .bg-white { background-color: #1e1e1e !important; border-color: #2d2d2d !important; }
                    .bg-dark .text-gray-900, .bg-dark .text-gray-800 { color: #ffffff !important; }
                    .bg-dark .text-gray-700 { color: #d4d4d4 !important; }
                    .bg-dark .text-gray-600, .bg-dark .text-gray-500 { color: #a3a3a3 !important; }
                    .bg-dark .text-gray-400 { color: #737373 !important; }
                    .bg-dark .border-gray-100, .bg-dark .border-gray-200 { border-color: #2d2d2d !important; }
                    .bg-dark .bg-gray-50 { background-color: #252525 !important; }
                    .bg-dark .bg-guinda/5 { background-color: rgba(239, 68, 68, 0.1) !important; }
                    .bg-dark #reading-panel { background-color: rgba(30, 30, 30, 0.95) !important; border-color: #404040 !important; }
                    .bg-dark .text-guinda { color: #f87171 !important; } /* Soft red for dark mode */
                    .bg-dark #search-input { background-color: #1e1e1e !important; border-color: #404040 !important; color: #ffffff !important; }
                    .bg-dark #search-input::placeholder { color: #737373 !important; }
                    .bg-dark .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important; }
                    .bg-dark .hover:bg-gray-50:hover { background-color: #2d2d2d !important; }
                `,document.head.appendChild(z)}};Ge(p);const Be=()=>{he&&(he.style.fontSize=`${m}%`),document.querySelectorAll("#font-size-display, #mob-font-display").forEach(C=>{C.innerText=`${m}%`})};$e&&$e.addEventListener("click",()=>{m<250&&(m+=10,Be())}),_e&&_e.addEventListener("click",()=>{m>80&&(m-=10,Be())}),be&&(be.addEventListener("click",()=>{m=100,Be()}),be.style.cursor="pointer",be.title="Restablecer al 100%"),De.forEach(C=>{C.addEventListener("click",z=>{Ge(z.target.dataset.theme)})});const D=document.getElementById("mobile-reading-toggle"),ie=document.getElementById("mobile-reading-sheet"),le=document.getElementById("mobile-reading-overlay"),Je=C=>{ie==null||ie.classList.toggle("translate-y-full",!C),le==null||le.classList.toggle("hidden",!C)};D==null||D.addEventListener("click",()=>Je(!0)),le==null||le.addEventListener("click",()=>Je(!1)),(_t=document.getElementById("mob-font-decrease"))==null||_t.addEventListener("click",()=>{m>80&&(m-=10,Be())}),(Bt=document.getElementById("mob-font-increase"))==null||Bt.addEventListener("click",()=>{m<250&&(m+=10,Be())}),document.querySelectorAll(".mob-theme-btn").forEach(C=>{C.addEventListener("click",()=>{Ge(C.dataset.theme),Je(!1)})});const Qe=document.getElementById("law-share-btn"),re=document.getElementById("law-share-menu");document.getElementById("law-share-text-btn"),document.getElementById("law-share-link-btn"),Qe&&re&&(Qe.addEventListener("click",C=>{C.stopPropagation(),re.classList.toggle("hidden")}),document.addEventListener("click",function C(z){z.target.closest("#law-share-wrapper")||(re.classList.add("hidden"),document.removeEventListener("click",C))})),Object.entries({"law-share-whatsapp-btn":()=>Ue(a,"whatsapp"),"law-share-telegram-btn":()=>Ue(a,"telegram"),"law-share-twitter-btn":()=>Ue(a,"twitter"),"law-share-email-btn":()=>Ue(a,"email"),"law-share-link-btn":()=>{const C=`${location.origin}${location.pathname}#ley-${encodeURIComponent(a.id)}`;navigator.clipboard.writeText(C).then(()=>Z("¡Enlace copiado!","🔗","bg-blue-600"))}}).forEach(([C,z])=>{var oe;(oe=document.getElementById(C))==null||oe.addEventListener("click",()=>{re==null||re.classList.add("hidden"),z()})}),(It=document.getElementById("print-btn"))==null||It.addEventListener("click",()=>window.print()),(At=document.getElementById("crumb-inicio"))==null||At.addEventListener("click",()=>Ie()),(Tt=document.getElementById("crumb-categoria"))==null||Tt.addEventListener("click",()=>Pe()),document.querySelectorAll(".theme-filter-btn").forEach(C=>{C.addEventListener("click",z=>{const oe=z.target.dataset.theme,te=document.getElementById("law-search-input");te&&(te.value=oe,te.dispatchEvent(new Event("input")))})}),document.getElementById("law-search-input").addEventListener("input",C=>{const z=C.target.value.toLowerCase().trim();let oe=q;z.length>2&&(oe=q.filter(te=>te.texto.toLowerCase().includes(z)||te.articulo_label.toLowerCase().includes(z)||te.titulo_nombre&&te.titulo_nombre.toLowerCase().includes(z)||te.capitulo_nombre&&te.capitulo_nombre.toLowerCase().includes(z))),Fe(oe.slice(0,50),z)}),document.getElementById("export-csv-btn").addEventListener("click",()=>{Wt(q,`${a.titulo}.csv`)})}function mt(a){const l=document.getElementById("law-structure-chart");if(!l)return;if(!window.d3){l.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">Cargando visualización...</div>',setTimeout(()=>mt(a),1e3);return}if(l.innerHTML="",!a||a.length===0){l.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">No hay datos para visualizar</div>';return}const c={};a.forEach(S=>{let B=S.titulo_nombre||S.capitulo_nombre||"General";B=B.replace(/^TÍTULO\s+/i,"").replace(/^CAPÍTULO\s+/i,""),B=B.replace(/^[IVXLCDM]+\.?\s*-?\s*/,""),B=B.replace(/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)\.?\s*-?\s*/i,""),B=B.trim(),B||(B="General"),B.length>25&&(B=B.substring(0,25)+"..."),c[B]=(c[B]||0)+1});const m=Object.entries(c).map(([S,B])=>({name:S,value:B})).sort((S,B)=>B.value-S.value).slice(0,5);if(m.length===0){l.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">Datos insuficientes</div>';return}const p={top:10,right:30,bottom:20,left:220},w=l.clientWidth,h=Math.max(l.clientHeight,m.length*35+p.top+p.bottom);d3.select(l).select("svg").remove();const g=d3.select(l).append("svg").attr("width","100%").attr("height",h).attr("viewBox",[0,0,w,h]).attr("style","max-width: 100%; height: auto; font: 11px sans-serif;"),x=d3.scaleLinear().domain([0,d3.max(m,S=>S.value)]).range([p.left,w-p.right]),E=d3.scaleBand().domain(m.map(S=>S.name)).rangeRound([p.top,h-p.bottom]).padding(.3);d3.selectAll(".d3-tooltip").remove();const y=d3.select("body").append("div").attr("class","d3-tooltip absolute bg-gray-900/90 backdrop-blur text-white text-[10px] rounded-lg py-1.5 px-3 pointer-events-none opacity-0 transition-opacity z-50 shadow-xl border border-gray-700").style("display","none");g.append("g").attr("fill","#9B2247").selectAll("rect").data(m).join("rect").attr("x",x(0)).attr("y",S=>E(S.name)).attr("width",S=>Math.max(0,x(S.value)-x(0))).attr("height",E.bandwidth()).attr("rx",4).on("mouseover",(S,B)=>{d3.select(S.target).attr("fill","#7A1C39"),y.style("opacity","1").style("display","block").text(`${B.name}: ${B.value} artículos`)}).on("mousemove",S=>{y.style("left",S.pageX+10+"px").style("top",S.pageY-10+"px")}).on("mouseout",S=>{d3.select(S.target).attr("fill","#9B2247"),y.style("opacity","0").style("display","none")}),g.append("g").attr("fill","black").attr("text-anchor","start").attr("font-size","10px").selectAll("text").data(m).join("text").attr("x",S=>x(S.value)+4).attr("y",S=>E(S.name)+E.bandwidth()/2).attr("dy","0.35em").text(S=>S.value),g.append("g").call(d3.axisLeft(E).tickSize(0)).attr("transform",`translate(${p.left},0)`).call(S=>S.select(".domain").remove()).call(S=>S.selectAll("text").attr("fill","#4B5563").attr("font-weight","500").style("text-anchor","end").attr("dx","-6"))}function Fe(a,l){const c=document.getElementById("law-articles-list");if(c){if(a.length===0){c.innerHTML='<div class="text-center py-8 text-gray-400 text-sm">No se encontraron artículos que coincidan con la búsqueda.</div>';return}ke=a,c.innerHTML=a.map(m=>{const p=l?He(m.texto,l):m.texto.substring(0,300)+"...",w=!!Re(m.id),v=Oe(m.id)?'<svg class="w-3.5 h-3.5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>',h=se.includes(m.id),g=h?"text-guinda":se.length>=2?"text-gray-100":"text-gray-300 hover:text-guinda",x=h?"bg-guinda/10":"";return`
            <div class="relative bg-white border ${h?"border-guinda/30":"border-gray-100"} rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer result-item" data-id="${m.id}">
                <div class="flex items-center justify-between mb-2 pr-14">
                    <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        ${m.articulo_label}
                        ${w?'<span class="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Tiene nota"></span>':""}
                    </span>
                    <span class="text-[10px] text-gray-400">${m.titulo_nombre||""}</span>
                </div>
                <p class="text-sm text-gray-600 font-light leading-relaxed line-clamp-3">${p}</p>
                <button class="bookmark-card-btn absolute top-3 right-9 p-1 text-gray-300 hover:text-guinda transition-colors" data-id="${m.id}">${v}</button>
                <button class="compare-card-btn absolute top-3 right-3 p-1 ${g} ${x} rounded transition-colors" data-id="${m.id}" title="Comparar artículo">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                </button>
            </div>
            `}).join(""),document.querySelectorAll("#law-articles-list .result-item").forEach(m=>{m.addEventListener("click",p=>{p.target.closest(".bookmark-card-btn")||p.target.closest(".compare-card-btn")||ge(m.dataset.id)})}),document.querySelectorAll("#law-articles-list .bookmark-card-btn").forEach(m=>{m.addEventListener("click",p=>{p.stopPropagation();const w=document.getElementById("law-search-input");Ze(m.dataset.id);const v=w?w.value.toLowerCase().trim():"";Fe(q.slice(0,50),v)})}),document.querySelectorAll("#law-articles-list .compare-card-btn").forEach(m=>{m.addEventListener("click",p=>{var g;p.stopPropagation();const w=m.dataset.id,v=se.indexOf(w);v>=0?se.splice(v,1):se.length<2&&se.push(w),vt();const h=((g=document.getElementById("law-search-input"))==null?void 0:g.value.toLowerCase().trim())||"";Fe(q.slice(0,50),h)})})}}function Ht(a){return a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}const Vt=new Set(["de","la","el","los","las","en","a","con","por","para","del","al","se","su","sus","que","no","un","una","o","y","e","ni","u","lo","le","les","me","te","nos","mi","si","es","son","fue","ser","ha","han","hay","más","ya","pero","como","este","esta","ese","esa","ante","bajo","cada","cual","donde","entre","hacia","hasta","muy","poco","sin","sobre","solo","tan","todo","tras","otros"]);function He(a,l){if(!l||!a)return a||"";const c=l.trim().split(/\s+/),m=c.length>1,p=c.filter(h=>m?h.length>3&&!Vt.has(h.toLowerCase()):h.length>1);if(p.length===0)return a;const w=p.map(h=>Ht(h)).join("|"),v=new RegExp(`(${w})`,"gi");return a.replace(v,'<mark class="hl">$1</mark>')}function Ut(a,l){const c=l>0?a/l:0;return c>=.6?'<span class="text-[9px] font-bold text-guinda bg-guinda/10 px-1.5 py-0.5 rounded-full">Alta</span>':c>=.25?'<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Media</span>':'<span class="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">Baja</span>'}function Wt(a,l){const c=["Ley","Artículo","Texto"],m=a.map(h=>[`"${h.ley_origen}"`,`"${h.articulo_label}"`,`"${h.texto.replace(/"/g,'""')}"`]),p=[c.join(","),...m.map(h=>h.join(","))].join(`
`),w=new Blob([p],{type:"text/csv;charset=utf-8;"}),v=document.createElement("a");if(v.download!==void 0){const h=URL.createObjectURL(w);v.setAttribute("href",h),v.setAttribute("download",l),v.style.visibility="hidden",document.body.appendChild(v),v.click(),document.body.removeChild(v)}}function Gt(a){const l=Ke().filter(c=>c!==a);l.unshift(a),localStorage.setItem("search-history",JSON.stringify(l.slice(0,10)))}function Ke(){return JSON.parse(localStorage.getItem("search-history")||"[]")}o&&o.addEventListener("click",a=>{a.target.tagName==="BUTTON"&&(u.value=a.target.textContent,u.dispatchEvent(new Event("input")))});function Ne(a){return a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}function ft(a,l){const c=Ne(a),m=Ne(l),p=c.indexOf(m);return p===-1?we(a):we(a.slice(0,p))+`<mark class="bg-guinda/10 text-guinda font-semibold not-italic">${we(a.slice(p,p+l.length))}</mark>`+we(a.slice(p+l.length))}function we(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}if(u){let c=function(){return Array.from(a.querySelectorAll("[data-navigable]"))},m=function(h){const g=c();g.forEach((x,E)=>{x.classList.toggle("bg-gray-50",E===h),x.setAttribute("aria-selected",E===h?"true":"false")}),l=h,g[h]&&g[h].scrollIntoView({block:"nearest"})},p=function(){a.classList.add("hidden"),l=-1},w=function(h){var x;l=-1;const g=[];if(h){const E=U.filter(V=>Ne(V.titulo).includes(Ne(h))).slice(0,4);E.length>0&&g.push({label:"Leyes",items:E.map(V=>({html:`
                                <svg class="w-4 h-4 text-guinda opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                <span class="text-sm text-gray-700 font-medium truncate">${ft(V.titulo,h)}</span>`,attrs:`data-navigable data-law-title="${we(V.titulo)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-law"`}))});const y=fr(),S=Ne(h),B=[];for(const V of y){if(B.length>=4)break;const G=V.articulo_label||"",ee=V.titulo_nombre||"",Ce=V.capitulo_nombre||"",he=[G,ee,Ce].find($e=>$e&&Ne($e).includes(S));he&&B.push({art:V,matchField:he})}B.length>0&&g.push({label:"Artículos",items:B.map(({art:V,matchField:G})=>({html:`
                                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-sm text-gray-700 font-medium truncate">${ft(G,h)}</span>
                                    <span class="text-[11px] text-gray-400 truncate">${we(V.ley_origen)}</span>
                                </div>`,attrs:`data-navigable data-article-id="${we(V.id)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-article"`}))})}else{const E=Ke();if(E.length===0){p();return}g.push({label:"Búsquedas recientes",extra:'<button id="clear-all-history" class="text-gray-300 hover:text-guinda transition-colors text-[9px] normal-case tracking-normal">Borrar todo</button>',items:E.slice(0,7).map(y=>({html:`
                            <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="text-sm text-gray-600 truncate flex-1">${we(y)}</span>
                            <button class="remove-history-item text-gray-200 hover:text-gray-500 transition-colors text-base leading-none flex-shrink-0" data-query="${we(y)}">×</button>`,attrs:`data-navigable data-query="${we(y)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors history-item"`}))})}if(g.length===0){p();return}a.innerHTML=g.map(E=>`
                <div class="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span>${E.label}</span>
                    ${E.extra||""}
                </div>
                ${E.items.map(y=>`<div ${y.attrs}>${y.html}</div>`).join("")}
            `).join(""),a.classList.remove("hidden"),(x=document.getElementById("clear-all-history"))==null||x.addEventListener("click",E=>{E.stopPropagation(),localStorage.removeItem("search-history"),p()}),a.querySelectorAll(".history-item").forEach(E=>{E.addEventListener("click",y=>{if(y.target.classList.contains("remove-history-item")){y.stopPropagation();const S=y.target.dataset.query,B=Ke().filter(V=>V!==S);localStorage.setItem("search-history",JSON.stringify(B)),E.remove(),a.querySelectorAll(".history-item").length===0&&p();return}u.value=E.dataset.query,u.dispatchEvent(new Event("input")),p()})}),a.querySelectorAll(".suggestion-law").forEach(E=>{E.addEventListener("click",()=>{const y=E.dataset.lawTitle,S=U.find(B=>B.titulo===y);S&&(Me(S),p(),u.value="")})}),a.querySelectorAll(".suggestion-article").forEach(E=>{E.addEventListener("click",()=>{const y=E.dataset.articleId;y&&(ge(y),p(),u.value="")})})};var _r=c,Br=m,Ir=p,Ar=w;const a=document.createElement("div");a.id="autocomplete-results",a.className="absolute w-full bg-white border border-gray-100 rounded-2xl shadow-xl mt-2 hidden z-50 overflow-hidden max-h-96 overflow-y-auto",u.parentNode.appendChild(a);let l=-1;document.addEventListener("click",h=>{!u.contains(h.target)&&!a.contains(h.target)&&p()}),u.addEventListener("keydown",h=>{var x;if(a.classList.contains("hidden"))return;const g=c();h.key==="ArrowDown"?(h.preventDefault(),m(Math.min(l+1,g.length-1))):h.key==="ArrowUp"?(h.preventDefault(),m(Math.max(l-1,-1)),l===-1&&g.forEach(E=>E.classList.remove("bg-gray-50"))):h.key==="Enter"&&l>=0?(h.preventDefault(),(x=g[l])==null||x.click()):h.key==="Escape"&&p()}),u.addEventListener("focus",()=>{u.value.trim().length>0||w("")}),u.addEventListener("click",h=>{h.stopPropagation(),u.value.trim()||w("")});let v=null;u.addEventListener("input",h=>{var x,E;const g=h.target.value.trim();g.length>2?(ye(),t&&t.classList.add("hidden","opacity-0"),r.classList.add("hidden"),r.classList.remove("block"),o.classList.add("hidden"),e.classList.add("hidden"),n.classList.remove("justify-center","pt-24"),n.classList.add("pt-8"),f.classList.remove("hidden"),setTimeout(()=>f.classList.remove("opacity-0"),50),P&&P.classList.remove("hidden"),I(),w(g),clearTimeout(v),v=setTimeout(()=>{O=pr(g),_=g,H=1,W={type:"all",law:"all",artNum:""},Gt(g),Ae(),P&&P.classList.add("hidden")},250)):g.length===0&&(ye(),t&&t.classList.add("hidden","opacity-0"),r.classList.remove("hidden"),o.classList.remove("hidden"),e.classList.remove("hidden"),n.classList.add("justify-center","pt-24"),n.classList.remove("pt-8"),f.classList.add("hidden","opacity-0"),f.innerHTML="",(x=document.querySelector(".pagination-nav"))==null||x.remove(),(E=document.getElementById("search-filters"))==null||E.remove(),H=1,O=[],_="",w(""))})}let W={type:"all",law:"all",artNum:""},ke=[],se=[];function Ve(){return JSON.parse(localStorage.getItem("article-favorites")||"[]")}function Oe(a){return Ve().includes(a)}function Ze(a){const l=Ve(),c=l.indexOf(a);c>=0?l.splice(c,1):l.unshift(a),localStorage.setItem("article-favorites",JSON.stringify(l)),gt()}function gt(){const a=Ve().length,l=Object.keys(et()).length;document.querySelectorAll("#nav-favorites, #mobile-nav-favorites").forEach(c=>{c&&(c.classList.toggle("hidden",a===0&&l===0),c.querySelectorAll(".fav-count").forEach(m=>m.textContent=a))})}function et(){return JSON.parse(localStorage.getItem("article-notes")||"{}")}function Re(a){return et()[a]||""}function ht(a,l){const c=et();l.trim()?c[a]=l.trim():delete c[a],localStorage.setItem("article-notes",JSON.stringify(c))}function Jt(a,l,c=!1){const m=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),p=a.map(g=>{const x=c?Re(g.id):"";return`
            <div style="margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #f0f0f0;page-break-inside:avoid;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:10px;font-weight:700;color:#9B2247;background:#fdf2f5;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.08em;">${g.ley_origen}</span>
                    ${g.titulo_nombre?`<span style="font-size:10px;color:#6b7280;">${g.titulo_nombre}</span>`:""}
                </div>
                <h3 style="font-size:15px;font-weight:700;color:#111;margin:0 0 8px;">${g.articulo_label}</h3>
                <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 ${x?"10px":"0"};">${g.texto.substring(0,800)}${g.texto.length>800?"…":""}</p>
                ${x?`<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-top:8px;">
                    <span style="font-size:10px;font-weight:700;color:#92400e;display:block;margin-bottom:4px;">📝 Mi nota</span>
                    <p style="font-size:12px;color:#78350f;margin:0;line-height:1.6;">${x}</p>
                </div>`:""}
            </div>`}).join(""),w=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <title>${l} — SENER</title>
        <style>
            body{font-family:'Noto Sans',Arial,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;color:#1f2937;}
            h1{font-size:22px;font-weight:700;color:#9B2247;margin-bottom:4px;}
            .meta{font-size:11px;color:#9ca3af;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #f3f4f6;}
            @media print{body{margin:16px;}h1{font-size:18px;}}
        </style></head><body>
        <h1>${l}</h1>
        <div class="meta">Secretaría de Energía · Gobierno de México · Exportado el ${m} · ${a.length} artículo${a.length!==1?"s":""}</div>
        ${p}
        </body></html>`,v=new Blob([w],{type:"text/html;charset=utf-8;"}),h=document.createElement("a");h.href=URL.createObjectURL(v),h.download=`${l.replace(/\s+/g,"_")}_${m.replace(/\s/g,"-")}.html`,h.click(),URL.revokeObjectURL(h.href)}function Xt(a,l,c=!1){const m=["Ley","Artículo","Título","Texto",...c?["Nota personal"]:[]],p=a.map(g=>[`"${(g.ley_origen||"").replace(/"/g,'""')}"`,`"${(g.articulo_label||"").replace(/"/g,'""')}"`,`"${(g.titulo_nombre||"").replace(/"/g,'""')}"`,`"${(g.texto||"").replace(/"/g,'""')}"`,...c?[`"${Re(g.id).replace(/"/g,'""')}"`]:[]]),w=[m.join(","),...p.map(g=>g.join(","))].join(`
`),v=new Blob(["\uFEFF"+w],{type:"text/csv;charset=utf-8;"}),h=document.createElement("a");h.href=URL.createObjectURL(v),h.download=l,h.click(),URL.revokeObjectURL(h.href)}function bt(){var w,v,h;$(null),ye(),je();const a=Ve();r.classList.add("hidden"),o.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),(w=document.getElementById("analisis-container"))==null||w.classList.add("hidden","opacity-0"),n.classList.remove("justify-center","pt-24"),n.classList.add("pt-8"),f.classList.remove("hidden"),setTimeout(()=>f.classList.remove("opacity-0"),50);const l=document.getElementById("search-filters");if(l&&l.remove(),a.length===0){f.innerHTML='<div class="text-center py-16 text-gray-400 text-sm">No tienes artículos guardados aún.</div>';return}const c=a.map(g=>Te(g)).filter(Boolean);ke=c,f.innerHTML=`
            <div class="w-full mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 class="text-xl font-head font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        Mis Favoritos
                    </h2>
                    <p class="text-xs text-gray-400">${c.length} artículo${c.length!==1?"s":""} guardado${c.length!==1?"s":""}</p>
                </div>
                <div class="flex gap-2 flex-wrap">
                    <div class="relative group/export">
                        <button class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:border-guinda hover:text-guinda transition-all shadow-sm" id="export-favs-btn">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Exportar
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div id="export-favs-menu" class="hidden absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden w-52 z-20">
                            <div class="px-4 py-2 bg-gray-50/80 border-b border-gray-50">
                                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Exportar favoritos</span>
                            </div>
                            <button id="export-favs-html" class="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                <span class="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-50"><svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>
                                Descargar HTML (imprimible)
                            </button>
                            <button id="export-favs-csv" class="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                <span class="w-6 h-6 rounded-lg flex items-center justify-center bg-green-50"><svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18"/></svg></span>
                                Descargar CSV (Excel)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            ${c.map(g=>`
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer result-item" data-id="${g.id}">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${g.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 truncate max-w-[200px]">${g.titulo_nombre||""}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${g.articulo_label}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${g.texto.substring(0,300)}...</p>
            </div>
            `).join("")}
        `,document.querySelectorAll("#results-container .result-item").forEach(g=>{g.addEventListener("click",()=>ge(g.dataset.id))});const m=document.getElementById("export-favs-btn"),p=document.getElementById("export-favs-menu");m&&p&&(m.addEventListener("click",g=>{g.stopPropagation(),p.classList.toggle("hidden")}),document.addEventListener("click",function g(x){!x.target.closest("#export-favs-btn")&&!x.target.closest("#export-favs-menu")&&(p.classList.add("hidden"),document.removeEventListener("click",g))})),(v=document.getElementById("export-favs-html"))==null||v.addEventListener("click",()=>{p==null||p.classList.add("hidden"),Jt(c,"Mis Favoritos SENER",!1),Z("¡Exportando HTML!","📄","bg-blue-600")}),(h=document.getElementById("export-favs-csv"))==null||h.addEventListener("click",()=>{p==null||p.classList.add("hidden"),Xt(c,"favoritos_SENER.csv",!1),Z("¡Exportando CSV!","📊","bg-green-700")})}function vt(){var c,m;const a=document.getElementById("reading-controls");let l=document.getElementById("compare-bar");if(se.length===0){l==null||l.remove(),a&&(a.classList.remove("bottom-16"),a.classList.add("bottom-6"));return}l||(l=document.createElement("div"),l.id="compare-bar",document.body.appendChild(l)),a&&(a.classList.remove("bottom-6"),a.classList.add("bottom-16")),l.className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl py-3 px-6 flex items-center justify-between",l.innerHTML=`
            <div class="flex items-center gap-3">
                <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                <span class="text-xs font-bold text-gray-700">${se.length} de 2 seleccionados</span>
                ${se.length<2?'<span class="text-xs text-gray-400">Selecciona un artículo más para comparar</span>':""}
            </div>
            <div class="flex items-center gap-2">
                <button id="compare-clear-btn" class="text-xs text-gray-400 hover:text-guinda transition-colors px-3 py-1.5">Limpiar</button>
                ${se.length===2?'<button id="compare-go-btn" class="px-4 py-2 bg-guinda text-white text-xs font-bold rounded-full hover:bg-guinda/90 transition-colors">Comparar →</button>':""}
            </div>
        `,(c=document.getElementById("compare-clear-btn"))==null||c.addEventListener("click",()=>{var w;se=[],vt();const p=((w=document.getElementById("law-search-input"))==null?void 0:w.value.toLowerCase().trim())||"";Fe(q.slice(0,50),p)}),(m=document.getElementById("compare-go-btn"))==null||m.addEventListener("click",()=>{Yt(se[0],se[1])})}function Yt(a,l){const c=Te(a),m=Te(l);if(!c||!m)return;const p=document.getElementById("compare-modal"),w=document.getElementById("compare-content"),v=document.getElementById("compare-panel");if(!p||!w)return;const h=y=>`
            <div class="flex flex-col">
                <div class="mb-4 p-3 bg-guinda/5 rounded-xl border border-guinda/10">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider block mb-1">${y.ley_origen}</span>
                    <h4 class="font-bold text-gray-800 text-sm mb-0.5">${y.articulo_label}</h4>
                    <span class="text-xs text-gray-400">${y.titulo_nombre||""} ${y.capitulo_nombre?"· "+y.capitulo_nombre:""}</span>
                </div>
                <div class="text-sm text-gray-700 font-serif leading-relaxed">
                    ${y.texto.split(`

`).map(S=>`<p class="mb-3">${S}</p>`).join("")}
                </div>
            </div>`;w.innerHTML=h(c)+h(m),p.classList.remove("hidden"),p.classList.add("flex"),setTimeout(()=>{v==null||v.classList.remove("scale-95","opacity-0"),v==null||v.classList.add("scale-100","opacity-100")},10);const g=document.getElementById("compare-share-btn"),x=document.getElementById("compare-share-menu"),E=document.getElementById("compare-share-text-btn");g&&x&&(g.onclick=y=>{y.stopPropagation(),x.classList.toggle("hidden")},document.addEventListener("click",function y(S){S.target.closest("#compare-share-menu-wrapper")||(x.classList.add("hidden"),document.removeEventListener("click",y))})),E&&(E.onclick=()=>{x==null||x.classList.add("hidden"),tr(c,m)})}function tt(){const a=document.getElementById("compare-modal"),l=document.getElementById("compare-panel");l==null||l.classList.remove("scale-100","opacity-100"),l==null||l.classList.add("scale-95","opacity-0"),setTimeout(()=>{a==null||a.classList.add("hidden"),a==null||a.classList.remove("flex")},300)}async function Kt(a){const l=document.createElement("canvas");l.width=800,l.height=500;const c=l.getContext("2d"),m=c.createLinearGradient(0,0,0,l.height);m.addColorStop(0,"#9B2247"),m.addColorStop(1,"#6b1532"),c.fillStyle=m,c.fillRect(0,0,l.width,l.height),c.beginPath(),c.arc(l.width-60,60,120,0,Math.PI*2),c.fillStyle="rgba(255,255,255,0.06)",c.fill(),c.fillStyle="rgba(255,255,255,0.15)",c.beginPath(),c.roundRect(40,40,20+c.measureText(a.ley_origen).width+16,28,14),c.fill(),c.fillStyle="#fff",c.font="bold 13px system-ui, sans-serif",c.fillText(a.ley_origen,56,59),c.fillStyle="#fff",c.font="bold 28px system-ui, sans-serif";const p=xt(c,a.articulo_label,l.width-80);p.forEach((y,S)=>c.fillText(y,40,110+S*38));const w=110+p.length*38+16;c.strokeStyle="rgba(255,255,255,0.3)",c.lineWidth=1,c.beginPath(),c.moveTo(40,w),c.lineTo(l.width-40,w),c.stroke();const v=w+24,h=l.height-v-60;c.fillStyle="rgba(255,255,255,0.88)",c.font="16px Georgia, serif";const g=a.texto.replace(/\s+/g," ").trim().substring(0,500),x=xt(c,g,l.width-80);let E=0;for(const y of x){if(E*24>h){c.fillStyle="rgba(255,255,255,0.5)",c.font="13px system-ui, sans-serif",c.fillText("...",40,v+E*24);break}c.fillText(y,40,v+E*24),E++}return c.fillStyle="rgba(255,255,255,0.35)",c.fillRect(0,l.height-44,l.width,44),c.fillStyle="rgba(255,255,255,0.8)",c.font="12px system-ui, sans-serif",c.fillText("Buscador de Leyes Energéticas · SENER",40,l.height-16),l.toDataURL("image/png")}function xt(a,l,c,m){const p=l.split(" "),w=[];let v="";for(const h of p){const g=v?v+" "+h:h;a.measureText(g).width>c&&v?(w.push(v),v=h):v=g}return v&&w.push(v),w}function Zt(a){const l=`📋 *${a.articulo_label}*
🏛️ ${a.ley_origen}

${a.texto.substring(0,800)}${a.texto.length>800?"...":""}`,c=`https://wa.me/?text=${encodeURIComponent(l)}`;window.open(c,"_blank")}async function er(a){const l=await Kt(a),c=await(await fetch(l)).blob(),m=new File([c],"articulo.png",{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[m]}))await navigator.share({title:a.articulo_label,text:`${a.articulo_label} · ${a.ley_origen}`,files:[m]});else{const p=document.createElement("a");p.href=l,p.download=`${a.articulo_label.replace(/\s+/g,"_")}.png`,p.click()}}function tr(a,l){const c=`⚖️ *Comparación de Artículos*

📋 *${a.articulo_label}* – ${a.ley_origen}
${a.texto.substring(0,400)}${a.texto.length>400?"...":""}

📋 *${l.articulo_label}* – ${l.ley_origen}
${l.texto.substring(0,400)}${l.texto.length>400?"...":""}`,m=`https://wa.me/?text=${encodeURIComponent(c)}`;window.open(m,"_blank")}function rt(a,l){const c=`${location.origin}${location.pathname}#art-${encodeURIComponent(a.id)}`,m=`${a.articulo_label} · ${a.ley_origen}`,p=`📋 *${a.articulo_label}*
🏛️ ${a.ley_origen}

${a.texto.substring(0,500)}${a.texto.length>500?"...":""}

${c}`,w=`${a.articulo_label} · ${a.ley_origen} — Marco Legal Energético SENER`,v={telegram:`https://t.me/share/url?url=${encodeURIComponent(c)}&text=${encodeURIComponent(m)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(w)}&url=${encodeURIComponent(c)}`,email:`mailto:?subject=${encodeURIComponent(m)}&body=${encodeURIComponent(p)}`};v[l]&&window.open(v[l],"_blank")}function Ue(a,l){const c=`${location.origin}${location.pathname}#ley-${encodeURIComponent(a.id)}`,m=a.titulo,p=a.resumen?a.resumen.split(`

`)[0].substring(0,400):`${a.articulos} artículos`,w=`🏛️ *${a.titulo}*
📅 Publicado: ${a.fecha}
📖 ${a.articulos} artículos

${p}

${c}`,v=`${a.titulo} — Marco Legal Energético SENER`,h={whatsapp:`https://wa.me/?text=${encodeURIComponent(w)}`,telegram:`https://t.me/share/url?url=${encodeURIComponent(c)}&text=${encodeURIComponent(m)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(v)}&url=${encodeURIComponent(c)}`,email:`mailto:?subject=${encodeURIComponent(m)}&body=${encodeURIComponent(w)}`};h[l]&&window.open(h[l],"_blank")}function yt(){var h,g;$(null),ye(),je(),r.classList.add("hidden"),o.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),(h=document.getElementById("analisis-container"))==null||h.classList.add("hidden","opacity-0"),n.classList.remove("justify-center","pt-24"),n.classList.add("pt-8"),f.classList.remove("hidden"),setTimeout(()=>f.classList.remove("opacity-0"),50);const a=document.getElementById("search-filters");if(a&&a.remove(),U.length===0){f.innerHTML='<div class="text-center py-16 text-gray-400">Cargando datos...</div>';return}const l=U.reduce((x,E)=>x+E.articulos,0),c=U.filter(x=>x.titulo.toLowerCase().startsWith("ley")),m=U.filter(x=>x.titulo.toLowerCase().startsWith("reglamento")),p=U.filter(x=>!x.titulo.toLowerCase().startsWith("ley")&&!x.titulo.toLowerCase().startsWith("reglamento")),w=[...U].sort((x,E)=>E.articulos-x.articulos),v=((g=w[0])==null?void 0:g.articulos)||1;f.innerHTML=`
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Estadísticas del Marco Jurídico</h2>
                <p class="text-sm text-gray-400 font-light">Resumen del corpus legal indexado en el sistema.</p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-guinda block">${U.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Total Leyes</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-guinda block">${l.toLocaleString("es-MX")}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Artículos</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-emerald-700 block">${c.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Leyes Fed.</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-amber-700 block">${m.length+p.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Regl./Otros</span>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                <h3 class="font-bold text-gray-800 text-sm mb-5 flex items-center gap-2">
                    <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    Artículos por Ley
                </h3>
                <div class="space-y-3">
                    ${w.map(x=>{const E=x.titulo.toLowerCase().startsWith("ley"),y=x.titulo.toLowerCase().startsWith("reglamento"),S=E?"#9B2247":y?"#1E5B4F":"#A57F2C",B=Math.round(x.articulos/v*100);return`
                        <div class="flex items-center gap-3 cursor-pointer group stat-law-row" data-titulo="${x.titulo.replace(/"/g,"&quot;")}">
                            <div class="text-xs text-gray-500 w-44 truncate flex-shrink-0 group-hover:text-guinda transition-colors" title="${x.titulo}">${x.titulo}</div>
                            <div class="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500" style="width:${B}%; background:${S};"></div>
                            </div>
                            <span class="text-xs font-bold text-gray-500 w-8 text-right flex-shrink-0">${x.articulos}</span>
                        </div>`}).join("")}
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                ${[{label:"Leyes Federales",items:c,textClass:"text-guinda",bgClass:"bg-guinda/5"},{label:"Reglamentos",items:m,textClass:"text-emerald-700",bgClass:"bg-emerald-50"},{label:"Acuerdos y Otros",items:p,textClass:"text-amber-700",bgClass:"bg-amber-50"}].map(x=>`
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-bold ${x.textClass} uppercase tracking-widest">${x.label}</span>
                            <span class="text-xs ${x.bgClass} ${x.textClass} font-bold px-2 py-0.5 rounded-full">${x.items.length}</span>
                        </div>
                        <div class="space-y-1.5">
                            ${x.items.map(E=>`
                                <div class="text-xs text-gray-500 truncate hover:text-guinda cursor-pointer transition-colors stat-law-row" data-titulo="${E.titulo.replace(/"/g,"&quot;")}" title="${E.titulo}">${E.titulo}</div>
                            `).join("")}
                        </div>
                    </div>
                `).join("")}
            </div>
        `,document.querySelectorAll(".stat-law-row").forEach(x=>{x.addEventListener("click",()=>{const E=U.find(y=>y.titulo===x.dataset.titulo);E&&Me(E)})})}function Ae(){var g,x,E;if(!f)return;let a=O;if(W.type!=="all"&&(a=a.filter(y=>W.type==="ley"?y.ley_origen.toLowerCase().includes("ley"):W.type==="reglamento"?y.ley_origen.toLowerCase().includes("reglamento"):!y.ley_origen.toLowerCase().includes("ley")&&!y.ley_origen.toLowerCase().includes("reglamento"))),W.law!=="all"&&(a=a.filter(y=>y.ley_origen===W.law)),W.artNum){const y=parseInt(W.artNum);a=a.filter(S=>{const B=S.articulo_label.match(/\d+/);return B&&parseInt(B[0])===y})}const l=a,c=_,m=document.getElementById("search-filters");if(m&&m.remove(),O.length>0){const y=document.createElement("div");y.id="search-filters",y.className="flex flex-col items-center gap-2 mb-6 animate-fade-in-up";const S=[...new Set(O.map(G=>G.ley_origen))].sort();y.innerHTML=`
                <div class="flex flex-wrap justify-center gap-2">
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${W.type==="all"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="all">Todos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${W.type==="ley"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="ley">Leyes</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${W.type==="reglamento"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="reglamento">Reglamentos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${W.type==="otros"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="otros">Otros</button>
                </div>
                <div class="flex items-center gap-2 flex-wrap justify-center">
                    ${S.length>1?`
                    <select id="law-filter-select" class="text-xs border rounded-full px-4 py-1.5 focus:outline-none bg-white cursor-pointer transition-colors ${W.law!=="all"?"border-guinda text-guinda":"border-gray-200 text-gray-500 hover:border-guinda"}">
                        <option value="all">Todas las leyes</option>
                        ${S.map(G=>`<option value="${G}" ${W.law===G?"selected":""}>${G}</option>`).join("")}
                    </select>
                    `:""}
                    <div class="relative flex items-center">
                        <svg class="absolute left-3 w-3 h-3 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
                        <input type="number" id="art-number-filter" min="1" placeholder="Nº artículo"
                            value="${W.artNum}"
                            class="text-xs border rounded-full pl-8 pr-3 py-1.5 w-28 focus:outline-none bg-white transition-colors ${W.artNum?"border-guinda text-guinda":"border-gray-200 text-gray-500 hover:border-guinda"} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                    </div>
                    ${W.type!=="all"||W.law!=="all"||W.artNum?`
                    <button id="clear-all-filters" class="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-full border border-red-100 hover:border-red-200 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        Limpiar filtros
                    </button>`:""}
                </div>
            `,f.parentNode.insertBefore(y,f),y.querySelectorAll(".filter-btn").forEach(G=>{G.addEventListener("click",ee=>{W.type=ee.target.dataset.type,H=1,Ae()})});const B=document.getElementById("law-filter-select");B&&B.addEventListener("change",G=>{W.law=G.target.value,H=1,Ae()});const V=document.getElementById("art-number-filter");if(V){let G;V.addEventListener("input",ee=>{clearTimeout(G),G=setTimeout(()=>{W.artNum=ee.target.value.trim(),H=1,Ae()},400)})}(g=document.getElementById("clear-all-filters"))==null||g.addEventListener("click",()=>{W={type:"all",law:"all",artNum:""},H=1,Ae()})}if(l.length===0){const y=W.type!=="all"||W.law!=="all";f.innerHTML=`
                <div class="text-center py-16 px-4">
                    <div class="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <h3 class="font-head text-lg font-bold text-gray-700 mb-2">
                        ${y?"Sin resultados con los filtros actuales":`Sin resultados para "<span class="text-guinda">${c}</span>"`}
                    </h3>
                    <p class="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                        ${y?"Prueba cambiando o eliminando los filtros aplicados.":"Intenta con otras palabras, un artículo específico o explora directamente las leyes."}
                    </p>
                    ${y?"":`
                    <div class="flex flex-wrap gap-2 justify-center mb-4">
                        ${["Transmisión","Generación","CENACE","Distribución","Tarifas","Permisos"].map(B=>`<button class="empty-suggestion px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500 hover:bg-guinda/5 hover:border-guinda/30 hover:text-guinda transition-all">${B}</button>`).join("")}
                    </div>
                    <button id="empty-browse-laws" class="text-xs font-semibold text-guinda hover:text-guinda/70 transition-colors underline underline-offset-2">Explorar todas las leyes →</button>
                    `}
                </div>`,f.querySelectorAll(".empty-suggestion").forEach(B=>{B.addEventListener("click",()=>{u&&(u.value=B.textContent,u.dispatchEvent(new Event("input")))})}),(x=document.getElementById("empty-browse-laws"))==null||x.addEventListener("click",()=>Pe());const S=document.getElementById("results-container").nextElementSibling;S&&S.classList.contains("pagination-nav")&&S.remove();return}const p=(H-1)*fe,w=p+fe,v=l.slice(p,w),h=((E=l[0])==null?void 0:E.score)||1;ke=l,f.innerHTML=v.map(y=>{const S=He(y.texto.substring(0,300)+"...",c),B=He(y.articulo_label,c),V=Ut(y.score,h),G=Oe(y.id)?'<svg class="w-4 h-4 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';return`
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer result-item" data-id="${y.id}">
                <button class="bookmark-card-btn absolute top-3 right-3 p-1.5 text-gray-300 hover:text-guinda transition-colors rounded-full hover:bg-guinda/5 z-10" data-id="${y.id}" title="Guardar en favoritos">${G}</button>
                <div class="flex items-center gap-2 mb-2 flex-wrap pr-8">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${y.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 font-medium tracking-wide truncate max-w-[200px]">${y.titulo_nombre||""}</span>
                    <span class="ml-auto">${V}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${B}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${S}</p>
            </div>
            `}).join(""),X(l.length,"results-container",Ae),document.querySelectorAll(".result-item").forEach(y=>{y.addEventListener("click",S=>{S.target.closest(".bookmark-card-btn")||ge(y.dataset.id)})}),document.querySelectorAll(".bookmark-card-btn").forEach(y=>{y.addEventListener("click",S=>{S.stopPropagation(),Ze(y.dataset.id),Ae()})})}function ge(a){const l=Te(a);if(!l)return;L.textContent=l.ley_origen,k.textContent=l.articulo_label,L.onclick=()=>{const D=U.find(ie=>ie.titulo===l.ley_origen);D&&(We(),setTimeout(()=>Me(D),310))};let c=l.texto.replace(/\r\n/g,`
`).replace(/\n\s*\n/g,`

`).replace(/([a-z,;])\n([a-z])/g,"$1 $2");const m=D=>_?He(D,_):D,p=D=>D&&D!=="null"&&D!=="undefined"&&D.trim()?D.trim():null,w=p(l.titulo_nombre),v=p(l.capitulo_nombre),h=[w,v].filter(Boolean);b.innerHTML=`
            ${h.length?`
            <div class="mb-5 pb-5 border-b border-gray-50">
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-guinda/60 uppercase tracking-[0.2em] mb-2">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                    Ubicación en el documento
                </div>
                <div class="flex flex-wrap gap-x-2 gap-y-1">
                    ${h.map((D,ie)=>`
                        <span class="text-xs text-gray-600 font-medium">${D}</span>
                        ${ie<h.length-1?'<span class="text-gray-200">›</span>':""}
                    `).join("")}
                </div>
            </div>`:""}
            ${_?`
            <div class="mb-5 flex items-center gap-2 text-[11px] text-guinda/70 bg-guinda/5 border border-guinda/10 px-3 py-2 rounded-lg">
                <svg class="w-3 h-3 flex-shrink-0 text-guinda/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span class="font-medium">Búsqueda:</span> <mark class="hl">${_}</mark>
            </div>`:""}
            <div class="text-gray-800 leading-[1.85] text-[0.92rem]" style="font-family:'Merriweather',serif; text-align:justify; hyphens:auto;">
                ${c.split(`

`).map(D=>`<p class="mb-4">${m(D)}</p>`).join("")}
            </div>
        `;const g=ke.findIndex(D=>D.id===a),x=ke.length,E=document.getElementById("modal-prev-btn"),y=document.getElementById("modal-next-btn"),S=document.getElementById("modal-nav-counter");E&&(E.disabled=g<=0,E.onclick=()=>{g>0&&ge(ke[g-1].id)}),y&&(y.disabled=g<0||g>=x-1,y.onclick=()=>{g<x-1&&ge(ke[g+1].id)}),S&&(S.textContent=g>=0?`${g+1}/${x}`:"");const B=document.getElementById("modal-bookmark-btn");if(B){const D=Oe(a);B.innerHTML=D?'<svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>',B.onclick=()=>{Ze(a),ge(a)}}const V=document.getElementById("copy-btn");V&&(V.onclick=()=>{navigator.clipboard.writeText(b.innerText).then(()=>{Z("¡Texto copiado!","📋")})});const G=document.getElementById("share-btn"),ee=document.getElementById("share-menu");document.getElementById("share-text-btn"),document.getElementById("share-image-btn"),G&&ee&&(G.onclick=D=>{D.stopPropagation(),ee.classList.toggle("hidden")},document.addEventListener("click",function D(ie){ie.target.closest("#share-menu-wrapper")||(ee.classList.add("hidden"),document.removeEventListener("click",D))}));const Ce=Re(a);b.innerHTML+=`
            <div class="mt-8 pt-6 border-t border-gray-100" id="notes-section">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Mis notas
                    </span>
                    <button id="delete-note-btn" class="text-[10px] text-red-300 hover:text-red-500 transition-colors ${Ce?"":"hidden"}" aria-label="Borrar nota">Borrar</button>
                </div>
                <textarea id="article-note-input"
                    placeholder="Escribe tus anotaciones sobre este artículo..."
                    class="w-full text-xs text-gray-700 border border-amber-100 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all bg-amber-50/40 leading-relaxed font-light"
                    rows="3" aria-label="Notas del artículo">${Ce}</textarea>
                <div class="flex items-center justify-between mt-2">
                    <span id="note-saved-indicator" class="text-[10px] text-amber-500 flex items-center gap-1 ${Ce?"":"invisible"}">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        Guardada
                    </span>
                    <button id="save-note-btn" class="text-xs font-semibold text-guinda hover:text-guinda/70 transition-colors px-3 py-1.5 bg-guinda/5 rounded-lg hover:bg-guinda/10" aria-label="Guardar nota">Guardar</button>
                </div>
            </div>
        `;const he=document.getElementById("article-note-input"),$e=document.getElementById("save-note-btn"),_e=document.getElementById("delete-note-btn"),be=document.getElementById("note-saved-indicator");$e&&he&&$e.addEventListener("click",()=>{ht(a,he.value),Z("¡Nota guardada!","📝","bg-amber-600"),be==null||be.classList.remove("invisible"),_e&&_e.classList.toggle("hidden",!he.value.trim())}),_e&&he&&_e.addEventListener("click",()=>{ht(a,""),he.value="",be==null||be.classList.add("invisible"),_e.classList.add("hidden"),Z("Nota eliminada","🗑️","bg-gray-600")});const De=document.getElementById("cite-btn");De&&(De.onclick=()=>{const D=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),ie=`${location.origin}${location.pathname}#art-${encodeURIComponent(a)}`,le=`${l.articulo_label} de la ${l.ley_origen}${l.fecha_publicacion?", publicada el "+l.fecha_publicacion:""}. Secretaría de Energía, Gobierno de México. Consultado el ${D}. Disponible en: ${ie}`;(navigator.clipboard&&typeof navigator.clipboard.writeText=="function"?navigator.clipboard.writeText(le):Promise.reject(new Error("Clipboard API not available"))).then(()=>Z("¡Cita copiada!","📖","bg-guinda")).catch(()=>{var at,nt;const Qe=document.getElementById("citation-popover");if(Qe){Qe.remove();return}const re=document.createElement("div");re.id="citation-popover",re.className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4",re.innerHTML=`
                            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                                <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-guinda/5">
                                    <span class="text-xs font-bold text-guinda uppercase tracking-widest flex items-center gap-2">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                                        Cita formal
                                    </span>
                                    <button id="citation-popover-close" class="text-gray-400 hover:text-guinda transition-colors text-lg leading-none">×</button>
                                </div>
                                <div class="p-5">
                                    <p class="text-[11px] text-gray-400 mb-2">Mantén pulsado el texto para seleccionar y copiar:</p>
                                    <textarea id="citation-text-area" readonly
                                        class="w-full text-xs text-gray-700 border border-gray-100 rounded-xl p-3 resize-none focus:outline-none bg-gray-50 leading-relaxed font-light select-all"
                                        rows="4">${le}</textarea>
                                    <button id="citation-copy-btn" class="mt-3 w-full py-2.5 bg-guinda text-white text-xs font-semibold rounded-xl hover:bg-guinda/90 transition-colors">
                                        Copiar cita
                                    </button>
                                </div>
                            </div>`,document.body.appendChild(re),setTimeout(()=>{const ve=document.getElementById("citation-text-area");ve&&(ve.focus(),ve.select())},100),(at=document.getElementById("citation-copy-btn"))==null||at.addEventListener("click",()=>{const ve=document.getElementById("citation-text-area");if(ve){ve.select();try{document.execCommand("copy")}catch{}navigator.clipboard&&navigator.clipboard.writeText(le).catch(()=>{}),Z("¡Cita copiada!","📖","bg-guinda"),re.remove()}}),(nt=document.getElementById("citation-popover-close"))==null||nt.addEventListener("click",()=>re.remove()),re.addEventListener("click",ve=>{ve.target===re&&re.remove()})})}),Object.entries({"share-text-btn":()=>Zt(l),"share-image-btn":()=>er(l),"share-telegram-btn":()=>rt(l,"telegram"),"share-twitter-btn":()=>rt(l,"twitter"),"share-email-btn":()=>rt(l,"email")}).forEach(([D,ie])=>{const le=document.getElementById(D);le&&(le.onclick=()=>{ee==null||ee.classList.add("hidden"),ie()})}),$(`#art-${encodeURIComponent(a)}`),s.classList.remove("hidden"),s.classList.add("flex");const Be=document.getElementById("share-link-btn");Be&&(Be.onclick=()=>{ee==null||ee.classList.add("hidden");const D=`${location.origin}${location.pathname}#art-${encodeURIComponent(a)}`;navigator.clipboard.writeText(D).then(()=>Z("¡Enlace copiado!","🔗","bg-blue-600"))}),setTimeout(()=>{d.classList.remove("scale-95","opacity-0"),d.classList.add("scale-100","opacity-100")},10)}function We(){$(null),d.classList.remove("scale-100","opacity-100"),d.classList.add("scale-95","opacity-0"),setTimeout(()=>{s.classList.add("hidden"),s.classList.remove("flex")},300)}function wt(){var l;let a=document.getElementById("keyboard-help-modal");if(a){a.remove();return}a=document.createElement("div"),a.id="keyboard-help-modal",a.className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",a.innerHTML=`
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
                <div class="flex items-center justify-between mb-5">
                    <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        Atajos de Teclado
                    </h3>
                    <button id="kbd-help-close" class="text-gray-400 hover:text-guinda transition-colors text-lg leading-none">×</button>
                </div>
                <div class="space-y-2.5 text-xs">
                    ${[["/","Enfocar el buscador"],["Esc","Cerrar modal / panel"],["← →","Artículo anterior / siguiente"],["?","Mostrar esta ayuda"],["f","Agregar/quitar de favoritos"],["c","Copiar texto del artículo"]].map(([c,m])=>`
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500">${m}</span>
                            <kbd class="bg-gray-100 border border-gray-200 rounded px-2 py-0.5 font-mono text-[11px] text-gray-700 shadow-sm">${c}</kbd>
                        </div>
                    `).join("")}
                </div>
                <div class="mt-5 pt-4 border-t border-gray-50 text-[10px] text-gray-400 text-center">
                    Presiona <kbd class="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px]">?</kbd> para abrir esta ayuda
                </div>
            </div>
        `,document.body.appendChild(a),a.addEventListener("click",c=>{c.target===a&&a.remove()}),(l=document.getElementById("kbd-help-close"))==null||l.addEventListener("click",()=>a.remove())}function kt(){$(null),ye(),pt(),r.classList.add("hidden"),o.classList.add("hidden"),e.classList.add("hidden"),f.classList.add("hidden","opacity-0"),f.innerHTML="",t&&t.classList.add("hidden","opacity-0"),n.classList.remove("justify-center","pt-24"),n.classList.add("pt-8");const a=document.getElementById("analisis-container");a&&(a.classList.remove("hidden"),setTimeout(()=>a.classList.remove("opacity-0"),50),a.children.length===0&&Cr(a))}($t=document.getElementById("keyboard-help-btn"))==null||$t.addEventListener("click",wt),document.addEventListener("keydown",a=>{var p,w,v,h;const l=a.target.tagName,c=l==="INPUT"||l==="TEXTAREA"||l==="SELECT"||a.target.isContentEditable,m=!s.classList.contains("hidden");if(a.key==="?"&&!c){a.preventDefault(),wt();return}if(a.key==="Escape"){const g=document.getElementById("keyboard-help-modal");if(g){g.remove();return}const x=document.getElementById("toc-panel");if(x&&!x.classList.contains("translate-y-full")){x.classList.add("translate-y-full"),document.body.style.overflow="";return}if(m){We();return}const E=document.getElementById("compare-modal");if(E&&!E.classList.contains("hidden")){tt();return}return}if(a.key==="/"&&!c){a.preventDefault(),u&&(u.focus(),u.select());return}if(m&&!c){if(a.key==="ArrowRight"||a.key==="ArrowDown"){a.preventDefault(),(p=document.getElementById("modal-next-btn"))==null||p.click();return}if(a.key==="ArrowLeft"||a.key==="ArrowUp"){a.preventDefault(),(w=document.getElementById("modal-prev-btn"))==null||w.click();return}if(a.key==="f"||a.key==="F"){a.preventDefault(),(v=document.getElementById("modal-bookmark-btn"))==null||v.click();return}if((a.key==="c"||a.key==="C")&&!a.ctrlKey&&!a.metaKey){a.preventDefault(),(h=document.getElementById("copy-btn"))==null||h.click();return}}}),"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})}),A&&A.addEventListener("click",We),s==null||s.addEventListener("click",a=>{a.target===s&&We()}),M&&M.addEventListener("click",()=>{const a=b.innerText;navigator.clipboard.writeText(a).then(()=>{const l=M.innerHTML;M.innerHTML='<span class="text-verde font-bold">¡Copiado!</span>',setTimeout(()=>{M.innerHTML=l},2e3)})})}document.addEventListener("DOMContentLoaded",()=>{$r(),ur()});"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js?v=1774055708688").then(u=>{console.log("[SW] Registrado:",u.scope),u.update()}).catch(u=>console.warn("[SW] Registro fallido:",u))});
