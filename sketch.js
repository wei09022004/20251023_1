// =================================================================
// 步驟一：全域變數和粒子/煙火系統定義
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 

// ----------------------------------------
// 煙火效果相關變數
// ----------------------------------------
let fireworks = []; // 儲存活躍的煙火實例 (Firework class)
let celebrationMode = false; // 滿分時為 true，持續發射煙火

// ----------------------------------------
// 粒子類別 (Particle) - 模擬爆炸碎片
// ----------------------------------------
class Particle {
    constructor(x, y, hue) {
        this.pos = createVector(x, y);
        // 隨機爆炸速度，讓粒子向外飛散
        this.vel = p5.Vector.random2D().mult(random(1, 7)); 
        this.acc = createVector(0, 0.15); // 重力
        this.lifespan = 255;
        this.hue = hue; // 儲存 HSB 色相
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.lifespan -= 4; 
    }

    show() {
        // 確保在繪製粒子時使用 HSB 模式
        colorMode(HSB, 255); 
        noStroke();
        fill(this.hue, 255, 255, this.lifespan); 
        ellipse(this.pos.x, this.pos.y, 4, 4);
        
        // 繪製完畢後切回 RGB 模式
        colorMode(RGB, 255); 
    }

    isFinished() {
        return this.lifespan < 0;
    }
}

// ----------------------------------------
// 煙火類別 (Firework) - 模擬發射和爆炸
// ----------------------------------------
class Firework {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, random(-12, -18)); // 向上發射的速度
        this.acc = createVector(0, 0.05); // 上升時的阻力/輕微重力
        this.exploded = false;
        this.explosionParticles = [];
        this.hue = random(255); // 煙火的主色
        // 爆炸高度的閾值，確保在畫面上方爆炸
        this.explosionHeight = random(height * 0.1, height * 0.3); 
    }

    update() {
        if (!this.exploded) {
            this.vel.add(this.acc); 
            this.pos.add(this.vel);
            
            // 爆炸條件：到達預定高度，或速度開始變慢（y速度趨近於 0 或變正）
            if (this.pos.y < this.explosionHeight || this.vel.y >= 0) { 
                this.explode();
            }
        } else {
            // 更新爆炸後的粒子
            for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
                this.explosionParticles[i].update();
                if (this.explosionParticles[i].isFinished()) {
                    this.explosionParticles.splice(i, 1);
                }
            }
        }
    }

    show() {
        if (!this.exploded) {
            // 繪製火箭上升的點
            colorMode(HSB, 255); 
            fill(this.hue, 200, 255);
            ellipse(this.pos.x, this.pos.y, 5, 5);
            colorMode(RGB, 255); // 切回 RGB 模式
        } else {
            // 繪製爆炸後的粒子
            for (let particle of this.explosionParticles) {
                particle.show();
            }
        }
    }

    explode() {
        this.exploded = true;
        let numParticles = 80;
        for (let i = 0; i < numParticles; i++) {
            this.explosionParticles.push(new Particle(this.pos.x, this.pos.y, this.hue));
        }
    }

    isFinished() {
        // 煙火結束的條件：已爆炸且所有粒子都消失
        return this.exploded && this.explosionParticles.length === 0;
    }
}


// =================================================================
// 步驟二：H5P 分數接收邏輯 (分數達標的程式碼)
// -----------------------------------------------------------------

window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 核心邏輯：檢查是否滿分並持續慶祝
        // ----------------------------------------
        if (finalScore === maxScore && finalScore > 0) {
             // 滿分時啟動持續慶祝模式
             celebrationMode = true; 
             // 確保 draw 循環持續運行 
             loop(); 
        } else {
            // 非滿分時停止慶祝
            celebrationMode = false;
        }
        
        // 分數改變時強制重新繪製一次 (確保文字更新)
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟三：p5.js setup 和 draw 繪圖邏輯
// -----------------------------------------------------------------

function setup() { 
    // 設定 RGB 模式為預設，用於文本和靜態圖形
    colorMode(RGB, 255); 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 讓 draw 循環持續運行以處理動畫
    loop(); 
} 

function draw() { 
    
    // -----------------------------------------------------------------
    // A. 處理背景與煙火更新
    // -----------------------------------------------------------------
    
    // 使用半透明白色背景 (255, 30) 產生拖尾效果 (RGB模式)
    // 這讓舊的煙火殘影逐漸淡出，是動畫效果的關鍵之一
    background(255, 30); 
    
    // 1. 持續發射新的煙火 (如果處於慶祝模式)
    if (celebrationMode && frameCount % 35 === 0) { // 每 35 幀 (約 0.6 秒) 發射一個
        let randomX = random(width * 0.1, width * 0.9);
        let startY = height; // 從底部發射
        fireworks.push(new Firework(randomX, startY));
    }

    // 2. 更新並繪製所有煙火
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();

        // 移除已完成的煙火
        if (fireworks[i].isFinished()) {
            fireworks.splice(i, 1);
        }
    }
    
    
    // -----------------------------------------------------------------
    // B. 分數文本和視覺效果繪製
    // -----------------------------------------------------------------
    
    // 確保使用 RGB 模式繪製文本
    colorMode(RGB, 255); 
    
    let percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;

    textSize(80); 
    textAlign(CENTER);
    
    // 根據分數區間改變文本顏色和內容
    if (percentage === 100) {
        // 滿分：強調慶祝
        fill(255, 200, 0); // 金黃色
        text("🎉 滿分達成！持續慶祝中！ 🎉", width / 2, height / 2 - 50);
        
    } else if (percentage >= 90) {
        fill(0, 200, 50); // 綠色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35); // 黃色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else {
        fill(150);
        text("請加油...", width / 2, height / 2 - 50);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // 幾何圖形反映 (可選，作為背景效果)
    if (percentage >= 90) {
        fill(0, 200, 50, 80); 
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35, 80);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
}
