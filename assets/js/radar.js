/**
 * Draws a Radar Chart (Hexagon) on a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} profileStats - { color: {level, xp}, precision: {...}, etc }
 */
export function drawRadarChart(canvas, profileStats) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40; // padding

  const axes = [
    { id: 'color', label: 'Couleur' },
    { id: 'precision', label: 'Précision' },
    { id: 'typo', label: 'Typo' },
    { id: 'rhythm', label: 'Rythme' },
    { id: 'perception', label: 'Perception' }
  ];
  
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;

  ctx.clearRect(0, 0, width, height);

  // 1. Draw Grid (Web)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  for (let ring = 1; ring <= 5; ring++) {
    const r = (radius / 5) * ring;
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 2. Draw Axes Lines & Labels
  ctx.font = '12px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Draw label
    const labelX = centerX + Math.cos(angle) * (radius + 20);
    const labelY = centerY + Math.sin(angle) * (radius + 20);
    
    // Calculate level (default to 1 if no stats)
    const stat = profileStats ? profileStats[axes[i].id] : null;
    const level = stat ? stat.level : 1;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(axes[i].label, labelX, labelY - 8);
    
    ctx.fillStyle = '#34D399';
    ctx.fillText(`Lv.${level}`, labelX, labelY + 8);
  }

  // 3. Draw Player Polygon
  ctx.beginPath();
  let maxGlobalLevel = 10; // scale based on max expected level

  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const stat = profileStats ? profileStats[axes[i].id] : null;
    let level = stat ? stat.level : 1;
    
    // Cap at maxGlobalLevel for display purposes
    if (level > maxGlobalLevel) maxGlobalLevel = level + 2; 
    
    // Minimal display value is 10%
    const normalizedVal = Math.max(0.1, level / maxGlobalLevel);
    const r = radius * normalizedVal;
    
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Fill polygon
  ctx.fillStyle = 'rgba(52, 211, 153, 0.3)'; // accent color with alpha
  ctx.fill();
  
  // Outline polygon
  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw points
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const stat = profileStats ? profileStats[axes[i].id] : null;
    let level = stat ? stat.level : 1;
    const normalizedVal = Math.max(0.1, level / maxGlobalLevel);
    const r = radius * normalizedVal;
    
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();
  }
}
