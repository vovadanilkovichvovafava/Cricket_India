// Generate a shareable prediction card image using Canvas API
// Returns a Blob (PNG) that can be shared via Web Share API

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350; // Instagram story ratio (4:5 close)

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generatePredictionImage({ match, prediction }) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  grad.addColorStop(0, '#0B1E4D');
  grad.addColorStop(0.4, '#162D6B');
  grad.addColorStop(1, '#0A1533');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Decorative circles
  ctx.fillStyle = 'rgba(255, 153, 51, 0.06)';
  ctx.beginPath();
  ctx.arc(900, 150, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(19, 136, 8, 0.05)';
  ctx.beginPath();
  ctx.arc(150, 1100, 180, 0, Math.PI * 2);
  ctx.fill();

  // Brand header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 52px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PreScoreAI', CARD_WIDTH / 2, 100);

  ctx.fillStyle = 'rgba(147, 197, 253, 0.6)';
  ctx.font = '28px Inter, system-ui, sans-serif';
  ctx.fillText('AI-Powered Prediction', CARD_WIDTH / 2, 145);

  // Tricolor bar
  const barY = 175;
  const barW = 200;
  const barH = 4;
  const barX = (CARD_WIDTH - barW) / 2;
  ctx.fillStyle = '#FF9933';
  roundRect(ctx, barX, barY, barW / 3, barH, 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(barX + barW / 3, barY, barW / 3, barH);
  ctx.fillStyle = '#138808';
  roundRect(ctx, barX + (barW * 2) / 3, barY, barW / 3, barH, 2);
  ctx.fill();

  // Match card
  const cardX = 60;
  const cardY = 220;
  const cardW = CARD_WIDTH - 120;
  const cardH = 300;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 30);
  ctx.stroke();

  // Team names
  const homeTeam = match.home || match.homeName || '?';
  const awayTeam = match.away || match.awayName || '?';

  // Team badges (circles with team codes)
  const badgeY = cardY + 100;
  const leftBadgeX = cardX + 160;
  const rightBadgeX = cardX + cardW - 160;

  // Home team badge
  ctx.fillStyle = match.homeColor || '#FF9933';
  ctx.beginPath();
  ctx.arc(leftBadgeX, badgeY, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(homeTeam, leftBadgeX, badgeY + 13);

  // VS
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = 'bold 32px Inter, system-ui, sans-serif';
  ctx.fillText('VS', CARD_WIDTH / 2, badgeY + 12);

  // Away team badge
  ctx.fillStyle = match.awayColor || '#138808';
  ctx.beginPath();
  ctx.arc(rightBadgeX, badgeY, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px Inter, system-ui, sans-serif';
  ctx.fillText(awayTeam, rightBadgeX, badgeY + 13);

  // Team full names
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '24px Inter, system-ui, sans-serif';
  ctx.fillText(match.homeName || homeTeam, leftBadgeX, badgeY + 85);
  ctx.fillText(match.awayName || awayTeam, rightBadgeX, badgeY + 85);

  // Match info (date, venue)
  const dt = match.date ? new Date(match.date) : null;
  if (dt) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '22px Inter, system-ui, sans-serif';
    const dateStr = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    ctx.fillText(`${dateStr} • ${timeStr} IST`, CARD_WIDTH / 2, cardY + cardH - 30);
  }

  // Prediction section
  const predY = cardY + cardH + 40;

  // "AI Prediction" label
  ctx.fillStyle = '#FF9933';
  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🤖 AI PREDICTION', CARD_WIDTH / 2, predY);

  // Winner
  const winnerY = predY + 80;
  const winnerTeam = prediction.winner || '?';
  const confidence = prediction.confidence || 0;

  // Winner badge (large)
  const winnerColor = winnerTeam === homeTeam ? (match.homeColor || '#FF9933') : (match.awayColor || '#138808');
  ctx.fillStyle = winnerColor;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2, winnerY, 70, 0, Math.PI * 2);
  ctx.fill();
  // Glow effect
  ctx.shadowColor = winnerColor;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2, winnerY, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px Inter, system-ui, sans-serif';
  ctx.fillText(winnerTeam, CARD_WIDTH / 2, winnerY + 16);

  // Confidence bar
  const barConfY = winnerY + 100;
  const barConfW = 500;
  const barConfX = (CARD_WIDTH - barConfW) / 2;
  const barConfH = 16;

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  roundRect(ctx, barConfX, barConfY, barConfW, barConfH, 8);
  ctx.fill();

  // Filled
  const fillW = (confidence / 100) * barConfW;
  const confGrad = ctx.createLinearGradient(barConfX, 0, barConfX + fillW, 0);
  confGrad.addColorStop(0, '#22C55E');
  confGrad.addColorStop(1, '#16A34A');
  ctx.fillStyle = confGrad;
  roundRect(ctx, barConfX, barConfY, fillW, barConfH, 8);
  ctx.fill();

  // Confidence text
  ctx.fillStyle = '#22C55E';
  ctx.font = 'bold 40px Inter, system-ui, sans-serif';
  ctx.fillText(`${confidence}% Confidence`, CARD_WIDTH / 2, barConfY + 65);

  // Key factors
  const factors = prediction.factors || [];
  const factorsY = barConfY + 110;

  if (factors.length > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.fillText('KEY FACTORS', CARD_WIDTH / 2, factorsY);

    const factorCardX = 80;
    const factorCardW = CARD_WIDTH - 160;
    const factorStartY = factorsY + 25;

    factors.slice(0, 4).forEach((f, i) => {
      const fy = factorStartY + i * 60;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      roundRect(ctx, factorCardX, fy, factorCardW, 50, 12);
      ctx.fill();

      const icon = f.impact === 'positive' ? '✅' : f.impact === 'negative' ? '❌' : '➖';
      ctx.font = '22px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(icon, factorCardX + 20, fy + 33);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '22px Inter, system-ui, sans-serif';
      ctx.fillText(f.label || '', factorCardX + 55, fy + 33);
      ctx.textAlign = 'center';
    });
  }

  // Value bets
  const valueBets = prediction.valueBets || [];
  const vbY = factorsY + (factors.length > 0 ? factors.slice(0, 4).length * 60 + 70 : 50);

  if (valueBets.length > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VALUE BETS', CARD_WIDTH / 2, vbY);

    valueBets.slice(0, 3).forEach((bet, i) => {
      const by = vbY + 20 + i * 55;

      ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
      roundRect(ctx, 80, by, CARD_WIDTH - 160, 45, 10);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '20px Inter, system-ui, sans-serif';
      ctx.fillText(bet.market || '', 100, by + 30);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.fillText(bet.pick || '', 350, by + 30);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText(`@${bet.odds}`, CARD_WIDTH - 100, by + 30);
      ctx.textAlign = 'center';
    });
  }

  // Footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '20px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('prescoreai.app • AI-Powered Cricket Predictions', CARD_WIDTH / 2, CARD_HEIGHT - 60);

  // Tricolor bar at bottom
  const btBarY = CARD_HEIGHT - 30;
  const btBarW = 150;
  const btBarX = (CARD_WIDTH - btBarW) / 2;
  ctx.fillStyle = '#FF9933';
  ctx.fillRect(btBarX, btBarY, btBarW / 3, 4);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(btBarX + btBarW / 3, btBarY, btBarW / 3, 4);
  ctx.fillStyle = '#138808';
  ctx.fillRect(btBarX + (btBarW * 2) / 3, btBarY, btBarW / 3, 4);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

export async function sharePrediction({ match, prediction }) {
  const blob = await generatePredictionImage({ match, prediction });

  if (!blob) return false;

  const file = new File([blob], 'prescoreai-prediction.png', { type: 'image/png' });

  // Web Share API (mobile-first)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `${match.home || '?'} vs ${match.away || '?'} — AI Prediction`,
        text: `🏏 AI predicts ${prediction.winner} with ${prediction.confidence}% confidence! Check out PreScoreAI for more predictions.`,
        files: [file],
      });
      return true;
    } catch {
      // User cancelled or error — fallback to download
    }
  }

  // Fallback: download the image
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prescoreai-prediction.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
