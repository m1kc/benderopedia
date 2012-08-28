/************************************************************
*
* tex2htm.js: unicode-LaTeX-expression converter 2 html-css
* Slogan: 20% of the LaTeX-language features - solve 80% problems
* Recommendation: 4 complex formulas use unicode-tex2img-services
*
* Author: Klinachev Nikolay Vasilyevich
* Version: 1.2 - 20111003
* Examples: http://model.exponenta.ru/lectures/index.htm
* js-charset: us-ascii or ISO-8859-1 or Windows-1252
*
* Delimiters for the LaTeX-expression: $$ - ($|z_i| \lt 1$)
* Math-CSS for: ru-ru lcid="1049" culture="Russian (Russia)"
* HTML-CSS for: HTML 4, HTML 5 (not 4 chm-files "IE=EmulateIE7")
*
* You may change:
* 1) CSS in tex2htm.styles or overwrite it in html-page
* 2) add or remove tags name 4 process in tex2htm.tag
* 3) add or remove searched function names in tex2htm.str4re
*/

window.tex2htm = {
  styles: '\
    span.math {letter-spacing:0.2em;padding-left:0.25em;padding-right:0.05em;white-space:nowrap;font-family:"Times New Roman";}\n\
    span.mn,\n\
    span.mfun {letter-spacing:0em;padding-right:0.2em;}\n\
    span.msup,\n\
    span.msub {letter-spacing:0.1em;/*?0.1*/padding-right:0.2em;font-size:0.7em;}\n\
    span.msup {vertical-align:super;color:blue;}\n\
    span.msub {vertical-align:sub;  color:blue;margin-left:-0.15em;}\n\
    span.msup span.msub {margin-left:0em;}\n\
    span.mvec {text-decoration:overline;}\n\
    span.mi   {font-style:italic;color:red;}\n\
    span.mfun {color:teal;}\n\
    span.mn   {color:green;}\n\
    table.frac {margin:auto;border-spacing:0;text-align:center;}\n\
    table.frac td {padding:0;}\n\
    table.frac tr:first-child > td[rowspan="2"]+td {border-bottom: solid 1px black;}\n\
    /*or table.frac td.num {border-bottom: solid 1px black;}*/\n\
    table.impt {padding:4px;border: solid 1px red;}\n\
    /*span.math {background-color: #F5F5F5;}*/'
  ,
  tag: ['p','li','td','dt','dd','h3','h2','div','math'],//'div'
  str4re: "(sqrt|Re|Im|ln|log|lg|int|sign|arg|sin|cos|arcsin|arccos|lim|deg"+"|max|min|var|const"+"|tg|arctg|FT|DFT|Inv|rand)",
  //|sinh|cosh|tanh|cot|coth|csc|det|dim|gcd|hom|inf|ker|liminf|limsup|Pr|sec|sup|arctan|tan
  reg4Fn: null,//Find list
  reg4St: null,//Stop list
  isIE: document.createElementNS==null,
  className: ["math","msup","msub","mfun","mvec","mn","mi"],

  ParseDoc: function () {
    // init local Properties
    tex2htm.reg4Fn = new RegExp("\\\\"+tex2htm.str4re,"g");
    tex2htm.reg4St = new RegExp("(lt|gt)|"+tex2htm.str4re);//,"g"
    // add CSS to html-page
    var head = (document.getElementsByTagName("head"))[0]; if (!head) {head = document.body}
    var style = document.createElement("style"); style.type = "text/css";
    if (head.firstChild) head.insertBefore(style,head.firstChild);
    else head.appendChild(style);
    if (style.styleSheet && typeof(style.styleSheet.cssText) !== 'undefined')
      style.styleSheet.cssText = tex2htm.styles;//IE
    else style.appendChild(document.createTextNode(tex2htm.styles));//FF
    // Process doc
    for (var j=0;j<tex2htm.tag.length;j++) {
      var frag = document.getElementsByTagName(tex2htm.tag[j]);
      for (var i=0;i<frag.length;i++)
      {
        if (-1 != frag[i].innerHTML.search(/\$/))// or .indexOf('$')
          frag[i].innerHTML = frag[i].innerHTML.replace
          (/\$([^<>]*?)\$/g, function($1){return tex2htm.ConvertLaTexExp($1);} );
      }
    }
  },

  Copy2Clipboard: function (sLatex) {
    if (window.clipboardData) window.clipboardData.setData("Text","$"+sLatex+"$");
  },

  ConvertLaTexExp: function (data) {
    //$\eqref{#.#}$ or $\ref{[eq:|fig:]#.#}$ //TODO: fig
    if (-1 != data.search(/(eqref|ref)/))
      return data.replace(/(.*)\\(eqref|ref)\s*\{(eq|fig|)(:|)(.+)\}(.*)/,'(<a href="#LaTeX$3$2$5">$5<\/a>)');
    //$(eq:|fig:)#.#$ or see below $\label{[eq:|fig:]#.#}$
    if (-1 != data.search(/\$(eq|fig):/))
      return data.replace(/\$(eq|fig):\s*(.+)\$/,'<a id="LaTeX$1ref$2"><\/a>($2)');

    // TODO: incapsulate {{{}{}}}

    //delete spaces (/[ ]+/g,"")
    var out = data.replace(/\s+/g,"");
    //80% of the LaTeX-expressions does not contains a Backslash
    var IsBackslashContains = (-1 != out.search(/\\/));// or .indexOf('\\')

    //replace hyphen-minus (dephis) by minus sign
    out = out.replace(/-/g,"\u2212");
    if (IsBackslashContains)
    {
      out = out.replace(/\\pm/g,"\u00B1");
      //math-characters not applicable in many fonts but supported by browsers
      out = out.replace(/\\mp/g,"\u2213");
      out = out.replace(/\\nabla/g,"\u2207");
      out = out.replace(/\\in/g,"\u2208");
      out = out.replace(/\\ni/g,"\u220B");
      out = out.replace(/\\sim/g,"\u223C");
      out = out.replace(/\\vartheta/g,"\u03D1");
      out = out.replace(/\\piv/g,"\u03D6");
      //math-characters for ANSI (non utf-8) pages support
      out = out.replace(/\\times/g,"\u00D7");
      out = out.replace(/\\cdot/g,"\u00B7");
      out = out.replace(/\\prime/g,"\u2032");
      out = out.replace(/\\partial/g,"\u2202");
      // sum int ... end for ANSI
      //HTML exception chars. Info: Private Use Area U+E000-F8FF
      out = out.replace(/\\lt/g, "\uE000"); //temp < see below
      out = out.replace(/\\gt/g, "\uE001"); //temp > see below
      out = out.replace(/\\amp/g,"\uE002"); //temp & see below
      //out = out.replace(/\\sqrt/g,"\u221A");//as Fn ??
    }
    //replace dollar signs with SPAN math
    out = out.replace(/\$(.*?)\$/g,'<span class="'+tex2htm.className[0]+'">$1<\/span>');
    // 1st without incapsulate {} or OK RegExp 4 this
    {
      c1 = '<span class="'+tex2htm.className[2]+'">$2$3<\/span>';
      c2 = '<span class="'+tex2htm.className[1]+'">$2$3<\/span>';
      k=0;
      //subscripts and superscripts: _ _{} _{_{}} _{^{}} ^ ^{} ^{^{}} ^{_{}}
      while(-1 != data.search(/(_|\^)/) && 4 > k++)
      {
        out = out.replace (/_(([^\{])|\{([^\{]+?)\})/g, c1);
        out = out.replace(/\^(([^\{])|\{([^\{]+?)\})/g, c2);
      }
      //all LABLES become <a id=
      out = out.replace(/\\label\{(eq|fig|)(:|)(.+?)\}/g,'<a id="LaTeX$1ref$3"><\/a>');
      //replace vectors with SPAN overline
      out = out.replace(/\\vec\{(.+?)\}/g,'<span class="'+tex2htm.className[4]+'">$1<\/span>');
      //\hat{} vectors ^
      //out = out.replace(/\\hat\{(.+?)\}/g,"<b>$1<\/b>");
    }
    // 2nd with posible incapsulate {}
    if (IsBackslashContains && (IsBackslashContains = (-1 != out.search(/\\/))))
    {
      out = out.replace(/\\sqrt\{([^\{]+?)\}/g,"\\sqrt($1)");//and ...
    }

    //replace math spaces
    c21 = '<span style="margin-left:'; c22 = 'em"><!-- 4 tidy.exe --><\/span>';
    out = out.replace(  /~/ig, c21+"0.333"+c22);
    if (IsBackslashContains)
    {
      out = out.replace(/\\!/ig, c21+"-0.167"+c22);
      out = out.replace(/\\,/ig, c21+"0.167"+c22);
      out = out.replace(/\\:/ig, c21+"0.222"+c22);
      out = out.replace(/\\;/ig, c21+"0.278"+c22);
      out = out.replace( /\\quad/ig, c21+"1"+c22);
      out = out.replace(/\\qquad/ig, c21+"2"+c22);
    }

    //replace named math functions with SPAN fn
    if (IsBackslashContains && (IsBackslashContains = (-1 != out.search(/\\/))))
    out = out.replace(tex2htm.reg4Fn,'<span class="'+tex2htm.className[3]+'">$1<\/span>');

    //TODO: _{min|max|var}, may be ^{min|max|var}

    //replace digits with SPAN mn: 1 11 1.1 .1 1,1 ,1 TODO: 0..1
    out = out.replace(/>[^<]+</g,
      function($1){
        return ($1).replace(/([0-9]*[,.]?[0-9]+)/g,'<span class="'+tex2htm.className[5]+'">$1<\/span>');
      } );

    //replace Latin Var with SPAN mi
    out = out.replace(/>[^<]+</g,//(.*?)
      function($1){
       return ($1).replace(/([A-Za-z']+)/g, // '" (no! \u2032\u2033-\(p|P)rime)
         function($1){
           //if (tex2htm.reg4St.test($1))//gluck in FF
           if (-1 != ($1).search(tex2htm.reg4St))// || -1 != ($1).search(/(lt|gt)/)
           return $1;
           else return '<span class="'+tex2htm.className[6]+'">'+$1+'<\/span>';
         } );
      } );
    // HTML exception chars
    out = out.replace(/\uE000/g, "&lt;"); // < see above
    out = out.replace(/\uE001/g, "&gt;"); // > see above
    out = out.replace(/\uE002/g,"&amp;"); // & see above

    return '<span onclick="tex2htm.Copy2Clipboard(this.title)" title="'
      + (data.substring(1,data.length-1)) + '">' + out + '<\/span>';
  }
}

if (window.addEventListener) {window.addEventListener("load",tex2htm.ParseDoc,false)} //FF
else if (window.attachEvent) {window.attachEvent("onload",tex2htm.ParseDoc)} //IE
else {
  if (typeof window.onload == 'function')
  { var existing = onload; window.onload = function(){existing();tex2htm.ParseDoc();}; }
  else window.onload = tex2htm.ParseDoc;
}
