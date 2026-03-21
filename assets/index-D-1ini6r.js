(function(){const f=document.createElement("link").relList;if(f&&f.supports&&f.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))e(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&e(n)}).observe(document,{childList:!0,subtree:!0});function t(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function e(r){if(r.ep)return;r.ep=!0;const o=t(r);fetch(r.href,o)}})();var Nt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function ut(u){return u&&u.__esModule&&Object.prototype.hasOwnProperty.call(u,"default")?u.default:u}var zt={exports:{}};/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.9
 * Copyright (C) 2020 Oliver Nightingale
 * @license MIT
 */(function(u,f){(function(){var t=function(e){var r=new t.Builder;return r.pipeline.add(t.trimmer,t.stopWordFilter,t.stemmer),r.searchPipeline.add(t.stemmer),e.call(r,r),r.build()};t.version="2.3.9";/*!
 * lunr.utils
 * Copyright (C) 2020 Oliver Nightingale
 */t.utils={},t.utils.warn=function(e){return function(r){e.console&&console.warn&&console.warn(r)}}(this),t.utils.asString=function(e){return e==null?"":e.toString()},t.utils.clone=function(e){if(e==null)return e;for(var r=Object.create(null),o=Object.keys(e),n=0;n<o.length;n++){var i=o[n],c=e[i];if(Array.isArray(c)){r[i]=c.slice();continue}if(typeof c=="string"||typeof c=="number"||typeof c=="boolean"){r[i]=c;continue}throw new TypeError("clone is not deep and does not support nested objects")}return r},t.FieldRef=function(e,r,o){this.docRef=e,this.fieldName=r,this._stringValue=o},t.FieldRef.joiner="/",t.FieldRef.fromString=function(e){var r=e.indexOf(t.FieldRef.joiner);if(r===-1)throw"malformed field ref string";var o=e.slice(0,r),n=e.slice(r+1);return new t.FieldRef(n,o,e)},t.FieldRef.prototype.toString=function(){return this._stringValue==null&&(this._stringValue=this.fieldName+t.FieldRef.joiner+this.docRef),this._stringValue};/*!
 * lunr.Set
 * Copyright (C) 2020 Oliver Nightingale
 */t.Set=function(e){if(this.elements=Object.create(null),e){this.length=e.length;for(var r=0;r<this.length;r++)this.elements[e[r]]=!0}else this.length=0},t.Set.complete={intersect:function(e){return e},union:function(){return this},contains:function(){return!0}},t.Set.empty={intersect:function(){return this},union:function(e){return e},contains:function(){return!1}},t.Set.prototype.contains=function(e){return!!this.elements[e]},t.Set.prototype.intersect=function(e){var r,o,n,i=[];if(e===t.Set.complete)return this;if(e===t.Set.empty)return e;this.length<e.length?(r=this,o=e):(r=e,o=this),n=Object.keys(r.elements);for(var c=0;c<n.length;c++){var b=n[c];b in o.elements&&i.push(b)}return new t.Set(i)},t.Set.prototype.union=function(e){return e===t.Set.complete?t.Set.complete:e===t.Set.empty?this:new t.Set(Object.keys(this.elements).concat(Object.keys(e.elements)))},t.idf=function(e,r){var o=0;for(var n in e)n!="_index"&&(o+=Object.keys(e[n]).length);var i=(r-o+.5)/(o+.5);return Math.log(1+Math.abs(i))},t.Token=function(e,r){this.str=e||"",this.metadata=r||{}},t.Token.prototype.toString=function(){return this.str},t.Token.prototype.update=function(e){return this.str=e(this.str,this.metadata),this},t.Token.prototype.clone=function(e){return e=e||function(r){return r},new t.Token(e(this.str,this.metadata),this.metadata)};/*!
 * lunr.tokenizer
 * Copyright (C) 2020 Oliver Nightingale
 */t.tokenizer=function(e,r){if(e==null||e==null)return[];if(Array.isArray(e))return e.map(function(M){return new t.Token(t.utils.asString(M).toLowerCase(),t.utils.clone(r))});for(var o=e.toString().toLowerCase(),n=o.length,i=[],c=0,b=0;c<=n;c++){var k=o.charAt(c),L=c-b;if(k.match(t.tokenizer.separator)||c==n){if(L>0){var A=t.utils.clone(r)||{};A.position=[b,L],A.index=i.length,i.push(new t.Token(o.slice(b,c),A))}b=c+1}}return i},t.tokenizer.separator=/[\s\-]+/;/*!
 * lunr.Pipeline
 * Copyright (C) 2020 Oliver Nightingale
 */t.Pipeline=function(){this._stack=[]},t.Pipeline.registeredFunctions=Object.create(null),t.Pipeline.registerFunction=function(e,r){r in this.registeredFunctions&&t.utils.warn("Overwriting existing registered function: "+r),e.label=r,t.Pipeline.registeredFunctions[e.label]=e},t.Pipeline.warnIfFunctionNotRegistered=function(e){var r=e.label&&e.label in this.registeredFunctions;r||t.utils.warn(`Function is not registered with pipeline. This may cause problems when serialising the index.
`,e)},t.Pipeline.load=function(e){var r=new t.Pipeline;return e.forEach(function(o){var n=t.Pipeline.registeredFunctions[o];if(n)r.add(n);else throw new Error("Cannot load unregistered function: "+o)}),r},t.Pipeline.prototype.add=function(){var e=Array.prototype.slice.call(arguments);e.forEach(function(r){t.Pipeline.warnIfFunctionNotRegistered(r),this._stack.push(r)},this)},t.Pipeline.prototype.after=function(e,r){t.Pipeline.warnIfFunctionNotRegistered(r);var o=this._stack.indexOf(e);if(o==-1)throw new Error("Cannot find existingFn");o=o+1,this._stack.splice(o,0,r)},t.Pipeline.prototype.before=function(e,r){t.Pipeline.warnIfFunctionNotRegistered(r);var o=this._stack.indexOf(e);if(o==-1)throw new Error("Cannot find existingFn");this._stack.splice(o,0,r)},t.Pipeline.prototype.remove=function(e){var r=this._stack.indexOf(e);r!=-1&&this._stack.splice(r,1)},t.Pipeline.prototype.run=function(e){for(var r=this._stack.length,o=0;o<r;o++){for(var n=this._stack[o],i=[],c=0;c<e.length;c++){var b=n(e[c],c,e);if(!(b==null||b===""))if(Array.isArray(b))for(var k=0;k<b.length;k++)i.push(b[k]);else i.push(b)}e=i}return e},t.Pipeline.prototype.runString=function(e,r){var o=new t.Token(e,r);return this.run([o]).map(function(n){return n.toString()})},t.Pipeline.prototype.reset=function(){this._stack=[]},t.Pipeline.prototype.toJSON=function(){return this._stack.map(function(e){return t.Pipeline.warnIfFunctionNotRegistered(e),e.label})};/*!
 * lunr.Vector
 * Copyright (C) 2020 Oliver Nightingale
 */t.Vector=function(e){this._magnitude=0,this.elements=e||[]},t.Vector.prototype.positionForIndex=function(e){if(this.elements.length==0)return 0;for(var r=0,o=this.elements.length/2,n=o-r,i=Math.floor(n/2),c=this.elements[i*2];n>1&&(c<e&&(r=i),c>e&&(o=i),c!=e);)n=o-r,i=r+Math.floor(n/2),c=this.elements[i*2];if(c==e||c>e)return i*2;if(c<e)return(i+1)*2},t.Vector.prototype.insert=function(e,r){this.upsert(e,r,function(){throw"duplicate index"})},t.Vector.prototype.upsert=function(e,r,o){this._magnitude=0;var n=this.positionForIndex(e);this.elements[n]==e?this.elements[n+1]=o(this.elements[n+1],r):this.elements.splice(n,0,e,r)},t.Vector.prototype.magnitude=function(){if(this._magnitude)return this._magnitude;for(var e=0,r=this.elements.length,o=1;o<r;o+=2){var n=this.elements[o];e+=n*n}return this._magnitude=Math.sqrt(e)},t.Vector.prototype.dot=function(e){for(var r=0,o=this.elements,n=e.elements,i=o.length,c=n.length,b=0,k=0,L=0,A=0;L<i&&A<c;)b=o[L],k=n[A],b<k?L+=2:b>k?A+=2:b==k&&(r+=o[L+1]*n[A+1],L+=2,A+=2);return r},t.Vector.prototype.similarity=function(e){return this.dot(e)/this.magnitude()||0},t.Vector.prototype.toArray=function(){for(var e=new Array(this.elements.length/2),r=1,o=0;r<this.elements.length;r+=2,o++)e[o]=this.elements[r];return e},t.Vector.prototype.toJSON=function(){return this.elements};/*!
 * lunr.stemmer
 * Copyright (C) 2020 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */t.stemmer=function(){var e={ational:"ate",tional:"tion",enci:"ence",anci:"ance",izer:"ize",bli:"ble",alli:"al",entli:"ent",eli:"e",ousli:"ous",ization:"ize",ation:"ate",ator:"ate",alism:"al",iveness:"ive",fulness:"ful",ousness:"ous",aliti:"al",iviti:"ive",biliti:"ble",logi:"log"},r={icate:"ic",ative:"",alize:"al",iciti:"ic",ical:"ic",ful:"",ness:""},o="[^aeiou]",n="[aeiouy]",i=o+"[^aeiouy]*",c=n+"[aeiou]*",b="^("+i+")?"+c+i,k="^("+i+")?"+c+i+"("+c+")?$",L="^("+i+")?"+c+i+c+i,A="^("+i+")?"+n,M=new RegExp(b),P=new RegExp(L),F=new RegExp(k),T=new RegExp(A),N=/^(.+?)(ss|i)es$/,j=/^(.+?)([^s])s$/,R=/^(.+?)eed$/,J=/^(.+?)(ed|ing)$/,s=/.$/,ae=/(at|bl|iz)$/,de=new RegExp("([^aeiouylsz])\\1$"),ue=new RegExp("^"+i+n+"[^aeiouwxy]$"),ce=/^(.+?[^aeiou])y$/,oe=/^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/,U=/^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/,q=/^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/,Le=/^(.+?)(s|t)(ion)$/,Y=/^(.+?)e$/,Ce=/ll$/,xe=new RegExp("^"+i+n+"[^aeiouwxy]$"),pe=function($){var Q,Z,I,_,O,H,fe;if($.length<3)return $;if(I=$.substr(0,1),I=="y"&&($=I.toUpperCase()+$.substr(1)),_=N,O=j,_.test($)?$=$.replace(_,"$1$2"):O.test($)&&($=$.replace(O,"$1$2")),_=R,O=J,_.test($)){var X=_.exec($);_=M,_.test(X[1])&&(_=s,$=$.replace(_,""))}else if(O.test($)){var X=O.exec($);Q=X[1],O=T,O.test(Q)&&($=Q,O=ae,H=de,fe=ue,O.test($)?$=$+"e":H.test($)?(_=s,$=$.replace(_,"")):fe.test($)&&($=$+"e"))}if(_=ce,_.test($)){var X=_.exec($);Q=X[1],$=Q+"i"}if(_=oe,_.test($)){var X=_.exec($);Q=X[1],Z=X[2],_=M,_.test(Q)&&($=Q+e[Z])}if(_=U,_.test($)){var X=_.exec($);Q=X[1],Z=X[2],_=M,_.test(Q)&&($=Q+r[Z])}if(_=q,O=Le,_.test($)){var X=_.exec($);Q=X[1],_=P,_.test(Q)&&($=Q)}else if(O.test($)){var X=O.exec($);Q=X[1]+X[2],O=P,O.test(Q)&&($=Q)}if(_=Y,_.test($)){var X=_.exec($);Q=X[1],_=P,O=F,H=xe,(_.test(Q)||O.test(Q)&&!H.test(Q))&&($=Q)}return _=Ce,O=P,_.test($)&&O.test($)&&(_=s,$=$.replace(_,"")),I=="y"&&($=I.toLowerCase()+$.substr(1)),$};return function(me){return me.update(pe)}}(),t.Pipeline.registerFunction(t.stemmer,"stemmer");/*!
 * lunr.stopWordFilter
 * Copyright (C) 2020 Oliver Nightingale
 */t.generateStopWordFilter=function(e){var r=e.reduce(function(o,n){return o[n]=n,o},{});return function(o){if(o&&r[o.toString()]!==o.toString())return o}},t.stopWordFilter=t.generateStopWordFilter(["a","able","about","across","after","all","almost","also","am","among","an","and","any","are","as","at","be","because","been","but","by","can","cannot","could","dear","did","do","does","either","else","ever","every","for","from","get","got","had","has","have","he","her","hers","him","his","how","however","i","if","in","into","is","it","its","just","least","let","like","likely","may","me","might","most","must","my","neither","no","nor","not","of","off","often","on","only","or","other","our","own","rather","said","say","says","she","should","since","so","some","than","that","the","their","them","then","there","these","they","this","tis","to","too","twas","us","wants","was","we","were","what","when","where","which","while","who","whom","why","will","with","would","yet","you","your"]),t.Pipeline.registerFunction(t.stopWordFilter,"stopWordFilter");/*!
 * lunr.trimmer
 * Copyright (C) 2020 Oliver Nightingale
 */t.trimmer=function(e){return e.update(function(r){return r.replace(/^\W+/,"").replace(/\W+$/,"")})},t.Pipeline.registerFunction(t.trimmer,"trimmer");/*!
 * lunr.TokenSet
 * Copyright (C) 2020 Oliver Nightingale
 */t.TokenSet=function(){this.final=!1,this.edges={},this.id=t.TokenSet._nextId,t.TokenSet._nextId+=1},t.TokenSet._nextId=1,t.TokenSet.fromArray=function(e){for(var r=new t.TokenSet.Builder,o=0,n=e.length;o<n;o++)r.insert(e[o]);return r.finish(),r.root},t.TokenSet.fromClause=function(e){return"editDistance"in e?t.TokenSet.fromFuzzyString(e.term,e.editDistance):t.TokenSet.fromString(e.term)},t.TokenSet.fromFuzzyString=function(e,r){for(var o=new t.TokenSet,n=[{node:o,editsRemaining:r,str:e}];n.length;){var i=n.pop();if(i.str.length>0){var c=i.str.charAt(0),b;c in i.node.edges?b=i.node.edges[c]:(b=new t.TokenSet,i.node.edges[c]=b),i.str.length==1&&(b.final=!0),n.push({node:b,editsRemaining:i.editsRemaining,str:i.str.slice(1)})}if(i.editsRemaining!=0){if("*"in i.node.edges)var k=i.node.edges["*"];else{var k=new t.TokenSet;i.node.edges["*"]=k}if(i.str.length==0&&(k.final=!0),n.push({node:k,editsRemaining:i.editsRemaining-1,str:i.str}),i.str.length>1&&n.push({node:i.node,editsRemaining:i.editsRemaining-1,str:i.str.slice(1)}),i.str.length==1&&(i.node.final=!0),i.str.length>=1){if("*"in i.node.edges)var L=i.node.edges["*"];else{var L=new t.TokenSet;i.node.edges["*"]=L}i.str.length==1&&(L.final=!0),n.push({node:L,editsRemaining:i.editsRemaining-1,str:i.str.slice(1)})}if(i.str.length>1){var A=i.str.charAt(0),M=i.str.charAt(1),P;M in i.node.edges?P=i.node.edges[M]:(P=new t.TokenSet,i.node.edges[M]=P),i.str.length==1&&(P.final=!0),n.push({node:P,editsRemaining:i.editsRemaining-1,str:A+i.str.slice(2)})}}}return o},t.TokenSet.fromString=function(e){for(var r=new t.TokenSet,o=r,n=0,i=e.length;n<i;n++){var c=e[n],b=n==i-1;if(c=="*")r.edges[c]=r,r.final=b;else{var k=new t.TokenSet;k.final=b,r.edges[c]=k,r=k}}return o},t.TokenSet.prototype.toArray=function(){for(var e=[],r=[{prefix:"",node:this}];r.length;){var o=r.pop(),n=Object.keys(o.node.edges),i=n.length;o.node.final&&(o.prefix.charAt(0),e.push(o.prefix));for(var c=0;c<i;c++){var b=n[c];r.push({prefix:o.prefix.concat(b),node:o.node.edges[b]})}}return e},t.TokenSet.prototype.toString=function(){if(this._str)return this._str;for(var e=this.final?"1":"0",r=Object.keys(this.edges).sort(),o=r.length,n=0;n<o;n++){var i=r[n],c=this.edges[i];e=e+i+c.id}return e},t.TokenSet.prototype.intersect=function(e){for(var r=new t.TokenSet,o=void 0,n=[{qNode:e,output:r,node:this}];n.length;){o=n.pop();for(var i=Object.keys(o.qNode.edges),c=i.length,b=Object.keys(o.node.edges),k=b.length,L=0;L<c;L++)for(var A=i[L],M=0;M<k;M++){var P=b[M];if(P==A||A=="*"){var F=o.node.edges[P],T=o.qNode.edges[A],N=F.final&&T.final,j=void 0;P in o.output.edges?(j=o.output.edges[P],j.final=j.final||N):(j=new t.TokenSet,j.final=N,o.output.edges[P]=j),n.push({qNode:T,output:j,node:F})}}}return r},t.TokenSet.Builder=function(){this.previousWord="",this.root=new t.TokenSet,this.uncheckedNodes=[],this.minimizedNodes={}},t.TokenSet.Builder.prototype.insert=function(e){var r,o=0;if(e<this.previousWord)throw new Error("Out of order word insertion");for(var n=0;n<e.length&&n<this.previousWord.length&&e[n]==this.previousWord[n];n++)o++;this.minimize(o),this.uncheckedNodes.length==0?r=this.root:r=this.uncheckedNodes[this.uncheckedNodes.length-1].child;for(var n=o;n<e.length;n++){var i=new t.TokenSet,c=e[n];r.edges[c]=i,this.uncheckedNodes.push({parent:r,char:c,child:i}),r=i}r.final=!0,this.previousWord=e},t.TokenSet.Builder.prototype.finish=function(){this.minimize(0)},t.TokenSet.Builder.prototype.minimize=function(e){for(var r=this.uncheckedNodes.length-1;r>=e;r--){var o=this.uncheckedNodes[r],n=o.child.toString();n in this.minimizedNodes?o.parent.edges[o.char]=this.minimizedNodes[n]:(o.child._str=n,this.minimizedNodes[n]=o.child),this.uncheckedNodes.pop()}};/*!
 * lunr.Index
 * Copyright (C) 2020 Oliver Nightingale
 */t.Index=function(e){this.invertedIndex=e.invertedIndex,this.fieldVectors=e.fieldVectors,this.tokenSet=e.tokenSet,this.fields=e.fields,this.pipeline=e.pipeline},t.Index.prototype.search=function(e){return this.query(function(r){var o=new t.QueryParser(e,r);o.parse()})},t.Index.prototype.query=function(e){for(var r=new t.Query(this.fields),o=Object.create(null),n=Object.create(null),i=Object.create(null),c=Object.create(null),b=Object.create(null),k=0;k<this.fields.length;k++)n[this.fields[k]]=new t.Vector;e.call(r,r);for(var k=0;k<r.clauses.length;k++){var L=r.clauses[k],A=null,M=t.Set.empty;L.usePipeline?A=this.pipeline.runString(L.term,{fields:L.fields}):A=[L.term];for(var P=0;P<A.length;P++){var F=A[P];L.term=F;var T=t.TokenSet.fromClause(L),N=this.tokenSet.intersect(T).toArray();if(N.length===0&&L.presence===t.Query.presence.REQUIRED){for(var j=0;j<L.fields.length;j++){var R=L.fields[j];c[R]=t.Set.empty}break}for(var J=0;J<N.length;J++)for(var s=N[J],ae=this.invertedIndex[s],de=ae._index,j=0;j<L.fields.length;j++){var R=L.fields[j],ue=ae[R],ce=Object.keys(ue),oe=s+"/"+R,U=new t.Set(ce);if(L.presence==t.Query.presence.REQUIRED&&(M=M.union(U),c[R]===void 0&&(c[R]=t.Set.complete)),L.presence==t.Query.presence.PROHIBITED){b[R]===void 0&&(b[R]=t.Set.empty),b[R]=b[R].union(U);continue}if(n[R].upsert(de,L.boost,function(Ie,Pe){return Ie+Pe}),!i[oe]){for(var q=0;q<ce.length;q++){var Le=ce[q],Y=new t.FieldRef(Le,R),Ce=ue[Le],xe;(xe=o[Y])===void 0?o[Y]=new t.MatchData(s,R,Ce):xe.add(s,R,Ce)}i[oe]=!0}}}if(L.presence===t.Query.presence.REQUIRED)for(var j=0;j<L.fields.length;j++){var R=L.fields[j];c[R]=c[R].intersect(M)}}for(var pe=t.Set.complete,me=t.Set.empty,k=0;k<this.fields.length;k++){var R=this.fields[k];c[R]&&(pe=pe.intersect(c[R])),b[R]&&(me=me.union(b[R]))}var $=Object.keys(o),Q=[],Z=Object.create(null);if(r.isNegated()){$=Object.keys(this.fieldVectors);for(var k=0;k<$.length;k++){var Y=$[k],I=t.FieldRef.fromString(Y);o[Y]=new t.MatchData}}for(var k=0;k<$.length;k++){var I=t.FieldRef.fromString($[k]),_=I.docRef;if(pe.contains(_)&&!me.contains(_)){var O=this.fieldVectors[I],H=n[I.fieldName].similarity(O),fe;if((fe=Z[_])!==void 0)fe.score+=H,fe.matchData.combine(o[I]);else{var X={ref:_,score:H,matchData:o[I]};Z[_]=X,Q.push(X)}}}return Q.sort(function(ye,je){return je.score-ye.score})},t.Index.prototype.toJSON=function(){var e=Object.keys(this.invertedIndex).sort().map(function(o){return[o,this.invertedIndex[o]]},this),r=Object.keys(this.fieldVectors).map(function(o){return[o,this.fieldVectors[o].toJSON()]},this);return{version:t.version,fields:this.fields,fieldVectors:r,invertedIndex:e,pipeline:this.pipeline.toJSON()}},t.Index.load=function(e){var r={},o={},n=e.fieldVectors,i=Object.create(null),c=e.invertedIndex,b=new t.TokenSet.Builder,k=t.Pipeline.load(e.pipeline);e.version!=t.version&&t.utils.warn("Version mismatch when loading serialised index. Current version of lunr '"+t.version+"' does not match serialized index '"+e.version+"'");for(var L=0;L<n.length;L++){var A=n[L],M=A[0],P=A[1];o[M]=new t.Vector(P)}for(var L=0;L<c.length;L++){var A=c[L],F=A[0],T=A[1];b.insert(F),i[F]=T}return b.finish(),r.fields=e.fields,r.fieldVectors=o,r.invertedIndex=i,r.tokenSet=b.root,r.pipeline=k,new t.Index(r)};/*!
 * lunr.Builder
 * Copyright (C) 2020 Oliver Nightingale
 */t.Builder=function(){this._ref="id",this._fields=Object.create(null),this._documents=Object.create(null),this.invertedIndex=Object.create(null),this.fieldTermFrequencies={},this.fieldLengths={},this.tokenizer=t.tokenizer,this.pipeline=new t.Pipeline,this.searchPipeline=new t.Pipeline,this.documentCount=0,this._b=.75,this._k1=1.2,this.termIndex=0,this.metadataWhitelist=[]},t.Builder.prototype.ref=function(e){this._ref=e},t.Builder.prototype.field=function(e,r){if(/\//.test(e))throw new RangeError("Field '"+e+"' contains illegal character '/'");this._fields[e]=r||{}},t.Builder.prototype.b=function(e){e<0?this._b=0:e>1?this._b=1:this._b=e},t.Builder.prototype.k1=function(e){this._k1=e},t.Builder.prototype.add=function(e,r){var o=e[this._ref],n=Object.keys(this._fields);this._documents[o]=r||{},this.documentCount+=1;for(var i=0;i<n.length;i++){var c=n[i],b=this._fields[c].extractor,k=b?b(e):e[c],L=this.tokenizer(k,{fields:[c]}),A=this.pipeline.run(L),M=new t.FieldRef(o,c),P=Object.create(null);this.fieldTermFrequencies[M]=P,this.fieldLengths[M]=0,this.fieldLengths[M]+=A.length;for(var F=0;F<A.length;F++){var T=A[F];if(P[T]==null&&(P[T]=0),P[T]+=1,this.invertedIndex[T]==null){var N=Object.create(null);N._index=this.termIndex,this.termIndex+=1;for(var j=0;j<n.length;j++)N[n[j]]=Object.create(null);this.invertedIndex[T]=N}this.invertedIndex[T][c][o]==null&&(this.invertedIndex[T][c][o]=Object.create(null));for(var R=0;R<this.metadataWhitelist.length;R++){var J=this.metadataWhitelist[R],s=T.metadata[J];this.invertedIndex[T][c][o][J]==null&&(this.invertedIndex[T][c][o][J]=[]),this.invertedIndex[T][c][o][J].push(s)}}}},t.Builder.prototype.calculateAverageFieldLengths=function(){for(var e=Object.keys(this.fieldLengths),r=e.length,o={},n={},i=0;i<r;i++){var c=t.FieldRef.fromString(e[i]),b=c.fieldName;n[b]||(n[b]=0),n[b]+=1,o[b]||(o[b]=0),o[b]+=this.fieldLengths[c]}for(var k=Object.keys(this._fields),i=0;i<k.length;i++){var L=k[i];o[L]=o[L]/n[L]}this.averageFieldLength=o},t.Builder.prototype.createFieldVectors=function(){for(var e={},r=Object.keys(this.fieldTermFrequencies),o=r.length,n=Object.create(null),i=0;i<o;i++){for(var c=t.FieldRef.fromString(r[i]),b=c.fieldName,k=this.fieldLengths[c],L=new t.Vector,A=this.fieldTermFrequencies[c],M=Object.keys(A),P=M.length,F=this._fields[b].boost||1,T=this._documents[c.docRef].boost||1,N=0;N<P;N++){var j=M[N],R=A[j],J=this.invertedIndex[j]._index,s,ae,de;n[j]===void 0?(s=t.idf(this.invertedIndex[j],this.documentCount),n[j]=s):s=n[j],ae=s*((this._k1+1)*R)/(this._k1*(1-this._b+this._b*(k/this.averageFieldLength[b]))+R),ae*=F,ae*=T,de=Math.round(ae*1e3)/1e3,L.insert(J,de)}e[c]=L}this.fieldVectors=e},t.Builder.prototype.createTokenSet=function(){this.tokenSet=t.TokenSet.fromArray(Object.keys(this.invertedIndex).sort())},t.Builder.prototype.build=function(){return this.calculateAverageFieldLengths(),this.createFieldVectors(),this.createTokenSet(),new t.Index({invertedIndex:this.invertedIndex,fieldVectors:this.fieldVectors,tokenSet:this.tokenSet,fields:Object.keys(this._fields),pipeline:this.searchPipeline})},t.Builder.prototype.use=function(e){var r=Array.prototype.slice.call(arguments,1);r.unshift(this),e.apply(this,r)},t.MatchData=function(e,r,o){for(var n=Object.create(null),i=Object.keys(o||{}),c=0;c<i.length;c++){var b=i[c];n[b]=o[b].slice()}this.metadata=Object.create(null),e!==void 0&&(this.metadata[e]=Object.create(null),this.metadata[e][r]=n)},t.MatchData.prototype.combine=function(e){for(var r=Object.keys(e.metadata),o=0;o<r.length;o++){var n=r[o],i=Object.keys(e.metadata[n]);this.metadata[n]==null&&(this.metadata[n]=Object.create(null));for(var c=0;c<i.length;c++){var b=i[c],k=Object.keys(e.metadata[n][b]);this.metadata[n][b]==null&&(this.metadata[n][b]=Object.create(null));for(var L=0;L<k.length;L++){var A=k[L];this.metadata[n][b][A]==null?this.metadata[n][b][A]=e.metadata[n][b][A]:this.metadata[n][b][A]=this.metadata[n][b][A].concat(e.metadata[n][b][A])}}}},t.MatchData.prototype.add=function(e,r,o){if(!(e in this.metadata)){this.metadata[e]=Object.create(null),this.metadata[e][r]=o;return}if(!(r in this.metadata[e])){this.metadata[e][r]=o;return}for(var n=Object.keys(o),i=0;i<n.length;i++){var c=n[i];c in this.metadata[e][r]?this.metadata[e][r][c]=this.metadata[e][r][c].concat(o[c]):this.metadata[e][r][c]=o[c]}},t.Query=function(e){this.clauses=[],this.allFields=e},t.Query.wildcard=new String("*"),t.Query.wildcard.NONE=0,t.Query.wildcard.LEADING=1,t.Query.wildcard.TRAILING=2,t.Query.presence={OPTIONAL:1,REQUIRED:2,PROHIBITED:3},t.Query.prototype.clause=function(e){return"fields"in e||(e.fields=this.allFields),"boost"in e||(e.boost=1),"usePipeline"in e||(e.usePipeline=!0),"wildcard"in e||(e.wildcard=t.Query.wildcard.NONE),e.wildcard&t.Query.wildcard.LEADING&&e.term.charAt(0)!=t.Query.wildcard&&(e.term="*"+e.term),e.wildcard&t.Query.wildcard.TRAILING&&e.term.slice(-1)!=t.Query.wildcard&&(e.term=""+e.term+"*"),"presence"in e||(e.presence=t.Query.presence.OPTIONAL),this.clauses.push(e),this},t.Query.prototype.isNegated=function(){for(var e=0;e<this.clauses.length;e++)if(this.clauses[e].presence!=t.Query.presence.PROHIBITED)return!1;return!0},t.Query.prototype.term=function(e,r){if(Array.isArray(e))return e.forEach(function(n){this.term(n,t.utils.clone(r))},this),this;var o=r||{};return o.term=e.toString(),this.clause(o),this},t.QueryParseError=function(e,r,o){this.name="QueryParseError",this.message=e,this.start=r,this.end=o},t.QueryParseError.prototype=new Error,t.QueryLexer=function(e){this.lexemes=[],this.str=e,this.length=e.length,this.pos=0,this.start=0,this.escapeCharPositions=[]},t.QueryLexer.prototype.run=function(){for(var e=t.QueryLexer.lexText;e;)e=e(this)},t.QueryLexer.prototype.sliceString=function(){for(var e=[],r=this.start,o=this.pos,n=0;n<this.escapeCharPositions.length;n++)o=this.escapeCharPositions[n],e.push(this.str.slice(r,o)),r=o+1;return e.push(this.str.slice(r,this.pos)),this.escapeCharPositions.length=0,e.join("")},t.QueryLexer.prototype.emit=function(e){this.lexemes.push({type:e,str:this.sliceString(),start:this.start,end:this.pos}),this.start=this.pos},t.QueryLexer.prototype.escapeCharacter=function(){this.escapeCharPositions.push(this.pos-1),this.pos+=1},t.QueryLexer.prototype.next=function(){if(this.pos>=this.length)return t.QueryLexer.EOS;var e=this.str.charAt(this.pos);return this.pos+=1,e},t.QueryLexer.prototype.width=function(){return this.pos-this.start},t.QueryLexer.prototype.ignore=function(){this.start==this.pos&&(this.pos+=1),this.start=this.pos},t.QueryLexer.prototype.backup=function(){this.pos-=1},t.QueryLexer.prototype.acceptDigitRun=function(){var e,r;do e=this.next(),r=e.charCodeAt(0);while(r>47&&r<58);e!=t.QueryLexer.EOS&&this.backup()},t.QueryLexer.prototype.more=function(){return this.pos<this.length},t.QueryLexer.EOS="EOS",t.QueryLexer.FIELD="FIELD",t.QueryLexer.TERM="TERM",t.QueryLexer.EDIT_DISTANCE="EDIT_DISTANCE",t.QueryLexer.BOOST="BOOST",t.QueryLexer.PRESENCE="PRESENCE",t.QueryLexer.lexField=function(e){return e.backup(),e.emit(t.QueryLexer.FIELD),e.ignore(),t.QueryLexer.lexText},t.QueryLexer.lexTerm=function(e){if(e.width()>1&&(e.backup(),e.emit(t.QueryLexer.TERM)),e.ignore(),e.more())return t.QueryLexer.lexText},t.QueryLexer.lexEditDistance=function(e){return e.ignore(),e.acceptDigitRun(),e.emit(t.QueryLexer.EDIT_DISTANCE),t.QueryLexer.lexText},t.QueryLexer.lexBoost=function(e){return e.ignore(),e.acceptDigitRun(),e.emit(t.QueryLexer.BOOST),t.QueryLexer.lexText},t.QueryLexer.lexEOS=function(e){e.width()>0&&e.emit(t.QueryLexer.TERM)},t.QueryLexer.termSeparator=t.tokenizer.separator,t.QueryLexer.lexText=function(e){for(;;){var r=e.next();if(r==t.QueryLexer.EOS)return t.QueryLexer.lexEOS;if(r.charCodeAt(0)==92){e.escapeCharacter();continue}if(r==":")return t.QueryLexer.lexField;if(r=="~")return e.backup(),e.width()>0&&e.emit(t.QueryLexer.TERM),t.QueryLexer.lexEditDistance;if(r=="^")return e.backup(),e.width()>0&&e.emit(t.QueryLexer.TERM),t.QueryLexer.lexBoost;if(r=="+"&&e.width()===1||r=="-"&&e.width()===1)return e.emit(t.QueryLexer.PRESENCE),t.QueryLexer.lexText;if(r.match(t.QueryLexer.termSeparator))return t.QueryLexer.lexTerm}},t.QueryParser=function(e,r){this.lexer=new t.QueryLexer(e),this.query=r,this.currentClause={},this.lexemeIdx=0},t.QueryParser.prototype.parse=function(){this.lexer.run(),this.lexemes=this.lexer.lexemes;for(var e=t.QueryParser.parseClause;e;)e=e(this);return this.query},t.QueryParser.prototype.peekLexeme=function(){return this.lexemes[this.lexemeIdx]},t.QueryParser.prototype.consumeLexeme=function(){var e=this.peekLexeme();return this.lexemeIdx+=1,e},t.QueryParser.prototype.nextClause=function(){var e=this.currentClause;this.query.clause(e),this.currentClause={}},t.QueryParser.parseClause=function(e){var r=e.peekLexeme();if(r!=null)switch(r.type){case t.QueryLexer.PRESENCE:return t.QueryParser.parsePresence;case t.QueryLexer.FIELD:return t.QueryParser.parseField;case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var o="expected either a field or a term, found "+r.type;throw r.str.length>=1&&(o+=" with value '"+r.str+"'"),new t.QueryParseError(o,r.start,r.end)}},t.QueryParser.parsePresence=function(e){var r=e.consumeLexeme();if(r!=null){switch(r.str){case"-":e.currentClause.presence=t.Query.presence.PROHIBITED;break;case"+":e.currentClause.presence=t.Query.presence.REQUIRED;break;default:var o="unrecognised presence operator'"+r.str+"'";throw new t.QueryParseError(o,r.start,r.end)}var n=e.peekLexeme();if(n==null){var o="expecting term or field, found nothing";throw new t.QueryParseError(o,r.start,r.end)}switch(n.type){case t.QueryLexer.FIELD:return t.QueryParser.parseField;case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var o="expecting term or field, found '"+n.type+"'";throw new t.QueryParseError(o,n.start,n.end)}}},t.QueryParser.parseField=function(e){var r=e.consumeLexeme();if(r!=null){if(e.query.allFields.indexOf(r.str)==-1){var o=e.query.allFields.map(function(c){return"'"+c+"'"}).join(", "),n="unrecognised field '"+r.str+"', possible fields: "+o;throw new t.QueryParseError(n,r.start,r.end)}e.currentClause.fields=[r.str];var i=e.peekLexeme();if(i==null){var n="expecting term, found nothing";throw new t.QueryParseError(n,r.start,r.end)}switch(i.type){case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var n="expecting term, found '"+i.type+"'";throw new t.QueryParseError(n,i.start,i.end)}}},t.QueryParser.parseTerm=function(e){var r=e.consumeLexeme();if(r!=null){e.currentClause.term=r.str.toLowerCase(),r.str.indexOf("*")!=-1&&(e.currentClause.usePipeline=!1);var o=e.peekLexeme();if(o==null){e.nextClause();return}switch(o.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var n="Unexpected lexeme type '"+o.type+"'";throw new t.QueryParseError(n,o.start,o.end)}}},t.QueryParser.parseEditDistance=function(e){var r=e.consumeLexeme();if(r!=null){var o=parseInt(r.str,10);if(isNaN(o)){var n="edit distance must be numeric";throw new t.QueryParseError(n,r.start,r.end)}e.currentClause.editDistance=o;var i=e.peekLexeme();if(i==null){e.nextClause();return}switch(i.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var n="Unexpected lexeme type '"+i.type+"'";throw new t.QueryParseError(n,i.start,i.end)}}},t.QueryParser.parseBoost=function(e){var r=e.consumeLexeme();if(r!=null){var o=parseInt(r.str,10);if(isNaN(o)){var n="boost must be numeric";throw new t.QueryParseError(n,r.start,r.end)}e.currentClause.boost=o;var i=e.peekLexeme();if(i==null){e.nextClause();return}switch(i.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var n="Unexpected lexeme type '"+i.type+"'";throw new t.QueryParseError(n,i.start,i.end)}}},function(e,r){u.exports=r()}(this,function(){return t})})()})(zt);var rr=zt.exports;const qe=ut(rr);var Ft={exports:{}};/*!
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */(function(u,f){(function(t,e){u.exports=e()})(Nt,function(){return function(t){t.stemmerSupport={Among:function(e,r,o,n){if(this.toCharArray=function(i){for(var c=i.length,b=new Array(c),k=0;k<c;k++)b[k]=i.charCodeAt(k);return b},!e&&e!=""||!r&&r!=0||!o)throw"Bad Among initialisation: s:"+e+", substring_i: "+r+", result: "+o;this.s_size=e.length,this.s=this.toCharArray(e),this.substring_i=r,this.result=o,this.method=n},SnowballProgram:function(){var e;return{bra:0,ket:0,limit:0,cursor:0,limit_backward:0,setCurrent:function(r){e=r,this.cursor=0,this.limit=r.length,this.limit_backward=0,this.bra=this.cursor,this.ket=this.limit},getCurrent:function(){var r=e;return e=null,r},in_grouping:function(r,o,n){if(this.cursor<this.limit){var i=e.charCodeAt(this.cursor);if(i<=n&&i>=o&&(i-=o,r[i>>3]&1<<(i&7)))return this.cursor++,!0}return!1},in_grouping_b:function(r,o,n){if(this.cursor>this.limit_backward){var i=e.charCodeAt(this.cursor-1);if(i<=n&&i>=o&&(i-=o,r[i>>3]&1<<(i&7)))return this.cursor--,!0}return!1},out_grouping:function(r,o,n){if(this.cursor<this.limit){var i=e.charCodeAt(this.cursor);if(i>n||i<o)return this.cursor++,!0;if(i-=o,!(r[i>>3]&1<<(i&7)))return this.cursor++,!0}return!1},out_grouping_b:function(r,o,n){if(this.cursor>this.limit_backward){var i=e.charCodeAt(this.cursor-1);if(i>n||i<o)return this.cursor--,!0;if(i-=o,!(r[i>>3]&1<<(i&7)))return this.cursor--,!0}return!1},eq_s:function(r,o){if(this.limit-this.cursor<r)return!1;for(var n=0;n<r;n++)if(e.charCodeAt(this.cursor+n)!=o.charCodeAt(n))return!1;return this.cursor+=r,!0},eq_s_b:function(r,o){if(this.cursor-this.limit_backward<r)return!1;for(var n=0;n<r;n++)if(e.charCodeAt(this.cursor-r+n)!=o.charCodeAt(n))return!1;return this.cursor-=r,!0},find_among:function(r,o){for(var n=0,i=o,c=this.cursor,b=this.limit,k=0,L=0,A=!1;;){for(var M=n+(i-n>>1),P=0,F=k<L?k:L,T=r[M],N=F;N<T.s_size;N++){if(c+F==b){P=-1;break}if(P=e.charCodeAt(c+F)-T.s[N],P)break;F++}if(P<0?(i=M,L=F):(n=M,k=F),i-n<=1){if(n>0||i==n||A)break;A=!0}}for(;;){var T=r[n];if(k>=T.s_size){if(this.cursor=c+T.s_size,!T.method)return T.result;var j=T.method();if(this.cursor=c+T.s_size,j)return T.result}if(n=T.substring_i,n<0)return 0}},find_among_b:function(r,o){for(var n=0,i=o,c=this.cursor,b=this.limit_backward,k=0,L=0,A=!1;;){for(var M=n+(i-n>>1),P=0,F=k<L?k:L,T=r[M],N=T.s_size-1-F;N>=0;N--){if(c-F==b){P=-1;break}if(P=e.charCodeAt(c-1-F)-T.s[N],P)break;F++}if(P<0?(i=M,L=F):(n=M,k=F),i-n<=1){if(n>0||i==n||A)break;A=!0}}for(;;){var T=r[n];if(k>=T.s_size){if(this.cursor=c-T.s_size,!T.method)return T.result;var j=T.method();if(this.cursor=c-T.s_size,j)return T.result}if(n=T.substring_i,n<0)return 0}},replace_s:function(r,o,n){var i=n.length-(o-r),c=e.substring(0,r),b=e.substring(o);return e=c+n+b,this.limit+=i,this.cursor>=o?this.cursor+=i:this.cursor>r&&(this.cursor=r),i},slice_check:function(){if(this.bra<0||this.bra>this.ket||this.ket>this.limit||this.limit>e.length)throw"faulty slice operation"},slice_from:function(r){this.slice_check(),this.replace_s(this.bra,this.ket,r)},slice_del:function(){this.slice_from("")},insert:function(r,o,n){var i=this.replace_s(r,o,n);r<=this.bra&&(this.bra+=i),r<=this.ket&&(this.ket+=i)},slice_to:function(){return this.slice_check(),e.substring(this.bra,this.ket)},eq_v_b:function(r){return this.eq_s_b(r.length,r)}}}},t.trimmerSupport={generateTrimmer:function(e){var r=new RegExp("^[^"+e+"]+"),o=new RegExp("[^"+e+"]+$");return function(n){return typeof n.update=="function"?n.update(function(i){return i.replace(r,"").replace(o,"")}):n.replace(r,"").replace(o,"")}}}}})})(Ft);var ar=Ft.exports;const or=ut(ar);var Ot={exports:{}};/*!
 * Lunr languages, `Spanish` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2014, Mihai Valentin
 * http://www.mozilla.org/MPL/
 */(function(u,f){(function(t,e){u.exports=e()})(Nt,function(){return function(t){if(typeof t>"u")throw new Error("Lunr is not present. Please include / require Lunr before this script.");if(typeof t.stemmerSupport>"u")throw new Error("Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.");t.es=function(){this.pipeline.reset(),this.pipeline.add(t.es.trimmer,t.es.stopWordFilter,t.es.stemmer),this.searchPipeline&&(this.searchPipeline.reset(),this.searchPipeline.add(t.es.stemmer))},t.es.wordCharacters="A-Za-zªºÀ-ÖØ-öø-ʸˠ-ˤᴀ-ᴥᴬ-ᵜᵢ-ᵥᵫ-ᵷᵹ-ᶾḀ-ỿⁱⁿₐ-ₜKÅℲⅎⅠ-ↈⱠ-ⱿꜢ-ꞇꞋ-ꞭꞰ-ꞷꟷ-ꟿꬰ-ꭚꭜ-ꭤﬀ-ﬆＡ-Ｚａ-ｚ",t.es.trimmer=t.trimmerSupport.generateTrimmer(t.es.wordCharacters),t.Pipeline.registerFunction(t.es.trimmer,"trimmer-es"),t.es.stemmer=function(){var e=t.stemmerSupport.Among,r=t.stemmerSupport.SnowballProgram,o=new function(){var i=[new e("",-1,6),new e("á",0,1),new e("é",0,2),new e("í",0,3),new e("ó",0,4),new e("ú",0,5)],c=[new e("la",-1,-1),new e("sela",0,-1),new e("le",-1,-1),new e("me",-1,-1),new e("se",-1,-1),new e("lo",-1,-1),new e("selo",5,-1),new e("las",-1,-1),new e("selas",7,-1),new e("les",-1,-1),new e("los",-1,-1),new e("selos",10,-1),new e("nos",-1,-1)],b=[new e("ando",-1,6),new e("iendo",-1,6),new e("yendo",-1,7),new e("ándo",-1,2),new e("iéndo",-1,1),new e("ar",-1,6),new e("er",-1,6),new e("ir",-1,6),new e("ár",-1,3),new e("ér",-1,4),new e("ír",-1,5)],k=[new e("ic",-1,-1),new e("ad",-1,-1),new e("os",-1,-1),new e("iv",-1,1)],L=[new e("able",-1,1),new e("ible",-1,1),new e("ante",-1,1)],A=[new e("ic",-1,1),new e("abil",-1,1),new e("iv",-1,1)],M=[new e("ica",-1,1),new e("ancia",-1,2),new e("encia",-1,5),new e("adora",-1,2),new e("osa",-1,1),new e("ista",-1,1),new e("iva",-1,9),new e("anza",-1,1),new e("logía",-1,3),new e("idad",-1,8),new e("able",-1,1),new e("ible",-1,1),new e("ante",-1,2),new e("mente",-1,7),new e("amente",13,6),new e("ación",-1,2),new e("ución",-1,4),new e("ico",-1,1),new e("ismo",-1,1),new e("oso",-1,1),new e("amiento",-1,1),new e("imiento",-1,1),new e("ivo",-1,9),new e("ador",-1,2),new e("icas",-1,1),new e("ancias",-1,2),new e("encias",-1,5),new e("adoras",-1,2),new e("osas",-1,1),new e("istas",-1,1),new e("ivas",-1,9),new e("anzas",-1,1),new e("logías",-1,3),new e("idades",-1,8),new e("ables",-1,1),new e("ibles",-1,1),new e("aciones",-1,2),new e("uciones",-1,4),new e("adores",-1,2),new e("antes",-1,2),new e("icos",-1,1),new e("ismos",-1,1),new e("osos",-1,1),new e("amientos",-1,1),new e("imientos",-1,1),new e("ivos",-1,9)],P=[new e("ya",-1,1),new e("ye",-1,1),new e("yan",-1,1),new e("yen",-1,1),new e("yeron",-1,1),new e("yendo",-1,1),new e("yo",-1,1),new e("yas",-1,1),new e("yes",-1,1),new e("yais",-1,1),new e("yamos",-1,1),new e("yó",-1,1)],F=[new e("aba",-1,2),new e("ada",-1,2),new e("ida",-1,2),new e("ara",-1,2),new e("iera",-1,2),new e("ía",-1,2),new e("aría",5,2),new e("ería",5,2),new e("iría",5,2),new e("ad",-1,2),new e("ed",-1,2),new e("id",-1,2),new e("ase",-1,2),new e("iese",-1,2),new e("aste",-1,2),new e("iste",-1,2),new e("an",-1,2),new e("aban",16,2),new e("aran",16,2),new e("ieran",16,2),new e("ían",16,2),new e("arían",20,2),new e("erían",20,2),new e("irían",20,2),new e("en",-1,1),new e("asen",24,2),new e("iesen",24,2),new e("aron",-1,2),new e("ieron",-1,2),new e("arán",-1,2),new e("erán",-1,2),new e("irán",-1,2),new e("ado",-1,2),new e("ido",-1,2),new e("ando",-1,2),new e("iendo",-1,2),new e("ar",-1,2),new e("er",-1,2),new e("ir",-1,2),new e("as",-1,2),new e("abas",39,2),new e("adas",39,2),new e("idas",39,2),new e("aras",39,2),new e("ieras",39,2),new e("ías",39,2),new e("arías",45,2),new e("erías",45,2),new e("irías",45,2),new e("es",-1,1),new e("ases",49,2),new e("ieses",49,2),new e("abais",-1,2),new e("arais",-1,2),new e("ierais",-1,2),new e("íais",-1,2),new e("aríais",55,2),new e("eríais",55,2),new e("iríais",55,2),new e("aseis",-1,2),new e("ieseis",-1,2),new e("asteis",-1,2),new e("isteis",-1,2),new e("áis",-1,2),new e("éis",-1,1),new e("aréis",64,2),new e("eréis",64,2),new e("iréis",64,2),new e("ados",-1,2),new e("idos",-1,2),new e("amos",-1,2),new e("ábamos",70,2),new e("áramos",70,2),new e("iéramos",70,2),new e("íamos",70,2),new e("aríamos",74,2),new e("eríamos",74,2),new e("iríamos",74,2),new e("emos",-1,1),new e("aremos",78,2),new e("eremos",78,2),new e("iremos",78,2),new e("ásemos",78,2),new e("iésemos",78,2),new e("imos",-1,2),new e("arás",-1,2),new e("erás",-1,2),new e("irás",-1,2),new e("ís",-1,2),new e("ará",-1,2),new e("erá",-1,2),new e("irá",-1,2),new e("aré",-1,2),new e("eré",-1,2),new e("iré",-1,2),new e("ió",-1,2)],T=[new e("a",-1,1),new e("e",-1,2),new e("o",-1,1),new e("os",-1,1),new e("á",-1,1),new e("é",-1,2),new e("í",-1,1),new e("ó",-1,1)],N=[17,65,16,0,0,0,0,0,0,0,0,0,0,0,0,0,1,17,4,10],j,R,J,s=new r;this.setCurrent=function(I){s.setCurrent(I)},this.getCurrent=function(){return s.getCurrent()};function ae(){if(s.out_grouping(N,97,252)){for(;!s.in_grouping(N,97,252);){if(s.cursor>=s.limit)return!0;s.cursor++}return!1}return!0}function de(){if(s.in_grouping(N,97,252)){var I=s.cursor;if(ae()){if(s.cursor=I,!s.in_grouping(N,97,252))return!0;for(;!s.out_grouping(N,97,252);){if(s.cursor>=s.limit)return!0;s.cursor++}}return!1}return!0}function ue(){var I=s.cursor,_;if(de()){if(s.cursor=I,!s.out_grouping(N,97,252))return;if(_=s.cursor,ae()){if(s.cursor=_,!s.in_grouping(N,97,252)||s.cursor>=s.limit)return;s.cursor++}}J=s.cursor}function ce(){for(;!s.in_grouping(N,97,252);){if(s.cursor>=s.limit)return!1;s.cursor++}for(;!s.out_grouping(N,97,252);){if(s.cursor>=s.limit)return!1;s.cursor++}return!0}function oe(){var I=s.cursor;J=s.limit,R=J,j=J,ue(),s.cursor=I,ce()&&(R=s.cursor,ce()&&(j=s.cursor))}function U(){for(var I;;){if(s.bra=s.cursor,I=s.find_among(i,6),I)switch(s.ket=s.cursor,I){case 1:s.slice_from("a");continue;case 2:s.slice_from("e");continue;case 3:s.slice_from("i");continue;case 4:s.slice_from("o");continue;case 5:s.slice_from("u");continue;case 6:if(s.cursor>=s.limit)break;s.cursor++;continue}break}}function q(){return J<=s.cursor}function Le(){return R<=s.cursor}function Y(){return j<=s.cursor}function Ce(){var I;if(s.ket=s.cursor,s.find_among_b(c,13)&&(s.bra=s.cursor,I=s.find_among_b(b,11),I&&q()))switch(I){case 1:s.bra=s.cursor,s.slice_from("iendo");break;case 2:s.bra=s.cursor,s.slice_from("ando");break;case 3:s.bra=s.cursor,s.slice_from("ar");break;case 4:s.bra=s.cursor,s.slice_from("er");break;case 5:s.bra=s.cursor,s.slice_from("ir");break;case 6:s.slice_del();break;case 7:s.eq_s_b(1,"u")&&s.slice_del();break}}function xe(I,_){if(!Y())return!0;s.slice_del(),s.ket=s.cursor;var O=s.find_among_b(I,_);return O&&(s.bra=s.cursor,O==1&&Y()&&s.slice_del()),!1}function pe(I){return Y()?(s.slice_del(),s.ket=s.cursor,s.eq_s_b(2,I)&&(s.bra=s.cursor,Y()&&s.slice_del()),!1):!0}function me(){var I;if(s.ket=s.cursor,I=s.find_among_b(M,46),I){switch(s.bra=s.cursor,I){case 1:if(!Y())return!1;s.slice_del();break;case 2:if(pe("ic"))return!1;break;case 3:if(!Y())return!1;s.slice_from("log");break;case 4:if(!Y())return!1;s.slice_from("u");break;case 5:if(!Y())return!1;s.slice_from("ente");break;case 6:if(!Le())return!1;s.slice_del(),s.ket=s.cursor,I=s.find_among_b(k,4),I&&(s.bra=s.cursor,Y()&&(s.slice_del(),I==1&&(s.ket=s.cursor,s.eq_s_b(2,"at")&&(s.bra=s.cursor,Y()&&s.slice_del()))));break;case 7:if(xe(L,3))return!1;break;case 8:if(xe(A,3))return!1;break;case 9:if(pe("at"))return!1;break}return!0}return!1}function $(){var I,_;if(s.cursor>=J&&(_=s.limit_backward,s.limit_backward=J,s.ket=s.cursor,I=s.find_among_b(P,12),s.limit_backward=_,I)){if(s.bra=s.cursor,I==1){if(!s.eq_s_b(1,"u"))return!1;s.slice_del()}return!0}return!1}function Q(){var I,_,O,H;if(s.cursor>=J&&(_=s.limit_backward,s.limit_backward=J,s.ket=s.cursor,I=s.find_among_b(F,96),s.limit_backward=_,I))switch(s.bra=s.cursor,I){case 1:O=s.limit-s.cursor,s.eq_s_b(1,"u")?(H=s.limit-s.cursor,s.eq_s_b(1,"g")?s.cursor=s.limit-H:s.cursor=s.limit-O):s.cursor=s.limit-O,s.bra=s.cursor;case 2:s.slice_del();break}}function Z(){var I,_;if(s.ket=s.cursor,I=s.find_among_b(T,8),I)switch(s.bra=s.cursor,I){case 1:q()&&s.slice_del();break;case 2:q()&&(s.slice_del(),s.ket=s.cursor,s.eq_s_b(1,"u")&&(s.bra=s.cursor,_=s.limit-s.cursor,s.eq_s_b(1,"g")&&(s.cursor=s.limit-_,q()&&s.slice_del())));break}}this.stem=function(){var I=s.cursor;return oe(),s.limit_backward=I,s.cursor=s.limit,Ce(),s.cursor=s.limit,me()||(s.cursor=s.limit,$()||(s.cursor=s.limit,Q())),s.cursor=s.limit,Z(),s.cursor=s.limit_backward,U(),!0}};return function(n){return typeof n.update=="function"?n.update(function(i){return o.setCurrent(i),o.stem(),o.getCurrent()}):(o.setCurrent(n),o.stem(),o.getCurrent())}}(),t.Pipeline.registerFunction(t.es.stemmer,"stemmer-es"),t.es.stopWordFilter=t.generateStopWordFilter("a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era erais eran eras eres es esa esas ese eso esos esta estaba estabais estaban estabas estad estada estadas estado estados estamos estando estar estaremos estará estarán estarás estaré estaréis estaría estaríais estaríamos estarían estarías estas este estemos esto estos estoy estuve estuviera estuvierais estuvieran estuvieras estuvieron estuviese estuvieseis estuviesen estuvieses estuvimos estuviste estuvisteis estuviéramos estuviésemos estuvo está estábamos estáis están estás esté estéis estén estés fue fuera fuerais fueran fueras fueron fuese fueseis fuesen fueses fui fuimos fuiste fuisteis fuéramos fuésemos ha habida habidas habido habidos habiendo habremos habrá habrán habrás habré habréis habría habríais habríamos habrían habrías habéis había habíais habíamos habían habías han has hasta hay haya hayamos hayan hayas hayáis he hemos hube hubiera hubierais hubieran hubieras hubieron hubiese hubieseis hubiesen hubieses hubimos hubiste hubisteis hubiéramos hubiésemos hubo la las le les lo los me mi mis mucho muchos muy más mí mía mías mío míos nada ni no nos nosotras nosotros nuestra nuestras nuestro nuestros o os otra otras otro otros para pero poco por porque que quien quienes qué se sea seamos sean seas seremos será serán serás seré seréis sería seríais seríamos serían serías seáis sido siendo sin sobre sois somos son soy su sus suya suyas suyo suyos sí también tanto te tendremos tendrá tendrán tendrás tendré tendréis tendría tendríais tendríamos tendrían tendrías tened tenemos tenga tengamos tengan tengas tengo tengáis tenida tenidas tenido tenidos teniendo tenéis tenía teníais teníamos tenían tenías ti tiene tienen tienes todo todos tu tus tuve tuviera tuvierais tuvieran tuvieras tuvieron tuviese tuvieseis tuviesen tuvieses tuvimos tuviste tuvisteis tuviéramos tuviésemos tuvo tuya tuyas tuyo tuyos tú un una uno unos vosotras vosotros vuestra vuestras vuestro vuestros y ya yo él éramos".split(" ")),t.Pipeline.registerFunction(t.es.stopWordFilter,"stopWordFilter-es")}})})(Ot);var nr=Ot.exports;const ir=ut(nr);or(qe);ir(qe);let Ee,K=[];function sr(u){const f=JSON.stringify(u);let t=5381;for(let e=0;e<f.length;e++)t=(t<<5)+t+f.charCodeAt(e)>>>0;return t.toString(36)}const Dt="bl-cache-v";function Qt(u){return`${Dt}${u}`}function lr(u){const f=[];for(let t=0;t<localStorage.length;t++){const e=localStorage.key(t);e&&e.startsWith(Dt)&&e!==u&&f.push(e)}f.forEach(t=>localStorage.removeItem(t))}function st(u,f,t){const e=Qt(u);lr(e);const r=JSON.stringify(f);try{const o=JSON.stringify({v:2,index:r,data:t});localStorage.setItem(e,o),console.log(`[Cache] Guardado índice + datos (${(o.length/1024).toFixed(0)} KB)`);return}catch(o){if(o.name!=="QuotaExceededError"){console.warn("[Cache] Error inesperado al guardar:",o.message);return}}try{const o=JSON.stringify({v:2,index:r});localStorage.setItem(e,o),console.log(`[Cache] Guardado solo índice (${(o.length/1024).toFixed(0)} KB) — quota insuficiente para datos`)}catch(o){console.warn("[Cache] No se pudo guardar en localStorage (quota excedida):",o.message)}}function cr(u){try{const f=localStorage.getItem(Qt(u));if(!f)return null;const t=JSON.parse(f);if(!t||t.v!==2||!t.index)return null;const e=qe.Index.load(JSON.parse(t.index)),r=t.data||null;return{index:e,data:r}}catch(f){return console.warn("[Cache] Error al cargar caché, se descartará:",f.message),null}}function lt(u){return qe(function(){this.use(qe.es),this.ref("id"),this.field("texto"),this.field("titulo_nombre",{boost:5}),this.field("capitulo_nombre",{boost:3}),this.field("articulo_label",{boost:10}),this.field("ley_origen",{boost:5}),u.forEach(f=>this.add(f))})}function ct(u){return u.flatMap(f=>f.articulos.map(t=>({...t,ley_origen:f.metadata.ley,fecha_publicacion:f.metadata.fecha_publicacion})))}function dr(u){return u.map(f=>{const t=f.metadata,e={};f.articulos.forEach(o=>{e[o.capitulo_nombre]||(e[o.capitulo_nombre]=0),e[o.capitulo_nombre]++});const r=Object.entries(e).sort((o,n)=>n[1]-o[1]).slice(0,3).map(o=>o[0]);return{titulo:t.ley,fecha:t.fecha_publicacion,articulos:t.total_articulos,temas_clave:r,id:t.ley.replace(/\s+/g,"-").toLowerCase(),resumen:t.resumen||"No hay resumen disponible para este documento."}})}function Xe(u){const f=new Set(K.map(e=>e.ley_origen)),t=dr(u);window.dispatchEvent(new CustomEvent("search-ready",{detail:{totalLeyes:f.size,totalArticulos:K.length,leyes:Array.from(f),summaries:t}}))}function dt(u){return fetch(`/data/${u}`).then(f=>{if(!f.ok)throw new Error(`HTTP ${f.status} para ${u}`);return f.json()})}async function ur(){try{console.log("[Search] Iniciando...");const u=await fetch("/data/manifest.json");if(!u.ok)throw new Error("Manifest no encontrado");const f=await u.json(),t=sr(f),e=cr(t);if(e&&e.data){console.log("[Search] ✓ Caché completo encontrado — sin necesidad de red"),Ee=e.index,K=e.data;const c={};K.forEach(b=>{c[b.ley_origen]||(c[b.ley_origen]={metadata:{ley:b.ley_origen,fecha_publicacion:b.fecha_publicacion,total_articulos:0,resumen:""},articulos:[]}),c[b.ley_origen].articulos.push(b),c[b.ley_origen].metadata.total_articulos++}),Xe(Object.values(c));return}if(e&&!e.data){console.log("[Search] ✓ Índice encontrado en caché — cargando datos en background"),Ee=e.index,Promise.all(f.map(dt)).then(c=>{K=ct(c),Ee=lt(K),Xe(c),st(t,Ee,K),console.log(`[Search] ✓ Datos cargados tras caché parcial: ${K.length} artículos`)}).catch(c=>console.error("[Search] Error cargando datos background:",c));return}const r=5,o=f.slice(0,r),n=f.slice(r);console.log(`[Search] Cargando primer lote (${o.length} leyes)...`);const i=await Promise.all(o.map(dt));K=ct(i),Ee=lt(K),Xe(i),console.log(`[Search] ✓ Primer lote listo: ${K.length} artículos indexados`),n.length>0?(console.log(`[Search] Cargando lote secundario (${n.length} leyes) en background...`),Promise.all(n.map(dt)).then(c=>{const b=[...i,...c];K=ct(b),Ee=lt(K),Xe(b),console.log(`[Search] ✓ Índice completo: ${K.length} artículos`),st(t,Ee,K)}).catch(c=>console.error("[Search] Error en lote secundario:",c))):st(t,Ee,K)}catch(u){console.error("[Search] Error en inicialización:",u)}}function pr(u){if(!Ee)return[];try{let f=u;return!/[~*^:+]/.test(u)&&(f=u.split(/\s+/).filter(r=>r.length>2||/^\d+°?$/.test(r)).map(r=>`${r}~1 ${r}*`).join(" ")),Ee.search(f).map(r=>({...K.find(n=>n.id===r.ref),score:r.score,matchData:r.matchData})).filter(r=>r.id)}catch(f){return console.warn("[Search] Error en búsqueda:",f),[]}}function Te(u){return K.find(f=>f.id===u)}function mr(u){return K.filter(f=>f.ley_origen===u)}function fr(){return K}const jt={gov:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21h18M3 10h18M5 21V10m6 11V10m6 11V10M12 3l9 7H3l9-7z"/></svg>',chain:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>',doc:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',council:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',plan:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>',scope:'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'},Pt=[{id:"planeacion-vinculante",numero:"01",titulo:"Planeación Vinculante",subtitulo:"Instrumento Rector del Estado",objetivo:"La Planeación Vinculante es la obligación legal de que el gobierno, CFE, Pemex y empresas privadas subordinen sus actividades e inversiones a un mismo objetivo: mantener la energía segura, accesible para todos y cada vez más limpia. Para lograrlo, todos deben seguir rigurosamente los mismos Planes creados por la Secretaría de Energía.",color:"#9B2247",metricas:[{valor:"5",label:"leyes y reglamentos"},{valor:"7",label:"planes principales"},{valor:"107+",label:"menciones obligatorias"}],atributos:[{nombre:"¿Quién decide?",valor:"Secretaría de Energía (SENER)",tipo:"gov"},{nombre:"Naturaleza",valor:"Obligatorio para todo el sector",tipo:"chain"},{nombre:"Para el futuro",valor:"Transición hacia energías limpias",tipo:"doc"},{nombre:"¿Quién apoya?",valor:"Consejo de Planeación y Comités",tipo:"council"},{nombre:"Planes Principales",valor:"Estrategia Nacional, Programas Sectoriales, CFE, Pemex",tipo:"plan"},{nombre:"Aplica en...",valor:"Luz, Gasolinas, Diésel, Geotermia",tipo:"scope"}],cadena:[{nivel:1,rol:"LA GRAN META DEL PAÍS",nodos:[{id:"estrategia",titulo:"Estrategia de Transición",descripcion:"El horizonte a largo plazo para dejar atrás tecnologías contaminantes.",color:"#25D366",articulos:["LB-Art-011"],refs:"LB Art. 11 · LPTE"},{id:"pse",titulo:"Programa del Sector",descripcion:"Las metas sexenales derivadas del desarrollo del país.",color:"#9B2247",articulos:["LCNE-Art-007"],refs:"LCNE Art. 7"}],conector:"guían a la"},{nivel:2,rol:"QUIÉN DISEÑA LA RUTA",nodos:[{id:"sener",titulo:"SENER",descripcion:"Secretaría de Energía",color:"#9B2247",articulos:["LPTE-Art-002","LSE-Art-012","LSH-Art-008"],refs:"LPTE Art. 2 · LSE Art. 12 · LSH Art. 8"}],conector:"que emite los"},{nivel:3,rol:"PLANES ESPECIALIZADOS",nodos:[{id:"platease",titulo:"PLATEASE",descripcion:"Cómo lograr la transición y la eficiencia en el uso de la energía.",color:"#7a1b38",articulos:["LPTE-Art-008"],refs:"LPTE Art. 8"},{id:"pladese",titulo:"Plan Eléctrico (PLADESE)",descripcion:"Dónde instalar nuevas plantas de luz o nuevas torres de transmisión.",color:"#1E5B4F",articulos:["LSE-Art-012"],refs:"LSE Art. 12"},{id:"pladeshi",titulo:"Plan Petrolero (PLADESHi)",descripcion:"Decide cómo cuidaremos y extraeremos mejor nuestras reservas de crudo y gas.",color:"#A57F2C",articulos:["LSH-Art-008"],refs:"LSH Art. 8"}],conector:"que son vigilados por"},{nivel:4,rol:"ORGANISMOS DE VIGILANCIA Y APOYO",nodos:[{id:"cne",titulo:"Comisión N. E.",descripcion:"Revisa tarifas y da permisos siempre respetando los planes.",color:"#444",articulos:["RLPTE-Art-004","LSH-Art-009"],refs:"RLPTE Art. 4 · LSH Art. 9"},{id:"cpe",titulo:"Consejo de Planeación",descripcion:"Grupo de expertos que evalúa que la planeación vaya por buen camino.",color:"#555",articulos:["RLPTE-Art-002","LCPE-Art-002"],refs:"RLPTE Art. 2 · LCPE Art. 2"}],conector:"donde participan los"},{nivel:5,rol:"OPERADORES DEL DÍA A DÍA",nodos:[{id:"cfe",titulo:"CFE y su Programa",descripcion:"CFE diseña su plan de 5 años alineado al Plan Eléctrico Nacional.",color:"#1E5B4F",articulos:["LCFE-Art-016","LPTE-Art-002"],refs:"Ley de la CFE Art. 16"},{id:"pemex",titulo:"Pemex y su Programa",descripcion:"Pemex alinea su trabajo al Plan Petrolero Nacional.",color:"#A57F2C",articulos:["LPEMEX-Art-017","LSH-Art-009"],refs:"Ley de Pemex Art. 17"},{id:"particulares",titulo:"Empresas Privadas",descripcion:"Solo operan si cumplen con las metas ordenadas por la SENER.",color:"#666",articulos:["RLPTE-Art-004"],refs:"RLPTE Art. 4"}],conector:null}],articulosClave:[{id:"LPTE-Art-002",siglas:"LPTE",color:"#9B2247",label:"Art. 2",rol:"Norma Fundamental",descripcion:"Se asegura que el Estado planifique hacia dónde vamos en energía, siendo obligatorio y cuidando de que tengamos soberanía sin descuidar la justicia para la gente común.",extracto:'"La Secretaría de Energía está a cargo de la planeación vinculante en el Sector Energético, que incluye, como parte esencial, el desarrollo de las áreas estratégicas para preservar la soberanía, la seguridad, la autosuficiencia y la Justicia Energética de la Nación…"'},{id:"LPTE-Art-008",siglas:"LPTE",color:"#9B2247",label:"Art. 8",rol:"Los Tres Grandes Planes",descripcion:"La ley manda explícitamente a la Secretaría de Energía a escribir tres grandes Planes obligatorios (PLATEASE, PLADESE y PLADESHi).",extracto:'"Corresponde a la Secretaría: I. Elaborar y publicar la Estrategia, el Programa Sectorial de Energía, el PLATEASE, el PLADESE, el PLADESHi y coordinar su ejecución, así como vigilar el cumplimiento…"'},{id:"LB-Art-011",siglas:"Ley",color:"#25D366",label:"Estrategia",rol:"La Meta Superior",descripcion:"Muestra que todos los demás planes se rigen por las metas superiores de lograr usar energías que dañen menos nuestro planeta.",extracto:'"La Estrategia Nacional de Transición Energética debe de incluir las metas para Producción de Biocombustibles y energías limpias…"'},{id:"LCFE-Art-016",siglas:"LCFE",color:"#1E5B4F",label:"Art. 16",rol:"Programa de la CFE",descripcion:"Manda que la principal empresa de luz de México haga su propio Plan a 5 años, sin contradecir las guías del gobierno.",extracto:'"El Programa de Desarrollo de la CFE se debe elaborar y actualizar anualmente, con un horizonte de cinco años... para garantizar el suministro de energía eléctrica al pueblo…"'},{id:"LPEMEX-Art-017",siglas:"Pemex",color:"#A57F2C",label:"Art. 17",rol:"Programa de Pemex",descripcion:"La petrolera estatal debe organizar sus inversiones a cinco y quince años, siguiendo lo que ordene la política energética de la Secretaría.",extracto:'"El Programa de Desarrollo de Petróleos Mexicanos se debe elaborar con un horizonte de cinco años... para preservar la soberanía, seguridad, sostenibilidad, autosuficiencia y justicia energética de la Nación…"'},{id:"RLPTE-Art-004",siglas:"RLPTE",color:"#7a1b38",label:"Art. 4",rol:"Actos Administrativos",descripcion:"A nivel práctico, cualquier permiso privado que se quiera dar para vender gasolina o poner una planta eólica, será rechazado si no coincide con los Planes Mayores.",extracto:'"La planeación vinculante… debe ser considerada por la Secretaría de Energía y la Comisión Nacional de Energía para el otorgamiento de asignaciones, contratos, permisos, concesiones y autorizaciones…"'},{id:"LSE-Art-012",siglas:"LSE",color:"#1E5B4F",label:"Art. 12",rol:"Sector Eléctrico",descripcion:"A nivel eléctrico, ordena que el Estado sea la fuente del 54% de la luz del país, garantizando seguridad y que mande por encima de intereses privados.",extracto:'"La planeación del sector eléctrico tiene carácter vinculante… El Estado debe mantener al menos el cincuenta y cuatro por ciento del promedio de la energía inyectada a la red…"'},{id:"LSH-Art-008",siglas:"LSH",color:"#A57F2C",label:"Art. 8",rol:"Sector Hidrocarburos",descripcion:"Mismo criterio obligatorio, pero para pozos y refinerías. No se hace lo que una empresa quiera, se hace lo que necesite el país.",extracto:'"La planeación del sector hidrocarburos tiene carácter vinculante y está a cargo de la Secretaría de Energía, autoridad que debe emitir el Plan de Desarrollo del Sector Hidrocarburos…"'},{id:"LCNE-Art-007",siglas:"LCNE",color:"#444",label:"Art. 7",rol:"Programa Sectorial",descripcion:"Establece que incluso los reguladores están obligados a usar todos sus estudios científicos y económicos apoyando el Programa Sectorial, que es parte del Plan Nacional de Desarrollo de México.",extracto:'"Aportar elementos técnicos a la Secretaría para la formulación y seguimiento del Programa Sectorial de Energía y demás instrumentos de política pública en la materia…"'},{id:"LCPE-Art-002",siglas:"Regla",color:"#555",label:"Consejo",rol:"Órgano de Apoyo",descripcion:"Define el Consejo de Planeación Energética como un grupo de especialistas que acompaña constantemente a la Secretaría en el análisis de que se cumplan las metas.",extracto:'"El Consejo de Planeación Energética es el órgano colegiado de carácter permanente que apoya a la Secretaría de Energía en la coordinación y seguimiento de la planeación energética nacional…"'}],menciones:[{siglas:"LSH",nombre:"Legislación Petrolera",valor:67,color:"#A57F2C"},{siglas:"LSE",nombre:"Legislación Eléctrica",valor:50,color:"#1E5B4F"},{siglas:"RLPTE",nombre:"Reglamentos Complementarios",valor:47,color:"#7a1b38"},{siglas:"LPTE",nombre:"Ley General de Planeación (Pilar)",valor:27,color:"#9B2247"},{siglas:"LCPE",nombre:"Normativas de la Comisión/Consejos",valor:13,color:"#555"}]},{id:"consejos-comites",numero:"02",titulo:"Participación y Especialistas",subtitulo:"Consejo de Planeación y Comités Técnicos",objetivo:"Asegurar que las decisiones del gobierno no se tomen en solitario. La ley crea foros permanentes donde expertos científicos, académicos, la industria y la sociedad civil analizan, vigilan y recomiendan mejoras a la Secretaría de Energía.",color:"#1E5B4F",metricas:[{valor:"4",label:"leyes y reglamentos"},{valor:"5",label:"tipos de comités"},{valor:"35+",label:"menciones obligatorias"}],atributos:[{nombre:"Naturaleza",valor:"Órgano de consulta y evaluación",tipo:"chain"},{nombre:"¿Quién preside?",valor:"Secretaría de Energía",tipo:"gov"},{nombre:"¿Quién participa?",valor:"Academia, Industria, Sociedad Civil",tipo:"council"},{nombre:"Misión Principal",valor:"Guiar el rescate y la transición energética",tipo:"doc"},{nombre:"Nivel Técnico",valor:"Científico y de factibilidad",tipo:"plan"},{nombre:"Carácter",valor:"Permanente (no temporal)",tipo:"scope"}],cadena:[{nivel:1,rol:"EL FORO CENTRAL",nodos:[{id:"cpe-central",titulo:"Consejo de Planeación",descripcion:"Mesa principal donde la sociedad y los expertos dialogan con el gobierno sobre el rumbo energético.",color:"#1E5B4F",articulos:["LPTE-Art-008","LCPE-Art-002"],refs:"LPTE Art. 8 · LCPE"}],conector:"que es apoyado por"},{nivel:2,rol:"LOS GRUPOS ESPECIALIZADOS",nodos:[{id:"comite-cientifico",titulo:"Comité Científico",descripcion:"Académicos e investigadores asegurando que las decisiones tengan base en la ciencia.",color:"#25D366",articulos:["RCPE-Art-012"],refs:"Reglas Consejo Art. 12"},{id:"comite-transicion",titulo:"Comité de Transición",descripcion:"Expertos dedicados exclusivamente a buscar energías limpias y eficientes.",color:"#25D366",articulos:["RCPE-Art-015"],refs:"Reglas Consejo Art. 15"}],conector:"para analizar"},{nivel:3,rol:"LO QUE VIGILAN",nodos:[{id:"politicas-eval",titulo:"Los Planes Sectoriales",descripcion:"Revisan si los grandes planes del gobierno realmente están funcionando.",color:"#9B2247",articulos:["LCPE-Art-002"],refs:"Funciones del Consejo"},{id:"investigacion",titulo:"Innovación Tecnológica",descripcion:"Fomentan el desarrollo de tecnología hecha en México y patentes nacionales.",color:"#444",articulos:["LPTE-Art-110"],refs:"Fomento a Universidades"}],conector:"entregando"},{nivel:4,rol:"EL RESULTADO PRÁCTICO",nodos:[{id:"recomendaciones",titulo:"Recomendaciones",descripcion:"Sugerencias para corregir el rumbo o mejorar los planes.",color:"#555",articulos:["LCPE-Art-008"],refs:"Acuerdos del Consejo"},{id:"informes",titulo:"Informes Públicos",descripcion:"Reportes abiertos y transparentes sobre nuestros éxitos o fracasos en energía.",color:"#666",articulos:["LPTE-Art-012"],refs:"Transparencia Obligatoria"}],conector:null}],articulosClave:[{id:"LPTE-Art-008",siglas:"LPTE",color:"#9B2247",label:"Art. 8",rol:"Creación del Consejo",descripcion:"La Ley ordena expresamente instalar este Consejo para involucrar a quienes saben del aspecto técnico y social.",extracto:'"Corresponde a la Secretaría: Instalar y presidir el Consejo de Planeación Energética y sus respectivos órganos auxiliares, para el mejor desempeño de la planeación…"'},{id:"LCPE-Art-002",siglas:"Reglas",color:"#1E5B4F",label:"LCPE 2",rol:"El Papel del Consejo",descripcion:'Reafirma que es un grupo independiente para "coordinar y seguir" de forma permanente cómo vamos en materia energética nacional.',extracto:'"El Consejo de Planeación Energética es el órgano colegiado de carácter permanente que apoya a la Secretaría de Energía en la coordinación y seguimiento…"'},{id:"RCPE-Art-012",siglas:"Reglas",color:"#25D366",label:"Comité Científico",rol:"El Rol de la Ciencia",descripcion:"Garantiza un espacio exclusivo para que las universidades y centros de investigación den su opinión técnica para nuevos proyectos de energía.",extracto:'"Para apoyar sus funciones, el Consejo contará con un Comité Científico integrado por investigadores del más alto nivel de las instituciones académicas nacionales…"'},{id:"RCPE-Art-015",siglas:"Reglas",color:"#25D366",label:"Comité Transición",rol:"Expertos Ambientales",descripcion:"El Consejo se apoya directamente en un grupo dedicado solo a vigilar la eficiencia y el avance del país hacia un futuro menos contaminante.",extracto:'"El Comité Consultivo para la Transición Energética emitirá recomendaciones sobre las políticas públicas en materia de sustentabilidad y tecnología limpia…"'},{id:"LPTE-Art-110",siglas:"LPTE",color:"#9B2247",label:"Art. 110",rol:"Impulso Nacional",descripcion:"Estos comités pueden sugerir hacia dónde dirigir el dinero público para apoyar inventos e investigación en las universidades.",extracto:'"El Consejo podrá proponer lineamientos para el financiamiento de proyectos de innovación científica y tecnológica en las Universidades Públicas…"'}],menciones:[{siglas:"LCPE",nombre:"Lineamientos de Operación",valor:35,color:"#1E5B4F"},{siglas:"LPTE",nombre:"Ley General de Planeación",valor:22,color:"#9B2247"},{siglas:"LB",nombre:"Ley de Biocombustibles",valor:4,color:"#25D366"},{siglas:"LSH",nombre:"Legislación Petrolera",valor:3,color:"#A57F2C"},{siglas:"LSE",nombre:"Legislación Eléctrica",valor:2,color:"#444"}]}];let Mt=!1;function gr(){if(Mt)return;Mt=!0;const u=document.createElement("style");u.id="analisis-styles",u.textContent=`
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
        </div>`}function Lr(u,f,t){var i;const e=u.querySelector(`#flujo-panel-${f.id}`);if(!e)return;const r={};f.articulosClave.forEach(c=>{r[c.id]=c});const o=t.articulos.map(c=>r[c]).filter(Boolean);if(e.dataset.activeNode===t.id&&!e.classList.contains("hidden")){e.classList.add("hidden"),e.dataset.activeNode="",u.querySelectorAll(".aflujo-node").forEach(c=>{c.classList.remove("anode-active"),c.style.boxShadow=""});return}u.querySelectorAll(".aflujo-node").forEach(c=>{c.classList.remove("anode-active"),c.style.boxShadow=""});const n=u.querySelector(`[data-node-id="${t.id}"]`);if(n&&(n.classList.add("anode-active"),n.style.boxShadow=`0 6px 22px ${t.color}30`),e.dataset.activeNode=t.id,o.length===0){e.innerHTML='<div style="padding:1rem;text-align:center;font-size:0.75rem;color:#9ca3af">Sin artículos específicos para este nodo.</div>',e.classList.remove("hidden");return}e.innerHTML=`
        <div class="aflujo-panel-hdr">
            <span class="aflujo-panel-hdr-title">Artículos relacionados · ${t.titulo}</span>
            <button class="aflujo-panel-close" data-close-panel="${f.id}">✕ cerrar</button>
        </div>
        <div>
            ${o.map(c=>`
                <div class="aflujo-panel-art">
                    <div class="aflujo-panel-art-row">
                        <span class="aflujo-pbadge" style="background:${c.color}">${c.siglas}</span>
                        <span class="aflujo-panel-art-label">${c.label}</span>
                        <span class="aflujo-panel-art-rol">${c.rol}</span>
                    </div>
                    <p class="aflujo-panel-art-desc">${c.descripcion}</p>
                    <button class="aflujo-panel-art-btn" data-open-article="${c.id}">
                        Ver artículo completo →
                    </button>
                </div>`).join("")}
        </div>`,e.classList.remove("hidden"),setTimeout(()=>e.scrollIntoView({behavior:"smooth",block:"nearest"}),50),(i=e.querySelector(`[data-close-panel="${f.id}"]`))==null||i.addEventListener("click",()=>{e.classList.add("hidden"),e.dataset.activeNode="",u.querySelectorAll(".aflujo-node").forEach(c=>{c.classList.remove("anode-active"),c.style.boxShadow=""})}),qt(e,f)}function qt(u,f){u.querySelectorAll("[data-open-article]").forEach(t=>{t.addEventListener("click",()=>{const e=f.articulosClave.map(r=>r.id);document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:t.dataset.openArticle,list:e}}))})})}function Rt(u){u.querySelectorAll(".achart-bar").forEach(f=>{const t=f.dataset.target;t&&setTimeout(()=>{f.style.width=t+"%"},60)})}function Cr(u,f){u.querySelectorAll(".atema-tab").forEach(e=>{e.addEventListener("click",()=>{u.querySelectorAll(".atema-tab").forEach(o=>o.classList.remove("active")),e.classList.add("active");const r=e.dataset.target;u.querySelectorAll(".atema-tab-panel").forEach(o=>{o.classList.toggle("hidden",o.id!==r)}),r!=null&&r.includes("menciones")&&Rt(u)})}),u.querySelectorAll(".aflujo-node").forEach(e=>{e.addEventListener("click",()=>{const r=e.dataset.nodeId,o=f.cadena.find(i=>i.nodos.some(c=>c.id===r)),n=o==null?void 0:o.nodos.find(i=>i.id===r);n&&Lr(u,f,n)})}),qt(u,f);const t=u.querySelector(`#chart-${f.id}`);if(t&&"IntersectionObserver"in window){const e=new IntersectionObserver(r=>{r[0].isIntersecting&&(Rt(u),e.disconnect())},{threshold:.2});e.observe(t)}}function Sr(u){var f;gr(),u.innerHTML=`
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
        </div>`,(f=u.querySelector("#analisis-back-btn"))==null||f.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("analisis:goHome"))}),Pt.forEach(t=>Cr(u,t))}function $r(){var Et,Lt,Ct,St,$t;const u=document.getElementById("search-input"),f=document.getElementById("results-container"),t=document.getElementById("law-detail-container"),e=document.getElementById("stats-minimal"),r=document.getElementById("hero-section"),o=document.getElementById("main-container"),n=document.getElementById("quick-filters"),i=document.getElementById("detail-modal"),c=document.getElementById("modal-panel"),b=document.getElementById("modal-content"),k=document.getElementById("modal-title"),L=document.getElementById("modal-ley"),A=document.getElementById("close-modal"),M=document.getElementById("copy-btn"),P=document.getElementById("loading-indicator"),F=document.getElementById("nav-inicio"),T=document.getElementById("nav-leyes"),N=document.getElementById("mobile-menu-btn"),j=document.getElementById("mobile-menu-overlay"),R=document.getElementById("mobile-menu-drawer"),J=document.getElementById("close-mobile-menu"),s=document.getElementById("mobile-nav-inicio"),ae=document.getElementById("mobile-nav-leyes"),de="app-dark-mode";let ue=localStorage.getItem(de)==="true";function ce(a){if(ue=a,localStorage.setItem(de,a),document.documentElement.classList.toggle("dark-mode",a),!document.getElementById("global-dark-style")){const p=document.createElement("style");p.id="global-dark-style",p.innerHTML=`
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
            `,document.head.appendChild(p)}const l=document.querySelectorAll("#darkmode-icon-moon, #mobile-darkmode-moon"),d=document.querySelectorAll("#darkmode-icon-sun, #mobile-darkmode-sun"),m=document.getElementById("mobile-darkmode-label");l.forEach(p=>p.classList.toggle("hidden",a)),d.forEach(p=>p.classList.toggle("hidden",!a)),m&&(m.textContent=a?"Modo claro":"Modo oscuro")}ue&&ce(!0),(Et=document.getElementById("darkmode-toggle"))==null||Et.addEventListener("click",()=>ce(!ue)),(Lt=document.getElementById("mobile-darkmode-toggle"))==null||Lt.addEventListener("click",()=>ce(!ue));function oe(a){!R||!j||(a?(j.classList.remove("hidden"),j.offsetWidth,j.classList.remove("opacity-0"),R.classList.remove("translate-x-full"),document.body.style.overflow="hidden"):(j.classList.add("opacity-0"),R.classList.add("translate-x-full"),document.body.style.overflow="",setTimeout(()=>{j.classList.add("hidden")},300)))}N&&N.addEventListener("click",()=>oe(!0)),J&&J.addEventListener("click",()=>oe(!1)),j&&j.addEventListener("click",()=>oe(!1)),s&&s.addEventListener("click",a=>{a.preventDefault(),Ie(),oe(!1)}),ae&&ae.addEventListener("click",a=>{a.preventDefault(),Pe(),oe(!1)});let U=[],q=[];window.addEventListener("search-ready",a=>{const{totalLeyes:l,totalArticulos:d,summaries:m}=a.detail;U=m,e&&(e.innerHTML=`
                <span class="opacity-60">Índice activo:</span>
                <span class="font-semibold text-guinda">${l} leyes</span>
                <span class="mx-1 opacity-30">|</span>
                <span class="font-semibold text-guinda">${d} artículos</span>
            `),gt(),setTimeout(Q,0)});const Le=document.getElementById("nav-favorites"),Y=document.getElementById("mobile-nav-favorites");Le&&Le.addEventListener("click",()=>bt()),Y&&Y.addEventListener("click",()=>{bt(),oe(!1)});const Ce=document.getElementById("nav-analisis"),xe=document.getElementById("mobile-nav-analisis");Ce&&Ce.addEventListener("click",a=>{a.preventDefault(),kt()}),xe&&xe.addEventListener("click",a=>{a.preventDefault(),kt(),oe(!1)});const pe=document.getElementById("nav-stats"),me=document.getElementById("mobile-nav-stats");pe&&pe.addEventListener("click",a=>{a.preventDefault(),yt()}),me&&me.addEventListener("click",a=>{a.preventDefault(),yt(),oe(!1)}),document.addEventListener("analisis:openArticle",a=>{const{id:l,list:d}=a.detail;d&&d.length&&(ke=d.map(m=>Te(m)).filter(Boolean)),ge(l)}),document.addEventListener("analisis:goHome",()=>Ie()),(Ct=document.getElementById("close-compare-modal"))==null||Ct.addEventListener("click",tt),(St=document.getElementById("compare-modal"))==null||St.addEventListener("click",a=>{a.target===document.getElementById("compare-modal")&&tt()});function $(a){history.pushState(null,"",a?`${location.pathname}${a}`:location.pathname)}function Q(){const a=location.hash;if(a){if(a.startsWith("#art-")){const l=decodeURIComponent(a.slice(5)),d=Te(l);if(!d)return;ke=[d],ge(l)}else if(a.startsWith("#ley-")){const l=decodeURIComponent(a.slice(5)),d=U.find(m=>m.id===l);d&&Me(d)}}}window.addEventListener("popstate",()=>{const a=location.hash;if(!a)Ie();else if(a.startsWith("#art-")){const l=decodeURIComponent(a.slice(5)),d=Te(l);if(!d)return;ke=[d],ge(l)}else if(a.startsWith("#ley-")){const l=decodeURIComponent(a.slice(5)),d=U.find(m=>m.id===l);d&&Me(d)}});function Z(a,l="✓",d="bg-gray-900"){const m=document.getElementById("app-toast");m&&m.remove();const p=document.createElement("div");p.id="app-toast",p.className=`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 ${d} text-white text-xs font-semibold rounded-full shadow-2xl transition-all duration-300 opacity-0 scale-90 pointer-events-none`,p.innerHTML=`<span>${l}</span><span>${a}</span>`,document.body.appendChild(p),requestAnimationFrame(()=>{p.classList.replace("opacity-0","opacity-100"),p.classList.replace("scale-90","scale-100")}),setTimeout(()=>{p.classList.replace("opacity-100","opacity-0"),p.classList.replace("scale-100","scale-90"),setTimeout(()=>p.remove(),300)},2500)}function I(a=5){f.innerHTML=Array(a).fill("").map(()=>`
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
        `).join("")}let _="",O=[],H=1;const fe=10;function X(a,l,d){const m=document.getElementById(l);if(!m)return;const p=m.nextElementSibling;if(p&&p.classList.contains("pagination-nav")&&p.remove(),a<=fe)return;const w=Math.ceil(a/fe),v=document.createElement("nav");v.className="pagination-nav flex justify-center items-center gap-2 mt-8 mb-4";const h=document.createElement("button");h.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>',h.className=`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${H===1?"opacity-50 cursor-not-allowed":""}`,h.disabled=H===1,h.onclick=()=>{H>1&&(H--,d(),window.scrollTo({top:m.offsetTop-100,behavior:"smooth"}))};const g=document.createElement("span");g.className="text-xs text-gray-500 font-medium",g.innerText=`Página ${H} de ${w}`;const x=document.createElement("button");x.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>',x.className=`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${H===w?"opacity-50 cursor-not-allowed":""}`,x.disabled=H===w,x.onclick=()=>{H<w&&(H++,d(),window.scrollTo({top:m.offsetTop-100,behavior:"smooth"}))},v.appendChild(h),v.appendChild(g),v.appendChild(x),m.parentNode.insertBefore(v,m.nextSibling)}F&&F.addEventListener("click",a=>{a.preventDefault(),Ie()}),T&&T.addEventListener("click",a=>{a.preventDefault(),Pe()});function ye(){var l;(l=document.getElementById("toc-toggle-btn"))==null||l.remove();const a=document.getElementById("toc-panel");a&&(a.classList.add("translate-y-full"),setTimeout(()=>a.remove(),310)),document.body.style.overflow=""}function je(){var a;(a=document.getElementById("global-search-wrapper"))==null||a.classList.remove("hidden")}function pt(){var a;(a=document.getElementById("global-search-wrapper"))==null||a.classList.add("hidden"),u&&(u.value="")}function Ie(){var d;$(null),ye(),je(),u&&(u.value=""),r.classList.remove("hidden"),n.classList.remove("hidden"),e.classList.remove("hidden"),o.classList.add("justify-center","pt-24"),o.classList.remove("pt-8"),f.classList.add("hidden","opacity-0"),f.innerHTML="",t&&t.classList.add("hidden","opacity-0"),(d=document.getElementById("analisis-container"))==null||d.classList.add("hidden","opacity-0");const a=document.getElementById("search-filters");a&&a.remove();const l=document.querySelector(".pagination-nav");l&&l.remove(),H=1,W={type:"all",law:"all",artNum:""}}function Pe(){var m;if($(null),ye(),je(),r.classList.add("hidden"),n.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),(m=document.getElementById("analisis-container"))==null||m.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),f.classList.remove("hidden"),setTimeout(()=>f.classList.remove("opacity-0"),50),u&&(u.value=""),U.length===0){f.innerHTML='<div class="text-center py-12 text-gray-400">Cargando leyes...</div>';return}const a=U.filter(p=>p.titulo.toLowerCase().startsWith("ley")),l=U.filter(p=>p.titulo.toLowerCase().startsWith("reglamento")),d=U.filter(p=>!p.titulo.toLowerCase().startsWith("ley")&&!p.titulo.toLowerCase().startsWith("reglamento"));f.innerHTML=`
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Marco Jurídico Disponible</h2>
                <p class="text-sm text-gray-400 font-light">Explora las leyes y reglamentos indexados en el sistema.</p>
            </div>
            
            ${Ye("Leyes Federales",a)}
            ${Ye("Reglamentos",l)}
            ${Ye("Acuerdos y Otros Instrumentos",d)}
        `,document.querySelectorAll(".law-card").forEach(p=>{p.addEventListener("click",()=>{const w=p.dataset.title,v=U.find(h=>h.titulo===w);v&&Me(v)})}),document.querySelectorAll(".carousel-container").forEach(p=>{const w=p.querySelector(".carousel-scroll"),v=p.querySelector(".scroll-left"),h=p.querySelector(".scroll-right");v&&h&&w&&(v.addEventListener("click",()=>{w.scrollBy({left:-300,behavior:"smooth"})}),h.addEventListener("click",()=>{w.scrollBy({left:300,behavior:"smooth"})}))})}function Ye(a,l){if(l.length===0)return"";const d=a.toLowerCase().includes("ley"),m=a.toLowerCase().includes("reglamento"),p=d?{gradFrom:"#6b1532",gradTo:"#9B2247",label:"Ley Federal",dotClass:"bg-guinda"}:m?{gradFrom:"#14403a",gradTo:"#1E5B4F",label:"Reglamento",dotClass:"bg-emerald-700"}:{gradFrom:"#7a5c1e",gradTo:"#A57F2C",label:"Instrumento",dotClass:"bg-amber-700"},w=d?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>':m?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>';return`
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
        `}function Me(a){var ve,nt,_t,Bt,It,At,Tt;if(!t)return;ye(),pt(),q=mr(a.titulo);const l=[...new Set(q.map(S=>S.capitulo_nombre).filter(Boolean))];[...new Set(q.map(S=>S.titulo_nombre).filter(Boolean))];const d=q.filter(S=>S.articulo_label.toLowerCase().includes("transitorio")).length;f.classList.add("hidden"),r.classList.add("hidden"),n.classList.add("hidden"),e.classList.add("hidden"),(ve=document.getElementById("analisis-container"))==null||ve.classList.add("hidden","opacity-0"),t.classList.remove("hidden"),setTimeout(()=>t.classList.remove("opacity-0"),50),$(`#ley-${encodeURIComponent(a.id)}`);let m=100,p=localStorage.getItem("reader-theme")||"light";t.innerHTML=`
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
                     <span class="text-3xl font-head font-bold text-guinda">${d}</span>
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
                        ${a.temas_clave?a.temas_clave.map(S=>`<button class="theme-filter-btn text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-guinda hover:text-white hover:border-guinda transition-all shadow-sm" data-theme="${S}">${S}</button>`).join(""):'<span class="text-xs text-gray-400">No disponibles</span>'}
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
        `,document.body.appendChild(w);const v=q.map((S,z)=>{const ne=S.articulo_label.match(/\d+/),te=ne?ne[0]:z+1,ze=!!Ne(S.id);return`<button class="toc-art-btn text-[11px] font-medium rounded-lg py-2 px-1 border transition-all text-center relative
                ${Oe(S.id)?"border-guinda/30 bg-guinda/5 text-guinda":"border-gray-100 bg-white text-gray-600 hover:border-guinda hover:text-guinda hover:bg-guinda/5"}"
                data-id="${S.id}" title="${S.articulo_label}">
                Art.${te}
                ${ze?'<span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>':""}
            </button>`}).join(""),h=q.map(S=>{const z=!!Ne(S.id),ne=Oe(S.id),te=S.titulo_nombre?`<span class="text-gray-400 ml-1 font-normal">· ${S.titulo_nombre}</span>`:"",ze=S.texto?S.texto.replace(/\s+/g," ").substring(0,120).trim()+(S.texto.length>120?"...":""):"";return`<button class="toc-art-btn w-full flex flex-col gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-guinda/5 group/item
                ${ne?"text-guinda":"text-gray-700 hover:text-guinda"}"
                data-id="${S.id}">
                <div class="flex items-center gap-3">
                    <span class="flex-shrink-0 text-[10px] font-bold min-w-[36px] text-center py-1 rounded-md
                        ${ne?"bg-guinda/10 text-guinda":"bg-gray-100 text-gray-500 group-hover/item:bg-guinda/10 group-hover/item:text-guinda"}">
                        ${S.articulo_label.replace(/Artículo\s*/i,"Art.").split(" ")[0]+(S.articulo_label.match(/\d+/)?" "+S.articulo_label.match(/\d+/)[0]:"")}
                    </span>
                    <span class="text-xs font-medium flex-1 leading-snug">
                        ${S.articulo_label}${te}
                    </span>
                    <span class="flex-shrink-0 flex items-center gap-1">
                        ${z?'<span class="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Tiene nota"></span>':""}
                        ${ne?'<svg class="w-3 h-3 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>':""}
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
        `,document.body.appendChild(g);const x=g.querySelector("#toc-tab-grid"),E=g.querySelector("#toc-tab-list"),y=g.querySelector("#toc-content-grid"),C=g.querySelector("#toc-content-list"),B=g.querySelector("#toc-search"),V=["bg-guinda","text-white","shadow-sm"],G=["text-gray-500","hover:text-guinda","hover:bg-guinda/5"];x.addEventListener("click",()=>{x.classList.add(...V),x.classList.remove(...G),E.classList.remove(...V),E.classList.add(...G),y.classList.remove("hidden"),C.classList.add("hidden"),B&&(B.value=""),y.querySelectorAll(".toc-art-btn").forEach(S=>S.style.display="")}),E.addEventListener("click",()=>{E.classList.add(...V),E.classList.remove(...G),x.classList.remove(...V),x.classList.add(...G),C.classList.remove("hidden"),y.classList.add("hidden"),B&&(B.value=""),C.querySelectorAll(".toc-art-btn").forEach(S=>S.style.display="")}),B&&(B.addEventListener("input",S=>{const z=S.target.value.toLowerCase().trim();(C.classList.contains("hidden")?y:C).querySelectorAll(".toc-art-btn").forEach(te=>{var it;const ze=!z||((it=te.title)==null?void 0:it.toLowerCase().includes(z))||te.textContent.toLowerCase().includes(z);te.style.display=ze?"":"none"})}),B.addEventListener("click",S=>S.stopPropagation()));let ee=!1;const Se=S=>{ee=S,S?(g.classList.remove("translate-y-full"),document.body.style.overflow="hidden"):(g.classList.add("translate-y-full"),document.body.style.overflow="")};w.addEventListener("click",()=>Se(!ee)),(nt=g.querySelector("#toc-close-btn"))==null||nt.addEventListener("click",()=>Se(!1)),g.querySelectorAll(".toc-art-btn").forEach(S=>{S.addEventListener("click",()=>{Se(!1),ge(S.dataset.id)})}),Fe(q.slice(0,20),""),setTimeout(()=>{mt(q)},100);const he=document.getElementById("law-articles-list"),$e=document.getElementById("btn-font-increase"),_e=document.getElementById("btn-font-decrease"),be=document.getElementById("font-size-display"),De=document.querySelectorAll(".theme-btn");document.getElementById("law-header-area");const Ge=S=>{if(p=S,localStorage.setItem("reader-theme",S),document.body.className=`bg-${S} text-gray-900 font-body min-h-screen flex flex-col antialiased transition-colors duration-300`,De.forEach(z=>{z.classList.remove("ring-2","ring-guinda","ring-offset-1"),z.dataset.theme===S&&z.classList.add("ring-2","ring-guinda","ring-offset-1")}),document.querySelectorAll(".mob-theme-btn").forEach(z=>{z.classList.remove("border-guinda","text-guinda"),z.classList.add("border-transparent"),z.dataset.theme===S&&(z.classList.remove("border-transparent"),z.classList.add("border-guinda"),S!=="dark"&&z.classList.add("text-guinda"))}),!document.getElementById("reader-themes-style")){const z=document.createElement("style");z.id="reader-themes-style",z.innerHTML=`
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
                `,document.head.appendChild(z)}};Ge(p);const Be=()=>{he&&(he.style.fontSize=`${m}%`),document.querySelectorAll("#font-size-display, #mob-font-display").forEach(S=>{S.innerText=`${m}%`})};$e&&$e.addEventListener("click",()=>{m<250&&(m+=10,Be())}),_e&&_e.addEventListener("click",()=>{m>80&&(m-=10,Be())}),be&&(be.addEventListener("click",()=>{m=100,Be()}),be.style.cursor="pointer",be.title="Restablecer al 100%"),De.forEach(S=>{S.addEventListener("click",z=>{Ge(z.target.dataset.theme)})});const D=document.getElementById("mobile-reading-toggle"),se=document.getElementById("mobile-reading-sheet"),le=document.getElementById("mobile-reading-overlay"),Je=S=>{se==null||se.classList.toggle("translate-y-full",!S),le==null||le.classList.toggle("hidden",!S)};D==null||D.addEventListener("click",()=>Je(!0)),le==null||le.addEventListener("click",()=>Je(!1)),(_t=document.getElementById("mob-font-decrease"))==null||_t.addEventListener("click",()=>{m>80&&(m-=10,Be())}),(Bt=document.getElementById("mob-font-increase"))==null||Bt.addEventListener("click",()=>{m<250&&(m+=10,Be())}),document.querySelectorAll(".mob-theme-btn").forEach(S=>{S.addEventListener("click",()=>{Ge(S.dataset.theme),Je(!1)})});const Qe=document.getElementById("law-share-btn"),re=document.getElementById("law-share-menu");document.getElementById("law-share-text-btn"),document.getElementById("law-share-link-btn"),Qe&&re&&(Qe.addEventListener("click",S=>{S.stopPropagation(),re.classList.toggle("hidden")}),document.addEventListener("click",function S(z){z.target.closest("#law-share-wrapper")||(re.classList.add("hidden"),document.removeEventListener("click",S))})),Object.entries({"law-share-whatsapp-btn":()=>Ue(a,"whatsapp"),"law-share-telegram-btn":()=>Ue(a,"telegram"),"law-share-twitter-btn":()=>Ue(a,"twitter"),"law-share-email-btn":()=>Ue(a,"email"),"law-share-link-btn":()=>{const S=`${location.origin}${location.pathname}#ley-${encodeURIComponent(a.id)}`;navigator.clipboard.writeText(S).then(()=>Z("¡Enlace copiado!","🔗","bg-blue-600"))}}).forEach(([S,z])=>{var ne;(ne=document.getElementById(S))==null||ne.addEventListener("click",()=>{re==null||re.classList.add("hidden"),z()})}),(It=document.getElementById("print-btn"))==null||It.addEventListener("click",()=>window.print()),(At=document.getElementById("crumb-inicio"))==null||At.addEventListener("click",()=>Ie()),(Tt=document.getElementById("crumb-categoria"))==null||Tt.addEventListener("click",()=>Pe()),document.querySelectorAll(".theme-filter-btn").forEach(S=>{S.addEventListener("click",z=>{const ne=z.target.dataset.theme,te=document.getElementById("law-search-input");te&&(te.value=ne,te.dispatchEvent(new Event("input")))})}),document.getElementById("law-search-input").addEventListener("input",S=>{const z=S.target.value.toLowerCase().trim();let ne=q;z.length>2&&(ne=q.filter(te=>te.texto.toLowerCase().includes(z)||te.articulo_label.toLowerCase().includes(z)||te.titulo_nombre&&te.titulo_nombre.toLowerCase().includes(z)||te.capitulo_nombre&&te.capitulo_nombre.toLowerCase().includes(z))),Fe(ne.slice(0,50),z)}),document.getElementById("export-csv-btn").addEventListener("click",()=>{Wt(q,`${a.titulo}.csv`)})}function mt(a){const l=document.getElementById("law-structure-chart");if(!l)return;if(!window.d3){l.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">Cargando visualización...</div>',setTimeout(()=>mt(a),1e3);return}if(l.innerHTML="",!a||a.length===0){l.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">No hay datos para visualizar</div>';return}const d={};a.forEach(C=>{let B=C.titulo_nombre||C.capitulo_nombre||"General";B=B.replace(/^TÍTULO\s+/i,"").replace(/^CAPÍTULO\s+/i,""),B=B.replace(/^[IVXLCDM]+\.?\s*-?\s*/,""),B=B.replace(/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)\.?\s*-?\s*/i,""),B=B.trim(),B||(B="General"),B.length>25&&(B=B.substring(0,25)+"..."),d[B]=(d[B]||0)+1});const m=Object.entries(d).map(([C,B])=>({name:C,value:B})).sort((C,B)=>B.value-C.value).slice(0,5);if(m.length===0){l.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">Datos insuficientes</div>';return}const p={top:10,right:30,bottom:20,left:220},w=l.clientWidth,h=Math.max(l.clientHeight,m.length*35+p.top+p.bottom);d3.select(l).select("svg").remove();const g=d3.select(l).append("svg").attr("width","100%").attr("height",h).attr("viewBox",[0,0,w,h]).attr("style","max-width: 100%; height: auto; font: 11px sans-serif;"),x=d3.scaleLinear().domain([0,d3.max(m,C=>C.value)]).range([p.left,w-p.right]),E=d3.scaleBand().domain(m.map(C=>C.name)).rangeRound([p.top,h-p.bottom]).padding(.3);d3.selectAll(".d3-tooltip").remove();const y=d3.select("body").append("div").attr("class","d3-tooltip absolute bg-gray-900/90 backdrop-blur text-white text-[10px] rounded-lg py-1.5 px-3 pointer-events-none opacity-0 transition-opacity z-50 shadow-xl border border-gray-700").style("display","none");g.append("g").attr("fill","#9B2247").selectAll("rect").data(m).join("rect").attr("x",x(0)).attr("y",C=>E(C.name)).attr("width",C=>Math.max(0,x(C.value)-x(0))).attr("height",E.bandwidth()).attr("rx",4).on("mouseover",(C,B)=>{d3.select(C.target).attr("fill","#7A1C39"),y.style("opacity","1").style("display","block").text(`${B.name}: ${B.value} artículos`)}).on("mousemove",C=>{y.style("left",C.pageX+10+"px").style("top",C.pageY-10+"px")}).on("mouseout",C=>{d3.select(C.target).attr("fill","#9B2247"),y.style("opacity","0").style("display","none")}),g.append("g").attr("fill","black").attr("text-anchor","start").attr("font-size","10px").selectAll("text").data(m).join("text").attr("x",C=>x(C.value)+4).attr("y",C=>E(C.name)+E.bandwidth()/2).attr("dy","0.35em").text(C=>C.value),g.append("g").call(d3.axisLeft(E).tickSize(0)).attr("transform",`translate(${p.left},0)`).call(C=>C.select(".domain").remove()).call(C=>C.selectAll("text").attr("fill","#4B5563").attr("font-weight","500").style("text-anchor","end").attr("dx","-6"))}function Fe(a,l){const d=document.getElementById("law-articles-list");if(d){if(a.length===0){d.innerHTML='<div class="text-center py-8 text-gray-400 text-sm">No se encontraron artículos que coincidan con la búsqueda.</div>';return}ke=a,d.innerHTML=a.map(m=>{const p=l?He(m.texto,l):m.texto.substring(0,300)+"...",w=!!Ne(m.id),v=Oe(m.id)?'<svg class="w-3.5 h-3.5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>',h=ie.includes(m.id),g=h?"text-guinda":ie.length>=2?"text-gray-100":"text-gray-300 hover:text-guinda",x=h?"bg-guinda/10":"";return`
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
            `}).join(""),document.querySelectorAll("#law-articles-list .result-item").forEach(m=>{m.addEventListener("click",p=>{p.target.closest(".bookmark-card-btn")||p.target.closest(".compare-card-btn")||ge(m.dataset.id)})}),document.querySelectorAll("#law-articles-list .bookmark-card-btn").forEach(m=>{m.addEventListener("click",p=>{p.stopPropagation();const w=document.getElementById("law-search-input");Ze(m.dataset.id);const v=w?w.value.toLowerCase().trim():"";Fe(q.slice(0,50),v)})}),document.querySelectorAll("#law-articles-list .compare-card-btn").forEach(m=>{m.addEventListener("click",p=>{var g;p.stopPropagation();const w=m.dataset.id,v=ie.indexOf(w);v>=0?ie.splice(v,1):ie.length<2&&ie.push(w),vt();const h=((g=document.getElementById("law-search-input"))==null?void 0:g.value.toLowerCase().trim())||"";Fe(q.slice(0,50),h)})})}}function Ht(a){return a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}const Vt=new Set(["de","la","el","los","las","en","a","con","por","para","del","al","se","su","sus","que","no","un","una","o","y","e","ni","u","lo","le","les","me","te","nos","mi","si","es","son","fue","ser","ha","han","hay","más","ya","pero","como","este","esta","ese","esa","ante","bajo","cada","cual","donde","entre","hacia","hasta","muy","poco","sin","sobre","solo","tan","todo","tras","otros"]);function He(a,l){if(!l||!a)return a||"";const d=l.trim().split(/\s+/),m=d.length>1,p=d.filter(h=>m?h.length>3&&!Vt.has(h.toLowerCase()):h.length>1);if(p.length===0)return a;const w=p.map(h=>Ht(h)).join("|"),v=new RegExp(`(${w})`,"gi");return a.replace(v,'<mark class="hl">$1</mark>')}function Ut(a,l){const d=l>0?a/l:0;return d>=.6?'<span class="text-[9px] font-bold text-guinda bg-guinda/10 px-1.5 py-0.5 rounded-full">Alta</span>':d>=.25?'<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Media</span>':'<span class="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">Baja</span>'}function Wt(a,l){const d=["Ley","Artículo","Texto"],m=a.map(h=>[`"${h.ley_origen}"`,`"${h.articulo_label}"`,`"${h.texto.replace(/"/g,'""')}"`]),p=[d.join(","),...m.map(h=>h.join(","))].join(`
`),w=new Blob([p],{type:"text/csv;charset=utf-8;"}),v=document.createElement("a");if(v.download!==void 0){const h=URL.createObjectURL(w);v.setAttribute("href",h),v.setAttribute("download",l),v.style.visibility="hidden",document.body.appendChild(v),v.click(),document.body.removeChild(v)}}function Gt(a){const l=Ke().filter(d=>d!==a);l.unshift(a),localStorage.setItem("search-history",JSON.stringify(l.slice(0,10)))}function Ke(){return JSON.parse(localStorage.getItem("search-history")||"[]")}n&&n.addEventListener("click",a=>{a.target.tagName==="BUTTON"&&(u.value=a.target.textContent,u.dispatchEvent(new Event("input")))});function Re(a){return a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}function ft(a,l){const d=Re(a),m=Re(l),p=d.indexOf(m);return p===-1?we(a):we(a.slice(0,p))+`<mark class="bg-guinda/10 text-guinda font-semibold not-italic">${we(a.slice(p,p+l.length))}</mark>`+we(a.slice(p+l.length))}function we(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}if(u){let d=function(){return Array.from(a.querySelectorAll("[data-navigable]"))},m=function(h){const g=d();g.forEach((x,E)=>{x.classList.toggle("bg-gray-50",E===h),x.setAttribute("aria-selected",E===h?"true":"false")}),l=h,g[h]&&g[h].scrollIntoView({block:"nearest"})},p=function(){a.classList.add("hidden"),l=-1},w=function(h){var x;l=-1;const g=[];if(h){const E=U.filter(V=>Re(V.titulo).includes(Re(h))).slice(0,4);E.length>0&&g.push({label:"Leyes",items:E.map(V=>({html:`
                                <svg class="w-4 h-4 text-guinda opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                <span class="text-sm text-gray-700 font-medium truncate">${ft(V.titulo,h)}</span>`,attrs:`data-navigable data-law-title="${we(V.titulo)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-law"`}))});const y=fr(),C=Re(h),B=[];for(const V of y){if(B.length>=4)break;const G=V.articulo_label||"",ee=V.titulo_nombre||"",Se=V.capitulo_nombre||"",he=[G,ee,Se].find($e=>$e&&Re($e).includes(C));he&&B.push({art:V,matchField:he})}B.length>0&&g.push({label:"Artículos",items:B.map(({art:V,matchField:G})=>({html:`
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
            `).join(""),a.classList.remove("hidden"),(x=document.getElementById("clear-all-history"))==null||x.addEventListener("click",E=>{E.stopPropagation(),localStorage.removeItem("search-history"),p()}),a.querySelectorAll(".history-item").forEach(E=>{E.addEventListener("click",y=>{if(y.target.classList.contains("remove-history-item")){y.stopPropagation();const C=y.target.dataset.query,B=Ke().filter(V=>V!==C);localStorage.setItem("search-history",JSON.stringify(B)),E.remove(),a.querySelectorAll(".history-item").length===0&&p();return}u.value=E.dataset.query,u.dispatchEvent(new Event("input")),p()})}),a.querySelectorAll(".suggestion-law").forEach(E=>{E.addEventListener("click",()=>{const y=E.dataset.lawTitle,C=U.find(B=>B.titulo===y);C&&(Me(C),p(),u.value="")})}),a.querySelectorAll(".suggestion-article").forEach(E=>{E.addEventListener("click",()=>{const y=E.dataset.articleId;y&&(ge(y),p(),u.value="")})})};var _r=d,Br=m,Ir=p,Ar=w;const a=document.createElement("div");a.id="autocomplete-results",a.className="absolute w-full bg-white border border-gray-100 rounded-2xl shadow-xl mt-2 hidden z-50 overflow-hidden max-h-96 overflow-y-auto",u.parentNode.appendChild(a);let l=-1;document.addEventListener("click",h=>{!u.contains(h.target)&&!a.contains(h.target)&&p()}),u.addEventListener("keydown",h=>{var x;if(a.classList.contains("hidden"))return;const g=d();h.key==="ArrowDown"?(h.preventDefault(),m(Math.min(l+1,g.length-1))):h.key==="ArrowUp"?(h.preventDefault(),m(Math.max(l-1,-1)),l===-1&&g.forEach(E=>E.classList.remove("bg-gray-50"))):h.key==="Enter"&&l>=0?(h.preventDefault(),(x=g[l])==null||x.click()):h.key==="Escape"&&p()}),u.addEventListener("focus",()=>{u.value.trim().length>0||w("")}),u.addEventListener("click",h=>{h.stopPropagation(),u.value.trim()||w("")});let v=null;u.addEventListener("input",h=>{var x,E;const g=h.target.value.trim();g.length>2?(ye(),t&&t.classList.add("hidden","opacity-0"),r.classList.add("hidden"),r.classList.remove("block"),n.classList.add("hidden"),e.classList.add("hidden"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),f.classList.remove("hidden"),setTimeout(()=>f.classList.remove("opacity-0"),50),P&&P.classList.remove("hidden"),I(),w(g),clearTimeout(v),v=setTimeout(()=>{O=pr(g),_=g,H=1,W={type:"all",law:"all",artNum:""},Gt(g),Ae(),P&&P.classList.add("hidden")},250)):g.length===0&&(ye(),t&&t.classList.add("hidden","opacity-0"),r.classList.remove("hidden"),n.classList.remove("hidden"),e.classList.remove("hidden"),o.classList.add("justify-center","pt-24"),o.classList.remove("pt-8"),f.classList.add("hidden","opacity-0"),f.innerHTML="",(x=document.querySelector(".pagination-nav"))==null||x.remove(),(E=document.getElementById("search-filters"))==null||E.remove(),H=1,O=[],_="",w(""))})}let W={type:"all",law:"all",artNum:""},ke=[],ie=[];function Ve(){return JSON.parse(localStorage.getItem("article-favorites")||"[]")}function Oe(a){return Ve().includes(a)}function Ze(a){const l=Ve(),d=l.indexOf(a);d>=0?l.splice(d,1):l.unshift(a),localStorage.setItem("article-favorites",JSON.stringify(l)),gt()}function gt(){const a=Ve().length,l=Object.keys(et()).length;document.querySelectorAll("#nav-favorites, #mobile-nav-favorites").forEach(d=>{d&&(d.classList.toggle("hidden",a===0&&l===0),d.querySelectorAll(".fav-count").forEach(m=>m.textContent=a))})}function et(){return JSON.parse(localStorage.getItem("article-notes")||"{}")}function Ne(a){return et()[a]||""}function ht(a,l){const d=et();l.trim()?d[a]=l.trim():delete d[a],localStorage.setItem("article-notes",JSON.stringify(d))}function Jt(a,l,d=!1){const m=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),p=a.map(g=>{const x=d?Ne(g.id):"";return`
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
        </body></html>`,v=new Blob([w],{type:"text/html;charset=utf-8;"}),h=document.createElement("a");h.href=URL.createObjectURL(v),h.download=`${l.replace(/\s+/g,"_")}_${m.replace(/\s/g,"-")}.html`,h.click(),URL.revokeObjectURL(h.href)}function Xt(a,l,d=!1){const m=["Ley","Artículo","Título","Texto",...d?["Nota personal"]:[]],p=a.map(g=>[`"${(g.ley_origen||"").replace(/"/g,'""')}"`,`"${(g.articulo_label||"").replace(/"/g,'""')}"`,`"${(g.titulo_nombre||"").replace(/"/g,'""')}"`,`"${(g.texto||"").replace(/"/g,'""')}"`,...d?[`"${Ne(g.id).replace(/"/g,'""')}"`]:[]]),w=[m.join(","),...p.map(g=>g.join(","))].join(`
`),v=new Blob(["\uFEFF"+w],{type:"text/csv;charset=utf-8;"}),h=document.createElement("a");h.href=URL.createObjectURL(v),h.download=l,h.click(),URL.revokeObjectURL(h.href)}function bt(){var w,v,h;$(null),ye(),je();const a=Ve();r.classList.add("hidden"),n.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),(w=document.getElementById("analisis-container"))==null||w.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),f.classList.remove("hidden"),setTimeout(()=>f.classList.remove("opacity-0"),50);const l=document.getElementById("search-filters");if(l&&l.remove(),a.length===0){f.innerHTML='<div class="text-center py-16 text-gray-400 text-sm">No tienes artículos guardados aún.</div>';return}const d=a.map(g=>Te(g)).filter(Boolean);ke=d,f.innerHTML=`
            <div class="w-full mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 class="text-xl font-head font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        Mis Favoritos
                    </h2>
                    <p class="text-xs text-gray-400">${d.length} artículo${d.length!==1?"s":""} guardado${d.length!==1?"s":""}</p>
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
            ${d.map(g=>`
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer result-item" data-id="${g.id}">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${g.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 truncate max-w-[200px]">${g.titulo_nombre||""}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${g.articulo_label}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${g.texto.substring(0,300)}...</p>
            </div>
            `).join("")}
        `,document.querySelectorAll("#results-container .result-item").forEach(g=>{g.addEventListener("click",()=>ge(g.dataset.id))});const m=document.getElementById("export-favs-btn"),p=document.getElementById("export-favs-menu");m&&p&&(m.addEventListener("click",g=>{g.stopPropagation(),p.classList.toggle("hidden")}),document.addEventListener("click",function g(x){!x.target.closest("#export-favs-btn")&&!x.target.closest("#export-favs-menu")&&(p.classList.add("hidden"),document.removeEventListener("click",g))})),(v=document.getElementById("export-favs-html"))==null||v.addEventListener("click",()=>{p==null||p.classList.add("hidden"),Jt(d,"Mis Favoritos SENER",!1),Z("¡Exportando HTML!","📄","bg-blue-600")}),(h=document.getElementById("export-favs-csv"))==null||h.addEventListener("click",()=>{p==null||p.classList.add("hidden"),Xt(d,"favoritos_SENER.csv",!1),Z("¡Exportando CSV!","📊","bg-green-700")})}function vt(){var d,m;const a=document.getElementById("reading-controls");let l=document.getElementById("compare-bar");if(ie.length===0){l==null||l.remove(),a&&(a.classList.remove("bottom-16"),a.classList.add("bottom-6"));return}l||(l=document.createElement("div"),l.id="compare-bar",document.body.appendChild(l)),a&&(a.classList.remove("bottom-6"),a.classList.add("bottom-16")),l.className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl py-3 px-6 flex items-center justify-between",l.innerHTML=`
            <div class="flex items-center gap-3">
                <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                <span class="text-xs font-bold text-gray-700">${ie.length} de 2 seleccionados</span>
                ${ie.length<2?'<span class="text-xs text-gray-400">Selecciona un artículo más para comparar</span>':""}
            </div>
            <div class="flex items-center gap-2">
                <button id="compare-clear-btn" class="text-xs text-gray-400 hover:text-guinda transition-colors px-3 py-1.5">Limpiar</button>
                ${ie.length===2?'<button id="compare-go-btn" class="px-4 py-2 bg-guinda text-white text-xs font-bold rounded-full hover:bg-guinda/90 transition-colors">Comparar →</button>':""}
            </div>
        `,(d=document.getElementById("compare-clear-btn"))==null||d.addEventListener("click",()=>{var w;ie=[],vt();const p=((w=document.getElementById("law-search-input"))==null?void 0:w.value.toLowerCase().trim())||"";Fe(q.slice(0,50),p)}),(m=document.getElementById("compare-go-btn"))==null||m.addEventListener("click",()=>{Yt(ie[0],ie[1])})}function Yt(a,l){const d=Te(a),m=Te(l);if(!d||!m)return;const p=document.getElementById("compare-modal"),w=document.getElementById("compare-content"),v=document.getElementById("compare-panel");if(!p||!w)return;const h=y=>`
            <div class="flex flex-col">
                <div class="mb-4 p-3 bg-guinda/5 rounded-xl border border-guinda/10">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider block mb-1">${y.ley_origen}</span>
                    <h4 class="font-bold text-gray-800 text-sm mb-0.5">${y.articulo_label}</h4>
                    <span class="text-xs text-gray-400">${y.titulo_nombre||""} ${y.capitulo_nombre?"· "+y.capitulo_nombre:""}</span>
                </div>
                <div class="text-sm text-gray-700 font-serif leading-relaxed">
                    ${y.texto.split(`

`).map(C=>`<p class="mb-3">${C}</p>`).join("")}
                </div>
            </div>`;w.innerHTML=h(d)+h(m),p.classList.remove("hidden"),p.classList.add("flex"),setTimeout(()=>{v==null||v.classList.remove("scale-95","opacity-0"),v==null||v.classList.add("scale-100","opacity-100")},10);const g=document.getElementById("compare-share-btn"),x=document.getElementById("compare-share-menu"),E=document.getElementById("compare-share-text-btn");g&&x&&(g.onclick=y=>{y.stopPropagation(),x.classList.toggle("hidden")},document.addEventListener("click",function y(C){C.target.closest("#compare-share-menu-wrapper")||(x.classList.add("hidden"),document.removeEventListener("click",y))})),E&&(E.onclick=()=>{x==null||x.classList.add("hidden"),tr(d,m)})}function tt(){const a=document.getElementById("compare-modal"),l=document.getElementById("compare-panel");l==null||l.classList.remove("scale-100","opacity-100"),l==null||l.classList.add("scale-95","opacity-0"),setTimeout(()=>{a==null||a.classList.add("hidden"),a==null||a.classList.remove("flex")},300)}async function Kt(a){const l=document.createElement("canvas");l.width=800,l.height=500;const d=l.getContext("2d"),m=d.createLinearGradient(0,0,0,l.height);m.addColorStop(0,"#9B2247"),m.addColorStop(1,"#6b1532"),d.fillStyle=m,d.fillRect(0,0,l.width,l.height),d.beginPath(),d.arc(l.width-60,60,120,0,Math.PI*2),d.fillStyle="rgba(255,255,255,0.06)",d.fill(),d.fillStyle="rgba(255,255,255,0.15)",d.beginPath(),d.roundRect(40,40,20+d.measureText(a.ley_origen).width+16,28,14),d.fill(),d.fillStyle="#fff",d.font="bold 13px system-ui, sans-serif",d.fillText(a.ley_origen,56,59),d.fillStyle="#fff",d.font="bold 28px system-ui, sans-serif";const p=xt(d,a.articulo_label,l.width-80);p.forEach((y,C)=>d.fillText(y,40,110+C*38));const w=110+p.length*38+16;d.strokeStyle="rgba(255,255,255,0.3)",d.lineWidth=1,d.beginPath(),d.moveTo(40,w),d.lineTo(l.width-40,w),d.stroke();const v=w+24,h=l.height-v-60;d.fillStyle="rgba(255,255,255,0.88)",d.font="16px Georgia, serif";const g=a.texto.replace(/\s+/g," ").trim().substring(0,500),x=xt(d,g,l.width-80);let E=0;for(const y of x){if(E*24>h){d.fillStyle="rgba(255,255,255,0.5)",d.font="13px system-ui, sans-serif",d.fillText("...",40,v+E*24);break}d.fillText(y,40,v+E*24),E++}return d.fillStyle="rgba(255,255,255,0.35)",d.fillRect(0,l.height-44,l.width,44),d.fillStyle="rgba(255,255,255,0.8)",d.font="12px system-ui, sans-serif",d.fillText("Buscador de Leyes Energéticas · SENER",40,l.height-16),l.toDataURL("image/png")}function xt(a,l,d,m){const p=l.split(" "),w=[];let v="";for(const h of p){const g=v?v+" "+h:h;a.measureText(g).width>d&&v?(w.push(v),v=h):v=g}return v&&w.push(v),w}function Zt(a){const l=`📋 *${a.articulo_label}*
🏛️ ${a.ley_origen}

${a.texto.substring(0,800)}${a.texto.length>800?"...":""}`,d=`https://wa.me/?text=${encodeURIComponent(l)}`;window.open(d,"_blank")}async function er(a){const l=await Kt(a),d=await(await fetch(l)).blob(),m=new File([d],"articulo.png",{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[m]}))await navigator.share({title:a.articulo_label,text:`${a.articulo_label} · ${a.ley_origen}`,files:[m]});else{const p=document.createElement("a");p.href=l,p.download=`${a.articulo_label.replace(/\s+/g,"_")}.png`,p.click()}}function tr(a,l){const d=`⚖️ *Comparación de Artículos*

📋 *${a.articulo_label}* – ${a.ley_origen}
${a.texto.substring(0,400)}${a.texto.length>400?"...":""}

📋 *${l.articulo_label}* – ${l.ley_origen}
${l.texto.substring(0,400)}${l.texto.length>400?"...":""}`,m=`https://wa.me/?text=${encodeURIComponent(d)}`;window.open(m,"_blank")}function rt(a,l){const d=`${location.origin}${location.pathname}#art-${encodeURIComponent(a.id)}`,m=`${a.articulo_label} · ${a.ley_origen}`,p=`📋 *${a.articulo_label}*
🏛️ ${a.ley_origen}

${a.texto.substring(0,500)}${a.texto.length>500?"...":""}

${d}`,w=`${a.articulo_label} · ${a.ley_origen} — Marco Legal Energético SENER`,v={telegram:`https://t.me/share/url?url=${encodeURIComponent(d)}&text=${encodeURIComponent(m)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(w)}&url=${encodeURIComponent(d)}`,email:`mailto:?subject=${encodeURIComponent(m)}&body=${encodeURIComponent(p)}`};v[l]&&window.open(v[l],"_blank")}function Ue(a,l){const d=`${location.origin}${location.pathname}#ley-${encodeURIComponent(a.id)}`,m=a.titulo,p=a.resumen?a.resumen.split(`

`)[0].substring(0,400):`${a.articulos} artículos`,w=`🏛️ *${a.titulo}*
📅 Publicado: ${a.fecha}
📖 ${a.articulos} artículos

${p}

${d}`,v=`${a.titulo} — Marco Legal Energético SENER`,h={whatsapp:`https://wa.me/?text=${encodeURIComponent(w)}`,telegram:`https://t.me/share/url?url=${encodeURIComponent(d)}&text=${encodeURIComponent(m)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(v)}&url=${encodeURIComponent(d)}`,email:`mailto:?subject=${encodeURIComponent(m)}&body=${encodeURIComponent(w)}`};h[l]&&window.open(h[l],"_blank")}function yt(){var h,g;$(null),ye(),je(),r.classList.add("hidden"),n.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),(h=document.getElementById("analisis-container"))==null||h.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),f.classList.remove("hidden"),setTimeout(()=>f.classList.remove("opacity-0"),50);const a=document.getElementById("search-filters");if(a&&a.remove(),U.length===0){f.innerHTML='<div class="text-center py-16 text-gray-400">Cargando datos...</div>';return}const l=U.reduce((x,E)=>x+E.articulos,0),d=U.filter(x=>x.titulo.toLowerCase().startsWith("ley")),m=U.filter(x=>x.titulo.toLowerCase().startsWith("reglamento")),p=U.filter(x=>!x.titulo.toLowerCase().startsWith("ley")&&!x.titulo.toLowerCase().startsWith("reglamento")),w=[...U].sort((x,E)=>E.articulos-x.articulos),v=((g=w[0])==null?void 0:g.articulos)||1;f.innerHTML=`
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
                    <span class="text-3xl font-head font-bold text-emerald-700 block">${d.length}</span>
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
                    ${w.map(x=>{const E=x.titulo.toLowerCase().startsWith("ley"),y=x.titulo.toLowerCase().startsWith("reglamento"),C=E?"#9B2247":y?"#1E5B4F":"#A57F2C",B=Math.round(x.articulos/v*100);return`
                        <div class="flex items-center gap-3 cursor-pointer group stat-law-row" data-titulo="${x.titulo.replace(/"/g,"&quot;")}">
                            <div class="text-xs text-gray-500 w-44 truncate flex-shrink-0 group-hover:text-guinda transition-colors" title="${x.titulo}">${x.titulo}</div>
                            <div class="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500" style="width:${B}%; background:${C};"></div>
                            </div>
                            <span class="text-xs font-bold text-gray-500 w-8 text-right flex-shrink-0">${x.articulos}</span>
                        </div>`}).join("")}
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                ${[{label:"Leyes Federales",items:d,textClass:"text-guinda",bgClass:"bg-guinda/5"},{label:"Reglamentos",items:m,textClass:"text-emerald-700",bgClass:"bg-emerald-50"},{label:"Acuerdos y Otros",items:p,textClass:"text-amber-700",bgClass:"bg-amber-50"}].map(x=>`
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
        `,document.querySelectorAll(".stat-law-row").forEach(x=>{x.addEventListener("click",()=>{const E=U.find(y=>y.titulo===x.dataset.titulo);E&&Me(E)})})}function Ae(){var g,x,E;if(!f)return;let a=O;if(W.type!=="all"&&(a=a.filter(y=>W.type==="ley"?y.ley_origen.toLowerCase().includes("ley"):W.type==="reglamento"?y.ley_origen.toLowerCase().includes("reglamento"):!y.ley_origen.toLowerCase().includes("ley")&&!y.ley_origen.toLowerCase().includes("reglamento"))),W.law!=="all"&&(a=a.filter(y=>y.ley_origen===W.law)),W.artNum){const y=parseInt(W.artNum);a=a.filter(C=>{const B=C.articulo_label.match(/\d+/);return B&&parseInt(B[0])===y})}const l=a,d=_,m=document.getElementById("search-filters");if(m&&m.remove(),O.length>0){const y=document.createElement("div");y.id="search-filters",y.className="flex flex-col items-center gap-2 mb-6 animate-fade-in-up";const C=[...new Set(O.map(G=>G.ley_origen))].sort();y.innerHTML=`
                <div class="flex flex-wrap justify-center gap-2">
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${W.type==="all"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="all">Todos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${W.type==="ley"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="ley">Leyes</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${W.type==="reglamento"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="reglamento">Reglamentos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${W.type==="otros"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="otros">Otros</button>
                </div>
                <div class="flex items-center gap-2 flex-wrap justify-center">
                    ${C.length>1?`
                    <select id="law-filter-select" class="text-xs border rounded-full px-4 py-1.5 focus:outline-none bg-white cursor-pointer transition-colors ${W.law!=="all"?"border-guinda text-guinda":"border-gray-200 text-gray-500 hover:border-guinda"}">
                        <option value="all">Todas las leyes</option>
                        ${C.map(G=>`<option value="${G}" ${W.law===G?"selected":""}>${G}</option>`).join("")}
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
                        ${y?"Sin resultados con los filtros actuales":`Sin resultados para "<span class="text-guinda">${d}</span>"`}
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
                </div>`,f.querySelectorAll(".empty-suggestion").forEach(B=>{B.addEventListener("click",()=>{u&&(u.value=B.textContent,u.dispatchEvent(new Event("input")))})}),(x=document.getElementById("empty-browse-laws"))==null||x.addEventListener("click",()=>Pe());const C=document.getElementById("results-container").nextElementSibling;C&&C.classList.contains("pagination-nav")&&C.remove();return}const p=(H-1)*fe,w=p+fe,v=l.slice(p,w),h=((E=l[0])==null?void 0:E.score)||1;ke=l,f.innerHTML=v.map(y=>{const C=He(y.texto.substring(0,300)+"...",d),B=He(y.articulo_label,d),V=Ut(y.score,h),G=Oe(y.id)?'<svg class="w-4 h-4 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';return`
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer result-item" data-id="${y.id}">
                <button class="bookmark-card-btn absolute top-3 right-3 p-1.5 text-gray-300 hover:text-guinda transition-colors rounded-full hover:bg-guinda/5 z-10" data-id="${y.id}" title="Guardar en favoritos">${G}</button>
                <div class="flex items-center gap-2 mb-2 flex-wrap pr-8">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${y.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 font-medium tracking-wide truncate max-w-[200px]">${y.titulo_nombre||""}</span>
                    <span class="ml-auto">${V}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${B}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${C}</p>
            </div>
            `}).join(""),X(l.length,"results-container",Ae),document.querySelectorAll(".result-item").forEach(y=>{y.addEventListener("click",C=>{C.target.closest(".bookmark-card-btn")||ge(y.dataset.id)})}),document.querySelectorAll(".bookmark-card-btn").forEach(y=>{y.addEventListener("click",C=>{C.stopPropagation(),Ze(y.dataset.id),Ae()})})}function ge(a){const l=Te(a);if(!l)return;L.textContent=l.ley_origen,k.textContent=l.articulo_label,L.onclick=()=>{const D=U.find(se=>se.titulo===l.ley_origen);D&&(We(),setTimeout(()=>Me(D),310))};let d=l.texto.replace(/\r\n/g,`
`).replace(/\n\s*\n/g,`

`).replace(/([a-z,;])\n([a-z])/g,"$1 $2");const m=D=>_?He(D,_):D,p=D=>D&&D!=="null"&&D!=="undefined"&&D.trim()?D.trim():null,w=p(l.titulo_nombre),v=p(l.capitulo_nombre),h=[w,v].filter(Boolean);b.innerHTML=`
            ${h.length?`
            <div class="mb-5 pb-5 border-b border-gray-50">
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-guinda/60 uppercase tracking-[0.2em] mb-2">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                    Ubicación en el documento
                </div>
                <div class="flex flex-wrap gap-x-2 gap-y-1">
                    ${h.map((D,se)=>`
                        <span class="text-xs text-gray-600 font-medium">${D}</span>
                        ${se<h.length-1?'<span class="text-gray-200">›</span>':""}
                    `).join("")}
                </div>
            </div>`:""}
            ${_?`
            <div class="mb-5 flex items-center gap-2 text-[11px] text-guinda/70 bg-guinda/5 border border-guinda/10 px-3 py-2 rounded-lg">
                <svg class="w-3 h-3 flex-shrink-0 text-guinda/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span class="font-medium">Búsqueda:</span> <mark class="hl">${_}</mark>
            </div>`:""}
            <div class="text-gray-800 leading-[1.85] text-[0.92rem]" style="font-family:'Merriweather',serif; text-align:justify; hyphens:auto;">
                ${d.split(`

`).map(D=>`<p class="mb-4">${m(D)}</p>`).join("")}
            </div>
        `;const g=ke.findIndex(D=>D.id===a),x=ke.length,E=document.getElementById("modal-prev-btn"),y=document.getElementById("modal-next-btn"),C=document.getElementById("modal-nav-counter");E&&(E.disabled=g<=0,E.onclick=()=>{g>0&&ge(ke[g-1].id)}),y&&(y.disabled=g<0||g>=x-1,y.onclick=()=>{g<x-1&&ge(ke[g+1].id)}),C&&(C.textContent=g>=0?`${g+1}/${x}`:"");const B=document.getElementById("modal-bookmark-btn");if(B){const D=Oe(a);B.innerHTML=D?'<svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>',B.onclick=()=>{Ze(a),ge(a)}}const V=document.getElementById("copy-btn");V&&(V.onclick=()=>{navigator.clipboard.writeText(b.innerText).then(()=>{Z("¡Texto copiado!","📋")})});const G=document.getElementById("share-btn"),ee=document.getElementById("share-menu");document.getElementById("share-text-btn"),document.getElementById("share-image-btn"),G&&ee&&(G.onclick=D=>{D.stopPropagation(),ee.classList.toggle("hidden")},document.addEventListener("click",function D(se){se.target.closest("#share-menu-wrapper")||(ee.classList.add("hidden"),document.removeEventListener("click",D))}));const Se=Ne(a);b.innerHTML+=`
            <div class="mt-8 pt-6 border-t border-gray-100" id="notes-section">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Mis notas
                    </span>
                    <button id="delete-note-btn" class="text-[10px] text-red-300 hover:text-red-500 transition-colors ${Se?"":"hidden"}" aria-label="Borrar nota">Borrar</button>
                </div>
                <textarea id="article-note-input"
                    placeholder="Escribe tus anotaciones sobre este artículo..."
                    class="w-full text-xs text-gray-700 border border-amber-100 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all bg-amber-50/40 leading-relaxed font-light"
                    rows="3" aria-label="Notas del artículo">${Se}</textarea>
                <div class="flex items-center justify-between mt-2">
                    <span id="note-saved-indicator" class="text-[10px] text-amber-500 flex items-center gap-1 ${Se?"":"invisible"}">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        Guardada
                    </span>
                    <button id="save-note-btn" class="text-xs font-semibold text-guinda hover:text-guinda/70 transition-colors px-3 py-1.5 bg-guinda/5 rounded-lg hover:bg-guinda/10" aria-label="Guardar nota">Guardar</button>
                </div>
            </div>
        `;const he=document.getElementById("article-note-input"),$e=document.getElementById("save-note-btn"),_e=document.getElementById("delete-note-btn"),be=document.getElementById("note-saved-indicator");$e&&he&&$e.addEventListener("click",()=>{ht(a,he.value),Z("¡Nota guardada!","📝","bg-amber-600"),be==null||be.classList.remove("invisible"),_e&&_e.classList.toggle("hidden",!he.value.trim())}),_e&&he&&_e.addEventListener("click",()=>{ht(a,""),he.value="",be==null||be.classList.add("invisible"),_e.classList.add("hidden"),Z("Nota eliminada","🗑️","bg-gray-600")});const De=document.getElementById("cite-btn");De&&(De.onclick=()=>{const D=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),se=`${location.origin}${location.pathname}#art-${encodeURIComponent(a)}`,le=`${l.articulo_label} de la ${l.ley_origen}${l.fecha_publicacion?", publicada el "+l.fecha_publicacion:""}. Secretaría de Energía, Gobierno de México. Consultado el ${D}. Disponible en: ${se}`;(navigator.clipboard&&typeof navigator.clipboard.writeText=="function"?navigator.clipboard.writeText(le):Promise.reject(new Error("Clipboard API not available"))).then(()=>Z("¡Cita copiada!","📖","bg-guinda")).catch(()=>{var at,ot;const Qe=document.getElementById("citation-popover");if(Qe){Qe.remove();return}const re=document.createElement("div");re.id="citation-popover",re.className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4",re.innerHTML=`
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
                            </div>`,document.body.appendChild(re),setTimeout(()=>{const ve=document.getElementById("citation-text-area");ve&&(ve.focus(),ve.select())},100),(at=document.getElementById("citation-copy-btn"))==null||at.addEventListener("click",()=>{const ve=document.getElementById("citation-text-area");if(ve){ve.select();try{document.execCommand("copy")}catch{}navigator.clipboard&&navigator.clipboard.writeText(le).catch(()=>{}),Z("¡Cita copiada!","📖","bg-guinda"),re.remove()}}),(ot=document.getElementById("citation-popover-close"))==null||ot.addEventListener("click",()=>re.remove()),re.addEventListener("click",ve=>{ve.target===re&&re.remove()})})}),Object.entries({"share-text-btn":()=>Zt(l),"share-image-btn":()=>er(l),"share-telegram-btn":()=>rt(l,"telegram"),"share-twitter-btn":()=>rt(l,"twitter"),"share-email-btn":()=>rt(l,"email")}).forEach(([D,se])=>{const le=document.getElementById(D);le&&(le.onclick=()=>{ee==null||ee.classList.add("hidden"),se()})}),$(`#art-${encodeURIComponent(a)}`),i.classList.remove("hidden"),i.classList.add("flex");const Be=document.getElementById("share-link-btn");Be&&(Be.onclick=()=>{ee==null||ee.classList.add("hidden");const D=`${location.origin}${location.pathname}#art-${encodeURIComponent(a)}`;navigator.clipboard.writeText(D).then(()=>Z("¡Enlace copiado!","🔗","bg-blue-600"))}),setTimeout(()=>{c.classList.remove("scale-95","opacity-0"),c.classList.add("scale-100","opacity-100")},10)}function We(){$(null),c.classList.remove("scale-100","opacity-100"),c.classList.add("scale-95","opacity-0"),setTimeout(()=>{i.classList.add("hidden"),i.classList.remove("flex")},300)}function wt(){var l;let a=document.getElementById("keyboard-help-modal");if(a){a.remove();return}a=document.createElement("div"),a.id="keyboard-help-modal",a.className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",a.innerHTML=`
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
                <div class="flex items-center justify-between mb-5">
                    <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        Atajos de Teclado
                    </h3>
                    <button id="kbd-help-close" class="text-gray-400 hover:text-guinda transition-colors text-lg leading-none">×</button>
                </div>
                <div class="space-y-2.5 text-xs">
                    ${[["/","Enfocar el buscador"],["Esc","Cerrar modal / panel"],["← →","Artículo anterior / siguiente"],["?","Mostrar esta ayuda"],["f","Agregar/quitar de favoritos"],["c","Copiar texto del artículo"]].map(([d,m])=>`
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500">${m}</span>
                            <kbd class="bg-gray-100 border border-gray-200 rounded px-2 py-0.5 font-mono text-[11px] text-gray-700 shadow-sm">${d}</kbd>
                        </div>
                    `).join("")}
                </div>
                <div class="mt-5 pt-4 border-t border-gray-50 text-[10px] text-gray-400 text-center">
                    Presiona <kbd class="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px]">?</kbd> para abrir esta ayuda
                </div>
            </div>
        `,document.body.appendChild(a),a.addEventListener("click",d=>{d.target===a&&a.remove()}),(l=document.getElementById("kbd-help-close"))==null||l.addEventListener("click",()=>a.remove())}function kt(){$(null),ye(),pt(),r.classList.add("hidden"),n.classList.add("hidden"),e.classList.add("hidden"),f.classList.add("hidden","opacity-0"),f.innerHTML="",t&&t.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8");const a=document.getElementById("analisis-container");a&&(a.classList.remove("hidden"),setTimeout(()=>a.classList.remove("opacity-0"),50),a.children.length===0&&Sr(a))}($t=document.getElementById("keyboard-help-btn"))==null||$t.addEventListener("click",wt),document.addEventListener("keydown",a=>{var p,w,v,h;const l=a.target.tagName,d=l==="INPUT"||l==="TEXTAREA"||l==="SELECT"||a.target.isContentEditable,m=!i.classList.contains("hidden");if(a.key==="?"&&!d){a.preventDefault(),wt();return}if(a.key==="Escape"){const g=document.getElementById("keyboard-help-modal");if(g){g.remove();return}const x=document.getElementById("toc-panel");if(x&&!x.classList.contains("translate-y-full")){x.classList.add("translate-y-full"),document.body.style.overflow="";return}if(m){We();return}const E=document.getElementById("compare-modal");if(E&&!E.classList.contains("hidden")){tt();return}return}if(a.key==="/"&&!d){a.preventDefault(),u&&(u.focus(),u.select());return}if(m&&!d){if(a.key==="ArrowRight"||a.key==="ArrowDown"){a.preventDefault(),(p=document.getElementById("modal-next-btn"))==null||p.click();return}if(a.key==="ArrowLeft"||a.key==="ArrowUp"){a.preventDefault(),(w=document.getElementById("modal-prev-btn"))==null||w.click();return}if(a.key==="f"||a.key==="F"){a.preventDefault(),(v=document.getElementById("modal-bookmark-btn"))==null||v.click();return}if((a.key==="c"||a.key==="C")&&!a.ctrlKey&&!a.metaKey){a.preventDefault(),(h=document.getElementById("copy-btn"))==null||h.click();return}}}),"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})}),A&&A.addEventListener("click",We),i==null||i.addEventListener("click",a=>{a.target===i&&We()}),M&&M.addEventListener("click",()=>{const a=b.innerText;navigator.clipboard.writeText(a).then(()=>{const l=M.innerHTML;M.innerHTML='<span class="text-verde font-bold">¡Copiado!</span>',setTimeout(()=>{M.innerHTML=l},2e3)})})}document.addEventListener("DOMContentLoaded",()=>{$r(),ur()});"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js?v=1774055867126").then(u=>{console.log("[SW] Registrado:",u.scope),u.update()}).catch(u=>console.warn("[SW] Registro fallido:",u))});
