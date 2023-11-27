<div class="wrapper">
  <div style="clear: both; margin-top: 20px;"></div>
</div>

<button id="back-to-top-btn" onclick="scrollToTop()">
  <span class="text">返回顶部</span>
</button>

<footer class="bg-light">
  <div class="container">
    <div class="row">
  <div style="clear: both; margin-top: 10px;"></div>
      <div class="col-md-6 text-center text-md-left ">
        <p class="m-3">&copy; 2023 捷径源. All Rights Reserved.
                                      <p>  <a href="../shiyongxuzhi.php">
                                    <button type="button" class="btn btn-link">使用须知及条款</button>
                                </a></p>
       <p><a href="http://beian.miit.gov.cn/" target="_blank" style="color: black;">    <button type="button" class="btn btn-link">浙ICP备19050440号</button></a></p>
      </div>

      <div class="col-md-6 text-center text-md-right">
        <p>本网站服务空间由<svg t="1684833774645" class="icon" viewBox="0 0 3328 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3367" data-spm-anchor-id="a313x.7781069.0.i0" width="60" height="60"><path d="M2080 812.8c96 0 128-70.4 128-121.6V345.6h12.8l12.8-51.2h-275.2l12.8 51.2h185.6v339.2c0 51.2-38.4 83.2-89.6 83.2l12.8 44.8z" fill="#FF6A00" p-id="3368"></path><path d="M2092.8 697.6c12.8-12.8 19.2-32 19.2-57.6V396.8h-147.2v320H2048c12.8 0 32-6.4 44.8-19.2z m-83.2-38.4V448h44.8v185.6c0 19.2-6.4 25.6-25.6 25.6h-19.2zM1747.2 294.4v518.4h51.2V345.6h64L1824 512c12.8 12.8 44.8 44.8 44.8 102.4 0 57.6-32 76.8-44.8 83.2v57.6c25.6 0 96-38.4 96-134.4 0-57.6-19.2-96-38.4-121.6l44.8-204.8h-179.2zM2329.6 761.6l-12.8 51.2h460.8l-12.8-51.2h-192v-64H2752l-12.8-51.2h-166.4v-64h121.6c57.6 0 83.2-25.6 83.2-83.2V294.4h-460.8v288h204.8v64h-166.4l-12.8 51.2h179.2V768h-192v-6.4z m249.6-294.4h121.6l-12.8-51.2h-108.8v-64h147.2v147.2c0 25.6-12.8 38.4-32 38.4h-121.6V467.2h6.4z m-204.8 64V345.6h147.2v64h-102.4l-12.8 51.2h121.6v64l-153.6 6.4zM3283.2 294.4h-364.8l-12.8 57.6h390.4l-12.8-57.6zM2899.2 806.4l352 6.4c19.2 0 38.4-6.4 44.8-19.2 12.8-12.8 6.4-32 0-44.8-6.4-25.6-25.6-115.2-32-128h-57.6v6.4c0 12.8 25.6 108.8 32 134.4h-288c12.8-57.6 38.4-166.4 51.2-211.2h320l-12.8-51.2h-435.2l-12.8 51.2h89.6c0 44.8-32 172.8-51.2 256zM307.2 774.4c-32-6.4-57.6-38.4-57.6-70.4V320c0-38.4 25.6-64 57.6-70.4l358.4-83.2 38.4-147.2H288C140.8 19.2 19.2 134.4 19.2 288v460.8c0 140.8 115.2 268.8 268.8 268.8H704l-38.4-153.6-358.4-89.6zM1350.4 19.2h-422.4l38.4 153.6L1324.8 256c32 0 57.6 32 57.6 70.4v384c0 38.4-25.6 64-57.6 70.4l-358.4 83.2-38.4 153.6h422.4c140.8 0 268.8-115.2 268.8-268.8V281.6C1612.8 134.4 1497.6 19.2 1350.4 19.2z" fill="#FF6A00" p-id="3369"></path><path d="M665.6 492.8h300.8v38.4h-300.8v-38.4z" fill="#FF6A00" p-id="3370"></path></svg>提供</p>
        <p><a href="https://www.upyun.com/?utm_source=lianmeng&utm_medium=referral" target="_blank" style="color: black;">CDN加速/云存储服务由<img src="../images/ypy.png" alt="又拍云" height="35">提供</a></p>
      </div>
    </div>
  </div>
</footer>

    <!--手机跟随样式1-->

<!-- 引入 jQuery、Font Awesome 和 Bootstrap 的 JavaScript 文件 -->
<script>
ClassicEditor.create(document.querySelector('#editor'), {
    // 设置编辑器高度
    toolbar: ['heading', '|', 'bold', 'link', 'bulletedList', 'numberedList', 'imageUpload']
})
    .then(editor => {
        console.log('Editor was initialized', editor);

        // 监听图片上传事件
        editor.plugins.get('FileRepository').createUploadAdapter = loader => {
            return {
                upload: () => {
                    return loader.file.then(file => {
                        const formData = new FormData();
                        formData.append('image', file);

                        return fetch('/api/upload.php', {
                            method: 'POST',
                            body: formData
                        }).then(response => {
                            return response.json();
                        }).then(json => {
                            return {
                                default: json.url
                            };
                        });
                    });
                }
            };
        };

        // 监听表单提交事件
        const form = document.querySelector('form');
        form.addEventListener('submit', event => {
            const editorData = editor.getData();
            document.querySelector('#content').value = editorData;
        });
    })
    .catch(error => {
        console.error(error.stack);
    });
</script>


<script src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.8.1/js/all.js"></script>
<script>
  // 竖屏时
  var offcanvasElementList = [].slice.call(document.querySelectorAll('.offcanvas'));
  var offcanvasList = offcanvasElementList.map(function(offcanvasEl) {
    return new bootstrap.Offcanvas(offcanvasEl);
  });

  // 横屏时不需要 JavaScript 代码

  //返顶按钮
  // 获取返顶按钮;
  var backToTopBtn = document.getElementById("back-to-top-btn");
  // 滚动事件处理函数
  function handleScroll() {
    // 获取当前页面滚动距离
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    // 根据滚动距离是否大于 500px 来判断是否显示返顶按钮
    if (scrollTop > 500) {
      backToTopBtn.style.display = "block";
    } else {
      backToTopBtn.style.display = "none";
    }
  }
  // 点击事件处理函数
  function scrollToTop() {
    // 平滑滚动到页面顶部
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
  // 监听滚动事件
  window.addEventListener("scroll", handleScroll);
  // 监听按钮点击事件
  backToTopBtn.addEventListener("click", scrollToTop);

  // 初始化 Swiper 插件
  var mySwiper = new Swiper('.swiper-container', {
    slidesPerView: 'auto',
    spaceBetween: 10,
    freeMode: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  });
  // 点击分类按钮过滤应用
  $('.category').on('click', function() {
    var filter = $(this).data('filter');
    if (filter === 'all') {
      $('.app-item').show();
    } else {
      $('.app-item').hide();
      $('.' + filter).show();
    }
  });

</script>


</body>

</html>
