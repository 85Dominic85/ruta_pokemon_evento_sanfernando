const sharp = require('sharp');
const fs = require('fs');

async function findPokeballs() {
    const img = sharp('public/images/mapa_ruta_pokeballs.png');
    const meta = await img.metadata();
    const W = meta.width, H = meta.height;

    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;

    function getPixel(x, y) {
        if (x < 0 || x >= W || y < 0 || y >= H) return [0, 0, 0];
        const idx = (y * W + x) * ch;
        return [data[idx], data[idx + 1], data[idx + 2]];
    }

    // Pokeball characteristics:
    // - Red top half: R>180, G<60, B<60
    // - White bottom half: R>220, G>220, B>220
    // - Dark outline ring: R<60, G<60, B<60
    // - Central dark band with white button
    // - Size roughly 30-60px diameter

    // Strategy: Look for the pokeball's characteristic center button
    // The button area has: dark ring around a white/light center point
    // Below that: white. Above that: red.

    const candidates = [];

    for (let cy = 25; cy < H - 25; cy += 2) {
        for (let cx = 25; cx < W - 25; cx += 2) {
            // Check center: should be dark (the band/button outline)
            const [cr, cg, cb] = getPixel(cx, cy);
            if (cr > 80 || cg > 80 || cb > 80) continue;

            // Count red pixels in a ring above (5-20px up)
            let redCount = 0;
            for (let dy = -20; dy <= -5; dy++) {
                for (let dx = -5; dx <= 5; dx++) {
                    const [r, g, b] = getPixel(cx + dx, cy + dy);
                    if (r > 180 && g < 70 && b < 70) redCount++;
                }
            }

            // Count white pixels in a ring below (5-20px down) 
            let whiteCount = 0;
            for (let dy = 5; dy <= 20; dy++) {
                for (let dx = -5; dx <= 5; dx++) {
                    const [r, g, b] = getPixel(cx + dx, cy + dy);
                    if (r > 210 && g > 210 && b > 210) whiteCount++;
                }
            }

            // Need significant amounts of both red above AND white below
            if (redCount >= 40 && whiteCount >= 40) {
                candidates.push({
                    cx, cy,
                    pctX: parseFloat((cx / W * 100).toFixed(2)),
                    pctY: parseFloat((cy / H * 100).toFixed(2)),
                    score: redCount + whiteCount,
                });
            }
        }
    }

    // Cluster nearby detections (within 35px)
    const clustered = [];
    const used = new Set();

    for (let i = 0; i < candidates.length; i++) {
        if (used.has(i)) continue;
        const group = [candidates[i]];
        used.add(i);

        for (let j = i + 1; j < candidates.length; j++) {
            if (used.has(j)) continue;
            // Check distance to ANY member of cluster
            const nearAny = group.some(g =>
                Math.abs(g.cx - candidates[j].cx) < 35 &&
                Math.abs(g.cy - candidates[j].cy) < 35
            );
            if (nearAny) {
                group.push(candidates[j]);
                used.add(j);
            }
        }

        // Weighted average center based on score
        const totalScore = group.reduce((s, g) => s + g.score, 0);
        const avgX = Math.round(group.reduce((s, g) => s + g.cx * g.score, 0) / totalScore);
        const avgY = Math.round(group.reduce((s, g) => s + g.cy * g.score, 0) / totalScore);

        clustered.push({
            cx: avgX,
            cy: avgY,
            pctX: parseFloat((avgX / W * 100).toFixed(2)),
            pctY: parseFloat((avgY / H * 100).toFixed(2)),
            bestScore: Math.max(...group.map(g => g.score)),
            detections: group.length,
        });
    }

    // Sort by x position (left to right)
    clustered.sort((a, b) => a.cx - b.cx);

    // Write JSON results
    fs.writeFileSync('scripts/pokeball_positions.json', JSON.stringify({
        imageWidth: W,
        imageHeight: H,
        count: clustered.length,
        pokeballs: clustered,
    }, null, 2));

    // Print compact summary
    process.stdout.write('IMG: ' + W + 'x' + H + ' Found: ' + clustered.length + '\n');
    clustered.forEach((c, i) => {
        process.stdout.write(i + ': px(' + c.cx + ',' + c.cy + ') %(' + c.pctX + ',' + c.pctY + ') s=' + c.bestScore + ' d=' + c.detections + '\n');
    });

    // Now generate a verification image with colored circles on the detected positions
    const outBuf = Buffer.from(data); // copy

    function drawCircle(buf, centerX, centerY, radius, r, g, b) {
        for (let angle = 0; angle < 360; angle += 0.5) {
            const rad = angle * Math.PI / 180;
            for (let rr = radius - 2; rr <= radius + 2; rr++) {
                const px = Math.round(centerX + rr * Math.cos(rad));
                const py = Math.round(centerY + rr * Math.sin(rad));
                if (px >= 0 && px < W && py >= 0 && py < H) {
                    const idx = (py * W + px) * ch;
                    buf[idx] = r;
                    buf[idx + 1] = g;
                    buf[idx + 2] = b;
                }
            }
        }
    }

    function drawCross(buf, centerX, centerY, size, r, g, b) {
        for (let d = -size; d <= size; d++) {
            for (let t = -2; t <= 2; t++) {
                // Horizontal
                const hx = centerX + d, hy = centerY + t;
                if (hx >= 0 && hx < W && hy >= 0 && hy < H) {
                    const idx = (hy * W + hx) * ch;
                    buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b;
                }
                // Vertical
                const vx = centerX + t, vy = centerY + d;
                if (vx >= 0 && vx < W && vy >= 0 && vy < H) {
                    const idx = (vy * W + vx) * ch;
                    buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b;
                }
            }
        }
    }

    clustered.forEach((c) => {
        drawCircle(outBuf, c.cx, c.cy, 30, 0, 255, 0);
        drawCross(outBuf, c.cx, c.cy, 15, 0, 255, 0);
    });

    await sharp(outBuf, { raw: { width: W, height: H, channels: ch } })
        .png()
        .toFile('scripts/pokeball_verification.png');

    process.stdout.write('Verification image saved to scripts/pokeball_verification.png\n');
}

findPokeballs().catch(e => console.error(e));
