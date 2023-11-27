<?php
include "header.php"; //引入头部文件
?>
<div id="carouselExampleControls" class="carousel slide d-block d-md-none" data-ride="carousel" style="margin:10px 0">
  <div class="carousel-inner">
    <?php
    // 执行查询语句
    $mysql = "SELECT title, imgurl, lable, url FROM ad WHERE state='上架'";
    $results = $conn->query($mysql);
    // 循环遍历查询结果
    while ($row = $results->fetch_assoc()) {
      // 生成 HTML 代码
      echo '<div class="carousel-item ' . $row["lable"] . '">';
      echo '<a href="' . $row["url"] . '"><img src="' . $row["imgurl"] . '" alt="' . $row["title"] . '"></a>';
      echo '</div>';
    }
    // 释放查询结果集
    $result->free();
    ?>
  </div>
  <a class="carousel-control-prev" href="#carouselExampleControls" role="button" data-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="sr-only">Previous</span>
  </a>
  <a class="carousel-control-next" href="#carouselExampleControls" role="button" data-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="sr-only">Next</span>
  </a>
</div>
<div class="d-md-none">
  <form class="form-inline mx-auto my-2 my-md-0" action="/search.php" method="get">
    <div class="input-group">
      <input type="text" class="form-control rounded-0" name="keyword" placeholder="请输入关键词" aria-label="Search" aria-describedby="basic-addon2">
      <div class="input-group-append">
        <button class="input-group-text rounded-0" id="basic-addon2" type="submit"><i class="fa fa-search"></i></button>
      </div>
    </div>
  </form>
</div>
<hr/>
<h5 class="text-success ml-1">最新捷径</h5>
<div class="row" id="app-list">
  <?php
  // 执行查询
  $sql = "SELECT shors.*, user.name, user.headimg 
          FROM shors 
          LEFT JOIN user ON shors.author = user.uid 
          WHERE state = '公开' 
          ORDER BY date DESC 
          LIMIT 10";
  $result = mysqli_query($conn, $sql);

  // 循环输出查询结果
  while ($row = mysqli_fetch_assoc($result)):
  ?>
    <div class="box <?= $row['class'] ?>">
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
              <div>
                <span class="text-white d-inline-block w-100 overflow-hidden" style="line-height: 1.8em; display: inline-block; height: 3.6em; color: #fbf5f6;"><?php echo $row['content']; ?></span>
              </div>
            </div>
            <hr/>
            <div class="d-flex align-items-center flex-wrap">
              <a class="text-decoration-none-reset" href="../user/<?= $row['author'] ?>">
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
  <?php endwhile; ?>
</div>

<?php
$sql = "SELECT posts.*, user.name, user.headimg 
        FROM posts 
        LEFT JOIN user ON posts.uid = user.uid 
        WHERE state = '公开' 
        ORDER BY create_time DESC 
        LIMIT 10";
$result = mysqli_query($conn, $sql);
?>
<h5 class="text-success ml-1">最新帖子</h5>
<div class="row" id="app-list">
  <?php while ($row = mysqli_fetch_assoc($result)): ?>
  <div class="box" style="background-color: #fff;">
    <div class="card" style="border-radius: 10px;">
      <div class="card-body p-3">
        <a class="text-decoration-none text-reset" href="../user/<?php echo $row['uid'] ?>">
<div class="sort-label"><b><?php echo $row["sort"]; ?></b></div> 
          <div class="d-flex align-items-center flex-wrap">
            <img src="<?php echo $row['headimg'] ?>" alt="" class="rounded-circle me-10" width="50" height="50">
            <div class="d-flex flex-column mx-2 mt-3" style="margin-bottom:10px">
              <small class="h6 font-weight-bold"><?php echo $row['name'] ?></small>
              <small><?php echo date('Y-m-d H:i', strtotime($row['create_time'])) ?></small>
            </div>
          </div>
        </a>
        <hr/>
        <a href="../post/<?php echo $row['id'] ?>" style="color: black;text-decoration: none;">
          <div class="d-flex flex-column mx-2 mt-2 mb-10" style="margin-bottom:10px">
            <span class="h5 font-weight-bold"><?php echo $row['title'] ?></span>
            <div style="color: #666;" id="my-postcontent">
              <?php echo $row['content']; ?>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
  <?php endwhile; ?>
</div>
<?php 
include "daohang.php"; //引入配置文件 
include "footer.php"; //引入配置文件
?>
