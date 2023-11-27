<!-- CSS 代码 -->
<style>
  .comments {
    position: relative;
  }

  .comments form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 10px;
    border-top: 1px solid #e0e0e0;
    padding-top: 10px;
  }

  .comments form textarea {
    flex-grow: 1;
    margin: 0 10px;
    resize: none;
    border-radius: 5px;
    border: 1px solid #e0e0e0;
    padding: 5px;
    font-size: 14px;
  }

  .comments form button[type="submit"] {
    background-color: #3385ff;
    margin: 0 10px 0 0;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 5px 10px;
    font-size: 14px;
    cursor: pointer;
  }

  .media {
    display: flex;
    align-items: flex-start;
    margin-top: 2px;
         color: #ada3f2;

  }

  .media img {
    align-self: flex-start;
    border-radius: 50%;
    border: 2px solid #e0e0e0;
    width: 45px;
    height: 45px;
    margin: 0px 10px;
  }

  .media-body {
    flex-grow: 1;
  }

  .media-body h5,
  .media-body small {
    margin-bottom: 0;
  }
  .media-body p{
  font-size: 16px;
  color: #414141;
  line-height: 1.5;
}
.load-more {
  background-color: #3385ff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
  margin: 10px 20%;
}

</style>


<!-- 评论区开始 -->
<div class="comments">
  <h3 style="margin: 10px 10px;font-size: 16px;color: #666;">评论区</h3>
  <?php
  // 检查用户是否登录
  if(isset($_SESSION['uid'])) {

    // 获取用户信息
    $query = "SELECT * FROM user WHERE uid = ".$_SESSION['uid'];
    $result = mysqli_query($conn, $query);
    $user = mysqli_fetch_assoc($result);
    $headimg = $user['headimg'];
    $name = $user['name'];

    // 处理评论表单
    if(isset($_POST['submit'])) {
      $comment = $_POST['comment'];
      $date = date("Y-m-d H:i:s");
      $query = "INSERT INTO comment (sid, uid, comment, date) VALUES ('$sid', '".$_SESSION['uid']."', '$comment', '$date')";
      mysqli_query($conn, $query);
    }
  }
  ?>

  <!-- 评论表单 -->
  <?php if(isset($_SESSION['uid'])) { ?>
  <form method="post">
    <textarea name="comment" placeholder="发表评论，你的鼓励和建议是作者最大的动力。"></textarea>
    <button type="submit" name="submit">发表</button>
  </form>
  <?php } ?>

  <?php
  // 获取评论列表
  $query = "SELECT * FROM comment WHERE sid = '$sid' ORDER BY date DESC";
  $result = mysqli_query($conn, $query);
  $num_comments = mysqli_num_rows($result); // 获取评论总数
  $num_display = 2; // 设置默认显示的评论数
  $num_hidden = $num_comments - $num_display; // 计算隐藏的评论数
  $count = 0;
  while($row = mysqli_fetch_assoc($result)) {
    $query2 = "SELECT * FROM user WHERE uid = ".$row['uid'];
    $result2 = mysqli_query($conn, $query2);
    $user2 = mysqli_fetch_assoc($result2);
    $headimg2 = $user2['headimg'];
    $name2 = $user2['name'];
    $date2 = $row['date'];
    $comment2 = $row['comment'];
    $cid = $row['cid'];
    $count++;
    if($count <= $num_display) { // 只显示前 num_display 条评论
  ?>

  <div class="media">
    <img src="<?php echo $headimg2 ?>" alt="用户头像">
    <div class="media-body">
      <h5 class="mt-0"><?php echo $name2 ?></h5>
      <small class="text-muted"><?php echo $date2 ?></small>
      <p><?php echo $comment2 ?></p>
    </div>
  </div>

  <?php } else { // 隐藏超出 num_display 的评论 ?>
  <div class="media" style="display:none;">
    <img src="<?php echo $headimg2 ?>" alt="用户头像">
    <div class="media-body">
      <h5 class="mt-0"><?php echo $name2 ?></h5>
      <small class="text-muted"><?php echo $date2 ?></small>
      <p><?php echo $comment2 ?></p>
    </div>
  </div>
  <?php } } ?>

  <?php if($num_comments > $num_display) { // 如果有隐藏的评论，显示加载更多按钮 ?>
  <button class="load-more">加载更多评论</button>
  <?php } ?>

  <?php if(!isset($_SESSION['uid'])) { echo '<p style="margin: 0px 10px;"><a href="../user/sign.php">登录后才能评论</a>~~你的鼓励和建议是作者最大的动力。</p>'; } ?>
</div>
<!-- 评论区结束 -->

<script>
$(function() {
  // 点击加载更多按钮显示隐藏的评论
  $('.load-more').click(function() {
    $('.media:hidden').slice(0, 2).show(); // 显示下一个5条评论
    if($('.media:hidden').length == 0) { // 如果没有隐藏的评论，隐藏按钮
      $('.load-more').hide();
    }
  });
});
</script>
