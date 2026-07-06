import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
            results.push(fullPath);
        }
    });
    return results;
}

const files = walkDir('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Make containers fully responsive and leverage wider screens
    content = content.replace(/max-w-7xl mx-auto px-4 sm:px-6 lg:px-8/g, 'max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16');
    content = content.replace(/h-\[60vh\]/g, 'h-[50vh] md:h-[60vh] xl:h-[70vh]');
    content = content.replace(/h-\[40vh\]/g, 'h-[35vh] md:h-[40vh] xl:h-[50vh]');
    content = content.replace(/text-4xl md:text-6xl lg:text-7xl/g, 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl');
    
    fs.writeFileSync(file, content);
});
console.log('Update completed');
