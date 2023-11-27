<?php
session_start();
error_reporting(0);
if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
   $logos =
      "https://img1.baidu.com/it/u=3438742520,3870787236&fm=253&app=138&size=b931,285&n=0&f=PNG&fmt=auto&maxorilen2heic=2000000";
   $username = "未登录";
   $linkss = $url . "/user/sign.php";
   $gx = "<strong>发布</strong>";
} else {
   $uid = $_SESSION["uid"];
   $user_id = $_SESSION["uid"];
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
      $linkss = "../user/im.php?uid=" . $uid;
      $is_author = $uid == $author;
      // 显示作品更新表单和最近更新记录
      if ($is_author) {
         $gx = "<div class=\"dropdown\">
  <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" id=\"dropdownMenuButton\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">
 操作
  </button>
  <div class=\"dropdown-menu\" aria-labelledby=\"dropdownMenuButton\">
    <a class=\"dropdown-item\" href=\"../api/edit.php?type=delete&userid={$uid}&sid={$sid}\">下架作品</a>
    <a class=\"dropdown-item\" href=\"../api/edit.php?type=update&userid={$uid}&sid={$sid}\">更新版本</a>
    <a class=\"dropdown-item\" href=\"../api/edit.php?type=edit&userid={$uid}&sid={$sid}\">编辑信息</a>
  </div>
</div>";
      } else {
         $gx = "<strong>发布</strong>";
      }
   }
}
?>