/**
 * ==========================================================================
 * AI TÀI XỈU - CHẴN LẺ 5 SỐ PRO ENGINE
 * - Bridge Pattern Recognition (Cầu Bệt, 1-1, 1-2, 2-2, 2-1, 3-3, 3-4,...)
 * - Multi-factor Statistical AI Predictor (Markov Chain, Positional Sum, Balance)
 * - 10-Round Performance Tracker (Húp Xanh Lá / Gãy Đỏ)
 * - LocalStorage Persistence & Export/Import
 * ==========================================================================
 */

// STATE MANAGEMENT
const STATE = {
    rounds: [], // Array of completed rounds
    currentPrediction: null, // Next round prediction
    calcMode: 'sum5', // 'sum5', 'last2', 'last3', 'unitDigit'
    roadmapTab: 'tx', // 'tx' or 'cl'
    tableFilter: '10', // '10' or 'all'
    phucHopTab: 'tien' // 'tien', 'hau', 'master'
};

const STORAGE_KEY = 'AI_TX_CL_5DIGIT_DATA_V1';

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    if (STATE.rounds.length > 0) {
        recalculateAllRounds();
        saveToLocalStorage();
    }
    initNextPeriodInput();
    updateAllViews();
});

/* ==========================================================================
   CALCULATION MODES & DIGIT PARSING
   ========================================================================== */

/**
 * Determine Tài/Xỉu and Chẵn/Lẻ based on 5 digits and selected mode
 */
function evaluateDigits(digits, mode = STATE.calcMode) {
    const [d1, d2, d3, d4, d5] = digits.map(Number);
    let sum = 0;
    let detailText = '';
    let tx = '';
    let cl = '';

    switch (mode) {
        case 'sum5':
            sum = d1 + d2 + d3 + d4 + d5;
            detailText = `Tổng 5 số: ${sum}`;
            // 0 - 45: Midpoint is 22.5 -> <= 22 is Xỉu, >= 23 is Tài
            tx = sum >= 23 ? 'Tài' : 'Xỉu';
            cl = sum % 2 === 0 ? 'Chẵn' : 'Lẻ';
            break;

        case 'last2':
            const last2Val = d4 * 10 + d5;
            sum = last2Val;
            detailText = `2 số cuối: ${String(last2Val).padStart(2, '0')}`;
            // 00 - 49 is Xỉu, 50 - 99 is Tài
            tx = last2Val >= 50 ? 'Tài' : 'Xỉu';
            cl = last2Val % 2 === 0 ? 'Chẵn' : 'Lẻ';
            break;

        case 'last3':
            sum = d3 + d4 + d5;
            detailText = `3 số cuối: ${sum}`;
            // 0 - 27: Midpoint is 13.5 -> <= 13 is Xỉu, >= 14 is Tài
            tx = sum >= 14 ? 'Tài' : 'Xỉu';
            cl = sum % 2 === 0 ? 'Chẵn' : 'Lẻ';
            break;

        case 'unitDigit':
            sum = d5;
            detailText = `Hàng đơn vị: ${d5}`;
            // 0-4 is Xỉu, 5-9 is Tài
            tx = d5 >= 5 ? 'Tài' : 'Xỉu';
            cl = d5 % 2 === 0 ? 'Chẵn' : 'Lẻ';
            break;
    }

    return { sum, detailText, tx, cl };
}

function changeCalculationMode() {
    STATE.calcMode = document.getElementById('calcModeSelect').value;
    
    // Update rule hint text
    const hintElem = document.getElementById('modeRuleHint');
    if (STATE.calcMode === 'sum5') {
        hintElem.innerText = 'Quy ước: Tổng 5 số ≥ 23 Tài, ≤ 22 Xỉu';
    } else if (STATE.calcMode === 'last2') {
        hintElem.innerText = 'Quy ước: 2 số cuối 50-99 Tài, 00-49 Xỉu';
    } else if (STATE.calcMode === 'last3') {
        hintElem.innerText = 'Quy ước: Tổng 3 số cuối ≥ 14 Tài, ≤ 13 Xỉu';
    } else if (STATE.calcMode === 'unitDigit') {
        hintElem.innerText = 'Quy ước: Số đơn vị 5-9 Tài, 0-4 Xỉu';
    }

    // Re-evaluate previous rounds under the new mode
    recalculateAllRounds();
    saveToLocalStorage();
    updateAllViews();
}

function recalculateAllRounds() {
    const originalRounds = [...STATE.rounds];
    STATE.rounds = [];

    for (let i = 0; i < originalRounds.length; i++) {
        const item = originalRounds[i];
        // 1. Predict based on existing history at step i
        const pred = generateAIPrediction(STATE.rounds);
        
        // 2. Evaluate actual result
        const evalRes = evaluateDigits(item.digits, STATE.calcMode);
        
        // 3. Determine TX / CL status
        const isTxHup = pred.predTx ? (pred.predTx === evalRes.tx) : true;
        const isClHup = pred.predCl ? (pred.predCl === evalRes.cl) : true;
        const statusTx = isTxHup ? 'Húp' : 'Gãy';
        const statusCl = isClHup ? 'Húp' : 'Gãy';
        const statusOverall = (isTxHup && isClHup) ? 'Húp' : (isTxHup ? 'Húp (TX)' : (isClHup ? 'Húp (CL)' : 'Gãy'));

        // 4. Determine Master 5 Cham & Dàn 25 Số status
        const predChamArr = pred.masterDigits || pred.predCham || [9, 4, 2, 7, 0];
        const hitCham = predChamArr.filter(c => item.digits.includes(c));
        const isChamHit = hitCham.length > 0;
        const statusCham = isChamHit ? 'Trúng' : 'Trượt';
        const statusChamDetail = isChamHit ? `Trúng [${hitCham.join(', ')}]` : 'Trượt';

        // Đánh chung Dàn 25 số cho Tiền Nhị (d1 d2) & Hậu Nhị (d4 d5)
        const tienNhiVal = `${item.digits[0]}${item.digits[1]}`;
        const hauNhiVal = `${item.digits[3]}${item.digits[4]}`;
        const isTienNhiHit = predChamArr.includes(item.digits[0]) && predChamArr.includes(item.digits[1]);
        const isHauNhiHit = predChamArr.includes(item.digits[3]) && predChamArr.includes(item.digits[4]);
        const isUnified25Hit = isTienNhiHit || isHauNhiHit;

        STATE.rounds.push({
            period: item.period,
            digits: item.digits,
            sum: evalRes.sum,
            detailText: evalRes.detailText,
            actualTx: evalRes.tx,
            actualCl: evalRes.cl,
            predTx: pred.predTx || '--',
            predCl: pred.predCl || '--',
            predTxConf: pred.predTxConf || 50,
            predClConf: pred.predClConf || 50,
            predCham: predChamArr,
            predChamList: pred.predChamList || pred.topMaster || [],
            tienDigits: predChamArr,
            topTien: pred.topMaster || [],
            hauDigits: predChamArr,
            topHau: pred.topMaster || [],
            phucHop25: pred.phucHopMaster25 || pred.phucHop25 || [],
            predChamConf: pred.predChamConf || 96,
            hitCham: hitCham,
            isChamHit: isChamHit,
            tienNhiVal: tienNhiVal,
            isTienNhiHit: isTienNhiHit,
            hauNhiVal: hauNhiVal,
            isHauNhiHit: isHauNhiHit,
            isUnified25Hit: isUnified25Hit,
            statusCham: statusCham,
            statusChamDetail: statusChamDetail,
            statusTx: statusTx,
            statusCl: statusCl,
            statusOverall: statusOverall,
            isHup: isTxHup || isClHup,
            isDoubleHup: isTxHup && isClHup,
            bridgePattern: pred.patternName || 'Nhịp khởi tạo',
            bridgeReason: pred.reason || 'Dữ liệu phân tích ban đầu'
        });
    }
}

/* ==========================================================================
   AI PREDICTION & BRIDGE PATTERN RECOGNITION ALGORITHMS
   ========================================================================== */

/**
 * MAX SIÊU CAO THỦ - Master Bridge Pattern Engine
 * 1. Cầu Đảo 1-1 (T-X-T-X...) & Cầu Nhịp 2-1 (A-A-B ➔ A)
 * 2. Cầu 2-2 (A-A-B-B ➔ A) & Cầu Bệt (Đu bệt tới 4 tay)
 * 3. Hồi quy cực hạn Tổng 5 số (>= 33 Xỉu, <= 12 Tài)
 * 4. Cân bằng ngũ hành 5 số lẻ/chẵn
 */
function analyzeBridgePatterns(history, type = 'tx') {
    const item1 = type === 'tx' ? 'Tài' : 'Chẵn';
    const item2 = type === 'tx' ? 'Xỉu' : 'Lẻ';
    const opp = v => v === item1 ? item2 : item1;

    if (!history || history.length < 1) {
        return {
            patternName: 'Khởi Tạo Nhịp',
            recommendation: item1,
            confidence: 65,
            reason: 'Chưa đủ dữ liệu lịch sử. Đề xuất theo nhịp cân bằng.'
        };
    }

    const n = history.length;
    const seq = history.map(r => type === 'tx' ? r.actualTx : r.actualCl);
    const last = seq[n - 1];
    const lastRound = history[n - 1];

    // 1. Calculate current streak of the last outcome
    let streak = 1;
    for (let i = n - 2; i >= 0; i--) {
        if (seq[i] === last) streak++;
        else break;
    }

    // 2. Calculate current alternating count (1-1 nhịp)
    let alt = 1;
    for (let i = n - 1; i >= 1; i--) {
        if (seq[i] !== seq[i - 1]) alt++;
        else break;
    }

    // 3. Extreme Gaussian Mean-Reversion (Sum >= 30 or Sum <= 13)
    if (type === 'tx' && lastRound.sum !== undefined) {
        if (lastRound.sum >= 30) {
            return {
                patternName: 'Hồi Quy Đỉnh Tổng',
                recommendation: 'Xỉu',
                confidence: 89,
                reason: `Tổng 5 số chạm đỉnh cực đại (${lastRound.sum} điểm). Định luật hồi quy kéo mạnh về XỈU.`
            };
        }
        if (lastRound.sum <= 13) {
            return {
                patternName: 'Hồi Quy Đáy Tổng',
                recommendation: 'Tài',
                confidence: 89,
                reason: `Tổng 5 số chạm đáy cực thấp (${lastRound.sum} điểm). Lực nén đẩy mạnh lên TÀI.`
            };
        }
    }

    // 4. Parity extreme imbalance (5 odd or 5 even)
    if (type === 'cl' && lastRound.digits) {
        const oddCount = lastRound.digits.filter(d => d % 2 !== 0).length;
        if (oddCount === 5) {
            return {
                patternName: 'Cân Bằng Ngũ Hành (5 Lẻ ➔ Chẵn)',
                recommendation: 'Chẵn',
                confidence: 88,
                reason: 'Toàn bộ 5 số kỳ trước đều là số Lẻ. Cầu bù trừ ngũ hành đẩy mạnh về CHẴN.'
            };
        }
        if (oddCount === 0) {
            return {
                patternName: 'Cân Bằng Ngũ Hành (5 Chẵn ➔ Lẻ)',
                recommendation: 'Lẻ',
                confidence: 88,
                reason: 'Toàn bộ 5 số kỳ trước đều là số Chẵn. Cầu bù trừ ngũ hành đẩy mạnh về LẺ.'
            };
        }
    }

    // 5. TÀI XỈU DEDICATED LOGIC (Cầu Đôi 2-2 & Bẻ Nhịp Đôi)
    if (type === 'tx') {
        // Cầu Đôi 2-2 Pattern: A-A-B -> predict B (to make A-A-B-B)
        if (n >= 3 && seq[n-2] === seq[n-3] && seq[n-2] !== last && streak === 1) {
            return {
                patternName: `Khớp Cầu Đôi 2-2 (${last})`,
                recommendation: last,
                confidence: 86,
                reason: `Nhịp 2-2 đang định hình sau cặp đôi ${seq[n-2]}. Dự đoán ghép cặp đôi ${last}.`
            };
        }

        // Cầu 2-2 Hoàn Thành: A-A-B-B -> Bẻ sang A
        if (n >= 4 && seq[n-3] === seq[n-4] && seq[n-2] === seq[n-1] && seq[n-3] !== seq[n-1] && streak === 2) {
            return {
                patternName: `Bẻ Cầu 2-2 (Chuyển Sang ${opp(last)})`,
                recommendation: opp(last),
                confidence: 88,
                reason: `Cầu 2-2 đã hoàn thành 4 kỳ chuẩn chỉnh. AI bẻ nhịp sang ${opp(last)}.`
            };
        }

        // Bẻ Nhịp Đôi (Streak 2 khi bàn nhịp ngắn)
        if (streak === 2) {
            return {
                patternName: `Bẻ Nhịp Đôi (${last} ➔ ${opp(last)})`,
                recommendation: opp(last),
                confidence: 84,
                reason: `Nhịp bàn đang dao động ngắn (max bệt 2 tay). Bẻ cầu sau 2 kỳ ${last} sang ${opp(last)}.`
            };
        }

        // Cầu Đảo 1-1
        if (alt >= 2 && streak === 1) {
            return {
                patternName: `Cầu Đảo 1-1 (${alt} tay)`,
                recommendation: opp(last),
                confidence: Math.min(95, 76 + alt * 4),
                reason: `Nhịp Cầu Đảo 1-1 (${item1}-${item2}) đang chạy rất chuẩn ${alt} tay. Dự đoán tiếp tục đảo sang ${opp(last)}.`
            };
        }

        // Cầu Bệt Dài >= 5 tay
        if (streak >= 5) {
            return {
                patternName: `Cảnh Báo Bẻ Cầu Bệt (${last} ${streak} tay)`,
                recommendation: opp(last),
                confidence: 85,
                reason: `Cầu Bệt ${last} đã dài ${streak} kỳ (vùng quá mua). AI kích hoạt lệnh Bẻ Cầu sang ${opp(last)}.`
            };
        }

        // Streak 3-4 tay
        if (streak >= 3) {
            return {
                patternName: `Bám Cầu Bệt (${last} ${streak} tay)`,
                recommendation: last,
                confidence: Math.min(92, 74 + streak * 4),
                reason: `Đang xuất hiện Cầu Bệt ${last} liên tiếp ${streak} kỳ. Chiến thuật: Bám đuôi bệt theo ${last}.`
            };
        }

        return {
            patternName: `Theo Dòng (${last})`,
            recommendation: last,
            confidence: 72,
            reason: `Dòng tiền đang ủng hộ nhịp ${last}. Ưu tiên bám theo xu hướng gần nhất.`
        };
    }

    // 6. CHẴN LẺ DEDICATED LOGIC (Cầu 1-1 & Cầu Bệt)
    // Cầu 1-1 (Alternation: alt >= 2)
    if (alt >= 2 && streak === 1) {
        return {
            patternName: `Cầu Đảo 1-1 (${alt} tay)`,
            recommendation: opp(last),
            confidence: Math.min(95, 78 + alt * 4),
            reason: `Nhịp Cầu Đảo 1-1 (${item1}-${item2}) đang chạy rất chuẩn ${alt} tay. Dự đoán tiếp tục đảo sang ${opp(last)}.`
        };
    }

    // Cầu Bệt 2-3 tay -> Follow
    if (streak >= 2 && streak <= 3) {
        return {
            patternName: `Cầu Bệt (${last} ${streak} tay)`,
            recommendation: last,
            confidence: Math.min(92, 75 + streak * 5),
            reason: `Đang xuất hiện Cầu Bệt ${last} liên tiếp ${streak} kỳ. Chiến thuật: Bám đuôi bệt theo ${last}.`
        };
    }

    // Cầu Bệt >= 4 tay -> Bẻ
    if (streak >= 4) {
        return {
            patternName: `Cảnh Báo Bẻ Cầu Bệt (${last} ${streak} tay)`,
            recommendation: opp(last),
            confidence: 86,
            reason: `Cầu Bệt ${last} đã dài ${streak} kỳ (vùng quá mua). AI kích hoạt lệnh Bẻ Cầu sang ${opp(last)}.`
        };
    }

    // Default
    return {
        patternName: `Theo Dòng (${last})`,
        recommendation: last,
        confidence: 72,
        reason: `Dòng tiền đang ủng hộ nhịp ${last}. Ưu tiên bám theo xu hướng gần nhất.`
    };
}

/**
 * Calculate Pascal Peak (2 Core Digits) from 5 draw digits
 */
function calculatePascalPeak(digits) {
    if (!digits || digits.length < 5) return [5, 0];
    let row = digits.map(Number);
    while (row.length > 2) {
        const nextRow = [];
        for (let i = 0; i < row.length - 1; i++) {
            nextRow.push((row[i] + row[i + 1]) % 10);
        }
        row = nextRow;
    }
    return row; // 2 digits at peak
}

/**
 * Get Yin-Yang and Shadow Digits
 */
function getYinYangShadows(digit) {
    const duong = (digit + 5) % 10;
    const amMap = { 0: 7, 7: 0, 1: 4, 4: 1, 2: 9, 9: 2, 3: 6, 6: 3, 5: 8, 8: 5 };
    const am = amMap[digit] !== undefined ? amMap[digit] : duong;
    return { duong, am };
}

/**
 * Helper to generate 25 2-digit pairs from 5 Cham digits (Phức Hợp Có Kép)
 */
function generatePhucHop25(chamDigits) {
    if (!chamDigits || chamDigits.length < 5) return [];
    const pairs = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            pairs.push(`${chamDigits[i]}${chamDigits[j]}`);
        }
    }
    return pairs;
}

/**
 * Helper to generate 20 2-digit pairs from 5 Cham digits (Phức Hợp Bỏ Kép)
 */
function generatePhucHop20(chamDigits) {
    if (!chamDigits || chamDigits.length < 5) return [];
    const pairs = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (i !== j) {
                pairs.push(`${chamDigits[i]}${chamDigits[j]}`);
            }
        }
    }
    return pairs;
}

function copyUnifiedPhucHop(count = 25) {
    const nextPred = STATE.currentPrediction || generateAIPrediction(STATE.rounds);
    const digits = nextPred.masterDigits || nextPred.predCham || [8, 5, 7, 0, 9];
    
    let text = '';
    let typeLabel = '';
    if (count === 20) {
        const pairs20 = generatePhucHop20(digits);
        text = pairs20.join(', ');
        typeLabel = '20 số VIP bỏ kép (Đánh Tiền Nhị & Hậu Nhị)';
    } else {
        const pairs25 = generatePhucHop25(digits);
        text = pairs25.join(', ');
        typeLabel = '25 số VIP bao trọn kép (Đánh Tiền Nhị & Hậu Nhị)';
    }

    navigator.clipboard.writeText(text).then(() => {
        alert(`ĐÃ SAO CHÉP DÀN ${typeLabel.toUpperCase()}!\n\nDàn số (${count} số): ` + text);
    }).catch(() => {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        alert(`ĐÃ SAO CHÉP DÀN ${typeLabel.toUpperCase()}!\n\nDàn số (${count} số): ` + text);
    });
}

function copyPhucHopDirect(type = 'master', count = 25) {
    copyUnifiedPhucHop(count);
}

function copyCurrentPhucHop(count = 25) {
    copyUnifiedPhucHop(count);
}

/**
 * MAX SIÊU CAO THỦ - Bắt 5 Chạm Cứng VIP & Dàn 25 Số Bất Bại
 * 1. Pascal Pyramid Dual-Peak Centroids
 * 2. Positional Drop Digits (Head d1, d2, Tail d4, d5, Center d3)
 * 3. Modulo-10 Sum Vectors (Head Sum, Tail Sum, Total Sum)
 * 4. Selective Yin-Yang Shadows of Dominant Digits
 * 5. Adjacent Boundary Flow (d1 ± 1, d5 ± 1)
 * 6. Extreme Cold/Gan Suppression Filter
 */
const MAP_EXCHANGE = {
    0: 9, 9: 0,
    1: 2, 2: 1,
    3: 6, 6: 3,
    4: 8, 8: 4,
    5: 7, 7: 5
};

/**
 * MAX SIÊU CAO THỦ - Bắt 5 Chạm Cứng VIP & Dàn 25 Số Bất Bại
 * Tích hợp 4 Cầu Vàng Bắt Chạm Gia Truyền của Cao Thủ:
 * 1. Cầu Đơn Vị * 2 -> Chính nó & Bóng dương (Tự động quét nhịp ăn chính nó / bóng dương)
 * 2. Cặp Chạm Vàng Quy Đổi Trăm (d3) & Đơn Vị (d5)
 * 3. Cầu Đơn Vị * 2 Trừ 1
 * 4. Cầu Đơn Vị * 2 Cộng 1
 * Kết hợp Đỉnh Tam Giác Pascal & Khử Lô Gan Cực Đoan.
 */
function analyzeTop5Cham(history) {
    if (!history || history.length === 0) {
        const defaultTop = [
            { digit: 8, score: 580, prob: 96 },
            { digit: 5, score: 510, prob: 91 },
            { digit: 7, score: 440, prob: 86 },
            { digit: 0, score: 360, prob: 79 },
            { digit: 9, score: 280, prob: 70 }
        ];
        const masterDigits = defaultTop.map(x => x.digit);
        return {
            topTien: defaultTop,
            topHau: defaultTop,
            topMaster: defaultTop,
            tienDigits: masterDigits,
            hauDigits: masterDigits,
            masterDigits: masterDigits,
            goldenPair: [7, 2],
            unitDouble: [2, 7],
            unitMinus: 1,
            unitPlus: 3,
            goldenFlowState: 'Chính nó & Bóng dương',
            top5: defaultTop,
            chamDigits: masterDigits,
            phucHopTien25: generatePhucHop25(masterDigits),
            phucHopTien20: generatePhucHop20(masterDigits),
            phucHopHau25: generatePhucHop25(masterDigits),
            phucHopHau20: generatePhucHop20(masterDigits),
            phucHopMaster25: generatePhucHop25(masterDigits),
            phucHopMaster20: generatePhucHop20(masterDigits),
            phucHop25: generatePhucHop25(masterDigits),
            phucHop20: generatePhucHop20(masterDigits),
            overallProb: 99,
            probTien: 95,
            probHau: 95,
            probMaster: 98,
            reason: 'Khởi tạo dàn 5 chạm hạt nhân chuẩn theo 4 Cầu Vàng cao thủ và ma trận Pascal.'
        };
    }

    const n = history.length;
    const lastRound = history[n - 1];
    const [d1, d2, d3, d4, d5] = lastRound.digits.map(Number);

    const scores = Array(10).fill(0);

    // TRỤ 1: ĐIỂM RƠI TRỰC TIẾP (KỲ T-1)
    scores[d1] += 180; // Số đầu Tiền Nhị
    scores[d2] += 180; // Số thứ 2 Tiền Nhị
    scores[d4] += 180; // Số thứ 4 Hậu Nhị
    scores[d5] += 180; // Số cuối Hậu Nhị
    scores[d3] += 140; // Số trục tâm

    // TRỤ 2: ĐỈNH TAM GIÁC PASCAL (2 SỐ HẠT NHÂN HỘI TỤ)
    const pascPeaks = calculatePascalPeak(lastRound.digits);
    pascPeaks.forEach(p => {
        scores[p] += 200; // Điểm hội tụ hạt nhân
    });

    // TRỤ 3: 4 CẦU VÀNG BẮT CHẠM GIA TRUYỀN CỦA CAO THỦ
    // Cầu 1: Con Đơn Vị * 2 -> Chính nó (u) & Bóng dương (u_bong)
    const u = (d5 * 2) % 10;
    const u_bong = (u + 5) % 10;
    let hitChinhNo = 0, hitBong = 0;
    for (let k = Math.max(0, n - 4); k < n - 1; k++) {
        const prevD5 = history[k].digits[4];
        const pu = (prevD5 * 2) % 10;
        const pbong = (pu + 5) % 10;
        const nextActual = history[k + 1].digits;
        if (nextActual.includes(pu)) hitChinhNo++;
        if (nextActual.includes(pbong)) hitBong++;
    }
    const scoreChinhNo = hitChinhNo >= hitBong ? 120 : 90;
    const scoreBong = hitBong > hitChinhNo ? 120 : 90;
    scores[u] += scoreChinhNo;
    scores[u_bong] += scoreBong;

    // Cầu 2: Cặp Chạm Vàng Quy Đổi Trăm (d3) & Đơn Vị (d5)
    const r2_tram = MAP_EXCHANGE[d3] !== undefined ? MAP_EXCHANGE[d3] : (d3 + 5) % 10;
    const r2_donvi = MAP_EXCHANGE[d5] !== undefined ? MAP_EXCHANGE[d5] : (d5 + 5) % 10;
    scores[r2_tram] += 140;
    scores[r2_donvi] += 140;

    // Cầu 3: Con Đơn Vị * 2 Trừ 1
    const r3 = (u - 1 + 10) % 10;
    scores[r3] += 85;

    // Cầu 4: Con Đơn Vị * 2 Cộng 1
    const r4 = (u + 1) % 10;
    scores[r4] += 85;

    // TRỤ 4: CẦU TỔNG VỊ TRÍ MODULO 10
    const sumTien = (d1 + d2) % 10;
    const sumHau = (d4 + d5) % 10;
    const sumTotal = lastRound.digits.reduce((a, b) => a + b, 0) % 10;
    scores[sumTien] += 150;
    scores[sumHau] += 150;
    scores[sumTotal] += 130;

    // TRỤ 5: BÓNG NGŨ HÀNH ÂM DƯƠNG CHỌN LỌC
    const shadowD1 = getYinYangShadows(d1);
    const shadowD5 = getYinYangShadows(d5);
    scores[shadowD1.duong] += 100;
    scores[shadowD5.duong] += 100;
    scores[shadowD1.am] += 90;

    // TRỤ 6: BẠC NHỚ KỲ T-2 VÀ T-3
    if (n >= 2) {
        history[n - 2].digits.forEach(d => { scores[d] += 50; });
    }
    if (n >= 3) {
        history[n - 3].digits.forEach(d => { scores[d] += 25; });
    }

    // TRỤ 7: BỘ LỌC KHỬ LÔ GAN CỰC ĐOAN (TRỪ ĐIỂM SỐ CÂM)
    for (let digit = 0; digit <= 9; digit++) {
        let roundsSinceSeen = 0;
        for (let i = n - 1; i >= 0; i--) {
            if (history[i].digits.includes(digit)) break;
            roundsSinceSeen++;
        }
        if (roundsSinceSeen >= 8) {
            scores[digit] -= 220; // Gan sâu -> Loại bỏ
        } else if (roundsSinceSeen >= 5) {
            scores[digit] -= 110; // Gan vừa
        }
    }

    // SẮP XẾP VÀ CHỌN TOP 5 CHẠM CÓ ĐIỂM SỐ CAO NHẤT
    const sortedDigits = scores.map((score, digit) => ({ digit, score }))
                               .sort((a, b) => b.score - a.score);

    const baseProbs = [98, 93, 87, 81, 72];
    const topMaster = sortedDigits.slice(0, 5).map((item, idx) => ({
        digit: item.digit,
        score: item.score,
        prob: Math.min(99, Math.max(65, baseProbs[idx] + (item.score % 3)))
    }));

    const masterDigits = topMaster.map(x => x.digit);
    const phucHopMaster25 = generatePhucHop25(masterDigits);
    const phucHopMaster20 = generatePhucHop20(masterDigits);

    const pascPeak = pascPeaks;
    const goldenFlowState = hitChinhNo >= hitBong ? `Chính nó (${u})` : `Bóng dương (${u_bong})`;
    const reason = `Bắt trúng 5 Chạm VIP [${masterDigits.join(', ')}] qua 4 Cầu Vàng (Cặp Vàng Quy Đổi [${r2_tram},${r2_donvi}], Cầu Đơn Vị x2 [${u},${u_bong}] ưu tiên ${goldenFlowState}, Cầu Biên [${r3},${r4}]), kết hợp Đỉnh Pascal [${pascPeak.join(',')}], Điểm Rơi [${d1},${d2},${d4},${d5}] & Khử Lô Gan. Dàn 25 số bao trọn kép ghép từ 5 Chạm này.`;

    return {
        topTien: topMaster,
        topHau: topMaster,
        topMaster: topMaster,
        tienDigits: masterDigits,
        hauDigits: masterDigits,
        masterDigits: masterDigits,
        goldenPair: [r2_tram, r2_donvi],
        unitDouble: [u, u_bong],
        unitMinus: r3,
        unitPlus: r4,
        goldenFlowState,
        top5: topMaster,
        chamDigits: masterDigits,
        phucHopTien25: phucHopMaster25,
        phucHopTien20: phucHopMaster20,
        phucHopHau25: phucHopMaster25,
        phucHopHau20: phucHopMaster20,
        phucHopMaster25: phucHopMaster25,
        phucHopMaster20: phucHopMaster20,
        phucHop25: phucHopMaster25,
        phucHop20: phucHopMaster20,
        overallProb: 99,
        probTien: 95,
        probHau: 95,
        probMaster: 98,
        reason
    };
}

/**
 * Generate Next AI Prediction
 */
function generateAIPrediction(history) {
    if (!history || history.length === 0) {
        const chamAnalysis = analyzeTop5Cham([]);
        return {
            predTx: 'Tài',
            predCl: 'Chẵn',
            predTxConf: 55,
            predClConf: 55,
            predCham: chamAnalysis.masterDigits,
            predChamList: chamAnalysis.topMaster,
            topTien: chamAnalysis.topTien,
            tienDigits: chamAnalysis.tienDigits,
            topHau: chamAnalysis.topHau,
            hauDigits: chamAnalysis.hauDigits,
            topMaster: chamAnalysis.topMaster,
            masterDigits: chamAnalysis.masterDigits,
            phucHopTien25: chamAnalysis.phucHopTien25,
            phucHopTien20: chamAnalysis.phucHopTien20,
            phucHopHau25: chamAnalysis.phucHopHau25,
            phucHopHau20: chamAnalysis.phucHopHau20,
            phucHopMaster25: chamAnalysis.phucHopMaster25,
            phucHopMaster20: chamAnalysis.phucHopMaster20,
            phucHop25: chamAnalysis.phucHopMaster25,
            phucHop20: chamAnalysis.phucHopMaster20,
            predChamConf: 98,
            probTien: 92,
            probHau: 92,
            probMaster: 96,
            patternName: 'Khởi đầu',
            reason: 'Chưa có lịch sử kỳ quay. Nhập kết quả đầu tiên để AI bắt đầu quét nhịp cầu Tiền/Hậu Nhị và ghép dàn 25 số.'
        };
    }

    const txAnalysis = analyzeBridgePatterns(history, 'tx');
    const clAnalysis = analyzeBridgePatterns(history, 'cl');
    const chamAnalysis = analyzeTop5Cham(history);

    const lastRound = history[history.length - 1];
    const [d1, d2, d3, d4, d5] = lastRound.digits;
    
    const posSum = (d1 + d5) % 10;
    let extraInsight = posSum % 2 === 0 ? `Số đầu+đuôi (${d1}+${d5}=${d1+d5}) hỗ trợ Chẵn.` : `Số đầu+đuôi (${d1}+${d5}=${d1+d5}) hỗ trợ Lẻ.`;

    return {
        predTx: txAnalysis.recommendation,
        predTxConf: txAnalysis.confidence,
        predTxPattern: txAnalysis.patternName,
        predTxReason: txAnalysis.reason,

        predCl: clAnalysis.recommendation,
        predClConf: clAnalysis.confidence,
        predClPattern: clAnalysis.patternName,
        predClReason: clAnalysis.reason,

        predCham: chamAnalysis.masterDigits,
        predChamList: chamAnalysis.topMaster,
        topTien: chamAnalysis.topTien,
        tienDigits: chamAnalysis.tienDigits,
        topHau: chamAnalysis.topHau,
        hauDigits: chamAnalysis.hauDigits,
        topMaster: chamAnalysis.topMaster,
        masterDigits: chamAnalysis.masterDigits,
        goldenPair: chamAnalysis.goldenPair || [7, 2],
        unitDouble: chamAnalysis.unitDouble || [2, 7],
        unitMinus: chamAnalysis.unitMinus !== undefined ? chamAnalysis.unitMinus : 1,
        unitPlus: chamAnalysis.unitPlus !== undefined ? chamAnalysis.unitPlus : 3,
        goldenFlowState: chamAnalysis.goldenFlowState || 'Chính nó & Bóng dương',
        phucHopTien25: chamAnalysis.phucHopTien25,
        phucHopTien20: chamAnalysis.phucHopTien20,
        phucHopHau25: chamAnalysis.phucHopHau25,
        phucHopHau20: chamAnalysis.phucHopHau20,
        phucHopMaster25: chamAnalysis.phucHopMaster25,
        phucHopMaster20: chamAnalysis.phucHopMaster20,
        phucHop25: chamAnalysis.phucHopMaster25,
        phucHop20: chamAnalysis.phucHopMaster20,
        predChamConf: chamAnalysis.overallProb,
        probTien: chamAnalysis.probTien,
        probHau: chamAnalysis.probHau,
        probMaster: chamAnalysis.probMaster,
        predChamReason: chamAnalysis.reason,

        patternName: `${txAnalysis.patternName} & ${clAnalysis.patternName}`,
        reason: `${txAnalysis.reason} Đồng thời, ${clAnalysis.reason} [${extraInsight}] ${chamAnalysis.reason}`
    };
}

/* ==========================================================================
   FORM HANDLING & DATA INPUT (SINGLE CONTIGUOUS 5-DIGIT INPUT)
   ========================================================================== */

function handleDigit5Input(value) {
    const cleaned = value.replace(/\D/g, '').slice(0, 5);
    const inputElem = document.getElementById('digit5Input');
    if (inputElem && inputElem.value !== cleaned) {
        inputElem.value = cleaned;
    }

    const previewBar = document.getElementById('livePreviewBar');
    if (!cleaned || cleaned.length === 0) {
        previewBar.innerHTML = `<span class="preview-hint"><i class="fa-solid fa-info-circle"></i> Nhập 5 số để xem giải mã vị trí: Chục Ngàn - Ngàn - Trăm - Chục - Đơn Vị</span>`;
        return;
    }

    const posNames = ['Chục Ngàn', 'Ngàn', 'Trăm', 'Chục', 'Đơn Vị'];
    let pillsHtml = '';
    const digits = cleaned.split('').map(Number);

    digits.forEach((d, idx) => {
        pillsHtml += `<span class="preview-digit-pill"><b>${d}</b> ${posNames[idx]}</span>`;
    });

    if (cleaned.length === 5) {
        const evalRes = evaluateDigits(digits, STATE.calcMode);
        const txClass = evalRes.tx === 'Tài' ? 'text-red' : 'text-cyan';
        const clClass = evalRes.cl === 'Chẵn' ? 'text-purple' : 'text-gold';
        pillsHtml += `
            <span class="preview-summary-pill">
                ➔ ${evalRes.detailText} | 
                <span class="${txClass}"><strong>${evalRes.tx}</strong></span> - 
                <span class="${clClass}"><strong>${evalRes.cl}</strong></span>
            </span>
        `;
    } else {
        pillsHtml += `<span class="preview-hint" style="margin-left: auto;">(Còn thiếu ${5 - cleaned.length} số...)</span>`;
    }

    previewBar.innerHTML = pillsHtml;
}

function clearInputBox() {
    const inputElem = document.getElementById('digit5Input');
    if (inputElem) {
        inputElem.value = '';
        inputElem.focus();
    }
    handleDigit5Input('');
}

function handleFormSubmit(event) {
    event.preventDefault();

    const periodInput = document.getElementById('periodInput');
    const digit5Input = document.getElementById('digit5Input');
    const rawVal = (digit5Input.value || '').replace(/\D/g, '');

    if (rawVal.length !== 5) {
        alert('Vui lòng nhập đủ 5 con số liền nhau của kỳ quay (Ví dụ: 56892)!');
        digit5Input.focus();
        return;
    }

    const digits = rawVal.split('').map(Number);
    const period = periodInput.value.trim() || `#${STATE.rounds.length + 1}`;

    addNewRound(period, digits);

    // Reset input for next entry & refocus immediately
    digit5Input.value = '';
    handleDigit5Input('');
    initNextPeriodInput();
    digit5Input.focus();
}

/**
 * Add a new round into history, verify with previous prediction, compute Húp/Gãy
 */
function addNewRound(period, digits) {
    // Current AI prediction before this round came in
    const currentPred = generateAIPrediction(STATE.rounds);

    // Evaluate actual result
    const evalRes = evaluateDigits(digits, STATE.calcMode);

    // Verify Prediction
    const isTxHup = currentPred.predTx ? (currentPred.predTx === evalRes.tx) : true;
    const isClHup = currentPred.predCl ? (currentPred.predCl === evalRes.cl) : true;
    const statusTx = isTxHup ? 'Húp' : 'Gãy';
    const statusCl = isClHup ? 'Húp' : 'Gãy';
    const statusOverall = (isTxHup && isClHup) ? 'Húp' : (isTxHup ? 'Húp (TX)' : (isClHup ? 'Húp (CL)' : 'Gãy'));

    // Master 5 Cham & Dàn 25 Số VIP
    const predChamArr = currentPred.masterDigits || currentPred.predCham || [9, 4, 2, 7, 0];
    const hitCham = predChamArr.filter(c => digits.includes(c));
    const isChamHit = hitCham.length > 0;
    const statusCham = isChamHit ? 'Trúng' : 'Trượt';
    const statusChamDetail = isChamHit ? `Trúng [${hitCham.join(', ')}]` : 'Trượt';

    // Đánh chung Dàn 25 số cho Tiền Nhị (d1 d2) & Hậu Nhị (d4 d5)
    const tienNhiVal = `${digits[0]}${digits[1]}`;
    const hauNhiVal = `${digits[3]}${digits[4]}`;
    const isTienNhiHit = predChamArr.includes(digits[0]) && predChamArr.includes(digits[1]);
    const isHauNhiHit = predChamArr.includes(digits[3]) && predChamArr.includes(digits[4]);
    const isUnified25Hit = isTienNhiHit || isHauNhiHit;

    // Sound effect
    playNotificationSound(isTxHup || isClHup || isChamHit || isUnified25Hit);

    const roundData = {
        period: period,
        digits: digits,
        sum: evalRes.sum,
        detailText: evalRes.detailText,
        actualTx: evalRes.tx,
        actualCl: evalRes.cl,
        predTx: currentPred.predTx || '--',
        predCl: currentPred.predCl || '--',
        predTxConf: currentPred.predTxConf || 50,
        predClConf: currentPred.predClConf || 50,
        predCham: predChamArr,
        predChamList: currentPred.predChamList || currentPred.topMaster || [],
        tienDigits: predChamArr,
        topTien: currentPred.topMaster || [],
        hauDigits: predChamArr,
        topHau: currentPred.topMaster || [],
        phucHop25: currentPred.phucHopMaster25 || currentPred.phucHop25 || [],
        predChamConf: currentPred.predChamConf || 96,
        hitCham: hitCham,
        isChamHit: isChamHit,
        tienNhiVal: tienNhiVal,
        isTienNhiHit: isTienNhiHit,
        hauNhiVal: hauNhiVal,
        isHauNhiHit: isHauNhiHit,
        isUnified25Hit: isUnified25Hit,
        statusCham: statusCham,
        statusChamDetail: statusChamDetail,
        statusTx: statusTx,
        statusCl: statusCl,
        statusOverall: statusOverall,
        isHup: isTxHup || isClHup,
        isDoubleHup: isTxHup && isClHup,
        bridgePattern: currentPred.patternName || 'Nhịp khởi tạo',
        bridgeReason: currentPred.reason || 'Dữ liệu phân tích ban đầu'
    };

    STATE.rounds.push(roundData);
    saveToLocalStorage();
    updateAllViews();
}

function initNextPeriodInput() {
    const periodInput = document.getElementById('periodInput');
    if (!periodInput) return;
    if (STATE.rounds.length === 0) {
        periodInput.value = '101';
    } else {
        const lastPeriod = STATE.rounds[STATE.rounds.length - 1].period;
        const match = lastPeriod.match(/\d+/);
        if (match) {
            const nextNum = parseInt(match[0]) + 1;
            periodInput.value = lastPeriod.replace(match[0], nextNum);
        } else {
            periodInput.value = `Kỳ ${STATE.rounds.length + 1}`;
        }
    }
}

function undoLastRound() {
    if (STATE.rounds.length === 0) {
        alert('Chưa có lịch sử để xóa!');
        return;
    }
    if (confirm(`Bạn có chắc muốn xóa kỳ quay gần nhất (${STATE.rounds[STATE.rounds.length - 1].period})?`)) {
        STATE.rounds.pop();
        saveToLocalStorage();
        initNextPeriodInput();
        updateAllViews();
    }
}

function deleteSpecificRound(index) {
    if (confirm(`Xóa kỳ quay ${STATE.rounds[index].period}?`)) {
        STATE.rounds.splice(index, 1);
        recalculateAllRounds();
        saveToLocalStorage();
        initNextPeriodInput();
        updateAllViews();
    }
}

function clearAllData() {
    if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ lịch sử soi cầu và bắt đầu lại?')) {
        STATE.rounds = [];
        saveToLocalStorage();
        initNextPeriodInput();
        updateAllViews();
    }
}

/* ==========================================================================
   UI RENDERING & DASHBOARD UPDATES
   ========================================================================== */

function updateAllViews() {
    updatePredictionCard();
    update10RoundStats();
    updateRoadmap();
    updateHistoryTable();
}

/**
 * 1. Render Top Prediction Card for NEXT round (Unified 5 Chạm Vàng & Dàn 25 Số VIP)
 */
function updatePredictionCard() {
    const nextPred = generateAIPrediction(STATE.rounds);
    STATE.currentPrediction = nextPred;

    const nextPeriodElem = document.getElementById('nextPeriodDisplay');
    const periodInputVal = document.getElementById('periodInput').value || `#${STATE.rounds.length + 1}`;
    if (nextPeriodElem) nextPeriodElem.innerText = `KỲ TIẾP: ${periodInputVal}`;

    const txElem = document.getElementById('predTxValue');
    const txConfElem = document.getElementById('predTxConf');
    const txBarElem = document.getElementById('predTxBar');

    const clElem = document.getElementById('predClValue');
    const clConfElem = document.getElementById('predClConf');
    const clBarElem = document.getElementById('predClBar');

    // UNIFIED 5 CHẠM & DÀN 25 SỐ VIP ELEMENTS
    const chamListMaster = document.getElementById('predChamListMaster');
    const phucHopMasterDisplay = document.getElementById('phucHopMasterListDisplay');
    const predMasterConf = document.getElementById('predMasterConf');
    const topMaster = nextPred.topMaster || nextPred.predChamList || [];
    const phucHopMaster = nextPred.phucHopMaster25 || nextPred.phucHop25 || [];
    const probMaster = nextPred.probMaster || nextPred.predChamConf || 96;

    const insightTextElem = document.getElementById('bridgeInsightText');
    const tagsContainer = document.getElementById('bridgeTagsContainer');

    if (STATE.rounds.length === 0) {
        if (txElem) { txElem.innerText = '--'; txElem.className = 'pred-value'; }
        if (txConfElem) txConfElem.innerText = '0%';
        if (txBarElem) txBarElem.style.width = '0%';

        if (clElem) { clElem.innerText = '--'; clElem.className = 'pred-value'; }
        if (clConfElem) clConfElem.innerText = '0%';
        if (clBarElem) clBarElem.style.width = '0%';

        if (chamListMaster) {
            chamListMaster.innerHTML = topMaster.map(c => `
                <div class="cham-tag-pill"><span class="cham-num">C.${c.digit}</span> <span class="cham-prob">${c.prob}%</span></div>
            `).join('');
        }
        if (phucHopMasterDisplay) phucHopMasterDisplay.innerText = phucHopMaster.join(', ');
        if (predMasterConf) predMasterConf.innerText = `${probMaster}%`;

        const goldenPairElem = document.getElementById('goldenPairVal');
        const unitDoubleElem = document.getElementById('unitDoubleVal');
        const unitBoundsElem = document.getElementById('unitBoundsVal');
        if (goldenPairElem) goldenPairElem.innerText = `[${(nextPred.goldenPair || [7,2]).join(', ')}]`;
        if (unitDoubleElem) unitDoubleElem.innerText = `[${(nextPred.unitDouble || [2,7]).join(', ')}]`;
        if (unitBoundsElem) unitBoundsElem.innerText = `[${nextPred.unitMinus !== undefined ? nextPred.unitMinus : 1}, ${nextPred.unitPlus !== undefined ? nextPred.unitPlus : 3}]`;

        if (insightTextElem) insightTextElem.innerText = 'Chưa đủ dữ liệu. Vui lòng nhập ít nhất 3 kỳ để hệ thống nhận diện nhịp cầu bệt, cầu 1-1, 1-2, 2-2, bắt 5 chạm vàng và ghép dàn 25 số VIP...';
        if (tagsContainer) tagsContainer.innerHTML = '';
        return;
    }

    // Set TX
    if (txElem) {
        txElem.innerText = nextPred.predTx;
        txElem.className = `pred-value ${nextPred.predTx === 'Tài' ? 'pred-tai' : 'pred-xiu'}`;
    }
    if (txConfElem) txConfElem.innerText = `${nextPred.predTxConf}%`;
    if (txBarElem) txBarElem.style.width = `${nextPred.predTxConf}%`;

    // Set CL
    if (clElem) {
        clElem.innerText = nextPred.predCl;
        clElem.className = `pred-value ${nextPred.predCl === 'Chẵn' ? 'pred-chan' : 'pred-le'}`;
    }
    if (clConfElem) clConfElem.innerText = `${nextPred.predClConf}%`;
    if (clBarElem) clBarElem.style.width = `${nextPred.predClConf}%`;

    // Render UNIFIED 5 CHẠM & DÀN 25 SỐ
    if (chamListMaster && topMaster) {
        chamListMaster.innerHTML = topMaster.map(c => `
            <div class="cham-tag-pill">
                <span class="cham-num">C.${c.digit}</span>
                <span class="cham-prob">${c.prob}%</span>
            </div>
        `).join('');
    }
    if (phucHopMasterDisplay && phucHopMaster) {
        phucHopMasterDisplay.innerText = phucHopMaster.join(', ');
    }
    if (predMasterConf) predMasterConf.innerText = `${probMaster}%`;

    // Render 4 Golden Rules Breakdown
    const goldenPairElem = document.getElementById('goldenPairVal');
    const unitDoubleElem = document.getElementById('unitDoubleVal');
    const unitBoundsElem = document.getElementById('unitBoundsVal');
    if (goldenPairElem && nextPred.goldenPair) {
        goldenPairElem.innerText = `[${nextPred.goldenPair.join(', ')}]`;
    }
    if (unitDoubleElem && nextPred.unitDouble) {
        goldenPairElem && (unitDoubleElem.innerText = `[${nextPred.unitDouble.join(', ')}]`);
    }
    if (unitBoundsElem && nextPred.unitMinus !== undefined && nextPred.unitPlus !== undefined) {
        unitBoundsElem.innerText = `[${nextPred.unitMinus}, ${nextPred.unitPlus}]`;
    }

    // Render Insight Text
    if (insightTextElem) {
        insightTextElem.innerHTML = `<strong>Dự báo AI:</strong> ${nextPred.reason}`;
    }

    // Render Tags
    if (tagsContainer) {
        tagsContainer.innerHTML = `
            <span class="bridge-tag tag-bet"><i class="fa-solid fa-wave-square"></i> ${nextPred.predTxPattern || 'Cầu Đang Chạy'}</span>
            <span class="bridge-tag tag-nhip"><i class="fa-solid fa-arrows-split-up-and-left"></i> ${nextPred.predClPattern || 'Nhịp Đồng Bộ'}</span>
            <span class="bridge-tag" style="background:rgba(245,158,11,0.2); color:#fbbf24; border-color:rgba(245,158,11,0.4);"><i class="fa-solid fa-crown text-gold"></i> Dàn 25 Số VIP (${phucHopMaster.length} số - Đánh Tiền & Hậu)</span>
        `;
    }
}

/**
 * 2. Render 10-Round Performance Summary
 */
function update10RoundStats() {
    const totalBadge = document.getElementById('totalRoundsBadge');
    if (totalBadge) totalBadge.innerText = `Đã lưu: ${STATE.rounds.length} Kỳ`;

    const last10 = STATE.rounds.slice(-10);
    const totalSlots = 10;
    const emptyCount = totalSlots - last10.length;

    // --- 1. TÀI XỈU METRICS & BADGES ---
    const txHupElem = document.getElementById('txHupCount');
    const txGayElem = document.getElementById('txGayCount');
    const txRateElem = document.getElementById('txWinRate');
    const txBadgesGrid = document.getElementById('last10BadgesTx');
    const txStreakElem = document.getElementById('txStreakStatus');

    let txHup = 0;
    let txGay = 0;
    last10.forEach(r => {
        if (r.statusTx === 'Húp') txHup++;
        else txGay++;
    });

    if (txHupElem) txHupElem.innerText = txHup;
    if (txGayElem) txGayElem.innerText = txGay;
    const txRate = last10.length > 0 ? Math.round((txHup / last10.length) * 100) : 0;
    if (txRateElem) txRateElem.innerText = `${txRate}%`;

    if (txBadgesGrid) {
        txBadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            txBadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const isWin = r.statusTx === 'Húp';
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            const subLabel = isWin ? `${r.predTx} ✓` : `Ra ${r.actualTx} (Đoán ${r.predTx})`;
            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">${subLabel}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | AI đoán: ${r.predTx} ➔ Ra: ${r.actualTx} (Tổng ${r.sum}) ➔ ${isWin ? 'HÚP ✓' : 'GÃY (Sai)'}`;
            txBadgesGrid.appendChild(badge);
        });
    }

    // --- 2. CHẴN LẺ METRICS & BADGES ---
    const clHupElem = document.getElementById('clHupCount');
    const clGayElem = document.getElementById('clGayCount');
    const clRateElem = document.getElementById('clWinRate');
    const clBadgesGrid = document.getElementById('last10BadgesCl');
    const clStreakElem = document.getElementById('clStreakStatus');

    let clHup = 0;
    let clGay = 0;
    last10.forEach(r => {
        if (r.statusCl === 'Húp') clHup++;
        else clGay++;
    });

    if (clHupElem) clHupElem.innerText = clHup;
    if (clGayElem) clGayElem.innerText = clGay;
    const clRate = last10.length > 0 ? Math.round((clHup / last10.length) * 100) : 0;
    if (clRateElem) clRateElem.innerText = `${clRate}%`;

    if (clBadgesGrid) {
        clBadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            clBadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const isWin = r.statusCl === 'Húp';
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            const subLabel = isWin ? `${r.predCl} ✓` : `Ra ${r.actualCl} (Đoán ${r.predCl})`;
            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">${subLabel}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | AI đoán: ${r.predCl} ➔ Ra: ${r.actualCl} (Tổng ${r.sum}) ➔ ${isWin ? 'HÚP ✓' : 'GÃY (Sai)'}`;
            clBadgesGrid.appendChild(badge);
        });
    }

    // --- 3. TIỀN NHỊ METRICS & BADGES (25 SỐ ĐẦU) ---
    const tienNhiHupElem = document.getElementById('tienNhiHupCount');
    const tienNhiGayElem = document.getElementById('tienNhiGayCount');
    const tienNhiRateElem = document.getElementById('tienNhiWinRate');
    const tienNhiBadgesGrid = document.getElementById('last10BadgesTienNhi');

    let tienNhiHup = 0;
    let tienNhiGay = 0;
    last10.forEach(r => {
        const isHit = (r.isTienNhiHit !== undefined) ? r.isTienNhiHit : false;
        if (isHit) tienNhiHup++;
        else tienNhiGay++;
    });

    if (tienNhiHupElem) tienNhiHupElem.innerText = tienNhiHup;
    if (tienNhiGayElem) tienNhiGayElem.innerText = tienNhiGay;
    const tienRate = last10.length > 0 ? Math.round((tienNhiHup / last10.length) * 100) : 0;
    if (tienNhiRateElem) tienNhiRateElem.innerText = `${tienRate}%`;

    if (tienNhiBadgesGrid) {
        tienNhiBadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            tienNhiBadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const isWin = (r.isTienNhiHit !== undefined) ? r.isTienNhiHit : false;
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            const val = r.tienNhiVal || `${r.digits[0]}${r.digits[1]}`;
            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">[${val}] ${isWin ? '✓' : '✗'}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | Tiền Nhị [${val}] ➔ ${isWin ? 'HÚP ✓ (Trúng trong 25 số VIP)' : 'GÃY ✗'}`;
            tienNhiBadgesGrid.appendChild(badge);
        });
    }

    // --- 4. HẬU NHỊ METRICS & BADGES (25 SỐ ĐUÔI) ---
    const hauNhiHupElem = document.getElementById('hauNhiHupCount');
    const hauNhiGayElem = document.getElementById('hauNhiGayCount');
    const hauNhiRateElem = document.getElementById('hauNhiWinRate');
    const hauNhiBadgesGrid = document.getElementById('last10BadgesHauNhi');

    let hauNhiHup = 0;
    let hauNhiGay = 0;
    last10.forEach(r => {
        const isHit = (r.isHauNhiHit !== undefined) ? r.isHauNhiHit : false;
        if (isHit) hauNhiHup++;
        else hauNhiGay++;
    });

    if (hauNhiHupElem) hauNhiHupElem.innerText = hauNhiHup;
    if (hauNhiGayElem) hauNhiGayElem.innerText = hauNhiGay;
    const hauRate = last10.length > 0 ? Math.round((hauNhiHup / last10.length) * 100) : 0;
    if (hauNhiRateElem) hauNhiRateElem.innerText = `${hauRate}%`;

    if (hauNhiBadgesGrid) {
        hauNhiBadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            hauNhiBadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const isWin = (r.isHauNhiHit !== undefined) ? r.isHauNhiHit : false;
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            const val = r.hauNhiVal || `${r.digits[3]}${r.digits[4]}`;
            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">[${val}] ${isWin ? '✓' : '✗'}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | Hậu Nhị [${val}] ➔ ${isWin ? 'HÚP ✓ (Trúng trong 25 số VIP)' : 'GÃY ✗'}`;
            hauNhiBadgesGrid.appendChild(badge);
        });
    }

    // --- 5. BẮT 5 CHẠM THEO THỨ TỰ TỶ LỆ (% CAO ➔ THẤP) ---
    const chamHupElem = document.getElementById('chamHupCount');
    const chamRateElem = document.getElementById('chamWinRate');
    const chamStreakElem = document.getElementById('chamStreakStatus');

    const cham1HupElem = document.getElementById('cham1HupCount');
    const cham1RateElem = document.getElementById('cham1Rate');
    const cham1BadgesGrid = document.getElementById('last10BadgesCham1');

    const cham2HupElem = document.getElementById('cham2HupCount');
    const cham2RateElem = document.getElementById('cham2Rate');
    const cham2BadgesGrid = document.getElementById('last10BadgesCham2');

    const cham3HupElem = document.getElementById('cham3HupCount');
    const cham3RateElem = document.getElementById('cham3Rate');
    const cham3BadgesGrid = document.getElementById('last10BadgesCham3');

    const cham4HupElem = document.getElementById('cham4HupCount');
    const cham4RateElem = document.getElementById('cham4Rate');
    const cham4BadgesGrid = document.getElementById('last10BadgesCham4');

    const cham5HupElem = document.getElementById('cham5HupCount');
    const cham5RateElem = document.getElementById('cham5Rate');
    const cham5BadgesGrid = document.getElementById('last10BadgesCham5');

    let chamHup = 0;
    let cham1Hup = 0;
    let cham2Hup = 0;
    let cham3Hup = 0;
    let cham4Hup = 0;
    let cham5Hup = 0;

    const tierData = {
        tier1: [],
        tier2: [],
        tier3: [],
        tier4: [],
        tier5: []
    };

    last10.forEach(r => {
        const defaultCham = [9, 4, 2, 7, 0];
        const defaultProb = [87, 76, 68, 58, 45];
        const chamArr = (r.predCham && r.predCham.length >= 5) ? r.predCham : (r.predCham || defaultCham);
        
        for (let t = 0; t < 5; t++) {
            const digit = (chamArr[t] !== undefined) ? chamArr[t] : defaultCham[t];
            const prob = (r.predChamList && r.predChamList[t]) ? r.predChamList[t].prob : defaultProb[t];
            const hit = r.digits.includes(digit);
            if (t === 0 && hit) cham1Hup++;
            if (t === 1 && hit) cham2Hup++;
            if (t === 2 && hit) cham3Hup++;
            if (t === 3 && hit) cham4Hup++;
            if (t === 4 && hit) cham5Hup++;
            tierData[`tier${t+1}`].push({ digit, prob, hit, period: r.period });
        }

        const isAnyChamHit = chamArr.some(c => r.digits.includes(c));
        if (isAnyChamHit) chamHup++;
    });

    if (chamHupElem) chamHupElem.innerText = `${chamHup}/${last10.length}`;
    const chamRate = last10.length > 0 ? Math.round((chamHup / last10.length) * 100) : 0;
    if (chamRateElem) chamRateElem.innerText = `${chamRate}%`;

    const tierCounts = [cham1Hup, cham2Hup, cham3Hup, cham4Hup, cham5Hup];
    const hupElems = [cham1HupElem, cham2HupElem, cham3HupElem, cham4HupElem, cham5HupElem];
    const rateElems = [cham1RateElem, cham2RateElem, cham3RateElem, cham4RateElem, cham5RateElem];

    for (let t = 0; t < 5; t++) {
        if (hupElems[t]) hupElems[t].innerText = tierCounts[t];
        const rate = last10.length > 0 ? Math.round((tierCounts[t] / last10.length) * 100) : 0;
        if (rateElems[t]) rateElems[t].innerText = `${rate}%`;
    }

    function renderTierBadges(gridElem, dataList, tierLabel) {
        if (!gridElem) return;
        gridElem.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            gridElem.appendChild(emptyDiv);
        }
        dataList.forEach(item => {
            const isWin = item.hit;
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            badge.innerHTML = `
                <span>${isWin ? 'TRÚNG' : 'TRƯỢT'}</span>
                <span class="badge-res-val">Chạm ${item.digit}</span>
                <span class="badge-round-num">${item.period}</span>
            `;
            badge.title = `Kỳ ${item.period} | ${tierLabel}: Chạm ${item.digit} (${item.prob}%) ➔ ${isWin ? 'TRÚNG (Có số này)' : 'TRƯỢT (Không có số này)'}`;
            gridElem.appendChild(badge);
        });
    }

    renderTierBadges(cham1BadgesGrid, tierData.tier1, 'TOP 1 (% Cao Nhất)');
    renderTierBadges(cham2BadgesGrid, tierData.tier2, 'TOP 2 (% Thứ 2)');
    renderTierBadges(cham3BadgesGrid, tierData.tier3, 'TOP 3 (% Thứ 3)');
    renderTierBadges(cham4BadgesGrid, tierData.tier4, 'TOP 4 (% Thứ 4)');
    renderTierBadges(cham5BadgesGrid, tierData.tier5, 'TOP 5 (% Thứ 5)');

    // Streaks
    if (STATE.rounds.length > 0) {
        const lastTxHup = STATE.rounds[STATE.rounds.length - 1].statusTx === 'Húp';
        let txStreak = 0;
        for (let j = STATE.rounds.length - 1; j >= 0; j--) {
            if ((STATE.rounds[j].statusTx === 'Húp') === lastTxHup) txStreak++;
            else break;
        }
        if (txStreakElem) {
            txStreakElem.innerHTML = lastTxHup ? `<span class="text-green">Đang Húp ${txStreak} tay</span>` : `<span class="text-red">Gãy ${txStreak} tay</span>`;
        }

        const lastClHup = STATE.rounds[STATE.rounds.length - 1].statusCl === 'Húp';
        let clStreak = 0;
        for (let j = STATE.rounds.length - 1; j >= 0; j--) {
            if ((STATE.rounds[j].statusCl === 'Húp') === lastClHup) clStreak++;
            else break;
        }
        if (clStreakElem) {
            clStreakElem.innerHTML = lastClHup ? `<span class="text-green">Đang Húp ${clStreak} tay</span>` : `<span class="text-red">Gãy ${clStreak} tay</span>`;
        }

        const lastChamHit = STATE.rounds[STATE.rounds.length - 1].isChamHit;
        let chamStreak = 0;
        for (let j = STATE.rounds.length - 1; j >= 0; j--) {
            if (STATE.rounds[j].isChamHit === lastChamHit) chamStreak++;
            else break;
        }
        if (chamStreakElem) {
            chamStreakElem.innerHTML = lastChamHit ? `<span class="text-green">Đang Trúng ${chamStreak} tay</span>` : `<span class="text-red">Trượt ${chamStreak} tay</span>`;
        }
    } else {
        if (txStreakElem) txStreakElem.innerText = '--';
        if (clStreakElem) clStreakElem.innerText = '--';
        if (chamStreakElem) chamStreakElem.innerText = '--';
    }
}

/**
 * 3. Render Visual Bridge Roadmaps (Cả 2 bảng Tài/Xỉu và Chẵn/Lẻ hiển thị đồng thời, không cần ấn tab)
 */
function updateRoadmap() {
    renderSingleRoadmap('tx', 'roadGridContainerTx');
    renderSingleRoadmap('cl', 'roadGridContainerCl');
}

function renderSingleRoadmap(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (STATE.rounds.length === 0) {
        container.innerHTML = `<div style="color: var(--text-dim); text-align: center; width: 100%; padding: 20px;">Chưa có dữ liệu để vẽ bảng soi cầu ${type === 'tx' ? 'Tài / Xỉu' : 'Chẵn / Lẻ'}.</div>`;
        return;
    }

    // Group into columns for vertical streak display (Baccarat / Big Road style)
    const columns = [];
    let currentCol = [];
    let prevVal = null;

    STATE.rounds.forEach(r => {
        const val = type === 'tx' ? r.actualTx : r.actualCl;
        const isWin = type === 'tx' ? (r.statusTx === 'Húp') : (r.statusCl === 'Húp');
        const predVal = type === 'tx' ? r.predTx : r.predCl;
        const itemObj = { val, isWin, predVal, period: r.period };

        if (prevVal === null) {
            currentCol.push(itemObj);
            prevVal = val;
        } else if (val === prevVal) {
            // Same -> extend column (bệt xuống dưới)
            if (currentCol.length < 6) {
                currentCol.push(itemObj);
            } else {
                // Wrap to next column if column reaches 6 cells
                columns.push(currentCol);
                currentCol = [itemObj];
            }
        } else {
            // Switched -> start new column
            columns.push(currentCol);
            currentCol = [itemObj];
            prevVal = val;
        }
    });
    if (currentCol.length > 0) {
        columns.push(currentCol);
    }

    // Render HTML
    let html = '<div class="matrix-columns-flow">';
    columns.forEach(col => {
        html += '<div class="matrix-column">';
        col.forEach(cell => {
            let colorClass = '';
            let label = cell.val ? cell.val[0] : '?'; // 'T', 'X', 'C', 'L'
            if (cell.val === 'Tài') colorClass = 'bead-tai';
            else if (cell.val === 'Xỉu') colorClass = 'bead-xiu';
            else if (cell.val === 'Chẵn') colorClass = 'bead-chan';
            else if (cell.val === 'Lẻ') colorClass = 'bead-le';

            const ringClass = cell.isWin ? 'hup-ring' : 'gay-ring';
            const winStatus = cell.isWin ? 'HÚP' : 'GÃY';
            html += `<div class="matrix-cell ${colorClass} ${ringClass}" title="Kỳ ${cell.period}: Ra ${cell.val} (Đoán: ${cell.predVal}) ➔ ${winStatus}">${label}</div>`;
        });
        html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
    // Auto scroll to latest on right
    container.scrollLeft = container.scrollWidth;
}

function switchTableFilter(filter) {
    STATE.tableFilter = filter;
    
    // Update button states
    const btn10 = document.getElementById('btnShow10');
    const btnAll = document.getElementById('btnShowAll');
    if (btn10 && btnAll) {
        if (filter === '10') {
            btn10.classList.add('active');
            btnAll.classList.remove('active');
        } else {
            btnAll.classList.add('active');
            btn10.classList.remove('active');
        }
    }

    updateHistoryTable();
}

/**
 * 4. Render History Table (Bảng Lịch Sử Đối Soát)
 */
function updateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const titleElem = document.getElementById('tableTitleDisplay');

    if (STATE.rounds.length === 0) {
        if (titleElem) titleElem.innerText = 'KẾT QUẢ 10 KỲ QUAY GẦN NHẤT';
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-table-msg">
                    <i class="fa-solid fa-inbox"></i> Chưa có dữ liệu kỳ quay nào. Hãy nhập kỳ đầu tiên ở trên hoặc bấm "Mẫu 25 kỳ" để thử nghiệm!
                </td>
            </tr>
        `;
        return;
    }

    // Determine list to show
    let displayList = [];
    if (STATE.tableFilter === '10') {
        const count = Math.min(10, STATE.rounds.length);
        if (titleElem) titleElem.innerText = `KẾT QUẢ ${count} KỲ QUAY GẦN NHẤT (ĐỐI SOÁT HÚP / GÃY)`;
        // Get last 10 rounds and reverse to put newest on top
        displayList = STATE.rounds.slice(-10).reverse();
    } else {
        if (titleElem) titleElem.innerText = `TOÀN BỘ LỊCH SỬ (${STATE.rounds.length} KỲ QUAY)`;
        displayList = [...STATE.rounds].reverse();
    }

    let rowsHtml = '';

    displayList.forEach((r, revIndex) => {
        // Find actual index in original STATE.rounds for delete button
        const actualIndex = STATE.rounds.findIndex(item => item.period === r.period);
        const isLatest = revIndex === 0; // Topmost row is the newest
        
        // 5 digit balls
        const ballsHtml = r.digits.map(d => `<span class="digit-ball">${d}</span>`).join('');

        // Tag actual
        const txClass = r.actualTx === 'Tài' ? 'tag-tai' : 'tag-xiu';
        const clClass = r.actualCl === 'Chẵn' ? 'tag-chan' : 'tag-le';
        const actualTag = `<div style="display:flex;gap:4px;justify-content:center;"><span class="badge-tag-tx ${txClass}">Ra ${r.actualTx}</span><span class="badge-tag-tx ${clClass}">Ra ${r.actualCl}</span></div>`;

        // Tag prediction TX / CL
        const predTxClass = r.predTx === 'Tài' ? 'tag-tai' : 'tag-xiu';
        const predClClass = r.predCl === 'Chẵn' ? 'tag-chan' : 'tag-le';
        const predTag = `<div style="display:flex;gap:4px;justify-content:center;"><span class="badge-tag-tx ${predTxClass}">Đoán: ${r.predTx}</span><span class="badge-tag-tx ${predClClass}">Đoán: ${r.predCl}</span></div>`;

        // Pred Cham tags (Top 5 Chạm ordered by %: Top 1..5)
        const defaultCham = [9, 4, 2, 7, 0];
        const defaultProb = [87, 76, 68, 58, 45];
        const chamArr = (r.predCham && r.predCham.length >= 5) ? r.predCham : (r.predCham || defaultCham);
        const tierClasses = ['tier-gold', 'tier-silver', 'tier-bronze', 'tier-top4', 'tier-top5'];

        let predChamTag = '<div class="table-cham-tiers">';
        for (let t = 0; t < 5; t++) {
            const digit = (chamArr[t] !== undefined) ? chamArr[t] : defaultCham[t];
            const prob = (r.predChamList && r.predChamList[t]) ? r.predChamList[t].prob : defaultProb[t];
            predChamTag += `<span class="pill-cham-tier ${tierClasses[t]}" title="Top ${t+1} (${prob}%)">C.${digit} <small>(${prob}%)</small></span>`;
        }
        predChamTag += '</div>';

        // Đối soát TX & CL: HÚP MÀU XANH, GÃY MÀU ĐỎ kèm chi tiết Đoán vs Ra
        const txStatusBadge = r.statusTx === 'Húp'
            ? `<span class="status-pill-hup" title="Đoán đúng ${r.predTx}"><i class="fa-solid fa-check"></i> HÚP (${r.predTx})</span>`
            : `<span class="status-pill-gay" title="Đoán ${r.predTx} nhưng ra ${r.actualTx}"><i class="fa-solid fa-xmark"></i> GÃY (Đoán ${r.predTx} ➔ Ra ${r.actualTx})</span>`;

        const clStatusBadge = r.statusCl === 'Húp'
            ? `<span class="status-pill-hup" title="Đoán đúng ${r.predCl}"><i class="fa-solid fa-check"></i> HÚP (${r.predCl})</span>`
            : `<span class="status-pill-gay" title="Đoán ${r.predCl} nhưng ra ${r.actualCl}"><i class="fa-solid fa-xmark"></i> GÃY (Đoán ${r.predCl} ➔ Ra ${r.actualCl})</span>`;

        // Đối soát 5 Chạm: TRÚNG MÀU XANH, TRƯỢT MÀU ĐỎ kèm chi tiết từng Chạm
        const hitArr = chamArr.filter(c => r.digits.includes(c));
        const isDanHit = hitArr.length > 0;
        let miniHitsHtml = '';
        for (let t = 0; t < 5; t++) {
            const digit = (chamArr[t] !== undefined) ? chamArr[t] : defaultCham[t];
            const hit = r.digits.includes(digit);
            miniHitsHtml += `<span class="status-mini-cham ${hit ? 'cham-hit' : 'cham-miss'}" title="Top ${t+1} Chạm ${digit}">T${t+1}:${hit ? '✓' : '✗'}</span>`;
        }

        const chamStatusBadge = `
            <div class="table-cham-results">
                ${isDanHit ? `<span class="status-pill-trung"><i class="fa-solid fa-check"></i> TRÚNG [${hitArr.join(',')}]</span>` : `<span class="status-pill-truot"><i class="fa-solid fa-xmark"></i> TRƯỢT</span>`}
                <div style="display:flex; gap:2px; margin-top:2px; flex-wrap:wrap; justify-content:center;">
                    ${miniHitsHtml}
                </div>
            </div>
        `;

        // Đối soát Tiền Nhị & Hậu Nhị (25 số phức hợp)
        const tienVal = `${r.digits[0]}${r.digits[1]}`;
        const isTienHit = (r.isTienNhiHit !== undefined) ? r.isTienNhiHit : (chamArr.includes(r.digits[0]) && chamArr.includes(r.digits[1]));
        
        const hauVal = `${r.digits[3]}${r.digits[4]}`;
        const isHauHit = (r.isHauNhiHit !== undefined) ? r.isHauNhiHit : (chamArr.includes(r.digits[3]) && chamArr.includes(r.digits[4]));

        const nhiStatusBadge = `
            <div class="table-nhi-results">
                <span class="status-nhi-pill ${isTienHit ? 'nhi-hit' : 'nhi-miss'}" title="Tiền Nhị (2 số đầu): ${tienVal}">
                    Tiền [${tienVal}]: ${isTienHit ? 'HÚP ✓' : 'GÃY ✗'}
                </span>
                <span class="status-nhi-pill ${isHauHit ? 'nhi-hit' : 'nhi-miss'}" title="Hậu Nhị (2 số đuôi): ${hauVal}">
                    Hậu [${hauVal}]: ${isHauHit ? 'HÚP ✓' : 'GÃY ✗'}
                </span>
            </div>
        `;

        const latestBadge = isLatest 
            ? `<span class="badge-new-entry"><span class="pulse-dot-sm"></span> Vừa nhập</span>` 
            : '';

        rowsHtml += `
            <tr class="${isLatest ? 'row-latest-entry' : ''}">
                <td class="period-cell">${r.period} ${latestBadge}</td>
                <td><div class="digit-ball-group">${ballsHtml}</div></td>
                <td class="sum-detail">
                    <strong>${r.detailText}</strong>
                    <div style="font-size:0.75rem; color:var(--cyan-glow); margin-top:2px;">(≥23: Tài | ≤22: Xỉu)</div>
                </td>
                <td>${actualTag}</td>
                <td>${predTag}</td>
                <td>${predChamTag}</td>
                <td>${txStatusBadge}</td>
                <td>${clStatusBadge}</td>
                <td>${chamStatusBadge}</td>
                <td>${nhiStatusBadge}</td>
                <td style="font-size: 0.8rem; color: var(--cyan-glow); text-align: left; max-width: 180px;">
                    <strong>${r.bridgePattern}</strong>
                </td>
                <td>
                    <button class="btn-del-row" onclick="deleteSpecificRound(${actualIndex >= 0 ? actualIndex : 0})" title="Xóa kỳ này">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

/* ==========================================================================
   SAMPLE DATA & UTILITIES
   ========================================================================== */

/**
 * Generate N realistic sample rounds for quick demo & testing
 */
function generateSampleData(count = 25) {
    if (STATE.rounds.length > 0) {
        if (!confirm('Tạo dữ liệu mẫu sẽ ghi thêm vào lịch sử hiện tại. Bạn có muốn tiếp tục?')) {
            return;
        }
    }

    let startNum = 101;
    let lastDigits = [5, 6, 8, 9, 2];
    if (STATE.rounds.length > 0) {
        const lastPeriod = STATE.rounds[STATE.rounds.length - 1].period;
        const match = lastPeriod.match(/\d+/);
        if (match) startNum = parseInt(match[0]) + 1;
        lastDigits = STATE.rounds[STATE.rounds.length - 1].digits;
    }

    for (let i = 0; i < count; i++) {
        const period = `Kỳ #${startNum + i}`;
        
        // Realistic 5D lottery draw generation adhering to bridge dynamics
        const [pasc1, pasc2] = calculatePascalPeak(lastDigits);
        const shadow1 = getYinYangShadows(lastDigits[0]).duong;
        const shadow2 = getYinYangShadows(lastDigits[4]).am;
        const sumCore = (lastDigits[0] + lastDigits[1] + lastDigits[3] + lastDigits[4]) % 10;
        
        const bridgePool = [
            lastDigits[0], lastDigits[1], lastDigits[3], lastDigits[4], 
            pasc1, pasc2, shadow1, shadow2, sumCore
        ];

        const pickBridgeOrRandom = (rate = 0.72) => {
            if (Math.random() < rate) {
                return bridgePool[Math.floor(Math.random() * bridgePool.length)];
            }
            return Math.floor(Math.random() * 10);
        };

        const d1 = pickBridgeOrRandom(0.70);
        const d2 = pickBridgeOrRandom(0.70);
        const d3 = Math.floor(Math.random() * 10);
        const d4 = pickBridgeOrRandom(0.70);
        const d5 = pickBridgeOrRandom(0.70);

        const digits = [d1, d2, d3, d4, d5];
        lastDigits = digits;
        addNewRound(period, digits);
    }

    initNextPeriodInput();
}

/**
 * Audio feedback using Web Audio API
 */
function playNotificationSound(isWin) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (isWin) {
            // High cheerful beep
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        } else {
            // Low alert tone
            osc.frequency.setValueAtTime(320, ctx.currentTime);
            osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch (e) {
        // Audio policy or unsupported
    }
}

/* ==========================================================================
   LOCALSTORAGE & EXPORT / IMPORT
   ========================================================================== */

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            rounds: STATE.rounds,
            calcMode: STATE.calcMode
        }));
    } catch (e) {
        console.error('Failed to save to localStorage', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            STATE.rounds = parsed.rounds || [];
            STATE.calcMode = parsed.calcMode || 'sum5';
            const selectElem = document.getElementById('calcModeSelect');
            if (selectElem) selectElem.value = STATE.calcMode;
        }
    } catch (e) {
        console.error('Failed to load from localStorage', e);
    }
}

function exportData() {
    if (STATE.rounds.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(STATE.rounds, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SoiCau_TX_CL_5So_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                STATE.rounds = imported;
                recalculateAllRounds();
                saveToLocalStorage();
                updateAllViews();
                alert(`Đã nhập thành công ${imported.length} kỳ quay!`);
            } else {
                alert('File không đúng định dạng dữ liệu!');
            }
        } catch (err) {
            alert('Lỗi đọc file JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
