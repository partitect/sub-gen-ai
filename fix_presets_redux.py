import json
import os
import re
from pathlib import Path

# Path to presets
PRESETS_PATH = Path('backend/presets.json')
FONTS_DIR = Path('backend/fonts')

# Standard weights/cleaners
WEIGHT_KEYWORDS = [
    "thin", "hairline",
    "extralight", "extra light", "ultra light", "ultralight",
    "light",
    "regular", "normal", "book", "medium",
    "semibold", "semi bold", "demibold", "demi bold",
    "bold",
    "extrabold", "extra bold", "ultrabold", "ultra bold", "heavy",
    "black", "extrablack", "extra black"
]

# Words that might be left over at the end of a family name
ORPHAN_KEYWORDS = [
    "Extra", "Semi", "Ultra", "Demi", "Thin", "Light", "Bold", "Black", "Medium", "Regular", "Italic"
]

def load_valid_families():
    # We'll just define the logic here to match generate_css.py exactly
    # But since we can't easily import from backend.generate_css due to path issues without sys.path hacks,
    # we'll implement a simplified 'get_clean_name' and trust it matches the updated one, OR read the CSV/JSON if we had one.
    # Actually, we can just run the logic on the filenames again.
    
    families = set()
    for f in list(FONTS_DIR.glob("*.ttf")) + list(FONTS_DIR.glob("*.otf")):
        stem = f.stem
        # Simplified cleaning logic from updated generate_css.py
        clean = stem.replace("_", " ").replace("-", " ")
        clean = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", clean)
        clean = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", clean)
        
        # Remove patterns - sorted by length desc
        patterns = []
        for w in sorted(WEIGHT_KEYWORDS + ["italic", "oblique", "variablefont"], key=len, reverse=True):
             patterns.append(rf"\b{re.escape(w)}\b")

        temp = clean
        for p in patterns:
            temp = re.sub(p, "", temp, flags=re.I)
            
        temp = re.sub(r"\s+", " ", temp).strip()
        temp = temp.strip(" -_")
        
        if temp:
            families.add(temp)
            
    return families

def clean_preset_font(font_name):
    # Try to strip orphans from the end
    clean = font_name.strip()
    
    # Repeatedly strip known artifacts from the end
    changed = True
    while changed:
        changed = False
        parts = clean.split()
        if not parts: break
        
        last = parts[-1]
        # remove punctuation/digits from check? No, checking exact words.
        if last in ORPHAN_KEYWORDS:
            clean = " ".join(parts[:-1])
            changed = True
            
    return clean

def main():
    if not PRESETS_PATH.exists():
        print("Presets file not found!")
        return

    print("Loading valid families from fonts directory...")
    valid_families = load_valid_families()
    print(f"Found {len(valid_families)} valid families.")
    print(sorted(list(valid_families)))
    print("DEBUG: Bricolage families:", [f for f in valid_families if "Bricolage" in f])

    print("\nScanning presets...")
    with open(PRESETS_PATH, 'r', encoding='utf-8') as f:
        presets = json.load(f)

    updated_count = 0
    
    for key, p in presets.items():
        original_font = p.get('font', '')
        if "Bricolage" in original_font:
            print(f"DEBUG: Preset[{key}] uses '{original_font}'")
        if not original_font: continue
        
        if original_font in valid_families:
            continue
            
        # Mismatch found
        print(f"Mismatch in [{key}]: '{original_font}' not found in valid families.")
        
        # 1. Try cleaning orphans
        candidate = clean_preset_font(original_font)
        if candidate in valid_families:
            print(f"  -> Fixing to '{candidate}'")
            p['font'] = candidate
            updated_count += 1
            continue
            
        # 2. Try simple fallback/mapping if needed (e.g. Courier New replacement)
        # Add specific override for the Bricolage case if clean_preset_font failed
        # checking "Bricolage Grotesque 36pt Extra"
        # Split -> [Bricolage, Grotesque, 36pt, Extra]
        # Remove Extra -> "Bricolage Grotesque 36pt" -> Should match!
        
        print(f"  -> WARNING: Could not auto-fix '{original_font}'. Candidate was '{candidate}'")

    if updated_count > 0:
        print(f"\nUpdating {updated_count} presets...")
        with open(PRESETS_PATH, 'w', encoding='utf-8') as f:
            json.dump(presets, f, indent=2)
        print("Done.")
    else:
        print("\nNo presets needed updating.")

if __name__ == '__main__':
    main()
