import json
import re
from pathlib import Path
import difflib

PRESETS_PATH = Path('backend/presets.json')
CSS_PATH = Path('frontend/public/fonts.css')

def get_valid_families():
    if not CSS_PATH.exists():
        print("CSS file missing!")
        return set()
    content = CSS_PATH.read_text(encoding='utf-8')
    matches = re.findall(r'font-family: "(.*?)"', content)
    return set(matches)

def normalize_name(name):
    # AdventPro -> Advent Pro
    # Advent-Pro -> Advent Pro
    # Advent_Pro -> Advent Pro
    s = name.replace("-", " ").replace("_", " ")
    # Insert space before capitals if missing
    s = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", s)
    return s.strip()

def main():
    valid = get_valid_families()
    print(f"Loaded {len(valid)} valid families from fonts.css")
    
    with open(PRESETS_PATH, 'r', encoding='utf-8') as f:
        presets = json.load(f)
        
    updated = 0
    unknowns = set()
    
    for k, p in presets.items():
        original = p.get('font', '')
        if not original: continue
        
        if original in valid:
            continue
            
        # Try normalizing
        candidate = normalize_name(original)
        
        # Specific fixes based on typical issues
        if candidate not in valid:
            # Try removing weights from metadata if any
            # e.g. "Advent Pro Bold" -> "Advent Pro"
            for w in ["Bold", "Regular", "Medium", "SemiBold", "Black", "Light", "ExtraBold"]:
                if candidate.endswith(" " + w):
                    candidate = candidate.replace(" " + w, "").strip()
        
        if candidate in valid:
            print(f"[{k}] Updating '{original}' -> '{candidate}'")
            p['font'] = candidate
            updated += 1
        else:
            # Fuzzy match?
            matches = difflib.get_close_matches(original, valid, n=1, cutoff=0.7)
            if matches:
                print(f"[{k}] Fuzzy update '{original}' -> '{matches[0]}'")
                p['font'] = matches[0]
                updated += 1
            else:
                unknowns.add(original)
                print(f"[{k}] WARNING: Could not find font for '{original}'")

    if updated > 0:
        print(f"\nWriting {updated} updates to presets.json...")
        with open(PRESETS_PATH, 'w', encoding='utf-8') as f:
            json.dump(presets, f, indent=2)
    else:
        print("\nNo updates made.")

    if unknowns:
        print(f"\nThere are {len(unknowns)} fonts referenced in presets that exist nowhere:")
        for u in sorted(list(unknowns)):
            print(f" - {u}")

if __name__ == "__main__":
    main()
