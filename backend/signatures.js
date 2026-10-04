function validSignature(data) {
  if (!data || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100 || !Array.isArray(data.strokes) || !data.strokes.length || data.strokes.length > 150) return false;
  let total = 0;
  for (const stroke of data.strokes) {
    if (!Array.isArray(stroke) || stroke.length < 1) return false;
    total += stroke.length;
    if (total > 5000) return false;
    for (const point of stroke) {
      if (!Array.isArray(point) || point.length !== 2 || !point.every(n => Number.isFinite(n) && n >= 0 && n <= 1)) return false;
    }
  }
  return true;
}
module.exports = {validSignature};
