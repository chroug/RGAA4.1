import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getManuelle() {
    try {
        const filePath = path.join(__dirname, 'criteres-manuels.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error("❌ Erreur lors de la lecture du fichier criteres-manuels.json", error);
        return[];
    }
}