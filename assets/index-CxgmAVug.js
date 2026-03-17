(function(){const S=document.createElement("link").relList;if(S&&S.supports&&S.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))e(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&e(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function e(r){if(r.ep)return;r.ep=!0;const o=t(r);fetch(r.href,o)}})();function It(C){return C&&C.__esModule&&Object.prototype.hasOwnProperty.call(C,"default")?C.default:C}var ft={exports:{}};/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.9
 * Copyright (C) 2020 Oliver Nightingale
 * @license MIT
 */(function(C,S){(function(){var t=function(e){var r=new t.Builder;return r.pipeline.add(t.trimmer,t.stopWordFilter,t.stemmer),r.searchPipeline.add(t.stemmer),e.call(r,r),r.build()};t.version="2.3.9";/*!
 * lunr.utils
 * Copyright (C) 2020 Oliver Nightingale
 */t.utils={},t.utils.warn=function(e){return function(r){e.console&&console.warn&&console.warn(r)}}(this),t.utils.asString=function(e){return e==null?"":e.toString()},t.utils.clone=function(e){if(e==null)return e;for(var r=Object.create(null),o=Object.keys(e),a=0;a<o.length;a++){var i=o[a],u=e[i];if(Array.isArray(u)){r[i]=u.slice();continue}if(typeof u=="string"||typeof u=="number"||typeof u=="boolean"){r[i]=u;continue}throw new TypeError("clone is not deep and does not support nested objects")}return r},t.FieldRef=function(e,r,o){this.docRef=e,this.fieldName=r,this._stringValue=o},t.FieldRef.joiner="/",t.FieldRef.fromString=function(e){var r=e.indexOf(t.FieldRef.joiner);if(r===-1)throw"malformed field ref string";var o=e.slice(0,r),a=e.slice(r+1);return new t.FieldRef(a,o,e)},t.FieldRef.prototype.toString=function(){return this._stringValue==null&&(this._stringValue=this.fieldName+t.FieldRef.joiner+this.docRef),this._stringValue};/*!
 * lunr.Set
 * Copyright (C) 2020 Oliver Nightingale
 */t.Set=function(e){if(this.elements=Object.create(null),e){this.length=e.length;for(var r=0;r<this.length;r++)this.elements[e[r]]=!0}else this.length=0},t.Set.complete={intersect:function(e){return e},union:function(){return this},contains:function(){return!0}},t.Set.empty={intersect:function(){return this},union:function(e){return e},contains:function(){return!1}},t.Set.prototype.contains=function(e){return!!this.elements[e]},t.Set.prototype.intersect=function(e){var r,o,a,i=[];if(e===t.Set.complete)return this;if(e===t.Set.empty)return e;this.length<e.length?(r=this,o=e):(r=e,o=this),a=Object.keys(r.elements);for(var u=0;u<a.length;u++){var f=a[u];f in o.elements&&i.push(f)}return new t.Set(i)},t.Set.prototype.union=function(e){return e===t.Set.complete?t.Set.complete:e===t.Set.empty?this:new t.Set(Object.keys(this.elements).concat(Object.keys(e.elements)))},t.idf=function(e,r){var o=0;for(var a in e)a!="_index"&&(o+=Object.keys(e[a]).length);var i=(r-o+.5)/(o+.5);return Math.log(1+Math.abs(i))},t.Token=function(e,r){this.str=e||"",this.metadata=r||{}},t.Token.prototype.toString=function(){return this.str},t.Token.prototype.update=function(e){return this.str=e(this.str,this.metadata),this},t.Token.prototype.clone=function(e){return e=e||function(r){return r},new t.Token(e(this.str,this.metadata),this.metadata)};/*!
 * lunr.tokenizer
 * Copyright (C) 2020 Oliver Nightingale
 */t.tokenizer=function(e,r){if(e==null||e==null)return[];if(Array.isArray(e))return e.map(function(j){return new t.Token(t.utils.asString(j).toLowerCase(),t.utils.clone(r))});for(var o=e.toString().toLowerCase(),a=o.length,i=[],u=0,f=0;u<=a;u++){var L=o.charAt(u),k=u-f;if(L.match(t.tokenizer.separator)||u==a){if(k>0){var I=t.utils.clone(r)||{};I.position=[f,k],I.index=i.length,i.push(new t.Token(o.slice(f,u),I))}f=u+1}}return i},t.tokenizer.separator=/[\s\-]+/;/*!
 * lunr.Pipeline
 * Copyright (C) 2020 Oliver Nightingale
 */t.Pipeline=function(){this._stack=[]},t.Pipeline.registeredFunctions=Object.create(null),t.Pipeline.registerFunction=function(e,r){r in this.registeredFunctions&&t.utils.warn("Overwriting existing registered function: "+r),e.label=r,t.Pipeline.registeredFunctions[e.label]=e},t.Pipeline.warnIfFunctionNotRegistered=function(e){var r=e.label&&e.label in this.registeredFunctions;r||t.utils.warn(`Function is not registered with pipeline. This may cause problems when serialising the index.
`,e)},t.Pipeline.load=function(e){var r=new t.Pipeline;return e.forEach(function(o){var a=t.Pipeline.registeredFunctions[o];if(a)r.add(a);else throw new Error("Cannot load unregistered function: "+o)}),r},t.Pipeline.prototype.add=function(){var e=Array.prototype.slice.call(arguments);e.forEach(function(r){t.Pipeline.warnIfFunctionNotRegistered(r),this._stack.push(r)},this)},t.Pipeline.prototype.after=function(e,r){t.Pipeline.warnIfFunctionNotRegistered(r);var o=this._stack.indexOf(e);if(o==-1)throw new Error("Cannot find existingFn");o=o+1,this._stack.splice(o,0,r)},t.Pipeline.prototype.before=function(e,r){t.Pipeline.warnIfFunctionNotRegistered(r);var o=this._stack.indexOf(e);if(o==-1)throw new Error("Cannot find existingFn");this._stack.splice(o,0,r)},t.Pipeline.prototype.remove=function(e){var r=this._stack.indexOf(e);r!=-1&&this._stack.splice(r,1)},t.Pipeline.prototype.run=function(e){for(var r=this._stack.length,o=0;o<r;o++){for(var a=this._stack[o],i=[],u=0;u<e.length;u++){var f=a(e[u],u,e);if(!(f==null||f===""))if(Array.isArray(f))for(var L=0;L<f.length;L++)i.push(f[L]);else i.push(f)}e=i}return e},t.Pipeline.prototype.runString=function(e,r){var o=new t.Token(e,r);return this.run([o]).map(function(a){return a.toString()})},t.Pipeline.prototype.reset=function(){this._stack=[]},t.Pipeline.prototype.toJSON=function(){return this._stack.map(function(e){return t.Pipeline.warnIfFunctionNotRegistered(e),e.label})};/*!
 * lunr.Vector
 * Copyright (C) 2020 Oliver Nightingale
 */t.Vector=function(e){this._magnitude=0,this.elements=e||[]},t.Vector.prototype.positionForIndex=function(e){if(this.elements.length==0)return 0;for(var r=0,o=this.elements.length/2,a=o-r,i=Math.floor(a/2),u=this.elements[i*2];a>1&&(u<e&&(r=i),u>e&&(o=i),u!=e);)a=o-r,i=r+Math.floor(a/2),u=this.elements[i*2];if(u==e||u>e)return i*2;if(u<e)return(i+1)*2},t.Vector.prototype.insert=function(e,r){this.upsert(e,r,function(){throw"duplicate index"})},t.Vector.prototype.upsert=function(e,r,o){this._magnitude=0;var a=this.positionForIndex(e);this.elements[a]==e?this.elements[a+1]=o(this.elements[a+1],r):this.elements.splice(a,0,e,r)},t.Vector.prototype.magnitude=function(){if(this._magnitude)return this._magnitude;for(var e=0,r=this.elements.length,o=1;o<r;o+=2){var a=this.elements[o];e+=a*a}return this._magnitude=Math.sqrt(e)},t.Vector.prototype.dot=function(e){for(var r=0,o=this.elements,a=e.elements,i=o.length,u=a.length,f=0,L=0,k=0,I=0;k<i&&I<u;)f=o[k],L=a[I],f<L?k+=2:f>L?I+=2:f==L&&(r+=o[k+1]*a[I+1],k+=2,I+=2);return r},t.Vector.prototype.similarity=function(e){return this.dot(e)/this.magnitude()||0},t.Vector.prototype.toArray=function(){for(var e=new Array(this.elements.length/2),r=1,o=0;r<this.elements.length;r+=2,o++)e[o]=this.elements[r];return e},t.Vector.prototype.toJSON=function(){return this.elements};/*!
 * lunr.stemmer
 * Copyright (C) 2020 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */t.stemmer=function(){var e={ational:"ate",tional:"tion",enci:"ence",anci:"ance",izer:"ize",bli:"ble",alli:"al",entli:"ent",eli:"e",ousli:"ous",ization:"ize",ation:"ate",ator:"ate",alism:"al",iveness:"ive",fulness:"ful",ousness:"ous",aliti:"al",iviti:"ive",biliti:"ble",logi:"log"},r={icate:"ic",ative:"",alize:"al",iciti:"ic",ical:"ic",ful:"",ness:""},o="[^aeiou]",a="[aeiouy]",i=o+"[^aeiouy]*",u=a+"[aeiou]*",f="^("+i+")?"+u+i,L="^("+i+")?"+u+i+"("+u+")?$",k="^("+i+")?"+u+i+u+i,I="^("+i+")?"+a,j=new RegExp(f),_=new RegExp(k),q=new RegExp(L),F=new RegExp(I),H=/^(.+?)(ss|i)es$/,B=/^(.+?)([^s])s$/,M=/^(.+?)eed$/,J=/^(.+?)(ed|ing)$/,U=/.$/,te=/(at|bl|iz)$/,le=new RegExp("([^aeiouylsz])\\1$"),de=new RegExp("^"+i+a+"[^aeiouwxy]$"),ce=/^(.+?[^aeiou])y$/,re=/^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/,z=/^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/,D=/^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/,xe=/^(.+?)(s|t)(ion)$/,ae=/^(.+?)e$/,be=/ll$/,ve=new RegExp("^"+i+a+"[^aeiouwxy]$"),Z=function(b){var R,K,G,y,O,ue,ne;if(b.length<3)return b;if(G=b.substr(0,1),G=="y"&&(b=G.toUpperCase()+b.substr(1)),y=H,O=B,y.test(b)?b=b.replace(y,"$1$2"):O.test(b)&&(b=b.replace(O,"$1$2")),y=M,O=J,y.test(b)){var N=y.exec(b);y=j,y.test(N[1])&&(y=U,b=b.replace(y,""))}else if(O.test(b)){var N=O.exec(b);R=N[1],O=F,O.test(R)&&(b=R,O=te,ue=le,ne=de,O.test(b)?b=b+"e":ue.test(b)?(y=U,b=b.replace(y,"")):ne.test(b)&&(b=b+"e"))}if(y=ce,y.test(b)){var N=y.exec(b);R=N[1],b=R+"i"}if(y=re,y.test(b)){var N=y.exec(b);R=N[1],K=N[2],y=j,y.test(R)&&(b=R+e[K])}if(y=z,y.test(b)){var N=y.exec(b);R=N[1],K=N[2],y=j,y.test(R)&&(b=R+r[K])}if(y=D,O=xe,y.test(b)){var N=y.exec(b);R=N[1],y=_,y.test(R)&&(b=R)}else if(O.test(b)){var N=O.exec(b);R=N[1]+N[2],O=_,O.test(R)&&(b=R)}if(y=ae,y.test(b)){var N=y.exec(b);R=N[1],y=_,O=q,ue=ve,(y.test(R)||O.test(R)&&!ue.test(R))&&(b=R)}return y=be,O=_,y.test(b)&&O.test(b)&&(y=U,b=b.replace(y,"")),G=="y"&&(b=G.toLowerCase()+b.substr(1)),b};return function(pe){return pe.update(Z)}}(),t.Pipeline.registerFunction(t.stemmer,"stemmer");/*!
 * lunr.stopWordFilter
 * Copyright (C) 2020 Oliver Nightingale
 */t.generateStopWordFilter=function(e){var r=e.reduce(function(o,a){return o[a]=a,o},{});return function(o){if(o&&r[o.toString()]!==o.toString())return o}},t.stopWordFilter=t.generateStopWordFilter(["a","able","about","across","after","all","almost","also","am","among","an","and","any","are","as","at","be","because","been","but","by","can","cannot","could","dear","did","do","does","either","else","ever","every","for","from","get","got","had","has","have","he","her","hers","him","his","how","however","i","if","in","into","is","it","its","just","least","let","like","likely","may","me","might","most","must","my","neither","no","nor","not","of","off","often","on","only","or","other","our","own","rather","said","say","says","she","should","since","so","some","than","that","the","their","them","then","there","these","they","this","tis","to","too","twas","us","wants","was","we","were","what","when","where","which","while","who","whom","why","will","with","would","yet","you","your"]),t.Pipeline.registerFunction(t.stopWordFilter,"stopWordFilter");/*!
 * lunr.trimmer
 * Copyright (C) 2020 Oliver Nightingale
 */t.trimmer=function(e){return e.update(function(r){return r.replace(/^\W+/,"").replace(/\W+$/,"")})},t.Pipeline.registerFunction(t.trimmer,"trimmer");/*!
 * lunr.TokenSet
 * Copyright (C) 2020 Oliver Nightingale
 */t.TokenSet=function(){this.final=!1,this.edges={},this.id=t.TokenSet._nextId,t.TokenSet._nextId+=1},t.TokenSet._nextId=1,t.TokenSet.fromArray=function(e){for(var r=new t.TokenSet.Builder,o=0,a=e.length;o<a;o++)r.insert(e[o]);return r.finish(),r.root},t.TokenSet.fromClause=function(e){return"editDistance"in e?t.TokenSet.fromFuzzyString(e.term,e.editDistance):t.TokenSet.fromString(e.term)},t.TokenSet.fromFuzzyString=function(e,r){for(var o=new t.TokenSet,a=[{node:o,editsRemaining:r,str:e}];a.length;){var i=a.pop();if(i.str.length>0){var u=i.str.charAt(0),f;u in i.node.edges?f=i.node.edges[u]:(f=new t.TokenSet,i.node.edges[u]=f),i.str.length==1&&(f.final=!0),a.push({node:f,editsRemaining:i.editsRemaining,str:i.str.slice(1)})}if(i.editsRemaining!=0){if("*"in i.node.edges)var L=i.node.edges["*"];else{var L=new t.TokenSet;i.node.edges["*"]=L}if(i.str.length==0&&(L.final=!0),a.push({node:L,editsRemaining:i.editsRemaining-1,str:i.str}),i.str.length>1&&a.push({node:i.node,editsRemaining:i.editsRemaining-1,str:i.str.slice(1)}),i.str.length==1&&(i.node.final=!0),i.str.length>=1){if("*"in i.node.edges)var k=i.node.edges["*"];else{var k=new t.TokenSet;i.node.edges["*"]=k}i.str.length==1&&(k.final=!0),a.push({node:k,editsRemaining:i.editsRemaining-1,str:i.str.slice(1)})}if(i.str.length>1){var I=i.str.charAt(0),j=i.str.charAt(1),_;j in i.node.edges?_=i.node.edges[j]:(_=new t.TokenSet,i.node.edges[j]=_),i.str.length==1&&(_.final=!0),a.push({node:_,editsRemaining:i.editsRemaining-1,str:I+i.str.slice(2)})}}}return o},t.TokenSet.fromString=function(e){for(var r=new t.TokenSet,o=r,a=0,i=e.length;a<i;a++){var u=e[a],f=a==i-1;if(u=="*")r.edges[u]=r,r.final=f;else{var L=new t.TokenSet;L.final=f,r.edges[u]=L,r=L}}return o},t.TokenSet.prototype.toArray=function(){for(var e=[],r=[{prefix:"",node:this}];r.length;){var o=r.pop(),a=Object.keys(o.node.edges),i=a.length;o.node.final&&(o.prefix.charAt(0),e.push(o.prefix));for(var u=0;u<i;u++){var f=a[u];r.push({prefix:o.prefix.concat(f),node:o.node.edges[f]})}}return e},t.TokenSet.prototype.toString=function(){if(this._str)return this._str;for(var e=this.final?"1":"0",r=Object.keys(this.edges).sort(),o=r.length,a=0;a<o;a++){var i=r[a],u=this.edges[i];e=e+i+u.id}return e},t.TokenSet.prototype.intersect=function(e){for(var r=new t.TokenSet,o=void 0,a=[{qNode:e,output:r,node:this}];a.length;){o=a.pop();for(var i=Object.keys(o.qNode.edges),u=i.length,f=Object.keys(o.node.edges),L=f.length,k=0;k<u;k++)for(var I=i[k],j=0;j<L;j++){var _=f[j];if(_==I||I=="*"){var q=o.node.edges[_],F=o.qNode.edges[I],H=q.final&&F.final,B=void 0;_ in o.output.edges?(B=o.output.edges[_],B.final=B.final||H):(B=new t.TokenSet,B.final=H,o.output.edges[_]=B),a.push({qNode:F,output:B,node:q})}}}return r},t.TokenSet.Builder=function(){this.previousWord="",this.root=new t.TokenSet,this.uncheckedNodes=[],this.minimizedNodes={}},t.TokenSet.Builder.prototype.insert=function(e){var r,o=0;if(e<this.previousWord)throw new Error("Out of order word insertion");for(var a=0;a<e.length&&a<this.previousWord.length&&e[a]==this.previousWord[a];a++)o++;this.minimize(o),this.uncheckedNodes.length==0?r=this.root:r=this.uncheckedNodes[this.uncheckedNodes.length-1].child;for(var a=o;a<e.length;a++){var i=new t.TokenSet,u=e[a];r.edges[u]=i,this.uncheckedNodes.push({parent:r,char:u,child:i}),r=i}r.final=!0,this.previousWord=e},t.TokenSet.Builder.prototype.finish=function(){this.minimize(0)},t.TokenSet.Builder.prototype.minimize=function(e){for(var r=this.uncheckedNodes.length-1;r>=e;r--){var o=this.uncheckedNodes[r],a=o.child.toString();a in this.minimizedNodes?o.parent.edges[o.char]=this.minimizedNodes[a]:(o.child._str=a,this.minimizedNodes[a]=o.child),this.uncheckedNodes.pop()}};/*!
 * lunr.Index
 * Copyright (C) 2020 Oliver Nightingale
 */t.Index=function(e){this.invertedIndex=e.invertedIndex,this.fieldVectors=e.fieldVectors,this.tokenSet=e.tokenSet,this.fields=e.fields,this.pipeline=e.pipeline},t.Index.prototype.search=function(e){return this.query(function(r){var o=new t.QueryParser(e,r);o.parse()})},t.Index.prototype.query=function(e){for(var r=new t.Query(this.fields),o=Object.create(null),a=Object.create(null),i=Object.create(null),u=Object.create(null),f=Object.create(null),L=0;L<this.fields.length;L++)a[this.fields[L]]=new t.Vector;e.call(r,r);for(var L=0;L<r.clauses.length;L++){var k=r.clauses[L],I=null,j=t.Set.empty;k.usePipeline?I=this.pipeline.runString(k.term,{fields:k.fields}):I=[k.term];for(var _=0;_<I.length;_++){var q=I[_];k.term=q;var F=t.TokenSet.fromClause(k),H=this.tokenSet.intersect(F).toArray();if(H.length===0&&k.presence===t.Query.presence.REQUIRED){for(var B=0;B<k.fields.length;B++){var M=k.fields[B];u[M]=t.Set.empty}break}for(var J=0;J<H.length;J++)for(var U=H[J],te=this.invertedIndex[U],le=te._index,B=0;B<k.fields.length;B++){var M=k.fields[B],de=te[M],ce=Object.keys(de),re=U+"/"+M,z=new t.Set(ce);if(k.presence==t.Query.presence.REQUIRED&&(j=j.union(z),u[M]===void 0&&(u[M]=t.Set.complete)),k.presence==t.Query.presence.PROHIBITED){f[M]===void 0&&(f[M]=t.Set.empty),f[M]=f[M].union(z);continue}if(a[M].upsert(le,k.boost,function(je,ye){return je+ye}),!i[re]){for(var D=0;D<ce.length;D++){var xe=ce[D],ae=new t.FieldRef(xe,M),be=de[xe],ve;(ve=o[ae])===void 0?o[ae]=new t.MatchData(U,M,be):ve.add(U,M,be)}i[re]=!0}}}if(k.presence===t.Query.presence.REQUIRED)for(var B=0;B<k.fields.length;B++){var M=k.fields[B];u[M]=u[M].intersect(j)}}for(var Z=t.Set.complete,pe=t.Set.empty,L=0;L<this.fields.length;L++){var M=this.fields[L];u[M]&&(Z=Z.intersect(u[M])),f[M]&&(pe=pe.union(f[M]))}var b=Object.keys(o),R=[],K=Object.create(null);if(r.isNegated()){b=Object.keys(this.fieldVectors);for(var L=0;L<b.length;L++){var ae=b[L],G=t.FieldRef.fromString(ae);o[ae]=new t.MatchData}}for(var L=0;L<b.length;L++){var G=t.FieldRef.fromString(b[L]),y=G.docRef;if(Z.contains(y)&&!pe.contains(y)){var O=this.fieldVectors[G],ue=a[G.fieldName].similarity(O),ne;if((ne=K[y])!==void 0)ne.score+=ue,ne.matchData.combine(o[G]);else{var N={ref:y,score:ue,matchData:o[G]};K[y]=N,R.push(N)}}}return R.sort(function(ke,Ce){return Ce.score-ke.score})},t.Index.prototype.toJSON=function(){var e=Object.keys(this.invertedIndex).sort().map(function(o){return[o,this.invertedIndex[o]]},this),r=Object.keys(this.fieldVectors).map(function(o){return[o,this.fieldVectors[o].toJSON()]},this);return{version:t.version,fields:this.fields,fieldVectors:r,invertedIndex:e,pipeline:this.pipeline.toJSON()}},t.Index.load=function(e){var r={},o={},a=e.fieldVectors,i=Object.create(null),u=e.invertedIndex,f=new t.TokenSet.Builder,L=t.Pipeline.load(e.pipeline);e.version!=t.version&&t.utils.warn("Version mismatch when loading serialised index. Current version of lunr '"+t.version+"' does not match serialized index '"+e.version+"'");for(var k=0;k<a.length;k++){var I=a[k],j=I[0],_=I[1];o[j]=new t.Vector(_)}for(var k=0;k<u.length;k++){var I=u[k],q=I[0],F=I[1];f.insert(q),i[q]=F}return f.finish(),r.fields=e.fields,r.fieldVectors=o,r.invertedIndex=i,r.tokenSet=f.root,r.pipeline=L,new t.Index(r)};/*!
 * lunr.Builder
 * Copyright (C) 2020 Oliver Nightingale
 */t.Builder=function(){this._ref="id",this._fields=Object.create(null),this._documents=Object.create(null),this.invertedIndex=Object.create(null),this.fieldTermFrequencies={},this.fieldLengths={},this.tokenizer=t.tokenizer,this.pipeline=new t.Pipeline,this.searchPipeline=new t.Pipeline,this.documentCount=0,this._b=.75,this._k1=1.2,this.termIndex=0,this.metadataWhitelist=[]},t.Builder.prototype.ref=function(e){this._ref=e},t.Builder.prototype.field=function(e,r){if(/\//.test(e))throw new RangeError("Field '"+e+"' contains illegal character '/'");this._fields[e]=r||{}},t.Builder.prototype.b=function(e){e<0?this._b=0:e>1?this._b=1:this._b=e},t.Builder.prototype.k1=function(e){this._k1=e},t.Builder.prototype.add=function(e,r){var o=e[this._ref],a=Object.keys(this._fields);this._documents[o]=r||{},this.documentCount+=1;for(var i=0;i<a.length;i++){var u=a[i],f=this._fields[u].extractor,L=f?f(e):e[u],k=this.tokenizer(L,{fields:[u]}),I=this.pipeline.run(k),j=new t.FieldRef(o,u),_=Object.create(null);this.fieldTermFrequencies[j]=_,this.fieldLengths[j]=0,this.fieldLengths[j]+=I.length;for(var q=0;q<I.length;q++){var F=I[q];if(_[F]==null&&(_[F]=0),_[F]+=1,this.invertedIndex[F]==null){var H=Object.create(null);H._index=this.termIndex,this.termIndex+=1;for(var B=0;B<a.length;B++)H[a[B]]=Object.create(null);this.invertedIndex[F]=H}this.invertedIndex[F][u][o]==null&&(this.invertedIndex[F][u][o]=Object.create(null));for(var M=0;M<this.metadataWhitelist.length;M++){var J=this.metadataWhitelist[M],U=F.metadata[J];this.invertedIndex[F][u][o][J]==null&&(this.invertedIndex[F][u][o][J]=[]),this.invertedIndex[F][u][o][J].push(U)}}}},t.Builder.prototype.calculateAverageFieldLengths=function(){for(var e=Object.keys(this.fieldLengths),r=e.length,o={},a={},i=0;i<r;i++){var u=t.FieldRef.fromString(e[i]),f=u.fieldName;a[f]||(a[f]=0),a[f]+=1,o[f]||(o[f]=0),o[f]+=this.fieldLengths[u]}for(var L=Object.keys(this._fields),i=0;i<L.length;i++){var k=L[i];o[k]=o[k]/a[k]}this.averageFieldLength=o},t.Builder.prototype.createFieldVectors=function(){for(var e={},r=Object.keys(this.fieldTermFrequencies),o=r.length,a=Object.create(null),i=0;i<o;i++){for(var u=t.FieldRef.fromString(r[i]),f=u.fieldName,L=this.fieldLengths[u],k=new t.Vector,I=this.fieldTermFrequencies[u],j=Object.keys(I),_=j.length,q=this._fields[f].boost||1,F=this._documents[u.docRef].boost||1,H=0;H<_;H++){var B=j[H],M=I[B],J=this.invertedIndex[B]._index,U,te,le;a[B]===void 0?(U=t.idf(this.invertedIndex[B],this.documentCount),a[B]=U):U=a[B],te=U*((this._k1+1)*M)/(this._k1*(1-this._b+this._b*(L/this.averageFieldLength[f]))+M),te*=q,te*=F,le=Math.round(te*1e3)/1e3,k.insert(J,le)}e[u]=k}this.fieldVectors=e},t.Builder.prototype.createTokenSet=function(){this.tokenSet=t.TokenSet.fromArray(Object.keys(this.invertedIndex).sort())},t.Builder.prototype.build=function(){return this.calculateAverageFieldLengths(),this.createFieldVectors(),this.createTokenSet(),new t.Index({invertedIndex:this.invertedIndex,fieldVectors:this.fieldVectors,tokenSet:this.tokenSet,fields:Object.keys(this._fields),pipeline:this.searchPipeline})},t.Builder.prototype.use=function(e){var r=Array.prototype.slice.call(arguments,1);r.unshift(this),e.apply(this,r)},t.MatchData=function(e,r,o){for(var a=Object.create(null),i=Object.keys(o||{}),u=0;u<i.length;u++){var f=i[u];a[f]=o[f].slice()}this.metadata=Object.create(null),e!==void 0&&(this.metadata[e]=Object.create(null),this.metadata[e][r]=a)},t.MatchData.prototype.combine=function(e){for(var r=Object.keys(e.metadata),o=0;o<r.length;o++){var a=r[o],i=Object.keys(e.metadata[a]);this.metadata[a]==null&&(this.metadata[a]=Object.create(null));for(var u=0;u<i.length;u++){var f=i[u],L=Object.keys(e.metadata[a][f]);this.metadata[a][f]==null&&(this.metadata[a][f]=Object.create(null));for(var k=0;k<L.length;k++){var I=L[k];this.metadata[a][f][I]==null?this.metadata[a][f][I]=e.metadata[a][f][I]:this.metadata[a][f][I]=this.metadata[a][f][I].concat(e.metadata[a][f][I])}}}},t.MatchData.prototype.add=function(e,r,o){if(!(e in this.metadata)){this.metadata[e]=Object.create(null),this.metadata[e][r]=o;return}if(!(r in this.metadata[e])){this.metadata[e][r]=o;return}for(var a=Object.keys(o),i=0;i<a.length;i++){var u=a[i];u in this.metadata[e][r]?this.metadata[e][r][u]=this.metadata[e][r][u].concat(o[u]):this.metadata[e][r][u]=o[u]}},t.Query=function(e){this.clauses=[],this.allFields=e},t.Query.wildcard=new String("*"),t.Query.wildcard.NONE=0,t.Query.wildcard.LEADING=1,t.Query.wildcard.TRAILING=2,t.Query.presence={OPTIONAL:1,REQUIRED:2,PROHIBITED:3},t.Query.prototype.clause=function(e){return"fields"in e||(e.fields=this.allFields),"boost"in e||(e.boost=1),"usePipeline"in e||(e.usePipeline=!0),"wildcard"in e||(e.wildcard=t.Query.wildcard.NONE),e.wildcard&t.Query.wildcard.LEADING&&e.term.charAt(0)!=t.Query.wildcard&&(e.term="*"+e.term),e.wildcard&t.Query.wildcard.TRAILING&&e.term.slice(-1)!=t.Query.wildcard&&(e.term=""+e.term+"*"),"presence"in e||(e.presence=t.Query.presence.OPTIONAL),this.clauses.push(e),this},t.Query.prototype.isNegated=function(){for(var e=0;e<this.clauses.length;e++)if(this.clauses[e].presence!=t.Query.presence.PROHIBITED)return!1;return!0},t.Query.prototype.term=function(e,r){if(Array.isArray(e))return e.forEach(function(a){this.term(a,t.utils.clone(r))},this),this;var o=r||{};return o.term=e.toString(),this.clause(o),this},t.QueryParseError=function(e,r,o){this.name="QueryParseError",this.message=e,this.start=r,this.end=o},t.QueryParseError.prototype=new Error,t.QueryLexer=function(e){this.lexemes=[],this.str=e,this.length=e.length,this.pos=0,this.start=0,this.escapeCharPositions=[]},t.QueryLexer.prototype.run=function(){for(var e=t.QueryLexer.lexText;e;)e=e(this)},t.QueryLexer.prototype.sliceString=function(){for(var e=[],r=this.start,o=this.pos,a=0;a<this.escapeCharPositions.length;a++)o=this.escapeCharPositions[a],e.push(this.str.slice(r,o)),r=o+1;return e.push(this.str.slice(r,this.pos)),this.escapeCharPositions.length=0,e.join("")},t.QueryLexer.prototype.emit=function(e){this.lexemes.push({type:e,str:this.sliceString(),start:this.start,end:this.pos}),this.start=this.pos},t.QueryLexer.prototype.escapeCharacter=function(){this.escapeCharPositions.push(this.pos-1),this.pos+=1},t.QueryLexer.prototype.next=function(){if(this.pos>=this.length)return t.QueryLexer.EOS;var e=this.str.charAt(this.pos);return this.pos+=1,e},t.QueryLexer.prototype.width=function(){return this.pos-this.start},t.QueryLexer.prototype.ignore=function(){this.start==this.pos&&(this.pos+=1),this.start=this.pos},t.QueryLexer.prototype.backup=function(){this.pos-=1},t.QueryLexer.prototype.acceptDigitRun=function(){var e,r;do e=this.next(),r=e.charCodeAt(0);while(r>47&&r<58);e!=t.QueryLexer.EOS&&this.backup()},t.QueryLexer.prototype.more=function(){return this.pos<this.length},t.QueryLexer.EOS="EOS",t.QueryLexer.FIELD="FIELD",t.QueryLexer.TERM="TERM",t.QueryLexer.EDIT_DISTANCE="EDIT_DISTANCE",t.QueryLexer.BOOST="BOOST",t.QueryLexer.PRESENCE="PRESENCE",t.QueryLexer.lexField=function(e){return e.backup(),e.emit(t.QueryLexer.FIELD),e.ignore(),t.QueryLexer.lexText},t.QueryLexer.lexTerm=function(e){if(e.width()>1&&(e.backup(),e.emit(t.QueryLexer.TERM)),e.ignore(),e.more())return t.QueryLexer.lexText},t.QueryLexer.lexEditDistance=function(e){return e.ignore(),e.acceptDigitRun(),e.emit(t.QueryLexer.EDIT_DISTANCE),t.QueryLexer.lexText},t.QueryLexer.lexBoost=function(e){return e.ignore(),e.acceptDigitRun(),e.emit(t.QueryLexer.BOOST),t.QueryLexer.lexText},t.QueryLexer.lexEOS=function(e){e.width()>0&&e.emit(t.QueryLexer.TERM)},t.QueryLexer.termSeparator=t.tokenizer.separator,t.QueryLexer.lexText=function(e){for(;;){var r=e.next();if(r==t.QueryLexer.EOS)return t.QueryLexer.lexEOS;if(r.charCodeAt(0)==92){e.escapeCharacter();continue}if(r==":")return t.QueryLexer.lexField;if(r=="~")return e.backup(),e.width()>0&&e.emit(t.QueryLexer.TERM),t.QueryLexer.lexEditDistance;if(r=="^")return e.backup(),e.width()>0&&e.emit(t.QueryLexer.TERM),t.QueryLexer.lexBoost;if(r=="+"&&e.width()===1||r=="-"&&e.width()===1)return e.emit(t.QueryLexer.PRESENCE),t.QueryLexer.lexText;if(r.match(t.QueryLexer.termSeparator))return t.QueryLexer.lexTerm}},t.QueryParser=function(e,r){this.lexer=new t.QueryLexer(e),this.query=r,this.currentClause={},this.lexemeIdx=0},t.QueryParser.prototype.parse=function(){this.lexer.run(),this.lexemes=this.lexer.lexemes;for(var e=t.QueryParser.parseClause;e;)e=e(this);return this.query},t.QueryParser.prototype.peekLexeme=function(){return this.lexemes[this.lexemeIdx]},t.QueryParser.prototype.consumeLexeme=function(){var e=this.peekLexeme();return this.lexemeIdx+=1,e},t.QueryParser.prototype.nextClause=function(){var e=this.currentClause;this.query.clause(e),this.currentClause={}},t.QueryParser.parseClause=function(e){var r=e.peekLexeme();if(r!=null)switch(r.type){case t.QueryLexer.PRESENCE:return t.QueryParser.parsePresence;case t.QueryLexer.FIELD:return t.QueryParser.parseField;case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var o="expected either a field or a term, found "+r.type;throw r.str.length>=1&&(o+=" with value '"+r.str+"'"),new t.QueryParseError(o,r.start,r.end)}},t.QueryParser.parsePresence=function(e){var r=e.consumeLexeme();if(r!=null){switch(r.str){case"-":e.currentClause.presence=t.Query.presence.PROHIBITED;break;case"+":e.currentClause.presence=t.Query.presence.REQUIRED;break;default:var o="unrecognised presence operator'"+r.str+"'";throw new t.QueryParseError(o,r.start,r.end)}var a=e.peekLexeme();if(a==null){var o="expecting term or field, found nothing";throw new t.QueryParseError(o,r.start,r.end)}switch(a.type){case t.QueryLexer.FIELD:return t.QueryParser.parseField;case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var o="expecting term or field, found '"+a.type+"'";throw new t.QueryParseError(o,a.start,a.end)}}},t.QueryParser.parseField=function(e){var r=e.consumeLexeme();if(r!=null){if(e.query.allFields.indexOf(r.str)==-1){var o=e.query.allFields.map(function(u){return"'"+u+"'"}).join(", "),a="unrecognised field '"+r.str+"', possible fields: "+o;throw new t.QueryParseError(a,r.start,r.end)}e.currentClause.fields=[r.str];var i=e.peekLexeme();if(i==null){var a="expecting term, found nothing";throw new t.QueryParseError(a,r.start,r.end)}switch(i.type){case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var a="expecting term, found '"+i.type+"'";throw new t.QueryParseError(a,i.start,i.end)}}},t.QueryParser.parseTerm=function(e){var r=e.consumeLexeme();if(r!=null){e.currentClause.term=r.str.toLowerCase(),r.str.indexOf("*")!=-1&&(e.currentClause.usePipeline=!1);var o=e.peekLexeme();if(o==null){e.nextClause();return}switch(o.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var a="Unexpected lexeme type '"+o.type+"'";throw new t.QueryParseError(a,o.start,o.end)}}},t.QueryParser.parseEditDistance=function(e){var r=e.consumeLexeme();if(r!=null){var o=parseInt(r.str,10);if(isNaN(o)){var a="edit distance must be numeric";throw new t.QueryParseError(a,r.start,r.end)}e.currentClause.editDistance=o;var i=e.peekLexeme();if(i==null){e.nextClause();return}switch(i.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var a="Unexpected lexeme type '"+i.type+"'";throw new t.QueryParseError(a,i.start,i.end)}}},t.QueryParser.parseBoost=function(e){var r=e.consumeLexeme();if(r!=null){var o=parseInt(r.str,10);if(isNaN(o)){var a="boost must be numeric";throw new t.QueryParseError(a,r.start,r.end)}e.currentClause.boost=o;var i=e.peekLexeme();if(i==null){e.nextClause();return}switch(i.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var a="Unexpected lexeme type '"+i.type+"'";throw new t.QueryParseError(a,i.start,i.end)}}},function(e,r){C.exports=r()}(this,function(){return t})})()})(ft);var St=ft.exports;const Bt=It(St);let Je,me=[];async function Tt(){try{console.log("Initializing search...");const C=await fetch("/data/manifest.json");if(!C.ok)throw new Error("Manifest not found");const t=(await C.json()).map(i=>fetch(`/data/${i}`).then(u=>u.json())),e=await Promise.all(t);me=e.flatMap(i=>i.articulos.map(u=>({...u,ley_origen:i.metadata.ley,fecha_publicacion:i.metadata.fecha_publicacion}))),Je=Bt(function(){this.ref("id"),this.field("texto"),this.field("titulo_nombre",{boost:5}),this.field("capitulo_nombre",{boost:3}),this.field("articulo_label",{boost:10}),this.field("ley_origen",{boost:5}),me.forEach(i=>{this.add(i)})}),console.log(`Search Index Ready. ${me.length} articles indexed.`);const r=new Set(me.map(i=>i.ley_origen)),o=Mt(e),a={totalLeyes:r.size,totalArticulos:me.length,leyes:Array.from(r),summaries:o};window.dispatchEvent(new CustomEvent("search-ready",{detail:a}))}catch(C){console.error("Error initializing search:",C)}}function Mt(C){return C.map(S=>{const t=S.metadata,e={};S.articulos.forEach(o=>{e[o.capitulo_nombre]||(e[o.capitulo_nombre]=0),e[o.capitulo_nombre]++});const r=Object.entries(e).sort((o,a)=>a[1]-o[1]).slice(0,3).map(o=>o[0]);return{titulo:t.ley,fecha:t.fecha_publicacion,articulos:t.total_articulos,temas_clave:r,id:t.ley.replace(/\s+/g,"-").toLowerCase(),resumen:t.resumen||"No hay resumen disponible para este documento."}})}function _t(C){if(!Je)return[];try{let S=C;return!/[~*^:+]/.test(C)&&(S=C.split(/\s+/).filter(r=>r.length>2).map(r=>`${r}~1 ${r}*`).join(" ")),Je.search(S).map(r=>({...me.find(a=>a.id===r.ref),score:r.score,matchData:r.matchData}))}catch(S){return console.warn("Search error",S),[]}}function _e(C){return me.find(S=>S.id===C)}function jt(C){return me.filter(S=>S.ley_origen===C)}function Qt(){var nt,ot,at,st,it;const C=document.getElementById("search-input"),S=document.getElementById("results-container"),t=document.getElementById("law-detail-container"),e=document.getElementById("stats-minimal"),r=document.getElementById("hero-section"),o=document.getElementById("main-container"),a=document.getElementById("quick-filters"),i=document.getElementById("detail-modal"),u=document.getElementById("modal-panel"),f=document.getElementById("modal-content"),L=document.getElementById("modal-title"),k=document.getElementById("modal-ley"),I=document.getElementById("close-modal"),j=document.getElementById("copy-btn"),_=document.getElementById("loading-indicator"),q=document.getElementById("nav-inicio"),F=document.getElementById("nav-leyes"),H=document.getElementById("mobile-menu-btn"),B=document.getElementById("mobile-menu-overlay"),M=document.getElementById("mobile-menu-drawer"),J=document.getElementById("close-mobile-menu"),U=document.getElementById("mobile-nav-inicio"),te=document.getElementById("mobile-nav-leyes"),le="app-dark-mode";let de=localStorage.getItem(le)==="true";function ce(n){if(de=n,localStorage.setItem(le,n),document.documentElement.classList.toggle("dark-mode",n),!document.getElementById("global-dark-style")){const c=document.createElement("style");c.id="global-dark-style",c.innerHTML=`
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
            `,document.head.appendChild(c)}const s=document.querySelectorAll("#darkmode-icon-moon, #mobile-darkmode-moon"),l=document.querySelectorAll("#darkmode-icon-sun, #mobile-darkmode-sun"),d=document.getElementById("mobile-darkmode-label");s.forEach(c=>c.classList.toggle("hidden",n)),l.forEach(c=>c.classList.toggle("hidden",!n)),d&&(d.textContent=n?"Modo claro":"Modo oscuro")}de&&ce(!0),(nt=document.getElementById("darkmode-toggle"))==null||nt.addEventListener("click",()=>ce(!de)),(ot=document.getElementById("mobile-darkmode-toggle"))==null||ot.addEventListener("click",()=>ce(!de));function re(n){!M||!B||(n?(B.classList.remove("hidden"),B.offsetWidth,B.classList.remove("opacity-0"),M.classList.remove("translate-x-full"),document.body.style.overflow="hidden"):(B.classList.add("opacity-0"),M.classList.add("translate-x-full"),document.body.style.overflow="",setTimeout(()=>{B.classList.add("hidden")},300)))}H&&H.addEventListener("click",()=>re(!0)),J&&J.addEventListener("click",()=>re(!1)),B&&B.addEventListener("click",()=>re(!1)),U&&U.addEventListener("click",n=>{n.preventDefault(),N(),re(!1)}),te&&te.addEventListener("click",n=>{n.preventDefault(),ke(),re(!1)});let z=[],D=[];window.addEventListener("search-ready",n=>{const{totalLeyes:s,totalArticulos:l,summaries:d}=n.detail;z=d,e&&(e.innerHTML=`
                <span class="opacity-60">Índice activo:</span>
                <span class="font-semibold text-guinda">${s} leyes</span>
                <span class="mx-1 opacity-30">|</span>
                <span class="font-semibold text-guinda">${l} artículos</span>
            `),Xe(),setTimeout(pe,0)});const xe=document.getElementById("nav-favorites"),ae=document.getElementById("mobile-nav-favorites");xe&&xe.addEventListener("click",()=>Ke()),ae&&ae.addEventListener("click",()=>{Ke(),re(!1)});const be=document.getElementById("nav-stats"),ve=document.getElementById("mobile-nav-stats");be&&be.addEventListener("click",n=>{n.preventDefault(),tt()}),ve&&ve.addEventListener("click",n=>{n.preventDefault(),tt(),re(!1)}),(at=document.getElementById("close-compare-modal"))==null||at.addEventListener("click",ze),(st=document.getElementById("compare-modal"))==null||st.addEventListener("click",n=>{n.target===document.getElementById("compare-modal")&&ze()});function Z(n){history.replaceState(null,"",n?`${location.pathname}${n}`:location.pathname)}function pe(){const n=location.hash;if(n){if(n.startsWith("#art-")){const s=decodeURIComponent(n.slice(5)),l=_e(s);if(!l)return;ge=[l],he(s)}else if(n.startsWith("#ley-")){const s=decodeURIComponent(n.slice(5)),l=z.find(d=>d.id===s);l&&Ie(l)}}}function b(n,s="✓",l="bg-gray-900"){const d=document.getElementById("app-toast");d&&d.remove();const c=document.createElement("div");c.id="app-toast",c.className=`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 ${l} text-white text-xs font-semibold rounded-full shadow-2xl transition-all duration-300 opacity-0 scale-90 pointer-events-none`,c.innerHTML=`<span>${s}</span><span>${n}</span>`,document.body.appendChild(c),requestAnimationFrame(()=>{c.classList.replace("opacity-0","opacity-100"),c.classList.replace("scale-90","scale-100")}),setTimeout(()=>{c.classList.replace("opacity-100","opacity-0"),c.classList.replace("scale-100","scale-90"),setTimeout(()=>c.remove(),300)},2500)}function R(n=5){S.innerHTML=Array(n).fill("").map(()=>`
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
        `).join("")}let K="",G=[],y=1;const O=10;function ue(n,s,l){const d=document.getElementById(s);if(!d)return;const c=d.nextElementSibling;if(c&&c.classList.contains("pagination-nav")&&c.remove(),n<=O)return;const m=Math.ceil(n/O),g=document.createElement("nav");g.className="pagination-nav flex justify-center items-center gap-2 mt-8 mb-4";const h=document.createElement("button");h.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>',h.className=`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${y===1?"opacity-50 cursor-not-allowed":""}`,h.disabled=y===1,h.onclick=()=>{y>1&&(y--,l(),window.scrollTo({top:d.offsetTop-100,behavior:"smooth"}))};const p=document.createElement("span");p.className="text-xs text-gray-500 font-medium",p.innerText=`Página ${y} de ${m}`;const E=document.createElement("button");E.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>',E.className=`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${y===m?"opacity-50 cursor-not-allowed":""}`,E.disabled=y===m,E.onclick=()=>{y<m&&(y++,l(),window.scrollTo({top:d.offsetTop-100,behavior:"smooth"}))},g.appendChild(h),g.appendChild(p),g.appendChild(E),d.parentNode.insertBefore(g,d.nextSibling)}q&&q.addEventListener("click",n=>{n.preventDefault(),N()}),F&&F.addEventListener("click",n=>{n.preventDefault(),ke()});function ne(){var s;(s=document.getElementById("toc-toggle-btn"))==null||s.remove();const n=document.getElementById("toc-panel");n&&(n.classList.add("translate-y-full"),setTimeout(()=>n.remove(),310)),document.body.style.overflow=""}function N(){Z(null),ne(),C&&(C.value=""),r.classList.remove("hidden"),a.classList.remove("hidden"),e.classList.remove("hidden"),o.classList.add("justify-center","pt-24"),o.classList.remove("pt-8"),S.classList.add("hidden","opacity-0"),S.innerHTML="",t&&t.classList.add("hidden","opacity-0");const n=document.getElementById("search-filters");n&&n.remove();const s=document.querySelector(".pagination-nav");s&&s.remove(),y=1,P={type:"all",law:"all",artNum:""}}function ke(){if(Z(null),ne(),r.classList.add("hidden"),a.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),S.classList.remove("hidden"),setTimeout(()=>S.classList.remove("opacity-0"),50),C&&(C.value=""),z.length===0){S.innerHTML='<div class="text-center py-12 text-gray-400">Cargando leyes...</div>';return}const n=z.filter(d=>d.titulo.toLowerCase().startsWith("ley")),s=z.filter(d=>d.titulo.toLowerCase().startsWith("reglamento")),l=z.filter(d=>!d.titulo.toLowerCase().startsWith("ley")&&!d.titulo.toLowerCase().startsWith("reglamento"));S.innerHTML=`
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Marco Jurídico Disponible</h2>
                <p class="text-sm text-gray-400 font-light">Explora las leyes y reglamentos indexados en el sistema.</p>
            </div>
            
            ${Ce("Leyes Federales",n)}
            ${Ce("Reglamentos",s)}
            ${Ce("Acuerdos y Otros Instrumentos",l)}
        `,document.querySelectorAll(".law-card").forEach(d=>{d.addEventListener("click",()=>{const c=d.dataset.title,m=z.find(g=>g.titulo===c);m&&Ie(m)})}),document.querySelectorAll(".carousel-container").forEach(d=>{const c=d.querySelector(".carousel-scroll"),m=d.querySelector(".scroll-left"),g=d.querySelector(".scroll-right");m&&g&&c&&(m.addEventListener("click",()=>{c.scrollBy({left:-300,behavior:"smooth"})}),g.addEventListener("click",()=>{c.scrollBy({left:300,behavior:"smooth"})}))})}function Ce(n,s){if(s.length===0)return"";const l=n.toLowerCase().includes("ley"),d=n.toLowerCase().includes("reglamento"),c=l?{gradFrom:"#6b1532",gradTo:"#9B2247",label:"Ley Federal",dotClass:"bg-guinda"}:d?{gradFrom:"#14403a",gradTo:"#1E5B4F",label:"Reglamento",dotClass:"bg-emerald-700"}:{gradFrom:"#7a5c1e",gradTo:"#A57F2C",label:"Instrumento",dotClass:"bg-amber-700"},m=l?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>':d?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>';return`
            <div class="mb-10 carousel-container group/section">
                <h3 class="text-lg font-bold text-gray-800 mb-4 px-1 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${c.dotClass} flex-shrink-0"></span>
                    ${n}
                    <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${s.length}</span>
                </h3>

                <div class="relative">
                    <!-- Left Arrow -->
                    <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white/90 backdrop-blur border border-gray-100 shadow-lg rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-opacity disabled:opacity-0 hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>

                    <!-- Carousel Track -->
                    <div class="carousel-scroll flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 snap-x scrollbar-hide scroll-smooth">
                        ${s.map(g=>{const h=g.resumen?g.resumen.replace(/\n/g," ").slice(0,110)+(g.resumen.length>110?"…":""):g.temas_clave&&g.temas_clave.length>0?g.temas_clave.slice(0,3).join(" · "):"Ver artículos";return`
                            <div class="min-w-[300px] w-[300px] md:min-w-[340px] md:w-[340px] snap-start rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer law-card group flex flex-col h-[280px]"
                                data-title="${g.titulo.replace(/"/g,"&quot;")}"
                                style="background: linear-gradient(160deg, ${c.gradFrom} 0%, ${c.gradTo} 100%);">

                                <!-- Top: icon + label -->
                                <div class="flex items-start justify-between px-5 pt-5 pb-3">
                                    <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);">
                                        <svg class="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">${m}</svg>
                                    </div>
                                    <span class="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white/80" style="background: rgba(255,255,255,0.15);">${c.label}</span>
                                </div>

                                <!-- Middle: title + description -->
                                <div class="flex-1 px-5 pb-2 flex flex-col justify-center">
                                    <h3 class="text-sm font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-white/90 transition-colors" title="${g.titulo.replace(/"/g,"&quot;")}">${g.titulo}</h3>
                                    <p class="text-[11px] text-white/65 leading-relaxed line-clamp-3">${h}</p>
                                </div>

                                <!-- Footer: metadata bar -->
                                <div class="flex items-center justify-between px-5 py-3" style="background: rgba(0,0,0,0.25); backdrop-filter: blur(4px);">
                                    <div class="flex items-center gap-1.5 text-white/70 text-[10px]">
                                        <svg class="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <span>${g.articulos} artículos</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-white/50 text-[10px]">${g.fecha||"N/D"}</span>
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
        `}function Ie(n){var dt,ct,ut,pt,gt,ht;if(!t)return;ne(),D=jt(n.titulo);const s=[...new Set(D.map(v=>v.capitulo_nombre).filter(Boolean))];[...new Set(D.map(v=>v.titulo_nombre).filter(Boolean))];const l=D.filter(v=>v.articulo_label.toLowerCase().includes("transitorio")).length;S.classList.add("hidden"),r.classList.add("hidden"),a.classList.add("hidden"),e.classList.add("hidden"),t.classList.remove("hidden"),setTimeout(()=>t.classList.remove("opacity-0"),50),Z(`#ley-${encodeURIComponent(n.id)}`);let d=100,c=localStorage.getItem("reader-theme")||"light";t.innerHTML=`
            <!-- Desktop Reading Controls (hidden on mobile) -->
            <div id="reading-controls" class="hidden md:flex fixed bottom-6 right-6 z-40 flex-col gap-2 animate-fade-in-up">
                 <div class="bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-2xl p-2 flex flex-col gap-2 items-center transition-colors duration-300" id="reading-panel">
                    <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1">
                        <button id="btn-font-decrease" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors" title="Letra más pequeña">
                            <span class="font-serif text-sm">A</span>
                        </button>
                        <span id="font-size-display" class="text-[10px] font-bold text-gray-400 w-8 text-center">${d}%</span>
                        <button id="btn-font-increase" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors" title="Letra más grande">
                            <span class="font-serif text-lg font-bold">A</span>
                        </button>
                    </div>
                    <div class="w-full h-px bg-gray-100"></div>
                    <div class="flex gap-1">
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-white shadow-sm hover:scale-110 transition-transform ${c==="light"?"ring-2 ring-guinda ring-offset-1":""}" data-theme="light" title="Modo Claro"></button>
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-[#f4ecd8] shadow-sm hover:scale-110 transition-transform ${c==="sepia"?"ring-2 ring-guinda ring-offset-1":""}" data-theme="sepia" title="Modo Sepia"></button>
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-[#1a1a1a] shadow-sm hover:scale-110 transition-transform ${c==="dark"?"ring-2 ring-guinda ring-offset-1":""}" data-theme="dark" title="Modo Oscuro"></button>
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
                            <span id="mob-font-display" class="flex-1 text-center text-sm font-bold text-gray-500">${d}%</span>
                            <button id="mob-font-increase" class="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center font-serif text-3xl font-bold text-gray-600 active:bg-guinda active:text-white transition-colors">A</button>
                        </div>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Fondo</p>
                        <div class="grid grid-cols-3 gap-3">
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-white ${c==="light"?"border-guinda text-guinda":"border-gray-100 text-gray-700"}" data-theme="light">Blanco</button>
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-[#f4ecd8] ${c==="sepia"?"border-guinda text-guinda":"border-transparent text-[#5b4636]"}" data-theme="sepia">Sepia</button>
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-[#1a1a1a] ${c==="dark"?"border-guinda":"border-transparent"} text-white" data-theme="dark">Oscuro</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-8 animate-fade-in-up transition-colors duration-300" id="law-header-area">
                <nav aria-label="Ruta de navegación" class="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap">
                    <button id="crumb-inicio" class="hover:text-guinda transition-colors font-medium" aria-label="Ir al inicio">Inicio</button>
                    <svg class="w-3 h-3 text-gray-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    <button id="crumb-categoria" class="hover:text-guinda transition-colors font-medium" aria-label="Ver todas las leyes">${n.titulo.toLowerCase().startsWith("ley")?"Leyes Federales":n.titulo.toLowerCase().startsWith("reglamento")?"Reglamentos":"Acuerdos y Otros"}</button>
                    <svg class="w-3 h-3 text-gray-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    <span class="text-gray-600 font-semibold truncate max-w-[180px] sm:max-w-xs" title="${n.titulo.replace(/"/g,"&quot;")}">${n.titulo}</span>
                </nav>
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <span class="text-xs font-bold text-guinda uppercase tracking-widest bg-guinda/5 px-2 py-1 rounded-full">Marco Legal Vigente</span>
                        <h1 class="text-3xl sm:text-4xl font-head font-bold text-gray-900 mt-3 mb-2">${n.titulo}</h1>
                        <p class="text-sm text-gray-500">Publicado: ${n.fecha} · Última reforma: ${n.fecha}</p>
                        ${n.resumen?`<div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 font-light leading-relaxed max-w-4xl">${n.resumen.split(`

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
                     <span class="text-3xl font-head font-bold text-guinda">${D.length}</span>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mt-1">Artículos</span>
                 </div>
                 <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                     <span class="text-3xl font-head font-bold text-guinda">${s.length}</span>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mt-1">Capítulos</span>
                 </div>
                 <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                     <span class="text-3xl font-head font-bold text-guinda">${l}</span>
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
                        ${n.temas_clave?n.temas_clave.map(v=>`<button class="theme-filter-btn text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-guinda hover:text-white hover:border-guinda transition-all shadow-sm" data-theme="${v}">${v}</button>`).join(""):'<span class="text-xs text-gray-400">No disponibles</span>'}
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
                        placeholder="Buscar artículos específicos en ${n.titulo}...">
                </div>

                <!-- Articles List -->
                <div id="law-articles-list" class="space-y-4 max-w-4xl mx-auto">
                    <!-- Render initial articles -->
                </div>
            </div>
        `;const m=document.createElement("button");m.id="toc-toggle-btn",m.className="fixed bottom-24 left-4 z-40 bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-600 flex items-center gap-2 hover:text-guinda hover:border-guinda transition-all duration-300 group animate-fade-in-up",m.innerHTML=`
            <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10M4 18h6"/></svg>
            Índice
            <span class="bg-guinda/10 text-guinda px-1.5 py-0.5 rounded-full text-[9px] font-bold">${D.length}</span>
        `,document.body.appendChild(m);const g=D.map((v,T)=>{const Y=v.articulo_label.match(/\d+/),W=Y?Y[0]:T+1,We=!!Le(v.id);return`<button class="toc-art-btn text-[11px] font-medium rounded-lg py-2 px-1 border transition-all text-center relative
                ${Se(v.id)?"border-guinda/30 bg-guinda/5 text-guinda":"border-gray-100 bg-white text-gray-600 hover:border-guinda hover:text-guinda hover:bg-guinda/5"}"
                data-id="${v.id}" title="${v.articulo_label}">
                Art.${W}
                ${We?'<span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>':""}
            </button>`}).join(""),h=D.map(v=>{const T=!!Le(v.id),Y=Se(v.id),W=v.titulo_nombre?`<span class="text-gray-400 ml-1 font-normal">· ${v.titulo_nombre}</span>`:"";return`<button class="toc-art-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-guinda/5 group/item
                ${Y?"text-guinda":"text-gray-700 hover:text-guinda"}"
                data-id="${v.id}">
                <span class="flex-shrink-0 text-[10px] font-bold min-w-[36px] text-center py-1 rounded-md
                    ${Y?"bg-guinda/10 text-guinda":"bg-gray-100 text-gray-500 group-hover/item:bg-guinda/10 group-hover/item:text-guinda"}">
                    ${v.articulo_label.replace(/Artículo\s*/i,"Art.").split(" ")[0]+(v.articulo_label.match(/\d+/)?" "+v.articulo_label.match(/\d+/)[0]:"")}
                </span>
                <span class="text-xs font-medium truncate flex-1 leading-snug">
                    ${v.articulo_label}${W}
                </span>
                <span class="flex-shrink-0 flex items-center gap-1">
                    ${T?'<span class="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Tiene nota"></span>':""}
                    ${Y?'<svg class="w-3 h-3 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>':""}
                </span>
            </button>`}).join(""),p=document.createElement("div");p.id="toc-panel",p.className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 transform translate-y-full transition-transform duration-300 flex flex-col",p.style.maxHeight="75vh",p.innerHTML=`
            <!-- Handle bar -->
            <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>
            <!-- Header -->
            <div class="flex items-center justify-between px-5 pt-2 pb-3 flex-shrink-0">
                <div>
                    <p class="text-sm font-bold text-gray-800">Índice de Artículos</p>
                    <p class="text-[10px] text-gray-400 mt-0.5">${D.length} artículos · clic para abrir</p>
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
                    ${g}
                </div>
            </div>
            <!-- Content: List view (hidden by default) -->
            <div id="toc-content-list" class="hidden overflow-y-auto flex-1 px-3 py-2 space-y-0.5">
                ${h}
            </div>
        `,document.body.appendChild(p);const E=p.querySelector("#toc-tab-grid"),Q=p.querySelector("#toc-tab-list"),w=p.querySelector("#toc-content-grid"),x=p.querySelector("#toc-content-list"),$=p.querySelector("#toc-search"),X=["bg-guinda","text-white","shadow-sm"],V=["text-gray-500","hover:text-guinda","hover:bg-guinda/5"];E.addEventListener("click",()=>{E.classList.add(...X),E.classList.remove(...V),Q.classList.remove(...X),Q.classList.add(...V),w.classList.remove("hidden"),x.classList.add("hidden"),$&&($.value=""),w.querySelectorAll(".toc-art-btn").forEach(v=>v.style.display="")}),Q.addEventListener("click",()=>{Q.classList.add(...X),Q.classList.remove(...V),E.classList.remove(...X),E.classList.add(...V),x.classList.remove("hidden"),w.classList.add("hidden"),$&&($.value=""),x.querySelectorAll(".toc-art-btn").forEach(v=>v.style.display="")}),$&&($.addEventListener("input",v=>{const T=v.target.value.toLowerCase().trim();(x.classList.contains("hidden")?w:x).querySelectorAll(".toc-art-btn").forEach(W=>{var Ge;const We=!T||((Ge=W.title)==null?void 0:Ge.toLowerCase().includes(T))||W.textContent.toLowerCase().includes(T);W.style.display=We?"":"none"})}),$.addEventListener("click",v=>v.stopPropagation()));let oe=!1;const se=v=>{oe=v,v?(p.classList.remove("translate-y-full"),document.body.style.overflow="hidden"):(p.classList.add("translate-y-full"),document.body.style.overflow="")};m.addEventListener("click",()=>se(!oe)),(dt=p.querySelector("#toc-close-btn"))==null||dt.addEventListener("click",()=>se(!1)),p.querySelectorAll(".toc-art-btn").forEach(v=>{v.addEventListener("click",()=>{se(!1),he(v.dataset.id)})}),ye(D.slice(0,20),""),setTimeout(()=>{je(D)},100);const Be=document.getElementById("law-articles-list"),Ve=document.getElementById("btn-font-increase"),Te=document.getElementById("btn-font-decrease"),A=document.getElementById("font-size-display"),ie=document.querySelectorAll(".theme-btn");document.getElementById("law-header-area");const fe=v=>{if(c=v,localStorage.setItem("reader-theme",v),document.body.className=`bg-${v} text-gray-900 font-body min-h-screen flex flex-col antialiased transition-colors duration-300`,ie.forEach(T=>{T.classList.remove("ring-2","ring-guinda","ring-offset-1"),T.dataset.theme===v&&T.classList.add("ring-2","ring-guinda","ring-offset-1")}),document.querySelectorAll(".mob-theme-btn").forEach(T=>{T.classList.remove("border-guinda","text-guinda"),T.classList.add("border-transparent"),T.dataset.theme===v&&(T.classList.remove("border-transparent"),T.classList.add("border-guinda"),v!=="dark"&&T.classList.add("text-guinda"))}),!document.getElementById("reader-themes-style")){const T=document.createElement("style");T.id="reader-themes-style",T.innerHTML=`
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
                `,document.head.appendChild(T)}};fe(c);const Me=()=>{Be&&(Be.style.fontSize=`${d}%`),document.querySelectorAll("#font-size-display, #mob-font-display").forEach(v=>{v.innerText=`${d}%`})};Ve&&Ve.addEventListener("click",()=>{d<250&&(d+=10,Me())}),Te&&Te.addEventListener("click",()=>{d>80&&(d-=10,Me())}),A&&(A.addEventListener("click",()=>{d=100,Me()}),A.style.cursor="pointer",A.title="Restablecer al 100%"),ie.forEach(v=>{v.addEventListener("click",T=>{fe(T.target.dataset.theme)})});const He=document.getElementById("mobile-reading-toggle"),qe=document.getElementById("mobile-reading-sheet"),Ee=document.getElementById("mobile-reading-overlay"),Ue=v=>{qe==null||qe.classList.toggle("translate-y-full",!v),Ee==null||Ee.classList.toggle("hidden",!v)};He==null||He.addEventListener("click",()=>Ue(!0)),Ee==null||Ee.addEventListener("click",()=>Ue(!1)),(ct=document.getElementById("mob-font-decrease"))==null||ct.addEventListener("click",()=>{d>80&&(d-=10,Me())}),(ut=document.getElementById("mob-font-increase"))==null||ut.addEventListener("click",()=>{d<250&&(d+=10,Me())}),document.querySelectorAll(".mob-theme-btn").forEach(v=>{v.addEventListener("click",()=>{fe(v.dataset.theme),Ue(!1)})});const lt=document.getElementById("law-share-btn"),$e=document.getElementById("law-share-menu");document.getElementById("law-share-text-btn"),document.getElementById("law-share-link-btn"),lt&&$e&&(lt.addEventListener("click",v=>{v.stopPropagation(),$e.classList.toggle("hidden")}),document.addEventListener("click",function v(T){T.target.closest("#law-share-wrapper")||($e.classList.add("hidden"),document.removeEventListener("click",v))})),Object.entries({"law-share-whatsapp-btn":()=>Oe(n,"whatsapp"),"law-share-telegram-btn":()=>Oe(n,"telegram"),"law-share-twitter-btn":()=>Oe(n,"twitter"),"law-share-email-btn":()=>Oe(n,"email"),"law-share-link-btn":()=>{const v=`${location.origin}${location.pathname}#ley-${encodeURIComponent(n.id)}`;navigator.clipboard.writeText(v).then(()=>b("¡Enlace copiado!","🔗","bg-blue-600"))}}).forEach(([v,T])=>{var Y;(Y=document.getElementById(v))==null||Y.addEventListener("click",()=>{$e==null||$e.classList.add("hidden"),T()})}),(pt=document.getElementById("print-btn"))==null||pt.addEventListener("click",()=>window.print()),(gt=document.getElementById("crumb-inicio"))==null||gt.addEventListener("click",()=>N()),(ht=document.getElementById("crumb-categoria"))==null||ht.addEventListener("click",()=>ke()),document.querySelectorAll(".theme-filter-btn").forEach(v=>{v.addEventListener("click",T=>{const Y=T.target.dataset.theme,W=document.getElementById("law-search-input");W&&(W.value=Y,W.dispatchEvent(new Event("input")))})}),document.getElementById("law-search-input").addEventListener("input",v=>{const T=v.target.value.toLowerCase().trim();let Y=D;T.length>2&&(Y=D.filter(W=>W.texto.toLowerCase().includes(T)||W.articulo_label.toLowerCase().includes(T)||W.titulo_nombre&&W.titulo_nombre.toLowerCase().includes(T)||W.capitulo_nombre&&W.capitulo_nombre.toLowerCase().includes(T))),ye(Y.slice(0,50),T)}),document.getElementById("export-csv-btn").addEventListener("click",()=>{bt(D,`${n.titulo}.csv`)})}function je(n){const s=document.getElementById("law-structure-chart");if(!s)return;if(!window.d3){s.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">Cargando visualización...</div>',setTimeout(()=>je(n),1e3);return}if(s.innerHTML="",!n||n.length===0){s.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">No hay datos para visualizar</div>';return}const l={};n.forEach(x=>{let $=x.titulo_nombre||x.capitulo_nombre||"General";$=$.replace(/^TÍTULO\s+/i,"").replace(/^CAPÍTULO\s+/i,""),$=$.replace(/^[IVXLCDM]+\.?\s*-?\s*/,""),$=$.replace(/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)\.?\s*-?\s*/i,""),$=$.trim(),$||($="General"),$.length>25&&($=$.substring(0,25)+"..."),l[$]=(l[$]||0)+1});const d=Object.entries(l).map(([x,$])=>({name:x,value:$})).sort((x,$)=>$.value-x.value).slice(0,5);if(d.length===0){s.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">Datos insuficientes</div>';return}const c={top:10,right:30,bottom:20,left:220},m=s.clientWidth,h=Math.max(s.clientHeight,d.length*35+c.top+c.bottom);d3.select(s).select("svg").remove();const p=d3.select(s).append("svg").attr("width","100%").attr("height",h).attr("viewBox",[0,0,m,h]).attr("style","max-width: 100%; height: auto; font: 11px sans-serif;"),E=d3.scaleLinear().domain([0,d3.max(d,x=>x.value)]).range([c.left,m-c.right]),Q=d3.scaleBand().domain(d.map(x=>x.name)).rangeRound([c.top,h-c.bottom]).padding(.3);d3.selectAll(".d3-tooltip").remove();const w=d3.select("body").append("div").attr("class","d3-tooltip absolute bg-gray-900/90 backdrop-blur text-white text-[10px] rounded-lg py-1.5 px-3 pointer-events-none opacity-0 transition-opacity z-50 shadow-xl border border-gray-700").style("display","none");p.append("g").attr("fill","#9B2247").selectAll("rect").data(d).join("rect").attr("x",E(0)).attr("y",x=>Q(x.name)).attr("width",x=>Math.max(0,E(x.value)-E(0))).attr("height",Q.bandwidth()).attr("rx",4).on("mouseover",(x,$)=>{d3.select(x.target).attr("fill","#7A1C39"),w.style("opacity","1").style("display","block").text(`${$.name}: ${$.value} artículos`)}).on("mousemove",x=>{w.style("left",x.pageX+10+"px").style("top",x.pageY-10+"px")}).on("mouseout",x=>{d3.select(x.target).attr("fill","#9B2247"),w.style("opacity","0").style("display","none")}),p.append("g").attr("fill","black").attr("text-anchor","start").attr("font-size","10px").selectAll("text").data(d).join("text").attr("x",x=>E(x.value)+4).attr("y",x=>Q(x.name)+Q.bandwidth()/2).attr("dy","0.35em").text(x=>x.value),p.append("g").call(d3.axisLeft(Q).tickSize(0)).attr("transform",`translate(${c.left},0)`).call(x=>x.select(".domain").remove()).call(x=>x.selectAll("text").attr("fill","#4B5563").attr("font-weight","500").style("text-anchor","end").attr("dx","-6"))}function ye(n,s){const l=document.getElementById("law-articles-list");if(l){if(n.length===0){l.innerHTML='<div class="text-center py-8 text-gray-400 text-sm">No se encontraron artículos que coincidan con la búsqueda.</div>';return}ge=n,l.innerHTML=n.map(d=>{const c=s?Qe(d.texto,s):d.texto.substring(0,300)+"...",m=!!Le(d.id),g=Se(d.id)?'<svg class="w-3.5 h-3.5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>',h=ee.includes(d.id),p=h?"text-guinda":ee.length>=2?"text-gray-100":"text-gray-300 hover:text-guinda",E=h?"bg-guinda/10":"";return`
            <div class="relative bg-white border ${h?"border-guinda/30":"border-gray-100"} rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer result-item" data-id="${d.id}">
                <div class="flex items-center justify-between mb-2 pr-14">
                    <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        ${d.articulo_label}
                        ${m?'<span class="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Tiene nota"></span>':""}
                    </span>
                    <span class="text-[10px] text-gray-400">${d.titulo_nombre||""}</span>
                </div>
                <p class="text-sm text-gray-600 font-light leading-relaxed line-clamp-3">${c}</p>
                <button class="bookmark-card-btn absolute top-3 right-9 p-1 text-gray-300 hover:text-guinda transition-colors" data-id="${d.id}">${g}</button>
                <button class="compare-card-btn absolute top-3 right-3 p-1 ${p} ${E} rounded transition-colors" data-id="${d.id}" title="Comparar artículo">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                </button>
            </div>
            `}).join(""),document.querySelectorAll("#law-articles-list .result-item").forEach(d=>{d.addEventListener("click",c=>{c.target.closest(".bookmark-card-btn")||c.target.closest(".compare-card-btn")||he(d.dataset.id)})}),document.querySelectorAll("#law-articles-list .bookmark-card-btn").forEach(d=>{d.addEventListener("click",c=>{c.stopPropagation();const m=document.getElementById("law-search-input");Fe(d.dataset.id);const g=m?m.value.toLowerCase().trim():"";ye(D.slice(0,50),g)})}),document.querySelectorAll("#law-articles-list .compare-card-btn").forEach(d=>{d.addEventListener("click",c=>{var p;c.stopPropagation();const m=d.dataset.id,g=ee.indexOf(m);g>=0?ee.splice(g,1):ee.length<2&&ee.push(m),Ze();const h=((p=document.getElementById("law-search-input"))==null?void 0:p.value.toLowerCase().trim())||"";ye(D.slice(0,50),h)})})}}function mt(n){return n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Qe(n,s){if(!s||!n)return n||"";const l=s.trim().split(/\s+/).filter(m=>m.length>1);if(l.length===0)return n;const d=l.map(m=>mt(m)).join("|"),c=new RegExp(`(${d})`,"gi");return n.replace(c,'<mark class="hl">$1</mark>')}function xt(n,s){const l=s>0?n/s:0;return l>=.6?'<span class="text-[9px] font-bold text-guinda bg-guinda/10 px-1.5 py-0.5 rounded-full">Alta</span>':l>=.25?'<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Media</span>':'<span class="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">Baja</span>'}function bt(n,s){const l=["Ley","Artículo","Texto"],d=n.map(h=>[`"${h.ley_origen}"`,`"${h.articulo_label}"`,`"${h.texto.replace(/"/g,'""')}"`]),c=[l.join(","),...d.map(h=>h.join(","))].join(`
`),m=new Blob([c],{type:"text/csv;charset=utf-8;"}),g=document.createElement("a");if(g.download!==void 0){const h=URL.createObjectURL(m);g.setAttribute("href",h),g.setAttribute("download",s),g.style.visibility="hidden",document.body.appendChild(g),g.click(),document.body.removeChild(g)}}function vt(n){const s=Ae().filter(l=>l!==n);s.unshift(n),localStorage.setItem("search-history",JSON.stringify(s.slice(0,10)))}function Ae(){return JSON.parse(localStorage.getItem("search-history")||"[]")}if(a&&a.addEventListener("click",n=>{n.target.tagName==="BUTTON"&&(C.value=n.target.textContent,C.dispatchEvent(new Event("input")))}),C){const n=document.createElement("div");n.id="autocomplete-results",n.className="absolute w-full bg-white border border-gray-100 rounded-2xl shadow-xl mt-2 hidden z-50 overflow-hidden",C.parentNode.appendChild(n),document.addEventListener("click",s=>{!C.contains(s.target)&&!n.contains(s.target)&&n.classList.add("hidden")}),C.addEventListener("focus",()=>{var l;if(C.value.trim().length>0)return;const s=Ae();s.length!==0&&(n.innerHTML=`
                <div class="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span>Búsquedas recientes</span>
                    <button id="clear-all-history" class="text-gray-300 hover:text-guinda transition-colors text-[9px] normal-case tracking-normal">Borrar todo</button>
                </div>
                ${s.slice(0,7).map(d=>`
                    <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors history-item" data-query="${d}">
                        <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 truncate flex-1">${d}</span>
                        <button class="remove-history-item text-gray-200 hover:text-gray-500 transition-colors text-base leading-none flex-shrink-0" data-query="${d}">×</button>
                    </div>
                `).join("")}
            `,n.classList.remove("hidden"),(l=document.getElementById("clear-all-history"))==null||l.addEventListener("click",d=>{d.stopPropagation(),localStorage.removeItem("search-history"),n.classList.add("hidden")}),n.querySelectorAll(".history-item").forEach(d=>{d.addEventListener("click",c=>{if(c.target.classList.contains("remove-history-item")){c.stopPropagation();const m=c.target.dataset.query,g=Ae().filter(h=>h!==m);localStorage.setItem("search-history",JSON.stringify(g)),d.remove(),n.querySelectorAll(".history-item").length===0&&n.classList.add("hidden");return}C.value=d.dataset.query,C.dispatchEvent(new Event("input")),n.classList.add("hidden")})}))}),C.addEventListener("input",s=>{const l=s.target.value.trim();if(l.length>2){if(r.classList.add("hidden"),r.classList.remove("block"),a.classList.add("hidden"),e.classList.add("hidden"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),S.classList.remove("hidden"),setTimeout(()=>S.classList.remove("opacity-0"),50),_&&_.classList.remove("hidden"),R(),z.length>0){const d=z.filter(c=>c.titulo.toLowerCase().includes(l.toLowerCase())).slice(0,5);d.length>0?(n.innerHTML=`
                            <div class="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold bg-gray-50 border-b border-gray-100">Sugerencias Directas</div>
                            ${d.map(c=>`
                                <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-item" data-title="${c.titulo}">
                                    <svg class="w-4 h-4 text-guinda opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                    <span class="text-sm text-gray-700 font-medium truncate">${c.titulo}</span>
                                </div>
                            `).join("")}
                         `,n.classList.remove("hidden"),n.querySelectorAll(".suggestion-item").forEach(c=>{c.addEventListener("click",()=>{const m=c.dataset.title,g=z.find(h=>h.titulo===m);g&&(Ie(g),n.classList.add("hidden"),C.value="")})})):n.classList.add("hidden")}setTimeout(()=>{G=_t(l),K=l,y=1,P={type:"all",law:"all",artNum:""},vt(l),we(),_&&_.classList.add("hidden")},100)}else l.length===0&&(r.classList.remove("hidden"),a.classList.remove("hidden"),e.classList.remove("hidden"),o.classList.add("justify-center","pt-24"),o.classList.remove("pt-8"),S.classList.add("hidden","opacity-0"),S.innerHTML="")})}let P={type:"all",law:"all",artNum:""},ge=[],ee=[];function Re(){return JSON.parse(localStorage.getItem("article-favorites")||"[]")}function Se(n){return Re().includes(n)}function Fe(n){const s=Re(),l=s.indexOf(n);l>=0?s.splice(l,1):s.unshift(n),localStorage.setItem("article-favorites",JSON.stringify(s)),Xe()}function Xe(){const n=Re().length,s=Object.keys(Ne()).length;document.querySelectorAll("#nav-favorites, #mobile-nav-favorites").forEach(l=>{l&&(l.classList.toggle("hidden",n===0&&s===0),l.querySelectorAll(".fav-count").forEach(d=>d.textContent=n))})}function Ne(){return JSON.parse(localStorage.getItem("article-notes")||"{}")}function Le(n){return Ne()[n]||""}function Ye(n,s){const l=Ne();s.trim()?l[n]=s.trim():delete l[n],localStorage.setItem("article-notes",JSON.stringify(l))}function yt(n,s,l=!1){const d=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),c=n.map(p=>{const E=l?Le(p.id):"";return`
            <div style="margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #f0f0f0;page-break-inside:avoid;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:10px;font-weight:700;color:#9B2247;background:#fdf2f5;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.08em;">${p.ley_origen}</span>
                    ${p.titulo_nombre?`<span style="font-size:10px;color:#6b7280;">${p.titulo_nombre}</span>`:""}
                </div>
                <h3 style="font-size:15px;font-weight:700;color:#111;margin:0 0 8px;">${p.articulo_label}</h3>
                <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 ${E?"10px":"0"};">${p.texto.substring(0,800)}${p.texto.length>800?"…":""}</p>
                ${E?`<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-top:8px;">
                    <span style="font-size:10px;font-weight:700;color:#92400e;display:block;margin-bottom:4px;">📝 Mi nota</span>
                    <p style="font-size:12px;color:#78350f;margin:0;line-height:1.6;">${E}</p>
                </div>`:""}
            </div>`}).join(""),m=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <title>${s} — SENER</title>
        <style>
            body{font-family:'Noto Sans',Arial,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;color:#1f2937;}
            h1{font-size:22px;font-weight:700;color:#9B2247;margin-bottom:4px;}
            .meta{font-size:11px;color:#9ca3af;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #f3f4f6;}
            @media print{body{margin:16px;}h1{font-size:18px;}}
        </style></head><body>
        <h1>${s}</h1>
        <div class="meta">Secretaría de Energía · Gobierno de México · Exportado el ${d} · ${n.length} artículo${n.length!==1?"s":""}</div>
        ${c}
        </body></html>`,g=new Blob([m],{type:"text/html;charset=utf-8;"}),h=document.createElement("a");h.href=URL.createObjectURL(g),h.download=`${s.replace(/\s+/g,"_")}_${d.replace(/\s/g,"-")}.html`,h.click(),URL.revokeObjectURL(h.href)}function wt(n,s,l=!1){const d=["Ley","Artículo","Título","Texto",...l?["Nota personal"]:[]],c=n.map(p=>[`"${(p.ley_origen||"").replace(/"/g,'""')}"`,`"${(p.articulo_label||"").replace(/"/g,'""')}"`,`"${(p.titulo_nombre||"").replace(/"/g,'""')}"`,`"${(p.texto||"").replace(/"/g,'""')}"`,...l?[`"${Le(p.id).replace(/"/g,'""')}"`]:[]]),m=[d.join(","),...c.map(p=>p.join(","))].join(`
`),g=new Blob(["\uFEFF"+m],{type:"text/csv;charset=utf-8;"}),h=document.createElement("a");h.href=URL.createObjectURL(g),h.download=s,h.click(),URL.revokeObjectURL(h.href)}function Ke(){var m,g;Z(null),ne();const n=Re();r.classList.add("hidden"),a.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),S.classList.remove("hidden"),setTimeout(()=>S.classList.remove("opacity-0"),50);const s=document.getElementById("search-filters");if(s&&s.remove(),n.length===0){S.innerHTML='<div class="text-center py-16 text-gray-400 text-sm">No tienes artículos guardados aún.</div>';return}const l=n.map(h=>_e(h)).filter(Boolean);ge=l,S.innerHTML=`
            <div class="w-full mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 class="text-xl font-head font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        Mis Favoritos
                    </h2>
                    <p class="text-xs text-gray-400">${l.length} artículo${l.length!==1?"s":""} guardado${l.length!==1?"s":""}</p>
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
            ${l.map(h=>`
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer result-item" data-id="${h.id}">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${h.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 truncate max-w-[200px]">${h.titulo_nombre||""}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${h.articulo_label}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${h.texto.substring(0,300)}...</p>
            </div>
            `).join("")}
        `,document.querySelectorAll("#results-container .result-item").forEach(h=>{h.addEventListener("click",()=>he(h.dataset.id))});const d=document.getElementById("export-favs-btn"),c=document.getElementById("export-favs-menu");d&&c&&(d.addEventListener("click",h=>{h.stopPropagation(),c.classList.toggle("hidden")}),document.addEventListener("click",function h(p){!p.target.closest("#export-favs-btn")&&!p.target.closest("#export-favs-menu")&&(c.classList.add("hidden"),document.removeEventListener("click",h))})),(m=document.getElementById("export-favs-html"))==null||m.addEventListener("click",()=>{c==null||c.classList.add("hidden"),yt(l,"Mis Favoritos SENER",!1),b("¡Exportando HTML!","📄","bg-blue-600")}),(g=document.getElementById("export-favs-csv"))==null||g.addEventListener("click",()=>{c==null||c.classList.add("hidden"),wt(l,"favoritos_SENER.csv",!1),b("¡Exportando CSV!","📊","bg-green-700")})}function Ze(){var l,d;const n=document.getElementById("reading-controls");let s=document.getElementById("compare-bar");if(ee.length===0){s==null||s.remove(),n&&(n.classList.remove("bottom-16"),n.classList.add("bottom-6"));return}s||(s=document.createElement("div"),s.id="compare-bar",document.body.appendChild(s)),n&&(n.classList.remove("bottom-6"),n.classList.add("bottom-16")),s.className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl py-3 px-6 flex items-center justify-between",s.innerHTML=`
            <div class="flex items-center gap-3">
                <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                <span class="text-xs font-bold text-gray-700">${ee.length} de 2 seleccionados</span>
                ${ee.length<2?'<span class="text-xs text-gray-400">Selecciona un artículo más para comparar</span>':""}
            </div>
            <div class="flex items-center gap-2">
                <button id="compare-clear-btn" class="text-xs text-gray-400 hover:text-guinda transition-colors px-3 py-1.5">Limpiar</button>
                ${ee.length===2?'<button id="compare-go-btn" class="px-4 py-2 bg-guinda text-white text-xs font-bold rounded-full hover:bg-guinda/90 transition-colors">Comparar →</button>':""}
            </div>
        `,(l=document.getElementById("compare-clear-btn"))==null||l.addEventListener("click",()=>{var m;ee=[],Ze();const c=((m=document.getElementById("law-search-input"))==null?void 0:m.value.toLowerCase().trim())||"";ye(D.slice(0,50),c)}),(d=document.getElementById("compare-go-btn"))==null||d.addEventListener("click",()=>{kt(ee[0],ee[1])})}function kt(n,s){const l=_e(n),d=_e(s);if(!l||!d)return;const c=document.getElementById("compare-modal"),m=document.getElementById("compare-content"),g=document.getElementById("compare-panel");if(!c||!m)return;const h=w=>`
            <div class="flex flex-col">
                <div class="mb-4 p-3 bg-guinda/5 rounded-xl border border-guinda/10">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider block mb-1">${w.ley_origen}</span>
                    <h4 class="font-bold text-gray-800 text-sm mb-0.5">${w.articulo_label}</h4>
                    <span class="text-xs text-gray-400">${w.titulo_nombre||""} ${w.capitulo_nombre?"· "+w.capitulo_nombre:""}</span>
                </div>
                <div class="text-sm text-gray-700 font-serif leading-relaxed">
                    ${w.texto.split(`

`).map(x=>`<p class="mb-3">${x}</p>`).join("")}
                </div>
            </div>`;m.innerHTML=h(l)+h(d),c.classList.remove("hidden"),c.classList.add("flex"),setTimeout(()=>{g==null||g.classList.remove("scale-95","opacity-0"),g==null||g.classList.add("scale-100","opacity-100")},10);const p=document.getElementById("compare-share-btn"),E=document.getElementById("compare-share-menu"),Q=document.getElementById("compare-share-text-btn");p&&E&&(p.onclick=w=>{w.stopPropagation(),E.classList.toggle("hidden")},document.addEventListener("click",function w(x){x.target.closest("#compare-share-menu-wrapper")||(E.classList.add("hidden"),document.removeEventListener("click",w))})),Q&&(Q.onclick=()=>{E==null||E.classList.add("hidden"),Ct(l,d)})}function ze(){const n=document.getElementById("compare-modal"),s=document.getElementById("compare-panel");s==null||s.classList.remove("scale-100","opacity-100"),s==null||s.classList.add("scale-95","opacity-0"),setTimeout(()=>{n==null||n.classList.add("hidden"),n==null||n.classList.remove("flex")},300)}async function Lt(n){const s=document.createElement("canvas");s.width=800,s.height=500;const l=s.getContext("2d"),d=l.createLinearGradient(0,0,0,s.height);d.addColorStop(0,"#9B2247"),d.addColorStop(1,"#6b1532"),l.fillStyle=d,l.fillRect(0,0,s.width,s.height),l.beginPath(),l.arc(s.width-60,60,120,0,Math.PI*2),l.fillStyle="rgba(255,255,255,0.06)",l.fill(),l.fillStyle="rgba(255,255,255,0.15)",l.beginPath(),l.roundRect(40,40,20+l.measureText(n.ley_origen).width+16,28,14),l.fill(),l.fillStyle="#fff",l.font="bold 13px system-ui, sans-serif",l.fillText(n.ley_origen,56,59),l.fillStyle="#fff",l.font="bold 28px system-ui, sans-serif";const c=et(l,n.articulo_label,s.width-80);c.forEach((w,x)=>l.fillText(w,40,110+x*38));const m=110+c.length*38+16;l.strokeStyle="rgba(255,255,255,0.3)",l.lineWidth=1,l.beginPath(),l.moveTo(40,m),l.lineTo(s.width-40,m),l.stroke();const g=m+24,h=s.height-g-60;l.fillStyle="rgba(255,255,255,0.88)",l.font="16px Georgia, serif";const p=n.texto.replace(/\s+/g," ").trim().substring(0,500),E=et(l,p,s.width-80);let Q=0;for(const w of E){if(Q*24>h){l.fillStyle="rgba(255,255,255,0.5)",l.font="13px system-ui, sans-serif",l.fillText("...",40,g+Q*24);break}l.fillText(w,40,g+Q*24),Q++}return l.fillStyle="rgba(255,255,255,0.35)",l.fillRect(0,s.height-44,s.width,44),l.fillStyle="rgba(255,255,255,0.8)",l.font="12px system-ui, sans-serif",l.fillText("Buscador de Leyes Energéticas · SENER",40,s.height-16),s.toDataURL("image/png")}function et(n,s,l,d){const c=s.split(" "),m=[];let g="";for(const h of c){const p=g?g+" "+h:h;n.measureText(p).width>l&&g?(m.push(g),g=h):g=p}return g&&m.push(g),m}function Et(n){const s=`📋 *${n.articulo_label}*
🏛️ ${n.ley_origen}

${n.texto.substring(0,800)}${n.texto.length>800?"...":""}`,l=`https://wa.me/?text=${encodeURIComponent(s)}`;window.open(l,"_blank")}async function $t(n){const s=await Lt(n),l=await(await fetch(s)).blob(),d=new File([l],"articulo.png",{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[d]}))await navigator.share({title:n.articulo_label,text:`${n.articulo_label} · ${n.ley_origen}`,files:[d]});else{const c=document.createElement("a");c.href=s,c.download=`${n.articulo_label.replace(/\s+/g,"_")}.png`,c.click()}}function Ct(n,s){const l=`⚖️ *Comparación de Artículos*

📋 *${n.articulo_label}* – ${n.ley_origen}
${n.texto.substring(0,400)}${n.texto.length>400?"...":""}

📋 *${s.articulo_label}* – ${s.ley_origen}
${s.texto.substring(0,400)}${s.texto.length>400?"...":""}`,d=`https://wa.me/?text=${encodeURIComponent(l)}`;window.open(d,"_blank")}function De(n,s){const l=`${location.origin}${location.pathname}#art-${encodeURIComponent(n.id)}`,d=`${n.articulo_label} · ${n.ley_origen}`,c=`📋 *${n.articulo_label}*
🏛️ ${n.ley_origen}

${n.texto.substring(0,500)}${n.texto.length>500?"...":""}

${l}`,m=`${n.articulo_label} · ${n.ley_origen} — Marco Legal Energético SENER`,g={telegram:`https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent(d)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(m)}&url=${encodeURIComponent(l)}`,email:`mailto:?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(c)}`};g[s]&&window.open(g[s],"_blank")}function Oe(n,s){const l=`${location.origin}${location.pathname}#ley-${encodeURIComponent(n.id)}`,d=n.titulo,c=n.resumen?n.resumen.split(`

`)[0].substring(0,400):`${n.articulos} artículos`,m=`🏛️ *${n.titulo}*
📅 Publicado: ${n.fecha}
📖 ${n.articulos} artículos

${c}

${l}`,g=`${n.titulo} — Marco Legal Energético SENER`,h={whatsapp:`https://wa.me/?text=${encodeURIComponent(m)}`,telegram:`https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent(d)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(g)}&url=${encodeURIComponent(l)}`,email:`mailto:?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(m)}`};h[s]&&window.open(h[s],"_blank")}function tt(){var h;Z(null),ne(),r.classList.add("hidden"),a.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),S.classList.remove("hidden"),setTimeout(()=>S.classList.remove("opacity-0"),50);const n=document.getElementById("search-filters");if(n&&n.remove(),z.length===0){S.innerHTML='<div class="text-center py-16 text-gray-400">Cargando datos...</div>';return}const s=z.reduce((p,E)=>p+E.articulos,0),l=z.filter(p=>p.titulo.toLowerCase().startsWith("ley")),d=z.filter(p=>p.titulo.toLowerCase().startsWith("reglamento")),c=z.filter(p=>!p.titulo.toLowerCase().startsWith("ley")&&!p.titulo.toLowerCase().startsWith("reglamento")),m=[...z].sort((p,E)=>E.articulos-p.articulos),g=((h=m[0])==null?void 0:h.articulos)||1;S.innerHTML=`
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Estadísticas del Marco Jurídico</h2>
                <p class="text-sm text-gray-400 font-light">Resumen del corpus legal indexado en el sistema.</p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-guinda block">${z.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Total Leyes</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-guinda block">${s.toLocaleString("es-MX")}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Artículos</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-emerald-700 block">${l.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Leyes Fed.</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-amber-700 block">${d.length+c.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Regl./Otros</span>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                <h3 class="font-bold text-gray-800 text-sm mb-5 flex items-center gap-2">
                    <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    Artículos por Ley
                </h3>
                <div class="space-y-3">
                    ${m.map(p=>{const E=p.titulo.toLowerCase().startsWith("ley"),Q=p.titulo.toLowerCase().startsWith("reglamento"),w=E?"#9B2247":Q?"#1E5B4F":"#A57F2C",x=Math.round(p.articulos/g*100);return`
                        <div class="flex items-center gap-3 cursor-pointer group stat-law-row" data-titulo="${p.titulo.replace(/"/g,"&quot;")}">
                            <div class="text-xs text-gray-500 w-44 truncate flex-shrink-0 group-hover:text-guinda transition-colors" title="${p.titulo}">${p.titulo}</div>
                            <div class="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500" style="width:${x}%; background:${w};"></div>
                            </div>
                            <span class="text-xs font-bold text-gray-500 w-8 text-right flex-shrink-0">${p.articulos}</span>
                        </div>`}).join("")}
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                ${[{label:"Leyes Federales",items:l,textClass:"text-guinda",bgClass:"bg-guinda/5"},{label:"Reglamentos",items:d,textClass:"text-emerald-700",bgClass:"bg-emerald-50"},{label:"Acuerdos y Otros",items:c,textClass:"text-amber-700",bgClass:"bg-amber-50"}].map(p=>`
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-bold ${p.textClass} uppercase tracking-widest">${p.label}</span>
                            <span class="text-xs ${p.bgClass} ${p.textClass} font-bold px-2 py-0.5 rounded-full">${p.items.length}</span>
                        </div>
                        <div class="space-y-1.5">
                            ${p.items.map(E=>`
                                <div class="text-xs text-gray-500 truncate hover:text-guinda cursor-pointer transition-colors stat-law-row" data-titulo="${E.titulo.replace(/"/g,"&quot;")}" title="${E.titulo}">${E.titulo}</div>
                            `).join("")}
                        </div>
                    </div>
                `).join("")}
            </div>
        `,document.querySelectorAll(".stat-law-row").forEach(p=>{p.addEventListener("click",()=>{const E=z.find(Q=>Q.titulo===p.dataset.titulo);E&&Ie(E)})})}function we(){var p,E,Q;if(!S)return;let n=G;if(P.type!=="all"&&(n=n.filter(w=>P.type==="ley"?w.ley_origen.toLowerCase().includes("ley"):P.type==="reglamento"?w.ley_origen.toLowerCase().includes("reglamento"):!w.ley_origen.toLowerCase().includes("ley")&&!w.ley_origen.toLowerCase().includes("reglamento"))),P.law!=="all"&&(n=n.filter(w=>w.ley_origen===P.law)),P.artNum){const w=parseInt(P.artNum);n=n.filter(x=>{const $=x.articulo_label.match(/\d+/);return $&&parseInt($[0])===w})}const s=n,l=K,d=document.getElementById("search-filters");if(d&&d.remove(),G.length>0){const w=document.createElement("div");w.id="search-filters",w.className="flex flex-col items-center gap-2 mb-6 animate-fade-in-up";const x=[...new Set(G.map(V=>V.ley_origen))].sort();w.innerHTML=`
                <div class="flex flex-wrap justify-center gap-2">
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${P.type==="all"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="all">Todos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${P.type==="ley"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="ley">Leyes</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${P.type==="reglamento"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="reglamento">Reglamentos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${P.type==="otros"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="otros">Otros</button>
                </div>
                <div class="flex items-center gap-2 flex-wrap justify-center">
                    ${x.length>1?`
                    <select id="law-filter-select" class="text-xs border rounded-full px-4 py-1.5 focus:outline-none bg-white cursor-pointer transition-colors ${P.law!=="all"?"border-guinda text-guinda":"border-gray-200 text-gray-500 hover:border-guinda"}">
                        <option value="all">Todas las leyes</option>
                        ${x.map(V=>`<option value="${V}" ${P.law===V?"selected":""}>${V}</option>`).join("")}
                    </select>
                    `:""}
                    <div class="relative flex items-center">
                        <svg class="absolute left-3 w-3 h-3 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
                        <input type="number" id="art-number-filter" min="1" placeholder="Nº artículo"
                            value="${P.artNum}"
                            class="text-xs border rounded-full pl-8 pr-3 py-1.5 w-28 focus:outline-none bg-white transition-colors ${P.artNum?"border-guinda text-guinda":"border-gray-200 text-gray-500 hover:border-guinda"} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                    </div>
                    ${P.type!=="all"||P.law!=="all"||P.artNum?`
                    <button id="clear-all-filters" class="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-full border border-red-100 hover:border-red-200 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        Limpiar filtros
                    </button>`:""}
                </div>
            `,S.parentNode.insertBefore(w,S),w.querySelectorAll(".filter-btn").forEach(V=>{V.addEventListener("click",oe=>{P.type=oe.target.dataset.type,y=1,we()})});const $=document.getElementById("law-filter-select");$&&$.addEventListener("change",V=>{P.law=V.target.value,y=1,we()});const X=document.getElementById("art-number-filter");if(X){let V;X.addEventListener("input",oe=>{clearTimeout(V),V=setTimeout(()=>{P.artNum=oe.target.value.trim(),y=1,we()},400)})}(p=document.getElementById("clear-all-filters"))==null||p.addEventListener("click",()=>{P={type:"all",law:"all",artNum:""},y=1,we()})}if(s.length===0){const w=P.type!=="all"||P.law!=="all";S.innerHTML=`
                <div class="text-center py-16 px-4">
                    <div class="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <h3 class="font-head text-lg font-bold text-gray-700 mb-2">
                        ${w?"Sin resultados con los filtros actuales":`Sin resultados para "<span class="text-guinda">${l}</span>"`}
                    </h3>
                    <p class="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                        ${w?"Prueba cambiando o eliminando los filtros aplicados.":"Intenta con otras palabras, un artículo específico o explora directamente las leyes."}
                    </p>
                    ${w?"":`
                    <div class="flex flex-wrap gap-2 justify-center mb-4">
                        ${["Transmisión","Generación","CENACE","Distribución","Tarifas","Permisos"].map($=>`<button class="empty-suggestion px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500 hover:bg-guinda/5 hover:border-guinda/30 hover:text-guinda transition-all">${$}</button>`).join("")}
                    </div>
                    <button id="empty-browse-laws" class="text-xs font-semibold text-guinda hover:text-guinda/70 transition-colors underline underline-offset-2">Explorar todas las leyes →</button>
                    `}
                </div>`,S.querySelectorAll(".empty-suggestion").forEach($=>{$.addEventListener("click",()=>{C&&(C.value=$.textContent,C.dispatchEvent(new Event("input")))})}),(E=document.getElementById("empty-browse-laws"))==null||E.addEventListener("click",()=>ke());const x=document.getElementById("results-container").nextElementSibling;x&&x.classList.contains("pagination-nav")&&x.remove();return}const c=(y-1)*O,m=c+O,g=s.slice(c,m),h=((Q=s[0])==null?void 0:Q.score)||1;ge=s,S.innerHTML=g.map(w=>{const x=Qe(w.texto.substring(0,300)+"...",l),$=Qe(w.articulo_label,l),X=xt(w.score,h),V=Se(w.id)?'<svg class="w-4 h-4 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';return`
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer result-item" data-id="${w.id}">
                <button class="bookmark-card-btn absolute top-3 right-3 p-1.5 text-gray-300 hover:text-guinda transition-colors rounded-full hover:bg-guinda/5 z-10" data-id="${w.id}" title="Guardar en favoritos">${V}</button>
                <div class="flex items-center gap-2 mb-2 flex-wrap pr-8">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${w.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 font-medium tracking-wide truncate max-w-[200px]">${w.titulo_nombre||""}</span>
                    <span class="ml-auto">${X}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${$}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${x}</p>
            </div>
            `}).join(""),ue(s.length,"results-container",we),document.querySelectorAll(".result-item").forEach(w=>{w.addEventListener("click",x=>{x.target.closest(".bookmark-card-btn")||he(w.dataset.id)})}),document.querySelectorAll(".bookmark-card-btn").forEach(w=>{w.addEventListener("click",x=>{x.stopPropagation(),Fe(w.dataset.id),we()})})}function he(n){const s=_e(n);if(!s)return;k.textContent=s.ley_origen,L.textContent=s.articulo_label,k.onclick=()=>{const A=z.find(ie=>ie.titulo===s.ley_origen);A&&(Pe(),setTimeout(()=>Ie(A),310))};let l=s.texto.replace(/\r\n/g,`
`).replace(/\n\s*\n/g,`

`).replace(/([a-z,;])\n([a-z])/g,"$1 $2");const d=A=>K?Qe(A,K):A;f.innerHTML=`
            <div class="mb-6 pb-6 border-b border-gray-100">
                <div class="text-[10px] font-bold text-guinda uppercase tracking-widest mb-2 flex items-center gap-1.5 bg-guinda/5 w-fit px-2 py-1 rounded-full">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Ubicación en el documento
                </div>
                <div class="text-sm text-gray-700 font-medium">
                    <span class="block mb-1 text-gray-500 text-xs uppercase tracking-wide">Título / Capítulo</span>
                    ${s.titulo_nombre}
                    <span class="text-gray-300 mx-2">|</span>
                    ${s.capitulo_nombre}
                </div>
            </div>
            ${K?`
            <div class="mb-4 flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                Término resaltado: <mark class="hl">${K}</mark>
            </div>`:""}
            <div class="prose prose-sm max-w-none text-gray-800 leading-relaxed font-serif text-justify">
                ${l.split(`

`).map(A=>`<p class="mb-4">${d(A)}</p>`).join("")}
            </div>
        `;const c=ge.findIndex(A=>A.id===n),m=ge.length,g=document.getElementById("modal-prev-btn"),h=document.getElementById("modal-next-btn"),p=document.getElementById("modal-nav-counter");g&&(g.disabled=c<=0,g.onclick=()=>{c>0&&he(ge[c-1].id)}),h&&(h.disabled=c<0||c>=m-1,h.onclick=()=>{c<m-1&&he(ge[c+1].id)}),p&&(p.textContent=c>=0?`${c+1}/${m}`:"");const E=document.getElementById("modal-bookmark-btn");if(E){const A=Se(n);E.innerHTML=A?'<svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>',E.onclick=()=>{Fe(n),he(n)}}const Q=document.getElementById("copy-btn");Q&&(Q.onclick=()=>{navigator.clipboard.writeText(f.innerText).then(()=>{b("¡Texto copiado!","📋")})});const w=document.getElementById("share-btn"),x=document.getElementById("share-menu");document.getElementById("share-text-btn"),document.getElementById("share-image-btn"),w&&x&&(w.onclick=A=>{A.stopPropagation(),x.classList.toggle("hidden")},document.addEventListener("click",function A(ie){ie.target.closest("#share-menu-wrapper")||(x.classList.add("hidden"),document.removeEventListener("click",A))}));const $=Le(n);f.innerHTML+=`
            <div class="mt-8 pt-6 border-t border-gray-100" id="notes-section">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Mis notas
                    </span>
                    <button id="delete-note-btn" class="text-[10px] text-red-300 hover:text-red-500 transition-colors ${$?"":"hidden"}" aria-label="Borrar nota">Borrar</button>
                </div>
                <textarea id="article-note-input"
                    placeholder="Escribe tus anotaciones sobre este artículo..."
                    class="w-full text-xs text-gray-700 border border-amber-100 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all bg-amber-50/40 leading-relaxed font-light"
                    rows="3" aria-label="Notas del artículo">${$}</textarea>
                <div class="flex items-center justify-between mt-2">
                    <span id="note-saved-indicator" class="text-[10px] text-amber-500 flex items-center gap-1 ${$?"":"invisible"}">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        Guardada
                    </span>
                    <button id="save-note-btn" class="text-xs font-semibold text-guinda hover:text-guinda/70 transition-colors px-3 py-1.5 bg-guinda/5 rounded-lg hover:bg-guinda/10" aria-label="Guardar nota">Guardar</button>
                </div>
            </div>
        `;const X=document.getElementById("article-note-input"),V=document.getElementById("save-note-btn"),oe=document.getElementById("delete-note-btn"),se=document.getElementById("note-saved-indicator");V&&X&&V.addEventListener("click",()=>{Ye(n,X.value),b("¡Nota guardada!","📝","bg-amber-600"),se==null||se.classList.remove("invisible"),oe&&oe.classList.toggle("hidden",!X.value.trim())}),oe&&X&&oe.addEventListener("click",()=>{Ye(n,""),X.value="",se==null||se.classList.add("invisible"),oe.classList.add("hidden"),b("Nota eliminada","🗑️","bg-gray-600")});const Be=document.getElementById("cite-btn");Be&&(Be.onclick=()=>{const A=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),ie=`${location.origin}${location.pathname}#art-${encodeURIComponent(n)}`,fe=`${s.articulo_label} de la ${s.ley_origen}${s.fecha_publicacion?", publicada el "+s.fecha_publicacion:""}. Secretaría de Energía, Gobierno de México. Consultado el ${A}. Disponible en: ${ie}`;navigator.clipboard.writeText(fe).then(()=>b("¡Cita copiada!","📖","bg-guinda"))}),Object.entries({"share-text-btn":()=>Et(s),"share-image-btn":()=>$t(s),"share-telegram-btn":()=>De(s,"telegram"),"share-twitter-btn":()=>De(s,"twitter"),"share-email-btn":()=>De(s,"email")}).forEach(([A,ie])=>{const fe=document.getElementById(A);fe&&(fe.onclick=()=>{x==null||x.classList.add("hidden"),ie()})}),Z(`#art-${encodeURIComponent(n)}`),i.classList.remove("hidden"),i.classList.add("flex");const Te=document.getElementById("share-link-btn");Te&&(Te.onclick=()=>{x==null||x.classList.add("hidden");const A=`${location.origin}${location.pathname}#art-${encodeURIComponent(n)}`;navigator.clipboard.writeText(A).then(()=>b("¡Enlace copiado!","🔗","bg-blue-600"))}),setTimeout(()=>{u.classList.remove("scale-95","opacity-0"),u.classList.add("scale-100","opacity-100")},10)}function Pe(){Z(null),u.classList.remove("scale-100","opacity-100"),u.classList.add("scale-95","opacity-0"),setTimeout(()=>{i.classList.add("hidden"),i.classList.remove("flex")},300)}function rt(){var s;let n=document.getElementById("keyboard-help-modal");if(n){n.remove();return}n=document.createElement("div"),n.id="keyboard-help-modal",n.className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",n.innerHTML=`
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
                <div class="flex items-center justify-between mb-5">
                    <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        Atajos de Teclado
                    </h3>
                    <button id="kbd-help-close" class="text-gray-400 hover:text-guinda transition-colors text-lg leading-none">×</button>
                </div>
                <div class="space-y-2.5 text-xs">
                    ${[["/","Enfocar el buscador"],["Esc","Cerrar modal / panel"],["← →","Artículo anterior / siguiente"],["?","Mostrar esta ayuda"],["f","Agregar/quitar de favoritos"],["c","Copiar texto del artículo"]].map(([l,d])=>`
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500">${d}</span>
                            <kbd class="bg-gray-100 border border-gray-200 rounded px-2 py-0.5 font-mono text-[11px] text-gray-700 shadow-sm">${l}</kbd>
                        </div>
                    `).join("")}
                </div>
                <div class="mt-5 pt-4 border-t border-gray-50 text-[10px] text-gray-400 text-center">
                    Presiona <kbd class="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px]">?</kbd> para abrir esta ayuda
                </div>
            </div>
        `,document.body.appendChild(n),n.addEventListener("click",l=>{l.target===n&&n.remove()}),(s=document.getElementById("kbd-help-close"))==null||s.addEventListener("click",()=>n.remove())}(it=document.getElementById("keyboard-help-btn"))==null||it.addEventListener("click",rt),document.addEventListener("keydown",n=>{var c,m,g,h;const s=n.target.tagName,l=s==="INPUT"||s==="TEXTAREA"||s==="SELECT"||n.target.isContentEditable,d=!i.classList.contains("hidden");if(n.key==="?"&&!l){n.preventDefault(),rt();return}if(n.key==="Escape"){const p=document.getElementById("keyboard-help-modal");if(p){p.remove();return}const E=document.getElementById("toc-panel");if(E&&!E.classList.contains("translate-y-full")){E.classList.add("translate-y-full"),document.body.style.overflow="";return}if(d){Pe();return}const Q=document.getElementById("compare-modal");if(Q&&!Q.classList.contains("hidden")){ze();return}return}if(n.key==="/"&&!l){n.preventDefault(),C&&(C.focus(),C.select());return}if(d&&!l){if(n.key==="ArrowRight"||n.key==="ArrowDown"){n.preventDefault(),(c=document.getElementById("modal-next-btn"))==null||c.click();return}if(n.key==="ArrowLeft"||n.key==="ArrowUp"){n.preventDefault(),(m=document.getElementById("modal-prev-btn"))==null||m.click();return}if(n.key==="f"||n.key==="F"){n.preventDefault(),(g=document.getElementById("modal-bookmark-btn"))==null||g.click();return}if((n.key==="c"||n.key==="C")&&!n.ctrlKey&&!n.metaKey){n.preventDefault(),(h=document.getElementById("copy-btn"))==null||h.click();return}}}),"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})}),I&&I.addEventListener("click",Pe),i==null||i.addEventListener("click",n=>{n.target===i&&Pe()}),j&&j.addEventListener("click",()=>{const n=f.innerText;navigator.clipboard.writeText(n).then(()=>{const s=j.innerHTML;j.innerHTML='<span class="text-verde font-bold">¡Copiado!</span>',setTimeout(()=>{j.innerHTML=s},2e3)})})}document.addEventListener("DOMContentLoaded",()=>{Qt(),Tt()});
