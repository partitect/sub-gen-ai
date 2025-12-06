import re
from pathlib import Path

def main():
    css_path = Path('frontend/public/fonts.css')
    if not css_path.exists():
        print("fonts.css not found!")
        return
        
    content = css_path.read_text(encoding='utf-8')
    matches = re.findall(r'font-family: "(.*?)"', content)
    unique_families = sorted(list(set(matches)))
    
    suspicious_endings = [
        ' Extra', ' Semi', ' Ultra', ' Light', ' Bold', 
        ' Italic', ' Regular', ' Medium', ' Black', ' Thin'
    ]
    
    found_issues = []
    for fam in unique_families:
        for ending in suspicious_endings:
            if fam.endswith(ending):
                # Exception: "Extra" might be part of a legitimate name "Something Extra" but rare.
                # Usually it's a weight artifact.
                found_issues.append(fam)
                break
                
    if found_issues:
        print(f"Found {len(found_issues)} suspicious font families (names ending in weight keywords):")
        for f in found_issues:
            print(f"  - {f}")
    else:
        print("All font families look clean! No names end with weight keywords.")
        print(f"Checked {len(unique_families)} families.")

if __name__ == "__main__":
    main()
