/*===========================================================================================

*该图片查看器基于jquery开发，请务必在此之前引入jquery

*调用方法：imageView.showImage(objImage,index)

        objImage: 图片url数组或图片url字符串
        index   ：当前打开的图片在对象数组中的索引，缺省值为0

*调用示例：
        $(document).ready(function(){
            //调用示例1
            var imageView = new ImageView();
            $('#imglist').find('IMG').click(function(){
                 var objImages = new Array();
                 var index = 0;
                 var that = this;
                 $('#imglist').find('IMG').each(function(i){
                    objImages.push(this.src);
                    if(this.src == that.src){
                        index = i;
                    }
                 });

                 imageView.showImage(objImages,index);

            });

            //调用示例2
            var imageView = new ImageView();
            $('#imglist').find('IMG').click(function(){
                imageView.showImage(this.src);
            });

        });

=============================================================================================*/

//<canvas id="view-canvas" class="view-image" ></canvas>\ 

var htmlViewer = '\
        <div id="view-body" class="view-body border-box">\
            <div id="viewTopBar" class="view-top-bar">\
                <p class="view-img-name"></p>\
                <ul id="viewBodyBtnBar" class="view-body-btn-bar">\
                    <li id="viewBtnMin" class="view-btn-min"></li>\
                    <li id="viewBtnMax" class="view-btn-max"></li>\
                    <li class="view-btn-close" class="view-btn-close"></li>\
                </ul>\
            </div>\
            <div class="view-body-box">\
                <div id="view-mask" class="view-mask"></div>\
                <div class="view-tips">\
                    <p></p>\
                </div>\
                <table >\
                    <tr>\
                        <td class="view-box">\
                             <div class="view-container" >\
                                 <div id="viewWindow" class="view-window" >\
                                    <img id="view-image" class="view-image" src=""  />\
                                    <div class="view-drag"></div>\
                                 </div>\
                                 <div class="view-loading"></div>\
                                 <div class="view-load-error"></div>\
                             </div>\
                         </td>\
                    </tr>\
                </table>\
                <div id="viewToolBar" class="view-tool clearfix">\
                     <div class="view-btn-status btn-hide"></div>\
                     <ul>\
                         <li class="view-btn-prev" title="上一张"></li>\
                         <li class="view-btn-next" title="下一张"></li>\
                         <li class="view-btn-zoomin" title="放大"></li>\
                         <li class="view-btn-origin" title="原图"></li>\
                         <li class="view-btn-auto" title="自适应窗口"></li>\
                         <li class="view-btn-fh" title="水平翻转"></li>\
                         <li class="view-btn-rotate" title="顺时针旋转"></li>\
                     </ul>\
                 </div>\
                 <div class="view-align"></div>\
            </div>\
            <div data-side="left" class="resize-panel resize-left"></div>\
            <div data-side="right" class="resize-panel resize-right"></div>\
        </div>';

//$(document).ready(function(){
//    var imageView = new ImageView();       
//});


function ImageView(){

    this.minWindowWidth = 450;
    this.minWindowHeight = 300;
    this.canvasSupportFlag = null;
    this.minMarginLeft=0;
    this.minMarginTop=0;
    this.dragFlag = false;
    this.autoSizeFlag = false;
    this.fhFlag = false;
    this.arrImages = null;
    this.imageIndex = 0;
    this.currentImgSize = null;
    this.timeout = null;
    this.loadTimer = null;
    this.zoomRatio = 1.2;	//每次放大的倍数
    this.maxZoomRatio = 6;	//最大放大倍数
    this.waitTime = 60000;  //等待图片加载超时时间

    //this._init();
    this.jqDocument = $(top.document);
    this._addCssQuote();
    this.canvasSupportFlag = this._getCanvasFlag();
}
ImageView.prototype = {
	_init:function(){//初始化

        this.jqDocument.find('#view-body').remove();
        // this.jqDocument.find('#view-mask').remove();
        this.jqDocument.find('BODY').eq(0).append(htmlViewer);

        //设置窗口尺寸
        var bodyW = this.jqDocument.find('BODY').get(0).clientWidth;
        var bodyH = this.jqDocument.find('BODY').get(0).clientHeight;
        
        if(this.canvasSupportFlag){
            var elImage = this.jqDocument.find('#view-image');
            canvas = document.createElement('CANVAS');
            canvas.id = elImage.attr('ID');
            canvas.className = elImage.attr('CLASS');
            elImage.replaceWith(canvas);
        }
        this._setWindowSize(bodyW,bodyH);
        this._initBtnTools();
        this._initDragWindowEvent();
        this._initDragImageEvent();
        this._initResizeWindow();
	},
    _initBtnTools:function(){//按钮点击事件注册
    	var that = this;
    	this.jqDocument.find('.view-btn-status').click(function(){
            $(this).toggleClass('btn-hide');
            if(/btn-hide/.test($(this).attr('CLASS'))){
                $(this).parent().animate({'bottom':'0px'});
            }else{
                $(this).parent().animate({'bottom':'-41px'});
            }
        });

    	this.jqDocument.find('.view-btn-zoomin').click(function(){
    		that.zoomImage();
        });

    	this.jqDocument.find('.view-btn-prev').click(function(){
    		that.openPrev();      
        });

    	this.jqDocument.find('.view-btn-next').click(function(){
    		that.openNext();
        });

    	this.jqDocument.find('.view-btn-origin').click(function(){
    		that.originSize();
        });

    	this.jqDocument.find('.view-btn-auto').click(function(){
    		that.autoSize();
        });

    	//翻转图片
    	this.jqDocument.find('.view-btn-fh').click(function(){
    		that.flipHorizontal();
        });
        //旋转图片
    	this.jqDocument.find('.view-btn-rotate').click(function(){
    		that.rotateImage();
        });

        //最小化
        this.jqDocument.find('#viewBtnMin').click(function(){
            that._setWindowSize(that.minWindowWidth,that.minWindowHeight);
            that._setMaxViewSize();
            that.fixImageViewer();
        });
        //最大化
        this.jqDocument.find('#viewBtnMax').click(function(){
            var objBody = that.jqDocument.find('BODY').get(0);
            var bodyW = objBody.clientWidth;
            var bodyH = objBody.clientHeight;
            that._setWindowSize(bodyW,bodyH);
            that._setMaxViewSize();
            that.fixImageViewer();
        });
        //关闭查看器
    	this.jqDocument.find('.view-btn-close').click(function(){
            that.closeImage();
        });
    },
	_initDragImageEvent:function (){//图片拖动事件注册

		var that = this;
        var windowDrag = this.jqDocument.find('.view-window');
        var elDrag = this.jqDocument.find('.view-image');
        var mouseStartX,mouseStartY,mouseCurX,mouseCurY;
        
        windowDrag.mousedown(function(e){
            if(!that.dragFlag)
                return;

            var style = elDrag.get(0).style;
            var intMoveX,intMoveY,fixMaginLeft,fixMaginTop,marginLeft,marginTop;
            var movingFlag = false;
            if(e.pageX || e.pageY){
                mouseStartX = e.pageX;
                mouseStartY = e.pageY;
                marginLeft = parseInt(style.marginLeft);
                marginTop = parseInt(style.marginTop);
            }

            $(this).mousemove(function(e){
                //等待上一次的mousemov事件结束
                if(movingFlag)
                    return;
                movingFlag = true;

                if(e.pageX || e.pageY){
                    mouseCurX = e.pageX;
                    mouseCurY = e.pageY;
                }

                intMoveX = mouseCurX - mouseStartX + marginLeft;
                intMoveY = mouseCurY - mouseStartY + marginTop;

                fixMaginLeft = intMoveX<that.minMarginLeft?that.minMarginLeft:intMoveX;
                fixMaginLeft = fixMaginLeft>0?0:fixMaginLeft;
                fixMaginTop = intMoveY<that.minMarginTop?that.minMarginTop:intMoveY;
                fixMaginTop = fixMaginTop>0?0:fixMaginTop;

                var strMargin = fixMaginTop +'px ' + '0px 0px ' + fixMaginLeft + 'px';
                elDrag.css('margin',strMargin);

                movingFlag = false;
            });
        }).mouseup(function(){
            $(this).unbind('mousemove');
        }).mouseleave(function(){
            $(this).unbind('mousemove');
        });
    },
    _initDragWindowEvent:function (){
        var that = this;
        var objBody = this.jqDocument.find('BODY');
        // var elDrag = this.jqDocument.find('#view-body');
        var elWindow = this.jqDocument.find('#view-body');
        var mouseStartX,mouseStartY,mouseCurX,mouseCurY,leftStart,topStart;

        elWindow.mousedown(function(e){
            e.preventDefault();   //防止鼠标移除窗口后选中外面页面内容

            // 记录鼠标按下时的位置
            var style = elWindow.get(0).style;
            var fixLeft,fixTop;
            var movingFlag = false;
            if(e.pageX || e.pageY){
                mouseStartX = e.pageX;
                mouseStartY = e.pageY;
                leftStart = parseInt(style.left);
                topStart = parseInt(style.top);
            }

            // 鼠标按下后窗口跟随移动
            objBody.mousemove(function(e){
                //等待上一次的mousemov事件结束
                if(movingFlag)
                    return;
                movingFlag = true;

                if(e.pageX || e.pageY){
                    mouseCurX = e.pageX;
                    mouseCurY = e.pageY;
                }

                fixLeft = mouseCurX - mouseStartX + leftStart;
                fixTop = mouseCurY - mouseStartY + topStart;
                elWindow.css({
                    'left':fixLeft + 'px',
                    'top':fixTop + 'px'
                });

                movingFlag = false;
            });
        }).mouseup(function(){
            objBody.unbind('mousemove');
        });

        //阻止工具栏的事件冒泡
        this.jqDocument.find('#viewBodyBtnBar').mousedown(function(event){
            event.stopPropagation();
        });
        this.jqDocument.find('#viewToolBar').mousedown(function(event){
            event.stopPropagation();
        });
        this.jqDocument.find('#viewWindow').mousedown(function(event){
            event.stopPropagation();
        });
        this.jqDocument.find('.resize-panel').mousedown(function(event){
            event.stopPropagation();
        });
    },
    _initResizeWindow:function(){

        var that = this;
        var objBody = this.jqDocument.find('BODY').eq(0);
        var elWindow = this.jqDocument.find('#view-body');
        var elResize = this.jqDocument.find('.resize-panel');
        var mouseStartX,mouseStartY,mouseCurX,mouseCurY,widthStart,heightStart,mlStart;

        elResize.mousedown(function(e){
            e.preventDefault();   //防止鼠标移出后触发默认事件
            e.stopPropagation();

            // 记录鼠标按下时的位置
            var side = $(this).attr('data-side');
            var style = elWindow.get(0).style;
            var fixWidth,fixHeight;
            var resizeFlag = false;
            if(e.pageX || e.pageY){
                mouseStartX = e.pageX;
                mouseStartY = e.pageY;
                widthStart = parseInt(style.width);
                heightStart = parseInt(style.height);
                mlStart = parseInt(style.marginLeft);
            }

            // 鼠标按下后窗口跟随移动
            objBody.mousemove(function(e){
                //等待上一次的mousemov事件结束
                if(resizeFlag)
                    return;
                resizeFlag = true;

                if(e.pageX || e.pageY){
                    mouseCurX = e.pageX;
                    mouseCurY = e.pageY;
                }

                var x = mouseCurX - mouseStartX;
                var y = mouseCurY - mouseStartY;
                var w, h, ml;
                var objStyle = {};

                if(side == 'left'){
                    w = widthStart - x;
                    h = heightStart + y;
                    // ml = mlStart + x;
                    if(w >= that.minWindowWidth){
                        objStyle['width'] = w + 'px';
                        objStyle['margin-left'] = (mlStart + x) + 'px';
                    }
                    if(h >= that.minWindowHeight){
                        objStyle['height'] = h + 'px';
                    }

                }else if(side == 'right'){
                    w = widthStart + x;
                    h = heightStart + y;
                    if(w >= that.minWindowWidth){
                        objStyle['width'] = w + 'px';
                    }
                    if(h >= that.minWindowHeight){
                        objStyle['height'] = h + 'px';
                    }

                }

                elWindow.css(objStyle);

                resizeFlag = false;
            }).mouseup(function(){
                objBody.unbind('mousemove');
                objBody.unbind('mouseup');
                that._setMaxViewSize();
                that.fixImageViewer();
            });
        });

    },
    _setWindowSize:function(w,h){
        var objBody = this.jqDocument.find('BODY').get(0);
        var bodyW = objBody.clientWidth;
        var bodyH = objBody.clientHeight;
        var strStyle = {
            'width': w + 'px',
            'height':h + 'px',
            'margin-left':'-'+ w/2 +'px',
            'margin-top':'-'+ h/2 +'px',
            'left':bodyW/2 +'px',
            'top':bodyH/2 +'px',
            'border-width':'30px 6px 6px 6px'
        };
        this.jqDocument.find('#view-body').css(strStyle);
    },
    _setMaxViewSize:function(){//设置最大窗口
        var style = this.jqDocument.find('#view-body').get(0).style;
        var maxW = parseInt(style.width) - parseInt(style.borderLeftWidth) -parseInt(style.borderRightWidth);
        var maxH = parseInt(style.height) - parseInt(style.borderTopWidth) -parseInt(style.borderBottomWidth);
        var strStyle = {
            'max-width':maxW +'px',
            'max-height':maxH +'px'
        };
        this.jqDocument.find('.view-window').removeAttr('style').css(strStyle);
        // this.jqDocument.find('.view-image').attr('style',strStyle);
    },
    
    fixImageViewer:function (){//调整查看器

        var elImgWindow = this.jqDocument.find('.view-window').get(0);
        var elImage = this.jqDocument.find('#view-image').get(0);
        var maxWidth = parseFloat(elImgWindow.style.maxWidth);
        var maxHeight = parseFloat(elImgWindow.style.maxHeight);
        var offsetWidth = elImage.clientWidth;
        var offsetHeight = elImage.clientHeight;

        if(!this.canvasSupportFlag && !this.autoSizeFlag && parseInt(elImage.getAttribute('data-rotate')) % 2 == 1){
            var temp = offsetWidth;
            offsetWidth  = offsetHeight;
            offsetHeight = temp;

        }


        if(offsetWidth>=maxWidth || offsetHeight>=maxHeight){ 
            // this.jqDocument.find('.view-btn-close').addClass('view-close-in');
            var marginLeft = (maxWidth - offsetWidth) / 2;
            var marginTop = (maxHeight - offsetHeight) / 2;

            //设置图片可拖动状态
            if(marginLeft<0 || marginTop<0){
                this.dragFlag = true;
                this.jqDocument.find('.view-drag').css('cursor','move');
                this.minMarginLeft = maxWidth - offsetWidth;
                this.minMarginTop = maxHeight - offsetHeight;
            }else{
                this.dragFlag = false;
                this.jqDocument.find('.view-drag').css('cursor','default');
            }

            //设置图片margin值
            var strMargin = (marginTop<0?marginTop:'0')+'px ' + '0px 0px ' + (marginLeft<0?marginLeft:'0') + 'px';
            $(elImage).css('margin',strMargin);
        }else{
            this.dragFlag = false;
            $(elImage).css('margin','0px');
            this.jqDocument.find('.view-drag').css('cursor','default');
            // this.jqDocument.find('.view-btn-close').removeClass('view-close-in');
        }
    },
     _getCurrentSrc:function(){//取当前图片路径
        return this.arrImages[this.imageIndex];
    },
    _getCanvasFlag:function(){//当前浏览器canvas支持标识
        return !! this.jqDocument.get(0).createElement('canvas').getContext;
    },
    _showLoading:function(){
        this.jqDocument.find('.view-load-error').hide();
        this.jqDocument.find('.view-loading').show();
    },
    _hideLoading:function(){
        this.jqDocument.find('.view-loading').hide();
    },
    _showLoadError:function(){
        this.jqDocument.find('.view-loading').hide();
        this.jqDocument.find('.view-load-error').html('图片载入失败!').show();
    },
     _hideLoadError:function(){
        this.jqDocument.find('.view-load-error').html('图片载入失败!').hide();
    },
    _loadImage:function(callback){
        var that = this;
        this._showLoading();

        this.jqDocument.find('#viewTopBar').find('P').html(this._getCurrentSrc());

        var image = new Image();
        image.src = this._getCurrentSrc();
        var startTime = new Date().getTime();
        this.loadTimer = setInterval(function(){      	
        	if(image.complete){
                clearInterval(that.loadTimer);
                that.loadTimer = null;
                if(image.width == 0 || image.height == 0){
                    that._showLoadError();
                    return;
                }

                if(typeof callback == 'function'){
                    that._hideLoading();
                    callback(image);
                }
                
            }else if(new Date().getTime() - startTime > that.waitTime){
        		clearInterval(that.loadTimer);
        		that.loadTimer = null;
        		that._showLoadError();
        		return;
        	}
        }, 200);
  
    },
    _drawCanvas:function(param){//canvas绘图
        var canvas = param.canvas;
        var image = param.image;
        // if(typeof(image) =='undefined')
        // 	return;
        var context = canvas.getContext('2d');              
        var imgWidth = image.naturalWidth;
        var imgHeight = image.naturalHeight;
        var intRotate = param.rotate || 0;
        var w,h,x,y;
        // var w,h,x,y,f;

        switch (intRotate) {
                 case 0:
                    w = imgWidth;
                    h = imgHeight;
                    x = 0;
                    y = 0;
                    // f = this.fhFlag?'flipH':null;
                    break;
                 case 1: 
                    w = imgHeight;
                    h = imgWidth;
                    x = 0; 
                    y = -imgHeight;
                    // f = this.fhFlag?'flipV':null;
                    break;                          
                 case 2:
                    w = imgWidth;
                    h = imgHeight;
                    x = -imgWidth; 
                    y = -imgHeight;
                    // f = this.fhFlag?'flipH':null;
                    break;                          
                 case 3:
                    w = imgHeight;
                    h = imgWidth;
                    x = -imgWidth; 
                    y = 0;
                    // f = this.fhFlag?'flipV':null;
                    break;
        }

        canvas.width =  w;
        canvas.height = h;
        // $(canvas).find('.')
        
        context.clearRect(0, 0, imgWidth, imgHeight);
        context.save();
        context.rotate(param.rotate * 90 * Math.PI / 180);
        context.drawImage(image,x, y);
        context.restore();

    },

    _addCssQuote:function(href){//css文件自动引用             
        var that = this;
        var cssHref;
        var cssTag;
        if(typeof href != 'undefined'){
        	cssHref = href;
        }else{
        	var reg = /imageView.js/;
        	$('SCRIPT').each(function(){
                if(reg.test(this.src)){
                    var strCssName = "skin.css";
                    cssHref = this.src.replace(reg,strCssName);
                    return false;
                }
            });
        }

        if(cssHref !=null){
        	cssTag = '<link rel="stylesheet" type="text/css" href="'+ cssHref +'" />';
        }
        that.jqDocument.find('HEAD').append(cssTag);
    },
    
    showMsg:function (msg){//显示提示
        var that = this;
        this.jqDocument.find('.view-tips').slideDown('1000',function(){
            var self = $(this);
            if(that.timeout){
                clearTimeout(that.timeout);
                that.timeout = null;
            }
            that.timeout = setTimeout(function(){
                self.fadeOut('2000');
            },1000);
        }).children('p').html(msg);
    },
    showImage:function(objImgs,index){

        if(!objImgs)
            return;

        if(Object.prototype.toString.call(objImgs) === '[object Array]'){
            this.arrImages = objImgs;
        }else{
            this.arrImages = new Array(objImgs);
        }
            
        this.imageIndex = index || 0;
        this._init();
        this.openImage();
    },
     openImage:function(){//打开图片
        this._setMaxViewSize();
        this.autoSizeFlag = true;
        this.fhFlag = false;
        this.jqDocument.find('#view-body').show();
        // this.jqDocument.find('#view-mask').show();

        var that = this;
        this._loadImage(function(image){
            var elImage = that.jqDocument.find('#view-image');
            var parent = elImage.get(0).parentNode;
            
            if(that.canvasSupportFlag){
                that._drawCanvas({
                    canvas:elImage.get(0),
                    image:image
                });
            }else{
                elImage.attr('src',image.src);
                
            }

            that.currentImgSize = {nw:image.width,nh:image.height}
            elImage.attr('data-rotate',0).removeAttr('data-zoom').removeAttr('style');
            elImage.css({
                'max-width':parent.style.maxWidth,
                'max-height':parent.style.maxHeight
            });

            // that.jqDocument.find('#view-body').show();
            that.fixImageViewer();
        });
        
        
    },
    originSize:function(){//以原始尺寸显示
        this.autoSizeFlag = false;
        var elImage = this.jqDocument.find('#view-image');
        var that = this;
        this._loadImage(function(image){
            if(that.canvasSupportFlag){
                that._drawCanvas({
                    canvas:elImage.get(0),
                    image:image}
                );
            }else{
                elImage.attr('src',image.src);
            }

            elImage.attr('data-rotate',0).attr('data-zoom',1).removeAttr('style');

            elImage.css({
                'max-width':'none',
                'max-height':'none',
                'width':that.currentImgSize.nw + 'px',
                'height':that.currentImgSize.nh + 'px'
            });

            that.fixImageViewer();
        });

    },
    autoSize:function(){//自适应屏幕
        this.openImage();
    },

    openPrev:function(){//上一张

        if(this.imageIndex == 0){
            this.showMsg('已经是第一张啦！');
        }else{
            this.imageIndex --;
            this.openImage();
        }
    },
    openNext:function(){  //下一张
        if(this.imageIndex == this.arrImages.length - 1){
            this.showMsg('已经是最后一张啦！');
        }else{
            this.imageIndex ++;
            this.openImage();
        }
    },
    zoomImage:function (){//放大图片
    	if(this.currentImgSize == null)
    		return;
        var elImage = this.jqDocument.find('#view-image').get(0);
        var numZoom = elImage.getAttribute('data-zoom');
        var zoomWidth,zoomHeight,dataZoom;
        if(!numZoom){
            numZoom = elImage.clientWidth / this.currentImgSize.nw;
            numZoom = numZoom.toFixed(2);
        }
        if(numZoom == this.maxZoomRatio){
            this.showMsg('不能再放大啦！');
            return;
        }

        dataZoom = numZoom*this.zoomRatio;
        if(dataZoom <= this.maxZoomRatio){
            zoomWidth = elImage.clientWidth * this.zoomRatio;
            zoomHeight = elImage.clientHeight * this.zoomRatio;
            
        }else{
            zoomWidth = this.currentImgSize.nw * this.maxZoomRatio;
            zoomHeight = this.currentImgSize.nh * this.maxZoomRatio;
            dataZoom = this.maxZoomRatio;
        }


        $(elImage).css({
            "width":zoomWidth +"px",
            "height":zoomHeight +"px",
            "max-width":'none',
            'max-height':'none'
        }).attr('data-zoom',dataZoom);

        this.autoSizeFlag = false;
        this.fixImageViewer();
    },
    closeImage:function (){//关闭查看器
        clearInterval(this.loadTimer);
        this.loadTimer = null;
        // this.jqDocument.find('#view-mask').hide();
        this.jqDocument.find('#view-body').hide();
    },
    flipHorizontal:function(){
    	this.fhFlag = !this.fhFlag;
    	this.jqDocument.find('#view-image').toggleClass('flipH');
    },

    rotateImage:function (){//旋转图片
    	var elImage = this.jqDocument.find('#view-image').get(0);
        var intRotate = parseInt(elImage.getAttribute('data-rotate'));
        var clearMargin = false;
            
        intRotate = (intRotate + 1) % 4;

        if(this.canvasSupportFlag){//现代浏览器
            var that = this;
            this._loadImage(function(image){
                that._drawCanvas({
                    canvas : elImage,
                       image : image,
                    rotate : intRotate
                });

                elImage.setAttribute("data-rotate", intRotate );
                var temp = elImage.style.width;
                elImage.style.width = elImage.style.height;
                elImage.style.height = temp;

                that.fixImageViewer();
                //修正旋转时宽高交换后margin值
                // if(clearMargin){
                //     elImage.style.margin = '0px';
                // }
            });
            


        }else{//低版本IE浏览器
                 
            
            if(this.autoSizeFlag){ //自适应窗口

                if(intRotate % 2 == 1){

                    var intWidth,intHeight,imgRatio;
                    var parent = elImage.parentNode;
                    var maxW = parseInt(parent.style.maxWidth) ;
                    var maxH = parseInt(parent.style.maxHeight) ;
                    imgRatio = this.currentImgSize.nh / this.currentImgSize.nw;

                    if(this.currentImgSize.nh > maxW || this.currentImgSize.nw > maxH){
                       var maxSizeRatio = maxW / maxH;
                       if(imgRatio >= maxSizeRatio){
                            intHeight = maxW;
                            intWidth = parseInt(maxW / imgRatio);
                            
                       }else{
                            intWidth = maxH;
                            intHeight = parseInt(maxH * imgRatio);
                       }

                        elImage.style.width =  intWidth + 'px';
                        elImage.style.height = intHeight + 'px';
                        elImage.style.maxWidth = 'none';
                        elImage.style.maxHeight = 'none';
                    }
                    
                    clearMargin = true;

                    
                }else{
                    elImage.style.width = 'auto';
                    elImage.style.height = 'auto';
                    elImage.style.maxWidth = elImage.parentNode.style.maxWidth;
                    elImage.style.maxHeight = elImage.parentNode.style.maxHeight;
                }

            }

            elImage.style.filter = 'progid:DXImageTransform.Microsoft.BasicImage(rotation='+ intRotate +')';
            elImage.setAttribute("data-rotate", intRotate );
            this.fixImageViewer();
            //修正旋转时宽高交换后margin值
            if(clearMargin){
                elImage.style.margin = '0px';
            }
        }

       
    }
    
};


//取图片原始尺寸
function getImgNaturalSize(src) {
    var image = new Image();
    image.src = src;
    if(image.complete){
        return {nw:image.width,nh:image.height};
    }
        
}


