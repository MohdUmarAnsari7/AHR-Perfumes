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

    // Make backgrounds light
    content = content.replace(/bg-black/g, 'bg-white');
    content = content.replace(/bg-dark-bg/g, 'bg-[#FAF9F6]');
    content = content.replace(/bg-dark-surface/g, 'bg-white');
    content = content.replace(/border-dark-border/g, 'border-gray-200');
    
    // Fix text colors (make them dark)
    content = content.replace(/text-white/g, 'text-gray-900');
    content = content.replace(/text-gray-400/g, 'text-gray-600');
    content = content.replace(/text-gray-300/g, 'text-gray-700');
    
    // Custom replacements for Footer from dark to that Ajmal brown
    // Custom Ajmal theme fixes
    
    fs.writeFileSync(file, content);
});
console.log('Theme conversion completed');
