const fs = require('node:fs');
const path = require('node:path');
function selectSide(side, repository = '') {
  if (!side) {
    const name = repository.split('/').pop().toLowerCase();
    if (name === 'phuongmai-tuananh') side = 'bride';
    else if (name === 'tuananh-phuongmai' || name === 'weding' || !name) side = 'groom';
  }
  if (!['groom', 'bride'].includes(side)) throw new Error('Set INVITATION_SIDE to groom or bride');
  return side;
}
function mergeConfig(base, override) {
  const result = {...base};
  for (const [key, value] of Object.entries(override)) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? mergeConfig(base[key] || {}, value) : value;
  }
  return result;
}
if (require.main === module) {
  const side = selectSide(process.env.INVITATION_SIDE, process.env.GITHUB_REPOSITORY);
  const root = path.resolve(__dirname, '../frontend');
  const configPath = path.join(root, 'config.json');
  const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(configPath, JSON.stringify(mergeConfig(read(configPath), read(path.join(root, 'configs', side + '.json'))), null, 2) + '\n');
  console.log('Invitation configuration: ' + side);
}
module.exports = {selectSide, mergeConfig};
