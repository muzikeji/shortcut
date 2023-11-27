<?php
include "header.php";
// 从 URL 参数 'page' 获取当前页码，如果不存在或无效则设为 1
$current_page = (isset($_GET['page']) && ctype_digit($_GET['page'])) ? $_GET['page'] : 1;
// 设置每页显示的条目数量
$items_per_page = 10;
// 根据当前页码和每页显示的条目数量计算偏移量
$offset = ($current_page - 1) * $items_per_page;
// 获取总条目数
$sql_total = "SELECT COUNT(*) as total FROM shors WHERE state = '公开'";
$result_total = mysqli_query($conn, $sql_total);
$row_total = mysqli_fetch_assoc($result_total);
$total_items = $row_total['total'];
// 获取当前页的条目
$sql = "SELECT shors.*, user.name, user.headimg FROM shors LEFT JOIN user ON shors.author = user.uid WHERE state = '公开' ORDER BY RAND() LIMIT $offset, $items_per_page";
$result = mysqli_query($conn, $sql);
?>
<div class="wrapper">
    <div class="swiper-container">
        <div class="swiper-wrapper">
            <div class="swiper-slide">
                <button type="button" class="btn btn-primary btn-block category" data-filter="all">全部</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-success btn-block category" data-filter="工具">工具</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-info btn-block category" data-filter="娱乐">娱乐</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-warning btn-block category" data-filter="效率">效率</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-danger btn-block category" data-filter="视频">视频</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-secondary btn-block category" data-filter="音乐">音乐</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-primary btn-block category" data-filter="阅读">阅读</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-success btn-block category" data-filter="生活">生活</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-info btn-block category" data-filter="社交">社交</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-warning btn-block category" data-filter="图片">图片</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-danger btn-block category" data-filter="开发者">开发者</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-secondary btn-block category" data-filter="资讯">资讯</button>
            </div>
        </div>
    </div>
</div>
<div class="row" id="app-list">
    <?php while ($row = mysqli_fetch_assoc($result)): ?>
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
    <?php if ($offset < $total_items): ?>
        <div class="row justify-content-center" style="display: block; margin: 0 auto;" id="pagination-wrapper">
            <nav aria-label="Page navigation example">
                <ul class="pagination">
                    <?php if ($current_page == 1): ?>
                        <li class="page-item disabled"><span class="page-link">&laquo; 上一页</span></li>
                    <?php else: ?>
                        <li class="page-item"><a class="page-link" href="?page=<?= $current_page - 1 ?>">&laquo; 上一页</a></li>
                    <?php endif; ?>
                    <?php for ($i = 1; $i <= ceil($total_items / $items_per_page); $i++): ?>
                        <?php if ($i == $current_page): ?>
                            <li class="page-item active"><span class="page-link"><?= $i ?></span></li>
                        <?php else: ?>
                            <li class="page-item"><a class="page-link" href="?page=<?= $i ?>"><?= $i ?></a></li>
                        <?php endif; ?>
                    <?php endfor; ?>
                    <?php if (($offset + $items_per_page) >= $total_items): ?>
                        <li class="page-item disabled"><span class="page-link">下一页 &raquo;</span></li>
                    <?php else: ?>
                        <li class="page-item"><a class="page-link" href="?page=<?= $current_page + 1 ?>">下一页 &raquo;</a></li>
                    <?php endif; ?>
                </ul>
            </nav>
        </div>
    <?php endif; ?>
</div>
<script>
    $(document).ready(function() {
        $(".category").click(function() {
            var filter = $(this).data("filter");
            if (filter == "all") {
                $(".box").show();
            } else {
                $(".box").hide();
                $(".box[data-category='" + filter + "']").show();
            }
        });
        <?php if ($current_page == 1): ?>
        $('.pagination li:first-child').addClass('disabled');
        <?php elseif ($current_page == ceil($total_items / $items_per_page)): ?>
        $('.pagination li:last-child').addClass('disabled');
        <?php endif; ?>
    });
</script>
<?php include "daohang.php"; ?>
<?php include "footer.php"; ?>
