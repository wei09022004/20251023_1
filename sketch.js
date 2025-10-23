// =================================================================
// 步驟一：全域變數和粒子系統定義
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 

// ----------------------------------------
// 新增：煙火效果相關變數
// ----------------------------------------
let fireworks = []; // 儲存活躍的粒子
let explosionTriggered = false; // 確保滿分時只爆炸一次

// ----------------------------------------
// 新增：簡易粒子類別 - 實現煙火爆炸後的碎片
// ----------------------------------------
class Particle {
    constructor(x, y, col) {
        this.pos = createVector(x, y);
        // 隨機爆炸速度，確保粒子向外飛散
        // 使用 HSB 模式時，顏色需要轉換
        this.vel = p5.Vector.random2D().mult(random(2, 8));
        this.acc = createVector(0, 0.1); // 簡易重力
        this.lifespan = 255;
        this.col = col;
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.lifespan -= 4; // 調整消散速度
    }

    show() {
        noStroke();
        // 設置透明度 (alpha)。由於 setup 中設定了 HSB 模式，這裡直接使用
        fill(hue(this.col), saturation(this.col), brightness(this.col), this.lifespan); 
        ellipse(this.pos.x, this.pos.y, 4, 4);
    }

    isFinished() {
        return this.lifespan < 0;
    }
}

// ----------------------------------------
// 新增：觸發煙火爆炸的函式
// ----------------------------------------
function triggerFirework(x, y) {
    // 隨機顏色
    let fireworkColor = color(random(255), 255, 255); 
    let numParticles = 120; // 增加粒子數量
    
    // 產生粒子
    for (let i = 0; i < numParticles; i++) {
        fireworks.push(new Particle(x, y, fireworkColor));
    }
    // 啟用 loop 讓粒子系統動起來
    loop(); 
}


// =================================================================
// 步驟二：H5P 分數接收邏輯
// -----------------------------------------------------------------

window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 核心邏輯：檢查是否滿分並觸發爆炸
        // ----------------------------------------
        if (finalScore === maxScore && finalScore > 0 && !explosionTriggered) {
             // 滿分時觸發煙火效果，位置設定在畫布中央
             triggerFirework(width / 2, height / 2);
             explosionTriggered = true; // 設置標記，防止重複觸發
        } else if (finalScore !== maxScore) {
            // 如果分數不是滿分，則重置標記
            explosionTriggered = false;
        }
        
        // 分數改變時強制重新繪製一次 (即使沒有煙火也會更新分數顯示)
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟三：p5.js setup 和 draw 繪圖邏輯
// -----------------------------------------------------------------

function setup() { 
    // 設定 HSB 模式以利於煙火色彩控制，範圍設定為 255
    colorMode(HSB, 255); 
    // 創建畫布
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 預設停止繪製，只在分數更新或有煙火時才繪製
    noLoop(); 
} 

function draw() { 
    
    // -----------------------------------------------------------------
    // A. 處理背景與煙火粒子更新
    // -----------------------------------------------------------------
    
    // 如果有煙火粒子，使用半透明背景產生拖影 (trail) 效果
    if (fireworks.length > 0) {
        // HSB 模式下，白色為 (0, 0, 255)，這裡使用淺灰色並帶有透明度
        background(0, 0, 255, 30); 
    } else {
        // 沒有煙火時，清除背景為純白色
        background(0, 0, 255); 
    }

    // 更新並繪製所有煙火粒子
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();

        // 移除已燃燒完的粒子
        if (fireworks[i].isFinished()) {
            fireworks.splice(i, 1);
        }
    }
    
    // 如果所有粒子都消失了，停止 loop (省資源)
    if (fireworks.length === 0) {
        noLoop();
    }
    
    // -----------------------------------------------------------------
    // B. 分數文本和視覺效果繪製
    // -----------------------------------------------------------------
    
    let percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;

    textSize(80); 
    textAlign(CENTER);
    colorMode(RGB, 255); // 切換回 RGB 模式繪製文本
    
    // 根據分數區間改變文本顏色和內容
    if (percentage === 100) {
        // 滿分：強調慶祝
        fill(0, 200, 50); // 綠色
        text("✨ 滿分恭喜！煙火慶祝！✨", width / 2, height / 2 - 50);
        
    } else if (percentage >= 90) {
        fill(0, 200, 50);
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35); // 黃色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage >= 0) {
        fill(200, 0, 0); // 紅色
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        fill(150);
        text("等待 H5P 分數...", width / 2, height / 2 - 50);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // 幾何圖形反映 (可選，作為背景效果)
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美
        fill(0, 200, 50, 80); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形
        fill(255, 181, 35, 80);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    colorMode(HSB, 255); // 重新切換回 HSB 模式以準備下一幀的粒子繪製
}
