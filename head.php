<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title data-react-helmet="true"><?php echo $title;?> | <?php echo $conf['title'];?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?php echo $conf['title'];?>是中文iOS捷径分享发现网站">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@jiejingyuan">
    <meta name="twitter:title" content="<?php echo $title;?> | <?php echo $conf['title'];?>">
    <meta name="twitter:description" content="<?php echo $conf['title'];?>是中文iOS捷径分享发现网站">
    <meta name="twitter:creator" content="@jiejingyuan">
    <meta property="og:title" content="<?php echo $title;?> | <?php echo $conf['title'];?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo $conf['domain'];?>/">
    <meta property="og:description" content="<?php echo $conf['title'];?>是中文iOS捷径分享发现网站">
    <meta property="og:site_name" content="<?php echo $conf['title'];?>">
    <meta property="og:image" content="<?php echo $conf['domain'];?>/images/logo.png">
    <meta property="og:app_id" content="wxde1a8ce152fdd023">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/static/css/bootstrap.min.css">
    <link rel="stylesheet" href="/static/css/style.css">
    <link rel="stylesheet" href="/static/css/index.css">
    <link rel="stylesheet" href="/static/css/swiper.min.css">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.3/css/all.css">
   <link rel="stylesheet" href="/static/css/font_1629860_b42wmttio0e.css" type="text/css" media="all">
<script src="https://cdn.bootcss.com/popper.js/1.15.0/umd/popper.min.js"></script>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.bootcss.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
<!-- 引入 Swiper 插件 -->
<script src="https://cdn.bootcss.com/Swiper/4.5.0/js/swiper.min.js"></script>
<script src="https://cdn.ckeditor.com/ckeditor5/37.1.0/classic/ckeditor.js"></script>
	<style type="text/css">

        .category {
            margin-right: 10px;
            font-weight: bold;
        }
        .swiper-container {
            margin-top: 10px;
            margin-bottom: 10px;
        }
        .swiper-slide {
            margin-right: 20px;
            width: 90px;
        }
.my-div {
height: 80px;
clear: both;
}

@media screen and (max-width: 768px) {
  .my-div {
    height: 70px;
  }
}

@media screen and (max-width: 480px) {
  .my-div {
    height: 65px;
  }
}
body {
  background-color: #f2f2f2;
}

		.carousel-item {

			height: 180px;
			background: #777;
			color: #fff;
			position: relative;
border-radius: 10px;
		}
		.carousel-item a {
			position: absolute;
			top: 0;
			left: 0;
border-radius: 10px;
			height: 100%;
background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
		}
		.carousel-item img {
border-radius: 10px;
			height: 100%;
			width: 100%;
  object-fit: cover;
}

.comment {
    position: relative;
    /* 其他样式 */
}

.expand-btn-container {
    position: absolute;
    bottom: 0;
    right: 0;
    /* 其他样式 */
}
.comment .expand-btn {
    display: none;
}

.comment:hover .expand-btn {
    display: block;
}


	</style>
<script>
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?a9dbccf2aa8c89b8148b4cc3ba285426";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();
</script>


</head>

<body>
<nav class="navbar navbar-expand-md navbar-light bg-light fixed-top">
  <div class="container" style="max-width: 100vw;">
    <a class="navbar-brand" href="/"><img src="../images/logos.png" height="35" style="width: auto;" id="logo">
</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarMenu" aria-controls="navbarMenu" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarMenu">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item active">
          <a class="nav-link" href="/">首页</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="../fenlei.php">捷径</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="../post/">讨论区</a>
        </li>
      </ul>

<form class="form-inline mx-auto my-2 my-md-0" action="/search.php" method="get">
        <div class="input-group">
          <input type="text" class="form-control rounded-0" name="keyword" placeholder="请输入关键词" aria-label="Search" aria-describedby="basic-addon2">
          <div class="input-group-append">
            <button class="input-group-text rounded-0" id="basic-addon2" type="submit"><i class="fa fa-search"></i></button>
          </div>
        </div>
      </form>
    <div class="d-none d-md-block">
        <ul class="navbar-nav ml-auto">
          <li class="nav-item">
            <a class="nav-link" href="<?php echo $linkss;?>">
              <img src="<?php echo $logos;?> "style="width: 50px; height: 50px;border-radius: 50%;"  alt="头像">
            </a>
         </li>
         <li class="nav-item" style="margin-top: 10px;">
              <a href="/update.php" class="btn btn-blue">发布作品</a>
          </li>
        </ul>
      </div>
      <div class="d-md-none">
        <!-- 这里是移动端用户中心代码 -->
        <div class="userheader">
          <div class="header-bg"></div>
          <div class="header-content">
            <div class="avatar">
              <div class="avatar user-level" data-level="3">
                <img src="<?php echo $logos;?>" alt="头像">  
              </div>
            </div>
            <div class="info">
              <div style="display: flex; align-items: center;">
                <h1 style="margin-right: 10px;"><?php echo $username;?></h1>
              </div>
            </div>
            <div class="btn-group">
              <a href="/update.php" class="btn btn-blue">发布作品</a>
              <a href="<?php echo $linkss;?>" class="btn btn-white">个人中心</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>
<div class="my-div"></div> <!-- 56px 是默认的导航栏高度 -->
  <!-- 页面主体内容 -->
<div class="container-fluid" style="margin-top: 1px;">
  <!-- 预留的自定义内容 -->

