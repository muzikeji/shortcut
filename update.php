<?php

include "config.php"; //引入配置文件

session_start();

// 检查是否已经登录
if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
	header("location: /user/sign.php");
	exit();
}
include "header.php"; //引入配置文件
$uid = $_SESSION["uid"];
$sql = "SELECT * FROM user WHERE uid = $uid";
$result = $conn->query($sql);

// 输出数据
if ($result->num_rows > 0) {
	$row = $result->fetch_assoc();
} else {
	echo "0 结果";
}
$username = $row["name"];
$sid = time();
$time = date("Y-m-d H:i:s");
?>
<body>
  <div style="clear: both; margin-top: 20px;"></div>
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">发布内容</div>
                <div class="card-body">
                    <ul class="nav nav-tabs">
                        <li class="nav-item">
                            <a class="nav-link active" href="#jiejing" data-toggle="tab">捷径</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#tiezi" data-toggle="tab">话题</a>
                        </li>
                    </ul>
  <div style="clear: both; margin-top: 20px;"></div>
          <div class="tab-content">
<div class="tab-pane active" id="jiejing">
   <div class="popup">
      <div style="color: #ffbd00; padding: 10px; font-size: 18px">
         <i class="fa fa-align-left"></i>&nbsp<b>注释</b>
      </div>
      <hr
         style="
            width: 100%;
            margin: 0px auto;
            border: none;
            border-top: 2px solid #f6edd4;
         "
      />
      <p id="popup">
         作者：‍<?php echo $username; ?><br />来源：捷径源©版权归作者所有<br />
         发布时间：<?php echo $time; ?><br />作品地址：<?php echo $url; ?>/shortcut/<?php echo $sid; ?>
      </p>
   </div>
   <div class="buttons">
      <button onclick="copyText()">复制内容</button>
   </div>
   <script>
      function copyText() {
         var text = document.querySelector("#popup").innerText;
         navigator.clipboard.writeText(text).then(
            function () {
               alert("已复制到剪贴板");
            },
            function () {
               alert("复制失败");
            }
         );
      }
   </script>

   <form method="post" action="/api/up.php" onsubmit="return validateForm()">
      <div class="form-group">
         <label for="links">作品链接</label>
         <input
            type="url"
            class="form-control"
            id="link"
            name="link"
            placeholder="在指令中加入上面操作复制链接填入"
            required
         />
      </div>

      <!--隐藏表单-->
      <input type="hidden" id="bg" name="bg" value="<?php echo $bg; ?>" />
      <input type="hidden" id="sid" name="sid" value="<?php echo $sid; ?>" />
      <div class="form-group">
         <label for="category">分类：</label>
         <select class="form-control" id="category" name="category" required>
            <option value="">请选择</option>
            <option value="工具">工具</option>
            <option value="娱乐">娱乐</option>
            <option value="效率">效率</option>
            <option value="视频">视频</option>
            <option value="音乐">音乐</option>
            <option value="阅读">阅读</option>
            <option value="生活">生活</option>
            <option value="社交">社交</option>
            <option value="图片">图片</option>
            <option value="开发者">开发者</option>
            <option value="资讯">资讯</option>
         </select>
      </div>
      <div class="form-group">
         <label for="content">作品内容</label>
         <textarea
            class="form-control"
            id="summary"
            name="summary"
            rows="3"
            placeholder="请简单介绍一下你的捷径功能或者用法"
            required
         ></textarea>
      </div>

      <div class="mb-3 d-flex align-items-center">
         <div class="form-check-inline">
            <label class="form-check-label" for="original-yes">原创</label>
            <input
               class="form-check-input"
               type="radio"
               name="original"
               id="original-yes"
               value="原创作品"
            />
         </div>
         <div class="form-check-inline ml-3">
            <label class="form-check-label" for="original-no">转载</label>
            <input
               class="form-check-input"
               type="radio"
               name="original"
               id="original-no"
               value="网络转载"
            />
         </div>
         <div class="form-check-inline ml-3">
            <label class="form-check-label" for="original-no">改编</label>
            <input
               class="form-check-input"
               type="radio"
               name="original"
               id="original-no"
               value="改编其他"
            />
         </div>
      </div>
      <button type="submit" class="btn btn-primary mt-3">提交</button>
   </form>
</div>

<div class="tab-pane" id="tiezi">
  <form action="/api/posts.php" method="post" enctype="multipart/form-data">
    <div class="form-group">
      <label for="title">话题标题</label>
      <input type="text" class="form-control" id="title" name="title" placeholder="输入话题的标题50字内！" required>
    </div>
    <div class="form-group">
      <label for="category">分类：</label>
      <select class="form-control" id="category" name="category" required>
        <option value="">请选择</option>
        <option value="教程">教程</option>
        <option value="需求">需求</option>
        <option value="闲聊">闲聊</option>
        <option value="公告">公告</option>
        <option value="资讯">资讯</option>
        <option value="分享">分享</option>
      </select>
    </div>
<div class="form-group">
  <label for="content">话题内容</label>
   <textarea name="content" id="editor" placeholder="请帖子输入内容！" >
    
        </textarea>
      </div>
    <div class="form-group row">
      <div class="col-sm-6">
        <button type="submit" class="btn btn-primary">发布话题</button>
      </div>
      </div>
  </form>
 </div>



   


                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

  <script>
    function validateForm() {
      const linkValue = linkInput.value;
      if (!linkValue.startsWith('https://www.icloud.com/shortcuts/')) {
        alert('链接必须以 https://www.icloud.com/shortcuts/ 开头');
        return false;
      }
      return true;
    }
  </script>


<?php include "footer.php"; //引入配置文件
?>
