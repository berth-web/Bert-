document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('[data-go]');
  if(a){e.preventDefault();parent.postMessage({go:a.getAttribute('data-go')},'*')}
});
document.addEventListener('DOMContentLoaded',function(){
  var b=document.getElementById('b'),s=document.getElementById('s');
  if(b&&s){
    var n=0,t=10,on=false,iv;
    b.onclick=function(){
      if(!on){on=true;n=0;t=10;iv=setInterval(function(){t--;s.textContent=n+' taps, '+t+'s left';if(t<=0){clearInterval(iv);on=false;s.textContent='Final score: '+n+'. Tap to go again.'}},1000)}
      n++;s.textContent=n+' taps, '+t+'s left';
    };
  }
  var ta=document.getElementById('t'),f=document.getElementById('f');
  if(ta&&f){ta.oninput=function(){f.srcdoc=ta.value};ta.oninput()}
});
