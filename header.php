<?php 
session_start();
error_reporting(0);
include "config.php"; //引入配置文件
if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
$logos="https://img1.baidu.com/it/u=3438742520,3870787236&fm=253&app=138&size=b931,285&n=0&f=PNG&fmt=auto&maxorilen2heic=2000000";
$username="未登录";
$links=$url."/user/sign.php";

} else {
$uid = $_SESSION["uid"];
$sql = "SELECT *  FROM user WHERE uid = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $uid);
$stmt->execute();
$result = $stmt->get_result();

// 处理查询结果
if ($result && mysqli_num_rows($result) > 0) {
    $datas = mysqli_fetch_assoc($result);
$username = urldecode($datas["name"]);
$logos = $datas["headimg"];
$links =$url."/user/im.php?uid=".$uid;
}
}
if (!isset($title)) {
$title = "实用捷径、快捷指令分享发现网站";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="<?php echo $conf['title'];?>是iOS快捷指令脚本分享社区，这里有最新、最热门的iOS快捷指令脚本，与全球创意人士一起交流、分享你的创意！">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@jiejingyuan">
<meta name="twitter:title" content="<?php echo $title;?> | <?php echo $conf['title'];?>">
<meta name="twitter:description" content="<?php echo $conf['title'];?>是iOS快捷指令脚本分享社区，这里有最新、最热门的iOS快捷指令脚本，与全球创意人士一起交流、分享你的创意！">
<meta name="twitter:creator" content="@jiejingyuan">
<meta property="og:title" content="<?php echo $title;?> | <?php echo $conf['title'];?>">
<meta property="og:type" content="website">
<meta property="og:url" content="<?php echo $conf['domain'];?>/">
<meta property="og:description" content="<?php echo $conf['title'];?>是iOS快捷指令脚本分享社区，这里有最新、最热门的iOS快捷指令脚本，与全球创意人士一起交流、分享你的创意！">
<meta property="og:site_name" content="<?php echo $conf['title'];?>">
<meta property="og:image" content="<?php echo $conf['domain'];?>/images/logo.png">
<meta property="og:app_id" content="wxde1a8ce152fdd023">
<meta name="baidu-site-verification" content="codeva-VFG5i7FieK" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/static/css/bootstrap.min.css">
    <link rel="stylesheet" href="/static/css/style.css">
    <link rel="stylesheet" href="/static/css/swiper.min.css">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.3/css/all.css">
   <link rel="stylesheet" href="/static/css/font_1629860_b42wmttio0e.css" type="text/css">
<script src="https://cdn.ckeditor.com/ckeditor5/37.1.0/classic/ckeditor.js"></script>

<script src="https://cdn.bootcss.com/popper.js/1.15.0/umd/popper.min.js"></script>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.bootcss.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
<!-- 引入 Swiper 插件 -->
<script src="https://cdn.bootcss.com/Swiper/4.5.0/js/swiper.min.js"></script>
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
    <a class="navbar-brand" href="/"><img src="../images/logos.png" height="35" style="width: auto;">
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
            <a class="nav-link" href="../user/im.php">
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
              <a href="<?php echo $links;?>" class="btn btn-white">个人中心</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>
<div class="my-div"></div> <!-- 56px 是默认的导航栏高度 -->
  <!-- 页面主体内容 -->
<div class="modal fade" id="alertModal" tabindex="-1" role="dialog" aria-labelledby="alertModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="alertModalLabel">提示消息</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <p id="alertMessage"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-dismiss="modal">确定</button>
      </div>
    </div>
  </div>
</div>
<div class="container-fluid">
  <!-- 预留的自定义内容 -->

