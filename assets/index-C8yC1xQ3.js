(function(){const B=document.createElement("link").relList;if(B&&B.supports&&B.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))e(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&e(a)}).observe(document,{childList:!0,subtree:!0});function t(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function e(n){if(n.ep)return;n.ep=!0;const o=t(n);fetch(n.href,o)}})();function jt(I){return I&&I.__esModule&&Object.prototype.hasOwnProperty.call(I,"default")?I.default:I}var yt={exports:{}};/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.9
 * Copyright (C) 2020 Oliver Nightingale
 * @license MIT
 */(function(I,B){(function(){var t=function(e){var n=new t.Builder;return n.pipeline.add(t.trimmer,t.stopWordFilter,t.stemmer),n.searchPipeline.add(t.stemmer),e.call(n,n),n.build()};t.version="2.3.9";/*!
 * lunr.utils
 * Copyright (C) 2020 Oliver Nightingale
 */t.utils={},t.utils.warn=function(e){return function(n){e.console&&console.warn&&console.warn(n)}}(this),t.utils.asString=function(e){return e==null?"":e.toString()},t.utils.clone=function(e){if(e==null)return e;for(var n=Object.create(null),o=Object.keys(e),a=0;a<o.length;a++){var i=o[a],p=e[i];if(Array.isArray(p)){n[i]=p.slice();continue}if(typeof p=="string"||typeof p=="number"||typeof p=="boolean"){n[i]=p;continue}throw new TypeError("clone is not deep and does not support nested objects")}return n},t.FieldRef=function(e,n,o){this.docRef=e,this.fieldName=n,this._stringValue=o},t.FieldRef.joiner="/",t.FieldRef.fromString=function(e){var n=e.indexOf(t.FieldRef.joiner);if(n===-1)throw"malformed field ref string";var o=e.slice(0,n),a=e.slice(n+1);return new t.FieldRef(a,o,e)},t.FieldRef.prototype.toString=function(){return this._stringValue==null&&(this._stringValue=this.fieldName+t.FieldRef.joiner+this.docRef),this._stringValue};/*!
 * lunr.Set
 * Copyright (C) 2020 Oliver Nightingale
 */t.Set=function(e){if(this.elements=Object.create(null),e){this.length=e.length;for(var n=0;n<this.length;n++)this.elements[e[n]]=!0}else this.length=0},t.Set.complete={intersect:function(e){return e},union:function(){return this},contains:function(){return!0}},t.Set.empty={intersect:function(){return this},union:function(e){return e},contains:function(){return!1}},t.Set.prototype.contains=function(e){return!!this.elements[e]},t.Set.prototype.intersect=function(e){var n,o,a,i=[];if(e===t.Set.complete)return this;if(e===t.Set.empty)return e;this.length<e.length?(n=this,o=e):(n=e,o=this),a=Object.keys(n.elements);for(var p=0;p<a.length;p++){var m=a[p];m in o.elements&&i.push(m)}return new t.Set(i)},t.Set.prototype.union=function(e){return e===t.Set.complete?t.Set.complete:e===t.Set.empty?this:new t.Set(Object.keys(this.elements).concat(Object.keys(e.elements)))},t.idf=function(e,n){var o=0;for(var a in e)a!="_index"&&(o+=Object.keys(e[a]).length);var i=(n-o+.5)/(o+.5);return Math.log(1+Math.abs(i))},t.Token=function(e,n){this.str=e||"",this.metadata=n||{}},t.Token.prototype.toString=function(){return this.str},t.Token.prototype.update=function(e){return this.str=e(this.str,this.metadata),this},t.Token.prototype.clone=function(e){return e=e||function(n){return n},new t.Token(e(this.str,this.metadata),this.metadata)};/*!
 * lunr.tokenizer
 * Copyright (C) 2020 Oliver Nightingale
 */t.tokenizer=function(e,n){if(e==null||e==null)return[];if(Array.isArray(e))return e.map(function(A){return new t.Token(t.utils.asString(A).toLowerCase(),t.utils.clone(n))});for(var o=e.toString().toLowerCase(),a=o.length,i=[],p=0,m=0;p<=a;p++){var $=o.charAt(p),L=p-m;if($.match(t.tokenizer.separator)||p==a){if(L>0){var S=t.utils.clone(n)||{};S.position=[m,L],S.index=i.length,i.push(new t.Token(o.slice(m,p),S))}m=p+1}}return i},t.tokenizer.separator=/[\s\-]+/;/*!
 * lunr.Pipeline
 * Copyright (C) 2020 Oliver Nightingale
 */t.Pipeline=function(){this._stack=[]},t.Pipeline.registeredFunctions=Object.create(null),t.Pipeline.registerFunction=function(e,n){n in this.registeredFunctions&&t.utils.warn("Overwriting existing registered function: "+n),e.label=n,t.Pipeline.registeredFunctions[e.label]=e},t.Pipeline.warnIfFunctionNotRegistered=function(e){var n=e.label&&e.label in this.registeredFunctions;n||t.utils.warn(`Function is not registered with pipeline. This may cause problems when serialising the index.
`,e)},t.Pipeline.load=function(e){var n=new t.Pipeline;return e.forEach(function(o){var a=t.Pipeline.registeredFunctions[o];if(a)n.add(a);else throw new Error("Cannot load unregistered function: "+o)}),n},t.Pipeline.prototype.add=function(){var e=Array.prototype.slice.call(arguments);e.forEach(function(n){t.Pipeline.warnIfFunctionNotRegistered(n),this._stack.push(n)},this)},t.Pipeline.prototype.after=function(e,n){t.Pipeline.warnIfFunctionNotRegistered(n);var o=this._stack.indexOf(e);if(o==-1)throw new Error("Cannot find existingFn");o=o+1,this._stack.splice(o,0,n)},t.Pipeline.prototype.before=function(e,n){t.Pipeline.warnIfFunctionNotRegistered(n);var o=this._stack.indexOf(e);if(o==-1)throw new Error("Cannot find existingFn");this._stack.splice(o,0,n)},t.Pipeline.prototype.remove=function(e){var n=this._stack.indexOf(e);n!=-1&&this._stack.splice(n,1)},t.Pipeline.prototype.run=function(e){for(var n=this._stack.length,o=0;o<n;o++){for(var a=this._stack[o],i=[],p=0;p<e.length;p++){var m=a(e[p],p,e);if(!(m==null||m===""))if(Array.isArray(m))for(var $=0;$<m.length;$++)i.push(m[$]);else i.push(m)}e=i}return e},t.Pipeline.prototype.runString=function(e,n){var o=new t.Token(e,n);return this.run([o]).map(function(a){return a.toString()})},t.Pipeline.prototype.reset=function(){this._stack=[]},t.Pipeline.prototype.toJSON=function(){return this._stack.map(function(e){return t.Pipeline.warnIfFunctionNotRegistered(e),e.label})};/*!
 * lunr.Vector
 * Copyright (C) 2020 Oliver Nightingale
 */t.Vector=function(e){this._magnitude=0,this.elements=e||[]},t.Vector.prototype.positionForIndex=function(e){if(this.elements.length==0)return 0;for(var n=0,o=this.elements.length/2,a=o-n,i=Math.floor(a/2),p=this.elements[i*2];a>1&&(p<e&&(n=i),p>e&&(o=i),p!=e);)a=o-n,i=n+Math.floor(a/2),p=this.elements[i*2];if(p==e||p>e)return i*2;if(p<e)return(i+1)*2},t.Vector.prototype.insert=function(e,n){this.upsert(e,n,function(){throw"duplicate index"})},t.Vector.prototype.upsert=function(e,n,o){this._magnitude=0;var a=this.positionForIndex(e);this.elements[a]==e?this.elements[a+1]=o(this.elements[a+1],n):this.elements.splice(a,0,e,n)},t.Vector.prototype.magnitude=function(){if(this._magnitude)return this._magnitude;for(var e=0,n=this.elements.length,o=1;o<n;o+=2){var a=this.elements[o];e+=a*a}return this._magnitude=Math.sqrt(e)},t.Vector.prototype.dot=function(e){for(var n=0,o=this.elements,a=e.elements,i=o.length,p=a.length,m=0,$=0,L=0,S=0;L<i&&S<p;)m=o[L],$=a[S],m<$?L+=2:m>$?S+=2:m==$&&(n+=o[L+1]*a[S+1],L+=2,S+=2);return n},t.Vector.prototype.similarity=function(e){return this.dot(e)/this.magnitude()||0},t.Vector.prototype.toArray=function(){for(var e=new Array(this.elements.length/2),n=1,o=0;n<this.elements.length;n+=2,o++)e[o]=this.elements[n];return e},t.Vector.prototype.toJSON=function(){return this.elements};/*!
 * lunr.stemmer
 * Copyright (C) 2020 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */t.stemmer=function(){var e={ational:"ate",tional:"tion",enci:"ence",anci:"ance",izer:"ize",bli:"ble",alli:"al",entli:"ent",eli:"e",ousli:"ous",ization:"ize",ation:"ate",ator:"ate",alism:"al",iveness:"ive",fulness:"ful",ousness:"ous",aliti:"al",iviti:"ive",biliti:"ble",logi:"log"},n={icate:"ic",ative:"",alize:"al",iciti:"ic",ical:"ic",ful:"",ness:""},o="[^aeiou]",a="[aeiouy]",i=o+"[^aeiouy]*",p=a+"[aeiou]*",m="^("+i+")?"+p+i,$="^("+i+")?"+p+i+"("+p+")?$",L="^("+i+")?"+p+i+p+i,S="^("+i+")?"+a,A=new RegExp(m),j=new RegExp(L),U=new RegExp($),D=new RegExp(S),q=/^(.+?)(ss|i)es$/,T=/^(.+?)([^s])s$/,_=/^(.+?)eed$/,Y=/^(.+?)(ed|ing)$/,W=/.$/,oe=/(at|bl|iz)$/,ue=new RegExp("([^aeiouylsz])\\1$"),pe=new RegExp("^"+i+a+"[^aeiouwxy]$"),ge=/^(.+?[^aeiou])y$/,ae=/^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/,V=/^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/,H=/^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/,Le=/^(.+?)(s|t)(ion)$/,de=/^(.+?)e$/,Ee=/ll$/,$e=new RegExp("^"+i+a+"[^aeiouwxy]$"),te=function(v){var O,Z,X,k,P,he,ee;if(v.length<3)return v;if(X=v.substr(0,1),X=="y"&&(v=X.toUpperCase()+v.substr(1)),k=q,P=T,k.test(v)?v=v.replace(k,"$1$2"):P.test(v)&&(v=v.replace(P,"$1$2")),k=_,P=Y,k.test(v)){var F=k.exec(v);k=A,k.test(F[1])&&(k=W,v=v.replace(k,""))}else if(P.test(v)){var F=P.exec(v);O=F[1],P=D,P.test(O)&&(v=O,P=oe,he=ue,ee=pe,P.test(v)?v=v+"e":he.test(v)?(k=W,v=v.replace(k,"")):ee.test(v)&&(v=v+"e"))}if(k=ge,k.test(v)){var F=k.exec(v);O=F[1],v=O+"i"}if(k=ae,k.test(v)){var F=k.exec(v);O=F[1],Z=F[2],k=A,k.test(O)&&(v=O+e[Z])}if(k=V,k.test(v)){var F=k.exec(v);O=F[1],Z=F[2],k=A,k.test(O)&&(v=O+n[Z])}if(k=H,P=Le,k.test(v)){var F=k.exec(v);O=F[1],k=j,k.test(O)&&(v=O)}else if(P.test(v)){var F=P.exec(v);O=F[1]+F[2],P=j,P.test(O)&&(v=O)}if(k=de,k.test(v)){var F=k.exec(v);O=F[1],k=j,P=U,he=$e,(k.test(O)||P.test(O)&&!he.test(O))&&(v=O)}return k=Ee,P=j,k.test(v)&&P.test(v)&&(k=W,v=v.replace(k,"")),X=="y"&&(v=X.toLowerCase()+v.substr(1)),v};return function(be){return be.update(te)}}(),t.Pipeline.registerFunction(t.stemmer,"stemmer");/*!
 * lunr.stopWordFilter
 * Copyright (C) 2020 Oliver Nightingale
 */t.generateStopWordFilter=function(e){var n=e.reduce(function(o,a){return o[a]=a,o},{});return function(o){if(o&&n[o.toString()]!==o.toString())return o}},t.stopWordFilter=t.generateStopWordFilter(["a","able","about","across","after","all","almost","also","am","among","an","and","any","are","as","at","be","because","been","but","by","can","cannot","could","dear","did","do","does","either","else","ever","every","for","from","get","got","had","has","have","he","her","hers","him","his","how","however","i","if","in","into","is","it","its","just","least","let","like","likely","may","me","might","most","must","my","neither","no","nor","not","of","off","often","on","only","or","other","our","own","rather","said","say","says","she","should","since","so","some","than","that","the","their","them","then","there","these","they","this","tis","to","too","twas","us","wants","was","we","were","what","when","where","which","while","who","whom","why","will","with","would","yet","you","your"]),t.Pipeline.registerFunction(t.stopWordFilter,"stopWordFilter");/*!
 * lunr.trimmer
 * Copyright (C) 2020 Oliver Nightingale
 */t.trimmer=function(e){return e.update(function(n){return n.replace(/^\W+/,"").replace(/\W+$/,"")})},t.Pipeline.registerFunction(t.trimmer,"trimmer");/*!
 * lunr.TokenSet
 * Copyright (C) 2020 Oliver Nightingale
 */t.TokenSet=function(){this.final=!1,this.edges={},this.id=t.TokenSet._nextId,t.TokenSet._nextId+=1},t.TokenSet._nextId=1,t.TokenSet.fromArray=function(e){for(var n=new t.TokenSet.Builder,o=0,a=e.length;o<a;o++)n.insert(e[o]);return n.finish(),n.root},t.TokenSet.fromClause=function(e){return"editDistance"in e?t.TokenSet.fromFuzzyString(e.term,e.editDistance):t.TokenSet.fromString(e.term)},t.TokenSet.fromFuzzyString=function(e,n){for(var o=new t.TokenSet,a=[{node:o,editsRemaining:n,str:e}];a.length;){var i=a.pop();if(i.str.length>0){var p=i.str.charAt(0),m;p in i.node.edges?m=i.node.edges[p]:(m=new t.TokenSet,i.node.edges[p]=m),i.str.length==1&&(m.final=!0),a.push({node:m,editsRemaining:i.editsRemaining,str:i.str.slice(1)})}if(i.editsRemaining!=0){if("*"in i.node.edges)var $=i.node.edges["*"];else{var $=new t.TokenSet;i.node.edges["*"]=$}if(i.str.length==0&&($.final=!0),a.push({node:$,editsRemaining:i.editsRemaining-1,str:i.str}),i.str.length>1&&a.push({node:i.node,editsRemaining:i.editsRemaining-1,str:i.str.slice(1)}),i.str.length==1&&(i.node.final=!0),i.str.length>=1){if("*"in i.node.edges)var L=i.node.edges["*"];else{var L=new t.TokenSet;i.node.edges["*"]=L}i.str.length==1&&(L.final=!0),a.push({node:L,editsRemaining:i.editsRemaining-1,str:i.str.slice(1)})}if(i.str.length>1){var S=i.str.charAt(0),A=i.str.charAt(1),j;A in i.node.edges?j=i.node.edges[A]:(j=new t.TokenSet,i.node.edges[A]=j),i.str.length==1&&(j.final=!0),a.push({node:j,editsRemaining:i.editsRemaining-1,str:S+i.str.slice(2)})}}}return o},t.TokenSet.fromString=function(e){for(var n=new t.TokenSet,o=n,a=0,i=e.length;a<i;a++){var p=e[a],m=a==i-1;if(p=="*")n.edges[p]=n,n.final=m;else{var $=new t.TokenSet;$.final=m,n.edges[p]=$,n=$}}return o},t.TokenSet.prototype.toArray=function(){for(var e=[],n=[{prefix:"",node:this}];n.length;){var o=n.pop(),a=Object.keys(o.node.edges),i=a.length;o.node.final&&(o.prefix.charAt(0),e.push(o.prefix));for(var p=0;p<i;p++){var m=a[p];n.push({prefix:o.prefix.concat(m),node:o.node.edges[m]})}}return e},t.TokenSet.prototype.toString=function(){if(this._str)return this._str;for(var e=this.final?"1":"0",n=Object.keys(this.edges).sort(),o=n.length,a=0;a<o;a++){var i=n[a],p=this.edges[i];e=e+i+p.id}return e},t.TokenSet.prototype.intersect=function(e){for(var n=new t.TokenSet,o=void 0,a=[{qNode:e,output:n,node:this}];a.length;){o=a.pop();for(var i=Object.keys(o.qNode.edges),p=i.length,m=Object.keys(o.node.edges),$=m.length,L=0;L<p;L++)for(var S=i[L],A=0;A<$;A++){var j=m[A];if(j==S||S=="*"){var U=o.node.edges[j],D=o.qNode.edges[S],q=U.final&&D.final,T=void 0;j in o.output.edges?(T=o.output.edges[j],T.final=T.final||q):(T=new t.TokenSet,T.final=q,o.output.edges[j]=T),a.push({qNode:D,output:T,node:U})}}}return n},t.TokenSet.Builder=function(){this.previousWord="",this.root=new t.TokenSet,this.uncheckedNodes=[],this.minimizedNodes={}},t.TokenSet.Builder.prototype.insert=function(e){var n,o=0;if(e<this.previousWord)throw new Error("Out of order word insertion");for(var a=0;a<e.length&&a<this.previousWord.length&&e[a]==this.previousWord[a];a++)o++;this.minimize(o),this.uncheckedNodes.length==0?n=this.root:n=this.uncheckedNodes[this.uncheckedNodes.length-1].child;for(var a=o;a<e.length;a++){var i=new t.TokenSet,p=e[a];n.edges[p]=i,this.uncheckedNodes.push({parent:n,char:p,child:i}),n=i}n.final=!0,this.previousWord=e},t.TokenSet.Builder.prototype.finish=function(){this.minimize(0)},t.TokenSet.Builder.prototype.minimize=function(e){for(var n=this.uncheckedNodes.length-1;n>=e;n--){var o=this.uncheckedNodes[n],a=o.child.toString();a in this.minimizedNodes?o.parent.edges[o.char]=this.minimizedNodes[a]:(o.child._str=a,this.minimizedNodes[a]=o.child),this.uncheckedNodes.pop()}};/*!
 * lunr.Index
 * Copyright (C) 2020 Oliver Nightingale
 */t.Index=function(e){this.invertedIndex=e.invertedIndex,this.fieldVectors=e.fieldVectors,this.tokenSet=e.tokenSet,this.fields=e.fields,this.pipeline=e.pipeline},t.Index.prototype.search=function(e){return this.query(function(n){var o=new t.QueryParser(e,n);o.parse()})},t.Index.prototype.query=function(e){for(var n=new t.Query(this.fields),o=Object.create(null),a=Object.create(null),i=Object.create(null),p=Object.create(null),m=Object.create(null),$=0;$<this.fields.length;$++)a[this.fields[$]]=new t.Vector;e.call(n,n);for(var $=0;$<n.clauses.length;$++){var L=n.clauses[$],S=null,A=t.Set.empty;L.usePipeline?S=this.pipeline.runString(L.term,{fields:L.fields}):S=[L.term];for(var j=0;j<S.length;j++){var U=S[j];L.term=U;var D=t.TokenSet.fromClause(L),q=this.tokenSet.intersect(D).toArray();if(q.length===0&&L.presence===t.Query.presence.REQUIRED){for(var T=0;T<L.fields.length;T++){var _=L.fields[T];p[_]=t.Set.empty}break}for(var Y=0;Y<q.length;Y++)for(var W=q[Y],oe=this.invertedIndex[W],ue=oe._index,T=0;T<L.fields.length;T++){var _=L.fields[T],pe=oe[_],ge=Object.keys(pe),ae=W+"/"+_,V=new t.Set(ge);if(L.presence==t.Query.presence.REQUIRED&&(A=A.union(V),p[_]===void 0&&(p[_]=t.Set.complete)),L.presence==t.Query.presence.PROHIBITED){m[_]===void 0&&(m[_]=t.Set.empty),m[_]=m[_].union(V);continue}if(a[_].upsert(ue,L.boost,function(_e,Ce){return _e+Ce}),!i[ae]){for(var H=0;H<ge.length;H++){var Le=ge[H],de=new t.FieldRef(Le,_),Ee=pe[Le],$e;($e=o[de])===void 0?o[de]=new t.MatchData(W,_,Ee):$e.add(W,_,Ee)}i[ae]=!0}}}if(L.presence===t.Query.presence.REQUIRED)for(var T=0;T<L.fields.length;T++){var _=L.fields[T];p[_]=p[_].intersect(A)}}for(var te=t.Set.complete,be=t.Set.empty,$=0;$<this.fields.length;$++){var _=this.fields[$];p[_]&&(te=te.intersect(p[_])),m[_]&&(be=be.union(m[_]))}var v=Object.keys(o),O=[],Z=Object.create(null);if(n.isNegated()){v=Object.keys(this.fieldVectors);for(var $=0;$<v.length;$++){var de=v[$],X=t.FieldRef.fromString(de);o[de]=new t.MatchData}}for(var $=0;$<v.length;$++){var X=t.FieldRef.fromString(v[$]),k=X.docRef;if(te.contains(k)&&!be.contains(k)){var P=this.fieldVectors[X],he=a[X.fieldName].similarity(P),ee;if((ee=Z[k])!==void 0)ee.score+=he,ee.matchData.combine(o[X]);else{var F={ref:k,score:he,matchData:o[X]};Z[k]=F,O.push(F)}}}return O.sort(function(Ve,Me){return Me.score-Ve.score})},t.Index.prototype.toJSON=function(){var e=Object.keys(this.invertedIndex).sort().map(function(o){return[o,this.invertedIndex[o]]},this),n=Object.keys(this.fieldVectors).map(function(o){return[o,this.fieldVectors[o].toJSON()]},this);return{version:t.version,fields:this.fields,fieldVectors:n,invertedIndex:e,pipeline:this.pipeline.toJSON()}},t.Index.load=function(e){var n={},o={},a=e.fieldVectors,i=Object.create(null),p=e.invertedIndex,m=new t.TokenSet.Builder,$=t.Pipeline.load(e.pipeline);e.version!=t.version&&t.utils.warn("Version mismatch when loading serialised index. Current version of lunr '"+t.version+"' does not match serialized index '"+e.version+"'");for(var L=0;L<a.length;L++){var S=a[L],A=S[0],j=S[1];o[A]=new t.Vector(j)}for(var L=0;L<p.length;L++){var S=p[L],U=S[0],D=S[1];m.insert(U),i[U]=D}return m.finish(),n.fields=e.fields,n.fieldVectors=o,n.invertedIndex=i,n.tokenSet=m.root,n.pipeline=$,new t.Index(n)};/*!
 * lunr.Builder
 * Copyright (C) 2020 Oliver Nightingale
 */t.Builder=function(){this._ref="id",this._fields=Object.create(null),this._documents=Object.create(null),this.invertedIndex=Object.create(null),this.fieldTermFrequencies={},this.fieldLengths={},this.tokenizer=t.tokenizer,this.pipeline=new t.Pipeline,this.searchPipeline=new t.Pipeline,this.documentCount=0,this._b=.75,this._k1=1.2,this.termIndex=0,this.metadataWhitelist=[]},t.Builder.prototype.ref=function(e){this._ref=e},t.Builder.prototype.field=function(e,n){if(/\//.test(e))throw new RangeError("Field '"+e+"' contains illegal character '/'");this._fields[e]=n||{}},t.Builder.prototype.b=function(e){e<0?this._b=0:e>1?this._b=1:this._b=e},t.Builder.prototype.k1=function(e){this._k1=e},t.Builder.prototype.add=function(e,n){var o=e[this._ref],a=Object.keys(this._fields);this._documents[o]=n||{},this.documentCount+=1;for(var i=0;i<a.length;i++){var p=a[i],m=this._fields[p].extractor,$=m?m(e):e[p],L=this.tokenizer($,{fields:[p]}),S=this.pipeline.run(L),A=new t.FieldRef(o,p),j=Object.create(null);this.fieldTermFrequencies[A]=j,this.fieldLengths[A]=0,this.fieldLengths[A]+=S.length;for(var U=0;U<S.length;U++){var D=S[U];if(j[D]==null&&(j[D]=0),j[D]+=1,this.invertedIndex[D]==null){var q=Object.create(null);q._index=this.termIndex,this.termIndex+=1;for(var T=0;T<a.length;T++)q[a[T]]=Object.create(null);this.invertedIndex[D]=q}this.invertedIndex[D][p][o]==null&&(this.invertedIndex[D][p][o]=Object.create(null));for(var _=0;_<this.metadataWhitelist.length;_++){var Y=this.metadataWhitelist[_],W=D.metadata[Y];this.invertedIndex[D][p][o][Y]==null&&(this.invertedIndex[D][p][o][Y]=[]),this.invertedIndex[D][p][o][Y].push(W)}}}},t.Builder.prototype.calculateAverageFieldLengths=function(){for(var e=Object.keys(this.fieldLengths),n=e.length,o={},a={},i=0;i<n;i++){var p=t.FieldRef.fromString(e[i]),m=p.fieldName;a[m]||(a[m]=0),a[m]+=1,o[m]||(o[m]=0),o[m]+=this.fieldLengths[p]}for(var $=Object.keys(this._fields),i=0;i<$.length;i++){var L=$[i];o[L]=o[L]/a[L]}this.averageFieldLength=o},t.Builder.prototype.createFieldVectors=function(){for(var e={},n=Object.keys(this.fieldTermFrequencies),o=n.length,a=Object.create(null),i=0;i<o;i++){for(var p=t.FieldRef.fromString(n[i]),m=p.fieldName,$=this.fieldLengths[p],L=new t.Vector,S=this.fieldTermFrequencies[p],A=Object.keys(S),j=A.length,U=this._fields[m].boost||1,D=this._documents[p.docRef].boost||1,q=0;q<j;q++){var T=A[q],_=S[T],Y=this.invertedIndex[T]._index,W,oe,ue;a[T]===void 0?(W=t.idf(this.invertedIndex[T],this.documentCount),a[T]=W):W=a[T],oe=W*((this._k1+1)*_)/(this._k1*(1-this._b+this._b*($/this.averageFieldLength[m]))+_),oe*=U,oe*=D,ue=Math.round(oe*1e3)/1e3,L.insert(Y,ue)}e[p]=L}this.fieldVectors=e},t.Builder.prototype.createTokenSet=function(){this.tokenSet=t.TokenSet.fromArray(Object.keys(this.invertedIndex).sort())},t.Builder.prototype.build=function(){return this.calculateAverageFieldLengths(),this.createFieldVectors(),this.createTokenSet(),new t.Index({invertedIndex:this.invertedIndex,fieldVectors:this.fieldVectors,tokenSet:this.tokenSet,fields:Object.keys(this._fields),pipeline:this.searchPipeline})},t.Builder.prototype.use=function(e){var n=Array.prototype.slice.call(arguments,1);n.unshift(this),e.apply(this,n)},t.MatchData=function(e,n,o){for(var a=Object.create(null),i=Object.keys(o||{}),p=0;p<i.length;p++){var m=i[p];a[m]=o[m].slice()}this.metadata=Object.create(null),e!==void 0&&(this.metadata[e]=Object.create(null),this.metadata[e][n]=a)},t.MatchData.prototype.combine=function(e){for(var n=Object.keys(e.metadata),o=0;o<n.length;o++){var a=n[o],i=Object.keys(e.metadata[a]);this.metadata[a]==null&&(this.metadata[a]=Object.create(null));for(var p=0;p<i.length;p++){var m=i[p],$=Object.keys(e.metadata[a][m]);this.metadata[a][m]==null&&(this.metadata[a][m]=Object.create(null));for(var L=0;L<$.length;L++){var S=$[L];this.metadata[a][m][S]==null?this.metadata[a][m][S]=e.metadata[a][m][S]:this.metadata[a][m][S]=this.metadata[a][m][S].concat(e.metadata[a][m][S])}}}},t.MatchData.prototype.add=function(e,n,o){if(!(e in this.metadata)){this.metadata[e]=Object.create(null),this.metadata[e][n]=o;return}if(!(n in this.metadata[e])){this.metadata[e][n]=o;return}for(var a=Object.keys(o),i=0;i<a.length;i++){var p=a[i];p in this.metadata[e][n]?this.metadata[e][n][p]=this.metadata[e][n][p].concat(o[p]):this.metadata[e][n][p]=o[p]}},t.Query=function(e){this.clauses=[],this.allFields=e},t.Query.wildcard=new String("*"),t.Query.wildcard.NONE=0,t.Query.wildcard.LEADING=1,t.Query.wildcard.TRAILING=2,t.Query.presence={OPTIONAL:1,REQUIRED:2,PROHIBITED:3},t.Query.prototype.clause=function(e){return"fields"in e||(e.fields=this.allFields),"boost"in e||(e.boost=1),"usePipeline"in e||(e.usePipeline=!0),"wildcard"in e||(e.wildcard=t.Query.wildcard.NONE),e.wildcard&t.Query.wildcard.LEADING&&e.term.charAt(0)!=t.Query.wildcard&&(e.term="*"+e.term),e.wildcard&t.Query.wildcard.TRAILING&&e.term.slice(-1)!=t.Query.wildcard&&(e.term=""+e.term+"*"),"presence"in e||(e.presence=t.Query.presence.OPTIONAL),this.clauses.push(e),this},t.Query.prototype.isNegated=function(){for(var e=0;e<this.clauses.length;e++)if(this.clauses[e].presence!=t.Query.presence.PROHIBITED)return!1;return!0},t.Query.prototype.term=function(e,n){if(Array.isArray(e))return e.forEach(function(a){this.term(a,t.utils.clone(n))},this),this;var o=n||{};return o.term=e.toString(),this.clause(o),this},t.QueryParseError=function(e,n,o){this.name="QueryParseError",this.message=e,this.start=n,this.end=o},t.QueryParseError.prototype=new Error,t.QueryLexer=function(e){this.lexemes=[],this.str=e,this.length=e.length,this.pos=0,this.start=0,this.escapeCharPositions=[]},t.QueryLexer.prototype.run=function(){for(var e=t.QueryLexer.lexText;e;)e=e(this)},t.QueryLexer.prototype.sliceString=function(){for(var e=[],n=this.start,o=this.pos,a=0;a<this.escapeCharPositions.length;a++)o=this.escapeCharPositions[a],e.push(this.str.slice(n,o)),n=o+1;return e.push(this.str.slice(n,this.pos)),this.escapeCharPositions.length=0,e.join("")},t.QueryLexer.prototype.emit=function(e){this.lexemes.push({type:e,str:this.sliceString(),start:this.start,end:this.pos}),this.start=this.pos},t.QueryLexer.prototype.escapeCharacter=function(){this.escapeCharPositions.push(this.pos-1),this.pos+=1},t.QueryLexer.prototype.next=function(){if(this.pos>=this.length)return t.QueryLexer.EOS;var e=this.str.charAt(this.pos);return this.pos+=1,e},t.QueryLexer.prototype.width=function(){return this.pos-this.start},t.QueryLexer.prototype.ignore=function(){this.start==this.pos&&(this.pos+=1),this.start=this.pos},t.QueryLexer.prototype.backup=function(){this.pos-=1},t.QueryLexer.prototype.acceptDigitRun=function(){var e,n;do e=this.next(),n=e.charCodeAt(0);while(n>47&&n<58);e!=t.QueryLexer.EOS&&this.backup()},t.QueryLexer.prototype.more=function(){return this.pos<this.length},t.QueryLexer.EOS="EOS",t.QueryLexer.FIELD="FIELD",t.QueryLexer.TERM="TERM",t.QueryLexer.EDIT_DISTANCE="EDIT_DISTANCE",t.QueryLexer.BOOST="BOOST",t.QueryLexer.PRESENCE="PRESENCE",t.QueryLexer.lexField=function(e){return e.backup(),e.emit(t.QueryLexer.FIELD),e.ignore(),t.QueryLexer.lexText},t.QueryLexer.lexTerm=function(e){if(e.width()>1&&(e.backup(),e.emit(t.QueryLexer.TERM)),e.ignore(),e.more())return t.QueryLexer.lexText},t.QueryLexer.lexEditDistance=function(e){return e.ignore(),e.acceptDigitRun(),e.emit(t.QueryLexer.EDIT_DISTANCE),t.QueryLexer.lexText},t.QueryLexer.lexBoost=function(e){return e.ignore(),e.acceptDigitRun(),e.emit(t.QueryLexer.BOOST),t.QueryLexer.lexText},t.QueryLexer.lexEOS=function(e){e.width()>0&&e.emit(t.QueryLexer.TERM)},t.QueryLexer.termSeparator=t.tokenizer.separator,t.QueryLexer.lexText=function(e){for(;;){var n=e.next();if(n==t.QueryLexer.EOS)return t.QueryLexer.lexEOS;if(n.charCodeAt(0)==92){e.escapeCharacter();continue}if(n==":")return t.QueryLexer.lexField;if(n=="~")return e.backup(),e.width()>0&&e.emit(t.QueryLexer.TERM),t.QueryLexer.lexEditDistance;if(n=="^")return e.backup(),e.width()>0&&e.emit(t.QueryLexer.TERM),t.QueryLexer.lexBoost;if(n=="+"&&e.width()===1||n=="-"&&e.width()===1)return e.emit(t.QueryLexer.PRESENCE),t.QueryLexer.lexText;if(n.match(t.QueryLexer.termSeparator))return t.QueryLexer.lexTerm}},t.QueryParser=function(e,n){this.lexer=new t.QueryLexer(e),this.query=n,this.currentClause={},this.lexemeIdx=0},t.QueryParser.prototype.parse=function(){this.lexer.run(),this.lexemes=this.lexer.lexemes;for(var e=t.QueryParser.parseClause;e;)e=e(this);return this.query},t.QueryParser.prototype.peekLexeme=function(){return this.lexemes[this.lexemeIdx]},t.QueryParser.prototype.consumeLexeme=function(){var e=this.peekLexeme();return this.lexemeIdx+=1,e},t.QueryParser.prototype.nextClause=function(){var e=this.currentClause;this.query.clause(e),this.currentClause={}},t.QueryParser.parseClause=function(e){var n=e.peekLexeme();if(n!=null)switch(n.type){case t.QueryLexer.PRESENCE:return t.QueryParser.parsePresence;case t.QueryLexer.FIELD:return t.QueryParser.parseField;case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var o="expected either a field or a term, found "+n.type;throw n.str.length>=1&&(o+=" with value '"+n.str+"'"),new t.QueryParseError(o,n.start,n.end)}},t.QueryParser.parsePresence=function(e){var n=e.consumeLexeme();if(n!=null){switch(n.str){case"-":e.currentClause.presence=t.Query.presence.PROHIBITED;break;case"+":e.currentClause.presence=t.Query.presence.REQUIRED;break;default:var o="unrecognised presence operator'"+n.str+"'";throw new t.QueryParseError(o,n.start,n.end)}var a=e.peekLexeme();if(a==null){var o="expecting term or field, found nothing";throw new t.QueryParseError(o,n.start,n.end)}switch(a.type){case t.QueryLexer.FIELD:return t.QueryParser.parseField;case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var o="expecting term or field, found '"+a.type+"'";throw new t.QueryParseError(o,a.start,a.end)}}},t.QueryParser.parseField=function(e){var n=e.consumeLexeme();if(n!=null){if(e.query.allFields.indexOf(n.str)==-1){var o=e.query.allFields.map(function(p){return"'"+p+"'"}).join(", "),a="unrecognised field '"+n.str+"', possible fields: "+o;throw new t.QueryParseError(a,n.start,n.end)}e.currentClause.fields=[n.str];var i=e.peekLexeme();if(i==null){var a="expecting term, found nothing";throw new t.QueryParseError(a,n.start,n.end)}switch(i.type){case t.QueryLexer.TERM:return t.QueryParser.parseTerm;default:var a="expecting term, found '"+i.type+"'";throw new t.QueryParseError(a,i.start,i.end)}}},t.QueryParser.parseTerm=function(e){var n=e.consumeLexeme();if(n!=null){e.currentClause.term=n.str.toLowerCase(),n.str.indexOf("*")!=-1&&(e.currentClause.usePipeline=!1);var o=e.peekLexeme();if(o==null){e.nextClause();return}switch(o.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var a="Unexpected lexeme type '"+o.type+"'";throw new t.QueryParseError(a,o.start,o.end)}}},t.QueryParser.parseEditDistance=function(e){var n=e.consumeLexeme();if(n!=null){var o=parseInt(n.str,10);if(isNaN(o)){var a="edit distance must be numeric";throw new t.QueryParseError(a,n.start,n.end)}e.currentClause.editDistance=o;var i=e.peekLexeme();if(i==null){e.nextClause();return}switch(i.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var a="Unexpected lexeme type '"+i.type+"'";throw new t.QueryParseError(a,i.start,i.end)}}},t.QueryParser.parseBoost=function(e){var n=e.consumeLexeme();if(n!=null){var o=parseInt(n.str,10);if(isNaN(o)){var a="boost must be numeric";throw new t.QueryParseError(a,n.start,n.end)}e.currentClause.boost=o;var i=e.peekLexeme();if(i==null){e.nextClause();return}switch(i.type){case t.QueryLexer.TERM:return e.nextClause(),t.QueryParser.parseTerm;case t.QueryLexer.FIELD:return e.nextClause(),t.QueryParser.parseField;case t.QueryLexer.EDIT_DISTANCE:return t.QueryParser.parseEditDistance;case t.QueryLexer.BOOST:return t.QueryParser.parseBoost;case t.QueryLexer.PRESENCE:return e.nextClause(),t.QueryParser.parsePresence;default:var a="Unexpected lexeme type '"+i.type+"'";throw new t.QueryParseError(a,i.start,i.end)}}},function(e,n){I.exports=n()}(this,function(){return t})})()})(yt);var Qt=yt.exports;const At=jt(Qt);let Ke,xe=[];async function Ot(){try{console.log("Initializing search...");const I=await fetch("/data/manifest.json");if(!I.ok)throw new Error("Manifest not found");const t=(await I.json()).map(i=>fetch(`/data/${i}`).then(p=>p.json())),e=await Promise.all(t);xe=e.flatMap(i=>i.articulos.map(p=>({...p,ley_origen:i.metadata.ley,fecha_publicacion:i.metadata.fecha_publicacion}))),Ke=At(function(){this.ref("id"),this.field("texto"),this.field("titulo_nombre",{boost:5}),this.field("capitulo_nombre",{boost:3}),this.field("articulo_label",{boost:10}),this.field("ley_origen",{boost:5}),xe.forEach(i=>{this.add(i)})}),console.log(`Search Index Ready. ${xe.length} articles indexed.`);const n=new Set(xe.map(i=>i.ley_origen)),o=Rt(e),a={totalLeyes:n.size,totalArticulos:xe.length,leyes:Array.from(n),summaries:o};window.dispatchEvent(new CustomEvent("search-ready",{detail:a}))}catch(I){console.error("Error initializing search:",I)}}function Rt(I){return I.map(B=>{const t=B.metadata,e={};B.articulos.forEach(o=>{e[o.capitulo_nombre]||(e[o.capitulo_nombre]=0),e[o.capitulo_nombre]++});const n=Object.entries(e).sort((o,a)=>a[1]-o[1]).slice(0,3).map(o=>o[0]);return{titulo:t.ley,fecha:t.fecha_publicacion,articulos:t.total_articulos,temas_clave:n,id:t.ley.replace(/\s+/g,"-").toLowerCase(),resumen:t.resumen||"No hay resumen disponible para este documento."}})}function Pt(I){if(!Ke)return[];try{let B=I;return!/[~*^:+]/.test(I)&&(B=I.split(/\s+/).filter(n=>n.length>2).map(n=>`${n}~1 ${n}*`).join(" ")),Ke.search(B).map(n=>({...xe.find(a=>a.id===n.ref),score:n.score,matchData:n.matchData}))}catch(B){return console.warn("Search error",B),[]}}function Oe(I){return xe.find(B=>B.id===I)}function Ft(I){return xe.filter(B=>B.ley_origen===I)}function Nt(){return xe}function zt(){var lt,dt,ct,ut,pt;const I=document.getElementById("search-input"),B=document.getElementById("results-container"),t=document.getElementById("law-detail-container"),e=document.getElementById("stats-minimal"),n=document.getElementById("hero-section"),o=document.getElementById("main-container"),a=document.getElementById("quick-filters"),i=document.getElementById("detail-modal"),p=document.getElementById("modal-panel"),m=document.getElementById("modal-content"),$=document.getElementById("modal-title"),L=document.getElementById("modal-ley"),S=document.getElementById("close-modal"),A=document.getElementById("copy-btn"),j=document.getElementById("loading-indicator"),U=document.getElementById("nav-inicio"),D=document.getElementById("nav-leyes"),q=document.getElementById("mobile-menu-btn"),T=document.getElementById("mobile-menu-overlay"),_=document.getElementById("mobile-menu-drawer"),Y=document.getElementById("close-mobile-menu"),W=document.getElementById("mobile-nav-inicio"),oe=document.getElementById("mobile-nav-leyes"),ue="app-dark-mode";let pe=localStorage.getItem(ue)==="true";function ge(r){if(pe=r,localStorage.setItem(ue,r),document.documentElement.classList.toggle("dark-mode",r),!document.getElementById("global-dark-style")){const c=document.createElement("style");c.id="global-dark-style",c.innerHTML=`
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
            `,document.head.appendChild(c)}const s=document.querySelectorAll("#darkmode-icon-moon, #mobile-darkmode-moon"),l=document.querySelectorAll("#darkmode-icon-sun, #mobile-darkmode-sun"),d=document.getElementById("mobile-darkmode-label");s.forEach(c=>c.classList.toggle("hidden",r)),l.forEach(c=>c.classList.toggle("hidden",!r)),d&&(d.textContent=r?"Modo claro":"Modo oscuro")}pe&&ge(!0),(lt=document.getElementById("darkmode-toggle"))==null||lt.addEventListener("click",()=>ge(!pe)),(dt=document.getElementById("mobile-darkmode-toggle"))==null||dt.addEventListener("click",()=>ge(!pe));function ae(r){!_||!T||(r?(T.classList.remove("hidden"),T.offsetWidth,T.classList.remove("opacity-0"),_.classList.remove("translate-x-full"),document.body.style.overflow="hidden"):(T.classList.add("opacity-0"),_.classList.add("translate-x-full"),document.body.style.overflow="",setTimeout(()=>{T.classList.add("hidden")},300)))}q&&q.addEventListener("click",()=>ae(!0)),Y&&Y.addEventListener("click",()=>ae(!1)),T&&T.addEventListener("click",()=>ae(!1)),W&&W.addEventListener("click",r=>{r.preventDefault(),Me(),ae(!1)}),oe&&oe.addEventListener("click",r=>{r.preventDefault(),Re(),ae(!1)});let V=[],H=[];window.addEventListener("search-ready",r=>{const{totalLeyes:s,totalArticulos:l,summaries:d}=r.detail;V=d,e&&(e.innerHTML=`
                <span class="opacity-60">Índice activo:</span>
                <span class="font-semibold text-guinda">${s} leyes</span>
                <span class="mx-1 opacity-30">|</span>
                <span class="font-semibold text-guinda">${l} artículos</span>
            `),tt(),setTimeout(be,0)});const Le=document.getElementById("nav-favorites"),de=document.getElementById("mobile-nav-favorites");Le&&Le.addEventListener("click",()=>nt()),de&&de.addEventListener("click",()=>{nt(),ae(!1)});const Ee=document.getElementById("nav-stats"),$e=document.getElementById("mobile-nav-stats");Ee&&Ee.addEventListener("click",r=>{r.preventDefault(),st()}),$e&&$e.addEventListener("click",r=>{r.preventDefault(),st(),ae(!1)}),(ct=document.getElementById("close-compare-modal"))==null||ct.addEventListener("click",We),(ut=document.getElementById("compare-modal"))==null||ut.addEventListener("click",r=>{r.target===document.getElementById("compare-modal")&&We()});function te(r){history.replaceState(null,"",r?`${location.pathname}${r}`:location.pathname)}function be(){const r=location.hash;if(r){if(r.startsWith("#art-")){const s=decodeURIComponent(r.slice(5)),l=Oe(s);if(!l)return;ve=[l],fe(s)}else if(r.startsWith("#ley-")){const s=decodeURIComponent(r.slice(5)),l=V.find(d=>d.id===s);l&&Ce(l)}}}function v(r,s="✓",l="bg-gray-900"){const d=document.getElementById("app-toast");d&&d.remove();const c=document.createElement("div");c.id="app-toast",c.className=`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 ${l} text-white text-xs font-semibold rounded-full shadow-2xl transition-all duration-300 opacity-0 scale-90 pointer-events-none`,c.innerHTML=`<span>${s}</span><span>${r}</span>`,document.body.appendChild(c),requestAnimationFrame(()=>{c.classList.replace("opacity-0","opacity-100"),c.classList.replace("scale-90","scale-100")}),setTimeout(()=>{c.classList.replace("opacity-100","opacity-0"),c.classList.replace("scale-100","scale-90"),setTimeout(()=>c.remove(),300)},2500)}function O(r=5){B.innerHTML=Array(r).fill("").map(()=>`
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
        `).join("")}let Z="",X=[],k=1;const P=10;function he(r,s,l){const d=document.getElementById(s);if(!d)return;const c=d.nextElementSibling;if(c&&c.classList.contains("pagination-nav")&&c.remove(),r<=P)return;const x=Math.ceil(r/P),h=document.createElement("nav");h.className="pagination-nav flex justify-center items-center gap-2 mt-8 mb-4";const g=document.createElement("button");g.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>',g.className=`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${k===1?"opacity-50 cursor-not-allowed":""}`,g.disabled=k===1,g.onclick=()=>{k>1&&(k--,l(),window.scrollTo({top:d.offsetTop-100,behavior:"smooth"}))};const u=document.createElement("span");u.className="text-xs text-gray-500 font-medium",u.innerText=`Página ${k} de ${x}`;const w=document.createElement("button");w.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>',w.className=`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${k===x?"opacity-50 cursor-not-allowed":""}`,w.disabled=k===x,w.onclick=()=>{k<x&&(k++,l(),window.scrollTo({top:d.offsetTop-100,behavior:"smooth"}))},h.appendChild(g),h.appendChild(u),h.appendChild(w),d.parentNode.insertBefore(h,d.nextSibling)}U&&U.addEventListener("click",r=>{r.preventDefault(),Me()}),D&&D.addEventListener("click",r=>{r.preventDefault(),Re()});function ee(){var s;(s=document.getElementById("toc-toggle-btn"))==null||s.remove();const r=document.getElementById("toc-panel");r&&(r.classList.add("translate-y-full"),setTimeout(()=>r.remove(),310)),document.body.style.overflow=""}function F(){var r;(r=document.getElementById("global-search-wrapper"))==null||r.classList.remove("hidden")}function Ve(){var r;(r=document.getElementById("global-search-wrapper"))==null||r.classList.add("hidden"),I&&(I.value="")}function Me(){te(null),ee(),F(),I&&(I.value=""),n.classList.remove("hidden"),a.classList.remove("hidden"),e.classList.remove("hidden"),o.classList.add("justify-center","pt-24"),o.classList.remove("pt-8"),B.classList.add("hidden","opacity-0"),B.innerHTML="",t&&t.classList.add("hidden","opacity-0");const r=document.getElementById("search-filters");r&&r.remove();const s=document.querySelector(".pagination-nav");s&&s.remove(),k=1,N={type:"all",law:"all",artNum:""}}function Re(){if(te(null),ee(),F(),n.classList.add("hidden"),a.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),B.classList.remove("hidden"),setTimeout(()=>B.classList.remove("opacity-0"),50),I&&(I.value=""),V.length===0){B.innerHTML='<div class="text-center py-12 text-gray-400">Cargando leyes...</div>';return}const r=V.filter(d=>d.titulo.toLowerCase().startsWith("ley")),s=V.filter(d=>d.titulo.toLowerCase().startsWith("reglamento")),l=V.filter(d=>!d.titulo.toLowerCase().startsWith("ley")&&!d.titulo.toLowerCase().startsWith("reglamento"));B.innerHTML=`
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Marco Jurídico Disponible</h2>
                <p class="text-sm text-gray-400 font-light">Explora las leyes y reglamentos indexados en el sistema.</p>
            </div>
            
            ${_e("Leyes Federales",r)}
            ${_e("Reglamentos",s)}
            ${_e("Acuerdos y Otros Instrumentos",l)}
        `,document.querySelectorAll(".law-card").forEach(d=>{d.addEventListener("click",()=>{const c=d.dataset.title,x=V.find(h=>h.titulo===c);x&&Ce(x)})}),document.querySelectorAll(".carousel-container").forEach(d=>{const c=d.querySelector(".carousel-scroll"),x=d.querySelector(".scroll-left"),h=d.querySelector(".scroll-right");x&&h&&c&&(x.addEventListener("click",()=>{c.scrollBy({left:-300,behavior:"smooth"})}),h.addEventListener("click",()=>{c.scrollBy({left:300,behavior:"smooth"})}))})}function _e(r,s){if(s.length===0)return"";const l=r.toLowerCase().includes("ley"),d=r.toLowerCase().includes("reglamento"),c=l?{gradFrom:"#6b1532",gradTo:"#9B2247",label:"Ley Federal",dotClass:"bg-guinda"}:d?{gradFrom:"#14403a",gradTo:"#1E5B4F",label:"Reglamento",dotClass:"bg-emerald-700"}:{gradFrom:"#7a5c1e",gradTo:"#A57F2C",label:"Instrumento",dotClass:"bg-amber-700"},x=l?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>':d?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>';return`
            <div class="mb-10 carousel-container group/section">
                <h3 class="text-lg font-bold text-gray-800 mb-4 px-1 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${c.dotClass} flex-shrink-0"></span>
                    ${r}
                    <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${s.length}</span>
                </h3>

                <div class="relative">
                    <!-- Left Arrow -->
                    <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white/90 backdrop-blur border border-gray-100 shadow-lg rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-opacity disabled:opacity-0 hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>

                    <!-- Carousel Track -->
                    <div class="carousel-scroll flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 snap-x scrollbar-hide scroll-smooth">
                        ${s.map(h=>{const g=h.resumen?h.resumen.replace(/\n/g," ").slice(0,110)+(h.resumen.length>110?"…":""):h.temas_clave&&h.temas_clave.length>0?h.temas_clave.slice(0,3).join(" · "):"Ver artículos";return`
                            <div class="min-w-[300px] w-[300px] md:min-w-[340px] md:w-[340px] snap-start rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer law-card group flex flex-col h-[280px]"
                                data-title="${h.titulo.replace(/"/g,"&quot;")}"
                                style="background: linear-gradient(160deg, ${c.gradFrom} 0%, ${c.gradTo} 100%);">

                                <!-- Top: icon + label -->
                                <div class="flex items-start justify-between px-5 pt-5 pb-3">
                                    <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);">
                                        <svg class="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">${x}</svg>
                                    </div>
                                    <span class="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white/80" style="background: rgba(255,255,255,0.15);">${c.label}</span>
                                </div>

                                <!-- Middle: title + description -->
                                <div class="flex-1 px-5 pb-2 flex flex-col justify-center">
                                    <h3 class="text-sm font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-white/90 transition-colors" title="${h.titulo.replace(/"/g,"&quot;")}">${h.titulo}</h3>
                                    <p class="text-[11px] text-white/65 leading-relaxed line-clamp-3">${g}</p>
                                </div>

                                <!-- Footer: metadata bar -->
                                <div class="flex items-center justify-between px-5 py-3" style="background: rgba(0,0,0,0.25); backdrop-filter: blur(4px);">
                                    <div class="flex items-center gap-1.5 text-white/70 text-[10px]">
                                        <svg class="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <span>${h.articulos} artículos</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-white/50 text-[10px]">${h.fecha||"N/D"}</span>
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
        `}function Ce(r){var ht,ft,mt,xt,bt,vt;if(!t)return;ee(),Ve(),H=Ft(r.titulo);const s=[...new Set(H.map(y=>y.capitulo_nombre).filter(Boolean))];[...new Set(H.map(y=>y.titulo_nombre).filter(Boolean))];const l=H.filter(y=>y.articulo_label.toLowerCase().includes("transitorio")).length;B.classList.add("hidden"),n.classList.add("hidden"),a.classList.add("hidden"),e.classList.add("hidden"),t.classList.remove("hidden"),setTimeout(()=>t.classList.remove("opacity-0"),50),te(`#ley-${encodeURIComponent(r.id)}`);let d=100,c=localStorage.getItem("reader-theme")||"light";t.innerHTML=`
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
                    <button id="crumb-categoria" class="hover:text-guinda transition-colors font-medium" aria-label="Ver todas las leyes">${r.titulo.toLowerCase().startsWith("ley")?"Leyes Federales":r.titulo.toLowerCase().startsWith("reglamento")?"Reglamentos":"Acuerdos y Otros"}</button>
                    <svg class="w-3 h-3 text-gray-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    <span class="text-gray-600 font-semibold truncate max-w-[180px] sm:max-w-xs" title="${r.titulo.replace(/"/g,"&quot;")}">${r.titulo}</span>
                </nav>
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <span class="text-xs font-bold text-guinda uppercase tracking-widest bg-guinda/5 px-2 py-1 rounded-full">Marco Legal Vigente</span>
                        <h1 class="text-3xl sm:text-4xl font-head font-bold text-gray-900 mt-3 mb-2">${r.titulo}</h1>
                        <p class="text-sm text-gray-500">Publicado: ${r.fecha} · Última reforma: ${r.fecha}</p>
                        ${r.resumen?`<div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 font-light leading-relaxed max-w-4xl">${r.resumen.split(`

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
                     <span class="text-3xl font-head font-bold text-guinda">${H.length}</span>
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
                        ${r.temas_clave?r.temas_clave.map(y=>`<button class="theme-filter-btn text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-guinda hover:text-white hover:border-guinda transition-all shadow-sm" data-theme="${y}">${y}</button>`).join(""):'<span class="text-xs text-gray-400">No disponibles</span>'}
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
                        placeholder="Buscar artículos específicos en ${r.titulo}...">
                </div>

                <!-- Articles List -->
                <div id="law-articles-list" class="space-y-4 max-w-4xl mx-auto">
                    <!-- Render initial articles -->
                </div>
            </div>
        `;const x=document.createElement("button");x.id="toc-toggle-btn",x.className="fixed bottom-24 left-4 z-40 bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-600 flex items-center gap-2 hover:text-guinda hover:border-guinda transition-all duration-300 group animate-fade-in-up",x.innerHTML=`
            <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10M4 18h6"/></svg>
            Índice
            <span class="bg-guinda/10 text-guinda px-1.5 py-0.5 rounded-full text-[9px] font-bold">${H.length}</span>
        `,document.body.appendChild(x);const h=H.map((y,M)=>{const K=y.articulo_label.match(/\d+/),J=K?K[0]:M+1,Xe=!!Be(y.id);return`<button class="toc-art-btn text-[11px] font-medium rounded-lg py-2 px-1 border transition-all text-center relative
                ${Qe(y.id)?"border-guinda/30 bg-guinda/5 text-guinda":"border-gray-100 bg-white text-gray-600 hover:border-guinda hover:text-guinda hover:bg-guinda/5"}"
                data-id="${y.id}" title="${y.articulo_label}">
                Art.${J}
                ${Xe?'<span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>':""}
            </button>`}).join(""),g=H.map(y=>{const M=!!Be(y.id),K=Qe(y.id),J=y.titulo_nombre?`<span class="text-gray-400 ml-1 font-normal">· ${y.titulo_nombre}</span>`:"";return`<button class="toc-art-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-guinda/5 group/item
                ${K?"text-guinda":"text-gray-700 hover:text-guinda"}"
                data-id="${y.id}">
                <span class="flex-shrink-0 text-[10px] font-bold min-w-[36px] text-center py-1 rounded-md
                    ${K?"bg-guinda/10 text-guinda":"bg-gray-100 text-gray-500 group-hover/item:bg-guinda/10 group-hover/item:text-guinda"}">
                    ${y.articulo_label.replace(/Artículo\s*/i,"Art.").split(" ")[0]+(y.articulo_label.match(/\d+/)?" "+y.articulo_label.match(/\d+/)[0]:"")}
                </span>
                <span class="text-xs font-medium truncate flex-1 leading-snug">
                    ${y.articulo_label}${J}
                </span>
                <span class="flex-shrink-0 flex items-center gap-1">
                    ${M?'<span class="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Tiene nota"></span>':""}
                    ${K?'<svg class="w-3 h-3 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>':""}
                </span>
            </button>`}).join(""),u=document.createElement("div");u.id="toc-panel",u.className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 transform translate-y-full transition-transform duration-300 flex flex-col",u.style.maxHeight="75vh",u.innerHTML=`
            <!-- Handle bar -->
            <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>
            <!-- Header -->
            <div class="flex items-center justify-between px-5 pt-2 pb-3 flex-shrink-0">
                <div>
                    <p class="text-sm font-bold text-gray-800">Índice de Artículos</p>
                    <p class="text-[10px] text-gray-400 mt-0.5">${H.length} artículos · clic para abrir</p>
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
                    ${h}
                </div>
            </div>
            <!-- Content: List view (hidden by default) -->
            <div id="toc-content-list" class="hidden overflow-y-auto flex-1 px-3 py-2 space-y-0.5">
                ${g}
            </div>
        `,document.body.appendChild(u);const w=u.querySelector("#toc-tab-grid"),E=u.querySelector("#toc-tab-list"),f=u.querySelector("#toc-content-grid"),b=u.querySelector("#toc-content-list"),C=u.querySelector("#toc-search"),R=["bg-guinda","text-white","shadow-sm"],z=["text-gray-500","hover:text-guinda","hover:bg-guinda/5"];w.addEventListener("click",()=>{w.classList.add(...R),w.classList.remove(...z),E.classList.remove(...R),E.classList.add(...z),f.classList.remove("hidden"),b.classList.add("hidden"),C&&(C.value=""),f.querySelectorAll(".toc-art-btn").forEach(y=>y.style.display="")}),E.addEventListener("click",()=>{E.classList.add(...R),E.classList.remove(...z),w.classList.remove(...R),w.classList.add(...z),b.classList.remove("hidden"),f.classList.add("hidden"),C&&(C.value=""),b.querySelectorAll(".toc-art-btn").forEach(y=>y.style.display="")}),C&&(C.addEventListener("input",y=>{const M=y.target.value.toLowerCase().trim();(b.classList.contains("hidden")?f:b).querySelectorAll(".toc-art-btn").forEach(J=>{var Ye;const Xe=!M||((Ye=J.title)==null?void 0:Ye.toLowerCase().includes(M))||J.textContent.toLowerCase().includes(M);J.style.display=Xe?"":"none"})}),C.addEventListener("click",y=>y.stopPropagation()));let G=!1;const me=y=>{G=y,y?(u.classList.remove("translate-y-full"),document.body.style.overflow="hidden"):(u.classList.add("translate-y-full"),document.body.style.overflow="")};x.addEventListener("click",()=>me(!G)),(ht=u.querySelector("#toc-close-btn"))==null||ht.addEventListener("click",()=>me(!1)),u.querySelectorAll(".toc-art-btn").forEach(y=>{y.addEventListener("click",()=>{me(!1),fe(y.dataset.id)})}),je(H.slice(0,20),""),setTimeout(()=>{Ze(H)},100);const se=document.getElementById("law-articles-list"),ye=document.getElementById("btn-font-increase"),we=document.getElementById("btn-font-decrease"),ie=document.getElementById("font-size-display"),Ae=document.querySelectorAll(".theme-btn");document.getElementById("law-header-area");const De=y=>{if(c=y,localStorage.setItem("reader-theme",y),document.body.className=`bg-${y} text-gray-900 font-body min-h-screen flex flex-col antialiased transition-colors duration-300`,Ae.forEach(M=>{M.classList.remove("ring-2","ring-guinda","ring-offset-1"),M.dataset.theme===y&&M.classList.add("ring-2","ring-guinda","ring-offset-1")}),document.querySelectorAll(".mob-theme-btn").forEach(M=>{M.classList.remove("border-guinda","text-guinda"),M.classList.add("border-transparent"),M.dataset.theme===y&&(M.classList.remove("border-transparent"),M.classList.add("border-guinda"),y!=="dark"&&M.classList.add("text-guinda"))}),!document.getElementById("reader-themes-style")){const M=document.createElement("style");M.id="reader-themes-style",M.innerHTML=`
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
                `,document.head.appendChild(M)}};De(c);const ke=()=>{se&&(se.style.fontSize=`${d}%`),document.querySelectorAll("#font-size-display, #mob-font-display").forEach(y=>{y.innerText=`${d}%`})};ye&&ye.addEventListener("click",()=>{d<250&&(d+=10,ke())}),we&&we.addEventListener("click",()=>{d>80&&(d-=10,ke())}),ie&&(ie.addEventListener("click",()=>{d=100,ke()}),ie.style.cursor="pointer",ie.title="Restablecer al 100%"),Ae.forEach(y=>{y.addEventListener("click",M=>{De(M.target.dataset.theme)})});const Q=document.getElementById("mobile-reading-toggle"),ne=document.getElementById("mobile-reading-sheet"),le=document.getElementById("mobile-reading-overlay"),Je=y=>{ne==null||ne.classList.toggle("translate-y-full",!y),le==null||le.classList.toggle("hidden",!y)};Q==null||Q.addEventListener("click",()=>Je(!0)),le==null||le.addEventListener("click",()=>Je(!1)),(ft=document.getElementById("mob-font-decrease"))==null||ft.addEventListener("click",()=>{d>80&&(d-=10,ke())}),(mt=document.getElementById("mob-font-increase"))==null||mt.addEventListener("click",()=>{d<250&&(d+=10,ke())}),document.querySelectorAll(".mob-theme-btn").forEach(y=>{y.addEventListener("click",()=>{De(y.dataset.theme),Je(!1)})});const gt=document.getElementById("law-share-btn"),Te=document.getElementById("law-share-menu");document.getElementById("law-share-text-btn"),document.getElementById("law-share-link-btn"),gt&&Te&&(gt.addEventListener("click",y=>{y.stopPropagation(),Te.classList.toggle("hidden")}),document.addEventListener("click",function y(M){M.target.closest("#law-share-wrapper")||(Te.classList.add("hidden"),document.removeEventListener("click",y))})),Object.entries({"law-share-whatsapp-btn":()=>Ne(r,"whatsapp"),"law-share-telegram-btn":()=>Ne(r,"telegram"),"law-share-twitter-btn":()=>Ne(r,"twitter"),"law-share-email-btn":()=>Ne(r,"email"),"law-share-link-btn":()=>{const y=`${location.origin}${location.pathname}#ley-${encodeURIComponent(r.id)}`;navigator.clipboard.writeText(y).then(()=>v("¡Enlace copiado!","🔗","bg-blue-600"))}}).forEach(([y,M])=>{var K;(K=document.getElementById(y))==null||K.addEventListener("click",()=>{Te==null||Te.classList.add("hidden"),M()})}),(xt=document.getElementById("print-btn"))==null||xt.addEventListener("click",()=>window.print()),(bt=document.getElementById("crumb-inicio"))==null||bt.addEventListener("click",()=>Me()),(vt=document.getElementById("crumb-categoria"))==null||vt.addEventListener("click",()=>Re()),document.querySelectorAll(".theme-filter-btn").forEach(y=>{y.addEventListener("click",M=>{const K=M.target.dataset.theme,J=document.getElementById("law-search-input");J&&(J.value=K,J.dispatchEvent(new Event("input")))})}),document.getElementById("law-search-input").addEventListener("input",y=>{const M=y.target.value.toLowerCase().trim();let K=H;M.length>2&&(K=H.filter(J=>J.texto.toLowerCase().includes(M)||J.articulo_label.toLowerCase().includes(M)||J.titulo_nombre&&J.titulo_nombre.toLowerCase().includes(M)||J.capitulo_nombre&&J.capitulo_nombre.toLowerCase().includes(M))),je(K.slice(0,50),M)}),document.getElementById("export-csv-btn").addEventListener("click",()=>{Et(H,`${r.titulo}.csv`)})}function Ze(r){const s=document.getElementById("law-structure-chart");if(!s)return;if(!window.d3){s.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">Cargando visualización...</div>',setTimeout(()=>Ze(r),1e3);return}if(s.innerHTML="",!r||r.length===0){s.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">No hay datos para visualizar</div>';return}const l={};r.forEach(b=>{let C=b.titulo_nombre||b.capitulo_nombre||"General";C=C.replace(/^TÍTULO\s+/i,"").replace(/^CAPÍTULO\s+/i,""),C=C.replace(/^[IVXLCDM]+\.?\s*-?\s*/,""),C=C.replace(/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)\.?\s*-?\s*/i,""),C=C.trim(),C||(C="General"),C.length>25&&(C=C.substring(0,25)+"..."),l[C]=(l[C]||0)+1});const d=Object.entries(l).map(([b,C])=>({name:b,value:C})).sort((b,C)=>C.value-b.value).slice(0,5);if(d.length===0){s.innerHTML='<div class="flex items-center justify-center h-full text-xs text-gray-400">Datos insuficientes</div>';return}const c={top:10,right:30,bottom:20,left:220},x=s.clientWidth,g=Math.max(s.clientHeight,d.length*35+c.top+c.bottom);d3.select(s).select("svg").remove();const u=d3.select(s).append("svg").attr("width","100%").attr("height",g).attr("viewBox",[0,0,x,g]).attr("style","max-width: 100%; height: auto; font: 11px sans-serif;"),w=d3.scaleLinear().domain([0,d3.max(d,b=>b.value)]).range([c.left,x-c.right]),E=d3.scaleBand().domain(d.map(b=>b.name)).rangeRound([c.top,g-c.bottom]).padding(.3);d3.selectAll(".d3-tooltip").remove();const f=d3.select("body").append("div").attr("class","d3-tooltip absolute bg-gray-900/90 backdrop-blur text-white text-[10px] rounded-lg py-1.5 px-3 pointer-events-none opacity-0 transition-opacity z-50 shadow-xl border border-gray-700").style("display","none");u.append("g").attr("fill","#9B2247").selectAll("rect").data(d).join("rect").attr("x",w(0)).attr("y",b=>E(b.name)).attr("width",b=>Math.max(0,w(b.value)-w(0))).attr("height",E.bandwidth()).attr("rx",4).on("mouseover",(b,C)=>{d3.select(b.target).attr("fill","#7A1C39"),f.style("opacity","1").style("display","block").text(`${C.name}: ${C.value} artículos`)}).on("mousemove",b=>{f.style("left",b.pageX+10+"px").style("top",b.pageY-10+"px")}).on("mouseout",b=>{d3.select(b.target).attr("fill","#9B2247"),f.style("opacity","0").style("display","none")}),u.append("g").attr("fill","black").attr("text-anchor","start").attr("font-size","10px").selectAll("text").data(d).join("text").attr("x",b=>w(b.value)+4).attr("y",b=>E(b.name)+E.bandwidth()/2).attr("dy","0.35em").text(b=>b.value),u.append("g").call(d3.axisLeft(E).tickSize(0)).attr("transform",`translate(${c.left},0)`).call(b=>b.select(".domain").remove()).call(b=>b.selectAll("text").attr("fill","#4B5563").attr("font-weight","500").style("text-anchor","end").attr("dx","-6"))}function je(r,s){const l=document.getElementById("law-articles-list");if(l){if(r.length===0){l.innerHTML='<div class="text-center py-8 text-gray-400 text-sm">No se encontraron artículos que coincidan con la búsqueda.</div>';return}ve=r,l.innerHTML=r.map(d=>{const c=s?Pe(d.texto,s):d.texto.substring(0,300)+"...",x=!!Be(d.id),h=Qe(d.id)?'<svg class="w-3.5 h-3.5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>',g=re.includes(d.id),u=g?"text-guinda":re.length>=2?"text-gray-100":"text-gray-300 hover:text-guinda",w=g?"bg-guinda/10":"";return`
            <div class="relative bg-white border ${g?"border-guinda/30":"border-gray-100"} rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer result-item" data-id="${d.id}">
                <div class="flex items-center justify-between mb-2 pr-14">
                    <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        ${d.articulo_label}
                        ${x?'<span class="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Tiene nota"></span>':""}
                    </span>
                    <span class="text-[10px] text-gray-400">${d.titulo_nombre||""}</span>
                </div>
                <p class="text-sm text-gray-600 font-light leading-relaxed line-clamp-3">${c}</p>
                <button class="bookmark-card-btn absolute top-3 right-9 p-1 text-gray-300 hover:text-guinda transition-colors" data-id="${d.id}">${h}</button>
                <button class="compare-card-btn absolute top-3 right-3 p-1 ${u} ${w} rounded transition-colors" data-id="${d.id}" title="Comparar artículo">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                </button>
            </div>
            `}).join(""),document.querySelectorAll("#law-articles-list .result-item").forEach(d=>{d.addEventListener("click",c=>{c.target.closest(".bookmark-card-btn")||c.target.closest(".compare-card-btn")||fe(d.dataset.id)})}),document.querySelectorAll("#law-articles-list .bookmark-card-btn").forEach(d=>{d.addEventListener("click",c=>{c.stopPropagation();const x=document.getElementById("law-search-input");qe(d.dataset.id);const h=x?x.value.toLowerCase().trim():"";je(H.slice(0,50),h)})}),document.querySelectorAll("#law-articles-list .compare-card-btn").forEach(d=>{d.addEventListener("click",c=>{var u;c.stopPropagation();const x=d.dataset.id,h=re.indexOf(x);h>=0?re.splice(h,1):re.length<2&&re.push(x),ot();const g=((u=document.getElementById("law-search-input"))==null?void 0:u.value.toLowerCase().trim())||"";je(H.slice(0,50),g)})})}}function wt(r){return r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}const kt=new Set(["de","la","el","los","las","en","a","con","por","para","del","al","se","su","sus","que","no","un","una","o","y","e","ni","u","lo","le","les","me","te","nos","mi","si","es","son","fue","ser","ha","han","hay","más","ya","pero","como","este","esta","ese","esa","ante","bajo","cada","cual","donde","entre","hacia","hasta","muy","poco","sin","sobre","solo","tan","todo","tras","otros"]);function Pe(r,s){if(!s||!r)return r||"";const l=s.trim().split(/\s+/),d=l.length>1,c=l.filter(g=>d?g.length>3&&!kt.has(g.toLowerCase()):g.length>1);if(c.length===0)return r;const x=c.map(g=>wt(g)).join("|"),h=new RegExp(`(${x})`,"gi");return r.replace(h,'<mark class="hl">$1</mark>')}function Lt(r,s){const l=s>0?r/s:0;return l>=.6?'<span class="text-[9px] font-bold text-guinda bg-guinda/10 px-1.5 py-0.5 rounded-full">Alta</span>':l>=.25?'<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Media</span>':'<span class="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">Baja</span>'}function Et(r,s){const l=["Ley","Artículo","Texto"],d=r.map(g=>[`"${g.ley_origen}"`,`"${g.articulo_label}"`,`"${g.texto.replace(/"/g,'""')}"`]),c=[l.join(","),...d.map(g=>g.join(","))].join(`
`),x=new Blob([c],{type:"text/csv;charset=utf-8;"}),h=document.createElement("a");if(h.download!==void 0){const g=URL.createObjectURL(x);h.setAttribute("href",g),h.setAttribute("download",s),h.style.visibility="hidden",document.body.appendChild(h),h.click(),document.body.removeChild(h)}}function $t(r){const s=He().filter(l=>l!==r);s.unshift(r),localStorage.setItem("search-history",JSON.stringify(s.slice(0,10)))}function He(){return JSON.parse(localStorage.getItem("search-history")||"[]")}a&&a.addEventListener("click",r=>{r.target.tagName==="BUTTON"&&(I.value=r.target.textContent,I.dispatchEvent(new Event("input")))});function Se(r){return r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}function et(r,s){const l=Se(r),d=Se(s),c=l.indexOf(d);return c===-1?ce(r):ce(r.slice(0,c))+`<mark class="bg-guinda/10 text-guinda font-semibold not-italic">${ce(r.slice(c,c+s.length))}</mark>`+ce(r.slice(c+s.length))}function ce(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}if(I){let l=function(){return Array.from(r.querySelectorAll("[data-navigable]"))},d=function(g){const u=l();u.forEach((w,E)=>{w.classList.toggle("bg-gray-50",E===g),w.setAttribute("aria-selected",E===g?"true":"false")}),s=g,u[g]&&u[g].scrollIntoView({block:"nearest"})},c=function(){r.classList.add("hidden"),s=-1},x=function(g){var w;s=-1;const u=[];if(g){const E=V.filter(R=>Se(R.titulo).includes(Se(g))).slice(0,4);E.length>0&&u.push({label:"Leyes",items:E.map(R=>({html:`
                                <svg class="w-4 h-4 text-guinda opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                <span class="text-sm text-gray-700 font-medium truncate">${et(R.titulo,g)}</span>`,attrs:`data-navigable data-law-title="${ce(R.titulo)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-law"`}))});const f=Nt(),b=Se(g),C=[];for(const R of f){if(C.length>=4)break;const z=R.articulo_label||"",G=R.titulo_nombre||"",me=R.capitulo_nombre||"",se=[z,G,me].find(ye=>ye&&Se(ye).includes(b));se&&C.push({art:R,matchField:se})}C.length>0&&u.push({label:"Artículos",items:C.map(({art:R,matchField:z})=>({html:`
                                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-sm text-gray-700 font-medium truncate">${et(z,g)}</span>
                                    <span class="text-[11px] text-gray-400 truncate">${ce(R.ley_origen)}</span>
                                </div>`,attrs:`data-navigable data-article-id="${ce(R.id)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-article"`}))})}else{const E=He();if(E.length===0){c();return}u.push({label:"Búsquedas recientes",extra:'<button id="clear-all-history" class="text-gray-300 hover:text-guinda transition-colors text-[9px] normal-case tracking-normal">Borrar todo</button>',items:E.slice(0,7).map(f=>({html:`
                            <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="text-sm text-gray-600 truncate flex-1">${ce(f)}</span>
                            <button class="remove-history-item text-gray-200 hover:text-gray-500 transition-colors text-base leading-none flex-shrink-0" data-query="${ce(f)}">×</button>`,attrs:`data-navigable data-query="${ce(f)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors history-item"`}))})}if(u.length===0){c();return}r.innerHTML=u.map(E=>`
                <div class="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span>${E.label}</span>
                    ${E.extra||""}
                </div>
                ${E.items.map(f=>`<div ${f.attrs}>${f.html}</div>`).join("")}
            `).join(""),r.classList.remove("hidden"),(w=document.getElementById("clear-all-history"))==null||w.addEventListener("click",E=>{E.stopPropagation(),localStorage.removeItem("search-history"),c()}),r.querySelectorAll(".history-item").forEach(E=>{E.addEventListener("click",f=>{if(f.target.classList.contains("remove-history-item")){f.stopPropagation();const b=f.target.dataset.query,C=He().filter(R=>R!==b);localStorage.setItem("search-history",JSON.stringify(C)),E.remove(),r.querySelectorAll(".history-item").length===0&&c();return}I.value=E.dataset.query,I.dispatchEvent(new Event("input")),c()})}),r.querySelectorAll(".suggestion-law").forEach(E=>{E.addEventListener("click",()=>{const f=E.dataset.lawTitle,b=V.find(C=>C.titulo===f);b&&(Ce(b),c(),I.value="")})}),r.querySelectorAll(".suggestion-article").forEach(E=>{E.addEventListener("click",()=>{const f=E.dataset.articleId;f&&(fe(f),c(),I.value="")})})};var Dt=l,Vt=d,Ht=c,qt=x;const r=document.createElement("div");r.id="autocomplete-results",r.className="absolute w-full bg-white border border-gray-100 rounded-2xl shadow-xl mt-2 hidden z-50 overflow-hidden max-h-96 overflow-y-auto",I.parentNode.appendChild(r);let s=-1;document.addEventListener("click",g=>{!I.contains(g.target)&&!r.contains(g.target)&&c()}),I.addEventListener("keydown",g=>{var w;if(r.classList.contains("hidden"))return;const u=l();g.key==="ArrowDown"?(g.preventDefault(),d(Math.min(s+1,u.length-1))):g.key==="ArrowUp"?(g.preventDefault(),d(Math.max(s-1,-1)),s===-1&&u.forEach(E=>E.classList.remove("bg-gray-50"))):g.key==="Enter"&&s>=0?(g.preventDefault(),(w=u[s])==null||w.click()):g.key==="Escape"&&c()}),I.addEventListener("focus",()=>{I.value.trim().length>0||x("")});let h=null;I.addEventListener("input",g=>{const u=g.target.value.trim();u.length>2?(ee(),t&&t.classList.add("hidden","opacity-0"),n.classList.add("hidden"),n.classList.remove("block"),a.classList.add("hidden"),e.classList.add("hidden"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),B.classList.remove("hidden"),setTimeout(()=>B.classList.remove("opacity-0"),50),j&&j.classList.remove("hidden"),O(),x(u),clearTimeout(h),h=setTimeout(()=>{X=Pt(u),Z=u,k=1,N={type:"all",law:"all",artNum:""},$t(u),Ie(),j&&j.classList.add("hidden")},250)):u.length===0&&(ee(),t&&t.classList.add("hidden","opacity-0"),n.classList.remove("hidden"),a.classList.remove("hidden"),e.classList.remove("hidden"),o.classList.add("justify-center","pt-24"),o.classList.remove("pt-8"),B.classList.add("hidden","opacity-0"),B.innerHTML="",c())})}let N={type:"all",law:"all",artNum:""},ve=[],re=[];function Fe(){return JSON.parse(localStorage.getItem("article-favorites")||"[]")}function Qe(r){return Fe().includes(r)}function qe(r){const s=Fe(),l=s.indexOf(r);l>=0?s.splice(l,1):s.unshift(r),localStorage.setItem("article-favorites",JSON.stringify(s)),tt()}function tt(){const r=Fe().length,s=Object.keys(Ue()).length;document.querySelectorAll("#nav-favorites, #mobile-nav-favorites").forEach(l=>{l&&(l.classList.toggle("hidden",r===0&&s===0),l.querySelectorAll(".fav-count").forEach(d=>d.textContent=r))})}function Ue(){return JSON.parse(localStorage.getItem("article-notes")||"{}")}function Be(r){return Ue()[r]||""}function rt(r,s){const l=Ue();s.trim()?l[r]=s.trim():delete l[r],localStorage.setItem("article-notes",JSON.stringify(l))}function Ct(r,s,l=!1){const d=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),c=r.map(u=>{const w=l?Be(u.id):"";return`
            <div style="margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #f0f0f0;page-break-inside:avoid;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:10px;font-weight:700;color:#9B2247;background:#fdf2f5;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.08em;">${u.ley_origen}</span>
                    ${u.titulo_nombre?`<span style="font-size:10px;color:#6b7280;">${u.titulo_nombre}</span>`:""}
                </div>
                <h3 style="font-size:15px;font-weight:700;color:#111;margin:0 0 8px;">${u.articulo_label}</h3>
                <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 ${w?"10px":"0"};">${u.texto.substring(0,800)}${u.texto.length>800?"…":""}</p>
                ${w?`<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-top:8px;">
                    <span style="font-size:10px;font-weight:700;color:#92400e;display:block;margin-bottom:4px;">📝 Mi nota</span>
                    <p style="font-size:12px;color:#78350f;margin:0;line-height:1.6;">${w}</p>
                </div>`:""}
            </div>`}).join(""),x=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <title>${s} — SENER</title>
        <style>
            body{font-family:'Noto Sans',Arial,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;color:#1f2937;}
            h1{font-size:22px;font-weight:700;color:#9B2247;margin-bottom:4px;}
            .meta{font-size:11px;color:#9ca3af;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #f3f4f6;}
            @media print{body{margin:16px;}h1{font-size:18px;}}
        </style></head><body>
        <h1>${s}</h1>
        <div class="meta">Secretaría de Energía · Gobierno de México · Exportado el ${d} · ${r.length} artículo${r.length!==1?"s":""}</div>
        ${c}
        </body></html>`,h=new Blob([x],{type:"text/html;charset=utf-8;"}),g=document.createElement("a");g.href=URL.createObjectURL(h),g.download=`${s.replace(/\s+/g,"_")}_${d.replace(/\s/g,"-")}.html`,g.click(),URL.revokeObjectURL(g.href)}function It(r,s,l=!1){const d=["Ley","Artículo","Título","Texto",...l?["Nota personal"]:[]],c=r.map(u=>[`"${(u.ley_origen||"").replace(/"/g,'""')}"`,`"${(u.articulo_label||"").replace(/"/g,'""')}"`,`"${(u.titulo_nombre||"").replace(/"/g,'""')}"`,`"${(u.texto||"").replace(/"/g,'""')}"`,...l?[`"${Be(u.id).replace(/"/g,'""')}"`]:[]]),x=[d.join(","),...c.map(u=>u.join(","))].join(`
`),h=new Blob(["\uFEFF"+x],{type:"text/csv;charset=utf-8;"}),g=document.createElement("a");g.href=URL.createObjectURL(h),g.download=s,g.click(),URL.revokeObjectURL(g.href)}function nt(){var x,h;te(null),ee(),F();const r=Fe();n.classList.add("hidden"),a.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),B.classList.remove("hidden"),setTimeout(()=>B.classList.remove("opacity-0"),50);const s=document.getElementById("search-filters");if(s&&s.remove(),r.length===0){B.innerHTML='<div class="text-center py-16 text-gray-400 text-sm">No tienes artículos guardados aún.</div>';return}const l=r.map(g=>Oe(g)).filter(Boolean);ve=l,B.innerHTML=`
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
            ${l.map(g=>`
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer result-item" data-id="${g.id}">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${g.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 truncate max-w-[200px]">${g.titulo_nombre||""}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${g.articulo_label}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${g.texto.substring(0,300)}...</p>
            </div>
            `).join("")}
        `,document.querySelectorAll("#results-container .result-item").forEach(g=>{g.addEventListener("click",()=>fe(g.dataset.id))});const d=document.getElementById("export-favs-btn"),c=document.getElementById("export-favs-menu");d&&c&&(d.addEventListener("click",g=>{g.stopPropagation(),c.classList.toggle("hidden")}),document.addEventListener("click",function g(u){!u.target.closest("#export-favs-btn")&&!u.target.closest("#export-favs-menu")&&(c.classList.add("hidden"),document.removeEventListener("click",g))})),(x=document.getElementById("export-favs-html"))==null||x.addEventListener("click",()=>{c==null||c.classList.add("hidden"),Ct(l,"Mis Favoritos SENER",!1),v("¡Exportando HTML!","📄","bg-blue-600")}),(h=document.getElementById("export-favs-csv"))==null||h.addEventListener("click",()=>{c==null||c.classList.add("hidden"),It(l,"favoritos_SENER.csv",!1),v("¡Exportando CSV!","📊","bg-green-700")})}function ot(){var l,d;const r=document.getElementById("reading-controls");let s=document.getElementById("compare-bar");if(re.length===0){s==null||s.remove(),r&&(r.classList.remove("bottom-16"),r.classList.add("bottom-6"));return}s||(s=document.createElement("div"),s.id="compare-bar",document.body.appendChild(s)),r&&(r.classList.remove("bottom-6"),r.classList.add("bottom-16")),s.className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl py-3 px-6 flex items-center justify-between",s.innerHTML=`
            <div class="flex items-center gap-3">
                <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                <span class="text-xs font-bold text-gray-700">${re.length} de 2 seleccionados</span>
                ${re.length<2?'<span class="text-xs text-gray-400">Selecciona un artículo más para comparar</span>':""}
            </div>
            <div class="flex items-center gap-2">
                <button id="compare-clear-btn" class="text-xs text-gray-400 hover:text-guinda transition-colors px-3 py-1.5">Limpiar</button>
                ${re.length===2?'<button id="compare-go-btn" class="px-4 py-2 bg-guinda text-white text-xs font-bold rounded-full hover:bg-guinda/90 transition-colors">Comparar →</button>':""}
            </div>
        `,(l=document.getElementById("compare-clear-btn"))==null||l.addEventListener("click",()=>{var x;re=[],ot();const c=((x=document.getElementById("law-search-input"))==null?void 0:x.value.toLowerCase().trim())||"";je(H.slice(0,50),c)}),(d=document.getElementById("compare-go-btn"))==null||d.addEventListener("click",()=>{St(re[0],re[1])})}function St(r,s){const l=Oe(r),d=Oe(s);if(!l||!d)return;const c=document.getElementById("compare-modal"),x=document.getElementById("compare-content"),h=document.getElementById("compare-panel");if(!c||!x)return;const g=f=>`
            <div class="flex flex-col">
                <div class="mb-4 p-3 bg-guinda/5 rounded-xl border border-guinda/10">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider block mb-1">${f.ley_origen}</span>
                    <h4 class="font-bold text-gray-800 text-sm mb-0.5">${f.articulo_label}</h4>
                    <span class="text-xs text-gray-400">${f.titulo_nombre||""} ${f.capitulo_nombre?"· "+f.capitulo_nombre:""}</span>
                </div>
                <div class="text-sm text-gray-700 font-serif leading-relaxed">
                    ${f.texto.split(`

`).map(b=>`<p class="mb-3">${b}</p>`).join("")}
                </div>
            </div>`;x.innerHTML=g(l)+g(d),c.classList.remove("hidden"),c.classList.add("flex"),setTimeout(()=>{h==null||h.classList.remove("scale-95","opacity-0"),h==null||h.classList.add("scale-100","opacity-100")},10);const u=document.getElementById("compare-share-btn"),w=document.getElementById("compare-share-menu"),E=document.getElementById("compare-share-text-btn");u&&w&&(u.onclick=f=>{f.stopPropagation(),w.classList.toggle("hidden")},document.addEventListener("click",function f(b){b.target.closest("#compare-share-menu-wrapper")||(w.classList.add("hidden"),document.removeEventListener("click",f))})),E&&(E.onclick=()=>{w==null||w.classList.add("hidden"),_t(l,d)})}function We(){const r=document.getElementById("compare-modal"),s=document.getElementById("compare-panel");s==null||s.classList.remove("scale-100","opacity-100"),s==null||s.classList.add("scale-95","opacity-0"),setTimeout(()=>{r==null||r.classList.add("hidden"),r==null||r.classList.remove("flex")},300)}async function Bt(r){const s=document.createElement("canvas");s.width=800,s.height=500;const l=s.getContext("2d"),d=l.createLinearGradient(0,0,0,s.height);d.addColorStop(0,"#9B2247"),d.addColorStop(1,"#6b1532"),l.fillStyle=d,l.fillRect(0,0,s.width,s.height),l.beginPath(),l.arc(s.width-60,60,120,0,Math.PI*2),l.fillStyle="rgba(255,255,255,0.06)",l.fill(),l.fillStyle="rgba(255,255,255,0.15)",l.beginPath(),l.roundRect(40,40,20+l.measureText(r.ley_origen).width+16,28,14),l.fill(),l.fillStyle="#fff",l.font="bold 13px system-ui, sans-serif",l.fillText(r.ley_origen,56,59),l.fillStyle="#fff",l.font="bold 28px system-ui, sans-serif";const c=at(l,r.articulo_label,s.width-80);c.forEach((f,b)=>l.fillText(f,40,110+b*38));const x=110+c.length*38+16;l.strokeStyle="rgba(255,255,255,0.3)",l.lineWidth=1,l.beginPath(),l.moveTo(40,x),l.lineTo(s.width-40,x),l.stroke();const h=x+24,g=s.height-h-60;l.fillStyle="rgba(255,255,255,0.88)",l.font="16px Georgia, serif";const u=r.texto.replace(/\s+/g," ").trim().substring(0,500),w=at(l,u,s.width-80);let E=0;for(const f of w){if(E*24>g){l.fillStyle="rgba(255,255,255,0.5)",l.font="13px system-ui, sans-serif",l.fillText("...",40,h+E*24);break}l.fillText(f,40,h+E*24),E++}return l.fillStyle="rgba(255,255,255,0.35)",l.fillRect(0,s.height-44,s.width,44),l.fillStyle="rgba(255,255,255,0.8)",l.font="12px system-ui, sans-serif",l.fillText("Buscador de Leyes Energéticas · SENER",40,s.height-16),s.toDataURL("image/png")}function at(r,s,l,d){const c=s.split(" "),x=[];let h="";for(const g of c){const u=h?h+" "+g:g;r.measureText(u).width>l&&h?(x.push(h),h=g):h=u}return h&&x.push(h),x}function Tt(r){const s=`📋 *${r.articulo_label}*
🏛️ ${r.ley_origen}

${r.texto.substring(0,800)}${r.texto.length>800?"...":""}`,l=`https://wa.me/?text=${encodeURIComponent(s)}`;window.open(l,"_blank")}async function Mt(r){const s=await Bt(r),l=await(await fetch(s)).blob(),d=new File([l],"articulo.png",{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[d]}))await navigator.share({title:r.articulo_label,text:`${r.articulo_label} · ${r.ley_origen}`,files:[d]});else{const c=document.createElement("a");c.href=s,c.download=`${r.articulo_label.replace(/\s+/g,"_")}.png`,c.click()}}function _t(r,s){const l=`⚖️ *Comparación de Artículos*

📋 *${r.articulo_label}* – ${r.ley_origen}
${r.texto.substring(0,400)}${r.texto.length>400?"...":""}

📋 *${s.articulo_label}* – ${s.ley_origen}
${s.texto.substring(0,400)}${s.texto.length>400?"...":""}`,d=`https://wa.me/?text=${encodeURIComponent(l)}`;window.open(d,"_blank")}function Ge(r,s){const l=`${location.origin}${location.pathname}#art-${encodeURIComponent(r.id)}`,d=`${r.articulo_label} · ${r.ley_origen}`,c=`📋 *${r.articulo_label}*
🏛️ ${r.ley_origen}

${r.texto.substring(0,500)}${r.texto.length>500?"...":""}

${l}`,x=`${r.articulo_label} · ${r.ley_origen} — Marco Legal Energético SENER`,h={telegram:`https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent(d)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(x)}&url=${encodeURIComponent(l)}`,email:`mailto:?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(c)}`};h[s]&&window.open(h[s],"_blank")}function Ne(r,s){const l=`${location.origin}${location.pathname}#ley-${encodeURIComponent(r.id)}`,d=r.titulo,c=r.resumen?r.resumen.split(`

`)[0].substring(0,400):`${r.articulos} artículos`,x=`🏛️ *${r.titulo}*
📅 Publicado: ${r.fecha}
📖 ${r.articulos} artículos

${c}

${l}`,h=`${r.titulo} — Marco Legal Energético SENER`,g={whatsapp:`https://wa.me/?text=${encodeURIComponent(x)}`,telegram:`https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent(d)}`,twitter:`https://twitter.com/intent/tweet?text=${encodeURIComponent(h)}&url=${encodeURIComponent(l)}`,email:`mailto:?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(x)}`};g[s]&&window.open(g[s],"_blank")}function st(){var g;te(null),ee(),F(),n.classList.add("hidden"),a.classList.add("hidden"),e.classList.add("hidden"),t&&t.classList.add("hidden","opacity-0"),o.classList.remove("justify-center","pt-24"),o.classList.add("pt-8"),B.classList.remove("hidden"),setTimeout(()=>B.classList.remove("opacity-0"),50);const r=document.getElementById("search-filters");if(r&&r.remove(),V.length===0){B.innerHTML='<div class="text-center py-16 text-gray-400">Cargando datos...</div>';return}const s=V.reduce((u,w)=>u+w.articulos,0),l=V.filter(u=>u.titulo.toLowerCase().startsWith("ley")),d=V.filter(u=>u.titulo.toLowerCase().startsWith("reglamento")),c=V.filter(u=>!u.titulo.toLowerCase().startsWith("ley")&&!u.titulo.toLowerCase().startsWith("reglamento")),x=[...V].sort((u,w)=>w.articulos-u.articulos),h=((g=x[0])==null?void 0:g.articulos)||1;B.innerHTML=`
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Estadísticas del Marco Jurídico</h2>
                <p class="text-sm text-gray-400 font-light">Resumen del corpus legal indexado en el sistema.</p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-guinda block">${V.length}</span>
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
                    ${x.map(u=>{const w=u.titulo.toLowerCase().startsWith("ley"),E=u.titulo.toLowerCase().startsWith("reglamento"),f=w?"#9B2247":E?"#1E5B4F":"#A57F2C",b=Math.round(u.articulos/h*100);return`
                        <div class="flex items-center gap-3 cursor-pointer group stat-law-row" data-titulo="${u.titulo.replace(/"/g,"&quot;")}">
                            <div class="text-xs text-gray-500 w-44 truncate flex-shrink-0 group-hover:text-guinda transition-colors" title="${u.titulo}">${u.titulo}</div>
                            <div class="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500" style="width:${b}%; background:${f};"></div>
                            </div>
                            <span class="text-xs font-bold text-gray-500 w-8 text-right flex-shrink-0">${u.articulos}</span>
                        </div>`}).join("")}
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                ${[{label:"Leyes Federales",items:l,textClass:"text-guinda",bgClass:"bg-guinda/5"},{label:"Reglamentos",items:d,textClass:"text-emerald-700",bgClass:"bg-emerald-50"},{label:"Acuerdos y Otros",items:c,textClass:"text-amber-700",bgClass:"bg-amber-50"}].map(u=>`
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-bold ${u.textClass} uppercase tracking-widest">${u.label}</span>
                            <span class="text-xs ${u.bgClass} ${u.textClass} font-bold px-2 py-0.5 rounded-full">${u.items.length}</span>
                        </div>
                        <div class="space-y-1.5">
                            ${u.items.map(w=>`
                                <div class="text-xs text-gray-500 truncate hover:text-guinda cursor-pointer transition-colors stat-law-row" data-titulo="${w.titulo.replace(/"/g,"&quot;")}" title="${w.titulo}">${w.titulo}</div>
                            `).join("")}
                        </div>
                    </div>
                `).join("")}
            </div>
        `,document.querySelectorAll(".stat-law-row").forEach(u=>{u.addEventListener("click",()=>{const w=V.find(E=>E.titulo===u.dataset.titulo);w&&Ce(w)})})}function Ie(){var u,w,E;if(!B)return;let r=X;if(N.type!=="all"&&(r=r.filter(f=>N.type==="ley"?f.ley_origen.toLowerCase().includes("ley"):N.type==="reglamento"?f.ley_origen.toLowerCase().includes("reglamento"):!f.ley_origen.toLowerCase().includes("ley")&&!f.ley_origen.toLowerCase().includes("reglamento"))),N.law!=="all"&&(r=r.filter(f=>f.ley_origen===N.law)),N.artNum){const f=parseInt(N.artNum);r=r.filter(b=>{const C=b.articulo_label.match(/\d+/);return C&&parseInt(C[0])===f})}const s=r,l=Z,d=document.getElementById("search-filters");if(d&&d.remove(),X.length>0){const f=document.createElement("div");f.id="search-filters",f.className="flex flex-col items-center gap-2 mb-6 animate-fade-in-up";const b=[...new Set(X.map(z=>z.ley_origen))].sort();f.innerHTML=`
                <div class="flex flex-wrap justify-center gap-2">
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${N.type==="all"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="all">Todos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${N.type==="ley"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="ley">Leyes</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${N.type==="reglamento"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="reglamento">Reglamentos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${N.type==="otros"?"bg-guinda text-white border-guinda":"bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda"}" data-type="otros">Otros</button>
                </div>
                <div class="flex items-center gap-2 flex-wrap justify-center">
                    ${b.length>1?`
                    <select id="law-filter-select" class="text-xs border rounded-full px-4 py-1.5 focus:outline-none bg-white cursor-pointer transition-colors ${N.law!=="all"?"border-guinda text-guinda":"border-gray-200 text-gray-500 hover:border-guinda"}">
                        <option value="all">Todas las leyes</option>
                        ${b.map(z=>`<option value="${z}" ${N.law===z?"selected":""}>${z}</option>`).join("")}
                    </select>
                    `:""}
                    <div class="relative flex items-center">
                        <svg class="absolute left-3 w-3 h-3 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
                        <input type="number" id="art-number-filter" min="1" placeholder="Nº artículo"
                            value="${N.artNum}"
                            class="text-xs border rounded-full pl-8 pr-3 py-1.5 w-28 focus:outline-none bg-white transition-colors ${N.artNum?"border-guinda text-guinda":"border-gray-200 text-gray-500 hover:border-guinda"} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                    </div>
                    ${N.type!=="all"||N.law!=="all"||N.artNum?`
                    <button id="clear-all-filters" class="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-full border border-red-100 hover:border-red-200 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        Limpiar filtros
                    </button>`:""}
                </div>
            `,B.parentNode.insertBefore(f,B),f.querySelectorAll(".filter-btn").forEach(z=>{z.addEventListener("click",G=>{N.type=G.target.dataset.type,k=1,Ie()})});const C=document.getElementById("law-filter-select");C&&C.addEventListener("change",z=>{N.law=z.target.value,k=1,Ie()});const R=document.getElementById("art-number-filter");if(R){let z;R.addEventListener("input",G=>{clearTimeout(z),z=setTimeout(()=>{N.artNum=G.target.value.trim(),k=1,Ie()},400)})}(u=document.getElementById("clear-all-filters"))==null||u.addEventListener("click",()=>{N={type:"all",law:"all",artNum:""},k=1,Ie()})}if(s.length===0){const f=N.type!=="all"||N.law!=="all";B.innerHTML=`
                <div class="text-center py-16 px-4">
                    <div class="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <h3 class="font-head text-lg font-bold text-gray-700 mb-2">
                        ${f?"Sin resultados con los filtros actuales":`Sin resultados para "<span class="text-guinda">${l}</span>"`}
                    </h3>
                    <p class="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                        ${f?"Prueba cambiando o eliminando los filtros aplicados.":"Intenta con otras palabras, un artículo específico o explora directamente las leyes."}
                    </p>
                    ${f?"":`
                    <div class="flex flex-wrap gap-2 justify-center mb-4">
                        ${["Transmisión","Generación","CENACE","Distribución","Tarifas","Permisos"].map(C=>`<button class="empty-suggestion px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500 hover:bg-guinda/5 hover:border-guinda/30 hover:text-guinda transition-all">${C}</button>`).join("")}
                    </div>
                    <button id="empty-browse-laws" class="text-xs font-semibold text-guinda hover:text-guinda/70 transition-colors underline underline-offset-2">Explorar todas las leyes →</button>
                    `}
                </div>`,B.querySelectorAll(".empty-suggestion").forEach(C=>{C.addEventListener("click",()=>{I&&(I.value=C.textContent,I.dispatchEvent(new Event("input")))})}),(w=document.getElementById("empty-browse-laws"))==null||w.addEventListener("click",()=>Re());const b=document.getElementById("results-container").nextElementSibling;b&&b.classList.contains("pagination-nav")&&b.remove();return}const c=(k-1)*P,x=c+P,h=s.slice(c,x),g=((E=s[0])==null?void 0:E.score)||1;ve=s,B.innerHTML=h.map(f=>{const b=Pe(f.texto.substring(0,300)+"...",l),C=Pe(f.articulo_label,l),R=Lt(f.score,g),z=Qe(f.id)?'<svg class="w-4 h-4 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';return`
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer result-item" data-id="${f.id}">
                <button class="bookmark-card-btn absolute top-3 right-3 p-1.5 text-gray-300 hover:text-guinda transition-colors rounded-full hover:bg-guinda/5 z-10" data-id="${f.id}" title="Guardar en favoritos">${z}</button>
                <div class="flex items-center gap-2 mb-2 flex-wrap pr-8">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${f.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 font-medium tracking-wide truncate max-w-[200px]">${f.titulo_nombre||""}</span>
                    <span class="ml-auto">${R}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${C}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${b}</p>
            </div>
            `}).join(""),he(s.length,"results-container",Ie),document.querySelectorAll(".result-item").forEach(f=>{f.addEventListener("click",b=>{b.target.closest(".bookmark-card-btn")||fe(f.dataset.id)})}),document.querySelectorAll(".bookmark-card-btn").forEach(f=>{f.addEventListener("click",b=>{b.stopPropagation(),qe(f.dataset.id),Ie()})})}function fe(r){const s=Oe(r);if(!s)return;L.textContent=s.ley_origen,$.textContent=s.articulo_label,L.onclick=()=>{const Q=V.find(ne=>ne.titulo===s.ley_origen);Q&&(ze(),setTimeout(()=>Ce(Q),310))};let l=s.texto.replace(/\r\n/g,`
`).replace(/\n\s*\n/g,`

`).replace(/([a-z,;])\n([a-z])/g,"$1 $2");const d=Q=>Z?Pe(Q,Z):Q,c=Q=>Q&&Q!=="null"&&Q!=="undefined"&&Q.trim()?Q.trim():null,x=c(s.titulo_nombre),h=c(s.capitulo_nombre),g=[x,h].filter(Boolean);m.innerHTML=`
            ${g.length?`
            <div class="mb-5 pb-5 border-b border-gray-50">
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-guinda/60 uppercase tracking-[0.2em] mb-2">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                    Ubicación en el documento
                </div>
                <div class="flex flex-wrap gap-x-2 gap-y-1">
                    ${g.map((Q,ne)=>`
                        <span class="text-xs text-gray-600 font-medium">${Q}</span>
                        ${ne<g.length-1?'<span class="text-gray-200">›</span>':""}
                    `).join("")}
                </div>
            </div>`:""}
            ${Z?`
            <div class="mb-5 flex items-center gap-2 text-[11px] text-guinda/70 bg-guinda/5 border border-guinda/10 px-3 py-2 rounded-lg">
                <svg class="w-3 h-3 flex-shrink-0 text-guinda/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span class="font-medium">Búsqueda:</span> <mark class="hl">${Z}</mark>
            </div>`:""}
            <div class="text-gray-800 leading-[1.85] text-[0.92rem]" style="font-family:'Merriweather',serif; text-align:justify; hyphens:auto;">
                ${l.split(`

`).map(Q=>`<p class="mb-4">${d(Q)}</p>`).join("")}
            </div>
        `;const u=ve.findIndex(Q=>Q.id===r),w=ve.length,E=document.getElementById("modal-prev-btn"),f=document.getElementById("modal-next-btn"),b=document.getElementById("modal-nav-counter");E&&(E.disabled=u<=0,E.onclick=()=>{u>0&&fe(ve[u-1].id)}),f&&(f.disabled=u<0||u>=w-1,f.onclick=()=>{u<w-1&&fe(ve[u+1].id)}),b&&(b.textContent=u>=0?`${u+1}/${w}`:"");const C=document.getElementById("modal-bookmark-btn");if(C){const Q=Qe(r);C.innerHTML=Q?'<svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>':'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>',C.onclick=()=>{qe(r),fe(r)}}const R=document.getElementById("copy-btn");R&&(R.onclick=()=>{navigator.clipboard.writeText(m.innerText).then(()=>{v("¡Texto copiado!","📋")})});const z=document.getElementById("share-btn"),G=document.getElementById("share-menu");document.getElementById("share-text-btn"),document.getElementById("share-image-btn"),z&&G&&(z.onclick=Q=>{Q.stopPropagation(),G.classList.toggle("hidden")},document.addEventListener("click",function Q(ne){ne.target.closest("#share-menu-wrapper")||(G.classList.add("hidden"),document.removeEventListener("click",Q))}));const me=Be(r);m.innerHTML+=`
            <div class="mt-8 pt-6 border-t border-gray-100" id="notes-section">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Mis notas
                    </span>
                    <button id="delete-note-btn" class="text-[10px] text-red-300 hover:text-red-500 transition-colors ${me?"":"hidden"}" aria-label="Borrar nota">Borrar</button>
                </div>
                <textarea id="article-note-input"
                    placeholder="Escribe tus anotaciones sobre este artículo..."
                    class="w-full text-xs text-gray-700 border border-amber-100 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all bg-amber-50/40 leading-relaxed font-light"
                    rows="3" aria-label="Notas del artículo">${me}</textarea>
                <div class="flex items-center justify-between mt-2">
                    <span id="note-saved-indicator" class="text-[10px] text-amber-500 flex items-center gap-1 ${me?"":"invisible"}">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        Guardada
                    </span>
                    <button id="save-note-btn" class="text-xs font-semibold text-guinda hover:text-guinda/70 transition-colors px-3 py-1.5 bg-guinda/5 rounded-lg hover:bg-guinda/10" aria-label="Guardar nota">Guardar</button>
                </div>
            </div>
        `;const se=document.getElementById("article-note-input"),ye=document.getElementById("save-note-btn"),we=document.getElementById("delete-note-btn"),ie=document.getElementById("note-saved-indicator");ye&&se&&ye.addEventListener("click",()=>{rt(r,se.value),v("¡Nota guardada!","📝","bg-amber-600"),ie==null||ie.classList.remove("invisible"),we&&we.classList.toggle("hidden",!se.value.trim())}),we&&se&&we.addEventListener("click",()=>{rt(r,""),se.value="",ie==null||ie.classList.add("invisible"),we.classList.add("hidden"),v("Nota eliminada","🗑️","bg-gray-600")});const Ae=document.getElementById("cite-btn");Ae&&(Ae.onclick=()=>{const Q=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),ne=`${location.origin}${location.pathname}#art-${encodeURIComponent(r)}`,le=`${s.articulo_label} de la ${s.ley_origen}${s.fecha_publicacion?", publicada el "+s.fecha_publicacion:""}. Secretaría de Energía, Gobierno de México. Consultado el ${Q}. Disponible en: ${ne}`;navigator.clipboard.writeText(le).then(()=>v("¡Cita copiada!","📖","bg-guinda"))}),Object.entries({"share-text-btn":()=>Tt(s),"share-image-btn":()=>Mt(s),"share-telegram-btn":()=>Ge(s,"telegram"),"share-twitter-btn":()=>Ge(s,"twitter"),"share-email-btn":()=>Ge(s,"email")}).forEach(([Q,ne])=>{const le=document.getElementById(Q);le&&(le.onclick=()=>{G==null||G.classList.add("hidden"),ne()})}),te(`#art-${encodeURIComponent(r)}`),i.classList.remove("hidden"),i.classList.add("flex");const ke=document.getElementById("share-link-btn");ke&&(ke.onclick=()=>{G==null||G.classList.add("hidden");const Q=`${location.origin}${location.pathname}#art-${encodeURIComponent(r)}`;navigator.clipboard.writeText(Q).then(()=>v("¡Enlace copiado!","🔗","bg-blue-600"))}),setTimeout(()=>{p.classList.remove("scale-95","opacity-0"),p.classList.add("scale-100","opacity-100")},10)}function ze(){te(null),p.classList.remove("scale-100","opacity-100"),p.classList.add("scale-95","opacity-0"),setTimeout(()=>{i.classList.add("hidden"),i.classList.remove("flex")},300)}function it(){var s;let r=document.getElementById("keyboard-help-modal");if(r){r.remove();return}r=document.createElement("div"),r.id="keyboard-help-modal",r.className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",r.innerHTML=`
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
        `,document.body.appendChild(r),r.addEventListener("click",l=>{l.target===r&&r.remove()}),(s=document.getElementById("kbd-help-close"))==null||s.addEventListener("click",()=>r.remove())}(pt=document.getElementById("keyboard-help-btn"))==null||pt.addEventListener("click",it),document.addEventListener("keydown",r=>{var c,x,h,g;const s=r.target.tagName,l=s==="INPUT"||s==="TEXTAREA"||s==="SELECT"||r.target.isContentEditable,d=!i.classList.contains("hidden");if(r.key==="?"&&!l){r.preventDefault(),it();return}if(r.key==="Escape"){const u=document.getElementById("keyboard-help-modal");if(u){u.remove();return}const w=document.getElementById("toc-panel");if(w&&!w.classList.contains("translate-y-full")){w.classList.add("translate-y-full"),document.body.style.overflow="";return}if(d){ze();return}const E=document.getElementById("compare-modal");if(E&&!E.classList.contains("hidden")){We();return}return}if(r.key==="/"&&!l){r.preventDefault(),I&&(I.focus(),I.select());return}if(d&&!l){if(r.key==="ArrowRight"||r.key==="ArrowDown"){r.preventDefault(),(c=document.getElementById("modal-next-btn"))==null||c.click();return}if(r.key==="ArrowLeft"||r.key==="ArrowUp"){r.preventDefault(),(x=document.getElementById("modal-prev-btn"))==null||x.click();return}if(r.key==="f"||r.key==="F"){r.preventDefault(),(h=document.getElementById("modal-bookmark-btn"))==null||h.click();return}if((r.key==="c"||r.key==="C")&&!r.ctrlKey&&!r.metaKey){r.preventDefault(),(g=document.getElementById("copy-btn"))==null||g.click();return}}}),"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})}),S&&S.addEventListener("click",ze),i==null||i.addEventListener("click",r=>{r.target===i&&ze()}),A&&A.addEventListener("click",()=>{const r=m.innerText;navigator.clipboard.writeText(r).then(()=>{const s=A.innerHTML;A.innerHTML='<span class="text-verde font-bold">¡Copiado!</span>',setTimeout(()=>{A.innerHTML=s},2e3)})})}document.addEventListener("DOMContentLoaded",()=>{zt(),Ot()});
