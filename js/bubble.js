"use strict";

{
  class Module {
    constructor(){
    }

    static getTemplate(){
      return new Promise(function( resolve, reject ){
        let req = new XMLHttpRequest();
        let templateUrl = chrome.extension.getURL('template/bubble.html');
        req.open('GET', templateUrl);
        req.onload = function(){
          if(Object.is(req.readyState, 4)){
            if(Object.is(req.status, 200)){
              resolve(req.response);
            } else{
              reject(req.req.status);
            }
          }
        };
        req.onerror = function(){
          reject('Template not found');
        };
        req.send();
      });
    }

    static injectData( template, data ){
      Mustache.parse(template);
      return Mustache.render(template, data);
    }

    static renderBubble( rendered ){
      if(document.querySelector('#y-bubble')){
        let unnecessaryBubble = document.querySelector('#y-bubble');
        unnecessaryBubble.parentNode.removeChild(unnecessaryBubble);
      }

      let selection = window.getSelection();
      let range = selection.getRangeAt(0);
      let rect = range.getBoundingClientRect();
      let bubbleLeft, bubbleTop, arrowRelativeLeft;

      let dummy = document.createElement('DIV');
      dummy.innerHTML = rendered.trim();
      let dummyChild = dummy.childNodes;
      document.body.appendChild(dummyChild[0]);

      let bubble = document.querySelector('#y-bubble');

      bubbleLeft = rect.left + rect.width / 2 - bubble.offsetWidth / 2;

      if(bubbleLeft < 5){
        bubbleLeft = 5;
        arrowRelativeLeft = rect.left + rect.width / 2 - 15;
      } else if((bubbleLeft + bubble.offsetWidth) > (document.body.offsetWidth + 5)){
        bubbleLeft = document.body.offsetWidth - bubble.offsetWidth - 5;
        arrowRelativeLeft = rect.left - bubbleLeft - 10 + rect.width / 2;
      } else{
        arrowRelativeLeft = bubble.offsetWidth / 2 - 10;
      }

      if(rect.top < bubble.offsetHeight){
        bubbleTop = rect.top + window.scrollY + rect.height + 8;

        let bubbleArrow = document.querySelector('#y-arrow');
        bubbleArrow.style.borderBottom = '10px solid rgba(13, 13, 13, .8)';
        bubbleArrow.style.borderTop = 0;
        bubbleArrow.style.top = '-8px';
        bubbleArrow.style.left = arrowRelativeLeft + 'px';
      } else{
        bubbleTop = rect.top + window.scrollY - bubble.offsetHeight - 10;

        let bubbleArrow = document.querySelector('#y-arrow');
        bubbleArrow.style.borderBottom = 0;
        bubbleArrow.style.borderTop = '10px solid rgba(13, 13, 13, .8)';
        bubbleArrow.style.top = bubble.offsetHeight + 'px';
        bubbleArrow.style.left = arrowRelativeLeft + 'px';
      }

      bubble.style.left = bubbleLeft + 'px';
      bubble.style.top = bubbleTop + 'px';


      document.addEventListener('click', function( ev ){
        if(bubble.parentNode){
          bubble.parentNode.removeChild(bubble);
        }
      });
      bubble.addEventListener('click', function( ev ){
        ev.stopPropagation();
      });
    }

    static enableDblclick(){
      document.addEventListener('dblclick', function( ev ){
        //let [from, resType, query, youdaoKey] = ['YoungdzeBlog', 'json', window.getSelection().toString().trim(), 498418215];
        let from = 'YoungdzeBlog', resType = 'json', query = window.getSelection().toString().trim(), youdaoKey = 498418215;
        if(_.isEmpty(query)) return;

        Module.getTemplate()
          .then(function( template ){
            let rendered;
            rendered = Module.injectData(template, {loading:true});
            Module.renderBubble(rendered);

            let youdao = new Youdao(from, youdaoKey, resType, query);
            youdao.getContent()
              .then(function( data ){
                data.loading = false;
                rendered = Module.injectData(template, data);
                Module.renderBubble(rendered);
              }).catch(function( err ){
                rendered = Module.injectData(template, {explains:err});
                Module.renderBubble(rendered);
              });
          });
      });
    }

    static enableKeydown(){
      let map = [];
      document.addEventListener('keydown', function( ev ){
        map.push(ev.keyCode);
      });
      document.addEventListener('keyup', function( ev ){
        if(Object.is(_.size(map), 1) && Object.is(map[0], 17)){
          //let [from, resType, query, youdaoKey] = ['YoungdzeBlog', 'json', window.getSelection().toString().trim(), 498418215];
          let from = 'YoungdzeBlog', resType = 'json', query = window.getSelection().toString().trim(), youdaoKey = 498418215;
          if(_.isEmpty(query)) return;

          Module.getTemplate()
            .then(function( template ){
              let rendered;
              rendered = Module.injectData(template, {loading:true});
              Module.renderBubble(rendered);

              let youdao = new Youdao(from, youdaoKey, resType, query);
              youdao.getContent()
                .then(function( data ){
                  data.loading = false;
                  rendered = Module.injectData(template, data);
                  Module.renderBubble(rendered);
                }).catch(function( err ){
                  rendered = Module.injectData(template, {explains:err});
                  Module.renderBubble(rendered);
                });
            });
        }
        map = [];
      });
    }
  }

  {
    chrome.storage.sync.get(function( items ){
      if(items.dblclick) Module.enableDblclick();
      if(items.ctrl) Module.enableKeydown();
    })
  }
}

function y_playSound( wav_file ){
  document.querySelector('#y-bubble-wav-wrapper').innerHTML = '<embed src="' + wav_file + '" type="audio/wav" autostart="true" style="width: 0; height: 0;">';
}
