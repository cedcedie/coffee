// Script to move HTML files to root and update paths
// Run: node move-to-root.js

const fs = require('fs');
const path = require('path');

const htmlDir = './html';
const rootDir = './';

// Files to move
const htmlFiles = ['index.html', 'menu.html', 'cart.html', 'checkout.html', 'orders.html', 'admin.html'];

console.log('Moving HTML files to root and updating paths...\n');

htmlFiles.forEach(file => {
    const sourcePath = path.join(htmlDir, file);
    const destPath = path.join(rootDir, file);
    
    if (fs.existsSync(sourcePath)) {
        // Read file
        let content = fs.readFileSync(sourcePath, 'utf8');
        
        // Update paths: ../css/ → css/, ../js/ → js/, ../Untitled.jpg → Untitled.jpg
        content = content.replace(/\.\.\/css\//g, 'css/');
        content = content.replace(/\.\.\/js\//g, 'js/');
        content = content.replace(/\.\.\/Untitled\.jpg/g, 'Untitled.jpg');
        
        // Update internal links: index.html → / or keep as is for same directory
        // (Most links should work as-is since they're relative)
        
        // Write to root
        fs.writeFileSync(destPath, content, 'utf8');
        console.log(`✓ Moved and updated: ${file}`);
    } else {
        console.log(`✗ Not found: ${file}`);
    }
});

console.log('\n✅ Done! HTML files are now in root with updated paths.');
console.log('You can now delete the html/ directory if you want.');
console.log('\nNext steps:');
console.log('1. Update vercel.json to remove rewrites (or delete it)');
console.log('2. Commit changes');
console.log('3. Deploy to Vercel');

