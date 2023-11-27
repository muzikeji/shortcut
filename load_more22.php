<?php
include "header.php"; //引入头部文件
$limit = $_POST['limit'];
$offset = $_POST['offset'];
echo '<div class="row" id="app-list">';
$sql = "SELECT shors.*, user.name, user.headimg FROM shors LEFT JOIN user ON shors.author = user.uid WHERE shors.state='已审核' ORDER BY RAND() LIMIT $offset, $limit";
$result = $conn->query($sql);
if ($result->num_rows < 1) {
echo '<div class="row justify-content-center" style="display: block; margin: 0 auto;" id="load-more-wrapper"><p>哎呀！没有更多内容了！快来一起投稿吧！</p></div>';
}
while ($row = mysqli_fetch_assoc($result)): ?>
        <div class="box" style="background-color: #fff;" data-category="<?= $row['class'] ?>">
   <a href="../shortcut/<?= $row['sid'] ?>" style="color: black;text-decoration: none;">
    <div class="card" style="border-radius: 10px;color:#fff;background-color: #<?= $row['bg'] ?>;">
      <div class="card-body p-3">
        <div class="d-flex flex-column mx-2 mb-2" style="margin-bottom:10px">
          <div class="mb-1" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="mt-2">
              <span class="h5 font-weight-bold text-white" style="display: inline-block; width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><?php echo mb_substr($row['sname'], 0, 12, 'UTF-8'); ?></span>
            </div>
            <div style="border-radius: 3px;color:#<?= $row['bg'] ?>;background-color: #fff;padding: 2px 5px;">
              <b><?php echo $row['class'] ?></b>
            </div>
          </div>
          <div style="color: #fbf5f6;">
<span class="text-white d-inline-block w-100 overflow-hidden" style="font-family: 'Lato', sans-serif; line-height: 1.5em; max-height: 3.0em;"><?php echo $row['content']; ?></span>

          </div>
        </div>
<hr/>

<div class="d-flex align-items-center flex-wrap">
  <a class="text-decoration-none-reset" href="../user/?uid=<?= $row['author'] ?>">
<img src="<?= $row['headimg'] ?>" alt="" class="rounded me-10 rounded-15" width="40" height="40">

  </a>
  <div class="d-flex flex-row mx-2 justify-content-between flex-fill">
    <div>
      <small class="h6 font-weight-bold text-white"><?= $row['name'] ?></small><br/>
      <small><span><?= date('Y-m-d H:i', strtotime($row['date'])) ?></span></small>
    </div>
    <div class="mt-3">
      <small><span><i class="fa fa-download"></i> <?= $row['dow'] ?></span></small>
    </div>
  </div>
</div>


      </div>
    </div>
  </a>
        </div>
    <?php endwhile;

$conn->close();
?>
