const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const assetsDir = path.join(rootDir, 'assets');
const pagesDir = path.join(rootDir, 'pages');

// Create directories
[
  assetsDir,
  path.join(assetsDir, 'css'),
  path.join(assetsDir, 'js'),
  pagesDir
].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Move CSS and JS
const cssFiles = fs.readdirSync(path.join(rootDir, 'css'));
cssFiles.forEach(file => fs.renameSync(path.join(rootDir, 'css', file), path.join(assetsDir, 'css', file)));

const jsFiles = fs.readdirSync(path.join(rootDir, 'js'));
jsFiles.forEach(file => fs.renameSync(path.join(rootDir, 'js', file), path.join(assetsDir, 'js', file)));

// Process HTML files
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  let content = fs.readFileSync(path.join(rootDir, file), 'utf8');

  if (file === 'index.html') {
    // Update index.html
    content = content.replace(/href="css\//g, 'href="assets/css/');
    content = content.replace(/src="js\//g, 'src="assets/js/');
    content = content.replace(/from '\.\/js\//g, "from './assets/js/");
    
    // Links to other pages -> pages/
    const pages = htmlFiles.filter(f => f !== 'index.html');
    pages.forEach(p => {
      content = content.replace(new RegExp(`href="${p}"`, 'g'), `href="pages/${p}"`);
    });

    fs.writeFileSync(path.join(rootDir, file), content);
  } else {
    // Other pages -> move to pages/
    content = content.replace(/href="css\//g, 'href="../assets/css/');
    content = content.replace(/src="js\//g, 'src="../assets/js/');
    content = content.replace(/from '\.\/js\//g, "from '../assets/js/");
    
    // Back to index
    content = content.replace(/href="index\.html"/g, 'href="../index.html"');
    
    // Internal links remain relative (in pages folder)
    
    fs.writeFileSync(path.join(pagesDir, file), content);
    fs.unlinkSync(path.join(rootDir, file));
  }
});

// Remove old empty dirs
fs.rmdirSync(path.join(rootDir, 'css'));
fs.rmdirSync(path.join(rootDir, 'js'));

console.log('Refactoring complete!');
