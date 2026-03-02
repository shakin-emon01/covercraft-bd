"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
const normalizeKey = (value) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
const parseArgs = () => {
    const args = process.argv.slice(2);
    const options = {
        dir: path_1.default.join(process.cwd(), 'uploads', 'logos', 'by-short-name'),
        dryRun: false,
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--dry-run') {
            options.dryRun = true;
            continue;
        }
        if (arg === '--dir') {
            const next = args[i + 1];
            if (!next) {
                throw new Error('Missing value for --dir');
            }
            options.dir = path_1.default.isAbsolute(next) ? next : path_1.default.join(process.cwd(), next);
            i += 1;
            continue;
        }
        if (arg === '--help' || arg === '-h') {
            console.log(`Usage:
  pnpm --filter server exec ts-node prisma/sync-logos.ts [--dry-run] [--dir <path>]

Defaults:
  --dir uploads/logos/by-short-name

Naming rule:
  Filename (without extension) must match University.shortName.
  Example: DU.png, NSU.jpg, BAUSTKhulna.webp
`);
            process.exit(0);
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
    return options;
};
const main = async () => {
    const options = parseArgs();
    const baseUrl = (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');
    if (!fs_1.default.existsSync(options.dir)) {
        throw new Error(`Logo folder not found: ${options.dir}`);
    }
    const fileNames = fs_1.default
        .readdirSync(options.dir)
        .filter((fileName) => {
        const absolutePath = path_1.default.join(options.dir, fileName);
        if (!fs_1.default.statSync(absolutePath).isFile())
            return false;
        const ext = path_1.default.extname(fileName).toLowerCase();
        return allowedExtensions.has(ext);
    });
    if (!fileNames.length) {
        console.log(`No logo files found in ${options.dir}`);
        return;
    }
    const keyToFile = new Map();
    const duplicateKeys = new Set();
    for (const fileName of fileNames) {
        const baseName = path_1.default.parse(fileName).name;
        const keys = [baseName.trim().toUpperCase(), normalizeKey(baseName)].filter(Boolean);
        for (const key of keys) {
            const existing = keyToFile.get(key);
            if (existing && existing !== fileName) {
                duplicateKeys.add(key);
            }
            else if (!existing) {
                keyToFile.set(key, fileName);
            }
        }
    }
    for (const duplicateKey of duplicateKeys) {
        keyToFile.delete(duplicateKey);
    }
    if (duplicateKeys.size > 0) {
        console.warn(`Skipped ambiguous keys due to duplicate filenames: ${[...duplicateKeys].join(', ')}`);
    }
    const universities = await prisma.university.findMany({
        select: {
            id: true,
            shortName: true,
            logoUrl: true,
        },
        orderBy: { shortName: 'asc' },
    });
    let updated = 0;
    let unchanged = 0;
    const missing = [];
    for (const university of universities) {
        const exactKey = university.shortName.trim().toUpperCase();
        const normalizedKey = normalizeKey(university.shortName);
        const matchedFile = keyToFile.get(exactKey) || keyToFile.get(normalizedKey);
        if (!matchedFile) {
            missing.push(university.shortName);
            continue;
        }
        const encodedFileName = encodeURIComponent(matchedFile);
        const nextLogoUrl = `${baseUrl}/uploads/logos/by-short-name/${encodedFileName}`;
        if (university.logoUrl === nextLogoUrl) {
            unchanged += 1;
            continue;
        }
        if (!options.dryRun) {
            await prisma.university.update({
                where: { id: university.id },
                data: { logoUrl: nextLogoUrl },
            });
        }
        updated += 1;
    }
    console.log(options.dryRun ? 'DRY RUN complete' : 'Logo sync complete');
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Folder: ${options.dir}`);
    console.log(`Universities updated: ${updated}`);
    console.log(`Universities unchanged: ${unchanged}`);
    console.log(`Universities missing logo file: ${missing.length}`);
    if (missing.length) {
        console.log(`Missing shortName list: ${missing.join(', ')}`);
    }
};
main()
    .catch((error) => {
    console.error('sync-logos failed:', error instanceof Error ? error.message : error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
