/*
 * 数字动画（目前仅支持数字动画的线性变化）
 * options参数：
 *  from {Number} 起始数字
 *  to {Number} 终点数字
 *  duration {Number} 动画时间
 *  callback {Function} 数字变化时的回调函数
 */
(function( $ ) {
 $.fn.animatingNumber = function(options) {
  var settings = {
   element: this,
   startNum: options.from,
   endNum: options.to,
   duration: options.duration || 2000,
   callback: options.callback
  };
  var timer = null;
 
  var methods = {
   start: function() {
    var _this = this;
    _this.animate();
   },
   stop: function() {
    if(timer) {
     clearTimeout(timer);
     timer = null;
    }
   },
   animate: function() {
    var _this = this;
    var curNum = settings.startNum;
    var animateTime = 0;
    var range = settings.endNum - settings.startNum;
    var timerStep = Math.abs( Math.floor(settings.duration / range) );
    timerStep = timerStep > 20 ? timerStep : 20;
    var numStep = (range / settings.duration) * timerStep;
 
    _this.stop();
 
    (function animate() {
     timer = setTimeout(function() {
      curNum = Math.ceil( curNum + numStep );
      if( (settings.endNum > settings.startNum && curNum >= settings.endNum) || (settings.endNum < settings.startNum && curNum <= settings.endNum) ) {
       curNum = settings.endNum;
      }
      settings.element.text(curNum);
      animateTime++;
      if(typeof settings.callback == 'function') {
       settings.callback(curNum);
      }
      animate();
      if(curNum >= settings.endNum) {
       _this.stop();
      }
     }, timerStep);
    })();
   }
  };
  return this.each(function() {
   return methods.start();
  });
 
 };
})( jQuery );