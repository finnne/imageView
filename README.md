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

[https://finnne.github.io/imageView/index.html](https://finnne.github.io/imageView/index.html)
