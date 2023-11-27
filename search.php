<?php
include "header.php";
$keyword = $_GET['keyword'];
$limit = 5; // 每页显示的数量
$page = isset($_GET['page']) ? intval($_GET['page']) : 1; // 获取当前页码
$offset = ($page - 1) * $limit; // 计算偏移量

// 查询符合条件的数据总数
$sql = "SELECT COUNT(*) FROM shors 
        WHERE (sname LIKE '%$keyword%' OR content LIKE '%$keyword%') AND state = '公开'";
$result = $conn->query($sql);
$total = $result->fetch_row()[0]; // 查询结果总数量
$total_pages = ceil($total / $limit); // 总页数

// 查询当前页的数据
$sql = "SELECT shors.*, user.name, user.headimg 
        FROM shors 
        LEFT JOIN user ON shors.author = user.uid 
        WHERE (sname LIKE '%$keyword%' OR content LIKE '%$keyword%') AND state = '公开' 
        ORDER BY RAND()
        LIMIT $limit OFFSET $offset";
$result = $conn->query($sql);

?>


              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a class="nav-link active"
                    href="#shors"
                    data-toggle="tab">捷径</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#post" data-toggle="tab">帖子</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#users" data-toggle="tab">用户</a>
                </li>
              </ul>
              <div class="tab-content">
                <div class="tab-pane active" id="shors">
<div class="row" id="app-list">
  <?php
    if ($result->num_rows > 0) {
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

<!-- 分页链接 -->
<nav aria-label="Page navigation">
  <ul class="pagination justify-content-center mt-4">
    <?php if ($page > 1): ?>
    <li class="page-item"><a class="page-link" href="?keyword=<?= $keyword ?>&page=<?= $page - 1 ?>">上一页</a></li>
    <?php endif; ?>
    <?php for ($i = 1; $i <= $total_pages; $i++): ?>
      <li class="page-item <?= $i == $page ? 'active' : '' ?>"><a class="page-link" href="?keyword=<?= $keyword ?>&page=<?= $i ?>"><?= $i ?></a></li>
    <?php endfor; ?>
    <?php if ($page < $total_pages): ?>
    <li class="page-item"><a class="page-link" href="?keyword=<?= $keyword ?>&page=<?= $page + 1 ?>">下一页</a></li>
    <?php endif; ?>
  </ul>
</nav>

<?php
    } else {
      echo '<div class="alert alert-warning" role="alert">没有搜索到相关应用，请尝试其他关键词。</div>';
    }

    $conn->close();
?>
                </div>
                <div class="tab-pane" id="post">
                  这里是帖子内容
                </div>
                <div class="tab-pane" id="users">
                  用户内容
                </div>
              </div>





<script>
var page = <?= $page ?>;
var total_pages = <?= $total_pages ?>;
var keyword = '<?= $keyword ?>';

$('#load-more').click(function() {
  page++; // 增加页码
  var url = 'search.php?keyword=' + encodeURIComponent(keyword) + '&page=' + page;
  $.get(url, function(data) {
    $('#app-list').append(data); // 追加新数据
    if (page >= total_pages) {
      $('#load-more').hide(); // 如果没有更多数据了，隐藏按钮
    }
  });
});
</script>

<?php 
include "daohang.php"; //引入配置文件 
include "footer.php"; //引入配置文件
?>
